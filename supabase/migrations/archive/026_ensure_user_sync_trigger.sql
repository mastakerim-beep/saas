-- ============================================================
-- 026 - Auth to AppUser Automatic Sync (RLS Guard)
-- Ensures that when a user is created in auth.users (e.g. via 
-- provision-user or manual signup), they automatically get a 
-- record in public.app_users, which is required for our RLS 
-- functions (get_my_business_id) to work.
-- ============================================================

-- Function to handle the insertion into public.app_users
CREATE OR REPLACE FUNCTION public.handle_auth_user_created()
RETURNS TRIGGER AS $$
DECLARE
    biz_id UUID;
    u_role TEXT;
    u_name TEXT;
BEGIN
    -- Extract info from raw_user_meta_data
    biz_id := (NEW.raw_user_meta_data->>'business_id')::UUID;
    u_role := COALESCE(NEW.raw_user_meta_data->>'role', 'Staff');
    u_name := COALESCE(NEW.raw_user_meta_data->>'name', NEW.email);

    -- Only insert if we have a business_id or if it's a SaaS_Owner signup
    -- We use ON CONFLICT to avoid errors if the record already exists
    INSERT INTO public.app_users (id, business_id, role, name, email, created_at)
    VALUES (NEW.id, biz_id, u_role, u_name, NEW.email, NOW())
    ON CONFLICT (id) DO UPDATE SET
        business_id = EXCLUDED.business_id,
        role = EXCLUDED.role;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users (requires superuser/standard Supabase setup)
-- We use AFTER INSERT on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_created();

-- Also handle UPDATES to metadata (e.g. role changes via admin)
CREATE OR REPLACE FUNCTION public.handle_auth_user_updated()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.raw_user_meta_data->>'business_id' IS DISTINCT FROM OLD.raw_user_meta_data->>'business_id' OR
        NEW.raw_user_meta_data->>'role' IS DISTINCT FROM OLD.raw_user_meta_data->>'role') THEN
        
        UPDATE public.app_users SET
            business_id = (NEW.raw_user_meta_data->>'business_id')::UUID,
            role = COALESCE(NEW.raw_user_meta_data->>'role', role)
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_updated ON auth.users;
CREATE TRIGGER on_auth_user_updated
  AFTER UPDATE ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_auth_user_updated();
