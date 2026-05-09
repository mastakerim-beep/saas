-- 2026-05-09: Customer Privacy & AI Consent Layer (Gizlilik ve Onay Katmanı)
-- Bu migrasyon, müşterilerin AI tarafından veri işleme ve bildirim tercihlerini yönetir.

ALTER TABLE public.customers
ADD COLUMN IF NOT EXISTS ai_wellness_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS push_notifications_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS biometric_sync_enabled BOOLEAN DEFAULT FALSE; -- Technogym verisi senkronize edilsin mi?

-- İzinlerin varsayılan olarak 'Hayır' (FALSE) olması KVKK/GDPR uyumluluğu için kritiktir.
-- Müşteri uygulamayı ilk açtığında bu izinleri "Opt-in" olarak vermelidir.

COMMENT ON COLUMN public.customers.ai_wellness_enabled IS 'Müşterinin AI tavsiyeleri almayı kabul edip etmediği.';
COMMENT ON COLUMN public.customers.biometric_sync_enabled IS 'Müşterinin Technogym verilerinin SaaS ile eşleşmesine izin verip vermediği.';

-- RLS: Müşteriler sadece kendi izinlerini güncelleyebilir (Imperial App üzerinden)
CREATE POLICY "Customers can update their own consent" ON public.customers
    FOR UPDATE USING (auth.uid() = id) -- Eğer auth.users ile customers id'leri eşleşiyorsa
    WITH CHECK (auth.uid() = id);
