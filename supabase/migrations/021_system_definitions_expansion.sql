-- ============================================================
-- 021 - System Settings & Definitions Expansion
-- ============================================================

-- 1. Update Staff Table with Technical Access Fields
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'can_login_system') THEN
        ALTER TABLE public.staff ADD COLUMN can_login_system BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'can_login_mobile') THEN
        ALTER TABLE public.staff ADD COLUMN can_login_mobile BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'staff_group') THEN
        ALTER TABLE public.staff ADD COLUMN staff_group TEXT DEFAULT 'Diğer';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'last_login_at') THEN
        ALTER TABLE public.staff ADD COLUMN last_login_at TIMESTAMPTZ;
    END IF;
END $$;

-- 2. Create Payment Definitions Table
CREATE TABLE IF NOT EXISTS public.payment_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL DEFAULT 'Diğer', -- 'Nakit', 'Kredi Kartı', 'Banka Hesabı', 'Havale/EFT'
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Bank Accounts Table
CREATE TABLE IF NOT EXISTS public.bank_accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    bank_name       TEXT NOT NULL,
    branch_name     TEXT,
    account_no      TEXT,
    iban            TEXT,
    currency        TEXT DEFAULT 'TRY',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create Expense Categories Table
CREATE TABLE IF NOT EXISTS public.expense_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Create Referral Sources Table
CREATE TABLE IF NOT EXISTS public.referral_sources (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Create Consent Form Templates Table
CREATE TABLE IF NOT EXISTS public.consent_form_templates (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    content         TEXT, -- Rich text/Markdown
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RLS Policies (Apply global_saas_owner_unification style)

-- Enable RLS
ALTER TABLE public.payment_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consent_form_templates ENABLE ROW LEVEL SECURITY;

-- Helper to apply standard policy
DO $$ 
DECLARE
    tbl TEXT;
    tbls TEXT[] := ARRAY['payment_definitions', 'bank_accounts', 'expense_categories', 'referral_sources', 'consent_form_templates'];
BEGIN
    FOREACH tbl IN ARRAY tbls LOOP
        EXECUTE format('DROP POLICY IF EXISTS "%s_access_policy" ON public.%s', tbl, tbl);
        EXECUTE format('CREATE POLICY "%s_access_policy" ON public.%s 
            FOR ALL TO authenticated 
            USING (
                business_id = get_my_business_id() OR 
                get_my_role() = ''SaaS_Owner''
            )
            WITH CHECK (
                business_id = get_my_business_id() OR 
                get_my_role() = ''SaaS_Owner''
            )', tbl, tbl);
    END LOOP;
END $$;

-- 8. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE payment_definitions;
ALTER PUBLICATION supabase_realtime ADD TABLE bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE expense_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE referral_sources;
ALTER PUBLICATION supabase_realtime ADD TABLE consent_form_templates;
