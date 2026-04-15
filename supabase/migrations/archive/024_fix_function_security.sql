-- 024 - Supabase Security Advisor Fixes
-- This migration hardens the search_path for critical functions 
-- to prevent potential "Search Path Shadowing" attacks as flagged by Security Advisor.

-- 1. Hardening get_my_role
-- Used in RLS policies to identify user level
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN COALESCE(auth.jwt() -> 'user_metadata' ->> 'role', 'anon');
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- 2. Hardening get_my_business_id
-- Used in RLS policies for multi-tenant isolation
CREATE OR REPLACE FUNCTION public.get_my_business_id()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;

-- 3. Hardening update_updated_at_column
-- Standard utility function for timestamp triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- 4. Hardening check_expense_branch_access
-- Complex RLS check with table lookups
CREATE OR REPLACE FUNCTION public.check_expense_branch_access(target_branch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    u_role TEXT;
    u_biz UUID;
BEGIN
    SELECT role, business_id INTO u_role, u_biz 
    FROM public.app_users 
    WHERE id = auth.uid();
    
    -- If SaaS owner, full access
    IF u_role = 'SaaS_Owner' THEN 
        RETURN true; 
    END IF;

    -- If Business Owner, check if branch belongs to their business
    IF u_role = 'Business_Owner' THEN
        RETURN EXISTS (SELECT 1 FROM public.branches WHERE id = target_branch_id AND business_id = u_biz);
    END IF;

    -- For Staff or Branch Manager, check user_branch_access
    IF u_role IN ('Branch_Manager', 'Staff') THEN
        RETURN EXISTS (
            SELECT 1 FROM public.user_branch_access 
            WHERE user_id = auth.uid() 
            AND branch_id = target_branch_id
        );
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- 5. Hardening handle_app_user_metadata_sync
-- Critical Auth sync function
CREATE OR REPLACE FUNCTION public.handle_app_user_metadata_sync()
RETURNS TRIGGER AS $$
BEGIN
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
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;
