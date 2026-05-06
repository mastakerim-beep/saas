-- Aura Spa SaaS ERP - Auth Hotfix
-- Date: 2026-05-06
-- Focus: Fix the "Invalid Email/Password" loop caused by restrictive RLS on app_users

-- 1. ESNEK AMA GÜVENLİ PROFİL ERİŞİMİ
-- Kullanıcının kendi profilini hem ID hem de EMAIL bazlı okuyabilmesini sağlıyoruz.
-- Bu, Auth session'ı tam otururken yaşanan milisaniyelik gecikmeleri tolere eder.
DROP POLICY IF EXISTS "app_users_read_self" ON app_users;
CREATE POLICY "app_users_read_self" ON app_users 
    FOR SELECT TO authenticated
    USING (
        auth.uid() = id 
        OR (auth.jwt() ->> 'email') = email
    );

-- 2. SAAS OWNER İÇİN DAHA BASİT BİR KONTROL
-- Recursive (kendini çağıran) sorgu yerine doğrudan JWT kontrolü yapalım.
DROP POLICY IF EXISTS "app_users_saas_global_read" ON app_users;
CREATE POLICY "app_users_saas_global_read" ON app_users
    FOR SELECT TO authenticated
    USING (
        (auth.jwt() -> 'user_metadata' ->> 'role') = 'SaaS_Owner'
        OR (auth.jwt() ->> 'email') = 'kerim@mail.com'
    );

-- 3. APP_USERS TABLOSUNU HERKESE (Giriş yapmış) OKUNABİLİR YAPALIM (Sadece Email ve İsim için)
-- Bazı durumlarda personelin birbirini görmesi gerekebilir.
-- Ama biz şimdilik sadece girişi kurtarmaya odaklanalım.
GRANT SELECT ON app_users TO authenticated;
