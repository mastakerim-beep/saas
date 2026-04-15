-- 031_finalize_commission_and_finance.sql
-- Finalizes missing tables and ensures RLS for admin/finance modules

-- 1. Create Commission Rules Table
CREATE TABLE IF NOT EXISTS public.commission_rules (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    staff_id        UUID NOT NULL REFERENCES public.staff(id) ON DELETE CASCADE,
    service_name    TEXT NOT NULL DEFAULT 'Tümü', -- Specific service or 'Tümü'
    value           NUMERIC NOT NULL DEFAULT 0, -- Commission percentage
    type            TEXT DEFAULT 'percentage', -- 'percentage' or 'fixed'
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add customer_name to debts if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'debts' AND column_name = 'customer_name') THEN
        ALTER TABLE public.debts ADD COLUMN customer_name TEXT;
    END IF;
END $$;

-- 3. Ensure RLS is enabled for all relevant tables
ALTER TABLE public.commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tenant_modules ENABLE ROW LEVEL SECURITY;

-- 3. Apply Unified Access Policy (Tenant + SaaS Owner)
DO $$ 
DECLARE
    tbl TEXT;
    tbls TEXT[] := ARRAY['commission_rules', 'system_announcements', 'tenant_modules'];
BEGIN
    FOREACH tbl IN ARRAY tbls LOOP
        EXECUTE format('DROP POLICY IF EXISTS "access_policy_%s" ON public.%s', tbl, tbl);
        EXECUTE format('CREATE POLICY "access_policy_%s" ON public.%s 
            FOR ALL TO authenticated 
            USING (
                business_id = get_my_business_id() OR 
                get_my_role() = ''SaaS_Owner'' OR
                (business_id IS NULL AND get_my_role() != ''SaaS_Owner'') -- For Global Announcements
            )
            WITH CHECK (
                business_id = get_my_business_id() OR 
                get_my_role() = ''SaaS_Owner''
            )', tbl, tbl);
    END LOOP;
END $$;

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE commission_rules;
-- (Announcements and Modules were already added in Master, but ensuring here won't hurt)
