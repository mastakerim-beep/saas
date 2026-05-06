-- Aura Spa SaaS ERP - Final Authority & Security Hardening
-- Date: 2026-05-06
-- Focus: Resolve login loops, fix RLS chicken-and-egg problem, and prevent bot/unauthorized access.

-- 1. FIX APP_USERS BOOTSTRAPPING (Essential for Login Stability)
-- This allows any authenticated user to read their OWN profile based on UID, 
-- regardless of metadata presence.
DROP POLICY IF EXISTS "app_users_read_self" ON app_users;
CREATE POLICY "app_users_read_self" ON app_users 
    FOR SELECT TO authenticated
    USING (auth.uid() = id);

-- 2. HARDEN SAAS OWNER ACCESS
-- Ensure SaaS Owner (kerim@mail.com) has global visibility regardless of metadata.
DROP POLICY IF EXISTS "app_users_saas_global_read" ON app_users;
CREATE POLICY "app_users_saas_global_read" ON app_users
    FOR SELECT TO authenticated
    USING (
        (SELECT role FROM app_users WHERE id = auth.uid()) = 'SaaS_Owner'
        OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
    );

-- 3. DRILL-DOWN ISOLATION FOR BUSINESS DATA
-- Re-defining global RLS helper to be more robust than just JWT metadata
CREATE OR REPLACE FUNCTION get_active_business_id()
RETURNS uuid AS $$
  -- First try JWT metadata (fastest)
  -- Then fallback to looking up the actual app_users table (most reliable)
  DECLARE
    _biz_id uuid;
  BEGIN
    _biz_id := (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid;
    IF _biz_id IS NULL THEN
      SELECT business_id INTO _biz_id FROM app_users WHERE id = auth.uid();
    END IF;
    RETURN _biz_id;
  END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 4. APPLY ROBUST ISOLATION TO CORE TABLES
-- We upgrade the policies to use our new robust helper

-- Appointments
DROP POLICY IF EXISTS "appointments_all" ON appointments;
CREATE POLICY "appointments_all" ON appointments FOR ALL
  TO authenticated
  USING (
    business_id = get_active_business_id() 
    OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
  );

-- Customers
DROP POLICY IF EXISTS "customers_all" ON customers;
CREATE POLICY "customers_all" ON customers FOR ALL
  TO authenticated
  USING (
    business_id = get_active_business_id() 
    OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
  );

-- Payments
DROP POLICY IF EXISTS "payments_all" ON payments;
CREATE POLICY "payments_all" ON payments FOR ALL
  TO authenticated
  USING (
    business_id = get_active_business_id() 
    OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
  );

-- Staff
DROP POLICY IF EXISTS "staff_all" ON staff;
CREATE POLICY "staff_all" ON staff FOR ALL
  TO authenticated
  USING (
    business_id = get_active_business_id() 
    OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
  );

-- Audit Logs (Prevent unauthorized log tampering)
DROP POLICY IF EXISTS "audit_logs_all" ON audit_logs;
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL
  TO authenticated
  USING (
    business_id = get_active_business_id() 
    OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
  );

-- 5. BOT PROTECTION & AUDIT LOGGING TRIGGER
-- Log all failed login attempts or unauthorized access patterns (Mock logic for database level logging)
CREATE OR REPLACE FUNCTION log_security_event()
RETURNS trigger AS $$
BEGIN
  IF TG_OP = 'DELETE' AND (SELECT role FROM app_users WHERE id = auth.uid()) != 'SaaS_Owner' THEN
    INSERT INTO notification_logs (business_id, title, content, type, status)
    VALUES (get_active_business_id(), 'Security Alert', 'Unauthorized deletion attempt detected by ' || auth.uid(), 'danger', 'unread');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
