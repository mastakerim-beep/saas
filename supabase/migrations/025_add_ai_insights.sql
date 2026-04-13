-- ============================================================
-- 025 - AI Insights Table Definition
-- ============================================================

CREATE TABLE IF NOT EXISTS public.ai_insights (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id      UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    title            TEXT NOT NULL,
    "desc"           TEXT NOT NULL,
    impact           TEXT NOT NULL DEFAULT 'low' CHECK (impact IN ('high', 'medium', 'low')),
    category         TEXT NOT NULL DEFAULT 'growth' CHECK (category IN ('growth', 'security', 'financial')),
    suggested_action TEXT,
    created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;

-- Standard isolation policy
DROP POLICY IF EXISTS "ai_insights_access_policy" ON public.ai_insights;
CREATE POLICY "ai_insights_access_policy" ON public.ai_insights
    FOR ALL TO authenticated
    USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE ai_insights;
