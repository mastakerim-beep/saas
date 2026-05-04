-- ============================================================
-- IMPERIAL ACTION FRAMEWORK
-- ============================================================

-- Ajanların ürettiği otonom aksiyonları Veto/Onay sürecinde tutan tablo.
CREATE TABLE IF NOT EXISTS public.pending_agent_actions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    agent_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    payload JSONB NOT NULL DEFAULT '{}'::jsonb,
    description TEXT,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'vetoed', 'executed'
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    resolved_at TIMESTAMPTZ,
    resolved_by UUID REFERENCES public.app_users(id) ON DELETE SET NULL
);

-- RLS
ALTER TABLE public.pending_agent_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable read for business owners/staff" ON public.pending_agent_actions
    FOR SELECT USING (
        business_id IN (
            SELECT business_id FROM public.app_users WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'SaaS_Owner'
        )
    );

CREATE POLICY "Enable update for managers and owners" ON public.pending_agent_actions
    FOR UPDATE USING (
        (business_id IN (
            SELECT business_id FROM public.app_users WHERE id = auth.uid() AND role IN ('Business_Owner', 'Manager')
        )) OR EXISTS (
            SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'SaaS_Owner'
        )
    );

CREATE POLICY "Enable insert for system" ON public.pending_agent_actions
    FOR INSERT WITH CHECK (
        -- Insert is usually from the app layer, we can allow authenticated users of that business
        business_id IN (
            SELECT business_id FROM public.app_users WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'SaaS_Owner'
        )
    );

-- Index for fast queue reading
CREATE INDEX IF NOT EXISTS idx_pending_agent_actions_status ON public.pending_agent_actions(business_id, status);

COMMENT ON TABLE public.pending_agent_actions IS 'Imperial Action Framework: Ajan eylemlerinin Draconian Veto veya onaya sunulduğu bekleme havuzu.';
