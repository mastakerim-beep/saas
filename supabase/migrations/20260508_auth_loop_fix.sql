-- 🛡️ AURA OS: AUTH LOOP & PUBLIC ACCESS FIX
-- Amacı: RLS helper fonksiyonlarını PUBLIC erişimine açmak ve anonim kullanıcıların crash olmasını engellemek.

-- 1. HELPER FONKSİYONLARI PUBLIC ERİŞİME AÇ (Restore Execute to Public)
-- Bu fonksiyonlar JWT metadata'sına bakar, anonim kullanıcılar için güvenlidir (null dönerler).
-- Revoke edildikleri için anonim kullanıcılar bu fonksiyonları kullanan RLS politikalarına çarptığında crash oluyordu.

GRANT EXECUTE ON FUNCTION public.get_my_biz_id_fast() TO PUBLIC, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_my_role() TO PUBLIC, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_biz_suspended() TO PUBLIC, authenticated, service_role;

-- 2. GET_MY_ROLE FONKSİYONUNU GÜVENCEYE AL (Eğer yoksa veya hatalıysa)
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT AS $$
BEGIN
  RETURN auth.jwt() -> 'user_metadata' ->> 'role';
EXCEPTION WHEN OTHERS THEN
  RETURN 'Guest';
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 3. GET_MY_BIZ_ID_FAST FONKSİYONUNU GÜVENCEYE AL
CREATE OR REPLACE FUNCTION public.get_my_biz_id_fast()
RETURNS UUID AS $$
BEGIN
  RETURN (auth.jwt() -> 'user_metadata' ->> 'business_id')::uuid;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public;

-- 4. LOG EVENT
SELECT log_security_event('SECURITY_FIX', 'AUTH_LOOP_REMEDY', 'Helper functions restored to PUBLIC to prevent ANON crashes.');
