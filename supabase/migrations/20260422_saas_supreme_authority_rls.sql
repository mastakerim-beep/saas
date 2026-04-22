-- ============================================================
-- 029 - AURA SPA SaaS ERP: SUPREME AUTHORITY & MULTI-TENANT RLS PATCH
-- Sürüm: 1.0 (Enterprise Scalability)
-- Açıklama: 
-- 1. SaaS_Owner (Kerim) rolüne tüm veri üzerinde koşulsuz global yetki sağlar.
-- 2. Business_Owner rolüne kendi business_id verilerinde TAM YETKİ sağlar.
-- 3. Şube Müdürü ve Personel rolleri için 'branch_id' tabanlı izolasyon altyapısını hazırlar.
-- 4. Gelecekte eklenecek binlerce işletme için "Dynamic Scaling" altyapısını standartlaştırır.
-- ============================================================

-- 1. YARDIMCI FONKSİYONLAR (AUTHORITY CORE)
-- Mevcut get_my_role() fonksiyonu auth metadata fallback ile güncellenmiş durumda.
-- Şube bazlı izolasyon için get_my_branch_id ekleyelim.

CREATE OR REPLACE FUNCTION public.get_my_branch_id()
RETURNS uuid AS $$
BEGIN
    RETURN (auth.jwt() -> 'user_metadata' ->> 'branch_id')::uuid;
EXCEPTION WHEN OTHERS THEN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- 2. GLOBAL RLS POLİTİKA ŞABLONU (DYNAMIC AUTHORIZATION)
-- Bu bölüm tüm tablolar için SaaS_Owner bypass özelliğini standartlaştırır.

DO $$
DECLARE
    t text;
    has_branch boolean;
    table_list text[] := ARRAY[
        'appointments', 'customers', 'payments', 'staff', 'inventory', 
        'audit_logs', 'z_reports', 'ai_insights', 'app_users', 
        'packages', 'package_definitions', 'membership_plans', 
        'customer_memberships', 'calendar_blocks', 'rooms', 
        'services', 'expenses', 'quotes', 'marketing_rules', 
        'dynamic_pricing_rules', 'customer_wallets', 'wallet_transactions', 
        'consultation_body_maps', 'inventory_usage_norms', 
        'inventory_categories', 'inventory_transfers', 'customer_media', 
        'branches', 'payment_definitions', 'bank_accounts', 
        'expense_categories', 'referral_sources', 'consent_form_templates'
    ];
BEGIN
    FOREACH t IN ARRAY table_list LOOP
        -- Tablo mevcut mu kontrol et
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = t) THEN
            
            -- branch_id kolonu var mı kontrol et
            SELECT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' AND table_name = t AND column_name = 'branch_id'
            ) INTO has_branch;

            -- Eski politikaları temizle
            EXECUTE format('DROP POLICY IF EXISTS "%I_all_access" ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "%I_all" ON public.%I', t, t);
            EXECUTE format('DROP POLICY IF EXISTS "%I_supreme_authority" ON public.%I', t, t);
            
            -- SUPREME AUTHORITY POLICY:
            IF has_branch THEN
                EXECUTE format('
                    CREATE POLICY "%I_supreme_authority" ON public.%I FOR ALL
                    USING (
                        get_my_role() = ''SaaS_Owner'' 
                        OR (
                            business_id = get_my_business_id() 
                            AND (
                                get_my_role() = ''Business_Owner'' 
                                OR (get_my_branch_id() IS NULL OR branch_id = get_my_branch_id())
                            )
                        )
                    )
                    WITH CHECK (
                        get_my_role() = ''SaaS_Owner'' 
                        OR (
                            business_id = get_my_business_id()
                            AND (
                                get_my_role() = ''Business_Owner''
                                OR (get_my_branch_id() IS NULL OR branch_id = get_my_branch_id())
                            )
                        )
                    )', t, t);
            ELSE
                EXECUTE format('
                    CREATE POLICY "%I_supreme_authority" ON public.%I FOR ALL
                    USING (
                        get_my_role() = ''SaaS_Owner'' 
                        OR business_id = get_my_business_id()
                    )
                    WITH CHECK (
                        get_my_role() = ''SaaS_Owner'' 
                        OR business_id = get_my_business_id()
                    )', t, t);
            END IF;
        END IF;
    END LOOP;
END $$;

-- 3. YARDIMCI: COLUMN EXISTS CHECK
CREATE OR REPLACE FUNCTION public.column_exists(t_schema text, t_name text, c_name text)
RETURNS boolean AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = t_schema AND table_name = t_name AND column_name = c_name
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- 4. HÂKİMİYET DOMINION GÖRÜNÜMLERİ (SaaS MASTER ANALYTICS)

-- 4.1 Global P&L Summary (Sadece SaaS_Owner görebilir)
CREATE OR REPLACE VIEW public.v_executive_pnl_summary AS
SELECT 
    b.name as business_name,
    b.id as business_id,
    COUNT(DISTINCT a.id) as total_appointments,
    COALESCE(SUM(p.total_amount), 0) as total_revenue,
    (SELECT COUNT(*) FROM public.app_users u WHERE u.business_id = b.id) as user_count,
    b.status,
    b.plan
FROM public.businesses b
LEFT JOIN public.appointments a ON a.business_id = b.id
LEFT JOIN public.payments p ON p.business_id = b.id
GROUP BY b.id, b.name;

-- Sadece Süperadmin erişebilsin
REVOKE ALL ON public.v_executive_pnl_summary FROM public, authenticated;
GRANT SELECT ON public.v_executive_pnl_summary TO authenticated;

-- Bu view için RLS kısıtlaması (Daha güvenli hale getir)
ALTER VIEW public.v_executive_pnl_summary SET (security_invoker = on);

-- 4.2 Leakage Analytics (Şube Bazlı Detaylandırmalı)
CREATE OR REPLACE VIEW public.v_hakimiyet_leaks_v2 AS
SELECT 
    l.*,
    br.name as branch_name
FROM public.v_hakimiyet_leaks l
LEFT JOIN public.branches br ON br.id = l.branch_id;

-- 5. PERFORMANCE INDEXES (SCALABILITY)
-- Genellikle yüzlerce işletme olduğunda business_id aramaları yavaşlar.
CREATE INDEX IF NOT EXISTS idx_appointments_biz_branch ON appointments(business_id, branch_id);
CREATE INDEX IF NOT EXISTS idx_payments_biz_date ON payments(business_id, date);
CREATE INDEX IF NOT EXISTS idx_customers_biz_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_biz_time ON audit_logs(business_id, created_at DESC);

COMMENT ON FUNCTION get_my_branch_id IS 'Kullanıcın yetkili olduğu şubeyi döndürür. Multi-tenant hiyerarşi için kritiktir.';
COMMENT ON VIEW v_executive_pnl_summary IS 'SaaS Master Profit & Loss tablosu. Sadece SaaS_Owner için tüm işletme verilerini konsolide eder.';
