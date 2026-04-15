-- ============================================================
-- 005 - Evrensel RLS Bütünlüğü ve Onarımı (Universal RLS Integrity)
-- ============================================================

-- 1. YARDIMCI FONKSİYONLARIN VARLIĞINDAN EMİN OLALIM
CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'role';
$$ LANGUAGE SQL STABLE;

-- 2. TÜM TABLOLAR İÇİN TEK SIRA RLS ETKİNLEŞTİRME (Garanti altına alalım)
ALTER TABLE businesses ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE app_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE debts ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE calendar_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_media ENABLE ROW LEVEL SECURITY;

-- 3. ESKİ VE HATALI POLİTİKALARI TEMİZLE (INSERT/CHECK eksikliği olanlar)
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;
DROP POLICY IF EXISTS "customers_delete" ON customers;
DROP POLICY IF EXISTS "appointments_select" ON appointments;
DROP POLICY IF EXISTS "appointments_insert" ON appointments;
DROP POLICY IF EXISTS "appointments_update" ON appointments;
DROP POLICY IF EXISTS "appointments_delete" ON appointments;
DROP POLICY IF EXISTS "payments_select" ON payments;
DROP POLICY IF EXISTS "payments_insert" ON payments;
DROP POLICY IF EXISTS "payments_delete" ON payments;

-- 4. EVRENSEL "FULL ACCESS" POLİTİKALARINI YENİDEN TANIMLA
-- Bu politikalar her işlemde (INSERT, UPDATE, DELETE, SELECT) işleyecektir.

-- CUSTOMERS
CREATE POLICY "customers_all" ON customers FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- APPOINTMENTS
CREATE POLICY "appointments_all" ON appointments FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- PAYMENTS
CREATE POLICY "payments_all" ON payments FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- AUDIT_LOGS
DROP POLICY IF EXISTS "audit_logs_select" ON audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert" ON audit_logs;
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- APP_USERS
DROP POLICY IF EXISTS "app_users_select" ON app_users;
DROP POLICY IF EXISTS "app_users_insert" ON app_users;
DROP POLICY IF EXISTS "app_users_update" ON app_users;
CREATE POLICY "app_users_all" ON app_users FOR ALL
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- BRANCHES
DROP POLICY IF EXISTS "branches_select" ON branches;
DROP POLICY IF EXISTS "branches_insert" ON branches;
DROP POLICY IF EXISTS "branches_update" ON branches;
CREATE POLICY "branches_all" ON branches FOR ALL
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- 5. DİĞER TABLOLAR (Check işlemini 004'te yapmıştık ama buraya da sağlamlık için ekliyoruz)
-- (Bu kısım zaten 004 ile uyumludur, buraya sadece yeni veya kritik olanları ekleyelim)
