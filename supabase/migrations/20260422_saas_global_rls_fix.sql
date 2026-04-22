-- ============================================================
-- 027 - SaaS Owner Global RLS Yetkilendirmesi (SaaS Supreme Authority)
-- Sürüm: 1.1
-- Açıklama: SaaS_Owner rolü için business_id kısıtlamasını bypass eder.
-- ============================================================

-- 1. SaaS_Owner KONTROL FONKSİYONU GÜNCELLEMESİ
-- Daha hızlı ve kesin bir rol kontrolü için
CREATE OR REPLACE FUNCTION is_saas_owner()
RETURNS BOOLEAN AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'SaaS_Owner';
$$ LANGUAGE SQL STABLE;

-- 2. KRİTİK TABLOLARDAKİ RLS POLİTİKALARINI GÜNCELLE
-- Not: USING ve WITH CHECK bloklarına 'is_saas_owner()' istisnası ekleniyor.

-- APPOINTMENTS
DROP POLICY IF EXISTS "appointments_all" ON appointments;
CREATE POLICY "appointments_all" ON appointments FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- CUSTOMERS
DROP POLICY IF EXISTS "customers_all" ON customers;
CREATE POLICY "customers_all" ON customers FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- PAYMENTS
DROP POLICY IF EXISTS "payments_all" ON payments;
CREATE POLICY "payments_all" ON payments FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- STAFF
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "staff_all" ON staff;
CREATE POLICY "staff_all" ON staff FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- INVENTORY
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "inventory_all" ON inventory;
CREATE POLICY "inventory_all" ON inventory FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- AUDIT_LOGS
DROP POLICY IF EXISTS "audit_logs_all" ON audit_logs;
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- REVENUE/Z_REPORTS
ALTER TABLE z_reports ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "z_reports_all" ON z_reports;
CREATE POLICY "z_reports_all" ON z_reports FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- COMMENTS
COMMENT ON POLICY "appointments_all" ON appointments IS 'İşletme sahipleri kendi verilerini, SaaS sahipleri tüm verileri yönetebilir.';
