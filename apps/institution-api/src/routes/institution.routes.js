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

function requireProvider(req, res, next) {
  if (req.user.role !== 'PROVIDER') {
    return res.status(403).json({ error: 'Only providers can access this endpoint' });
  }
  next();
}

// ─── 0. Health check ────────────────────────────────────────────────────────
// GET /health
router.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'institution-api' });
});

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

// ─── 4. Get students linked to an institution ─────────────────────────────────
// GET /api/v1/institutions/:id/students
router.get('/:id/students', authenticate, requireInstitution, async (req, res) => {
  try {
    const students = await pool.query(
      `SELECT u.user_id, u.first_name, u.last_name, u.email, u.kyc_status,
              sp.student_number, sp.nsfas_status, sp.institution_id,
              sp.year_of_study, sp.qualification, sp.campus, sp.gender, sp.type_of_funding
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
              p.is_nsfas_accredited, p.total_beds, p.status, p.posa_code, p.posa_institution,
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
    const {
      institution_id, student_number, id_number, date_of_birth,
      year_of_study, qualification, campus, next_of_kin_phone, type_of_funding, gender
    } = req.body;
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
    // Upsert student profile with POSA fields
    const result = await pool.query(
      `INSERT INTO student_profiles (student_id, institution_id, student_number, id_number, date_of_birth,
         year_of_study, qualification, campus, next_of_kin_phone, type_of_funding, gender)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
       ON CONFLICT (student_id) DO UPDATE
         SET institution_id = $2, student_number = $3,
             year_of_study = COALESCE($6, student_profiles.year_of_study),
             qualification = COALESCE($7, student_profiles.qualification),
             campus = COALESCE($8, student_profiles.campus),
             next_of_kin_phone = COALESCE($9, student_profiles.next_of_kin_phone),
             type_of_funding = COALESCE($10, student_profiles.type_of_funding),
             gender = COALESCE($11, student_profiles.gender)
       RETURNING student_id, institution_id, student_number, nsfas_status,
                 year_of_study, qualification, campus, type_of_funding, gender`,
      [req.user.user_id, institution_id, student_number, safeIdNumber, date_of_birth || '2000-01-01',
       year_of_study || null, qualification || null, campus || null,
       next_of_kin_phone || null, type_of_funding || 'NSFAS', gender || null]
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
              sp.year_of_study, sp.qualification, sp.campus, sp.gender, sp.type_of_funding,
              sp.next_of_kin_phone, sp.id_number, sp.date_of_birth,
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

// ─── 8. POSA Occupancy List Generation ───────────────────────────────────────
// GET /api/v1/institutions/posa/generate?property_id=xxx&month=2025-03
// Returns JSON data for the UJ POSA occupancy list (Excel generation done client-side)
router.get('/posa/generate', authenticate, requireProvider, async (req, res) => {
  try {
    const { property_id, month } = req.query;
    if (!property_id) {
      return res.status(400).json({ error: 'property_id is required' });
    }

    // Verify property belongs to this provider
    const propCheck = await pool.query(
      `SELECT property_id, title, address_line_1, city, province, postal_code,
              total_beds, available_beds, base_price_monthly, is_nsfas_accredited,
              posa_code, posa_institution
       FROM properties WHERE property_id = $1 AND provider_id = $2`,
      [property_id, req.user.user_id]
    );
    if (propCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found or not owned by this provider' });
    }
    const property = propCheck.rows[0];

    // Get all active leases for this property with student POSA details
    const leaseMonth = month || new Date().toISOString().slice(0, 7); // YYYY-MM
    const students = await pool.query(
      `SELECT
         u.first_name, u.last_name, u.email, u.phone,
         sp.student_number, sp.id_number, sp.date_of_birth,
         sp.year_of_study, sp.qualification, sp.campus,
         sp.next_of_kin_phone, sp.type_of_funding, sp.gender,
         sp.nsfas_status,
         l.lease_id, l.start_date, l.end_date, l.monthly_rent, CASE WHEN l.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS lease_status,
         i.name AS institution_name
       FROM leases l
       JOIN users u ON l.student_id = u.user_id
       LEFT JOIN student_profiles sp ON sp.student_id = u.user_id
       LEFT JOIN institutions i ON sp.institution_id = i.institution_id
       WHERE l.property_id = $1
         AND l.is_active = true
       ORDER BY u.last_name ASC`,
      [property_id]
    );

    // Build POSA occupancy data in UJ format
    const occupancyList = students.rows.map((s, idx) => ({
      row_number: idx + 1,
      surname: s.last_name || '',
      first_name: s.first_name || '',
      id_number: s.id_number && !s.id_number.startsWith('UNSET') ? s.id_number : '',
      student_number: s.student_number || '',
      gender: s.gender || '',
      year_of_study: s.year_of_study || '',
      qualification: s.qualification || '',
      campus: s.campus || s.institution_name || '',
      type_of_funding: s.type_of_funding || 'NSFAS',
      nsfas_status: s.nsfas_status || 'PENDING',
      monthly_rent: s.monthly_rent || property.base_price_monthly,
      lease_start: s.start_date ? s.start_date.toISOString().slice(0, 10) : '',
      lease_end: s.end_date ? s.end_date.toISOString().slice(0, 10) : '',
      next_of_kin_phone: s.next_of_kin_phone || '',
      email: s.email || '',
      phone: s.phone || ''
    }));

    res.json({
      property: {
        property_id: property.property_id,
        title: property.title,
        address: `${property.address_line_1}, ${property.city}, ${property.province} ${property.postal_code}`,
        total_beds: property.total_beds,
        posa_code: property.posa_code || '',
        posa_institution: property.posa_institution || '',
        is_nsfas_accredited: property.is_nsfas_accredited
      },
      month: leaseMonth,
      occupancy_list: occupancyList,
      total_occupants: occupancyList.length,
      generated_at: new Date().toISOString()
    });
  } catch (err) {
    console.error('POSA generate error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 9. Update property POSA details ─────────────────────────────────────────
// PATCH /api/v1/institutions/posa/property/:property_id
router.patch('/posa/property/:property_id', authenticate, requireProvider, async (req, res) => {
  try {
    const { posa_code, posa_institution } = req.body;
    const result = await pool.query(
      `UPDATE properties
       SET posa_code = $1, posa_institution = $2
       WHERE property_id = $3 AND provider_id = $4
       RETURNING property_id, title, posa_code, posa_institution`,
      [posa_code || null, posa_institution || null, req.params.property_id, req.user.user_id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found or not owned by this provider' });
    }
    res.json({ property: result.rows[0] });
  } catch (err) {
    console.error('Update POSA property error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 10. Get all students for a provider (across all properties) ─────────────
// GET /api/v1/institutions/posa/provider-students?property_id=xxx
router.get('/posa/provider-students', authenticate, requireProvider, async (req, res) => {
  try {
    const { property_id } = req.query;
    let query, params;
    if (property_id) {
      query = `
        SELECT DISTINCT
          u.user_id, u.first_name, u.last_name, u.email, u.phone,
          sp.student_number, sp.id_number, sp.nsfas_status,
          sp.year_of_study, sp.qualification, sp.campus, sp.gender, sp.type_of_funding,
          l.lease_id, l.start_date, l.end_date, l.monthly_rent, CASE WHEN l.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS lease_status,
          l.signed_at, l.pdf_url,
          p.property_id, p.title AS property_title, p.posa_code, p.posa_institution
        FROM leases l
        JOIN users u ON l.student_id = u.user_id
        JOIN properties p ON l.property_id = p.property_id
        LEFT JOIN student_profiles sp ON sp.student_id = u.user_id
        WHERE p.property_id = $1 AND p.provider_id = $2
        ORDER BY u.last_name ASC`;
      params = [property_id, req.user.user_id];
    } else {
      query = `
        SELECT DISTINCT
          u.user_id, u.first_name, u.last_name, u.email, u.phone,
          sp.student_number, sp.id_number, sp.nsfas_status,
          sp.year_of_study, sp.qualification, sp.campus, sp.gender, sp.type_of_funding,
          l.lease_id, l.start_date, l.end_date, l.monthly_rent, CASE WHEN l.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS lease_status,
          l.signed_at, l.pdf_url,
          p.property_id, p.title AS property_title, p.posa_code, p.posa_institution
        FROM leases l
        JOIN users u ON l.student_id = u.user_id
        JOIN properties p ON l.property_id = p.property_id
        LEFT JOIN student_profiles sp ON sp.student_id = u.user_id
        WHERE p.provider_id = $1
        ORDER BY u.last_name ASC`;
      params = [req.user.user_id];
    }
    const result = await pool.query(query, params);
    res.json({ students: result.rows, count: result.rows.length });
  } catch (err) {
    console.error('Provider students error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── INSTITUTION DASHBOARD ENDPOINTS (must be before /:id to avoid route conflict) ─

// GET /api/v1/institutions/dashboard/overview
router.get('/dashboard/overview', authenticate, requireInstitution, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const instResult = await pool.query(
      `SELECT institution_id, name FROM institutions WHERE contact_email = (
         SELECT email FROM users WHERE user_id = $1
       ) LIMIT 1`, [userId]);
    const instId = instResult.rows[0]?.institution_id || null;
    const instName = instResult.rows[0]?.name || 'Your Institution';

    const studentsQ = instId
      ? await pool.query(`SELECT COUNT(*) FROM student_profiles WHERE institution_id = $1`, [instId])
      : await pool.query(`SELECT COUNT(*) FROM student_profiles`);
    const totalStudents = parseInt(studentsQ.rows[0].count);

    const housedQ = instId
      ? await pool.query(`SELECT COUNT(DISTINCT l.student_id) FROM leases l JOIN student_profiles sp ON sp.student_id = l.student_id WHERE sp.institution_id = $1 AND l.is_active = true`, [instId])
      : await pool.query(`SELECT COUNT(DISTINCT l.student_id) FROM leases l WHERE l.is_active = true`);
    const housedStudents = parseInt(housedQ.rows[0].count);

    const providersQ = await pool.query(`SELECT COUNT(DISTINCT provider_id) FROM properties WHERE status = 'ACTIVE'`);
    const activeProviders = parseInt(providersQ.rows[0].count);

    const posaQ = await pool.query(`SELECT COUNT(*) FROM properties WHERE posa_code IS NOT NULL AND status = 'ACTIVE'`);
    const posaProperties = parseInt(posaQ.rows[0].count);

    const propsQ = await pool.query(`SELECT COUNT(*) FROM properties WHERE status = 'ACTIVE'`);
    const totalProperties = parseInt(propsQ.rows[0].count);

    const nsfasQ = instId
      ? await pool.query(`SELECT COUNT(*) FROM student_profiles WHERE institution_id = $1 AND nsfas_status = 'APPROVED'`, [instId])
      : await pool.query(`SELECT COUNT(*) FROM student_profiles WHERE nsfas_status = 'APPROVED'`);
    const nsfasStudents = parseInt(nsfasQ.rows[0].count);

    const pendingQ = await pool.query(`SELECT COUNT(*) FROM leases WHERE status = 'PENDING'`);
    const pendingApplications = parseInt(pendingQ.rows[0].count);

    res.json({
      institution_id: instId,
      institution_name: instName,
      total_students: totalStudents,
      housed_students: housedStudents,
      active_providers: activeProviders,
      posa_properties: posaProperties,
      total_properties: totalProperties,
      nsfas_students: nsfasStudents,
      pending_applications: pendingApplications,
      housing_rate: totalStudents > 0 ? Math.round((housedStudents / totalStudents) * 100) : 0
    });
  } catch (err) {
    console.error('Dashboard overview error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// GET /api/v1/institutions/dashboard/students?page=1&limit=20&search=
router.get('/dashboard/students', authenticate, requireInstitution, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const search = req.query.search || '';
    const instResult = await pool.query(
      `SELECT institution_id FROM institutions WHERE contact_email = (
         SELECT email FROM users WHERE user_id = $1
       ) LIMIT 1`, [userId]);
    const instId = instResult.rows[0]?.institution_id || null;
    let query, countQuery, params, countParams;
    const searchVal = search ? `%${search}%` : null;
    if (instId) {
      if (searchVal) {
        params = [instId, limit, offset, searchVal];
        countParams = [instId, searchVal];
        query = `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, sp.student_number, sp.id_number, sp.nsfas_status, sp.year_of_study, sp.qualification, sp.campus, sp.gender, sp.type_of_funding, CASE WHEN l.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS lease_status, l.start_date, l.end_date, p.title AS property_title, p.suburb, p.city FROM student_profiles sp JOIN users u ON u.user_id = sp.student_id LEFT JOIN leases l ON l.student_id = u.user_id AND l.is_active = true LEFT JOIN properties p ON p.property_id = l.property_id WHERE sp.institution_id = $1 AND (u.first_name ILIKE $4 OR u.last_name ILIKE $4 OR sp.student_number ILIKE $4) ORDER BY u.last_name ASC LIMIT $2 OFFSET $3`;
        countQuery = `SELECT COUNT(*) FROM student_profiles sp JOIN users u ON u.user_id = sp.student_id WHERE sp.institution_id = $1 AND (u.first_name ILIKE $2 OR u.last_name ILIKE $2 OR sp.student_number ILIKE $2)`;
      } else {
        params = [instId, limit, offset];
        countParams = [instId];
        query = `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, sp.student_number, sp.id_number, sp.nsfas_status, sp.year_of_study, sp.qualification, sp.campus, sp.gender, sp.type_of_funding, CASE WHEN l.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS lease_status, l.start_date, l.end_date, p.title AS property_title, p.suburb, p.city FROM student_profiles sp JOIN users u ON u.user_id = sp.student_id LEFT JOIN leases l ON l.student_id = u.user_id AND l.is_active = true LEFT JOIN properties p ON p.property_id = l.property_id WHERE sp.institution_id = $1 ORDER BY u.last_name ASC LIMIT $2 OFFSET $3`;
        countQuery = `SELECT COUNT(*) FROM student_profiles sp WHERE sp.institution_id = $1`;
      }
    } else {
      if (searchVal) {
        params = [limit, offset, searchVal];
        countParams = [searchVal];
        query = `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, sp.student_number, sp.id_number, sp.nsfas_status, sp.year_of_study, sp.qualification, sp.campus, sp.gender, sp.type_of_funding, CASE WHEN l.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS lease_status, l.start_date, l.end_date, p.title AS property_title, p.suburb, p.city FROM student_profiles sp JOIN users u ON u.user_id = sp.student_id LEFT JOIN leases l ON l.student_id = u.user_id AND l.is_active = true LEFT JOIN properties p ON p.property_id = l.property_id WHERE (u.first_name ILIKE $3 OR u.last_name ILIKE $3 OR sp.student_number ILIKE $3) ORDER BY u.last_name ASC LIMIT $1 OFFSET $2`;
        countQuery = `SELECT COUNT(*) FROM student_profiles sp JOIN users u ON u.user_id = sp.student_id WHERE (u.first_name ILIKE $1 OR u.last_name ILIKE $1 OR sp.student_number ILIKE $1)`;
      } else {
        params = [limit, offset];
        countParams = [];
        query = `SELECT u.user_id, u.first_name, u.last_name, u.email, u.phone, sp.student_number, sp.id_number, sp.nsfas_status, sp.year_of_study, sp.qualification, sp.campus, sp.gender, sp.type_of_funding, CASE WHEN l.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS lease_status, l.start_date, l.end_date, p.title AS property_title, p.suburb, p.city FROM student_profiles sp JOIN users u ON u.user_id = sp.student_id LEFT JOIN leases l ON l.student_id = u.user_id AND l.is_active = true LEFT JOIN properties p ON p.property_id = l.property_id ORDER BY u.last_name ASC LIMIT $1 OFFSET $2`;
        countQuery = `SELECT COUNT(*) FROM student_profiles`;
      }
    }
    const [result, countResult] = await Promise.all([pool.query(query, params), pool.query(countQuery, countParams)]);
    res.json({ students: result.rows, total: parseInt(countResult.rows[0].count), page, limit, pages: Math.ceil(parseInt(countResult.rows[0].count) / limit) });
  } catch (err) {
    console.error('Dashboard students error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// GET /api/v1/institutions/dashboard/providers?page=1&limit=20
router.get('/dashboard/providers', authenticate, requireInstitution, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;
    const result = await pool.query(`
      SELECT u.user_id AS provider_id, u.first_name, u.last_name, u.email, u.phone,
        COUNT(p.property_id) AS total_properties,
        COUNT(CASE WHEN p.status = 'ACTIVE' THEN 1 END) AS active_properties,
        COUNT(CASE WHEN p.posa_code IS NOT NULL THEN 1 END) AS posa_properties,
        COUNT(CASE WHEN p.nsfas_accredited = true THEN 1 END) AS nsfas_properties,
        COUNT(CASE WHEN l.is_active = true THEN 1 END) AS active_leases,
        MAX(p.created_at) AS last_property_added
      FROM users u
      JOIN properties p ON p.provider_id = u.user_id
      LEFT JOIN leases l ON l.property_id = p.property_id AND l.is_active = true
      WHERE u.role = 'PROVIDER'
      GROUP BY u.user_id, u.first_name, u.last_name, u.email, u.phone
      ORDER BY active_properties DESC
      LIMIT $1 OFFSET $2`, [limit, offset]);
    const countResult = await pool.query(`SELECT COUNT(DISTINCT u.user_id) FROM users u JOIN properties p ON p.provider_id = u.user_id WHERE u.role = 'PROVIDER'`);
    res.json({ providers: result.rows, total: parseInt(countResult.rows[0].count), page, limit, pages: Math.ceil(parseInt(countResult.rows[0].count) / limit) });
  } catch (err) {
    console.error('Dashboard providers error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// GET /api/v1/institutions/dashboard/report
router.get('/dashboard/report', authenticate, requireInstitution, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const instResult = await pool.query(
      `SELECT institution_id, name FROM institutions WHERE contact_email = (
         SELECT email FROM users WHERE user_id = $1
       ) LIMIT 1`, [userId]);
    const instId = instResult.rows[0]?.institution_id || null;
    const instName = instResult.rows[0]?.name || 'Institution';
    const studentsQ = instId
      ? await pool.query(`SELECT u.first_name, u.last_name, u.email, sp.student_number, sp.id_number, sp.nsfas_status, sp.year_of_study, sp.qualification, sp.campus, sp.gender, CASE WHEN l.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS lease_status, l.start_date, l.end_date, l.monthly_rent, p.title AS property_title, p.address_line_1 AS address, p.suburb, p.city, p.province, p.posa_code, p.is_nsfas_accredited AS nsfas_accredited FROM student_profiles sp JOIN users u ON u.user_id = sp.student_id LEFT JOIN leases l ON l.student_id = u.user_id AND l.is_active = true LEFT JOIN properties p ON p.property_id = l.property_id WHERE sp.institution_id = $1 ORDER BY u.last_name ASC`, [instId])
      : await pool.query(`SELECT u.first_name, u.last_name, u.email, sp.student_number, sp.id_number, sp.nsfas_status, sp.year_of_study, sp.qualification, sp.campus, sp.gender, CASE WHEN l.is_active THEN 'ACTIVE' ELSE 'INACTIVE' END AS lease_status, l.start_date, l.end_date, l.monthly_rent, p.title AS property_title, p.address_line_1 AS address, p.suburb, p.city, p.province, p.posa_code, p.is_nsfas_accredited AS nsfas_accredited FROM student_profiles sp JOIN users u ON u.user_id = sp.student_id LEFT JOIN leases l ON l.student_id = u.user_id AND l.is_active = true LEFT JOIN properties p ON p.property_id = l.property_id ORDER BY u.last_name ASC`);
    res.json({ institution: instName, generated_at: new Date().toISOString(), report_period: new Date().getFullYear(), total_students: studentsQ.rows.length, students: studentsQ.rows });
  } catch (err) {
    console.error('Dashboard report error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// ─── 3. Get institution by ID (public) ───────────────────────────────────────
// GET /api/v1/institutions/:id  (MUST be last to avoid swallowing specific routes)
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


module.exports = router;
