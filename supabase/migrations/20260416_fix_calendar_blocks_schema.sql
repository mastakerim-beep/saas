ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id); ALTER TABLE calendar_blocks ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id);
