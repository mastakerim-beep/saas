-- ============================================================
-- 027 - SaaS & Business Owner Global RLS Yetkilendirmesi
-- Sürüm: 1.2 (Final)
-- Açıklama: 
-- 1. SaaS_Owner rolü için tüm işletmelerde tam yetki sağlar.
-- 2. Business_Owner rolü için sadece kendi business_id verilerinde tam yetki sağlar.
-- ============================================================

-- 1. YARDIMCI FONKSİYONLAR
CREATE OR REPLACE FUNCTION is_saas_owner()
RETURNS BOOLEAN AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'role') = 'SaaS_Owner';
$$ LANGUAGE SQL STABLE;

CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS uuid AS $$
  SELECT (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid;
$$ LANGUAGE SQL STABLE;

-- 2. KRİTİK TABLOLARDAKİ RLS POLİTİKALARINI GÜNCELLE
-- Not: Her tablo için 'all' yetkisi tanımlanıyor.

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
DROP POLICY IF EXISTS "staff_all" ON staff;
CREATE POLICY "staff_all" ON staff FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- INVENTORY
DROP POLICY IF EXISTS "inventory_all" ON inventory;
CREATE POLICY "inventory_all" ON inventory FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- AUDIT_LOGS
DROP POLICY IF EXISTS "audit_logs_all" ON audit_logs;
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- Z_REPORTS
DROP POLICY IF EXISTS "z_reports_all" ON z_reports;
CREATE POLICY "z_reports_all" ON z_reports FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- AI_INSIGHTS
DROP POLICY IF EXISTS "ai_insights_all" ON ai_insights;
CREATE POLICY "ai_insights_all" ON ai_insights FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

-- APP_USERS
DROP POLICY IF EXISTS "app_users_all" ON app_users;
CREATE POLICY "app_users_all" ON app_users FOR ALL
  USING (business_id = get_my_business_id() OR is_saas_owner())
  WITH CHECK (business_id = get_my_business_id() OR is_saas_owner());

COMMENT ON POLICY "appointments_all" ON appointments IS 'İşletme sahipleri kendi verilerini (Business_Owner), SaaS sahipleri (kerim@mail.com) tüm sistemi yönetebilir.';
