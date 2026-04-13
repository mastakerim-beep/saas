-- ============================================================
-- 012 - SaaS Owner Global Access & Conflict Prevention
-- Superadmin (SaaS_Owner) tüm verileri görebilmeli ve düzenleyebilmeli.
-- ============================================================

-- 1. Metadata Fonksiyonlarını Sağlamlaştıralım (Exception Handling)
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

-- 2. Kritik Tablolarda RLS Politikalarını Revize Et (SaaS_Owner Erişimi İçin)
-- SADECE business_id bazlı olanları SaaS_Owner için serbest bırakıyoruz.

-- [CUSTOMERS]
DROP POLICY IF EXISTS "customers_all" ON customers;
CREATE POLICY "customers_all" ON customers FOR ALL
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- [APPOINTMENTS]
DROP POLICY IF EXISTS "appointments_all" ON appointments;
CREATE POLICY "appointments_all" ON appointments FOR ALL
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- [PAYMENTS]
DROP POLICY IF EXISTS "payments_all" ON payments;
CREATE POLICY "payments_all" ON payments FOR ALL
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- [STAFF]
DROP POLICY IF EXISTS "staff_all" ON staff;
CREATE POLICY "staff_all" ON staff FOR ALL
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- [SERVICES]
DROP POLICY IF EXISTS "services_all" ON services;
CREATE POLICY "services_all" ON services FOR ALL
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- [AUDIT_LOGS]
DROP POLICY IF EXISTS "audit_logs_all" ON audit_logs;
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- 3. Çakışma Önleyici: Slug Uniqueness Yardımı
-- Eğer aynı slug'a sahip bir işletme eklenirse hata vermek yerine 
-- benzersizleştirme mantığı Master Panel'de (Client-side) zaten var,
-- ancak veritabanı seviyesinde slug kolonu UNIQUE kalsın.
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'businesses_slug_unique') THEN
        ALTER TABLE businesses ADD CONSTRAINT businesses_slug_unique UNIQUE (slug);
    END IF;
END $$;
