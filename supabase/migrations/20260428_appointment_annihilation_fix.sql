-- ============================================================
-- 038 - IMPERIAL CORE: Randevu Silme Kesin Çözümü
-- ============================================================
-- Tanım: Randevuların silinmesine rağmen geri gelmesine neden olan 
-- çakışan tetikleyiciler temizlendi ve tek bir mühür koruma mantığına geçildi.

-- 1. Eski ve çakışabilecek tüm koruma tetikleyicilerini temizle (Bağımlılıkları ile birlikte)
DROP TRIGGER IF EXISTS trg_check_appointment_seal ON public.appointments CASCADE;
DROP TRIGGER IF EXISTS trg_fn_check_sealed_appointment ON public.appointments CASCADE;
DROP TRIGGER IF EXISTS trg_seal_check ON public.appointments CASCADE;
DROP TRIGGER IF EXISTS check_appointment_seal_trigger ON public.appointments CASCADE;
DROP TRIGGER IF EXISTS trg_prevent_sealed_update ON public.appointments CASCADE;

-- 2. Fonksiyonları temizle (CASCADE ile bağlı triggerları da süpür)
DROP FUNCTION IF EXISTS public.check_appointment_seal() CASCADE;
DROP FUNCTION IF EXISTS public.fn_check_sealed_appointment() CASCADE;

CREATE OR REPLACE FUNCTION public.fn_imperial_appointment_integrity()
RETURNS TRIGGER AS $$
DECLARE
    v_user_role TEXT;
BEGIN
    -- İşlemi yapan kullanıcının rolünü al
    SELECT role INTO v_user_role FROM public.app_users WHERE id = auth.uid();

    -- SİLME veya GÜNCELLEME anında mühür (is_sealed) kontrolü
    IF (TG_OP = 'DELETE' OR TG_OP = 'UPDATE') THEN
        -- KRİTİK KURAL: Sadece geçmiş veya bugünkü (tarihi geçmiş/gelmiş) ve mühürlü kayıtları koru.
        -- Gelecekteki randevular (date > CURRENT_DATE) henüz hizmet verilmediği için mühürlü olsa bile silinebilir.
        IF (OLD.is_sealed = true AND OLD.date <= CURRENT_DATE AND (v_user_role IS NULL OR v_user_role <> 'SaaS_Owner')) THEN
            RAISE EXCEPTION 'Geçmişe dönük mühürlü kayıtlar (Sealed) sadece Supreme Authority tarafından değiştirilebilir. Gelecek randevular silinebilir.';
        END IF;
    END IF;

    -- TİPİK SİLME HATASI ÇÖZÜMÜ: 
    -- PostgreSQL'de BEFORE DELETE tetikleyicisi 'OLD' dönmek ZORUNDADIR. 
    -- NULL dönerse işlem sessizce iptal edilir.
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    END IF;

    -- UPDATE/INSERT durumunda NEW döner
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Tek ve Temiz Trigger Uygula
CREATE TRIGGER trg_imperial_appointment_guard
BEFORE UPDATE OR DELETE ON public.appointments
FOR EACH ROW EXECUTE FUNCTION public.fn_imperial_appointment_integrity();

-- 4. RLS Politikalarını Kontrol Et (Silme yetkisi eksik olabilir)
-- SaaS_Owner her şeyi silebilir, Business_Owner kendi işletmesini silebilir.
DROP POLICY IF EXISTS "Business owners can delete their own appointments" ON public.appointments;
CREATE POLICY "Business owners can delete their own appointments" 
ON public.appointments FOR DELETE 
USING (
    business_id IN (
        SELECT id FROM public.businesses 
        WHERE (owner_id = auth.uid()) OR 
        EXISTS (SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role IN ('SaaS_Owner', 'Business_Owner'))
    )
);

COMMENT ON FUNCTION public.fn_imperial_appointment_integrity IS 'Randevu mühür ve silme bütünlüğünü sağlayan nihai koruma fonksiyonu.';
