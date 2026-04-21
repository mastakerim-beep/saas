-- ============================================================
-- AURA SPA SaaS ERP - COMMISSION & PAYOUT TRACKING
-- ============================================================

-- 1. Expenses tablosuna prim takibi için sütun ekleme
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='expenses' AND COLUMN_NAME='payout_status') THEN
        ALTER TABLE public.expenses ADD COLUMN payout_status TEXT DEFAULT 'BEKLEMEDE'; -- 'BEKLEMEDE', 'ODENDI'
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='expenses' AND COLUMN_NAME='related_staff_id') THEN
        ALTER TABLE public.expenses ADD COLUMN related_staff_id UUID REFERENCES public.staff(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='expenses' AND COLUMN_NAME='related_appointment_id') THEN
        ALTER TABLE public.expenses ADD COLUMN related_appointment_id UUID REFERENCES public.appointments(id);
    END IF;
END $$;

-- 2. RLS UPDATE (Expenses zaten business_id kontrolüne sahip, ekstra bir şeye gerek yok)
-- Ancak primlerin sadece yetkililerce görülmesi istenirse ek politikalar yazılabilir.
