-- 🚀 AURA OS: DATABASE PERFORMANCE OPTIMIZATION
-- Amacı: Mükerrer indeksleri temizlemek ve eksik foreign key indekslerini eklemek.

-- 1. GEREKSİZ İNDEKS TEMİZLİĞİ (Redundant Indexes Cleanup)
-- audit_logs: idx_audit_logs_date_precise zaten bu işi daha iyi yapıyor.
DROP INDEX IF EXISTS public.idx_audit_logs_biz_id;
DROP INDEX IF EXISTS public.idx_audit_logs_business_date;
DROP INDEX IF EXISTS public.idx_audit_logs_business_id;

-- calendar_blocks: Tekrarlanan business_id indeksi.
DROP INDEX IF EXISTS public.idx_calendar_blocks_biz_id;

-- app_users: Unique constraint (app_users_email_key) zaten mevcut.
DROP INDEX IF EXISTS public.idx_app_users_biz_id;
DROP INDEX IF EXISTS public.idx_app_users_email;

-- 2. EKSİK FOREIGN KEY İNDEKSLERİ (Missing Indexes)
-- Sorgu performansını artırmak için bu kolonlara indeks ekliyoruz.
CREATE INDEX IF NOT EXISTS idx_inventory_business_id ON public.inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_business_id ON public.inventory_transfers(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_transfers_product_id ON public.inventory_transfers(product_id);

-- 3. PERFORMANS DOĞRULAMA
SELECT log_security_event('PERFORMANCE_AUDITOR', 'DATABASE_OPTIMIZATION', 'Redundant indexes removed and missing foreign key indexes added.');
