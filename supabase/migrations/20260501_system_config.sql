-- 🏛️ Imperial System Config: Dinamik Yapılandırma Yönetimi
-- Bu tablo, API anahtarları gibi sistem genelindeki ayarların UI üzerinden güncellenmesini sağlar.

CREATE TABLE IF NOT EXISTS public.system_config (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- RLS: Sadece SaaS_Owner (Sovereign) erişebilir
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Sovereign can manage system config" ON public.system_config;

CREATE POLICY "Sovereign can manage system config"
ON public.system_config FOR ALL
USING (get_my_role() = 'SaaS_Owner');

-- İlk kurulumda mevcut key'i (varsa) ekleyelim (Opsiyonel)
-- INSERT INTO public.system_config (key, value, description) 
-- VALUES ('GEMINI_API_KEY', '', 'Google Gemini AI API Anahtarı')
-- ON CONFLICT DO NOTHING;

COMMENT ON TABLE public.system_config IS 'İmparatorluk sistem ayarları ve API anahtarları.';
