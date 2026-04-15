-- Aura Spa SaaS - Marketing Automation System
-- Date: 2026-04-15

-- 1. Marketing Rules Table
CREATE TABLE IF NOT EXISTS marketing_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    trigger_type TEXT NOT NULL, -- 'low_package_balance', 'birthday', 'churn_risk'
    threshold INT, -- e.g., 3 for low_balance
    message_template TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Notification Logs Table (History/Queue)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    type TEXT NOT NULL, -- 'WHATSAPP', 'SMS', 'EMAIL'
    content TEXT NOT NULL,
    status TEXT DEFAULT 'sent', -- 'queued', 'sent', 'failed'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    trigger_source TEXT -- 'low_balance_automation', 'birthday_automation', 'manual_campaign'
);

-- 3. RLS Policies
ALTER TABLE marketing_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "access_policy_marketing_rules" ON marketing_rules;
CREATE POLICY "access_policy_marketing_rules" ON marketing_rules 
FOR ALL TO authenticated 
USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

DROP POLICY IF EXISTS "access_policy_notification_logs" ON notification_logs;
CREATE POLICY "access_policy_notification_logs" ON notification_logs 
FOR ALL TO authenticated 
USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- 4. Realtime Publication
ALTER PUBLICATION supabase_realtime ADD TABLE marketing_rules, notification_logs;
