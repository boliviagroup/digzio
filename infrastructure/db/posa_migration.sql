-- POSA Migration: Add POSA fields to student_profiles and properties tables
-- Run this once against the live RDS instance

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

-- 3. Verify the changes
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'student_profiles'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'properties'
ORDER BY ordinal_position;
