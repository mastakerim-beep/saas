-- 2026-05-09: Autonomous Z-Report & Strategic Sealing (Otonom Z-Raporu)
-- Bu migrasyon, gün sonu verilerini mühürleyen ve AI analizi başlatan yapıyı kurar.

-- 1. Z-Raporu Tablosu (Imperial Standartlarında)
CREATE TABLE IF NOT EXISTS public.z_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    report_date DATE NOT NULL DEFAULT CURRENT_DATE,
    total_revenue DECIMAL(12,2) DEFAULT 0,
    total_appointments INTEGER DEFAULT 0,
    new_customers INTEGER DEFAULT 0,
    surge_revenue_boost DECIMAL(12,2) DEFAULT 0, -- Surge pricing'den gelen ekstra kazanç
    biometric_engagement_score DECIMAL(5,2), -- Technogym verisinden gelen doluluk/enerji skoru
    ai_summary TEXT, -- Günün AI tarafından özeti
    is_sealed BOOLEAN DEFAULT FALSE, -- Draconian Veto: Mühürlendikten sonra bu güne veri eklenemez
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, report_date)
);

-- RLS
ALTER TABLE public.z_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Biz owners can view their own Z-reports" ON public.z_reports;
CREATE POLICY "Biz owners can view their own Z-reports" ON public.z_reports
    FOR SELECT USING (auth.uid() IN (SELECT id FROM public.app_users WHERE business_id = z_reports.business_id));

-- 2. Draconian Veto Trigger: Mühürlü Günlere Müdahaleyi Engelle
CREATE OR REPLACE FUNCTION public.fn_prevent_edit_on_sealed_day()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer ilgili günün Z-Raporu mühürlenmişse, o güne ait randevu/ödeme silinemez/değiştirilemez.
    IF EXISTS (
        SELECT 1 FROM public.z_reports 
        WHERE business_id = COALESCE(NEW.business_id, OLD.business_id) 
        AND report_date = COALESCE(NEW.date, OLD.date) 
        AND is_sealed = TRUE
    ) THEN
        RAISE EXCEPTION 'Imperial Error: Bu gün mühürlenmiştir (Sealed). Geçmişe dönük veri manipülasyonu yapılamaz.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Not: Bu trigger randevu ve finans tablolarına bağlanmalıdır.
-- Örn: CREATE TRIGGER tr_veto_appointments BEFORE INSERT OR UPDATE OR DELETE ON public.appointments FOR EACH ROW EXECUTE FUNCTION fn_prevent_edit_on_sealed_day();

-- 3. Otonom Rapor Üretici Fonksiyon
CREATE OR REPLACE FUNCTION public.fn_generate_daily_z_report(target_business_id UUID)
RETURNS VOID AS $$
DECLARE
    daily_rev DECIMAL(12,2);
    app_count INTEGER;
    new_cust INTEGER;
BEGIN
    -- Temel metrikleri topla
    SELECT COALESCE(SUM(total_amount), 0) INTO daily_rev FROM public.appointments WHERE business_id = target_business_id AND date = CURRENT_DATE;
    SELECT COUNT(*) INTO app_count FROM public.appointments WHERE business_id = target_business_id AND date = CURRENT_DATE;
    SELECT COUNT(*) INTO new_cust FROM public.customers WHERE business_id = target_business_id AND created_at::DATE = CURRENT_DATE;
    
    -- Z-Raporunu oluştur veya güncelle (Imperial Guard Logic)
    INSERT INTO public.z_reports (business_id, report_date, total_revenue, total_appointments, new_customers, is_sealed)
    VALUES (target_business_id, CURRENT_DATE, daily_rev, app_count, new_cust, TRUE)
    ON CONFLICT (business_id, report_date) DO UPDATE SET
        total_revenue = CASE WHEN z_reports.is_sealed = FALSE THEN EXCLUDED.total_revenue ELSE z_reports.total_revenue END,
        total_appointments = EXCLUDED.total_appointments,
        new_customers = EXCLUDED.new_customers,
        is_sealed = TRUE,
        ai_summary = COALESCE(z_reports.ai_summary, 'Autonomous system consolidation completed.');

    -- AI Analiz Kuyruğuna Ekle (Gelecek sprint: Edge function tetikleme)
    PERFORM public.fn_log_automation_event(
        target_business_id, 
        'Z_REPORT_GENERATED', 
        jsonb_build_object('revenue', daily_rev, 'date', CURRENT_DATE)
    );
END;
$$ LANGUAGE plpgsql;

-- 4. CRON JOB: Her gece tüm işletmeler için Z-Raporu üret
-- Dikkat: Bu bölüm pg_cron extension gerektirir.
-- SELECT cron.schedule('0 23 * * *', 'SELECT public.fn_generate_daily_z_report(id) FROM public.businesses WHERE status = ''active'';');
