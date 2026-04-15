-- ============================================================
-- AURA SPA SaaS ERP - ÖDEME ARAÇLARI & KASA ENTEGRASYONU
-- ============================================================

-- 1. PAYMENTS TABLOSUNA ÖDEME ARACI KOLONU EKLE
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'payments' AND column_name = 'payment_definition_id') THEN
        ALTER TABLE payments ADD COLUMN payment_definition_id UUID REFERENCES payment_definitions(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 2. PAYMENTS TABLOSUNA ŞUBE DESTEĞİ (Zaten Vardı Kontrol Et)
-- BRANCH_ID zaten MASTER_DB_INSTALL.sql içinde tanımlı.

-- 3. RLS POLİTİKALARI (GLOBAL_SAAS_OWNER_UNIFICATION Örneğine Göre Yenile/Ekle)
DROP POLICY IF EXISTS "payments_saas_all" ON payments;
CREATE POLICY "payments_saas_all" ON payments FOR ALL
USING (
    business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'SaaS_Owner'
)
WITH CHECK (
    business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID
    OR (auth.jwt() -> 'user_metadata' ->> 'role') = 'SaaS_Owner'
);

-- 4. KASA ANALİZİ İÇİN INDEX
CREATE INDEX IF NOT EXISTS idx_payments_definition ON payments(payment_definition_id);
CREATE INDEX IF NOT EXISTS idx_payments_date_branch ON payments(date, branch_id);
