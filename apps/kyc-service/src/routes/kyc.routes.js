const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'digzio_admin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'digzio',
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'digzio-super-secret-jwt-key-2024-production';

function verifyJWT(token, secret) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token format');
  const [h, p, s] = parts;
  const sig = Buffer.from(s, 'base64url');
  const expected = crypto.createHmac('sha256', secret).update(`${h}.${p}`).digest();
  if (!crypto.timingSafeEqual(sig, expected)) throw new Error('Invalid signature');
  const payload = JSON.parse(Buffer.from(p, 'base64url').toString());
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('Token expired');
  return payload;
}

const authenticate = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  try {
    req.user = verifyJWT(authHeader.split(' ')[1], JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'kyc-service' }));

// POST /api/v1/kyc/submit — Submit KYC (sets kyc_status to PENDING on users table)
router.post('/submit', authenticate, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const { id_number, id_type } = req.body;
    if (!id_number || !id_type) {
      return res.status(400).json({ error: 'id_number and id_type are required' });
    }
    // Update user kyc_status to PENDING
    const result = await pool.query(
      `UPDATE users SET kyc_status = 'PENDING', updated_at = NOW()
       WHERE user_id = $1
       RETURNING user_id, email, kyc_status, updated_at`,
      [user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.status(201).json({
      message: 'KYC submitted successfully. Your documents are under review.',
      user_id: result.rows[0].user_id,
      kyc_status: result.rows[0].kyc_status,
      submitted_at: result.rows[0].updated_at
    });
  } catch (err) {
    console.error('KYC submit error:', err.message);
    res.status(500).json({ error: 'Failed to submit KYC', detail: err.message });
  }
});

// GET /api/v1/kyc/status — Get KYC status
router.get('/status', authenticate, async (req, res) => {
  try {
    const user_id = req.user.user_id;
    const result = await pool.query(
      `SELECT user_id, email, first_name, last_name, kyc_status, updated_at
       FROM users WHERE user_id = $1`,
      [user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      kyc_status: result.rows[0].kyc_status,
      user_id: result.rows[0].user_id,
      email: result.rows[0].email
    });
  } catch (err) {
    console.error('KYC status error:', err.message);
    res.status(500).json({ error: 'Failed to get KYC status', detail: err.message });
  }
});

// GET /api/v1/kyc/admin/pending — Admin: list users with PENDING kyc_status
router.get('/admin/pending', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const result = await pool.query(
      `SELECT user_id, email, first_name, last_name, kyc_status, updated_at, created_at
       FROM users
       WHERE kyc_status = 'PENDING'
       ORDER BY updated_at ASC
       LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const countResult = await pool.query(
      `SELECT COUNT(*) FROM users WHERE kyc_status = 'PENDING'`
    );
    res.json({
      pending: result.rows,
      total: parseInt(countResult.rows[0].count, 10),
      limit,
      offset,
    });
  } catch (err) {
    console.error('KYC admin pending error:', err.message);
    res.status(500).json({ error: 'Failed to fetch KYC queue', detail: err.message });
  }
});

// POST /api/v1/kyc/admin/verify — Admin: approve or reject a user's KYC
router.post('/admin/verify', authenticate, async (req, res) => {
  try {
    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { user_id, action } = req.body;
    if (!user_id || !action) {
      return res.status(400).json({ error: 'user_id and action (VERIFIED|REJECTED) are required' });
    }
    const newStatus = action.toUpperCase() === 'VERIFIED' ? 'VERIFIED' : 'REJECTED';
    const result = await pool.query(
      `UPDATE users SET kyc_status = $1, updated_at = NOW()
       WHERE user_id = $2
       RETURNING user_id, email, kyc_status, updated_at`,
      [newStatus, user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: `KYC ${newStatus.toLowerCase()} successfully`, user: result.rows[0] });
  } catch (err) {
    console.error('KYC admin verify error:', err.message);
    res.status(500).json({ error: 'Failed to update KYC status', detail: err.message });
  }
});

module.exports = router;
