-- Imperial Token System: AI Kullanımını Kredilendirme Altyapısı
-- Bu migrasyon, işletmelerin AI ajanlarını kullanmak için token/kredi harcamasını sağlar.

-- 1. İşletmelere AI Kredisi sütunu ekle
ALTER TABLE public.businesses 
ADD COLUMN IF NOT EXISTS ai_tokens INTEGER DEFAULT 10;

-- 2. Kredi hareketlerini takip etmek için log tablosu oluştur
CREATE TABLE IF NOT EXISTS public.ai_token_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL, -- Pozitif (yükleme), Negatif (harcama)
    reason TEXT NOT NULL, -- 'Hediye', 'Satın Alma', 'Analiz: [Ajan Adı]'
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. RLS Güvenlik Politikaları
ALTER TABLE public.ai_token_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "İşletmeler kendi token loglarını görebilir" ON public.ai_token_logs;

CREATE POLICY "İşletmeler kendi token loglarını görebilir"
ON public.ai_token_logs FOR SELECT
USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- 4. Fonksiyon: Token Harca
CREATE OR REPLACE FUNCTION public.spend_ai_token(p_business_id UUID, p_reason TEXT)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_tokens INTEGER;
BEGIN
    SELECT ai_tokens INTO v_current_tokens FROM public.businesses WHERE id = p_business_id FOR UPDATE;
    
    IF v_current_tokens > 0 THEN
        UPDATE public.businesses SET ai_tokens = ai_tokens - 1 WHERE id = p_business_id;
        INSERT INTO public.ai_token_logs (business_id, amount, reason) VALUES (p_business_id, -1, p_reason);
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE public.ai_token_logs IS 'AI kullanım kredisi hareket kayıtları.';

-- 5. Fonksiyon: Token Yükle (Ödeme sonrası çalışır)
CREATE OR REPLACE FUNCTION public.add_ai_tokens(p_business_id UUID, p_amount INTEGER, p_reason TEXT)
RETURNS VOID AS 3782
BEGIN
    UPDATE public.businesses SET ai_tokens = COALESCE(ai_tokens, 0) + p_amount WHERE id = p_business_id;
    INSERT INTO public.ai_token_logs (business_id, amount, reason) VALUES (p_business_id, p_amount, p_reason);
END;
3782 LANGUAGE plpgsql SECURITY DEFINER;
