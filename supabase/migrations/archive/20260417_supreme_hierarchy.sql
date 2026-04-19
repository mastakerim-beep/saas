/*
  ==================================================================
  AURA SPA ERP - SUPREME HIERARCHY & HYPER-SCALE OPTIMIZATION (v1.2)
  ==================================================================
  - B-Tree Performance Indices
  - Employer Ownership Model
  - RLS Security Hardening
*/

-- 1. BUSINESSES TABLOSUNA SAHİPLİK DESTEĞİ
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='businesses' AND COLUMN_NAME='owner_id') THEN
        ALTER TABLE public.businesses ADD COLUMN owner_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 2. HYPER-SCALE PERFORMANS İNDEKSLERİ (B-TREE)
-- Sorguların binlerce veri arasından milisaniyeler içinde gelmesini sağlar.
CREATE INDEX IF NOT EXISTS idx_appointments_biz_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_biz_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_biz_id ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_biz_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_biz_id ON inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_services_biz_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_biz_id ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_branches_biz_id ON branches(business_id);
CREATE INDEX IF NOT EXISTS idx_debts_biz_id ON debts(business_id);
CREATE INDEX IF NOT EXISTS idx_package_defs_biz_id ON package_definitions(business_id);
CREATE INDEX IF NOT EXISTS idx_packages_biz_id ON packages(business_id);
CREATE INDEX IF NOT EXISTS idx_rooms_biz_id ON rooms(business_id);
CREATE INDEX IF NOT EXISTS idx_membership_plans_biz_id ON membership_plans(business_id);
CREATE INDEX IF NOT EXISTS idx_app_users_biz_id ON app_users(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_biz_id ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_z_reports_biz_id ON z_reports(business_id);
CREATE INDEX IF NOT EXISTS idx_commission_rules_biz_id ON commission_rules(business_id);
CREATE INDEX IF NOT EXISTS idx_calendar_blocks_biz_id ON calendar_blocks(business_id);
CREATE INDEX IF NOT EXISTS idx_quotes_biz_id ON quotes(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_wallets_biz_id ON customer_wallets(business_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_biz_id ON wallet_transactions(business_id);

-- 3. RLS (ROW LEVEL SECURITY) - JWT & METADATA TABANLI ERİŞİM (v1.3)
-- Businesses RLS: Kullanıcılar kendi işletmelerini görebilmeli.
DROP POLICY IF EXISTS "SaaS Owners manage all businesses" ON businesses;
CREATE POLICY "SaaS Owners manage all businesses" 
ON businesses FOR ALL 
USING (
  (auth.jwt() -> 'user_metadata' ->> 'role') = 'SaaS_Owner' OR
  auth.uid() = owner_id OR
  id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID
);

-- Genel Tablo Erişimi: JWT tabanlı hızlı ve döngüsüz yetkilendirme.
DO $$ 
DECLARE
    tbl text;
    tables text[] := ARRAY['appointments', 'staff', 'customers', 'payments', 'inventory', 'expenses', 'audit_logs', 'debts', 'branches', 'rooms', 'services', 'packages'];
BEGIN
    FOR tbl IN SELECT unnest(tables)
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS "access_policy_%s" ON %I', tbl, tbl);
        EXECUTE format('CREATE POLICY "access_policy_%s" ON %I FOR ALL USING (
            business_id = (auth.jwt() -> ''user_metadata'' ->> ''business_id'')::UUID OR
            (auth.jwt() -> ''user_metadata'' ->> ''role'') = ''SaaS_Owner''
        )', tbl, tbl);
    END LOOP;
END $$;
