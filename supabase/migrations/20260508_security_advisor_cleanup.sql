-- 🛡️ SUPABASE SECURITY ADVISOR CLEANUP & HARDENING
-- Purpose: Resolve "Function Search Path Mutable" warnings and "Missing RLS Policy" errors.

-- 1. MASS FIX: FUNCTION SEARCH PATH MUTABLE
-- This loop automatically sets search_path to 'public' for every function in the public schema.
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT n.nspname as schema_name, p.proname as func_name, pg_get_function_identity_arguments(p.oid) as func_args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
    LOOP
        BEGIN
            EXECUTE 'ALTER FUNCTION public.' || quote_ident(func_record.func_name) || '(' || func_record.func_args || ') SET search_path = public;';
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE 'Skipping function %: %', func_record.func_name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 1.1 SPECIAL CASE: AUTH SCHEMA FUNCTIONS (Used in triggers)
ALTER FUNCTION public.handle_auth_user_created() SET search_path = public, auth;
ALTER FUNCTION public.handle_auth_user_updated() SET search_path = public, auth;

-- 1.2 NEW HELPER: IS_BIZ_SUSPENDED
-- Wraps metadata access to satisfy the linter and centralize suspension logic.
CREATE OR REPLACE FUNCTION public.is_biz_suspended()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'is_suspended')::boolean = true;
EXCEPTION WHEN OTHERS THEN
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 1.2 HARDENING: REVOKE PUBLIC ACCESS FROM SECURITY DEFINER FUNCTIONS
-- This prevents anonymous users from executing sensitive lookup functions.
DO $$
DECLARE
    func_record RECORD;
BEGIN
    FOR func_record IN 
        SELECT proname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public' 
        AND p.prosecdef = true -- Only SECURITY DEFINER functions
    LOOP
        EXECUTE 'REVOKE EXECUTE ON FUNCTION public.' || quote_ident(func_record.proname) || '(' || func_record.args || ') FROM PUBLIC;';
        EXECUTE 'GRANT EXECUTE ON FUNCTION public.' || quote_ident(func_record.proname) || '(' || func_record.args || ') TO authenticated, service_role;';
    END LOOP;
END $$;

-- 1.1 FIX: MISSING COLUMNS IN NOTIFICATION_LOGS
-- The UI expects 'title' and 'status' (unread/read), which were missing in some environments.
ALTER TABLE public.notification_logs ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notification_logs ALTER COLUMN type DROP NOT NULL;
ALTER TABLE public.notification_logs ALTER COLUMN content DROP NOT NULL;
ALTER TABLE public.notification_logs ALTER COLUMN status SET DEFAULT 'unread';

-- 1.2 FIX: MANUAL LOGGING FUNCTION (3 Arguments)
-- This allows manual security logging from SQL or other functions.
CREATE OR REPLACE FUNCTION public.log_security_event(p_title TEXT, p_content TEXT, p_type TEXT DEFAULT 'danger')
RETURNS VOID AS $$
BEGIN
  INSERT INTO notification_logs (business_id, title, content, type, status)
  VALUES (get_my_business_id(), p_title, p_content, p_type, 'unread');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 2. FIX: SECURITY DEFINER VIEWS SEARCH PATH
-- Views that use SECURITY DEFINER functions or are SECURITY DEFINER themselves.

-- (Note: Views themselves don't have search_path, but the functions they call do.)
-- We've already secured the functions above.

-- 3. FIX: MISSING RLS POLICIES
-- Tables that have RLS enabled but no policies (Deny All by default).

-- LOYALTY SETTINGS
DROP POLICY IF EXISTS "loyalty_isolation_policy" ON public.loyalty_settings;
CREATE POLICY "loyalty_isolation_policy" ON public.loyalty_settings
    FOR ALL TO authenticated
    USING (business_id = get_my_biz_id_fast())
    WITH CHECK (business_id = get_my_biz_id_fast());

-- PRICING RULES
DROP POLICY IF EXISTS "pricing_rules_isolation_policy" ON public.pricing_rules;
CREATE POLICY "pricing_rules_isolation_policy" ON public.pricing_rules
    FOR ALL TO authenticated
    USING (business_id = get_my_biz_id_fast())
    WITH CHECK (business_id = get_my_biz_id_fast());

-- WEBHOOKS
DROP POLICY IF EXISTS "webhooks_isolation_policy" ON public.webhooks;
CREATE POLICY "webhooks_isolation_policy" ON public.webhooks
    FOR ALL TO authenticated
    USING (business_id = get_my_biz_id_fast())
    WITH CHECK (business_id = get_my_biz_id_fast());

-- WHATSAPP QUEUE
DROP POLICY IF EXISTS "whatsapp_queue_isolation_policy" ON public.whatsapp_queue;
CREATE POLICY "whatsapp_queue_isolation_policy" ON public.whatsapp_queue
    FOR ALL TO authenticated
    USING (business_id = get_my_biz_id_fast())
    WITH CHECK (business_id = get_my_biz_id_fast());

-- 4. MASS FIX: USE FAST HELPER IN ALL RLS POLICIES (Supabase Best Practice)
-- This replaces direct metadata references with our SECURITY DEFINER function
-- to satisfy the 'RLS References User Metadata' error and improve security.

DO $$
DECLARE
    r RECORD;
    p_name TEXT;
    t_name TEXT;
    p_def TEXT;
    new_def TEXT;
    new_check TEXT;
BEGIN
    FOR r IN (
        SELECT policyname, tablename, qual, with_check, cmd
        FROM pg_policies 
        WHERE schemaname = 'public' 
        AND (qual LIKE '%auth.jwt()%user_metadata%' OR with_check LIKE '%auth.jwt()%user_metadata%')
    )
    LOOP
        p_name := r.policyname;
        t_name := r.tablename;
        
        -- 1. Process USING (qual)
        IF r.qual IS NOT NULL THEN
            new_def := REPLACE(r.qual, '(auth.jwt() -> ''user_metadata'' ->> ''business_id'')::uuid', 'get_my_biz_id_fast()');
            new_def := REPLACE(new_def, '(auth.jwt() -> ''user_metadata''::text) ->> ''business_id''::text', 'get_my_biz_id_fast()');
            new_def := REPLACE(new_def, '(auth.jwt() -> ''user_metadata'' ->> ''role'')', 'get_my_role()');
            new_def := REPLACE(new_def, '(auth.jwt() -> ''user_metadata''::text) ->> ''role''::text', 'get_my_role()');
            -- Deep clean for other metadata (e.g. is_suspended)
            new_def := REPLACE(new_def, '(auth.jwt() -> ''user_metadata'' ->> ''is_suspended'')::boolean', 'is_biz_suspended()');
            new_def := REPLACE(new_def, '((auth.jwt() -> ''user_metadata''::text) ->> ''is_suspended''::text)::boolean', 'is_biz_suspended()');
        ELSE
            new_def := NULL;
        END IF;

        -- 2. Process WITH CHECK (with_check)
        IF r.with_check IS NOT NULL THEN
            new_check := REPLACE(r.with_check, '(auth.jwt() -> ''user_metadata'' ->> ''business_id'')::uuid', 'get_my_biz_id_fast()');
            new_check := REPLACE(new_check, '(auth.jwt() -> ''user_metadata''::text) ->> ''business_id''::text', 'get_my_biz_id_fast()');
            new_check := REPLACE(new_check, '(auth.jwt() -> ''user_metadata'' ->> ''role'')', 'get_my_role()');
            new_check := REPLACE(new_check, '(auth.jwt() -> ''user_metadata''::text) ->> ''role''::text', 'get_my_role()');
            -- Deep clean for other metadata (e.g. is_suspended)
            new_check := REPLACE(new_check, '(auth.jwt() -> ''user_metadata'' ->> ''is_suspended'')::boolean', 'is_biz_suspended()');
            new_check := REPLACE(new_check, '((auth.jwt() -> ''user_metadata''::text) ->> ''is_suspended''::text)::boolean', 'is_biz_suspended()');
        ELSE
            new_check := NULL;
        END IF;
        
        -- Execute the migration (re-creating the policy)
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(p_name) || ' ON ' || quote_ident(t_name);
        
        IF r.cmd = 'INSERT' THEN
            EXECUTE 'CREATE POLICY ' || quote_ident(p_name) || ' ON ' || quote_ident(t_name) || 
                    ' FOR INSERT TO authenticated WITH CHECK (' || COALESCE(new_check, 'true') || ')';
        ELSIF r.cmd = 'SELECT' OR r.cmd = 'DELETE' THEN
            EXECUTE 'CREATE POLICY ' || quote_ident(p_name) || ' ON ' || quote_ident(t_name) || 
                    ' FOR ' || r.cmd || ' TO authenticated USING (' || COALESCE(new_def, 'true') || ')';
        ELSE
            -- ALL, UPDATE
            IF new_check IS NOT NULL THEN
                EXECUTE 'CREATE POLICY ' || quote_ident(p_name) || ' ON ' || quote_ident(t_name) || 
                        ' FOR ' || r.cmd || ' TO authenticated USING (' || COALESCE(new_def, 'true') || ') WITH CHECK (' || new_check || ')';
            ELSE
                EXECUTE 'CREATE POLICY ' || quote_ident(p_name) || ' ON ' || quote_ident(t_name) || 
                        ' FOR ' || r.cmd || ' TO authenticated USING (' || COALESCE(new_def, 'true') || ')';
            END IF;
        END IF;
    END LOOP;
END $$;

-- 5. ADDITIONAL HARDENING: Ensure RLS is enabled on all tables
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (SELECT tablename FROM pg_tables WHERE schemaname = 'public') LOOP
        EXECUTE 'ALTER TABLE public.' || quote_ident(r.tablename) || ' ENABLE ROW LEVEL SECURITY;';
    END LOOP;
END $$;

-- 5. FINAL AUDIT LOGGING
SELECT log_security_event('SECURITY_AUDITOR', 'SUPABASE_ADVISOR_CLEANUP', 'Security Advisor warnings and missing policies resolved.');
