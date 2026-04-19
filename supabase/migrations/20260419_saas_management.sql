-- Aura OS SaaS Management v5.0 Migration
-- Cari bilgiler, abonelik takibi ve yönetici yetkileri için gerekli alanlar

ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS tax_id VARCHAR(50),
ADD COLUMN IF NOT EXISTS tax_office VARCHAR(100),
ADD COLUMN IF NOT EXISTS billing_address TEXT,
ADD COLUMN IF NOT EXISTS payment_status VARCHAR(20) DEFAULT 'paid',
ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_payment_amount NUMERIC,
ADD COLUMN IF NOT EXISTS is_manual_override BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS subscription_history JSONB DEFAULT '[]';

-- Audit log for migration
COMMENT ON COLUMN businesses.tax_id IS 'İşletme Vergi Kimlik Numarası';
COMMENT ON COLUMN businesses.is_manual_override IS 'Sovereign tarafından sağlanan manuel süresiz erişim izni';
COMMENT ON COLUMN businesses.subscription_history IS 'Geçmiş ödemeler ve abonelik yenileme kayıtları';
