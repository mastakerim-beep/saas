-- Aura Spa ERP - Referans Numaraları (v3.0)
-- Randevu ve ödeme izlenebilirliği için profesyonel sıralı ref numaraları

DO $$
BEGIN
    -- appointments tablosuna appt_ref kolonu ekle (RND-2026-0001 formatı)
    IF NOT EXISTS (
        SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS 
        WHERE TABLE_NAME='appointments' AND COLUMN_NAME='appt_ref'
    ) THEN
        ALTER TABLE public.appointments ADD COLUMN appt_ref TEXT;
        -- Performans için index
        CREATE INDEX IF NOT EXISTS idx_appointments_appt_ref ON public.appointments(appt_ref);
    END IF;

    -- payments tablosunda reference_code zaten var, sadece index ekle
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes 
        WHERE tablename='payments' AND indexname='idx_payments_reference_code'
    ) THEN
        CREATE INDEX IF NOT EXISTS idx_payments_reference_code ON public.payments(reference_code);
    END IF;
END $$;
