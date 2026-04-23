const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const axios = require('axios');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER || 'digzio_admin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

const NOTIFICATION_URL = process.env.NOTIFICATION_URL || 'http://digzio-notification-service-prod:3004/api/v1/notifications/email';

const mockAuth = (req, res, next) => {
  req.user = { id: req.headers['x-user-id'] || '1', role: req.headers['x-user-role'] || 'student' };
  next();
};

// 1. Apply for a property
router.post('/', mockAuth, async (req, res) => {
  try {
    if (req.user.role !== 'student') return res.status(403).json({ error: 'Only students can apply' });

    const { property_id, desired_move_in_date, lease_term_months } = req.body;

    // Check if already applied
    const existing = await pool.query(
      `SELECT id FROM applications WHERE property_id = $1 AND tenant_id = $2`,
      [property_id, req.user.id]
    );
    
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Already applied for this property' });

    // Create application
    const result = await pool.query(
      `INSERT INTO applications (property_id, tenant_id, status, desired_move_in_date, lease_term_months)
       VALUES ($1, $2, 'pending', $3, $4)
       RETURNING *`,
      [property_id, req.user.id, desired_move_in_date, lease_term_months]
    );

    // Notify provider (mocked via internal call)
    try {
      const providerQuery = await pool.query(
        `SELECT u.email FROM users u JOIN properties p ON p.provider_id = u.id WHERE p.id = $1`,
        [property_id]
      );
      
      if (providerQuery.rows.length > 0) {
        await axios.post(NOTIFICATION_URL, {
          to: providerQuery.rows[0].email,
          subject: 'New Property Application',
          body_html: '<p>You have a new application for your property on Digzio.</p>',
          body_text: 'You have a new application for your property on Digzio.'
        });
      }
    } catch (err) {
      console.error('Failed to send notification', err.message);
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// 2. Get my applications (Student)
router.get('/my', mockAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT a.*, p.title, p.location 
       FROM applications a 
       JOIN properties p ON a.property_id = p.id 
       WHERE a.tenant_id = $1`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// 3. Get property applications (Provider)
router.get('/property/:property_id', mockAuth, async (req, res) => {
  try {
    const { property_id } = req.params;
    
    // Verify ownership
    const ownerCheck = await pool.query(
      `SELECT provider_id FROM properties WHERE id = $1`,
      [property_id]
    );
    
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].provider_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view these applications' });
    }

    const result = await pool.query(
      `SELECT a.*, u.first_name, u.last_name, u.email, u.kyc_status 
       FROM applications a 
       JOIN users u ON a.tenant_id = u.id 
       WHERE a.property_id = $1`,
      [property_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// 4. Update application status (Provider)
router.patch('/:id/status', mockAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'approved' or 'rejected'

    // Verify ownership
    const ownerCheck = await pool.query(
      `SELECT p.provider_id, a.tenant_id 
       FROM applications a 
       JOIN properties p ON a.property_id = p.id 
       WHERE a.id = $1`,
      [id]
    );
    
    if (ownerCheck.rows.length === 0 || ownerCheck.rows[0].provider_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to update this application' });
    }

    const result = await pool.query(
      `UPDATE applications SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
      [status, id]
    );

    // Notify student
    try {
      const studentQuery = await pool.query(`SELECT email FROM users WHERE id = $1`, [ownerCheck.rows[0].tenant_id]);
      if (studentQuery.rows.length > 0) {
        await axios.post(NOTIFICATION_URL, {
          to: studentQuery.rows[0].email,
          subject: `Application ${status}`,
          body_html: `<p>Your application has been ${status}.</p>`,
          body_text: `Your application has been ${status}.`
        });
      }
    } catch (err) {
      console.error('Failed to send notification', err.message);
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update application' });
  }
});

module.exports = router;
