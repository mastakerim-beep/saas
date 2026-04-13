-- AURA SPA SaaS ERP - ULTIMATE MASTER INSTALLATION (CONSOLIDATED)
-- Tarih: 2026-04-13
-- Açıklama: Tüm modülleri (Kasa, Finans, Randevu, CRM) içeren, RLS uyumlu nihai şema.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TEMİZLİK (Sıfırdan temiz kurulum için - Dikkat: Mevcut veriler silinir!)
DROP TABLE IF EXISTS 
    z_reports, audit_logs, notification_logs, ai_insights, 
    commission_rules, calendar_blocks, customer_media, 
    appointments, payments, debts, expenses, expense_categories, 
    inventory, customer_memberships, membership_plans, 
    packages, package_definitions, services, rooms, 
    staff, customers, app_users, branches, businesses, 
    payment_definitions, bank_accounts, referral_sources, 
    consent_form_templates, booking_settings CASCADE;

-- 2. ÇEKİRDEK YAPI (BUSINESS & BRANCH)
CREATE TABLE businesses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    owner_name TEXT,
    slug TEXT UNIQUE,
    plan TEXT DEFAULT 'Basic',
    expiry_date DATE,
    status TEXT DEFAULT 'Aktif',
    mrr NUMERIC DEFAULT 0,
    max_users INT DEFAULT 3,
    max_branches INT DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    location TEXT,
    address TEXT,
    phone TEXT,
    status TEXT DEFAULT 'Aktif',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. KULLANICI VE YETKİLENDİRME
CREATE TABLE app_users (
    id UUID PRIMARY KEY,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    role TEXT DEFAULT 'Staff',
    name TEXT NOT NULL,
    email TEXT UNIQUE,
    permissions TEXT[] DEFAULT '{}',
    allowed_branches UUID[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. OPERASYONEL TABLOLAR (STAFF, SERVICES, ROOMS)
CREATE TABLE staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    name TEXT NOT NULL,
    role TEXT,
    status TEXT DEFAULT 'Aktif',
    weekly_off_day INT DEFAULT 0,
    staff_type TEXT DEFAULT 'Terapist',
    is_visible_on_calendar BOOLEAN DEFAULT true,
    sort_order INT DEFAULT 0,
    can_login_system BOOLEAN DEFAULT false,
    can_login_mobile BOOLEAN DEFAULT false,
    staff_group TEXT DEFAULT 'Diğer',
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    duration INT DEFAULT 60,
    price NUMERIC(10,2) DEFAULT 0,
    category TEXT DEFAULT 'Genel',
    color TEXT DEFAULT 'bg-indigo-500',
    consumables JSONB DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE rooms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    status TEXT DEFAULT 'Boş',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. CRM (CUSTOMERS, MEMBERSHIPS, PACKAGES)
CREATE TABLE customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    birthdate TEXT,
    segment TEXT DEFAULT 'Normal',
    note TEXT,
    is_churn_risk BOOLEAN DEFAULT false,
    country TEXT DEFAULT 'TR',
    language TEXT DEFAULT 'tr',
    reference_code TEXT,
    tags TEXT[] DEFAULT '{}',
    address TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE membership_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    price NUMERIC(10,2) DEFAULT 0,
    period_days INT DEFAULT 30,
    benefits TEXT[] DEFAULT '{}',
    allowed_services TEXT[] DEFAULT '{}',
    sessions_per_month INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE customer_memberships (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES membership_plans(id),
    start_date DATE DEFAULT CURRENT_DATE,
    expiry_date DATE,
    remaining_sessions INT DEFAULT 0,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE package_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    group_name TEXT,
    details TEXT,
    price NUMERIC(10,2) DEFAULT 0,
    total_sessions INT DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE packages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    definition_id UUID REFERENCES package_definitions(id),
    name TEXT NOT NULL,
    service_name TEXT,
    total_sessions INT DEFAULT 1,
    used_sessions INT DEFAULT 0,
    price NUMERIC(10,2) DEFAULT 0,
    expiry DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. FİNANS VE RANDEVU (APPOINTMENTS, PAYMENTS, DEBTS)
CREATE TABLE payment_definitions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT DEFAULT 'Diğer',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    appointment_id UUID,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    service TEXT,
    methods JSONB DEFAULT '[]',
    total_amount NUMERIC(10,2) NOT NULL,
    payment_definition_id UUID REFERENCES payment_definitions(id),
    date DATE DEFAULT CURRENT_DATE,
    note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id),
    customer_name TEXT NOT NULL,
    service TEXT NOT NULL,
    staff_id UUID REFERENCES staff(id),
    room_id UUID REFERENCES rooms(id),
    date DATE NOT NULL,
    time TEXT NOT NULL,
    duration INT DEFAULT 60,
    status TEXT DEFAULT 'pending',
    price NUMERIC(10,2) DEFAULT 0,
    deposit_paid NUMERIC(10,2) DEFAULT 0,
    is_online BOOLEAN DEFAULT false,
    package_id UUID,
    membership_id UUID,
    is_paid BOOLEAN DEFAULT false,
    payment_id UUID REFERENCES payments(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE debts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id),
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE,
    description TEXT,
    status TEXT DEFAULT 'açık',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. KASA VE GİDER (EXPENSES, Z_REPORTS, BANK_ACCOUNTS)
CREATE TABLE bank_accounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    bank_name TEXT NOT NULL,
    branch_name TEXT,
    account_no TEXT,
    iban TEXT,
    currency TEXT DEFAULT 'TRY',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id),
    "desc" TEXT NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    category TEXT DEFAULT 'Diğer',
    date DATE DEFAULT CURRENT_DATE,
    "user" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE z_reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    report_date DATE DEFAULT CURRENT_DATE,
    expected_nakit NUMERIC(10,2) DEFAULT 0,
    actual_nakit NUMERIC(10,2) DEFAULT 0,
    expected_kart NUMERIC(10,2) DEFAULT 0,
    actual_kart NUMERIC(10,2) DEFAULT 0,
    expected_havale NUMERIC(10,2) DEFAULT 0,
    actual_havale NUMERIC(10,2) DEFAULT 0,
    total_difference NUMERIC(10,2) DEFAULT 0,
    closed_by TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SİSTEM (LOGS, SETTINGS)
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    date TIMESTAMPTZ DEFAULT NOW(),
    customer_name TEXT,
    action TEXT NOT NULL,
    old_value TEXT,
    new_value TEXT,
    "user" TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE booking_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    is_enabled BOOLEAN DEFAULT true,
    require_deposit BOOLEAN DEFAULT false,
    deposit_percentage INT DEFAULT 0,
    allow_staff_select BOOLEAN DEFAULT true,
    booking_message TEXT,
    accent_color TEXT DEFAULT '#4f46e5',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==========================================
-- 8. RLS POLICIES (AUTHENTICATION & ISOLATION)
-- ==========================================

-- HELPER: get_my_business_id (SECURITY DEFINER to avoid circular RLS)
CREATE OR REPLACE FUNCTION get_my_business_id() RETURNS UUID AS $$ 
DECLARE
  bid UUID;
BEGIN
  SELECT business_id INTO bid FROM public.app_users WHERE id = auth.uid() LIMIT 1;
  RETURN bid;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- HELPER: get_my_role
CREATE OR REPLACE FUNCTION get_my_role() RETURNS TEXT AS $$ 
  SELECT role FROM public.app_users WHERE id = auth.uid() LIMIT 1;
$$ LANGUAGE SQL STABLE SECURITY DEFINER;

-- Global Policy Implementation
DO $$ 
DECLARE 
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'branches', 'appointments', 'customers', 'membership_plans', 
        'customer_memberships', 'payments', 'debts', 'staff', 
        'inventory', 'rooms', 'expenses', 'services', 
        'audit_logs', 'customer_media', 'packages', 
        'package_definitions', 'commission_rules', 
        'calendar_blocks', 'notification_logs', 'z_reports',
        'payment_definitions', 'bank_accounts', 'expense_categories', 
        'referral_sources', 'consent_form_templates'
    ];
BEGIN 
    FOR tbl IN SELECT unnest(tables) LOOP
        -- Enable RLS
        EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
        
        -- Drop if exists and create new unified policy
        EXECUTE format('DROP POLICY IF EXISTS "access_policy_%s" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "access_policy_%s" ON public.%I FOR ALL TO authenticated USING (business_id = get_my_business_id() OR get_my_role() = ''SaaS_Owner'')', tbl, tbl);
    END LOOP;
END $$;

-- SPECIAL CASE: businesses table (Self-identification)
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "access_policy_businesses" ON public.businesses;
CREATE POLICY "access_policy_businesses" ON public.businesses 
FOR ALL TO authenticated 
USING (id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- SPECIAL CASE: app_users table (Preventing circular login deps)
ALTER TABLE public.app_users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "allow_self_read" ON public.app_users;
CREATE POLICY "allow_self_read" ON public.app_users FOR SELECT TO authenticated USING (id = auth.uid());
DROP POLICY IF EXISTS "allow_admin_manage_all" ON public.app_users;
CREATE POLICY "allow_admin_manage_all" ON public.app_users FOR ALL TO authenticated USING (get_my_role() = 'SaaS_Owner');
CREATE POLICY "admin_insert_branches_global" ON public.branches FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'SaaS_Owner');
CREATE POLICY "admin_insert_app_users_global" ON public.app_users FOR INSERT TO authenticated WITH CHECK (get_my_role() = 'SaaS_Owner');

-- 11. SEED DATA (Başlangıç Ayarları)
INSERT INTO businesses (id, name, owner_name, plan, status, slug, max_branches, max_users) 
VALUES ('b1000000-0000-0000-0000-000000000000', 'Aura Premium Spa', 'Kerim Kardaş', 'Premium', 'Aktif', 'aura-spa', 10, 50) 
ON CONFLICT DO NOTHING;

INSERT INTO branches (id, business_id, name, location) 
VALUES ('b2000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'Merkez Şube', 'İstanbul') 
ON CONFLICT DO NOTHING;

INSERT INTO public.app_users (id, business_id, role, name, email, permissions) 
SELECT id, 'b1000000-0000-0000-0000-000000000000', 'SaaS_Owner', 'Kerim Kardaş', email, '{"*"}' 
FROM auth.users WHERE email = 'kerim@mail.com' 
ON CONFLICT (id) DO UPDATE SET role = EXCLUDED.role, business_id = EXCLUDED.business_id;
