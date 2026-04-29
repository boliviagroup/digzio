const { Client } = require('pg');

const DB_CONFIG = {
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000,
};

exports.handler = async (event) => {
  const client = new Client(DB_CONFIG);
  
  try {
    await client.connect();
    console.log('Connected to DB');
    
    // Get all properties
    const propsResult = await client.query(
      'SELECT property_id, title, property_type FROM properties ORDER BY created_at'
    );
    const props = propsResult.rows;
    console.log(`Found ${props.length} properties`);
    
    // Check property_images schema
    const schemaResult = await client.query(`
      SELECT column_name FROM information_schema.columns 
      WHERE table_name = 'property_images' ORDER BY ordinal_position
    `);
    const cols = schemaResult.rows.map(r => r.column_name);
    console.log('Columns:', cols);
    
    const hasThumbnail = cols.includes('thumbnail_url');
    const hasCategory = cols.includes('category');
    
    // Image URL sets (CloudFront URLs already uploaded to S3)
    const imageData = event.imageData; // passed in from invocation
    
    let seeded = 0;
    
    for (const { property_id, title, property_type } of props) {
      const images = imageData[property_id] || imageData['default'];
      if (!images || images.length === 0) {
        console.log(`No images for ${title}, skipping`);
        continue;
      }
      
      // Delete existing
      await client.query('DELETE FROM property_images WHERE property_id = $1', [property_id]);
      
      for (let i = 0; i < images.length; i++) {
        const { original, thumbnail } = images[i];
        const isPrimary = i === 0;
        const displayOrder = i + 1;
        
        if (hasCategory && hasThumbnail) {
          await client.query(
            `INSERT INTO property_images (property_id, image_url, thumbnail_url, is_primary, display_order, category)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [property_id, original, thumbnail, isPrimary, displayOrder, i === 0 ? 'exterior' : 'interior']
          );
        } else if (hasThumbnail) {
          await client.query(
            `INSERT INTO property_images (property_id, image_url, thumbnail_url, is_primary, display_order)
             VALUES ($1, $2, $3, $4, $5)`,
            [property_id, original, thumbnail, isPrimary, displayOrder]
          );
        } else {
          await client.query(
            `INSERT INTO property_images (property_id, image_url, is_primary, display_order)
             VALUES ($1, $2, $3, $4)`,
            [property_id, original, isPrimary, displayOrder]
          );
        }
      }
      
      console.log(`✓ Seeded ${images.length} images for ${title}`);
      seeded++;
    }
    
    await client.end();
    return { statusCode: 200, body: `Seeded ${seeded}/${props.length} properties` };
    
  } catch (err) {
    console.error('Error:', err.message);
    await client.end().catch(() => {});
    throw err;
  }
};
