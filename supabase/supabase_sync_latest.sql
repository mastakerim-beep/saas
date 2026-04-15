-- ============================================================
-- AURA SPA SaaS ERP - LATEST SCHEMA SYNC (033 + 034)
-- ============================================================

-- [033] Schema Alignment (Frontend & DB Unification)
DO $$ 
BEGIN
    -- 1. STAFF Tablosuna Eksik Sütunları Ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'staff_type') THEN
        ALTER TABLE public.staff ADD COLUMN staff_type TEXT DEFAULT 'Terapist';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'is_visible_on_calendar') THEN
        ALTER TABLE public.staff ADD COLUMN is_visible_on_calendar BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'staff' AND column_name = 'sort_order') THEN
        ALTER TABLE public.staff ADD COLUMN sort_order INT DEFAULT 0;
    END IF;

    -- 2. APP_USERS Tablosuna Eksik Sütunları Ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'staff_id') THEN
        ALTER TABLE public.app_users ADD COLUMN staff_id UUID REFERENCES public.staff(id) ON DELETE SET NULL;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'app_users' AND column_name = 'allowed_branches') THEN
        ALTER TABLE public.app_users ADD COLUMN allowed_branches UUID[] DEFAULT '{}';
    END IF;

    -- 3. APPOINTMENTS Tablosuna Eksik Sütunları Ekle
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'is_package_usage') THEN
        ALTER TABLE public.appointments ADD COLUMN is_package_usage BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'staff_name') THEN
        ALTER TABLE public.appointments ADD COLUMN staff_name TEXT DEFAULT '';
    END IF;

END $$;

-- 4. Audit Log Atomik Hassasiyet Güncellemesi [034]
ALTER TABLE audit_logs 
ALTER COLUMN date TYPE TIMESTAMPTZ USING date::TIMESTAMPTZ;

ALTER TABLE audit_logs 
ALTER COLUMN date SET DEFAULT NOW();

-- 5. RLS Politikalarının Kernel Log gereksinimlerine göre güncellenmesi
DROP POLICY IF EXISTS "audit_logs_all" ON audit_logs;
CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL
  USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID)
  WITH CHECK (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);

-- 6. İndeksler (Sorgu Hızlandırma)
CREATE INDEX IF NOT EXISTS idx_staff_sort_order ON public.staff(sort_order);
CREATE INDEX IF NOT EXISTS idx_app_users_staff_id ON public.app_users(staff_id);
CREATE INDEX IF NOT EXISTS idx_appointments_is_package_usage ON public.appointments(is_package_usage);
CREATE INDEX IF NOT EXISTS idx_audit_logs_date_precise ON audit_logs(business_id, date DESC);
