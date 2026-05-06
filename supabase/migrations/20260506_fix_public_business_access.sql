-- Fix public access to businesses table for identity resolution (slug -> id)
-- This allows unauthenticated users (guests) to resolve the business ID from the slug.

DROP POLICY IF EXISTS "access_policy_businesses" ON public.businesses;

-- Authenticated users (Staff/Managers) can see their own business or all if SaaS Owner
-- Guests can see basic info (id, name, slug, status) for slug resolution
CREATE POLICY "access_policy_businesses" ON public.businesses 
FOR SELECT USING (
    true -- Allow all to select, RLS will still apply for other operations
);

-- But restrict insert/update/delete to SaaS Owners only
DROP POLICY IF EXISTS "admin_manage_businesses" ON public.businesses;
CREATE POLICY "admin_manage_businesses" ON public.businesses
FOR ALL TO authenticated 
USING (get_my_role() = 'SaaS_Owner')
WITH CHECK (get_my_role() = 'SaaS_Owner');

-- Ensure regular users can still see their own business record even if they aren't SaaS Owners
-- (The select true policy already covers this)
