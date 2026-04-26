-- ============================================================
-- AURA SPA SaaS ERP - INTELLIGENCE & VISION REVIVAL
-- ============================================================
-- Bu migrasyon, "tozlu raflardan" indirilen AI ve Vision özelliklerinin
-- veritabanı altyapısını güçlendirir ve denetim motorunu aktif eder.

-- 1. GÜN SONU ANALİZİ (AI AI_SUMMARY)
-- Z-Raporlarına yapay zeka özetlerini ekler.
ALTER TABLE public.z_reports 
ADD COLUMN IF NOT EXISTS ai_summary TEXT;

-- 2. AURA VISION (OPERASYONEL TAKİP)
-- Odalarda aktif seans takibi ve randevu mühürleme özellikleri.
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS is_sealed BOOLEAN DEFAULT false;

ALTER TABLE public.rooms 
ADD COLUMN IF NOT EXISTS current_session_id UUID;

-- 3. MÜŞTERİ ZEKA (AI CUSTOMER INSIGHTS)
-- Her müşteri için üretilen özel AI analizlerinin kalıcı olarak saklanması.
CREATE TABLE IF NOT EXISTS public.customer_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL, -- 'CHURN_RISK', 'REVENUE_POTENTIAL', 'LTV_PREDICTION'
    content JSONB NOT NULL,
    recommendation TEXT,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. HÂKİMİYET ULTRA - KAÇAK TESPİT GÖRÜNÜMÜ (VIEW)
-- Vision panelinde "Hâkimiyet" uyarısı veren sızıntı tespit motoru.
CREATE OR REPLACE VIEW public.v_hakimiyet_leaks AS
SELECT 
    'FINANCIAL_LEAK' as type,
    a.business_id,
    a.id as target_id,
    a.customer_name || ' - ' || a.service as title,
    'Randevu tamamlandı ama ödeme UUID eşleşmesi yok!' as description,
    a.date,
    a.branch_id
FROM public.appointments a
WHERE a.status = 'completed' AND a.is_paid = false AND a.price > 0

UNION ALL

SELECT 
    'GHOST_ROOM' as type,
    r.business_id,
    r.id as target_id,
    r.name as title,
    'Oda dolu görünüyor ancak aktif bir randevu ile eşleşmiyor!' as description,
    CURRENT_DATE as date,
    r.branch_id
FROM public.rooms r
WHERE r.status = 'occupied' 
  AND NOT EXISTS (
      SELECT 1 FROM public.appointments a 
      WHERE a.room_id = r.id AND a.status = 'arrived' -- 'in-service' durumu
  );

-- 5. RLS VE YETKİLENDİRME
ALTER TABLE public.customer_insights ENABLE ROW LEVEL SECURITY;

-- Mevcut helper fonksiyonu (get_my_business_id) üzerinden RLS politikası
DROP POLICY IF EXISTS "access_policy_customer_insights" ON public.customer_insights;
CREATE POLICY "access_policy_customer_insights" ON public.customer_insights
FOR ALL TO authenticated 
USING (business_id = (SELECT business_id FROM app_users WHERE id = auth.uid()) OR (SELECT role FROM app_users WHERE id = auth.uid()) = 'SaaS_Owner');

GRANT SELECT ON public.v_hakimiyet_leaks TO authenticated;

-- INDEXING
CREATE INDEX IF NOT EXISTS idx_z_reports_ai_summary ON z_reports(report_date);
CREATE INDEX IF NOT EXISTS idx_customer_insights_id ON customer_insights(customer_id);
