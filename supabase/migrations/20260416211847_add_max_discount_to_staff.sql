-- Add max_discount column to staff table
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS max_discount NUMERIC DEFAULT 0;
COMMENT ON COLUMN public.staff.max_discount IS 'Personelin tek başına uygulayabileceği maksimum indirim oranı (%)';

-- Add manager_pin to businesses table for authorization
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS manager_pin TEXT DEFAULT '0000';
COMMENT ON COLUMN public.businesses.manager_pin IS 'Müdür onayı gerektiren işlemler için kullanılan 4 haneli güvenlik kodu';
