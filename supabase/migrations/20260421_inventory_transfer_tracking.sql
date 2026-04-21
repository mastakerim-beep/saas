-- ============================================================
-- AURA SPA SaaS ERP - ADVANCED INVENTORY & TRANSFERS
-- ============================================================

-- 1. Şubeler Arası Transfer Kayıt Tablosu
CREATE TABLE IF NOT EXISTS public.inventory_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    from_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    to_branch_id UUID REFERENCES public.branches(id) ON DELETE SET NULL,
    product_id UUID REFERENCES public.inventory(id) ON DELETE CASCADE,
    quantity INT NOT NULL CHECK (quantity > 0),
    price_per_unit NUMERIC(10,2) DEFAULT 0,
    transfer_type TEXT DEFAULT 'free', -- 'free', 'cost', 'profit'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES public.app_users(id)
);

-- 2. RLS Politikaları (Güvenlik)
ALTER TABLE public.inventory_transfers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_policy_inventory_transfers" ON public.inventory_transfers;
CREATE POLICY "access_policy_inventory_transfers" ON public.inventory_transfers
    FOR ALL TO authenticated 
    USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'SaaS_Owner');

-- 3. Mevcut Envanter Verilerini Koruma (NULL Branch ID'leri ana şubeye ata)
DO $$
BEGIN
    UPDATE public.inventory i
    SET branch_id = (SELECT id FROM public.branches b WHERE b.business_id = i.business_id ORDER BY created_at ASC LIMIT 1)
    WHERE branch_id IS NULL;
END $$;

-- 4. İndeksler
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_business ON public.inventory_transfers(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_product ON public.inventory_transfers(product_id);

-- 5. Realtime Yayını
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'inventory_transfers') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.inventory_transfers;
    END IF;
END $$;
