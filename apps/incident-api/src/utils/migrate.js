/**
 * Database migration for the incident reporting module.
 * Run once on deployment to create required tables.
 */
const db = require('./db');

async function migrate() {
  console.log('Running incident module migration...');

  // Create incidents table
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
    );
  `);

  // Create audit trail table
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
    );
  `);

  // Indexes for performance
  await db.query(`
    CREATE INDEX IF NOT EXISTS idx_incidents_status ON incidents(status);
    CREATE INDEX IF NOT EXISTS idx_incidents_severity ON incidents(severity);
    CREATE INDEX IF NOT EXISTS idx_incidents_reported_by ON incidents(reported_by);
    CREATE INDEX IF NOT EXISTS idx_incidents_property_id ON incidents(property_id);
    CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON incidents(created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_audit_incident_id ON incident_audit(incident_id);
  `);

  // Auto-update updated_at trigger
  await db.query(`
    CREATE OR REPLACE FUNCTION update_incident_timestamp()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ language 'plpgsql';
  `);

  await db.query(`
    DROP TRIGGER IF EXISTS update_incidents_updated_at ON incidents;
    CREATE TRIGGER update_incidents_updated_at
      BEFORE UPDATE ON incidents
      FOR EACH ROW EXECUTE PROCEDURE update_incident_timestamp();
  `);

  console.log('Migration complete.');
  process.exit(0);
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
