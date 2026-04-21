-- 20260421: Audit Logs Şema Modernizasyonu (Hâkimiyet Ultra)
-- Amacı: Frontend'den gelen 'type', 'target', 'source' ve 'detail' alanlarını karşılamaktır.

ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS target TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS detail TEXT;

-- Geriye dönük uyumluluk: Eski sütunların verilerini (eğer varsa) yeni sütunlara map edebiliriz 
-- Ancak şu anki hatayı çözmek için sadece sütunların varlığı yeterlidir.

-- RLS ve Güvenlik
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_all" ON public.audit_logs;
CREATE POLICY "audit_logs_all" ON public.audit_logs
    FOR ALL
    USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID)
    WITH CHECK (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);

COMMENT ON TABLE public.audit_logs IS 'Hâkimiyet Ultra - Güvenlik ve İşlem Günlükleri (Modernized)';
