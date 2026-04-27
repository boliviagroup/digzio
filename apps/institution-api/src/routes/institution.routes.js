const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const crypto = require('crypto');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER || 'digzio_admin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

// JWT verification using native crypto
function verifyJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  const secret = process.env.JWT_SECRET || 'digzio-super-secret-jwt-key-2024-production';
  const sig = crypto.createHmac('sha256', secret)
    .update(parts[0] + '.' + parts[1]).digest('base64url');
  if (sig !== parts[2]) throw new Error('Invalid signature');
  if (payload.exp && Date.now() / 1000 > payload.exp) throw new Error('Token expired');
  return payload;
}

function authenticate(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authorization token required' });
  }
  try {
    req.user = verifyJWT(auth.slice(7));
    next();
  } catch (e) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function requireInstitution(req, res, next) {
  if (req.user.role !== 'INSTITUTION') {
    return res.status(403).json({ error: 'Only institutions can access this endpoint' });
  }
  next();
}

// ─── 1. Create institution record ────────────────────────────────────────────
// POST /api/v1/institutions/register
router.post('/register', authenticate, requireInstitution, async (req, res) => {
  try {
    const { name, contact_email, lat, lng } = req.body;
    if (!name || !contact_email) {
      return res.status(400).json({ error: 'Missing required fields: name, contact_email' });
    }
    // Check if institution with this name already exists
    const existing = await pool.query(
      `SELECT institution_id, name FROM institutions WHERE name = $1`, [name]
    );
    if (existing.rows.length > 0) {
      return res.status(200).json({
        message: 'Institution already exists',
        institution: existing.rows[0]
      });
    }
    // campus_location is required geometry - use provided lat/lng or default to Cape Town
    const latitude = lat || -33.9249;
    const longitude = lng || 18.4241;
    const result = await pool.query(
      `INSERT INTO institutions (name, campus_location, contact_email, is_active, created_at)
       VALUES ($1, ST_SetSRID(ST_MakePoint($2, $3), 4326), $4, TRUE, NOW())
       RETURNING institution_id, name, contact_email, is_active, created_at`,
      [name, longitude, latitude, contact_email]
    );
    res.status(201).json({ institution: result.rows[0] });
  } catch (err) {
    console.error('Create institution error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 2. List all institutions (public) ───────────────────────────────────────
// GET /api/v1/institutions/
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT institution_id, name, contact_email, is_active, created_at,
              ST_X(campus_location::geometry) AS longitude,
              ST_Y(campus_location::geometry) AS latitude
       FROM institutions WHERE is_active = TRUE ORDER BY name ASC`
    );
    res.json({ institutions: result.rows, count: result.rowCount });
  } catch (err) {
    console.error('List institutions error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 3. Get institution by ID (public) ───────────────────────────────────────
// GET /api/v1/institutions/:id
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT institution_id, name, contact_email, is_active, created_at,
              ST_X(campus_location::geometry) AS longitude,
              ST_Y(campus_location::geometry) AS latitude
       FROM institutions WHERE institution_id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    res.json({ institution: result.rows[0] });
  } catch (err) {
    console.error('Get institution error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 4. Get students linked to an institution ─────────────────────────────────
// GET /api/v1/institutions/:id/students
router.get('/:id/students', authenticate, requireInstitution, async (req, res) => {
  try {
    const students = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.kyc_status,
              sp.student_number, sp.nsfas_status, sp.institution_id
       FROM student_profiles sp
       JOIN users u ON sp.student_id = u.user_id
       WHERE sp.institution_id = $1
       ORDER BY u.last_name ASC`,
      [req.params.id]
    );
    res.json({ students: students.rows, count: students.rowCount });
  } catch (err) {
    console.error('Get students error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 5. Get properties near institution ──────────────────────────────────────
// GET /api/v1/institutions/:id/properties?radius_km=5
router.get('/:id/properties', async (req, res) => {
  try {
    const radius_km = parseFloat(req.query.radius_km) || 5;
    const result = await pool.query(
      `SELECT p.property_id, p.title, p.city, p.province, p.base_price_monthly,
              p.is_nsfas_accredited, p.total_beds, p.status,
              ROUND(CAST(ST_Distance(
                i.campus_location::geography,
                p.location::geography
              ) / 1000 AS numeric), 2) AS distance_km
       FROM institutions i
       JOIN properties p ON ST_DWithin(
         i.campus_location::geography,
         p.location::geography,
         $2 * 1000
       )
       WHERE i.institution_id = $1 AND p.status = 'ACTIVE'
       ORDER BY distance_km ASC
       LIMIT 20`,
      [req.params.id, radius_km]
    );
    res.json({ properties: result.rows, count: result.rowCount, radius_km });
  } catch (err) {
    console.error('Get nearby properties error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 6. Link student to institution (student self-service) ───────────────────
// POST /api/v1/institutions/students/link
router.post('/students/link', authenticate, async (req, res) => {
  try {
    const { institution_id, student_number, id_number, date_of_birth } = req.body;
    // Generate a unique placeholder id_number if not provided to avoid NOT NULL constraint
    const safeIdNumber = id_number || `UNSET-${req.user.user_id.replace(/-/g,'').substring(0,13)}`;
    if (!institution_id || !student_number) {
      return res.status(400).json({ error: 'Missing required fields: institution_id, student_number' });
    }
    // Verify institution exists
    const instCheck = await pool.query(
      `SELECT institution_id FROM institutions WHERE institution_id = $1`, [institution_id]
    );
    if (instCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    // Upsert student profile
    const result = await pool.query(
      `INSERT INTO student_profiles (student_id, institution_id, student_number, id_number, date_of_birth)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (student_id) DO UPDATE
         SET institution_id = $2, student_number = $3
       RETURNING student_id, institution_id, student_number, nsfas_status`,
      [req.user.user_id, institution_id, student_number, safeIdNumber, date_of_birth || '2000-01-01']
    );
    res.status(201).json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Link student error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 7. Get my student profile ────────────────────────────────────────────────
// GET /api/v1/institutions/students/me
router.get('/students/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT sp.student_id, sp.student_number, sp.nsfas_status, sp.institution_id,
              i.name AS institution_name, i.contact_email AS institution_email
       FROM student_profiles sp
       JOIN institutions i ON sp.institution_id = i.institution_id
       WHERE sp.student_id = $1`,
      [req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student profile not found' });
    }
    res.json({ profile: result.rows[0] });
  } catch (err) {
    console.error('Get student profile error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;
