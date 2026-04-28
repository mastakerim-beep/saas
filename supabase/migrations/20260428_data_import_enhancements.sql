-- ============================================================
-- DATA IMPORT & FUZZY MATCHING METADATA ENHANCEMENTS
-- ============================================================
-- Bu migrasyon, Veri Aktarım Sihirbazı'nın (DataImportWizard) 
-- performansını ve tip güvenliğini veritabanı seviyesinde destekler.

-- 1. Staff Tablosuna Senkronizasyon Durumu Ekleme
-- Toplu aktarımlarda UI'da yükleme durumunu takip etmek için.
ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS sync_status TEXT DEFAULT 'synced';

-- 2. Customers Tablosuna Metadata Desteği
-- Aktarım loglarını ve AI düzeltme verilerini saklamak için.
ALTER TABLE public.customers ADD COLUMN IF NOT EXISTS import_metadata JSONB DEFAULT '{}';

-- 3. Appointments Tablosuna Import Kaynağı
-- Verilerin nereden (Excel, API, Manuel) geldiğini izlemek için.
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS import_source TEXT DEFAULT 'manual';

-- 4. Fuzzy Matching Helper (Opsiyonel - DB Seviyesinde de benzerlik kontrolü için)
-- pg_trgm eklentisi yüklü değilse yükleyelim (benzerlik aramaları için).
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 5. Akıllı Arama Indexleri
-- Büyük verilerde isim bazlı eşleştirmeyi hızlandırmak için.
CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON public.customers USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_services_name_trgm ON public.services USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_staff_name_trgm ON public.staff USING gin (name gin_trgm_ops);

COMMENT ON COLUMN public.staff.sync_status IS 'Personelin senkronizasyon durumu (synced, syncing, error).';
COMMENT ON COLUMN public.customers.import_metadata IS 'Toplu aktarım sırasında oluşan yapay zeka düzeltme veya kaynak verileri.';
