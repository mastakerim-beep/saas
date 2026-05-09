-- AURA SPA SaaS ERP - AI AUTOMATION & INTELLIGENCE v2.0
-- Amaç: Technogym verisi ile Pazarlama Otomasyonunu (Marketing Rules) birbirine bağlamak.

-- 1. Pazarlama kuralları için trigger_type kısıtlamasını güncelle (Technogym ekle)
ALTER TABLE marketing_rules DROP CONSTRAINT IF EXISTS marketing_rules_trigger_type_check;
ALTER TABLE marketing_rules ADD CONSTRAINT marketing_rules_trigger_type_check 
CHECK (trigger_type IN ('NEW_CUSTOMER', 'CHURN_RISK', 'LOYALTY_POINTS', 'BIRTHDAY', 'TECHNOGYM_BIOMETRIC'));

-- 2. Zeka Motorunu Güncelle: Pazarlama Kurallarıyla Bağlantı Kur
CREATE OR REPLACE FUNCTION fn_analyze_technogym_biometrics_v2()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_name TEXT;
    v_rule RECORD;
    v_message TEXT;
BEGIN
    -- Müşteri bilgilerini al
    SELECT name INTO v_customer_name FROM customers WHERE id = NEW.customer_id;

    -- A. Stratejik Analiz: Yüksek Yorgunluk Durumu
    IF NEW.muscle_fatigue_level = 'High' THEN
        
        -- 1. Technogym Intelligence Tablosuna Kaydet (Yönetici Görsün)
        INSERT INTO technogym_intelligence_insights (business_id, customer_id, biometric_id, type, title, description, potential_revenue)
        VALUES (
            NEW.business_id, NEW.customer_id, NEW.id, 
            'recovery', 'Yüksek Yorgunluk Sinyali', 
            v_customer_name || ' için otomatik toparlanma süreci öneriliyor.', 
            450.00
        );

        -- 2. Otomasyon Kurallarını Kontrol Et (Müşteriye Mesaj Gönder)
        FOR v_rule IN 
            SELECT * FROM marketing_rules 
            WHERE business_id = NEW.business_id 
            AND trigger_type = 'TECHNOGYM_BIOMETRIC' 
            AND is_active = true
        LOOP
            -- Şablonu kişiselleştir
            v_message := REPLACE(v_rule.message_template, '{customer}', v_customer_name);
            
            -- Bildirim Günlüğüne (Notification Logs) ekle
            INSERT INTO notification_logs (business_id, customer_id, type, title, message, status)
            VALUES (NEW.business_id, NEW.customer_id, 'SMS', v_rule.name, v_message, 'PENDING');
            
            -- AI Insight olarak da logla
            INSERT INTO ai_insights (business_id, type, title, insight, priority)
            VALUES (NEW.business_id, 'marketing', 'Otomasyon Tetiklendi: ' || v_rule.name, v_customer_name || ' için biyometrik tetikleyici çalıştı.', 'high');
        END LOOP;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger'ı Yeni Fonksiyona Yönlendir
DROP TRIGGER IF EXISTS trg_technogym_intelligence ON customer_biometrics;
CREATE TRIGGER trg_technogym_intelligence
AFTER INSERT ON customer_biometrics
FOR EACH ROW
EXECUTE FUNCTION fn_analyze_technogym_biometrics_v2();

COMMENT ON FUNCTION fn_analyze_technogym_biometrics_v2 IS 'Technogym verilerini analiz edip pazarlama otomasyonlarını tetikleyen gelişmiş AI motoru.';
