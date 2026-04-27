-- ============================================================
-- 037 - AURA CORE: Randevu Silme Mantığı Düzeltmesi (Integrity Fix)
-- ============================================================
-- Tanım: Mühürlenmiş randevuları koruyan tetikleyicilerde (trigger) 
-- DELETE işlemi anında hatalı olarak NEW dönen (ve dolayısıyla silmeyi 
-- sessizce iptal eden) mantık hatası giderildi.

-- 1. 20260420_audit_enforcement.sql'deki fonksiyonu güncelle
CREATE OR REPLACE FUNCTION public.check_appointment_seal()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer kayıt mühürlenmişse ve kullanıcı SaaS_Owner (Sistem Sahibi) değilse işlemi engelle
    IF (OLD.is_sealed = true) THEN
        -- auth.uid() üzerinden rol kontrolü (Sadece SaaS_Owner istisnadır)
        IF NOT EXISTS (
            SELECT 1 FROM public.app_users 
            WHERE id = auth.uid() AND role = 'SaaS_Owner'
        ) THEN
            RAISE EXCEPTION 'Bu randevu gün sonu işlemiyle mühürlenmiştir ve değiştirilemez.';
        END IF;
    END IF;
    
    -- ÖNEMLİ DÜZELTME: 
    -- BEFORE DELETE tetikleyicisi OLD dönmelidir (NEW bu işlemde null'dır).
    -- BEFORE UPDATE tetikleyicisi NEW dönmelidir.
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 20260426_z_report_enforcement.sql'deki fonksiyonu güncelle
CREATE OR REPLACE FUNCTION public.fn_check_sealed_appointment()
RETURNS TRIGGER AS $$
BEGIN
    -- Eğer kayıt mühürlüyse ve işlemi yapan SaaS_Owner değilse engelle
    IF (OLD.is_sealed = true) THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.app_users 
            WHERE id = auth.uid() AND role = 'SaaS_Owner'
        ) THEN
            RAISE EXCEPTION 'Bu randevu mühürlenmiştir (Sealed) ve değiştirilemez. Supreme Authority onayı gereklidir.';
        END IF;
    END IF;

    -- ÖNEMLİ DÜZELTME:
    IF (TG_OP = 'DELETE') THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Not: Tetikleyiciler (Triggers) zaten mevcut, sadece fonksiyon içeriklerini güncelledik.
-- Postgres'te CREATE OR REPLACE FUNCTION mevcut trigerr'ları etkilemeden fonksiyonu günceller.

COMMENT ON FUNCTION public.check_appointment_seal IS 'Randevu silme/güncelleme sırasında mühür kontrolü yapar (Düzeltildi).';
COMMENT ON FUNCTION public.fn_check_sealed_appointment IS 'Mühürlü randevu bütünlüğünü korur ve silme hatasını giderir.';
