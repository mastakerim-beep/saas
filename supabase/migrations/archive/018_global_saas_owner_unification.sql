-- ============================================================
-- 018 - Global SaaS Owner Access Unification
-- This migration forcefully grants full global access to any 
-- user with the 'SaaS_Owner' role across all tables.
-- This is the definitive fix for visibility issues in the Admin panel.
-- ============================================================

-- [1] Define Global Access Policies for EVERY Table
-- Format: SaaS_Owner sees ALL, Others see their business_id

-- 1. BUSINESSES
DROP POLICY IF EXISTS "businesses_saas_all" ON businesses;
CREATE POLICY "businesses_saas_all" ON businesses FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR id = get_my_business_id());

-- 2. BRANCHES
DROP POLICY IF EXISTS "branches_saas_all" ON branches;
CREATE POLICY "branches_saas_all" ON branches FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 3. APP_USERS
DROP POLICY IF EXISTS "app_users_saas_all" ON app_users;
CREATE POLICY "app_users_saas_all" ON app_users FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 4. CUSTOMERS
DROP POLICY IF EXISTS "customers_saas_all" ON customers;
CREATE POLICY "customers_saas_all" ON customers FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 5. APPOINTMENTS
DROP POLICY IF EXISTS "appointments_saas_all" ON appointments;
CREATE POLICY "appointments_saas_all" ON appointments FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 6. PAYMENTS
DROP POLICY IF EXISTS "payments_saas_all" ON payments;
CREATE POLICY "payments_saas_all" ON payments FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 7. ROOMS
DROP POLICY IF EXISTS "rooms_saas_all" ON rooms;
CREATE POLICY "rooms_saas_all" ON rooms FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 8. PACKAGES
DROP POLICY IF EXISTS "packages_saas_all" ON packages;
CREATE POLICY "packages_saas_all" ON packages FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 9. SERVICES
DROP POLICY IF EXISTS "services_saas_all" ON services;
CREATE POLICY "services_saas_all" ON services FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 10. STAFF
DROP POLICY IF EXISTS "staff_saas_all" ON staff;
CREATE POLICY "staff_saas_all" ON staff FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 11. DEBTS
DROP POLICY IF EXISTS "debts_saas_all" ON debts;
CREATE POLICY "debts_saas_all" ON debts FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 12. EXPENSES
DROP POLICY IF EXISTS "expenses_saas_all" ON expenses;
CREATE POLICY "expenses_saas_all" ON expenses FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 13. AUDIT_LOGS
DROP POLICY IF EXISTS "audit_logs_saas_all" ON audit_logs;
CREATE POLICY "audit_logs_saas_all" ON audit_logs FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 14. Z_REPORTS
DROP POLICY IF EXISTS "z_reports_saas_all" ON z_reports;
CREATE POLICY "z_reports_saas_all" ON z_reports FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 15. CALENDAR_BLOCKS
DROP POLICY IF EXISTS "calendar_blocks_saas_all" ON calendar_blocks;
CREATE POLICY "calendar_blocks_saas_all" ON calendar_blocks FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- 16. CUSTOMER_MEDIA
DROP POLICY IF EXISTS "customer_media_saas_all" ON customer_media;
CREATE POLICY "customer_media_saas_all" ON customer_media FOR ALL
  USING (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id())
  WITH CHECK (get_my_role() = 'SaaS_Owner' OR business_id = get_my_business_id());

-- [2] One-time verification nudge
-- Ensure RLS is actually enabled on these tables
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE z_reports ENABLE ROW LEVEL SECURITY;
