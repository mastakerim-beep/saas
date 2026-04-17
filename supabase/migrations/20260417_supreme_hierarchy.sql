-- AURA SPA SaaS ERP - SUPREME HIERARCHY & PERFORMANCE OPTIMIZATION
-- Tarih: 2026-04-17

-- 1. MÜLKİYET DESTEĞİ (OWNERSHIP SUPPORT)
-- Yeni bir işletme oluşturulduğunda onu bir 'Patron' (Employer) ile eşleştirmemizi sağlar.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS owner_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- 2. HIZ İNDEKSLERİ (PERFORMANCE INDEXING)
-- Bu indeksler, hiyerarşik veri çekme işlemlerini milisaniyeler seviyesine indirir.
CREATE INDEX IF NOT EXISTS idx_branches_business_id ON branches(business_id);
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_business_id ON membership_plans(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_business_id ON customer_memberships(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_debts_business_id ON debts(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_id ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_business_id ON inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_rooms_business_id ON rooms(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_media_business_id ON customer_media(business_id);
CREATE INDEX IF NOT EXISTS idx_packages_business_id ON packages(business_id);
CREATE INDEX IF NOT EXISTS idx_package_definitions_business_id ON package_definitions(business_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_business_id ON commission_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_business_id ON calendar_blocks(business_id);
CREATE INDEX IF NOT EXISTS idx_notification_logs_business_id ON notification_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_z_reports_business_id ON z_reports(business_id);
CREATE INDEX IF NOT EXISTS idx_payment_definitions_business_id ON payment_definitions(business_id);
CREATE INDEX IF NOT EXISTS idx_bank_accounts_business_id ON bank_accounts(business_id);
CREATE INDEX IF NOT EXISTS idx_expense_categories_business_id ON expense_categories(business_id);
CREATE INDEX IF NOT EXISTS idx_referral_sources_business_id ON referral_sources(business_id);
CREATE INDEX IF NOT EXISTS idx_consent_form_templates_business_id ON consent_form_templates(business_id);
CREATE INDEX IF NOT EXISTS idx_quotes_business_id ON quotes(business_id);
CREATE INDEX IF NOT EXISTS idx_system_announcements_business_id ON system_announcements(business_id);
CREATE INDEX IF NOT EXISTS idx_tenant_modules_business_id ON tenant_modules(business_id);
CREATE INDEX IF NOT EXISTS idx_booking_settings_business_id ON booking_settings(business_id);
CREATE INDEX IF NOT EXISTS idx_ai_insights_business_id ON ai_insights(business_id);
CREATE INDEX IF NOT EXISTS idx_marketing_rules_business_id ON marketing_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_pricing_rules_business_id ON dynamic_pricing_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_wallets_business_id ON customer_wallets(business_id);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_business_id ON wallet_transactions(business_id);
CREATE INDEX IF NOT EXISTS idx_consultation_body_maps_business_id ON consultation_body_maps(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_usage_norms_business_id ON inventory_usage_norms(business_id);

-- 3. RLS GÜNCELLEMESİ (HIERARCHY EVOLUTION)
-- Patronların (Employer) kendi sahip oldukları işletmelere erişebilmesini sağlar.

-- HELPER: is_business_owner (Yeni bir güvenlik fonksiyonu)
CREATE OR REPLACE FUNCTION public.is_business_owner(target_biz_id UUID) RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.businesses 
    WHERE id = target_biz_id AND owner_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

-- Global Policy Yenileme
DO $$ 
DECLARE 
    tbl TEXT;
    tables TEXT[] := ARRAY[
        'branches', 'appointments', 'customers', 'membership_plans', 
        'customer_memberships', 'payments', 'debts', 'staff', 
        'inventory', 'rooms', 'expenses', 'services', 
        'audit_logs', 'customer_media', 'packages', 
        'package_definitions', 'commission_rules', 
        'calendar_blocks', 'notification_logs', 'z_reports',
        'payment_definitions', 'bank_accounts', 'expense_categories', 
        'referral_sources', 'consent_form_templates', 'quotes',
        'system_announcements', 'tenant_modules', 'booking_settings',
        'ai_insights', 'marketing_rules', 'dynamic_pricing_rules', 
        'customer_wallets', 'wallet_transactions', 'consultation_body_maps', 
        'inventory_usage_norms'
    ];
BEGIN 
    FOR tbl IN SELECT unnest(tables) LOOP
        -- Drop if exists and create new unified policy
        EXECUTE format('DROP POLICY IF EXISTS "access_policy_%s" ON public.%I', tbl, tbl);
        EXECUTE format('CREATE POLICY "access_policy_%s" ON public.%I FOR ALL TO authenticated USING (business_id = get_my_business_id() OR is_business_owner(business_id) OR get_my_role() = ''SaaS_Owner'')', tbl, tbl);
    END LOOP;
END $$;

-- Businesses tablosu için özel RLS
DROP POLICY IF EXISTS "access_policy_businesses" ON public.businesses;
CREATE POLICY "access_policy_businesses" ON public.businesses 
FOR ALL TO authenticated 
USING (id = get_my_business_id() OR owner_id = auth.uid() OR get_my_role() = 'SaaS_Owner');

-- 4. OTOMATİK MÜLKİYET ATAMASI (Opsiyonel - Mevcut veriler için)
-- Eğer owner_name alanı mail içeriyorsa veya işletme sahibi belliyse manuel atanmalıdır.
