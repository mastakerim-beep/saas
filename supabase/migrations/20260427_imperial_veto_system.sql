-- ============================================================
-- IMPERIAL VETO SYSTEM - DATABASE INTEGRATION
-- ============================================================
-- Bu migrasyon, yönetici müdahale (Veto) sistemini database 
-- seviyesinde destekler ve takip edilebilir kılar.

-- 1. Z-Reports Tablosuna Müdahale Farkı Sütunu Ekleme
ALTER TABLE public.z_reports 
ADD COLUMN IF NOT EXISTS intervention_delta NUMERIC DEFAULT 0;

-- 2. Mühürlü Kayıt Koruma Mantığını Güncelleme
-- Artık Sadece SaaS_Owner değil, Business_Owner (İşletme Sahibi) de
-- mühürü kırabilir (ancak bu işlem Audit Log'da takip edilir).
CREATE OR REPLACE FUNCTION public.fn_check_sealed_appointment()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer kayıt mühürlüyse kontrol et
    IF (OLD.is_sealed = true) THEN
        -- Eğer işlemi yapan kişi SaaS_Owner veya Business_Owner değilse engelle
        IF NOT EXISTS (
            SELECT 1 FROM public.app_users 
            WHERE id = auth.uid() AND role IN ('SaaS_Owner', 'Business_Owner')
        ) THEN
            RAISE EXCEPTION 'Bu kayıt mühürlenmiştir. Müdahale yetkiniz bulunmamaktadır. İmparatorluk Vetosu gereklidir.';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Audit Logs İyileştirmesi
-- Audit logların daha hızlı sorgulanması için indeksler
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_date ON public.audit_logs(action, date);

-- 4. Imperial Daily Briefing View Güncellemesi
-- Müdahale farkını görünüme ekle
DROP VIEW IF EXISTS public.v_imperial_daily_briefing;
CREATE OR REPLACE VIEW public.v_imperial_daily_briefing AS
SELECT 
    z.business_id,
    z.report_date,
    z.expected_nakit + z.expected_kart as total_expected,
    z.actual_nakit + z.actual_kart as total_actual,
    z.total_difference,
    z.intervention_delta, -- Yeni kolon
    z.ai_summary,
    z.closed_by_name,
    (SELECT count(*) FROM public.v_hakimiyet_leaks l WHERE l.business_id = z.business_id AND l.date = z.report_date) as leak_count,
    z.created_at as sealed_at
FROM public.z_reports z;

GRANT SELECT ON public.v_imperial_daily_briefing TO authenticated;

COMMENT ON COLUMN public.z_reports.intervention_delta IS 'Yönetici müdahalesi (Veto) ile oluşan ciro düzeltme miktarı.';
