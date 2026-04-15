-- Migration: Add Gift/Ikram fields and Manager PIN
-- Date: 2026-04-15

-- Add manager_pin to businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS manager_pin TEXT DEFAULT '0000';

-- Add gift related fields to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS is_gift BOOLEAN DEFAULT FALSE;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS original_price NUMERIC DEFAULT 0;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS authorized_by UUID REFERENCES app_users(id);

-- Add gift note and sold_products to payments
ALTER TABLE payments ADD COLUMN IF NOT EXISTS gift_note TEXT;
ALTER TABLE payments ADD COLUMN IF NOT EXISTS sold_products JSONB DEFAULT '[]';

-- Update RLS if necessary (assuming current policies allow select/insert for authorized users)
-- No changes needed if policy is business_id based.
