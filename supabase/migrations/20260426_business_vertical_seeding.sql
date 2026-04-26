-- Migration: Multi-Vertical Seeding and Business Update Support
-- Description: Ensures all core tables have vertical awareness and seeds existing businesses.

-- 1. Businesses Table Vertical Array Support
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS verticals text[] DEFAULT '{spa}';

-- 2. Operational Tables Vertical String Support
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS vertical text DEFAULT 'spa';
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS vertical text DEFAULT 'spa';
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS vertical text DEFAULT 'spa';
ALTER TABLE public.payments ADD COLUMN IF NOT EXISTS vertical text DEFAULT 'spa';
ALTER TABLE public.rooms ADD COLUMN IF NOT EXISTS vertical text DEFAULT 'spa';

-- 3. Seeding: Ensure no NULL verticals exist for backward compatibility
UPDATE public.businesses SET verticals = '{spa}' WHERE verticals IS NULL;
UPDATE public.services SET vertical = 'spa' WHERE vertical IS NULL;
UPDATE public.staff SET vertical = 'spa' WHERE vertical IS NULL;
UPDATE public.appointments SET vertical = 'spa' WHERE vertical IS NULL;
UPDATE public.payments SET vertical = 'spa' WHERE vertical IS NULL;
UPDATE public.rooms SET vertical = 'spa' WHERE vertical IS NULL;

-- 4. Helpful Constraints (Optional but Recommended)
-- Ensures businesses always have at least one vertical
ALTER TABLE public.businesses ADD CONSTRAINT businesses_verticals_not_empty CHECK (array_length(verticals, 1) > 0);

-- 5. Comments for Documentation
COMMENT ON COLUMN public.businesses.verticals IS 'List of active kingdoms (verticals) for this business. Example: {spa, fitness}';
COMMENT ON COLUMN public.services.vertical IS 'The specific kingdom this service belongs to.';
