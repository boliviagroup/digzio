-- Digzio Sprint 3 Seed Data
-- This script populates the database with dummy users, properties, and applications for testing

-- 1. Create Dummy Users
INSERT INTO users (id, first_name, last_name, email, password_hash, phone_number, role, kyc_status, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'John', 'Doe', 'student@digzio.test', '$2b$10$dummyhashstudent', '+27610000001', 'student', 'approved', NOW(), NOW()),
  ('22222222-2222-2222-2222-222222222222', 'Jane', 'Smith', 'provider@digzio.test', '$2b$10$dummyhashprovider', '+27610000002', 'provider', 'approved', NOW(), NOW()),
  ('33333333-3333-3333-3333-333333333333', 'Admin', 'User', 'admin@digzio.test', '$2b$10$dummyhashadmin', '+27610000003', 'admin', 'approved', NOW(), NOW()),
  ('44444444-4444-4444-4444-444444444444', 'UCT', 'Admin', 'uct@digzio.test', '$2b$10$dummyhashinst', '+27610000004', 'institution', 'approved', NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 2. Create Institution
INSERT INTO institutions (id, user_id, name, location, contact_email, created_at, updated_at)
VALUES 
  ('55555555-5555-5555-5555-555555555555', '44444444-4444-4444-4444-444444444444', 'University of Cape Town', 'Cape Town, South Africa', 'uct@digzio.test', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 3. Create Dummy Properties (owned by Provider Jane Smith)
INSERT INTO properties (id, provider_id, title, description, property_type, rent_amount, deposit_amount, available_from, location, address_line1, city, province, postal_code, status, created_at, updated_at)
VALUES 
  ('66666666-6666-6666-6666-666666666666', '22222222-2222-2222-2222-222222222222', 'Modern Studio near UCT', 'A beautiful studio apartment within walking distance to upper campus.', 'apartment', 5500.00, 5500.00, CURRENT_DATE, ST_SetSRID(ST_MakePoint(18.4615, -33.9576), 4326), '123 Main Road', 'Cape Town', 'Western Cape', '7700', 'available', NOW(), NOW()),
  ('77777777-7777-7777-7777-777777777777', '22222222-2222-2222-2222-222222222222', 'Shared House in Observatory', 'One room available in a 4-bedroom student house.', 'room', 4000.00, 4000.00, CURRENT_DATE, ST_SetSRID(ST_MakePoint(18.4715, -33.9406), 4326), '45 Obs Ave', 'Cape Town', 'Western Cape', '7925', 'available', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 4. Create Dummy Application (Student John Doe applying for Studio)
INSERT INTO applications (id, property_id, tenant_id, status, desired_move_in_date, lease_term_months, created_at, updated_at)
VALUES 
  ('88888888-8888-8888-8888-888888888888', '66666666-6666-6666-6666-666666666666', '11111111-1111-1111-1111-111111111111', 'pending', CURRENT_DATE + INTERVAL '7 days', 12, NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 5. Link Student to Institution
INSERT INTO student_institutions (student_id, institution_id, student_number, verification_status, created_at, updated_at)
VALUES 
  ('11111111-1111-1111-1111-111111111111', '55555555-5555-5555-5555-555555555555', 'DOE123456', 'verified', NOW(), NOW())
ON CONFLICT DO NOTHING;

-- 6. Link Property to Institution (Accreditation)
INSERT INTO institution_properties (institution_id, property_id, accreditation_status, accredited_at, created_at, updated_at)
VALUES 
  ('55555555-5555-5555-5555-555555555555', '66666666-6666-6666-6666-666666666666', 'approved', NOW(), NOW(), NOW())
ON CONFLICT DO NOTHING;
