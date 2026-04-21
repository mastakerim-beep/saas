-- ============================================================
-- AURA SPA SaaS ERP - HÂKİMİYET ULTRA AUDIT INFRASTRUCTURE
-- ============================================================

-- 1. Sütun Kontrolleri (is_sealed ve current_session_id)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='is_sealed') THEN
        ALTER TABLE public.appointments ADD COLUMN is_sealed BOOLEAN DEFAULT false;
    END IF;

    -- Odalarda aktif seans UUID takibi (Daha önce eklenmiş olabilir, garantiye alalım)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='rooms' AND COLUMN_NAME='current_session_id') THEN
        ALTER TABLE public.rooms ADD COLUMN current_session_id UUID;
    END IF;
END $$;

-- 2. Hâkimiyet Kaçak Tespit Görünümü (Leakage Detector View)
-- Bu view, sistemdeki tutarsızlıkları anlık olarak raporlar.
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
    'Oda dolu (occupied) görünüyor ancak aktif bir randevu UUID''si ile eşleşmiyor!' as description,
    CURRENT_DATE as date,
    r.branch_id
FROM public.rooms r
WHERE r.status = 'occupied' 
  AND NOT EXISTS (
      SELECT 1 FROM public.appointments a 
      WHERE a.room_id = r.id AND a.status = 'in-service'
  );

-- 3. RLS Policies for View
-- Görünümün sadece yetkililerce erişilebilir olmasını sağlayalım.
GRANT SELECT ON public.v_hakimiyet_leaks TO authenticated;
