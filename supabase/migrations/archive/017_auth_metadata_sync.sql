-- ============================================================
-- 017 - Auth Metadata Synchronization
-- Ensures that RLS (get_my_role, get_my_business_id) always has 
-- access to the latest data from the app_users table.
-- ============================================================

-- Function: Sync app_users data to auth.users metadata
-- Needs SECURITY DEFINER to bypass RLS on auth.users
CREATE OR REPLACE FUNCTION public.handle_app_user_metadata_sync()
RETURNS TRIGGER AS $$
BEGIN
  -- We update the auth.users table directly. 
  -- Note: This requires the function creator to have sufficient permissions (standard in Supabase)
  UPDATE auth.users
  SET raw_user_meta_data = 
    COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    jsonb_build_object(
      'role', NEW.role,
      'business_id', NEW.business_id,
      'name', NEW.name
    )
  WHERE id = NEW.id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger: Execute on every INSERT or UPDATE in app_users
DROP TRIGGER IF EXISTS on_app_user_change ON public.app_users;
CREATE TRIGGER on_app_user_change
  AFTER INSERT OR UPDATE ON public.app_users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_app_user_metadata_sync();

-- One-time sync: Update all existing users to ensure metadata is consistent
-- This is useful if some users were created before this trigger was added.
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
                'name', r.name
            )
        WHERE id = r.id;
    END LOOP;
END $$;
