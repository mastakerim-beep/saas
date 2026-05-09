-- AURA IMPERIAL - HOLDING STRUCTURE v1.0
-- Amaç: SaaS_Owner olmayan ancak birden fazla işletmeye sahip olan 'Holding Sahipleri' için yetkilendirme altyapısı kurmak.

-- 1. HOLDINGS tablosunu oluştur
CREATE TABLE IF NOT EXISTS public.holdings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    owner_email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. BUSINESSES tablosuna holding_id ekle
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='businesses' AND column_name='holding_id') THEN
        ALTER TABLE public.businesses ADD COLUMN holding_id UUID REFERENCES public.holdings(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 3. APP_USERS tablosuna holding_id ekle
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='app_users' AND column_name='holding_id') THEN
        ALTER TABLE public.app_users ADD COLUMN holding_id UUID REFERENCES public.holdings(id) ON DELETE SET NULL;
    END IF;
END $$;

COMMENT ON TABLE public.holdings IS 'Büyük zincirleri (Sanitas vb.) gruplamak için kullanılan ana tablo.';
