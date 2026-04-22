-- ============================================================
-- 028 - SaaS Final Authority & Login Fix
-- Sürüm: 1.0 (Critical)
-- Açıklama: 
-- 1. SaaS_Owner (kerim@mail.com) için kısırdöngü yetki problemini çözer.
-- 2. Business_Owner için kendi mühürlü kayıtlarını silme yetkisi verir.
-- 3. Süperadmin kullanıcısını app_users tablosuna mühürler.
-- ============================================================

-- 1. ROLE KONTROL FONKSİYONU GÜNCELLEMESİ (Fallback Mekanizması)
-- app_users tablosuna erişilemediği (RLS engeli) durumlarda doğrudan Auth Metadata'ya bakar.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS text AS $$
DECLARE
    user_role text;
BEGIN
    -- Önce tablodan bak
    SELECT role INTO user_role FROM public.app_users WHERE id = auth.uid();
    
    -- Tabloda yoksa (veya RLS engeli varsa) doğrudan JWT'den gelen metadata'ya bak (Fallback)
    IF user_role IS NULL THEN
        user_role := auth.jwt() -> 'user_metadata' ->> 'role';
    END IF;
    
    RETURN user_role;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. MÜHÜRLEME (SEALING) TETİKLEYİCİSİ GÜNCELLEMESİ
-- İşletme sahiplerinin kendi mühürlü kayıtlarını silmesine izin verir.
CREATE OR REPLACE FUNCTION public.check_appointment_seal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
AS $function$
BEGIN
  -- Eğer kayıt mühürlüyse (sealed)
  IF (OLD.is_sealed = true) THEN
    -- Sadece SaaS_Owner VEYA ilgili işletmenin Business_Owner'ı silebilir
    IF NOT EXISTS (
      SELECT 1 FROM public.app_users
      WHERE id = auth.uid() 
      AND (
        role = 'SaaS_Owner' 
        OR (role = 'Business_Owner' AND business_id = OLD.business_id)
      )
    ) THEN
      RAISE EXCEPTION 'Bu kayıt mühürlenmiştir. Sadece Sistem Sahibi veya İşletme Sahibi tarafından silinebilir.';
    END IF;
  END IF;
  RETURN OLD;
END;
$function$;

-- 3. SÜPERADMİN KULLANICISINI SİSTEME KAYDET (Safe Insert)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'kerim@mail.com') THEN
        INSERT INTO public.app_users (id, email, role, name)
        SELECT id, email, 'SaaS_Owner', 'Kerim Kardas'
        FROM auth.users
        WHERE email = 'kerim@mail.com'
        ON CONFLICT (id) DO UPDATE SET role = 'SaaS_Owner';
    END IF;
END $$;

-- 4. GLOBAL ACCESS POLICIES (Tekrar Doğrulama)
DROP POLICY IF EXISTS "appointments_all" ON appointments;
CREATE POLICY "appointments_all" ON appointments FOR ALL
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

DROP POLICY IF EXISTS "app_users_all" ON app_users;
CREATE POLICY "app_users_all" ON app_users FOR ALL
  USING (id = auth.uid() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (id = auth.uid() OR get_my_role() = 'SaaS_Owner');
