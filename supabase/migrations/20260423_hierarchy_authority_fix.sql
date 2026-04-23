-- ============================================================
-- 031 - AURA SPA: Hiyerarşi Yetki Düzeltmesi (Business Owner Autonomy)
-- ============================================================

-- 1. app_users Tablosu Yetkileri
-- Mevcut: Sadece SaaS_Owner veya Self-Read.
-- Yeni: Business_Owner kendi işletmesine bağlı kullanıcıları tam yönetebilmeli.

DROP POLICY IF EXISTS "app_users_all" ON public.app_users;
CREATE POLICY "app_users_all" ON public.app_users 
FOR ALL TO authenticated 
USING (
    id = auth.uid() 
    OR get_my_role() = 'SaaS_Owner' 
    OR (get_my_role() = 'Business_Owner' AND business_id = get_my_business_id())
)
WITH CHECK (
    id = auth.uid() 
    OR get_my_role() = 'SaaS_Owner' 
    OR (get_my_role() = 'Business_Owner' AND business_id = get_my_business_id())
);

-- 2. branches Tablosu Yetkileri
-- Mevcut: Sadece SaaS_Owner veya Business_ID eşleşmesi (genellikle global_rls_fix ile gelir).
-- Garantiye alalım: Business_Owner kendi şubelerini ekleyebilmeli ve yönetebilmeli.

DROP POLICY IF EXISTS "branches_supreme_authority" ON public.branches;
CREATE POLICY "branches_supreme_authority" ON public.branches FOR ALL
USING (
    get_my_role() = 'SaaS_Owner' 
    OR business_id = get_my_business_id()
)
WITH CHECK (
    get_my_role() = 'SaaS_Owner' 
    OR business_id = get_my_business_id()
);

-- 3. businesses Tablosu (Self-Edit)
-- İşletme sahipleri kendi işletme ayarlarını (ör: hedefler) güncelleyebilmeli.
DROP POLICY IF EXISTS "access_policy_businesses" ON public.businesses;
CREATE POLICY "access_policy_businesses" ON public.businesses FOR ALL
USING (
    id = get_my_business_id() 
    OR get_my_role() = 'SaaS_Owner'
)
WITH CHECK (
    id = get_my_business_id() 
    OR get_my_role() = 'SaaS_Owner'
);

COMMENT ON COLUMN public.app_users.role IS 'Kullanıcı rolü: SaaS_Owner, Business_Owner, Branch_Manager, Staff.';
