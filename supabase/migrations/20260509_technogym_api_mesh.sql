-- AURA SPA SaaS ERP - TECHNOGYM API MESH MIGRATION
-- Purpose: Support real webhook integrations by linking external hardware IDs to Aura customers.

-- 1. Add external_member_id to customers table
ALTER TABLE customers ADD COLUMN IF NOT EXISTS external_member_id VARCHAR(255);

-- 2. Add index for faster webhook lookup
CREATE INDEX IF NOT EXISTS idx_customers_external_member_id ON customers(business_id, external_member_id);

-- 3. Enhance customer_biometrics to store raw telemetry JSON
ALTER TABLE customer_biometrics ADD COLUMN IF NOT EXISTS raw_telemetry JSONB;

COMMENT ON COLUMN customers.external_member_id IS 'External ID from Technogym MyWellness Cloud for API mapping.';
COMMENT ON COLUMN customer_biometrics.raw_telemetry IS 'Raw JSON payload received from the hardware webhook for future AI model training.';
