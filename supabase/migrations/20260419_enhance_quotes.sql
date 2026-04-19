-- AURA SPA SaaS ERP - Enhance Quotes Migration
-- Adds CRM and Sale-Conversion fields to the quotes table

-- 1. Check and add columns if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'discount_rate') THEN
        ALTER TABLE quotes ADD COLUMN discount_rate NUMERIC(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'service_id') THEN
        ALTER TABLE quotes ADD COLUMN service_id UUID REFERENCES services(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'package_definition_id') THEN
        ALTER TABLE quotes ADD COLUMN package_definition_id UUID REFERENCES package_definitions(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'follow_up_date') THEN
        ALTER TABLE quotes ADD COLUMN follow_up_date DATE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'follow_up_time') THEN
        ALTER TABLE quotes ADD COLUMN follow_up_time TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'quotes' AND column_name = 'reference_code') THEN
        ALTER TABLE quotes ADD COLUMN reference_code TEXT;
    END IF;
END $$;

-- 2. Indexes for search performance
CREATE INDEX IF NOT EXISTS idx_quotes_follow_up ON quotes(follow_up_date) WHERE follow_up_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
