const express = require('express');
const router = express.Router();
const db = require('../utils/db');

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

// POST /api/v1/properties - Create property
router.post('/', async (req, res) => {
  try {
    const {
      title, description,
      address_line_1, address_line_2,
      city, province, postal_code,
      lat, lng,
      property_type,
      total_beds, available_beds,
      base_price_monthly,
      is_nsfas_accredited = false,
      provider_id,
    } = req.body;

    if (!title || !description || !address_line_1 || !city || !province || !postal_code || !lat || !lng || !property_type || !total_beds || !base_price_monthly || !provider_id) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await db.query(`
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
        $11, $12, $13, $14, $15, 'AVAILABLE'
      )
      RETURNING property_id, title, status, created_at
    `, [
      provider_id, title, description,
      address_line_1, address_line_2 || null,
      city, province, postal_code,
      parseFloat(lng), parseFloat(lat),
      property_type, parseInt(total_beds), parseInt(available_beds || total_beds),
      parseFloat(base_price_monthly), is_nsfas_accredited,
    ]);

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error('Property create error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
