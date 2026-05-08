-- AURA SPA SaaS ERP - TECHNOGYM INTELLIGENCE ENGINE
-- Amaç: Biyometrik verileri otomatik olarak finansal fırsatlara dönüştüren otonom tetikleyiciler.

-- 1. Zeka Çıktıları Tablosu
CREATE TABLE IF NOT EXISTS technogym_intelligence_insights (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    biometric_id UUID REFERENCES customer_biometrics(id) ON DELETE CASCADE,
    
    type TEXT NOT NULL, -- 'upsell', 'retention', 'recovery'
    title TEXT NOT NULL,
    description TEXT,
    potential_revenue NUMERIC(10,2) DEFAULT 0,
    is_converted BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Otonom Analiz Fonksiyonu
CREATE OR REPLACE FUNCTION fn_analyze_technogym_biometrics()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_name TEXT;
BEGIN
    -- Müşteri ismini al
    SELECT name INTO v_customer_name FROM customers WHERE id = NEW.customer_id;

    -- DURUM 1: Yüksek Kas Yorgunluğu -> Masaj Satışı (Recovery)
    IF NEW.muscle_fatigue_level = 'High' THEN
        INSERT INTO technogym_intelligence_insights (business_id, customer_id, biometric_id, type, title, description, potential_revenue)
        VALUES (
            NEW.business_id, 
            NEW.customer_id, 
            NEW.id, 
            'recovery', 
            'Acil Toparlanma Masajı Gerekli', 
            v_customer_name || ' için yüksek kas yorgunluğu tespit edildi. 24 saat içinde masaj önerilmeli.',
            450.00 -- Ortalama masaj geliri
        );
    END IF;

    -- DURUM 2: Wellness Age > Real Age -> Paket Satışı (Transformation)
    IF NEW.wellness_age > 40 THEN
        INSERT INTO technogym_intelligence_insights (business_id, customer_id, biometric_id, type, title, description, potential_revenue)
        VALUES (
            NEW.business_id, 
            NEW.customer_id, 
            NEW.id, 
            'upsell', 
            'Vücut Yenileme Programı Önerisi', 
            v_customer_name || ' için Wellness Age kritik seviyede. Personal Training paketi teklif edilmeli.',
            2500.00 -- Ortalama paket geliri
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tetikleyici (Trigger): Veri geldiği an analizi başlat
DROP TRIGGER IF EXISTS trg_technogym_intelligence ON customer_biometrics;
CREATE TRIGGER trg_technogym_intelligence
AFTER INSERT ON customer_biometrics
FOR EACH ROW
EXECUTE FUNCTION fn_analyze_technogym_biometrics();

-- 4. RLS Güvenliği
ALTER TABLE technogym_intelligence_insights ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_policy_insights" ON technogym_intelligence_insights;
CREATE POLICY "access_policy_insights" ON technogym_intelligence_insights
FOR ALL TO authenticated USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

COMMENT ON TABLE technogym_intelligence_insights IS 'Technogym verilerinden üretilen otonom gelir fırsatları.';
COMMENT ON FUNCTION fn_analyze_technogym_biometrics IS 'Technogym verilerini paraya dönüştüren otonom analiz motoru.';
