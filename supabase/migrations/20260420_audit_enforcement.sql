-- Audit Arşiv Güvenliği & Mühürleme Entegrasyonu

-- 1. Randevuların Değiştirilmesini Engelleyen Tetikleyici Fonksiyonu
-- Bu fonksiyon, is_sealed = true olan kayıtların UPDATE veya DELETE edilmesini engeller.
CREATE OR REPLACE FUNCTION public.check_appointment_seal()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer kayıt mühürlenmişse ve kullanıcı SaaS_Owner (Sistem Sahibi) değilse işlemi engelle
    IF (OLD.is_sealed = true) THEN
        -- auth.uid() üzerinden rol kontrolü (Sadece SaaS_Owner istisnadır)
        IF NOT EXISTS (
            SELECT 1 FROM public.app_users 
            WHERE id = auth.uid() AND role = 'SaaS_Owner'
        ) THEN
            RAISE EXCEPTION 'Bu randevu gün sonu işlemiyle mühürlenmiştir ve değiştirilemez.';
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Tetikleyicileri (Trigger) Tanımla
DROP TRIGGER IF EXISTS trg_prevent_sealed_update ON public.appointments;
CREATE TRIGGER trg_prevent_sealed_update
    BEFORE UPDATE OR DELETE ON public.appointments
    FOR EACH ROW
    EXECUTE FUNCTION public.check_appointment_seal();

-- 3. Otomatik Mühürleme Fonksiyonu (Z-Raporu Oluşunca)
-- Bir Z-Raporu oluşturulduğunda, o güne ait tüm randevuları otomatik mühürler.
CREATE OR REPLACE FUNCTION public.auto_seal_appointments()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.appointments
    SET is_sealed = true
    WHERE business_id = NEW.business_id
      AND branch_id = NEW.branch_id
      AND date = NEW.report_date;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Z-Raporu Tetikleyicisi
DROP TRIGGER IF EXISTS trg_auto_seal_on_zreport ON public.z_reports;
CREATE TRIGGER trg_auto_seal_on_zreport
    AFTER INSERT ON public.z_reports
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_seal_appointments();

-- Tablo Açıklamaları
COMMENT ON FUNCTION public.check_appointment_seal IS 'Mühürlü randevuların bütünlüğünü korur.';
COMMENT ON FUNCTION public.auto_seal_appointments IS 'Rapor üretildiğinde randevuları otomatik kilitler.';
