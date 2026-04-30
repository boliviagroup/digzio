const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../utils/db');

const JWT_SECRET = process.env.JWT_SECRET || 'digzio-super-secret-jwt-key-2024-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const REFRESH_SECRET = process.env.REFRESH_SECRET || 'digzio-refresh-secret-2024';

// Helper: verify token and require ADMIN role
function requireAdmin(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (decoded.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Admin access only' });
      return null;
    }
    return decoded;
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

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
    // Prevent self-registration as ADMIN
    const normalizedRole = role.toUpperCase() === 'ADMIN' ? 'STUDENT' : role.toUpperCase();
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
    console.error("Register error:", err.message);
    if (err.code === "23505") {
      if (err.constraint && err.constraint.includes("phone_number")) {
        return res.status(400).json({ error: "Phone number already in use" });
      }
      return res.status(400).json({ error: "User already exists" });
    }
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

// GET /api/v1/auth/stats  — PUBLIC: returns live platform counts for homepage
router.get('/stats', async (req, res) => {
  try {
    const userStats = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE role = 'STUDENT') AS students,
        COUNT(*) FILTER (WHERE role = 'PROVIDER') AS providers,
        COUNT(*) FILTER (WHERE role = 'INSTITUTION') AS institutions
      FROM users
    `);
    const propStats = await db.query(`
      SELECT COUNT(*) AS active_properties FROM properties WHERE status = 'ACTIVE'
    `).catch(() => ({ rows: [{ active_properties: 0 }] }));
    res.set('Cache-Control', 'public, max-age=300'); // cache 5 min
    res.json({
      students: parseInt(userStats.rows[0].students, 10),
      providers: parseInt(userStats.rows[0].providers, 10),
      institutions: parseInt(userStats.rows[0].institutions, 10),
      active_properties: parseInt(propStats.rows[0].active_properties, 10),
    });
  } catch (err) {
    console.error('Public stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/v1/auth/admin/stats  — ADMIN only
router.get('/admin/stats', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const [userStats, propStats] = await Promise.all([
      db.query(`
        SELECT
          COUNT(*) FILTER (WHERE role = 'STUDENT') AS students,
          COUNT(*) FILTER (WHERE role = 'PROVIDER') AS providers,
          COUNT(*) FILTER (WHERE role = 'INSTITUTION') AS institutions,
          COUNT(*) AS total_users,
          COUNT(*) FILTER (WHERE kyc_status = 'VERIFIED') AS kyc_verified,
          COUNT(*) FILTER (WHERE kyc_status = 'PENDING') AS kyc_pending,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS new_this_week,
          COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '30 days') AS new_this_month
        FROM users
      `),
      db.query(`
        SELECT
          COUNT(*) AS total_properties,
          COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_properties,
          COUNT(*) FILTER (WHERE status = 'DRAFT') AS draft_properties,
          COUNT(*) FILTER (WHERE status = 'INACTIVE') AS inactive_properties,
          COUNT(*) FILTER (WHERE is_nsfas_accredited = true) AS nsfas_properties
        FROM properties
      `).catch(() => ({ rows: [{ total_properties: 0, active_properties: 0, draft_properties: 0, inactive_properties: 0, nsfas_properties: 0 }] }))
    ]);
    res.json({
      ...userStats.rows[0],
      total_properties:    parseInt(propStats.rows[0].total_properties, 10),
      active_properties:   parseInt(propStats.rows[0].active_properties, 10),
      draft_properties:    parseInt(propStats.rows[0].draft_properties, 10),
      inactive_properties: parseInt(propStats.rows[0].inactive_properties, 10),
      nsfas_properties:    parseInt(propStats.rows[0].nsfas_properties, 10),
    });
  } catch (err) {
    console.error('Admin stats error:', err.message);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// GET /api/v1/auth/admin/users  — ADMIN only
router.get('/admin/users', async (req, res) => {
  try {
    if (!requireAdmin(req, res)) return;
    const { role, limit = 50, offset = 0 } = req.query;
    let query = 'SELECT user_id, email, role, first_name, last_name, kyc_status, is_active, created_at FROM users';
    const params = [];
    if (role) { query += ' WHERE role = $1'; params.push(role.toUpperCase()); }
    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.query(query, params);
    res.json({ users: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Admin users error:', err.message);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// ─── Institution Endpoints ────────────────────────────────────────────────────
// Helper: verify token and require INSTITUTION or ADMIN role
function requireInstitution(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'No token provided' });
    return null;
  }
  try {
    const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
    if (decoded.role !== 'INSTITUTION' && decoded.role !== 'ADMIN') {
      res.status(403).json({ error: 'Forbidden: Institution access only' });
      return null;
    }
    return decoded;
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
    return null;
  }
}

// GET /api/v1/auth/institution/overview — Institution dashboard overview stats
router.get('/institution/overview', async (req, res) => {
  try {
    const decoded = requireInstitution(req, res);
    if (!decoded) return;
    const [userStats, propStats] = await Promise.all([
      db.query(`SELECT
        COUNT(*) FILTER (WHERE role = 'STUDENT') AS total_students,
        COUNT(*) FILTER (WHERE role = 'PROVIDER') AS total_providers,
        COUNT(*) FILTER (WHERE role = 'STUDENT' AND created_at >= NOW() - INTERVAL '30 days') AS new_students_month,
        COUNT(*) FILTER (WHERE role = 'STUDENT' AND kyc_status = 'VERIFIED') AS kyc_verified_students
        FROM users`),
      db.query(`SELECT
        COUNT(*) FILTER (WHERE status = 'ACTIVE') AS active_properties,
        COUNT(*) FILTER (WHERE is_nsfas_accredited = true AND status = 'ACTIVE') AS nsfas_properties
        FROM properties`),
    ]);
    res.json({
      students: parseInt(userStats.rows[0].total_students, 10),
      providers: parseInt(userStats.rows[0].total_providers, 10),
      new_students_month: parseInt(userStats.rows[0].new_students_month, 10),
      kyc_verified_students: parseInt(userStats.rows[0].kyc_verified_students, 10),
      active_properties: parseInt(propStats.rows[0].active_properties, 10),
      nsfas_properties: parseInt(propStats.rows[0].nsfas_properties, 10),
    });
  } catch (err) {
    console.error('Institution overview error:', err.message);
    res.status(500).json({ error: 'Failed to fetch overview' });
  }
});

// GET /api/v1/auth/institution/students — Paginated student registry
router.get('/institution/students', async (req, res) => {
  try {
    const decoded = requireInstitution(req, res);
    if (!decoded) return;
    const { limit = 50, offset = 0, search = '' } = req.query;
    const params = [];
    let whereExtra = '';
    if (search) {
      params.push(`%${search}%`);
      whereExtra = ` AND (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR u.email ILIKE $1)`;
    }
    params.push(parseInt(limit), parseInt(offset));
    const result = await db.query(`
      SELECT
        u.user_id, u.first_name, u.last_name, u.email, u.kyc_status, u.created_at,
        sp.student_number, sp.institution_name, sp.nsfas_status, sp.id_number,
        p.title AS property_title, p.city, p.province, l.is_active AS has_lease
      FROM users u
      LEFT JOIN student_profiles sp ON sp.user_id = u.user_id
      LEFT JOIN leases l ON l.student_id = u.user_id AND l.is_active = true
      LEFT JOIN properties p ON p.property_id = l.property_id
      WHERE u.role = 'STUDENT'${whereExtra}
      ORDER BY u.created_at DESC
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `, params);
    const countParams = search ? [`%${search}%`] : [];
    const countResult = await db.query(
      `SELECT COUNT(*) FROM users u WHERE u.role = 'STUDENT'${whereExtra}`,
      countParams
    );
    res.json({ students: result.rows, total: parseInt(countResult.rows[0].count, 10) });
  } catch (err) {
    console.error('Institution students error:', err.message);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/v1/auth/institution/providers — Provider compliance list
router.get('/institution/providers', async (req, res) => {
  try {
    const decoded = requireInstitution(req, res);
    if (!decoded) return;
    const result = await db.query(`
      SELECT
        u.user_id, u.first_name, u.last_name, u.email, u.kyc_status, u.created_at,
        COUNT(p.property_id) AS property_count,
        COUNT(p.property_id) FILTER (WHERE p.is_nsfas_accredited = true) AS nsfas_count,
        COUNT(p.property_id) FILTER (WHERE p.status = 'ACTIVE') AS active_count
      FROM users u
      LEFT JOIN properties p ON p.provider_id = u.user_id
      WHERE u.role = 'PROVIDER'
      GROUP BY u.user_id
      ORDER BY property_count DESC
    `);
    res.json({ providers: result.rows });
  } catch (err) {
    console.error('Institution providers error:', err.message);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

// POST /api/v1/auth/admin/reset-password — ADMIN only
router.post('/admin/reset-password', async (req, res) => {
  try {
    const auth = req.headers.authorization;
    if (!auth || !auth.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authorization required' });
    }
    const token = auth.slice(7);
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'digzio-super-secret-jwt-key-2024-production');
    } catch (e) {
      return res.status(401).json({ error: 'Invalid token' });
    }
    if (decoded.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    const { email, new_password } = req.body;
    if (!email || !new_password) {
      return res.status(400).json({ error: 'email and new_password are required' });
    }
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(new_password, salt);
    const result = await db.query(
      'UPDATE users SET password_hash = $1 WHERE email = $2 RETURNING user_id, email, role',
      [password_hash, email]
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({ message: 'Password reset successfully', user: result.rows[0] });
  } catch (err) {
    console.error('Admin reset password error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;

