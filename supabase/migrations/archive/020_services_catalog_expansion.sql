-- Catalog Expansion: Support for Groups, Packages and Products

-- 1. Create Package Definitions table (Templates for sale)
CREATE TABLE IF NOT EXISTS public.package_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    group_name TEXT NOT NULL DEFAULT 'Genel',
    details TEXT,
    price NUMERIC NOT NULL DEFAULT 0,
    total_sessions INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Add category to services
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') THEN
        ALTER TABLE public.services ADD COLUMN category TEXT DEFAULT 'Genel';
    END IF;
END $$;

-- 3. Ensure products has group support (usually 'category' is used, but we'll ensure consistency)
-- Products table usually has 'category' already, if not add it. 
-- In store.tsx it's 'category'.

-- 4. RLS Policies for package_definitions
ALTER TABLE public.package_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "package_definitions_isolation_policy" ON public.package_definitions
FOR ALL USING (
    business_id IN (
        SELECT business_id FROM public.app_users WHERE id = auth.uid()
    ) OR (
        SELECT role FROM public.app_users WHERE id = auth.uid()
    ) = 'SaaS_Owner'
);

-- 5. Link existing packages (customer instances) to definitions (optional for now, but good for future)
-- We'll keep existing structure but allow referencing definition_id if needed.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'packages' AND column_name = 'definition_id') THEN
        ALTER TABLE public.packages ADD COLUMN definition_id UUID REFERENCES public.package_definitions(id) ON DELETE SET NULL;
    END IF;
END $$;
