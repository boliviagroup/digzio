const express = require('express');
const router = express.Router();
const { Pool } = require('pg');
const crypto = require('crypto');
const axios = require('axios');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER || 'digzio_admin',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'digzio',
  ssl: { rejectUnauthorized: false }
});

const JWT_SECRET = process.env.JWT_SECRET || 'digzio-super-secret-jwt-key-2024-production';
const NOTIFICATION_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://digzio-alb-prod-1867460850.af-south-1.elb.amazonaws.com';
const DIGZIO_URL = 'https://www.digzio.co.za';

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

// ── Email helpers ────────────────────────────────────────────────────────────

function buildApprovedEmail(studentName, propertyTitle, city) {
  const subject = `🎉 Your application for ${propertyTitle} has been APPROVED!`;
  const body_html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <!-- Header -->
        <tr>
          <td style="background:#0f172a;padding:32px 40px;text-align:center;">
            <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;letter-spacing:-0.5px;">Digzio</h1>
            <p style="color:#94a3b8;margin:6px 0 0;font-size:14px;">Where Students Belong</p>
          </td>
        </tr>
        <!-- Green banner -->
        <tr>
          <td style="background:#16a34a;padding:20px 40px;text-align:center;">
            <p style="color:#ffffff;margin:0;font-size:20px;font-weight:700;">✅ Application Approved!</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="color:#1e293b;font-size:16px;margin:0 0 16px;">Hi <strong>${studentName}</strong>,</p>
            <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
              Great news! Your accommodation application for <strong>${propertyTitle}</strong> in <strong>${city}</strong> has been <strong style="color:#16a34a;">approved</strong> by the provider.
            </p>
            <!-- Steps box -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;margin-bottom:28px;">
              <tr><td style="padding:24px;">
                <p style="color:#15803d;font-weight:700;font-size:15px;margin:0 0 16px;">📋 Your Next Steps</p>
                <table width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;width:28px;color:#16a34a;font-weight:700;">1.</td>
                    <td style="padding:8px 0;color:#166534;font-size:14px;line-height:1.5;">
                      <strong>Review your lease agreement</strong> — Log in to your Digzio dashboard to view and sign your lease document.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;color:#16a34a;font-weight:700;">2.</td>
                    <td style="padding:8px 0;color:#166534;font-size:14px;line-height:1.5;">
                      <strong>Confirm your NSFAS funding</strong> — Ensure your NSFAS allowance is directed to the provider. Contact your institution's financial aid office if needed.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;color:#16a34a;font-weight:700;">3.</td>
                    <td style="padding:8px 0;color:#166534;font-size:14px;line-height:1.5;">
                      <strong>Complete your KYC verification</strong> — If not yet done, submit your ID and proof of enrollment on your dashboard.
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:8px 0;vertical-align:top;color:#16a34a;font-weight:700;">4.</td>
                    <td style="padding:8px 0;color:#166534;font-size:14px;line-height:1.5;">
                      <strong>Arrange your move-in date</strong> — The provider will contact you directly to confirm your move-in date and hand over keys.
                    </td>
                  </tr>
                </table>
              </td></tr>
            </table>
            <!-- CTA Button -->
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
              <tr><td align="center">
                <a href="${DIGZIO_URL}/dashboard/student" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
                  View My Dashboard →
                </a>
              </td></tr>
            </table>
            <p style="color:#64748b;font-size:13px;line-height:1.6;margin:0;">
              If you have any questions, please contact your provider directly or reach out to Digzio support at <a href="mailto:support@digzio.co.za" style="color:#0f172a;">support@digzio.co.za</a>.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;">© 2026 Digzio (Pty) Ltd · <a href="${DIGZIO_URL}" style="color:#94a3b8;">www.digzio.co.za</a></p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const body_text = `Hi ${studentName},\n\nYour application for ${propertyTitle} in ${city} has been APPROVED!\n\nNext steps:\n1. Log in to your dashboard and sign your lease: ${DIGZIO_URL}/dashboard/student\n2. Confirm your NSFAS funding with your institution.\n3. Complete KYC verification if not done.\n4. The provider will contact you to arrange your move-in date.\n\nQuestions? Email support@digzio.co.za\n\n— The Digzio Team`;
  return { subject, body_html, body_text };
}

function buildRejectedEmail(studentName, propertyTitle, city, notes) {
  const subject = `Update on your application for ${propertyTitle}`;
  const body_html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f172a;padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Digzio</h1>
          <p style="color:#94a3b8;margin:6px 0 0;font-size:14px;">Where Students Belong</p>
        </td></tr>
        <tr><td style="background:#dc2626;padding:20px 40px;text-align:center;">
          <p style="color:#ffffff;margin:0;font-size:18px;font-weight:700;">Application Update</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="color:#1e293b;font-size:16px;margin:0 0 16px;">Hi <strong>${studentName}</strong>,</p>
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 20px;">
            Thank you for your interest in <strong>${propertyTitle}</strong> in <strong>${city}</strong>. Unfortunately, the provider was unable to accommodate your application at this time.
          </p>
          ${notes ? `<table width="100%" cellpadding="0" cellspacing="0" style="background:#fef2f2;border:1px solid #fecaca;border-radius:8px;margin-bottom:24px;"><tr><td style="padding:16px;"><p style="color:#991b1b;font-size:14px;margin:0;"><strong>Provider note:</strong> ${notes}</p></td></tr></table>` : ''}
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Don't be discouraged — there are many other great properties available on Digzio. Browse and apply to more listings today.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${DIGZIO_URL}/search" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
                Find More Properties →
              </a>
            </td></tr>
          </table>
          <p style="color:#64748b;font-size:13px;">Questions? <a href="mailto:support@digzio.co.za" style="color:#0f172a;">support@digzio.co.za</a></p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© 2026 Digzio (Pty) Ltd · <a href="${DIGZIO_URL}" style="color:#94a3b8;">www.digzio.co.za</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const body_text = `Hi ${studentName},\n\nUnfortunately your application for ${propertyTitle} was not successful at this time.${notes ? '\n\nProvider note: ' + notes : ''}\n\nBrowse more properties at ${DIGZIO_URL}/search\n\n— The Digzio Team`;
  return { subject, body_html, body_text };
}

function buildNsfasEmail(studentName, propertyTitle) {
  const subject = `Action required: NSFAS verification for ${propertyTitle}`;
  const body_html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f4f6f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f6f9;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
        <tr><td style="background:#0f172a;padding:32px 40px;text-align:center;">
          <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:700;">Digzio</h1>
          <p style="color:#94a3b8;margin:6px 0 0;font-size:14px;">Where Students Belong</p>
        </td></tr>
        <tr><td style="background:#d97706;padding:20px 40px;text-align:center;">
          <p style="color:#ffffff;margin:0;font-size:18px;font-weight:700;">⏳ NSFAS Verification in Progress</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <p style="color:#1e293b;font-size:16px;margin:0 0 16px;">Hi <strong>${studentName}</strong>,</p>
          <p style="color:#334155;font-size:15px;line-height:1.6;margin:0 0 24px;">
            Your application for <strong>${propertyTitle}</strong> is progressing well. The provider is currently verifying your NSFAS funding status.
          </p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;margin-bottom:28px;">
            <tr><td style="padding:20px;">
              <p style="color:#92400e;font-weight:700;font-size:14px;margin:0 0 12px;">To speed up the process:</p>
              <ul style="color:#78350f;font-size:14px;line-height:1.8;margin:0;padding-left:20px;">
                <li>Ensure your NSFAS application is approved and up to date</li>
                <li>Contact your institution's financial aid office to confirm your allowance</li>
                <li>Complete your KYC verification on your Digzio dashboard</li>
              </ul>
            </td></tr>
          </table>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:28px;">
            <tr><td align="center">
              <a href="${DIGZIO_URL}/dashboard/student" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:8px;font-size:15px;font-weight:700;">
                Check Application Status →
              </a>
            </td></tr>
          </table>
          <p style="color:#64748b;font-size:13px;">Questions? <a href="mailto:support@digzio.co.za" style="color:#0f172a;">support@digzio.co.za</a></p>
        </td></tr>
        <tr><td style="background:#f8fafc;padding:20px 40px;text-align:center;border-top:1px solid #e2e8f0;">
          <p style="color:#94a3b8;font-size:12px;margin:0;">© 2026 Digzio (Pty) Ltd · <a href="${DIGZIO_URL}" style="color:#94a3b8;">www.digzio.co.za</a></p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
  const body_text = `Hi ${studentName},\n\nYour application for ${propertyTitle} is in the NSFAS verification stage. Please ensure your NSFAS is up to date and your KYC is complete.\n\nCheck your status: ${DIGZIO_URL}/dashboard/student\n\n— The Digzio Team`;
  return { subject, body_html, body_text };
}

async function sendNotificationEmail(to, emailContent) {
  try {
    const notifUrl = NOTIFICATION_URL.startsWith('http')
      ? NOTIFICATION_URL
      : `http://${NOTIFICATION_URL}`;
    await axios.post(`${notifUrl}/api/v1/notifications/email`, {
      to,
      subject: emailContent.subject,
      body_html: emailContent.body_html,
      body_text: emailContent.body_text
    }, { timeout: 5000 });
    console.log(`Email sent to ${to}: ${emailContent.subject}`);
  } catch (err) {
    // Non-blocking — log but don't fail the status update
    console.error(`Failed to send email to ${to}:`, err.message);
  }
}

// ── Routes ───────────────────────────────────────────────────────────────────

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
    const caller_id = req.user.user_id;
    const caller_role = req.user.role;
    // SECURITY FIX (CRITICAL-02): Enforce object-level authorisation.
    // Only the owning student, the provider whose property the application is
    // for, or an ADMIN may read a specific application record.
    // All unauthorised callers receive 404 to avoid leaking record existence.
    let query, params;
    if (caller_role === 'ADMIN') {
      query = `SELECT a.*, p.title AS property_title, p.city, p.province, p.base_price_monthly,
              u.first_name, u.last_name, u.email AS student_email, u.kyc_status
       FROM applications a
       JOIN properties p ON a.property_id = p.property_id
       JOIN users u ON a.student_id = u.user_id
       WHERE a.application_id = $1`;
      params = [req.params.id];
    } else if (caller_role === 'PROVIDER') {
      // Provider may only read applications for their own properties
      query = `SELECT a.*, p.title AS property_title, p.city, p.province, p.base_price_monthly,
              u.first_name, u.last_name, u.email AS student_email, u.kyc_status
       FROM applications a
       JOIN properties p ON a.property_id = p.property_id
       JOIN users u ON a.student_id = u.user_id
       WHERE a.application_id = $1 AND p.provider_id = $2`;
      params = [req.params.id, caller_id];
    } else {
      // STUDENT (and any other role) may only read their own applications
      query = `SELECT a.*, p.title AS property_title, p.city, p.province, p.base_price_monthly,
              u.first_name, u.last_name, u.email AS student_email, u.kyc_status
       FROM applications a
       JOIN properties p ON a.property_id = p.property_id
       JOIN users u ON a.student_id = u.user_id
       WHERE a.application_id = $1 AND a.student_id = $2`;
      params = [req.params.id, caller_id];
    }
    const result = await pool.query(query, params);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Application not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get application error:', err.message);
    res.status(500).json({ error: 'Failed to fetch application' });
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

    const updated = result.rows[0];

    // ── Send notification email (non-blocking) ──────────────────────────────
    if (['APPROVED', 'REJECTED', 'PENDING_NSFAS'].includes(status)) {
      // Fetch student details + property info for the email
      pool.query(
        `SELECT u.first_name, u.last_name, u.email AS student_email,
                p.title AS property_title, p.city
         FROM applications a
         JOIN users u ON a.student_id = u.user_id
         JOIN properties p ON a.property_id = p.property_id
         WHERE a.application_id = $1`,
        [req.params.id]
      ).then(async (infoResult) => {
        if (infoResult.rows.length === 0) return;
        const { first_name, last_name, student_email, property_title, city } = infoResult.rows[0];
        const studentName = `${first_name} ${last_name}`;

        let emailContent;
        if (status === 'APPROVED') {
          emailContent = buildApprovedEmail(studentName, property_title, city);
        } else if (status === 'REJECTED') {
          emailContent = buildRejectedEmail(studentName, property_title, city, provider_notes);
        } else if (status === 'PENDING_NSFAS') {
          emailContent = buildNsfasEmail(studentName, property_title);
        }

        if (emailContent) {
          await sendNotificationEmail(student_email, emailContent);
        }
      }).catch(err => console.error('Email lookup error:', err.message));
    }

    res.json(updated);
  } catch (err) {
    console.error('Update status error:', err.message);
    res.status(500).json({ error: 'Failed to update application', detail: err.message });
  }
});

module.exports = router;
