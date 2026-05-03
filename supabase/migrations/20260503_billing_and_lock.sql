-- AURA SPA SaaS ERP - BILLING & SYSTEM LOCK ENHANCEMENT
-- Tarih: 2026-05-03

-- 1. BUSINESSES TABLOSUNA GEREKLİ KOLONLARI EKLE
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'paid'; -- paid, overdue, trial, suspended
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS last_payment_date TIMESTAMPTZ;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ;

-- 2. OTOMATİK SİSTEM KİLİTLEME FONKSİYONU
-- Expiry date geçmiş olan veya ödemesi geciken işletmeleri otomatik kilitler (Cron ile tetiklenecek)
CREATE OR REPLACE FUNCTION check_and_lock_businesses() RETURNS VOID AS $$
BEGIN
    UPDATE businesses
    SET 
        is_suspended = true,
        suspension_reason = 'Abonelik süresi sona erdi veya ödeme gecikmesi mevcut.',
        payment_status = 'overdue'
    WHERE 
        status = 'active' 
        AND is_suspended = false
        AND (
            (expiry_date < CURRENT_DATE) 
            OR (trial_ends_at < NOW() AND plan = 'Basic')
        );
END;
$$ LANGUAGE plpgsql;

-- 3. AUDIT LOG İÇİN TRIGGER (OPSİYONEL - TAKİP AMAÇLI)
-- Bir işletme kilitlendiğinde audit_logs tablosuna kayıt atar
CREATE OR REPLACE FUNCTION log_business_suspension() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_suspended = true AND OLD.is_suspended = false THEN
        INSERT INTO audit_logs (business_id, action, new_value, "user")
        VALUES (NEW.id, 'SİSTEM KİLİTLENDİ', NEW.suspension_reason, 'SYSTEM');
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_business_suspension ON businesses;
CREATE TRIGGER tr_business_suspension
    AFTER UPDATE ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION log_business_suspension();

-- 4. OTOMATİK DENEME SÜRESİ TANIMLAMA (14 GÜN)
CREATE OR REPLACE FUNCTION set_default_trial_period() RETURNS TRIGGER AS $$
BEGIN
    IF NEW.trial_ends_at IS NULL THEN
        NEW.trial_ends_at := NOW() + INTERVAL '14 days';
        NEW.payment_status := 'trial';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_set_trial_period ON businesses;
CREATE TRIGGER tr_set_trial_period
    BEFORE INSERT ON businesses
    FOR EACH ROW
    EXECUTE FUNCTION set_default_trial_period();

