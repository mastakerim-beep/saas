-- AURA SPA SaaS ERP - TECHNOGYM ECOSYSTEM INTEGRATION (Roadmap Stage 2)
-- Tarih: 2026-04-28
-- Amaç: Technogym Mywellness verileriyle entegre biyometrik takip ve "Wellness Age" yönetimi.

-- 1. Biyometrik Veri Tablosu (Technogym Checkup ve Mywellness Cloud Entegrasyonu için)
CREATE TABLE IF NOT EXISTS customer_biometrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    
    -- Technogym Temel Metrikler
    weight NUMERIC(5,2),
    body_fat_percent NUMERIC(5,2),
    muscle_fat_percent NUMERIC(5,2),
    visceral_fat_level INT,
    basal_metabolism INT,
    wellness_age INT, -- Mywellness Ecosystem tarafından hesaplanan 'Wellness Age'
    
    -- Hareket ve Performans (Technogym Checkup verileri)
    mobility_score INT, -- 0-100
    balance_score INT, -- 0-100
    strength_score INT, -- 0-100
    muscle_fatigue_level TEXT, -- 'High', 'Medium', 'Low' (AI Analizi için kritik)
    
    -- Kaynak Bilgisi
    source TEXT DEFAULT 'Technogym_Mywellness', -- 'Manual', 'Technogym_Mywellness', 'Smart_Scale'
    last_sync_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Technogym Entegrasyon Günlüğü (API Sync takibi için)
CREATE TABLE IF NOT EXISTS technogym_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    status TEXT NOT NULL, -- 'Success', 'Failed'
    records_synced INT DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. RLS GÜVENLİĞİ
ALTER TABLE customer_biometrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE technogym_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_policy_customer_biometrics" ON customer_biometrics;
CREATE POLICY "access_policy_customer_biometrics" ON customer_biometrics 
FOR ALL TO authenticated USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

DROP POLICY IF EXISTS "access_policy_technogym_sync_logs" ON technogym_sync_logs;
CREATE POLICY "access_policy_technogym_sync_logs" ON technogym_sync_logs 
FOR ALL TO authenticated USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- 4. REALTIME PUBLICATION
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'customer_biometrics') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_biometrics;
    END IF;
END $$;

-- 5. PERFORMANS İNDEKSİ
CREATE INDEX IF NOT EXISTS idx_biometrics_customer_id ON customer_biometrics(customer_id);
CREATE INDEX IF NOT EXISTS idx_biometrics_business_id ON customer_biometrics(business_id);

COMMENT ON TABLE customer_biometrics IS 'Technogym ve biyometrik veri entegrasyonu için lüks wellness takip tablosu.';
