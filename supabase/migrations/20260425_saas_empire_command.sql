-- Migration: Empire Command Center (Draconian Veto, Tribute Score)
-- Multi-tenant SaaS Structure Compliance

-- 1. Tribute Score for Customers
ALTER TABLE customers ADD COLUMN IF NOT EXISTS tribute_score INT NOT NULL DEFAULT 50;

-- 2. Draconian Veto properties on Payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS draconian_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE payments ADD COLUMN IF NOT EXISTS draconian_veto_reason TEXT;

-- 3. Draconian Veto properties on Appointments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS draconian_status VARCHAR(20) NOT NULL DEFAULT 'APPROVED';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS draconian_veto_reason TEXT;

-- Indexing for fast veto queries across the SaaS platform
CREATE INDEX IF NOT EXISTS idx_payments_veto ON payments(business_id, draconian_status) WHERE draconian_status = 'PENDING_APPROVAL';
CREATE INDEX IF NOT EXISTS idx_appointments_veto ON appointments(business_id, draconian_status) WHERE draconian_status = 'PENDING_APPROVAL';
CREATE INDEX IF NOT EXISTS idx_customers_tribute ON customers(business_id, tribute_score);

-- Notify structural updates for realtime clients or queries
COMMENT ON COLUMN customers.tribute_score IS 'Calculated tribute score for customer layout, max defines highest priority.';
COMMENT ON COLUMN payments.draconian_status IS 'Veto system status: APPROVED, PENDING_APPROVAL, REJECTED';
