-- ============================================================
-- SAAS BILLING: OVERRIDE MRR SUPPORT
-- ============================================================

-- Add override_mrr to businesses if it doesn't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'businesses' 
                   AND column_name = 'override_mrr') THEN
        ALTER TABLE public.businesses ADD COLUMN override_mrr NUMERIC;
        COMMENT ON COLUMN public.businesses.override_mrr IS 'SaaS_Owner tarafından atanan özel aylık fatura bedeli. NULL ise global saas_plans fiyatı geçerlidir.';
    END IF;
END $$;
