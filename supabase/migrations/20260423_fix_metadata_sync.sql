-- ============================================================
-- 030 - AURA SPA: Metadata Sync Fix & SaaS_Owner Recovery
-- ============================================================

-- 1. Metadata Senkronizasyon Tetikleyicisini İyileştir
-- Sadece UPDATE değil, INSERT anında da metadata'yı senkronize etmeli.
CREATE OR REPLACE FUNCTION public.sync_app_user_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE auth.users
    SET raw_user_meta_data = 
        COALESCE(raw_user_meta_data, '{}'::jsonb) || 
        jsonb_build_object(
            'role', NEW.role,
            'business_id', NEW.business_id,
            'name', NEW.name,
            'permissions', NEW.permissions
        )
    WHERE id = NEW.id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_app_users_sync_auth ON public.app_users;
CREATE TRIGGER on_app_users_sync_auth
    AFTER INSERT OR UPDATE ON public.app_users
    FOR EACH ROW
    EXECUTE FUNCTION public.sync_app_user_to_auth();

-- 2. Mevcut Kullanıcıları Senkronize Et (Kerim ve Diğerleri)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN SELECT * FROM public.app_users LOOP
        UPDATE auth.users
        SET raw_user_meta_data = 
            COALESCE(raw_user_meta_data, '{}'::jsonb) || 
            jsonb_build_object(
                'role', r.role,
                'business_id', r.business_id,
                'name', r.name,
                'permissions', r.permissions
            )
        WHERE id = r.id;
    END LOOP;
END $$;
