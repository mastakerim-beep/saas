-- Add category and color to rooms table
ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Genel',
ADD COLUMN IF NOT EXISTS color TEXT DEFAULT '#6366f1';

-- Ensure RLS is enabled and set (assuming it was already there, but good to reinforce)
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

-- Policy to allow users to see rooms of their own business
DROP POLICY IF EXISTS "Users can view their own business rooms" ON public.rooms;
CREATE POLICY "Users can view their own business rooms" ON public.rooms
    FOR SELECT USING (business_id = get_my_business_id());

-- Policy to allow business admins to manage rooms
DROP POLICY IF EXISTS "Admins can manage their business rooms" ON public.rooms;
CREATE POLICY "Admins can manage their business rooms" ON public.rooms
    FOR ALL USING (business_id = get_my_business_id());
