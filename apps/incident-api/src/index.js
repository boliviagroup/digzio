require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { rateLimit } = require('express-rate-limit');
const incidentRoutes = require('./routes/incident.routes');
const db = require('./utils/db');

const app = express();
app.set('trust proxy', 1);

const PORT = process.env.PORT || 3009;

// Auto-run DB migration on startup
async function runMigration() {
  try {
    console.log('Running incident module DB migration...');
    await db.query(`
      CREATE TABLE IF NOT EXISTS incidents (
        incident_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        reported_by     UUID NOT NULL,
        reporter_name   TEXT,
        reporter_role   TEXT DEFAULT 'student',
        property_id     UUID,
        title           TEXT NOT NULL,
        description     TEXT NOT NULL,
        category        TEXT NOT NULL CHECK (category IN (
                          'safety','maintenance','noise','theft','harassment',
                          'fire','flooding','power','water','other'
                        )),
        severity        TEXT NOT NULL DEFAULT 'medium' CHECK (severity IN ('low','medium','high','critical')),
        status          TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed')),
        latitude        DOUBLE PRECISION NOT NULL,
        longitude       DOUBLE PRECISION NOT NULL,
        address_text    TEXT,
        photo_url       TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`
      CREATE TABLE IF NOT EXISTS incident_audit (
        audit_id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        incident_id     UUID NOT NULL REFERENCES incidents(incident_id) ON DELETE CASCADE,
        changed_by      UUID,
        changed_by_name TEXT,
        action          TEXT NOT NULL,
        old_status      TEXT,
        new_status      TEXT,
        note            TEXT,
        created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC)`);
    await db.query(`CREATE INDEX IF NOT EXISTS idx_audit_incident_id ON incident_audit(incident_id)`);
    await db.query(`
      CREATE OR REPLACE FUNCTION update_incident_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
      $$ language 'plpgsql'
    `);
    await db.query(`
      DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
      CREATE TRIGGER update_incidents_updated_at
        BEFORE UPDATE ON incidents
        FOR EACH ROW EXECUTE PROCEDURE update_incident_timestamp()
    `);
    console.log('Migration complete.');
  } catch (err) {
    console.error('Migration error (non-fatal):', err.message);
  }
}

// Middleware
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 200,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
});
app.use('/api/', limiter);

// Health check for ALB
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'incident-api' });
});

// Routes
app.use('/api/v1/incidents', incidentRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

// Start server after migration
runMigration().then(() => {
  app.listen(PORT, () => {
    console.log(`Incident API listening on port ${PORT}`);
  });
});
