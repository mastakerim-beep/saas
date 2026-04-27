-- ============================================================
-- 031 - AURA SPA SaaS ERP: PUBLIC BOOKING ACCESS PATCH
-- Description: Enables guest (anon) users to view public business data
-- required for the appointment booking portal.
-- ============================================================

-- 1. BUSINESSES: Allow anyone to view basic business info
-- (Required to resolve slug -> business_id)
DROP POLICY IF EXISTS "public_view_businesses" ON public.businesses;
CREATE POLICY "public_view_businesses" ON public.businesses 
FOR SELECT USING (status = 'active');

-- 2. BRANCHES: Allow guests to see branches for booking
DROP POLICY IF EXISTS "public_view_branches" ON public.branches;
CREATE POLICY "public_view_branches" ON public.branches 
FOR SELECT USING (status = 'Aktif');

-- 3. SERVICES: Allow guests to see public services
DROP POLICY IF EXISTS "public_view_services" ON public.services;
CREATE POLICY "public_view_services" ON public.services 
FOR SELECT USING (is_public = true);

-- 4. STAFF: Allow guests to see therapists/staff for booking
DROP POLICY IF EXISTS "public_view_staff" ON public.staff;
CREATE POLICY "public_view_staff" ON public.staff 
FOR SELECT USING (status = 'active' AND is_visible_on_calendar = true);

-- 5. BOOKING SETTINGS: Allow guests to see booking rules
DROP POLICY IF EXISTS "public_view_booking_settings" ON public.booking_settings;
CREATE POLICY "public_view_booking_settings" ON public.booking_settings 
FOR SELECT USING (is_enabled = true);

-- 6. MEMBERSHIP PLANS: Allow guests to see available plans
DROP POLICY IF EXISTS "public_view_membership_plans" ON public.membership_plans;
CREATE POLICY "public_view_membership_plans" ON public.membership_plans 
FOR SELECT USING (true);

-- 7. APPOINTMENTS (INSERT ONLY): Allow guests to create appointments
DROP POLICY IF EXISTS "public_create_appointments" ON public.appointments;
CREATE POLICY "public_create_appointments" ON public.appointments 
FOR INSERT WITH CHECK (is_online = true);

-- SECURITY NOTE: 
-- These policies allow SELECT access without 'authenticated' role.
-- Sensitive tables like 'payments', 'customers', 'audit_logs', and 'app_users' 
-- remain STRICTLY PROTECTED by the supreme authority RLS.
