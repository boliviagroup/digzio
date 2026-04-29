const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const { authenticate, requireAdmin } = require('../middleware/auth');

// ─── POST /api/v1/incidents ──────────────────────────────────────────────────
// Create a new geo-tagged incident (students and providers)
router.post('/', authenticate, async (req, res) => {
  try {
    const {
      title, description, category, severity = 'medium',
      latitude, longitude, address_text, photo_url, property_id
    } = req.body;

    if (!title || !description || !category || latitude == null || longitude == null) {
      return res.status(400).json({ error: 'title, description, category, latitude and longitude are required' });
    }

    const validCategories = ['safety','maintenance','noise','theft','harassment','fire','flooding','power','water','other'];
    if (!validCategories.includes(category)) {
      return res.status(400).json({ error: `category must be one of: ${validCategories.join(', ')}` });
    }

    const result = await db.query(
      `INSERT INTO incidents
         (reported_by, reporter_name, reporter_role, property_id, title, description,
          category, severity, latitude, longitude, address_text, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
       RETURNING *`,
      [
        req.user.user_id,
        req.user.name || req.user.email,
        req.user.role || 'student',
        property_id || null,
        title, description, category, severity,
        parseFloat(latitude), parseFloat(longitude),
        address_text || null,
        photo_url || null
      ]
    );

    const incident = result.rows[0];

    // Write initial audit trail entry
    await db.query(
      `INSERT INTO incident_audit (incident_id, changed_by, changed_by_name, action, new_status, note)
       VALUES ($1, $2, $3, 'created', 'open', 'Incident reported')`,
      [incident.incident_id, req.user.user_id, req.user.name || req.user.email]
    );

    // Publish real-time alert to Redis pub/sub
    try {
      await db.redisClient.publish('incidents:new', JSON.stringify({
        incident_id: incident.incident_id,
        title: incident.title,
        category: incident.category,
        severity: incident.severity,
        latitude: incident.latitude,
        longitude: incident.longitude,
        reporter_name: incident.reporter_name,
        created_at: incident.created_at
      }));
    } catch (redisErr) {
      console.warn('Redis publish failed (non-fatal):', redisErr.message);
    }

    res.status(201).json({ success: true, incident });
  } catch (err) {
    console.error('Create incident error:', err);
    res.status(500).json({ error: 'Failed to create incident' });
  }
});

// ─── GET /api/v1/incidents ───────────────────────────────────────────────────
// List incidents — students see their own, admins see all
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, category, severity, limit = 100, offset = 0 } = req.query;
    const isAdmin = req.user.role === 'admin';

    let conditions = [];
    let params = [];
    let idx = 1;

    if (!isAdmin) {
      conditions.push(`i.reported_by = $${idx++}`);
      params.push(req.user.user_id);
    }
    if (status) { conditions.push(`i.status = $${idx++}`); params.push(status); }
    if (category) { conditions.push(`i.category = $${idx++}`); params.push(category); }
    if (severity) { conditions.push(`i.severity = $${idx++}`); params.push(severity); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT i.*,
              p.title AS property_title,
              p.address_line_1 AS property_address
       FROM incidents i
       LEFT JOIN properties p ON p.property_id = i.property_id
       ${where}
       ORDER BY i.created_at DESC
       LIMIT $${idx++} OFFSET $${idx++}`,
      [...params, parseInt(limit), parseInt(offset)]
    );

    const countResult = await db.query(
      `SELECT COUNT(*) FROM incidents i ${where}`,
      params
    );

    res.json({
      incidents: result.rows,
      total: parseInt(countResult.rows[0].count),
      limit: parseInt(limit),
      offset: parseInt(offset)
    });
  } catch (err) {
    console.error('List incidents error:', err);
    res.status(500).json({ error: 'Failed to fetch incidents' });
  }
});

// ─── GET /api/v1/incidents/map ───────────────────────────────────────────────
// Get all incidents as GeoJSON for map display (admin only)
router.get('/map', authenticate, requireAdmin, async (req, res) => {
  try {
    const { status, since } = req.query;
    let conditions = [];
    let params = [];
    let idx = 1;

    if (status && status !== 'all') {
      conditions.push(`status = $${idx++}`);
      params.push(status);
    }
    if (since) {
      conditions.push(`created_at >= $${idx++}`);
      params.push(new Date(since));
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const result = await db.query(
      `SELECT i.incident_id, i.title, i.description, i.category, i.severity, i.status,
              i.latitude, i.longitude, i.address_text, i.reporter_name, i.reporter_role,
              i.property_id, i.photo_url, i.created_at, i.updated_at, i.reported_by,
              p.title AS property_name,
              p.city AS property_city,
              p.address_line_1 AS property_address,
              CONCAT(u.first_name, ' ', u.last_name) AS provider_name,
              u.email AS provider_email
       FROM incidents i
       LEFT JOIN properties p ON p.property_id = i.property_id
       LEFT JOIN users u ON u.user_id = p.provider_id
       ${where.replace('WHERE', 'WHERE i.')}
       ORDER BY i.created_at DESC`,
      params
    );

    // Return as GeoJSON FeatureCollection
    const geojson = {
      type: 'FeatureCollection',
      features: result.rows.map(inc => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [inc.longitude, inc.latitude]
        },
        properties: {
          incident_id: inc.incident_id,
          title: inc.title,
          description: inc.description,
          category: inc.category,
          severity: inc.severity,
          status: inc.status,
          address_text: inc.address_text,
          reporter_name: inc.reporter_name,
          reporter_role: inc.reporter_role,
          property_id: inc.property_id,
          property_name: inc.property_name,
          property_city: inc.property_city,
          property_address: inc.property_address,
          provider_name: inc.provider_name,
          provider_email: inc.provider_email,
          photo_url: inc.photo_url,
          created_at: inc.created_at,
          updated_at: inc.updated_at
        }
      }))
    };

    res.json(geojson);
  } catch (err) {
    console.error('Map incidents error:', err);
    res.status(500).json({ error: 'Failed to fetch map data' });
  }
});

// ─── GET /api/v1/incidents/stats ─────────────────────────────────────────────
// Get incident statistics for admin dashboard
router.get('/stats', authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await db.query(`
      SELECT
        COUNT(*) FILTER (WHERE status = 'open') AS open_count,
        COUNT(*) FILTER (WHERE status = 'in_progress') AS in_progress_count,
        COUNT(*) FILTER (WHERE status = 'resolved') AS resolved_count,
        COUNT(*) FILTER (WHERE status = 'closed') AS closed_count,
        COUNT(*) FILTER (WHERE severity = 'critical') AS critical_count,
        COUNT(*) FILTER (WHERE severity = 'high') AS high_count,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '24 hours') AS last_24h,
        COUNT(*) FILTER (WHERE created_at >= NOW() - INTERVAL '7 days') AS last_7d,
        COUNT(*) AS total
      FROM incidents
    `);

    const byCategory = await db.query(`
      SELECT category, COUNT(*) AS count
      FROM incidents
      GROUP BY category
      ORDER BY count DESC
    `);

    res.json({
      summary: result.rows[0],
      by_category: byCategory.rows
    });
  } catch (err) {
    console.error('Stats error:', err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ─── GET /api/v1/incidents/:id ───────────────────────────────────────────────
// Get a single incident with its full audit trail
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const isAdmin = req.user.role === 'admin';

    const result = await db.query(
      `SELECT i.*,
              p.title AS property_title,
              p.address_line_1 AS property_address
       FROM incidents i
       LEFT JOIN properties p ON p.property_id = i.property_id
       WHERE i.incident_id = $1`,
      [id]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'Incident not found' });
    }

    const incident = result.rows[0];

    // Non-admins can only view their own incidents
    if (!isAdmin && incident.reported_by !== req.user.user_id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch audit trail
    const audit = await db.query(
      `SELECT * FROM incident_audit WHERE incident_id = $1 ORDER BY created_at ASC`,
      [id]
    );

    res.json({ incident, audit_trail: audit.rows });
  } catch (err) {
    console.error('Get incident error:', err);
    res.status(500).json({ error: 'Failed to fetch incident' });
  }
});

// ─── PATCH /api/v1/incidents/:id/status ──────────────────────────────────────
// Update incident status (admin only)
router.patch('/:id/status', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;

    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `status must be one of: ${validStatuses.join(', ')}` });
    }

    // Get current status for audit
    const current = await db.query('SELECT status FROM incidents WHERE incident_id = $1', [id]);
    if (!current.rows.length) return res.status(404).json({ error: 'Incident not found' });

    const oldStatus = current.rows[0].status;

    const result = await db.query(
      `UPDATE incidents SET status = $1 WHERE incident_id = $2 RETURNING *`,
      [status, id]
    );

    // Write audit trail
    await db.query(
      `INSERT INTO incident_audit
         (incident_id, changed_by, changed_by_name, action, old_status, new_status, note)
       VALUES ($1, $2, $3, 'status_changed', $4, $5, $6)`,
      [id, req.user.user_id, req.user.name || req.user.email, oldStatus, status, note || null]
    );

    // Publish status change to Redis
    try {
      await db.redisClient.publish('incidents:updated', JSON.stringify({
        incident_id: id,
        old_status: oldStatus,
        new_status: status,
        updated_by: req.user.name || req.user.email
      }));
    } catch (redisErr) {
      console.warn('Redis publish failed (non-fatal):', redisErr.message);
    }

    res.json({ success: true, incident: result.rows[0] });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update incident status' });
  }
});

// ─── POST /api/v1/incidents/:id/notes ────────────────────────────────────────
// Add an admin note to an incident
router.post('/:id/notes', authenticate, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { note } = req.body;

    if (!note) return res.status(400).json({ error: 'note is required' });

    const exists = await db.query('SELECT incident_id FROM incidents WHERE incident_id = $1', [id]);
    if (!exists.rows.length) return res.status(404).json({ error: 'Incident not found' });

    const result = await db.query(
      `INSERT INTO incident_audit
         (incident_id, changed_by, changed_by_name, action, note)
       VALUES ($1, $2, $3, 'note_added', $4)
       RETURNING *`,
      [id, req.user.user_id, req.user.name || req.user.email, note]
    );

    res.status(201).json({ success: true, audit_entry: result.rows[0] });
  } catch (err) {
    console.error('Add note error:', err);
    res.status(500).json({ error: 'Failed to add note' });
  }
});

module.exports = router;
