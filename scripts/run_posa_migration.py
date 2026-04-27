import psycopg2
import ssl

DB_HOST = "digzio-db-prod.cjy0eyycgbq0.af-south-1.rds.amazonaws.com"
DB_PORT = 5432
DB_USER = "digzio_admin"
DB_PASSWORD = "sIri78NwfHF0y!|lKEUXPQ(?qBVj"
DB_NAME = "digzio"

MIGRATION_SQL = """
-- POSA Migration: Add POSA fields to student_profiles and properties tables

-- 1. Add POSA fields to student_profiles
ALTER TABLE student_profiles
  ADD COLUMN IF NOT EXISTS year_of_study VARCHAR(20),
  ADD COLUMN IF NOT EXISTS qualification VARCHAR(200),
  ADD COLUMN IF NOT EXISTS campus VARCHAR(100),
  ADD COLUMN IF NOT EXISTS next_of_kin_phone VARCHAR(20),
  ADD COLUMN IF NOT EXISTS type_of_funding VARCHAR(50) DEFAULT 'NSFAS',
  ADD COLUMN IF NOT EXISTS gender VARCHAR(10);

-- 2. Add POSA Code to properties table
ALTER TABLE properties
  ADD COLUMN IF NOT EXISTS posa_code VARCHAR(20),
  ADD COLUMN IF NOT EXISTS posa_institution VARCHAR(100);
"""

VERIFY_SQL = """
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'student_profiles'
ORDER BY ordinal_position;
"""

VERIFY_PROPS_SQL = """
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;
"""

try:
    print(f"Connecting to {DB_HOST}...")
    conn = psycopg2.connect(
        host=DB_HOST,
        port=DB_PORT,
        user=DB_USER,
        password=DB_PASSWORD,
        dbname=DB_NAME,
        sslmode='require',
        connect_timeout=15
    )
    conn.autocommit = True
    cur = conn.cursor()

    print("Running POSA migration...")
    cur.execute(MIGRATION_SQL)
    print("Migration complete!")

    print("\n=== student_profiles columns ===")
    cur.execute(VERIFY_SQL)
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]}")

    print("\n=== properties columns ===")
    cur.execute(VERIFY_PROPS_SQL)
    for row in cur.fetchall():
        print(f"  {row[0]}: {row[1]}")

    cur.close()
    conn.close()
    print("\nDone!")

except Exception as e:
    print(f"Error: {e}")
