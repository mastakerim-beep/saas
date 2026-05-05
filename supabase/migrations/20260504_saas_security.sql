-- Aura Spa SaaS ERP - Security & RLS Policies for SaaS Infrastructure
-- Date: 2026-05-04

-- 1. ENABLE RLS
ALTER TABLE saas_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE saas_invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;

-- 2. POLICIES FOR saas_plans (Publicly readable by all businesses to see options, only SaaS Owner can manage)
DROP POLICY IF EXISTS "saas_plans_read_policy" ON saas_plans;
CREATE POLICY "saas_plans_read_policy" ON saas_plans
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "saas_plans_admin_policy" ON saas_plans;
CREATE POLICY "saas_plans_admin_policy" ON saas_plans
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role = 'SaaS_Owner'
        )
    );

-- 3. POLICIES FOR saas_invoices (Businesses can see their own invoices, SaaS Owner can see all)
DROP POLICY IF EXISTS "saas_invoices_tenant_policy" ON saas_invoices;
CREATE POLICY "saas_invoices_tenant_policy" ON saas_invoices
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM app_users WHERE id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "saas_invoices_admin_policy" ON saas_invoices;
CREATE POLICY "saas_invoices_admin_policy" ON saas_invoices
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role = 'SaaS_Owner'
        )
    );

-- 4. POLICIES FOR webhook_events (Only SaaS Owner can see/manage)
DROP POLICY IF EXISTS "webhook_events_admin_policy" ON webhook_events;
CREATE POLICY "webhook_events_admin_policy" ON webhook_events
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM app_users 
            WHERE app_users.id = auth.uid() 
            AND app_users.role = 'SaaS_Owner'
        )
    );

-- 5. ENSURE app_users table itself has a policy for SaaS_Owners to read all users
DROP POLICY IF EXISTS "app_users_admin_read_all" ON app_users;
CREATE POLICY "app_users_admin_read_all" ON app_users
    FOR SELECT USING (
        get_my_role() = 'SaaS_Owner'
    );
