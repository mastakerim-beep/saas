-- ============================================================
-- 002 - Row Level Security (RLS) Politikaları
-- Her işletme SADECE kendi verisini görebilir
-- ============================================================

-- Tüm tablolarda RLS'yi etkinleştir
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

-- ============================================================
-- Yardımcı Fonksiyon: JWT'den business_id oku
-- ============================================================
CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS UUID AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID;
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_my_role()
RETURNS TEXT AS $$
  SELECT auth.jwt() -> 'user_metadata' ->> 'role';
$$ LANGUAGE SQL STABLE;

-- ============================================================
-- BUSINESSES tablosu
-- SaaS Owner hepsini görür, diğerleri sadece kendi işletmesini
-- ============================================================
CREATE POLICY "businesses_select" ON businesses FOR SELECT
  USING (
    get_my_role() = 'SaaS_Owner' OR id = get_my_business_id()
  );

CREATE POLICY "businesses_insert" ON businesses FOR INSERT
  WITH CHECK (get_my_role() = 'SaaS_Owner');

CREATE POLICY "businesses_update" ON businesses FOR UPDATE
  USING (get_my_role() = 'SaaS_Owner' OR id = get_my_business_id());

-- ============================================================
-- APP_USERS tablosu
-- ============================================================
CREATE POLICY "app_users_select" ON app_users FOR SELECT
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

CREATE POLICY "app_users_insert" ON app_users FOR INSERT
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

CREATE POLICY "app_users_update" ON app_users FOR UPDATE
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- ============================================================
-- CUSTOMERS tablosu
-- ============================================================
CREATE POLICY "customers_select" ON customers FOR SELECT
  USING (business_id = get_my_business_id());

CREATE POLICY "customers_insert" ON customers FOR INSERT
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "customers_update" ON customers FOR UPDATE
  USING (business_id = get_my_business_id());

CREATE POLICY "customers_delete" ON customers FOR DELETE
  USING (business_id = get_my_business_id() AND get_my_role() IN ('Business_Owner', 'Branch_Manager'));

-- ============================================================
-- APPOINTMENTS tablosu
-- ============================================================
CREATE POLICY "appointments_select" ON appointments FOR SELECT
  USING (business_id = get_my_business_id());

CREATE POLICY "appointments_insert" ON appointments FOR INSERT
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "appointments_update" ON appointments FOR UPDATE
  USING (business_id = get_my_business_id());

CREATE POLICY "appointments_delete" ON appointments FOR DELETE
  USING (
    business_id = get_my_business_id() AND
    get_my_role() IN ('Business_Owner', 'SaaS_Owner')  -- Sadece Business Owner silebilir
  );

-- ============================================================
-- PAYMENTS tablosu
-- ============================================================
CREATE POLICY "payments_select" ON payments FOR SELECT
  USING (business_id = get_my_business_id());

CREATE POLICY "payments_insert" ON payments FOR INSERT
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "payments_delete" ON payments FOR DELETE
  USING (
    business_id = get_my_business_id() AND
    get_my_role() IN ('Business_Owner', 'SaaS_Owner')
  );

-- ============================================================
-- DEBTS tablosu
-- ============================================================
CREATE POLICY "debts_all" ON debts FOR ALL
  USING (business_id = get_my_business_id());

-- ============================================================
-- EXPENSES tablosu
-- ============================================================
CREATE POLICY "expenses_all" ON expenses FOR ALL
  USING (business_id = get_my_business_id());

-- ============================================================
-- INVENTORY tablosu
-- ============================================================
CREATE POLICY "inventory_all" ON inventory FOR ALL
  USING (business_id = get_my_business_id());

-- ============================================================
-- STAFF tablosu
-- ============================================================
CREATE POLICY "staff_all" ON staff FOR ALL
  USING (business_id = get_my_business_id());

-- ============================================================
-- ROOMS tablosu
-- ============================================================
CREATE POLICY "rooms_all" ON rooms FOR ALL
  USING (business_id = get_my_business_id());

-- ============================================================
-- MEMBERSHIP_PLANS tablosu
-- ============================================================
CREATE POLICY "membership_plans_all" ON membership_plans FOR ALL
  USING (business_id = get_my_business_id());

-- ============================================================
-- CUSTOMER_MEMBERSHIPS tablosu
-- ============================================================
CREATE POLICY "customer_memberships_all" ON customer_memberships FOR ALL
  USING (business_id = get_my_business_id());

-- ============================================================
-- AUDIT_LOGS tablosu
-- ============================================================
CREATE POLICY "audit_logs_select" ON audit_logs FOR SELECT
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

CREATE POLICY "audit_logs_insert" ON audit_logs FOR INSERT
  WITH CHECK (business_id = get_my_business_id());

-- Audit loglar SİLİNEMEZ — siber saldırı koruması
-- (DROP POLICY ile kaldırılabilir ama varsayılan olarak yoktur)

-- ============================================================
-- NOTIFICATION_LOGS tablosu
-- ============================================================
CREATE POLICY "notification_logs_all" ON notification_logs FOR ALL
  USING (business_id = get_my_business_id());

-- ============================================================
-- COMMISSION_RULES tablosu
-- ============================================================
CREATE POLICY "commission_rules_all" ON commission_rules FOR ALL
  USING (business_id = get_my_business_id());

-- ============================================================
-- CALENDAR_BLOCKS tablosu
-- ============================================================
CREATE POLICY "calendar_blocks_all" ON calendar_blocks FOR ALL
  USING (business_id = get_my_business_id());

-- ============================================================
-- BRANCHES tablosu
-- ============================================================  
CREATE POLICY "branches_select" ON branches FOR SELECT
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

CREATE POLICY "branches_insert" ON branches FOR INSERT
  WITH CHECK (business_id = get_my_business_id());

CREATE POLICY "branches_update" ON branches FOR UPDATE
  USING (business_id = get_my_business_id() AND get_my_role() IN ('Business_Owner', 'SaaS_Owner'));
