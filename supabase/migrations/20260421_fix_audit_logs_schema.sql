-- 20260421: Audit Logs Şema Modernizasyonu (Hâkimiyet Ultra)
-- Amacı: Frontend'den gelen 'type', 'target', 'source' ve 'detail' alanlarını karşılamaktır.

ALTER TABLE public.audit_logs 
ADD COLUMN IF NOT EXISTS type TEXT,
ADD COLUMN IF NOT EXISTS target TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS detail TEXT;

-- Action sütununu nullable yapıyoruz (Artık modern şema kullanılıyor)
ALTER TABLE public.audit_logs ALTER COLUMN action DROP NOT NULL;

-- RLS ve Güvenlik
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_logs_all" ON public.audit_logs;
CREATE POLICY "audit_logs_all" ON public.audit_logs
    FOR ALL
    TO authenticated
    USING (business_id = get_my_business_id())
    WITH CHECK (business_id = get_my_business_id());

COMMENT ON TABLE public.audit_logs IS 'Hâkimiyet Ultra - Güvenlik ve İşlem Günlükleri (Modernized)';
