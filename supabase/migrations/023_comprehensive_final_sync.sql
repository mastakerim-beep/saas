-- ============================================================
-- 023 - Comprehensive Final SQL Sync & Reconciliation
-- ============================================================
-- Bu script mevcut veritabanını, 022 numaralı migrasyon sonrası 
-- tüm eksik kolon, tablo ve RLS ayarlarıyla senkronize eder.
-- ============================================================

DO $$ 
BEGIN
    -- 1. Services: Category kolonunu ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'category') THEN
        ALTER TABLE public.services ADD COLUMN category TEXT DEFAULT 'Genel';
    END IF;

    -- 2. Staff: Teknik giriş ve gruplama kolonları
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'can_login_system') THEN
        ALTER TABLE public.staff ADD COLUMN can_login_system BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'can_login_mobile') THEN
        ALTER TABLE public.staff ADD COLUMN can_login_mobile BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'staff_group') THEN
        ALTER TABLE public.staff ADD COLUMN staff_group TEXT DEFAULT 'Diğer';
    END IF;

    -- 3. Payments: Ödeme aracı ID'sini ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_definition_id') THEN
        ALTER TABLE public.payments ADD COLUMN payment_definition_id UUID;
    END IF;

    -- 4. Appointments: Is_paid ve Payment_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'is_paid') THEN
        ALTER TABLE public.appointments ADD COLUMN is_paid BOOLEAN DEFAULT false;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'payment_id') THEN
        ALTER TABLE public.appointments ADD COLUMN payment_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'selected_regions') THEN
        ALTER TABLE public.appointments ADD COLUMN selected_regions TEXT[] DEFAULT '{}';
    END IF;

    -- 5. Expenses: Şube bazlı takip
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'expenses' AND column_name = 'branch_id') THEN
        ALTER TABLE public.expenses ADD COLUMN branch_id UUID;
    END IF;
END $$;

-- 2. Yeni Tablolar (Eğer Yoksa)
CREATE TABLE IF NOT EXISTS public.payment_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    type            TEXT NOT NULL DEFAULT 'Diğer',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.expense_categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    description     TEXT,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.package_definitions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    group_name      TEXT NOT NULL DEFAULT 'Genel',
    details         TEXT,
    price           NUMERIC NOT NULL DEFAULT 0,
    total_sessions  INTEGER NOT NULL DEFAULT 1,
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT now()
);

-- 3. İlişkisel Kısıtlamalar (Foreign Keys) - Sadece yoklarsa ekle
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_payments_definition') THEN
        ALTER TABLE public.payments ADD CONSTRAINT fk_payments_definition FOREIGN KEY (payment_definition_id) REFERENCES public.payment_definitions(id) ON DELETE SET NULL;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'fk_appts_payment') THEN
        ALTER TABLE public.appointments ADD CONSTRAINT fk_appts_payment FOREIGN KEY (payment_id) REFERENCES public.payments(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 4. RLS Unification (Zorunlu Güncelleme)
-- Tüm tabloların row level security ayarlarını SaaS_Owner yetkisiyle birleştirir.
DO $$ 
DECLARE
    tbl TEXT;
    tbls TEXT[] := ARRAY['payment_definitions', 'bank_accounts', 'expense_categories', 'package_definitions', 'payments', 'appointments', 'staff', 'services'];
BEGIN
    FOREACH tbl IN ARRAY tbls LOOP
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
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

-- 5. Realtime Yayınları
ALTER PUBLICATION supabase_realtime ADD TABLE payment_definitions;
ALTER PUBLICATION supabase_realtime ADD TABLE bank_accounts;
ALTER PUBLICATION supabase_realtime ADD TABLE expense_categories;
ALTER PUBLICATION supabase_realtime ADD TABLE package_definitions;
