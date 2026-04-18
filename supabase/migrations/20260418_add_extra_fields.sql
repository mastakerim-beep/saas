-- Aura Spa ERP - COMPREHENSIVE SCHEMA STABILIZATION (v2.0)
-- This migration restores all missing tables and columns required by the premium UI features.

DO $$ 
BEGIN 
    -- 1. BUSINESSES TABLE UPDATES
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='businesses' AND COLUMN_NAME='manager_pin') THEN
        ALTER TABLE public.businesses ADD COLUMN manager_pin TEXT DEFAULT '0000';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='businesses' AND COLUMN_NAME='calendar_start_hour') THEN
        ALTER TABLE public.businesses ADD COLUMN calendar_start_hour INT DEFAULT 9;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='businesses' AND COLUMN_NAME='calendar_end_hour') THEN
        ALTER TABLE public.businesses ADD COLUMN calendar_end_hour INT DEFAULT 21;
    END IF;

    -- 2. PAYMENTS TABLE UPDATES
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='payments' AND COLUMN_NAME='reference_code') THEN
        ALTER TABLE public.payments ADD COLUMN reference_code TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='payments' AND COLUMN_NAME='is_gift') THEN
        ALTER TABLE public.payments ADD COLUMN is_gift BOOLEAN DEFAULT FALSE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='payments' AND COLUMN_NAME='original_price') THEN
        ALTER TABLE public.payments ADD COLUMN original_price NUMERIC(10,2) DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='payments' AND COLUMN_NAME='gift_note') THEN
        ALTER TABLE public.payments ADD COLUMN gift_note TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='payments' AND COLUMN_NAME='sold_products') THEN
        ALTER TABLE public.payments ADD COLUMN sold_products JSONB DEFAULT '[]';
    END IF;

    -- 3. APPOINTMENTS TABLE UPDATES
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='communication_source') THEN
        ALTER TABLE public.appointments ADD COLUMN communication_source TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='selected_regions') THEN
        ALTER TABLE public.appointments ADD COLUMN selected_regions TEXT[] DEFAULT '{}';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='body_map_data') THEN
        ALTER TABLE public.appointments ADD COLUMN body_map_data JSONB;
    END IF;

    -- 4. BOOKING_SETTINGS TABLE UPDATES
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='booking_settings' AND COLUMN_NAME='is_enabled') THEN
        ALTER TABLE public.booking_settings ADD COLUMN is_enabled BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='booking_settings' AND COLUMN_NAME='require_deposit') THEN
        ALTER TABLE public.booking_settings ADD COLUMN require_deposit BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='booking_settings' AND COLUMN_NAME='deposit_percentage') THEN
        ALTER TABLE public.booking_settings ADD COLUMN deposit_percentage INT DEFAULT 20;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='booking_settings' AND COLUMN_NAME='allow_staff_select') THEN
        ALTER TABLE public.booking_settings ADD COLUMN allow_staff_select BOOLEAN DEFAULT true;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='booking_settings' AND COLUMN_NAME='booking_message') THEN
        ALTER TABLE public.booking_settings ADD COLUMN booking_message TEXT DEFAULT 'Bizi tercih ettiğiniz için teşekkürler.';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='booking_settings' AND COLUMN_NAME='updated_at') THEN
        ALTER TABLE public.booking_settings ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- 5. MISSING TABLES RESTORATION

CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'WHATSAPP', 'SMS', 'EMAIL'
    content TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    trigger_source TEXT DEFAULT 'manual'
);

CREATE TABLE IF NOT EXISTS marketing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL,
    threshold INT,
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    day_of_week INT,
    modifier_percent DECIMAL NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS customer_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL DEFAULT 0,
    loyalty_points INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES customer_wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    amount DECIMAL NOT NULL,
    points INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS consultation_body_maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    map_data JSONB NOT NULL,
    is_critical BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inventory_usage_norms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    product_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    amount_per_service DECIMAL NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id, product_id)
);

-- 6. FINAL PATCHES FOR PREMIUM FEATURES (v2.1)
-- Added missing columns for AI Reports and Internal Notifications
ALTER TABLE public.z_reports ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE public.notification_logs ALTER COLUMN customer_id DROP NOT NULL;
