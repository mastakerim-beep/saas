-- ============================================================
-- 003 - Şema Uyumsuzluklarını Giderme (Fix Schema Discrepancies)
-- ============================================================

-- 1. Eksik Sütunları Ekle: STAFF
ALTER TABLE staff ADD COLUMN IF NOT EXISTS staff_type TEXT DEFAULT 'Terapist';
ALTER TABLE staff ADD COLUMN IF NOT EXISTS is_visible_on_calendar BOOLEAN DEFAULT true;
ALTER TABLE staff ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- 2. Eksik Sütunları Ekle: APPOINTMENTS
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;

-- 3. Eksik Tabloyu Oluştur: SERVICES
CREATE TABLE IF NOT EXISTS services (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    duration    INT NOT NULL DEFAULT 60,
    price       NUMERIC(10,2) NOT NULL DEFAULT 0,
    color       TEXT DEFAULT 'bg-indigo-500',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Eksik Tabloyu Oluştur: CUSTOMER_MEDIA
CREATE TABLE IF NOT EXISTS customer_media (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    file_url    TEXT NOT NULL,
    file_type   TEXT DEFAULT 'image',
    note        TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 5. RLS Politikalarını Etkinleştir ve Ayarla
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_media ENABLE ROW LEVEL SECURITY;

-- Services RLS
CREATE POLICY "services_all" ON services FOR ALL
  USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);

-- Customer Media RLS
CREATE POLICY "customer_media_all" ON customer_media FOR ALL
  USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);

-- 6. Diğer Tablolar için Politika Güncellemeleri (Opsiyonel Güvenlik Katmanı)
-- Zaten 002 içinde tanımlandı ancak yeni sütunlar için kontrol gerekirse buraya eklenebilir.
