// POSA Migration - runs at container startup to add POSA fields
// This is a one-time migration that is safe to run multiple times (IF NOT EXISTS)
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 5432,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'digzio',
  ssl: { rejectUnauthorized: false }
});

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('[POSA Migration] Running...');

    // Add POSA fields to student_profiles
    await client.query(`
      ALTER TABLE student_profiles
        ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(20),
        ADD COLUMN IF NOT EXISTS qualification VARCHAR(200),
        ADD COLUMN IF NOT EXISTS campus VARCHAR(100),
        ADD COLUMN IF NOT EXISTS next_of_kin_phone VARCHAR(20),
        ADD COLUMN IF NOT EXISTS type_of_funding VARCHAR(50) DEFAULT 'NSFAS',
        ADD COLUMN IF NOT EXISTS gender VARCHAR(10)
    `);
    console.log('[POSA Migration] student_profiles updated');

    // Add POSA Code to properties table
    await client.query(`
      ALTER TABLE properties
        ADD COLUMN IF NOT EXISTS posa_code VARCHAR(20),
        ADD COLUMN IF NOT EXISTS posa_institution VARCHAR(100)
    `);
    console.log('[POSA Migration] properties updated');

    console.log('[POSA Migration] Complete!');
  } catch (err) {
    console.error('[POSA Migration] Error:', err.message);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
