-- Agent Notification & Action Pipeline
-- Ajanların bulgularını bildirim sistemine ve WhatsApp kuyruğuna bağlar.

-- 1. Bildirim Tablosunu Oluştur (Eğer yoksa)
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info', -- 'info', 'warning', 'error', 'success'
    is_read BOOLEAN DEFAULT false,
    trigger_source TEXT DEFAULT 'SYSTEM', -- 'SYSTEM', 'AI_AGENT', 'MANUAL'
    agent_id TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS Ayarları
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can see their own business notifications" ON public.notifications;
CREATE POLICY "Users can see their own business notifications" ON public.notifications
    FOR ALL USING (business_id = (SELECT business_id FROM public.app_users WHERE id = auth.uid()));

-- 2. WhatsApp Gönderim Kuyruğu (Opsiyonel/Altyapı)
CREATE TABLE IF NOT EXISTS public.whatsapp_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES public.businesses(id) ON DELETE CASCADE,
    recipient_phone TEXT NOT NULL,
    message_body TEXT NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'sent', 'failed'
    retry_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    sent_at TIMESTAMPTZ
);

-- 3. Ajan "Düşünce" ve "Aksiyon" Arasındaki Tetikleyici
-- Bir ajan kritik bir bulgu (log_type = 'critical') eklediğinde otomatik bildirim oluşturur.
CREATE OR REPLACE FUNCTION fn_on_agent_critical_finding()
RETURNS TRIGGER AS $$
BEGIN
    IF (NEW.log_type = 'critical' OR NEW.log_type = 'warning') THEN
        INSERT INTO public.notifications (
            business_id,
            title,
            message,
            type,
            trigger_source,
            agent_id
        ) VALUES (
            NEW.business_id,
            'İMPARATORLUK ALARMI: ' || NEW.agent_id,
            NEW.description,
            CASE WHEN NEW.log_type = 'critical' THEN 'error' ELSE 'warning' END,
            'AI_AGENT',
            NEW.agent_id
        );
        
        -- WhatsApp Kuyruğuna Ekle (İşletme sahibi numarasına)
        INSERT INTO public.whatsapp_queue (
            business_id,
            recipient_phone,
            message_body
        ) 
        SELECT 
            NEW.business_id,
            COALESCE(b.phone, ''), -- İşletme telefonu
            '🏛️ *Imperial Alert* [' || NEW.agent_id || ']: ' || NEW.description
        FROM public.businesses b
        WHERE b.id = NEW.business_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_agent_finding_alert ON public.agent_activity_logs;
CREATE TRIGGER trg_agent_finding_alert
AFTER INSERT ON public.agent_activity_logs
FOR EACH ROW EXECUTE FUNCTION fn_on_agent_critical_finding();
