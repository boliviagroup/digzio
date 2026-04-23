const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

const JWT_SECRET = process.env.JWT_SECRET || 'digzio-super-secret-jwt-key-2024-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'digzio-refresh-secret-2024';

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
  try {
    const { email, password, role = 'STUDENT', first_name, last_name, phone_number } = req.body;
    if (!email || !password || !first_name || !last_name) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const userCheck = await db.query('SELECT user_id FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      return res.status(400).json({ error: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    const normalizedRole = role.toUpperCase();
    const result = await db.query(
      `INSERT INTO users (email, password_hash, role, first_name, last_name, phone_number)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, email, role, first_name, last_name, kyc_status, created_at`,
      [email, password_hash, normalizedRole, first_name, last_name, phone_number || null]
    );
    const user = result.rows[0];
    const token = jwt.sign({ user_id: user.user_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refresh_token = jwt.sign({ user_id: user.user_id }, REFRESH_SECRET, { expiresIn: '30d' });
    res.status(201).json({ token, refresh_token, user: { user_id: user.user_id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, kyc_status: user.kyc_status } });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }
    const result = await db.query(
      'SELECT user_id, email, password_hash, role, first_name, last_name, kyc_status, is_active FROM users WHERE email = $1',
      [email]
    );
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const user = result.rows[0];
    if (!user.is_active) {
      return res.status(403).json({ error: 'Account is not active' });
    }
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    await db.query('UPDATE users SET last_login_at = NOW() WHERE user_id = $1', [user.user_id]);
    const token = jwt.sign({ user_id: user.user_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    const refresh_token = jwt.sign({ user_id: user.user_id }, REFRESH_SECRET, { expiresIn: '30d' });
    res.json({ token, refresh_token, user: { user_id: user.user_id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, kyc_status: user.kyc_status } });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/auth/refresh
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;
    if (!refresh_token) return res.status(400).json({ error: 'Refresh token required' });
    const decoded = jwt.verify(refresh_token, REFRESH_SECRET);
    const result = await db.query(
      'SELECT user_id, email, role, first_name, last_name, kyc_status, is_active FROM users WHERE user_id = $1',
      [decoded.user_id]
    );
    if (result.rows.length === 0 || !result.rows[0].is_active) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }
    const user = result.rows[0];
    const token = jwt.sign({ user_id: user.user_id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
    res.json({ token, user: { user_id: user.user_id, email: user.email, first_name: user.first_name, last_name: user.last_name, role: user.role, kyc_status: user.kyc_status } });
  } catch (err) {
    console.error('Refresh error:', err.message);
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// GET /api/v1/auth/me
router.get('/me', async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const result = await db.query(
      'SELECT user_id, email, role, first_name, last_name, kyc_status, phone_number, created_at FROM users WHERE user_id = $1',
      [decoded.user_id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Me error:', err.message);
    res.status(401).json({ error: 'Invalid or expired token' });
  }
});

module.exports = router;
