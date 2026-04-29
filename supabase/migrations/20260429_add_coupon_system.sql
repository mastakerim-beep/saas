-- Aura Spa ERP - Coupon System Migration
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    discount_type TEXT NOT NULL, -- 'percentage', 'fixed'
    discount_value NUMERIC(10,2) NOT NULL,
    expiry_date TIMESTAMPTZ,
    is_used BOOLEAN DEFAULT false,
    used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id, code)
);

-- Enable RLS
ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Imperial Hierarchy Policies
CREATE POLICY "SaaS_Owner can do everything on coupons" ON coupons
    FOR ALL TO authenticated USING ( (SELECT get_my_role()) = 'SaaS_Owner' );

CREATE POLICY "Business_Owner can manage their coupons" ON coupons
    FOR ALL TO authenticated USING ( business_id = (SELECT (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid) );

CREATE POLICY "Staff can view and use coupons" ON coupons
    FOR ALL TO authenticated USING ( business_id = (SELECT (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid) );
