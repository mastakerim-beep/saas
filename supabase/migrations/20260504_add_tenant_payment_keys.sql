-- Migration: Add Tenant Iyzico Keys
-- Description: Allows each business to provide their own Iyzico API credentials.

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS iyzico_api_key TEXT,
ADD COLUMN IF NOT EXISTS iyzico_secret_key TEXT,
ADD COLUMN IF NOT EXISTS iyzico_base_url TEXT DEFAULT 'https://api.iyzipay.com';

-- Security: Ensure only superadmins or business owners can see these keys via RLS if needed,
-- but since they are in the business table, the standard business RLS usually covers it.
COMMENT ON COLUMN businesses.iyzico_api_key IS 'Tenant specific Iyzico API Key';
COMMENT ON COLUMN businesses.iyzico_secret_key IS 'Tenant specific Iyzico Secret Key';
