-- ============================================================
-- 005 - Super Admin RLS Fix
-- Fixes "new row violates row-level security policy" for businesses
-- ============================================================

-- 1. Robustify metadata functions
CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'anon');
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. Drop existing problematic policies on businesses
DROP POLICY IF EXISTS "businesses_select" ON businesses;
DROP POLICY IF EXISTS "businesses_insert" ON businesses;
DROP POLICY IF EXISTS "businesses_update" ON businesses;

-- 3. Create clean, absolute policies for SaaS_Owner
-- SELECT: SaaS Owner sees all, others see their own
CREATE POLICY "businesses_select" ON businesses FOR SELECT
  TO authenticated
  USING (
    get_my_role() = 'SaaS_Owner' 
    OR id = get_my_business_id()
  );

-- INSERT: SaaS Owner can insert any business
-- IMPORTANT: WITH CHECK ensures the metadata 'role' must be SaaS_Owner
CREATE POLICY "businesses_insert" ON businesses FOR INSERT
  TO authenticated
  WITH CHECK (
    get_my_role() = 'SaaS_Owner'
  );

-- UPDATE: SaaS Owner can update any, others update their own
CREATE POLICY "businesses_update" ON businesses FOR UPDATE
  TO authenticated
  USING (
    get_my_role() = 'SaaS_Owner' 
    OR id = get_my_business_id()
  )
  WITH CHECK (
    get_my_role() = 'SaaS_Owner' 
    OR id = get_my_business_id()
  );

-- DELETE: Only SaaS Owner can delete businesses
CREATE POLICY "businesses_delete" ON businesses FOR DELETE
  TO authenticated
  USING (
    get_my_role() = 'SaaS_Owner'
  );
