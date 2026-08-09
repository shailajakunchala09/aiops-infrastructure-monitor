-- =====================================================================
-- Demo seed data - gives the dashboard something realistic to display
-- immediately after `docker-compose up`.
-- Run: psql -U aiops_user -d aiops_db -f seed_data.sql
-- (Passwords: this seeds one admin user; app-level bcrypt hash below
--  corresponds to the plaintext password "Admin@12345" - dev/demo only.)
-- =====================================================================

INSERT INTO users (id, full_name, email, hashed_password, role)
VALUES (
    uuid_generate_v4(),
    'Platform Administrator',
    'admin@aiops.local',
    '$2b$12$CwTycUXWue0Thq9StjUM0uJ8Q0jJlUeQqQdOZ1r6l6z6l6z6l6z6l6',
    'ADMIN'
) ON CONFLICT DO NOTHING;

INSERT INTO servers (id, hostname, ip_address, environment, cloud_provider, region, instance_type, status, api_key)
VALUES
    (uuid_generate_v4(), 'prod-web-01', '10.0.1.11', 'PRODUCTION', 'AWS', 'us-east-1', 't3.medium', 'HEALTHY', encode(gen_random_bytes(32), 'hex')),
    (uuid_generate_v4(), 'prod-web-02', '10.0.1.12', 'PRODUCTION', 'AWS', 'us-east-1', 't3.medium', 'WARNING', encode(gen_random_bytes(32), 'hex')),
    (uuid_generate_v4(), 'prod-db-01',  '10.0.2.10', 'PRODUCTION', 'AWS', 'us-east-1', 'db.r5.large', 'HEALTHY', encode(gen_random_bytes(32), 'hex')),
    (uuid_generate_v4(), 'staging-api-01', '10.0.5.20', 'STAGING', 'Azure', 'eastus', 'Standard_B2s', 'CRITICAL', encode(gen_random_bytes(32), 'hex'))
ON CONFLICT DO NOTHING;
