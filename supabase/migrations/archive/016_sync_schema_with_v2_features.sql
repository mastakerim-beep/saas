-- ============================================================
-- 016 - Aura V2 Features Schema Synchronization
-- ============================================================

-- 1. Create Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    service_name    TEXT NOT NULL,
    total_sessions  INT NOT NULL DEFAULT 1,
    used_sessions   INT NOT NULL DEFAULT 0,
    price           NUMERIC(10,2) NOT NULL DEFAULT 0,
    expiry          DATE NOT NULL,
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add Missing Columns to Appointments
-- selected_regions: For storing body map areas
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS selected_regions TEXT[] DEFAULT '{}';
-- is_paid: Tracking payment status on the card
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_paid BOOLEAN DEFAULT false;
-- payment_id: Linking to specific payment records
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS payment_id UUID REFERENCES payments(id) ON DELETE SET NULL;

-- 3. RLS Policies for Packages
ALTER TABLE packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "packages_select" ON packages;
CREATE POLICY "packages_select" ON packages 
    FOR SELECT TO authenticated 
    USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "packages_insert" ON packages;
CREATE POLICY "packages_insert" ON packages 
    FOR INSERT TO authenticated 
    WITH CHECK (business_id = get_my_business_id());

DROP POLICY IF EXISTS "packages_update" ON packages;
CREATE POLICY "packages_update" ON packages 
    FOR UPDATE TO authenticated 
    USING (business_id = get_my_business_id());

DROP POLICY IF EXISTS "packages_delete" ON packages;
CREATE POLICY "packages_delete" ON packages 
    FOR DELETE TO authenticated 
    USING (business_id = get_my_business_id());

-- 4. Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE packages;

-- 5. Indices for Performance
CREATE INDEX IF NOT EXISTS idx_packages_business ON packages(business_id);
CREATE INDEX IF NOT EXISTS idx_packages_customer ON packages(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_payment_id ON appointments(payment_id);
