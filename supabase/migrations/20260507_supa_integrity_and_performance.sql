-- Aura Spa SaaS ERP - Supabase Integrity, Security & Performance Sync v2
-- Date: 2026-05-07
-- Focus: Final consolidation of RLS, Performance Turbo, and Security Hardening.

-- 1. ROBUST JWT METADATA SYNC
-- We ensure every user has business_id, role, name, and is_suspended in their JWT.
CREATE OR REPLACE FUNCTION public.sync_app_user_to_metadata_v2()
RETURNS TRIGGER AS $$
DECLARE
    _is_suspended BOOLEAN;
BEGIN
    SELECT is_suspended INTO _is_suspended FROM public.businesses WHERE id = NEW.business_id;
    
    UPDATE auth.users
    SET raw_user_meta_data = 
        coalesce(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'business_id', NEW.business_id,
            'role', NEW.role,
            'full_name', NEW.name,
            'is_suspended', coalesce(_is_suspended, false)
        )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_app_user_metadata ON public.app_users;
CREATE TRIGGER trg_sync_app_user_metadata
AFTER INSERT OR UPDATE OF business_id, role, name ON public.app_users
FOR EACH ROW EXECUTE FUNCTION public.sync_app_user_to_metadata_v2();

-- 2. BUSINESS SUSPENSION PROPAGATION
CREATE OR REPLACE FUNCTION public.sync_business_status_to_users()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.is_suspended IS DISTINCT FROM NEW.is_suspended) THEN
        UPDATE auth.users
        SET raw_user_meta_data = 
            coalesce(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object('is_suspended', NEW.is_suspended)
        WHERE id IN (SELECT id FROM public.app_users WHERE business_id = NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_business_status ON public.businesses;
CREATE TRIGGER trg_sync_business_status
AFTER UPDATE OF is_suspended ON public.businesses
FOR EACH ROW EXECUTE FUNCTION public.sync_business_status_to_users();

-- 3. APPOINTMENT INTEGRITY FIX (JWT Based)
CREATE OR REPLACE FUNCTION public.fn_imperial_appointment_integrity()
RETURNS TRIGGER AS $$
BEGIN
    -- SİLME veya GÜNCELLEME anında mühür (is_sealed) kontrolü
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
        IF (OLD.is_sealed = true AND OLD.date <= CURRENT_DATE 
            AND (auth.jwt() -> 'user_metadata' ->> 'role') <> 'SaaS_Owner' 
            AND (auth.jwt() ->> 'email') <> 'kerim@mail.com') THEN
            RAISE EXCEPTION 'Geçmişe dönük mühürlü kayıtlar (Sealed) sadece Supreme Authority tarafından değiştirilebilir.';
        END IF;
    END IF;

    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. UNIFIED ISOLATION FOR ALL TENANT TABLES
DO $$ 
DECLARE 
    tbl TEXT;
    target_tables TEXT[] := ARRAY[
        'branches', 'appointments', 'customers', 'membership_plans', 
        'customer_memberships', 'payments', 'debts', 'staff', 
        'inventory', 'rooms', 'expenses', 'services', 
        'audit_logs', 'customer_media', 'packages', 
        'package_definitions', 'commission_rules', 
        'calendar_blocks', 'notification_logs', 'z_reports',
        'payment_definitions', 'bank_accounts', 'expense_categories', 
        'referral_sources', 'consent_form_templates', 'quotes',
        'system_announcements', 'tenant_modules', 'booking_settings',
        'ai_insights', 'marketing_rules', 'dynamic_pricing_rules', 
        'customer_wallets', 'wallet_transactions', 'consultation_body_maps', 
        'inventory_usage_norms', 'user_branch_access', 'customer_biometrics',
        'inventory_transfers', 'payment_links', 'coupons', 'saas_invoices'
    ];
BEGIN 
    FOR tbl IN SELECT unnest(target_tables) LOOP
        IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = tbl AND schemaname = 'public') THEN
            -- Enable RLS
            EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl);
            
            -- Clean old policies
            EXECUTE format('DROP POLICY IF EXISTS "access_policy_%s" ON public.%I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "%s_all" ON public.%I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "%s_isolation_policy" ON public.%I', tbl, tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Manage own business links" ON public.%I', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Public read with token" ON public.%I', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "SaaS_Owner can do everything on coupons" ON public.%I', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Business_Owner can manage their coupons" ON public.%I', tbl);
            EXECUTE format('DROP POLICY IF EXISTS "Staff can view and use coupons" ON public.%I', tbl);

            -- Create Unified High-Performance Policy
            EXECUTE format('
                CREATE POLICY "%s_isolation_policy" ON public.%I 
                FOR ALL TO authenticated 
                USING (
                    (business_id = (auth.jwt() -> ''user_metadata'' ->> ''business_id'')::uuid 
                     AND (auth.jwt() -> ''user_metadata'' ->> ''is_suspended'')::boolean = false)
                    OR (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''SaaS_Owner''
                    OR (auth.jwt() ->> ''email'') = ''kerim@mail.com''
                )', tbl, tbl, tbl);
        END IF;
    END LOOP;
END $$;

-- 5. SPECIAL CASE: PUBLIC PAYMENT LINKS
-- Allowing guests to read valid payment links by token
DROP POLICY IF EXISTS "Public read with token" ON public.payment_links;
CREATE POLICY "Public read with token" ON public.payment_links
    FOR SELECT TO anon, authenticated
    USING (
        expires_at > now() 
        AND status = 'pending'
    );

-- 6. SPECIAL CASE: BUSINESSES (Self-identification)
DROP POLICY IF EXISTS "access_policy_businesses" ON public.businesses;
CREATE POLICY "access_policy_businesses" ON public.businesses 
    FOR SELECT USING (true); -- Publicly resolvable for slug identification

DROP POLICY IF EXISTS "admin_manage_businesses" ON public.businesses;
CREATE POLICY "admin_manage_businesses" ON public.businesses
    FOR ALL TO authenticated 
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'SaaS_Owner'
        OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
    );

-- 7. SAAS PLANS RLS
ALTER TABLE public.saas_plans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "saas_plans_read" ON public.saas_plans;
CREATE POLICY "saas_plans_read" ON public.saas_plans FOR SELECT USING (is_active = true);
DROP POLICY IF EXISTS "saas_plans_admin" ON public.saas_plans;
CREATE POLICY "saas_plans_admin" ON public.saas_plans FOR ALL TO authenticated 
    USING ((auth.jwt() -> 'user_metadata' ->> 'role') = 'SaaS_Owner');

-- 8. INITIAL SYNC OF ALL USERS
DO $$
DECLARE
  r RECORD;
  _susp BOOLEAN;
BEGIN
  FOR r IN SELECT * FROM public.app_users LOOP
    SELECT is_suspended INTO _susp FROM public.businesses WHERE id = r.business_id;
    UPDATE auth.users
    SET raw_user_meta_data = 
      coalesce(raw_user_meta_data, '{}'::jsonb) || 
      jsonb_build_object(
        'business_id', r.business_id,
        'role', r.role,
        'full_name', r.name,
        'is_suspended', coalesce(_susp, false)
      )
    WHERE id = r.id;
  END LOOP;
END $$;

-- 9. MISSING INDEXES TURBO
CREATE INDEX IF NOT EXISTS idx_payment_links_expires_at ON public.payment_links(expires_at);
CREATE INDEX IF NOT EXISTS idx_coupons_business_id ON public.coupons(business_id);
CREATE INDEX IF NOT EXISTS idx_saas_invoices_biz_status ON public.saas_invoices(business_id, status);
CREATE INDEX IF NOT EXISTS idx_app_users_email ON public.app_users(email);
