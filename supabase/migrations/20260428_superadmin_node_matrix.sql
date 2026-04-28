-- ============================================================
-- IMPERIAL NODE MATRIX & MULTI-USER PROVISIONING ENHANCEMENT
-- ============================================================
-- Bu migrasyon, Superadmin panelindeki kullanıcı yönetimi (Node Matrix)
-- ve işletme kurulumundaki çoklu kullanıcı desteğini güçlendirir.

-- 1. Imperial Node Matrix View
-- Tüm işletmelerin kullanıcılarını, rollerini ve durumlarını tek bir merkezden izlemek için.
DROP VIEW IF EXISTS public.v_imperial_node_matrix;
CREATE OR REPLACE VIEW public.v_imperial_node_matrix AS
SELECT 
    au.id as user_id,
    b.id as business_id,
    b.name as business_name,
    b.slug as business_slug,
    au.name as user_name,
    au.email as user_email,
    au.role as user_role,
    au.staff_id,
    au.created_at as joined_at,
    (SELECT count(*) FROM public.appointments a WHERE a.business_id = b.id AND a.created_at > now() - interval '30 days') as activity_30d
FROM public.app_users au
JOIN public.businesses b ON au.business_id = b.id;

GRANT SELECT ON public.v_imperial_node_matrix TO authenticated;

-- 2. Businesses Tablosuna Eksik Kolonların Güvenli Eklenmesi
-- UI tarafında kullanılan yeni finansal ve operasyonel kolonlar.
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tax_id TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS tax_office TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS billing_address TEXT;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.businesses ADD COLUMN IF NOT EXISTS grace_period_until DATE;

-- 3. Draconian Veto Enforcement
-- Eğer bir işletme askıya alınmışsa (is_suspended), yeni randevu oluşturulmasını DB seviyesinde engelle.
CREATE OR REPLACE FUNCTION public.fn_enforce_suspension_veto()
RETURNS TRIGGER AS $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM public.businesses 
        WHERE id = NEW.business_id AND is_suspended = true
    ) THEN
        -- Sadece SaaS_Owner bu engeli aşabilir
        IF NOT EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'SaaS_Owner') THEN
            RAISE EXCEPTION 'Bu işletme askıya alınmıştır. Randevu oluşturulamaz veya düzenlenemez. (Kod: PROTOKOL-X)';
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_suspension_veto ON public.appointments;
CREATE TRIGGER trg_suspension_veto
BEFORE INSERT OR UPDATE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.fn_enforce_suspension_veto();

-- 4. Multi-User Provisioning Log
-- Yeni kullanıcı tanımlama işlemlerini takip etmek için.
COMMENT ON VIEW public.v_imperial_node_matrix IS 'SaaS genelindeki tüm Node (Kullanıcı) matrisini ve aktivite skorlarını gösterir.';
