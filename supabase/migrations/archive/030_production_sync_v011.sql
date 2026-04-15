-- Production Sync Script v0.1.1
-- Ensures all newer columns exist in all environments

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='payments' AND column_name='reference_code') THEN
        ALTER TABLE payments ADD COLUMN reference_code TEXT;
    END IF;
END $$;

COMMENT ON COLUMN payments.reference_code IS 'Unique payment transaction code (e.g. 6C37R)';
