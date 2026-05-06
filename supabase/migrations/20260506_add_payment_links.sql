-- Migration: Add Payment Links System
-- Description: Enables "Pay with Link" functionality for tenants.

CREATE TABLE IF NOT EXISTS public.payment_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID NOT NULL REFERENCES public.businesses(id) ON DELETE CASCADE,
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'TRY',
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'paid', 'expired', 'cancelled'
    token TEXT NOT NULL UNIQUE,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '24 hours'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    paid_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.payment_links ENABLE ROW LEVEL SECURITY;

-- Business owners/staff can manage their own links
CREATE POLICY "Manage own business links" ON public.payment_links
    FOR ALL USING (
        business_id IN (
            SELECT business_id FROM public.app_users WHERE id = auth.uid()
        ) OR EXISTS (
            SELECT 1 FROM public.app_users WHERE id = auth.uid() AND role = 'SaaS_Owner'
        )
    );

-- Public can READ the link if they have the token (for the payment page)
-- Note: We use a simple select with token check in the app, but for RLS:
CREATE POLICY "Public read with token" ON public.payment_links
    FOR SELECT USING (true); -- We'll filter by token in the application logic

-- Indexes
CREATE INDEX idx_payment_links_token ON public.payment_links(token);
CREATE INDEX idx_payment_links_business_id ON public.payment_links(business_id);

COMMENT ON TABLE public.payment_links IS 'Stores unique tokens for "Pay with Link" requests.';
