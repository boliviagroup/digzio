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

// JWT verification using native crypto (no jsonwebtoken dependency)
function verifyJWT(token) {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('Invalid token');
  const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString());
  const secret = process.env.JWT_SECRET || 'digzio-secret-key';
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

// Helper: get institution_id for the current user
async function getInstitutionId(userId) {
  const r = await pool.query(
    `SELECT institution_id FROM institutions WHERE user_id = $1`, [userId]
  );
  return r.rows.length > 0 ? r.rows[0].institution_id : null;
}

// ─── 1. Create institution profile ──────────────────────────────────────────
router.post('/register', authenticate, requireInstitution, async (req, res) => {
  try {
    const { name, address_line_1, city, province, postal_code, contact_email, contact_phone, website_url } = req.body;
    if (!name || !city || !province) {
      return res.status(400).json({ error: 'Missing required fields: name, city, province' });
    }
    // Check if already registered
    const existing = await pool.query(
      `SELECT institution_id FROM institutions WHERE user_id = $1`, [req.user.user_id]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Institution profile already exists', institution_id: existing.rows[0].institution_id });
    }
    const result = await pool.query(
      `INSERT INTO institutions (user_id, name, address_line_1, city, province, postal_code, contact_email, contact_phone, website_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), NOW())
       RETURNING institution_id, name, city, province, contact_email, created_at`,
      [req.user.user_id, name, address_line_1, city, province, postal_code, contact_email, contact_phone, website_url]
    );
    res.status(201).json({ institution: result.rows[0] });
  } catch (err) {
    console.error('Create institution error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 2. Get institution profile ──────────────────────────────────────────────
router.get('/profile', authenticate, requireInstitution, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT institution_id, name, address_line_1, city, province, postal_code,
              contact_email, contact_phone, website_url, created_at
       FROM institutions WHERE user_id = $1`,
      [req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Institution profile not found. Please register your institution first via POST /api/v1/institutions/register' });
    }
    res.json({ institution: result.rows[0] });
  } catch (err) {
    console.error('Get institution profile error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 3. Get students linked to institution ───────────────────────────────────
router.get('/students', authenticate, requireInstitution, async (req, res) => {
  try {
    const institutionId = await getInstitutionId(req.user.user_id);
    if (!institutionId) {
      return res.status(404).json({ error: 'Institution profile not found' });
    }
    const students = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.kyc_status,
              si.student_number, si.verification_status, si.created_at AS linked_at
       FROM student_institutions si
       JOIN users u ON si.student_id = u.user_id
       WHERE si.institution_id = $1
       ORDER BY si.created_at DESC`,
      [institutionId]
    );
    res.json({ students: students.rows, count: students.rowCount });
  } catch (err) {
    console.error('Get students error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 4. Link student to institution (student self-registers) ─────────────────
router.post('/students/link', authenticate, async (req, res) => {
  try {
    const { institution_id, student_number } = req.body;
    if (!institution_id || !student_number) {
      return res.status(400).json({ error: 'Missing required fields: institution_id, student_number' });
    }
    // Check institution exists
    const instCheck = await pool.query(
      `SELECT institution_id FROM institutions WHERE institution_id = $1`, [institution_id]
    );
    if (instCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Institution not found' });
    }
    // Link student
    const result = await pool.query(
      `INSERT INTO student_institutions (student_id, institution_id, student_number, verification_status, created_at, updated_at)
       VALUES ($1, $2, $3, 'PENDING', NOW(), NOW())
       ON CONFLICT (student_id, institution_id) DO UPDATE SET student_number = $3, updated_at = NOW()
       RETURNING *`,
      [req.user.user_id, institution_id, student_number]
    );
    res.status(201).json({ link: result.rows[0] });
  } catch (err) {
    console.error('Link student error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 5. Verify student enrollment ────────────────────────────────────────────
router.patch('/students/:student_id/verify', authenticate, requireInstitution, async (req, res) => {
  try {
    const { student_id } = req.params;
    const { status } = req.body; // 'VERIFIED' or 'REJECTED'
    if (!['VERIFIED', 'REJECTED', 'PENDING'].includes(status)) {
      return res.status(400).json({ error: 'status must be VERIFIED, REJECTED, or PENDING' });
    }
    const institutionId = await getInstitutionId(req.user.user_id);
    if (!institutionId) return res.status(404).json({ error: 'Institution not found' });

    const result = await pool.query(
      `UPDATE student_institutions
       SET verification_status = $1, updated_at = NOW()
       WHERE student_id = $2 AND institution_id = $3
       RETURNING *`,
      [status, student_id, institutionId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student linkage not found' });
    }
    res.json({ link: result.rows[0] });
  } catch (err) {
    console.error('Verify student error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 6. Get accredited properties ────────────────────────────────────────────
router.get('/accreditations', authenticate, requireInstitution, async (req, res) => {
  try {
    const institutionId = await getInstitutionId(req.user.user_id);
    if (!institutionId) return res.status(404).json({ error: 'Institution not found' });

    const properties = await pool.query(
      `SELECT p.property_id, p.title, p.city, p.province, p.base_price_monthly,
              p.nsfas_accredited, p.status,
              ip.accreditation_status, ip.accredited_at
       FROM institution_properties ip
       JOIN properties p ON ip.property_id = p.property_id
       WHERE ip.institution_id = $1
       ORDER BY ip.accredited_at DESC`,
      [institutionId]
    );
    res.json({ accreditations: properties.rows, count: properties.rowCount });
  } catch (err) {
    console.error('Get accreditations error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 7. Accredit a property ───────────────────────────────────────────────────
router.post('/accreditations', authenticate, requireInstitution, async (req, res) => {
  try {
    const { property_id, accreditation_status } = req.body;
    if (!property_id) return res.status(400).json({ error: 'Missing required field: property_id' });

    const status = accreditation_status || 'PENDING';
    const institutionId = await getInstitutionId(req.user.user_id);
    if (!institutionId) return res.status(404).json({ error: 'Institution not found' });

    // Check property exists
    const propCheck = await pool.query(
      `SELECT property_id FROM properties WHERE property_id = $1`, [property_id]
    );
    if (propCheck.rows.length === 0) return res.status(404).json({ error: 'Property not found' });

    const result = await pool.query(
      `INSERT INTO institution_properties (institution_id, property_id, accreditation_status, accredited_at, created_at, updated_at)
       VALUES ($1, $2, $3, NOW(), NOW(), NOW())
       ON CONFLICT (institution_id, property_id) DO UPDATE
         SET accreditation_status = $3, accredited_at = NOW(), updated_at = NOW()
       RETURNING *`,
      [institutionId, property_id, status]
    );
    res.status(201).json({ accreditation: result.rows[0] });
  } catch (err) {
    console.error('Accredit property error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 8. List all institutions (public) ───────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT institution_id, name, city, province, contact_email, website_url, created_at
       FROM institutions ORDER BY name ASC`
    );
    res.json({ institutions: result.rows, count: result.rowCount });
  } catch (err) {
    console.error('List institutions error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

module.exports = router;
