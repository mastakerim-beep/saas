-- ============================================================
-- 032 - Supabase Permission Sync & RLS Hardening
-- ============================================================

-- 1. YARDIMCI FONKSİYON: JWT'den Yetki Kontrolü
-- Kullanıcının JWT (MetaData) içindeki yetkilerini çok hızlı kontrol eder.
CREATE OR REPLACE FUNCTION public.check_jwt_permission(perm TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    role TEXT;
    perms TEXT[];
BEGIN
    -- JWT'den rolü oku
    role := (auth.jwt() -> 'user_metadata' ->> 'role');
    
    -- Eğer SaaS_Owner veya Business_Owner ise her zaman TRUE
    IF role = 'SaaS_Owner' OR role = 'Business_Owner' THEN
        RETURN TRUE;
    END IF;

    -- JWT'den yetki dizisini oku ve kontrol et
    -- Supabase metadata'da diziler JSONB array olarak saklanır
    RETURN (auth.jwt() -> 'user_metadata' -> 'permissions') @> jsonb_build_array(perm);
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- 2. SENKRONİZASYON FONKSİYONU: AppUser -> Auth Metadata
-- public.app_users tablosunda yapılan her değişiklik (role, permissions) 
-- otomatik olarak auth.users tablosundaki metadata'ya yazılır.
CREATE OR REPLACE FUNCTION public.sync_app_user_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = 
        jsonb_set(
            jsonb_set(
                COALESCE(raw_user_meta_data, '{}'::jsonb),
                '{role}',
                to_jsonb(NEW.role)
            ),
            '{permissions}',
            to_jsonb(NEW.permissions)
        )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Tetikleyiciyi Oluştur
DROP TRIGGER IF EXISTS on_app_users_sync_auth ON public.app_users;
CREATE TRIGGER on_app_users_sync_auth
    AFTER UPDATE OF role, permissions ON public.app_users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_app_user_to_auth();

-- 3. RLS POLİTİKALARINI YENİ YETKİ SİSTEMİNE GÖRE GÜNCELLE
-- (Eski politikaları kaldırıp yenilerini tanımlıyoruz)

-- APPOINTMENTS: Silme Yetkisi (delete_appt)
DROP POLICY IF EXISTS "appointments_delete" ON appointments;
CREATE POLICY "appointments_delete" ON appointments FOR DELETE
USING (
    business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID AND
    public.check_jwt_permission('delete_appt')
);

-- STAFF: Yönetim Yetkisi (manage_staff)
DROP POLICY IF EXISTS "staff_all" ON staff;
CREATE POLICY "staff_select" ON staff FOR SELECT USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);
CREATE POLICY "staff_manage" ON staff FOR ALL
USING (
    business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID AND
    public.check_jwt_permission('manage_staff')
)
WITH CHECK (
    business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID AND
    public.check_jwt_permission('manage_staff')
);

-- APP_USERS: Yetki Yönetimi (manage_users)
-- Sadece manage_users yetkisi olanlar (veya Business_Owner) başkasını güncelleyebilir.
DROP POLICY IF EXISTS "app_users_update" ON app_users;
CREATE POLICY "app_users_update" ON app_users FOR UPDATE
USING (
    business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID AND
    public.check_jwt_permission('manage_users')
);

-- PAYMENTS: Silme Yetkisi (delete_appt veya ayrı bir delete_payment yetkisi eklenebilir)
DROP POLICY IF EXISTS "payments_delete" ON payments;
CREATE POLICY "payments_delete" ON payments FOR DELETE
USING (
    business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID AND
    (public.check_jwt_permission('delete_appt') OR public.check_jwt_permission('manage_users'))
);
