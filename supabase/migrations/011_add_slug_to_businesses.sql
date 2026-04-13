-- businesses tablosuna slug alanı ekleme
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Mevcut işletmeler için örnek slug'lar atama
-- Not: Bu isimlerin veritabanındaki NAME kolonunda geçen kelimelere göre eşleşmesi planlanmıştır.
UPDATE businesses SET slug = 'aura-spa' WHERE name ILIKE '%Aura%';
UPDATE businesses SET slug = 'deep-relax' WHERE name ILIKE '%Deep%';
UPDATE businesses SET slug = 'grand-galata' WHERE name ILIKE '%Grand%';

-- Slug alanını zorunlu hale getirme (bazı veriler varsa önce onları güncellemelisiniz)
-- ALTER TABLE businesses ALTER COLUMN slug SET NOT NULL;

-- Indeksi ekle (Hızlı arama için)
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);
