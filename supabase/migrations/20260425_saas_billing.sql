-- Migration: SaaS Billing & Tax Information
-- Adds tax context, MRR capabilities, and suspension handling to businesses

-- 1. Add Billing and Tax Fields to Businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100);
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS mrr NUMERIC(10, 2) DEFAULT 0;

-- 2. Add Suspension and Grace Period Fields
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMPTZ;

-- 3. Update Existing Default Columns if not exist
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'Basic';
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS max_users INT DEFAULT 5;

-- 4. Index on suspension status for rapid checks
CREATE INDEX IF NOT EXISTS idx_businesses_suspended ON businesses(is_suspended);
