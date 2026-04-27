-- ============================================================
-- 036 - AURA CORE: Dikey Spesifik Veri Depolama (Vertical Data)
-- ============================================================

-- 1. Müşterilere Dikey Veri Alanı Ekle (Tıbbi Geçmiş, Fitness Programları vb.)
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS vertical_data JSONB DEFAULT '{}'::JSONB;

-- 2. Randevulara Dikey Not Alanı Ekle (Reçete Notları, Lab Bulguları, Antrenman Notları)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS vertical_notes JSONB DEFAULT '{}'::JSONB;

-- İndeksleme (JSONB aramaları için)
CREATE INDEX IF NOT EXISTS idx_customers_vertical_data ON public.customers USING GIN (vertical_data);

COMMENT ON COLUMN public.customers.vertical_data IS 'Dikey bazlı özel veriler (Tıbbi özgeçmiş, ölçümler, program detayları)';
COMMENT ON COLUMN public.appointments.vertical_notes IS 'Randevu bazlı dikey notları (Reçeteler, lab sonuçları, egzersiz setleri)';
