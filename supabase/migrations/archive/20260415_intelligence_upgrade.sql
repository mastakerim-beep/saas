-- 0. Dependency Check (Inventory Table)
CREATE TABLE IF NOT EXISTS inventory (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    category TEXT DEFAULT 'Genel',
    price NUMERIC(10,2) DEFAULT 0,
    stock INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 1. Dynamic Pricing Rules
CREATE TABLE IF NOT EXISTS dynamic_pricing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    day_of_week INT, -- 0-6 (Sunday-Saturday), NULL for all days
    start_time TIME,
    end_time TIME,
    modifier_percent DECIMAL NOT NULL, -- e.g., -20 for 20% discount, 10 for 10% premium
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Customer Wallets
CREATE TABLE IF NOT EXISTS customer_wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE UNIQUE,
    balance DECIMAL DEFAULT 0,
    loyalty_points INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    wallet_id UUID REFERENCES customer_wallets(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'LOAD', 'SPEND', 'POINT_EARN', 'POINT_REDEEM'
    amount DECIMAL NOT NULL,
    points INT DEFAULT 0,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Consultation Body Maps
CREATE TABLE IF NOT EXISTS consultation_body_maps (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES appointments(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    map_data JSONB NOT NULL, -- Stores SVG coordinates/notes
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Inventory Usage Norms (Predictive Base)
CREATE TABLE IF NOT EXISTS inventory_usage_norms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    service_id UUID REFERENCES services(id) ON DELETE CASCADE,
    product_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
    amount_per_service DECIMAL NOT NULL, -- e.g., 0.1 liters
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(service_id, product_id)
);

-- 6. RLS Policies
ALTER TABLE dynamic_pricing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE consultation_body_maps ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_usage_norms ENABLE ROW LEVEL SECURITY;

-- Dynamic Pricing RLS
DROP POLICY IF EXISTS "access_policy_pricing_rules" ON dynamic_pricing_rules;
CREATE POLICY "access_policy_pricing_rules" ON dynamic_pricing_rules 
FOR ALL TO authenticated 
USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- Wallets RLS
DROP POLICY IF EXISTS "access_policy_wallets" ON customer_wallets;
CREATE POLICY "access_policy_wallets" ON customer_wallets 
FOR ALL TO authenticated 
USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- Wallet Transactions RLS
DROP POLICY IF EXISTS "access_policy_wallet_transactions" ON wallet_transactions;
CREATE POLICY "access_policy_wallet_transactions" ON wallet_transactions 
FOR ALL TO authenticated 
USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- Body Maps RLS
DROP POLICY IF EXISTS "access_policy_body_maps" ON consultation_body_maps;
CREATE POLICY "access_policy_body_maps" ON consultation_body_maps 
FOR ALL TO authenticated 
USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- Usage Norms RLS
DROP POLICY IF EXISTS "access_policy_usage_norms" ON inventory_usage_norms;
CREATE POLICY "access_policy_usage_norms" ON inventory_usage_norms 
FOR ALL TO authenticated 
USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- 7. Realtime Publications
ALTER PUBLICATION supabase_realtime ADD TABLE 
    dynamic_pricing_rules, 
    customer_wallets, 
    wallet_transactions, 
    consultation_body_maps, 
    inventory_usage_norms;
