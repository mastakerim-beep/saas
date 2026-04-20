-- EndOfDayAI ve Denetim Sistemi İçin Veritabanı Alt Yapısı

-- 1. Z-Raporları Tablosu (Günlük Kapatma Raporları)
CREATE TABLE IF NOT EXISTS public.z_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES public.branches(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    expected_nakit NUMERIC DEFAULT 0,
    actual_nakit NUMERIC DEFAULT 0,
    expected_kart NUMERIC DEFAULT 0,
    actual_kart NUMERIC DEFAULT 0,
    total_difference NUMERIC DEFAULT 0,
    ai_summary TEXT, -- AI'ın o günkü genel analizi ve içgörüleri
    notes TEXT,
    closed_by UUID REFERENCES public.app_users(id),
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(branch_id, report_date)
);

-- 2. Randevular Tablosuna Denetim Kolonları
-- is_paid: Ödeme alınıp alınmadığını takip eder (Leakage control için)
-- is_sealed: Gün kapatıldıktan sonra randevunun değiştirilmesini engellemek için
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS is_sealed BOOLEAN DEFAULT false;

-- 3. RLS (Row Level Security) Ayarları
ALTER TABLE public.z_reports ENABLE ROW LEVEL SECURITY;

-- Select Politikası: İşletme kullanıcıları kendi raporlarını görebilir
DROP POLICY IF EXISTS "Users can view their business Z-reports" ON public.z_reports;
CREATE POLICY "Users can view their business Z-reports"
ON public.z_reports FOR SELECT
USING (business_id = (SELECT business_id FROM public.app_users WHERE id = auth.uid()));

-- Insert Politikası: İşletme kullanıcıları rapor oluşturabilir
DROP POLICY IF EXISTS "Users can create Z-reports for their business" ON public.z_reports;
CREATE POLICY "Users can create Z-reports for their business"
ON public.z_reports FOR INSERT
WITH CHECK (business_id = (SELECT business_id FROM public.app_users WHERE id = auth.uid()));

-- 4. Performans İndeksleri
CREATE INDEX IF NOT EXISTS idx_z_reports_business_date ON public.z_reports(business_id, report_date);
CREATE INDEX IF NOT EXISTS idx_appointments_is_paid ON public.appointments(is_paid);

-- Tablo ve Kolon Açıklamaları
COMMENT ON TABLE public.z_reports IS 'Günlük kasa mühürleme ve AI audit raporlarını saklar.';
COMMENT ON COLUMN public.appointments.is_paid IS 'Randevunun ödemesinin tam olarak alındığını belirtir.';
COMMENT ON COLUMN public.appointments.is_sealed IS 'Gün sonu kapatma işlemiyle mühürlenen randevuları belirtir. Bu randevular kilitlenmelidir.';
