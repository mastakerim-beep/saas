-- Imperial Intelligence: Ajanları Otonom Hale Getiren Veri Yapısı
-- Bu migrasyon, ajanların promptlarını ve analiz yeteneklerini veritabanı seviyesinde tanımlar.

-- 1. Imperial Agents tablosunu akıllı görevler için genişlet
ALTER TABLE public.imperial_agents 
ADD COLUMN IF NOT EXISTS system_instruction TEXT,
ADD COLUMN IF NOT EXISTS context_data_sources TEXT[] DEFAULT '{appointments, payments}',
ADD COLUMN IF NOT EXISTS last_thought_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS intelligence_level TEXT DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS autonomy_score FLOAT DEFAULT 0.0;

-- 2. Ajan Aktivite Loglarına "AI Karar" sütunları ekle
ALTER TABLE public.agent_activity_logs
ADD COLUMN IF NOT EXISTS log_type TEXT DEFAULT 'info', -- 'info', 'warning', 'critical', 'action'
ADD COLUMN IF NOT EXISTS raw_ai_response JSONB,
ADD COLUMN IF NOT EXISTS is_vetoed BOOLEAN DEFAULT false;

-- 3. Örnek: Mevcut ajanlara temel talimatlarını yükle (Prompt Enjeksiyonu)
UPDATE public.imperial_agents SET system_instruction = 'Sen bir Imperial Concierge ajanısın. Görevin randevu trafiğini izlemek, darboğazları tespit etmek ve müşteri memnuniyetini maksimize edecek öneriler sunmaktır.' WHERE agent_id = 'concierge';
UPDATE public.imperial_agents SET system_instruction = 'Sen bir Revenue Guardian ajanısın. Görevin finansal sızıntıları bulmak, ödeme gecikmelerini takip etmek ve karlılığı artıracak upsell fırsatlarını raporlamaktır.' WHERE agent_id = 'guardian';
UPDATE public.imperial_agents SET system_instruction = 'Sen bir Imperial Audit ajanısın. Görevin Draconian Veto sistemini yönetmek, şüpheli işlemleri (yüksek indirimler, silinen kayıtlar) denetlemek ve sistem güvenliğini sağlamaktır.' WHERE agent_id = 'audit';

-- 4. RLS ve Yetkilendirme
COMMENT ON COLUMN public.imperial_agents.system_instruction IS 'Ajanın çalışma mantığını belirleyen ana prompt talimatı.';
