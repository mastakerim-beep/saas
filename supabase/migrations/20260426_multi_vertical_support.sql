-- ============================================================
-- 035 - AURA CORE: Hibrit Dikey (Multi-Vertical) Desteği
-- ============================================================

-- 1. İşletmelere Çoklu Dikey Desteği
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS verticals TEXT[] DEFAULT ARRAY['spa']::TEXT[];

-- 2. Hizmetlere Dikey Ataması
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'spa';

-- 3. Personele Dikey Ataması (Uzmanlık alanı)
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'spa';

-- 4. Ödemelere Dikey Ataması (Raporlama için)
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'spa';

-- 5. Odalara/Kabinlere Dikey Ataması
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS vertical TEXT DEFAULT 'spa';

-- 6. Z-Raporlarına AI Denetim Özeti
ALTER TABLE public.z_reports ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- Mevcut verileri güncelle
UPDATE public.services SET vertical = 'spa' WHERE vertical IS NULL;
UPDATE public.staff SET vertical = 'spa' WHERE vertical IS NULL;
UPDATE public.payments SET vertical = 'spa' WHERE vertical IS NULL;
UPDATE public.rooms SET vertical = 'spa' WHERE vertical IS NULL;

COMMENT ON COLUMN public.businesses.verticals IS 'İşletmenin aktif olduğu sektörler (spa, clinic, fitness)';
COMMENT ON COLUMN public.services.vertical IS 'Hizmetin ait olduğu dikey';
COMMENT ON COLUMN public.staff.vertical IS 'Personelin ana uzmanlık alanı';
COMMENT ON COLUMN public.payments.vertical IS 'Ödemenin (cironun) ait olduğu dikey';
COMMENT ON COLUMN public.rooms.vertical IS 'Odanın/Kabinin ait olduğu dikey';
COMMENT ON COLUMN public.z_reports.ai_summary IS 'Gün sonu AI denetim özeti';
