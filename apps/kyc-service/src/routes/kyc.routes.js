const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER || 'digzio_admin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  ssl: { rejectUnauthorized: false }
});

const s3Client = new S3Client({ region: process.env.AWS_REGION || 'af-south-1' });
const BUCKET_NAME = process.env.S3_BUCKET;

// Middleware to mock auth for now (will be replaced by API Gateway/ALB JWT validation)
const mockAuth = (req, res, next) => {
  req.user = { id: req.headers['x-user-id'] || '1', role: req.headers['x-user-role'] || 'student' };
  next();
};

// 1. Submit KYC Application
router.post('/submit', mockAuth, async (req, res) => {
  try {
    const { document_type, document_number } = req.body;
    
    // In a real app, this would check if one already exists
    const result = await pool.query(
      `INSERT INTO kyc_documents (user_id, document_type, document_number, verification_status, uploaded_at)
       VALUES ($1, $2, $3, 'pending', NOW())
       RETURNING *`,
      [req.user.id, document_type, document_number]
    );

    // Update user status
    await pool.query(
      `UPDATE users SET kyc_status = 'pending' WHERE id = $1`,
      [req.user.id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to submit KYC' });
  }
});

// 2. Get Presigned URL for Document Upload
router.post('/upload-url', mockAuth, async (req, res) => {
  try {
    const { filename, contentType } = req.body;
    const fileId = uuidv4();
    const extension = filename.split('.').pop();
    const key = `kyc/${req.user.id}/${fileId}.${extension}`;

    const command = new PutObjectCommand({
      Bucket: BUCKET_NAME,
      Key: key,
      ContentType: contentType
    });

    const signedUrl = await getSignedUrl(s3Client, command, { expiresIn: 3600 });

    res.json({
      uploadUrl: signedUrl,
      fileKey: key
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate upload URL' });
  }
});

// 3. Get User's KYC Status
router.get('/status', mockAuth, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT kyc_status FROM users WHERE id = $1`,
      [req.user.id]
    );
    
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    
    res.json({ status: result.rows[0].kyc_status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to get KYC status' });
  }
});

// 4. Admin Approve/Reject KYC
router.patch('/:id/status', mockAuth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });

    const { id } = req.params;
    const { status, notes } = req.body; // status: 'approved' or 'rejected'

    const kycResult = await pool.query(
      `UPDATE kyc_documents 
       SET verification_status = $1, verified_at = NOW(), verification_notes = $2
       WHERE id = $3 RETURNING user_id`,
      [status, notes, id]
    );

    if (kycResult.rows.length > 0) {
      await pool.query(
        `UPDATE users SET kyc_status = $1 WHERE id = $2`,
        [status, kycResult.rows[0].user_id]
      );
    }

    res.json({ message: `KYC ${status} successfully` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update KYC status' });
  }
});

module.exports = router;
