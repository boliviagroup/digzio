const express = require('express');
const router = express.Router();
const db = require('../utils/db');
const crypto = require('crypto');

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

// GET /api/v1/properties/my — Get properties owned by the authenticated provider
router.get('/my', authenticate, async (req, res) => {
  try {
    const provider_id = req.user.user_id;
    const result = await db.query(
      `SELECT 
        p.property_id, p.title, p.description,
        p.address_line_1, p.address_line_2,
        p.city, p.province, p.postal_code,
        p.property_type, p.total_beds, p.available_beds,
        p.base_price_monthly, p.is_nsfas_accredited,
        p.status, p.created_at, p.updated_at,
        (
          SELECT json_agg(json_build_object(
            'image_id', pi.image_id,
            'image_url', pi.image_url,
            'is_primary', pi.is_primary
          ) ORDER BY pi.display_order ASC)
          FROM property_images pi
          WHERE pi.property_id = p.property_id
        ) as images,
        (
          SELECT COUNT(*) FROM applications a WHERE a.property_id = p.property_id
        ) as application_count
       FROM properties p
       WHERE p.provider_id = $1
       ORDER BY p.created_at DESC`,
      [provider_id]
    );
    res.json({ properties: result.rows, total: result.rows.length });
  } catch (err) {
    console.error('My properties error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// GET /api/v1/properties - List properties with optional filters
router.get('/', async (req, res) => {
  try {
    const {
      lat, lng, radius_km = 5,
      status,
      province, city,
      min_price, max_price,
      nsfas_accredited,
      property_type,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const offset = (parseInt(page) - 1) * parseInt(limit);
    const params = [];
    const whereClauses = [];

    if (status) {
      params.push(status.toUpperCase());
      whereClauses.push(`p.status = $${params.length}`);
    } else {
      whereClauses.push(`p.status = 'ACTIVE'`);
    }

    if (province) {
      params.push(province);
      whereClauses.push(`LOWER(p.province) = LOWER($${params.length})`);
    }

    if (city) {
      params.push(city);
      whereClauses.push(`LOWER(p.city) = LOWER($${params.length})`);
    }

    if (min_price) {
      params.push(parseFloat(min_price));
      whereClauses.push(`p.base_price_monthly >= $${params.length}`);
    }

    if (max_price) {
      params.push(parseFloat(max_price));
      whereClauses.push(`p.base_price_monthly <= $${params.length}`);
    }

    if (nsfas_accredited === 'true') {
      whereClauses.push(`p.is_nsfas_accredited = TRUE`);
    }

    if (property_type) {
      params.push(property_type.toUpperCase());
      whereClauses.push(`p.property_type = $${params.length}`);
    }

    if (search) {
      params.push('%' + search + '%');
      const idx = params.length;
      whereClauses.push(`(p.title ILIKE $${idx} OR p.description ILIKE $${idx} OR p.city ILIKE $${idx})`);
    }

    let distanceSelect = '';
    let orderBy = 'p.created_at DESC';
    if (lat && lng) {
      const fLng = parseFloat(lng);
      const fLat = parseFloat(lat);
      params.push(fLng, fLat, parseFloat(radius_km) * 1000);
      const lngIdx = params.length - 2;
      const latIdx = params.length - 1;
      const radIdx = params.length;
      whereClauses.push(`ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326), $${radIdx})`);
      distanceSelect = `, ST_Distance(p.location, ST_SetSRID(ST_MakePoint($${lngIdx}, $${latIdx}), 4326)) as distance`;
      orderBy = 'distance ASC';
    }

    const whereStr = whereClauses.length > 0 ? 'WHERE ' + whereClauses.join(' AND ') : '';

    const countResult = await db.query(
      `SELECT COUNT(*) FROM properties p ${whereStr}`,
      params
    );
    const total = parseInt(countResult.rows[0].count);

    params.push(parseInt(limit), offset);
    const dataQuery = `
      SELECT 
        p.property_id,
        p.title,
        p.description,
        p.address_line_1,
        p.address_line_2,
        p.city,
        p.province,
        p.postal_code,
        p.property_type,
        p.total_beds,
        p.available_beds,
        p.base_price_monthly,
        p.is_nsfas_accredited,
        p.status,
        p.created_at
        ${distanceSelect},
        (
          SELECT json_agg(json_build_object(
            'image_id', pi.image_id,
            'image_url', pi.image_url,
            'thumbnail_url', pi.thumbnail_url,
            'is_primary', pi.is_primary,
            'display_order', pi.display_order
          ) ORDER BY pi.display_order ASC)
          FROM property_images pi
          WHERE pi.property_id = p.property_id
        ) as images,
        (
          SELECT json_build_object('first_name', u.first_name, 'last_name', u.last_name)
          FROM users u WHERE u.user_id = p.provider_id
        ) as provider
      FROM properties p
      ${whereStr}
      ORDER BY ${orderBy}
      LIMIT $${params.length - 1} OFFSET $${params.length}
    `;

    const result = await db.query(dataQuery, params);

    res.json({
      properties: result.rows,
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    });
  } catch (err) {
    console.error('Property list error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/v1/properties/:id - Get single property
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        p.*,
        ST_AsGeoJSON(p.location) as location_geojson,
        (
          SELECT json_agg(json_build_object(
            'image_id', pi.image_id,
            'image_url', pi.image_url,
            'thumbnail_url', pi.thumbnail_url,
            'is_primary', pi.is_primary,
            'display_order', pi.display_order,
            'category', pi.category
          ) ORDER BY pi.display_order ASC)
          FROM property_images pi
          WHERE pi.property_id = p.property_id
        ) as images,
        (
          SELECT json_build_object('first_name', u.first_name, 'last_name', u.last_name, 'phone_number', u.phone_number)
          FROM users u WHERE u.user_id = p.provider_id
        ) as provider
      FROM properties p
      WHERE p.property_id = $1
    `;
    const result = await db.query(query, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Property get error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/v1/properties - Create property (provider only)
router.post('/', authenticate, async (req, res) => {
  try {
    const provider_id = req.user.user_id;

    const {
      title, description,
      address_line_1, address_line_2,
      city, province, postal_code,
      lat, lng,
      property_type,
      total_beds, available_beds,
      base_price_monthly,
      is_nsfas_accredited = false,
    } = req.body;

    if (!title || !description || !address_line_1 || !city || !province || !postal_code || !property_type || !total_beds || !base_price_monthly) {
      return res.status(400).json({ error: 'Missing required fields: title, description, address_line_1, city, province, postal_code, property_type, total_beds, base_price_monthly' });
    }

    // lat/lng are optional — use NULL location if not provided
    let locationExpr, locationParams;
    if (lat && lng) {
      locationExpr = `ST_SetSRID(ST_MakePoint($9, $10), 4326)`;
      locationParams = [parseFloat(lng), parseFloat(lat)];
    } else {
      // Default to Johannesburg coordinates if not provided
      locationExpr = `ST_SetSRID(ST_MakePoint(28.0473, -26.2041), 4326)`;
      locationParams = [];
    }

    const baseParams = [
      provider_id, title, description,
      address_line_1, address_line_2 || null,
      city, province, postal_code,
    ];

    let query, queryParams;
    if (lat && lng) {
      query = `
        INSERT INTO properties (
          provider_id, title, description,
          address_line_1, address_line_2,
          city, province, postal_code,
          location,
          property_type, total_beds, available_beds,
          base_price_monthly, is_nsfas_accredited,
          status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          ST_SetSRID(ST_MakePoint($9, $10), 4326),
          $11, $12, $13, $14, $15, 'DRAFT'
        )
        RETURNING property_id, title, status, created_at
      `;
      queryParams = [
        ...baseParams,
        parseFloat(lng), parseFloat(lat),
        property_type.toUpperCase(), parseInt(total_beds), parseInt(available_beds || total_beds),
        parseFloat(base_price_monthly), is_nsfas_accredited,
      ];
    } else {
      query = `
        INSERT INTO properties (
          provider_id, title, description,
          address_line_1, address_line_2,
          city, province, postal_code,
          location,
          property_type, total_beds, available_beds,
          base_price_monthly, is_nsfas_accredited,
          status
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8,
          ST_SetSRID(ST_MakePoint(28.0473, -26.2041), 4326),
          $9, $10, $11, $12, $13, 'DRAFT'
        )
        RETURNING property_id, title, status, created_at
      `;
      queryParams = [
        ...baseParams,
        property_type.toUpperCase(), parseInt(total_beds), parseInt(available_beds || total_beds),
        parseFloat(base_price_monthly), is_nsfas_accredited,
      ];
    }

    const result = await db.query(query, queryParams);
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Property create error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// PATCH /api/v1/properties/:id - Update property (provider only, must own it)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const provider_id = req.user.user_id;
    const { id } = req.params;

    // Verify ownership
    const ownerCheck = await db.query(
      `SELECT property_id FROM properties WHERE property_id = $1 AND provider_id = $2`,
      [id, provider_id]
    );
    if (ownerCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }

    const allowedFields = ['title', 'description', 'address_line_1', 'address_line_2',
      'city', 'province', 'postal_code', 'property_type', 'total_beds', 'available_beds',
      'base_price_monthly', 'is_nsfas_accredited', 'status'];

    const updates = [];
    const params = [];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        params.push(req.body[field]);
        updates.push(`${field} = $${params.length}`);
      }
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' });
    }

    params.push(id);
    const result = await db.query(
      `UPDATE properties SET ${updates.join(', ')}, updated_at = NOW() WHERE property_id = $${params.length} RETURNING property_id, title, status, updated_at`,
      params
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('Property update error:', err.message);
    res.status(500).json({ error: 'Server error', detail: err.message });
  }
});

// DELETE /api/v1/properties/:id - Delete property (provider only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const provider_id = req.user.user_id;
    const { id } = req.params;

    const result = await db.query(
      `DELETE FROM properties WHERE property_id = $1 AND provider_id = $2 RETURNING property_id`,
      [id, provider_id]
    );
    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Property not found or access denied' });
    }
    res.json({ message: 'Property deleted', property_id: id });
  } catch (err) {
    console.error('Property delete error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
