-- ============================================================
-- 004 - RLS Yazma İzinlerini Onarma (Fix RLS Insert Policies)
-- ============================================================

-- 1. Mevcut Yetersiz Politikaları Temizle
DROP POLICY IF EXISTS "debts_all" ON debts;
DROP POLICY IF EXISTS "expenses_all" ON expenses;
DROP POLICY IF EXISTS "inventory_all" ON inventory;
DROP POLICY IF EXISTS "staff_all" ON staff;
DROP POLICY IF EXISTS "rooms_all" ON rooms;
DROP POLICY IF EXISTS "membership_plans_all" ON membership_plans;
DROP POLICY IF EXISTS "customer_memberships_all" ON customer_memberships;
DROP POLICY IF EXISTS "notification_logs_all" ON notification_logs;
DROP POLICY IF EXISTS "commission_rules_all" ON commission_rules;
DROP POLICY IF EXISTS "calendar_blocks_all" ON calendar_blocks;
DROP POLICY IF EXISTS "services_all" ON services;
DROP POLICY IF EXISTS "customer_media_all" ON customer_media;

-- 2. Yeni, Tam Yetkili Politikaları Tanımla (USING + WITH CHECK)
-- get_my_business_id() fonksiyonunu 002 migration dosyasında tanımlamıştık.

-- STAFF
CREATE POLICY "staff_all" ON staff FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- SERVICES
CREATE POLICY "services_all" ON services FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- DEBTS
CREATE POLICY "debts_all" ON debts FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- EXPENSES
CREATE POLICY "expenses_all" ON expenses FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- INVENTORY
CREATE POLICY "inventory_all" ON inventory FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- ROOMS
CREATE POLICY "rooms_all" ON rooms FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- MEMBERSHIP_PLANS
CREATE POLICY "membership_plans_all" ON membership_plans FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- CUSTOMER_MEMBERSHIPS
CREATE POLICY "customer_memberships_all" ON customer_memberships FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- COMMISSION_RULES
CREATE POLICY "commission_rules_all" ON commission_rules FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- CALENDAR_BLOCKS
CREATE POLICY "calendar_blocks_all" ON calendar_blocks FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- CUSTOMER_MEDIA
CREATE POLICY "customer_media_all" ON customer_media FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());

-- 3. NOTIFICATION_LOGS (Sadece Okuma ve Ekleme lazımsa daha kısıtlı yapılabilir ama şimdilik ALL)
CREATE POLICY "notification_logs_all" ON notification_logs FOR ALL
  USING (business_id = get_my_business_id())
  WITH CHECK (business_id = get_my_business_id());
