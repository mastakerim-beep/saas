-- Aura Spa SaaS ERP - RLS Expansion for Business Owners
-- Date: 2026-05-06
-- Focus: Allow Business Owners and Managers to see and manage their own staff in app_users

-- 1. READ POLICY: allow Business Owners/Managers to see their own business users
DROP POLICY IF EXISTS "app_users_business_read" ON app_users;
CREATE POLICY "app_users_business_read" ON app_users
    FOR SELECT TO authenticated
    USING (
        business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid
        OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'SaaS_Owner'
        OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
    );

-- 2. UPDATE POLICY: allow Business Owners/Managers to update their staff (but not role/permissions unless authorized)
-- Note: Real logic for role changes should be in API, but RLS should allow the update if business_id matches
DROP POLICY IF EXISTS "app_users_business_update" ON app_users;
CREATE POLICY "app_users_business_update" ON app_users
    FOR UPDATE TO authenticated
    USING (
        business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid
        AND (auth.jwt() -> 'user_metadata' ->> 'role') IN ('Business_Owner', 'Manager')
    )
    WITH CHECK (
        business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid
    );

-- 3. GRANT PERMISSIONS
GRANT ALL ON app_users TO authenticated;
