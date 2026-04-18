-- Add missing columns to appointments table
-- This allows persistent storage of referral source and body map regions per appointment

DO $$ 
BEGIN 
    -- 1. communication_source
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='communication_source') THEN
        ALTER TABLE public.appointments ADD COLUMN communication_source TEXT;
    END IF;
    
    -- 2. selected_regions
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='selected_regions') THEN
        ALTER TABLE public.appointments ADD COLUMN selected_regions TEXT[] DEFAULT '{}';
    END IF;

    -- 3. body_map_data (Optional JSONB for richer data)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='body_map_data') THEN
        ALTER TABLE public.appointments ADD COLUMN body_map_data JSONB;
    END IF;
END $$;
