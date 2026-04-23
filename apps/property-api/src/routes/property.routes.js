const express = require('express');
const router = express.Router();
const db = require('../utils/db'); // Assume similar db.js to auth-service

// Get all properties with optional spatial search
router.get('/', async (req, res) => {
  try {
    const { lat, lng, radius_km = 5, status = 'available', limit = 20, offset = 0 } = req.query;

    let query = `
      SELECT 
        p.id, p.title, p.description, p.price, p.deposit, p.status, p.property_type,
        p.bedrooms, p.bathrooms, p.furnished, p.nsfas_accredited,
        ST_AsGeoJSON(p.location) as location,
        (SELECT json_agg(image_url) FROM property_images pi WHERE pi.property_id = p.id) as images
    `;
    const params = [];
    let whereClauses = [];

    if (status) {
      params.push(status);
      whereClauses.push(`p.status = $${params.length}`);
    }

    if (lat && lng) {
      params.push(lng, lat, radius_km * 1000);
      whereClauses.push(`ST_DWithin(p.location, ST_SetSRID(ST_MakePoint($${params.length - 2}, $${params.length - 1}), 4326), $${params.length})`);
      
      // Add distance to select
      query += `, ST_Distance(p.location, ST_SetSRID(ST_MakePoint($${params.length - 2}, $${params.length - 1}), 4326)) as distance`;
    }

    query += ` FROM properties p`;

    if (whereClauses.length > 0) {
      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    if (lat && lng) {
      query += ` ORDER BY distance ASC`;
    } else {
      query += ` ORDER BY p.created_at DESC`;
    }

    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);
    res.json({ data: result.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Get single property
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const query = `
      SELECT 
        p.*,
        ST_AsGeoJSON(p.location) as location,
        (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.image_url, 'is_primary', pi.is_primary)) 
         FROM property_images pi WHERE pi.property_id = p.id) as images
      FROM properties p
      WHERE p.id = $1
    `;
    const result = await db.query(query, [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Property not found' });
    }
    
    res.json({ data: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Create property (would be protected by auth middleware in real implementation)
router.post('/', async (req, res) => {
  try {
    const { 
      landlord_id, title, description, price, deposit, 
      address_line1, city, province, postal_code, 
      lat, lng, property_type, bedrooms, bathrooms, 
      furnished, nsfas_accredited 
    } = req.body;

    const query = `
      INSERT INTO properties (
        landlord_id, title, description, price, deposit, 
        address_line1, city, province, postal_code, 
        location, property_type, bedrooms, bathrooms, 
        furnished, nsfas_accredited
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, 
        ST_SetSRID(ST_MakePoint($10, $11), 4326), 
        $12, $13, $14, $15, $16
      ) RETURNING id
    `;
    
    const params = [
      landlord_id, title, description, price, deposit, 
      address_line1, city, province, postal_code, 
      lng, lat, property_type, bedrooms, bathrooms, 
      furnished, nsfas_accredited
    ];

    const result = await db.query(query, params);
    res.status(201).json({ id: result.rows[0].id, message: 'Property created successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
