-- ============================================================
-- SAAS SUPREME AUTHORITY - Z-REPORT ENFORCEMENT & SEALING
-- ============================================================
-- Bu migrasyon, Aura AI Kapanış modülünü veritabanı seviyesinde 
-- mühürler ve "Imperial" denetim mekanizmasını devreye alır.

-- 1. Z-Report Tablosunda İyileştirmeler
ALTER TABLE public.z_reports 
ADD COLUMN IF NOT EXISTS closed_by_name TEXT;

-- 2. Otomatik Randevu Mühürleme Fonksiyonu
-- Bir Z-Raporu oluşturulduğunda, o günkü tüm randevuları mühürler.
CREATE OR REPLACE FUNCTION public.fn_seal_appointments_on_zreport()
RETURNS TRIGGER AS $$
BEGIN
    -- İlgili işletme ve şubedeki, rapor tarihindeki tüm randevuları mühürle
    UPDATE public.appointments
    SET is_sealed = true,
        updated_at = now()
    WHERE business_id = NEW.business_id
      AND (branch_id = NEW.branch_id OR NEW.branch_id IS NULL)
      AND date = NEW.report_date;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Z-Raporu eklendiği anda çalışır
DROP TRIGGER IF EXISTS tr_seal_appointments ON public.z_reports;
CREATE TRIGGER tr_seal_appointments
AFTER INSERT ON public.z_reports
FOR EACH ROW
EXECUTE FUNCTION public.fn_seal_appointments_on_zreport();

-- 3. Mühürlü Kayıtları Koruma (Data Integrity)
-- Mühürlenmiş randevuların silinmesini veya değiştirilmesini engeller.
-- Sadece SaaS_Owner bu mühürü kırabilir.
CREATE OR REPLACE FUNCTION public.fn_check_sealed_appointment()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer kayıt mühürlüyse ve işlemi yapan SaaS_Owner değilse engelle
    IF (OLD.is_sealed = true) THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.app_users 
            WHERE id = auth.uid() AND role = 'SaaS_Owner'
        ) THEN
            RAISE EXCEPTION 'Bu randevu mühürlenmiştir (Sealed) ve değiştirilemez. Supreme Authority onayı gereklidir.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS tr_protect_sealed_appointments ON public.appointments;
CREATE TRIGGER tr_protect_sealed_appointments
BEFORE UPDATE OR DELETE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.fn_check_sealed_appointment();

-- 4. IMPERIAL DAILY BRIEFING - Yönetici Özet Görünümü
CREATE OR REPLACE VIEW public.v_imperial_daily_briefing AS
SELECT 
    z.business_id,
    z.report_date,
    z.expected_nakit + z.expected_kart as total_expected,
    z.actual_nakit + z.actual_kart as total_actual,
    z.total_difference,
    z.ai_summary,
    z.closed_by_name,
    (SELECT count(*) FROM public.v_hakimiyet_leaks l WHERE l.business_id = z.business_id AND l.date = z.report_date) as leak_count,
    z.created_at as sealed_at
FROM public.z_reports z;

GRANT SELECT ON public.v_imperial_daily_briefing TO authenticated;

-- 5. Eksik İndeksler
CREATE INDEX IF NOT EXISTS idx_appointments_business_date_sealed ON public.appointments(business_id, date, is_sealed);
CREATE INDEX IF NOT EXISTS idx_z_reports_lookup ON public.z_reports(business_id, branch_id, report_date);

COMMENT ON TRIGGER tr_seal_appointments ON public.z_reports IS 'Z-Raporu oluşturulduğunda o günkü randevuları otomatik mühürler.';
COMMENT ON TRIGGER tr_protect_sealed_appointments ON public.appointments IS 'Mühürlü randevuların yetkisiz değiştirilmesini engeller.';
