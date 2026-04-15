-- 009_add_room_id_to_appointments.sql
-- Add room_id to appointments to enable room management integration

ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_appointments_room_id ON appointments(room_id);

-- Update RLS if necessary (usually if we filter by room_id in policies, 
-- but here we rely on business_id level RLS which is already in place)
