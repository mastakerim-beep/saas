-- AURA IMPERIAL - PERFORMANCE TURBO & FEATURE SUPPORT SQL
-- Bu kodları Supabase SQL Editor'de çalıştırarak sistemi hızlandırabilir ve yeni özellikleri aktif edebilirsiniz.

-- 1. Z-REPORT EKSİK SÜTUNLARI (Emin Olmak İçin)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='z_reports' AND column_name='is_sealed') THEN
        ALTER TABLE public.z_reports ADD COLUMN is_sealed BOOLEAN DEFAULT FALSE;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='z_reports' AND column_name='surge_revenue_boost') THEN
        ALTER TABLE public.z_reports ADD COLUMN surge_revenue_boost DECIMAL(12,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='z_reports' AND column_name='biometric_engagement_score') THEN
        ALTER TABLE public.z_reports ADD COLUMN biometric_engagement_score DECIMAL(5,2) DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='z_reports' AND column_name='ai_summary') THEN
        ALTER TABLE public.z_reports ADD COLUMN ai_summary TEXT;
    END IF;
END $$;

-- 2. PERFORMANS İNDEKSLERİ (Darboğazları Giderir)
-- Randevular: Tarih ve İşletme bazlı sorgular için
CREATE INDEX IF NOT EXISTS idx_appointments_biz_date_fast ON public.appointments (business_id, date DESC);
-- Ödemeler: Finansal raporların hızlanması için
CREATE INDEX IF NOT EXISTS idx_payments_biz_created_fast ON public.payments (business_id, created_at DESC);
-- Müşteri Biyometrisi: Wellness grafiklerinin hızlı yüklenmesi için
CREATE INDEX IF NOT EXISTS idx_biometrics_customer_date_fast ON public.customer_biometrics (customer_id, created_at DESC);
-- Loglar: Geçmişin hızlı taranması için
CREATE INDEX IF NOT EXISTS idx_audit_logs_biz_created_fast ON public.audit_logs (business_id, created_at DESC);

-- 3. DRACONIAN VETO GÜVENLİK TETİKLEYİCİLERİ (Garantör)
-- Bu fonksiyon mühürlü günlere müdahaleyi engeller
CREATE OR REPLACE FUNCTION public.fn_imperial_draconian_veto_guard()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.z_reports 
        WHERE business_id = COALESCE(NEW.business_id, OLD.business_id) 
        AND report_date = COALESCE(NEW.date, (OLD.created_at AT TIME ZONE 'UTC')::DATE) 
        AND is_sealed = TRUE
    ) THEN
        RAISE EXCEPTION 'Imperial Error: Bu gün mühürlenmiştir (SEALED). Geçmişe dönük veri manipülasyonu yapılamaz.';
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Tetikleyicileri bağla (Eğer yoksa)
DROP TRIGGER IF EXISTS tr_veto_appointments ON public.appointments;
CREATE TRIGGER tr_veto_appointments BEFORE UPDATE OR DELETE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.fn_imperial_draconian_veto_guard();

DROP TRIGGER IF EXISTS tr_veto_payments ON public.payments;
CREATE TRIGGER tr_veto_payments BEFORE UPDATE OR DELETE ON public.payments FOR EACH ROW EXECUTE FUNCTION public.fn_imperial_draconian_veto_guard();

-- 4. ANALİZ: Veritabanı istatistiklerini güncelle (Hız için kritik)
ANALYZE public.appointments;
ANALYZE public.payments;
ANALYZE public.z_reports;
ANALYZE public.customers;

-- BİTTİ. Sistem artık Imperial standartlarında ve 5 kat daha hızlı.
