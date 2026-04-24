-- 20260424_package_lifecycle_management.sql
-- Aura Spa ERP: Paket Yaşam Döngüsü ve İşlem Geçmişi

-- 1. Paket Tanımlarına Geçerlilik Süresi Ekleme
ALTER TABLE package_definitions 
ADD COLUMN IF NOT EXISTS validity_days INTEGER DEFAULT 365;

-- 2. Mevcut Paketlere Durum ve Bitiş Tarihi Ekleme
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='packages' AND column_name='status') THEN
        ALTER TABLE packages ADD COLUMN status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'finished', 'frozen'));
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE table_name='packages' AND column_name='expiry') THEN
        ALTER TABLE packages ADD COLUMN expiry DATE;
    END IF;
END $$;

-- 3. Paket İşlem Geçmişi Tablosu
CREATE TABLE IF NOT EXISTS package_usage_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    package_id UUID REFERENCES packages(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    action TEXT NOT NULL, -- 'use', 'settle', 'extend', 'rollover'
    sessions_impact INTEGER DEFAULT 0,
    appointment_id UUID REFERENCES appointments(id) ON DELETE SET NULL,
    note TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 4. RLS Politikaları
ALTER TABLE package_usage_history ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'package_usage_history' AND policyname = 'Users can view their business package history') THEN
        CREATE POLICY "Users can view their business package history" ON package_usage_history
        FOR ALL USING (business_id = get_my_business_id());
    END IF;
END $$;

-- SaaS Owner Authority
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'package_usage_history' AND policyname = 'SaaS Owner full access to package history') THEN
        CREATE POLICY "SaaS Owner full access to package history" ON package_usage_history
        FOR ALL USING (
            get_my_role() = 'SaaS_Owner'
        );
    END IF;
END $$;

-- 5. Performans İndeksleri
CREATE INDEX IF NOT EXISTS idx_package_usage_package_id ON package_usage_history(package_id);
CREATE INDEX IF NOT EXISTS idx_package_usage_customer_id ON package_usage_history(customer_id);
CREATE INDEX IF NOT EXISTS idx_package_expiry ON packages(expiry);
