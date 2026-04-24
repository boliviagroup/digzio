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

router.get('/health', (req, res) => res.json({ status: 'ok', service: 'application-service' }));

// POST /api/v1/applications — Submit application (student)
router.post('/', authenticate, async (req, res) => {
  try {
    const { property_id } = req.body;
    const student_id = req.user.user_id;
    if (!property_id) return res.status(400).json({ error: 'property_id is required' });

    const propCheck = await pool.query(
      `SELECT property_id, provider_id, title FROM properties WHERE property_id = $1 AND status = 'ACTIVE'`,
      [property_id]
    );
    if (propCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found or not available' });
    }

    const existing = await pool.query(
      `SELECT application_id FROM applications WHERE property_id = $1 AND student_id = $2`,
      [property_id, student_id]
    );
    if (existing.rows.length > 0) {
      return res.status(400).json({ error: 'You have already applied for this property' });
    }

    const result = await pool.query(
      `INSERT INTO applications (property_id, student_id, status)
       VALUES ($1, $2, 'SUBMITTED')
       RETURNING application_id, property_id, student_id, status, applied_at`,
      [property_id, student_id]
    );
    res.status(201).json({ ...result.rows[0], property_title: propCheck.rows[0].title });
  } catch (err) {
    console.error('Submit application error:', err.message);
    res.status(500).json({ error: 'Failed to submit application', detail: err.message });
  }
});

// GET /api/v1/applications/my — Get student's own applications
router.get('/my', authenticate, async (req, res) => {
  try {
    const student_id = req.user.user_id;
    const result = await pool.query(
      `SELECT a.application_id, a.property_id, a.status, a.applied_at, a.updated_at, a.provider_notes,
              p.title AS property_title, p.city, p.province, p.base_price_monthly, p.address_line_1
       FROM applications a
       JOIN properties p ON a.property_id = p.property_id
       WHERE a.student_id = $1
       ORDER BY a.applied_at DESC`,
      [student_id]
    );
    res.json({ applications: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Get applications error:', err.message);
    res.status(500).json({ error: 'Failed to fetch applications', detail: err.message });
  }
});

// GET /api/v1/applications/provider — Get all applications for provider's properties
router.get('/provider', authenticate, async (req, res) => {
  try {
    const provider_id = req.user.user_id;
    const { status, property_id } = req.query;

    const params = [provider_id];
    const whereClauses = ['p.provider_id = $1'];

    if (status) {
      params.push(status.toUpperCase());
      whereClauses.push(`a.status = $${params.length}`);
    }
    if (property_id) {
      params.push(property_id);
      whereClauses.push(`a.property_id = $${params.length}`);
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const result = await pool.query(
      `SELECT 
        a.application_id, a.status, a.applied_at, a.updated_at, a.provider_notes,
        p.property_id, p.title AS property_title, p.city, p.province,
        u.user_id AS student_id, u.first_name, u.last_name, u.email AS student_email,
        u.phone_number AS student_phone, u.kyc_status
       FROM applications a
       JOIN properties p ON a.property_id = p.property_id
       JOIN users u ON a.student_id = u.user_id
       ${whereStr}
       ORDER BY a.applied_at DESC`,
      params
    );
    res.json({ applications: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('Get provider applications error:', err.message);
    res.status(500).json({ error: 'Failed to fetch applications', detail: err.message });
  }
});

// GET /api/v1/applications/:id — Get single application
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, p.title AS property_title, p.city, p.province, p.base_price_monthly,
              u.first_name, u.last_name, u.email AS student_email, u.kyc_status
       FROM applications a
       JOIN properties p ON a.property_id = p.property_id
       JOIN users u ON a.student_id = u.user_id
       WHERE a.application_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get application error:', err.message);
    res.status(500).json({ error: 'Failed to fetch application', detail: err.message });
  }
});

// PATCH /api/v1/applications/:id/status — Update application status (provider only)
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status, provider_notes } = req.body;
    const provider_id = req.user.user_id;

    const valid = ['SUBMITTED', 'PENDING_NSFAS', 'APPROVED', 'REJECTED', 'LEASE_SIGNED'];
    if (!valid.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${valid.join(', ')}` });
    }

    // Verify the provider owns the property this application is for
    const ownerCheck = await pool.query(
      `SELECT a.application_id FROM applications a
       JOIN properties p ON a.property_id = p.property_id
       WHERE a.application_id = $1 AND p.provider_id = $2`,
      [req.params.id, provider_id]
    );

    // Allow if provider owns it, or if user is the student (for LEASE_SIGNED)
    const studentCheck = await pool.query(
      `SELECT application_id FROM applications WHERE application_id = $1 AND student_id = $2`,
      [req.params.id, provider_id]
    );

    if (ownerCheck.rows.length === 0 && studentCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Access denied: you do not own this application or property' });
    }

    const updates = ['status = $1', 'updated_at = NOW()'];
    const params = [status];

    if (provider_notes !== undefined) {
      params.push(provider_notes);
      updates.push(`provider_notes = $${params.length}`);
    }

    params.push(req.params.id);
    const result = await pool.query(
      `UPDATE applications SET ${updates.join(', ')} WHERE application_id = $${params.length} RETURNING *`,
      params
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update status error:', err.message);
    res.status(500).json({ error: 'Failed to update application', detail: err.message });
  }
});

module.exports = router;
