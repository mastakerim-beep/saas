-- ============================================================
-- AURA SPA SaaS ERP - LATEST SCHEMA SYNC (Inventory & Calendar)
-- ============================================================

-- 1. İşletme Ayarları (Takvim Saatleri)
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS calendar_start_hour INT DEFAULT 9;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS calendar_end_hour INT DEFAULT 21;

-- 2. Envanter Geliştirmeleri (Kritik Stok & Alış Fiyatı)
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS low_stock_threshold INT DEFAULT 5;
ALTER TABLE public.inventory ADD COLUMN IF NOT EXISTS last_purchase_price NUMERIC DEFAULT 0;

-- 3. Envanter Kategorileri Tablosu
CREATE TABLE IF NOT EXISTS public.inventory_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    color TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. RLS Politikaları (Kategoriler için)
ALTER TABLE public.inventory_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "inventory_categories_select" ON public.inventory_categories;
CREATE POLICY "inventory_categories_select" ON public.inventory_categories
    FOR SELECT USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);

DROP POLICY IF EXISTS "inventory_categories_insert" ON public.inventory_categories;
CREATE POLICY "inventory_categories_insert" ON public.inventory_categories
    FOR INSERT WITH CHECK (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);

DROP POLICY IF EXISTS "inventory_categories_update" ON public.inventory_categories;
CREATE POLICY "inventory_categories_update" ON public.inventory_categories
    FOR UPDATE USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);

DROP POLICY IF EXISTS "inventory_categories_delete" ON public.inventory_categories;
CREATE POLICY "inventory_categories_delete" ON public.inventory_categories
    FOR DELETE USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);

-- 5. İndeksler
CREATE INDEX IF NOT EXISTS idx_inventory_categories_business ON public.inventory_categories(business_id);
