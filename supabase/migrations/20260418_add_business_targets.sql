-- Add business targets
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS daily_target NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS monthly_target NUMERIC DEFAULT 0;
