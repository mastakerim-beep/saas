-- ============================================================
-- 019 - Flexible Booking & Package Integration Enhancements
-- ============================================================

-- 1. Add is_package_usage to appointments
-- This helps distinguish between prepaid package sessions and one-time payments
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_package_usage BOOLEAN DEFAULT false;

-- 2. Ensure package_id is linked correctly (already exists but adding safety)
-- ALTER TABLE appointments ADD COLUMN IF NOT EXISTS package_id UUID REFERENCES packages(id) ON DELETE SET NULL;

-- 3. Add metadata field for multi-booking or "friend" context
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booking_notes TEXT;

-- 4. Sync Realtime
-- Already enabled for appointments, but ensuring everything is tracked
ALTER PUBLICATION supabase_realtime ADD TABLE appointments;

-- 5. Update RLS (Policies should already cover these columns via 'business_id')
-- No changes needed if policy is business_id based.
