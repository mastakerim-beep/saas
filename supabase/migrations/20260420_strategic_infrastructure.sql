-- Stratejik Altyapı Geliştirmesi (Bölüm 2)

-- 1. İşletme Ayarlarına Perakende Satış Hedefi Ekle (Varsayılan %20)
-- Bu kolon, AI'nın performansı neye göre değerlendireceğini belirler.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS retail_target NUMERIC DEFAULT 20;
COMMENT ON COLUMN public.businesses.retail_target IS 'İşletmenin aylık perakende satış hedefi (%)';

-- 2. Oda Tablosuna "Dinamik Takip" Kolonları Ekle (Tablet Entegresi İçin Hazırlık)
-- last_occupied_at: Odanın en son ne zaman fiziksel olarak dolu işaretlendiğini takip eder.
-- current_session_id: Odayı şu an kullanan aktif randevu/seans bilgisini tutar.
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS last_occupied_at TIMESTAMPTZ;
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS current_session_id UUID;
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms(status);

-- Tablo ve Kolon Açıklamaları
COMMENT ON TABLE public.rooms IS 'Oda doluluk verileri ve randevu eşleşme takibi (Leakage prevention) için güncellendi.';
COMMENT ON COLUMN public.rooms.status IS 'active, inactive, maintenance, occupied';
