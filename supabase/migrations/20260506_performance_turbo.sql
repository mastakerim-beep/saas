-- Aura Spa SaaS ERP - Performance & Indexing Turbo
-- Date: 2026-05-06
-- Focus: Resolve data fetching slowness and optimize RLS performance

-- 1. CRITICAL INDEXING (Hızın anahtarı)
-- Her ana tabloda business_id üzerinden sorgu yapıldığı için buralara index şart.
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_id ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_app_users_business_id ON app_users(business_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_business_id ON notification_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_business_id ON inventory(business_id);

-- 2. OPTIMIZED RLS HELPER (Daha hızlı ve kararlı)
-- Alt sorgu sayısını azaltmak için STABLE yerine IMMUTABLE benzeri davranış sergileyen basit kontroller
CREATE OR REPLACE FUNCTION get_my_biz_id_fast()
RETURNS uuid AS $$
  -- Sadece JWT'ye bak, eğer yoksa null dön (Uygulama bunu zaten handle ediyor)
  -- Veritabanı seviyesinde her satırda SELECT çekmek performansı öldürür.
  SELECT (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid;
$$ LANGUAGE SQL STABLE;

-- 3. HIGH-PERFORMANCE POLICIES
-- Alt sorguları (SELECT ...) USING içinden çıkarıp doğrudan kolon karşılaştırması yapıyoruz.

-- Appointments
DROP POLICY IF EXISTS "appointments_all" ON appointments;
CREATE POLICY "appointments_all" ON appointments FOR ALL
  TO authenticated
  USING (
    business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid 
    OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
  );

-- Customers
DROP POLICY IF EXISTS "customers_all" ON customers;
CREATE POLICY "customers_all" ON customers FOR ALL
  TO authenticated
  USING (
    business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid 
    OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
  );

-- App Users (Özellikle burada yavaşlık olabilir)
DROP POLICY IF EXISTS "app_users_read_self" ON app_users;
CREATE POLICY "app_users_read_self" ON app_users 
    FOR SELECT TO authenticated
    USING (
        auth.uid() = id 
        OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
    );

-- 5. AUTOMATIC METADATA SYNC (Hızın Gerçek Sırrı)
-- Kullanıcı güncellendiğinde işletme ID ve rolünü JWT'ye (Auth.Users) otomatik yazar.
-- Böylece RLS her satırda SELECT çekmek zorunda kalmaz.

CREATE OR REPLACE FUNCTION sync_app_user_to_metadata()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE auth.users
  SET raw_user_metadata = 
    coalesce(raw_user_metadata, '{}'::jsonb) || 
    jsonb_build_object(
      'business_id', NEW.business_id,
      'role', NEW.role,
      'full_name', NEW.name -- Tablodaki gerçek kolon adı 'name' olarak güncellendi
    )
  WHERE id = NEW.id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_sync_app_user_metadata ON app_users;
CREATE TRIGGER trg_sync_app_user_metadata
AFTER INSERT OR UPDATE OF business_id, role, name ON app_users
FOR EACH ROW EXECUTE FUNCTION sync_app_user_to_metadata();

-- Mevcut tüm kullanıcıları bir kez senkronize edelim
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT * FROM app_users LOOP
    UPDATE auth.users
    SET raw_user_metadata = 
      coalesce(raw_user_metadata, '{}'::jsonb) || 
      jsonb_build_object(
        'business_id', r.business_id,
        'role', r.role,
        'full_name', r.name -- Burası da güncellendi
      )
    WHERE id = r.id;
  END LOOP;
END $$;
