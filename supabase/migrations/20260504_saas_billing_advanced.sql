-- Aura Spa SaaS ERP - Advanced Billing & Webhook Infrastructure
-- Date: 2026-05-04

-- 1. SAAS PAYMENT PLANS
CREATE TABLE IF NOT EXISTS saas_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    code TEXT UNIQUE NOT NULL, -- 'basic', 'enterprise', 'custom'
    monthly_price NUMERIC(10,2) NOT NULL,
    yearly_price NUMERIC(10,2) NOT NULL,
    max_users INT DEFAULT 5,
    max_branches INT DEFAULT 1,
    features JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. SUBSCRIPTION INVOICES (SaaS level)
CREATE TABLE IF NOT EXISTS saas_invoices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    status TEXT DEFAULT 'pending', -- 'pending', 'paid', 'failed', 'refunded'
    billing_period_start DATE,
    billing_period_end DATE,
    invoice_url TEXT,
    payment_method TEXT,
    stripe_invoice_id TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. WEBHOOK EVENTS (Audit log for external payment gateways)
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gateway TEXT NOT NULL, -- 'stripe', 'iyzico'
    external_id TEXT,
    event_type TEXT,
    payload JSONB,
    processed_at TIMESTAMPTZ,
    status TEXT DEFAULT 'pending', -- 'pending', 'processed', 'error'
    error_log TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. INSERT DEFAULT PLANS
INSERT INTO saas_plans (name, code, monthly_price, yearly_price, max_users, max_branches, features)
VALUES 
('Aura Basic', 'basic', 1490.00, 14900.00, 5, 1, '{"ai": false, "multi_branch": false, "reporting": "basic"}'),
('Imperial Enterprise', 'enterprise', 4990.00, 49900.00, 999, 999, '{"ai": true, "multi_branch": true, "reporting": "advanced", "god_mode": true}')
ON CONFLICT (code) DO NOTHING;

-- 5. FUNCTION: Sync business plan data with saas_plans
CREATE OR REPLACE FUNCTION sync_business_limits()
RETURNS TRIGGER AS $$
DECLARE
    plan_limits RECORD;
BEGIN
    SELECT * INTO plan_limits FROM saas_plans WHERE name = NEW.plan OR code = LOWER(NEW.plan);
    
    IF FOUND THEN
        NEW.max_users = plan_limits.max_users;
        NEW.max_branches = plan_limits.max_branches;
        NEW.mrr = plan_limits.monthly_price;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_sync_business_limits
BEFORE INSERT OR UPDATE OF plan ON businesses
FOR EACH ROW EXECUTE FUNCTION sync_business_limits();

-- 6. INDEXES
CREATE INDEX IF NOT EXISTS idx_saas_invoices_biz ON saas_invoices(business_id);
CREATE INDEX IF NOT EXISTS idx_webhook_external_id ON webhook_events(external_id);
