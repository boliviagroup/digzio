const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER || 'digzio_admin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

const mockAuth = (req, res, next) => {
  req.user = { id: req.headers['x-user-id'] || '1', role: req.headers['x-user-role'] || 'institution' };
  next();
};

// 1. Get institution profile
router.get('/profile', mockAuth, async (req, res) => {
  try {
    if (req.user.role !== 'institution') return res.status(403).json({ error: 'Only institutions can view this' });

    const result = await pool.query(
      `SELECT id, name, location, contact_email FROM institutions WHERE user_id = $1`,
      [req.user.id]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Institution not found' });
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch institution profile' });
  }
});

// 2. Get students linked to institution
router.get('/students', mockAuth, async (req, res) => {
  try {
    if (req.user.role !== 'institution') return res.status(403).json({ error: 'Only institutions can view this' });

    // First get institution id
    const instResult = await pool.query(`SELECT id FROM institutions WHERE user_id = $1`, [req.user.id]);
    if (instResult.rows.length === 0) return res.status(404).json({ error: 'Institution not found' });
    
    const institutionId = instResult.rows[0].id;

    // Get linked students
    const students = await pool.query(
      `SELECT u.id, u.first_name, u.last_name, u.email, u.kyc_status, si.student_number, si.verification_status
       FROM student_institutions si
       JOIN users u ON si.student_id = u.id
       WHERE si.institution_id = $1`,
      [institutionId]
    );

    res.json(students.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// 3. Verify student enrollment (Institution action)
router.patch('/students/:student_id/verify', mockAuth, async (req, res) => {
  try {
    if (req.user.role !== 'institution') return res.status(403).json({ error: 'Only institutions can verify students' });

    const { student_id } = req.params;
    const { status } = req.body; // 'verified' or 'rejected'

    const instResult = await pool.query(`SELECT id FROM institutions WHERE user_id = $1`, [req.user.id]);
    if (instResult.rows.length === 0) return res.status(404).json({ error: 'Institution not found' });
    
    const institutionId = instResult.rows[0].id;

    const result = await pool.query(
      `UPDATE student_institutions SET verification_status = $1, verified_at = NOW() 
       WHERE student_id = $2 AND institution_id = $3 RETURNING *`,
      [status, student_id, institutionId]
    );

    if (result.rows.length === 0) return res.status(404).json({ error: 'Student linkage not found' });

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to verify student' });
  }
});

// 4. Get accredited properties
router.get('/properties', mockAuth, async (req, res) => {
  try {
    if (req.user.role !== 'institution') return res.status(403).json({ error: 'Only institutions can view this' });

    const instResult = await pool.query(`SELECT id FROM institutions WHERE user_id = $1`, [req.user.id]);
    if (instResult.rows.length === 0) return res.status(404).json({ error: 'Institution not found' });
    
    const institutionId = instResult.rows[0].id;

    const properties = await pool.query(
      `SELECT p.*, ip.accreditation_status, ip.accredited_at
       FROM institution_properties ip
       JOIN properties p ON ip.property_id = p.id
       WHERE ip.institution_id = $1`,
      [institutionId]
    );

    res.json(properties.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch accredited properties' });
  }
});

module.exports = router;
