-- ============================================================
-- 014 - Online Randevu Portalı ve Kapora Sistemi (Public Booking)
-- ============================================================

-- 1. Randevu Ayarları Tablosu
CREATE TABLE IF NOT EXISTS booking_settings (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    is_enabled          BOOLEAN DEFAULT true,
    require_deposit     BOOLEAN DEFAULT false,
    deposit_percentage  INT DEFAULT 20, -- Hizmet bedelinin % kaçı kapora alınacak?
    allow_staff_select  BOOLEAN DEFAULT true,
    booking_message     TEXT DEFAULT 'Bizi tercih ettiğiniz için teşekkürler.',
    accent_color        TEXT DEFAULT '#4F46E5',  -- İşletmeye özel marka rengi
    created_at          TIMESTAMPTZ DEFAULT NOW(),
    updated_at          TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(business_id)
);

-- 2. Hizmetler Tablosuna Eksik Alanları Ekle (Eğer yoksa)
-- Not: services tablosu 011'de eklenmiş olmalı, ancak public görünürlük için 'is_active' ekleyelim.
ALTER TABLE services ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;
ALTER TABLE services ADD COLUMN IF NOT EXISTS image_url TEXT;

-- 3. RLS POLİTİKALARI (Public Erişim İçin)
-- ÖNEMLİ: Anonim kullanıcıların sadece belirli bilgileri görebilmesi gerekir.

-- BRANCHES (Public Read)
CREATE POLICY "branches_anon_read" ON branches FOR SELECT TO anon
  USING (true); -- Slug kontrolü uygulama seviyesinde (URL) yapılacak

-- SERVICES (Public Read)
CREATE POLICY "services_anon_read" ON services FOR SELECT TO anon
  USING (is_public = true);

-- STAFF (Public Read)
CREATE POLICY "staff_anon_read" ON staff FOR SELECT TO anon
  USING (status = 'Aktif');

-- APPOINTMENTS (Public Insert)
-- Anonim kullanıcılar randevu oluşturabilir.
CREATE POLICY "appointments_anon_insert" ON appointments FOR INSERT TO anon
  WITH CHECK (is_online = true);

-- CUSTOMERS (Public Insert/Select)
-- Online randevuda müşteri yoksa oluşturulabilmeli.
CREATE POLICY "customers_anon_all" ON customers FOR ALL TO anon
  USING (true)
  WITH CHECK (true);

-- 4. Fonksiyon: İşletme slug'ına göre ID bulma (Kolaylık için)
-- Bu genellikle uygulama tarafında yapılır ama SQL'de policy'leri sıkılaştırmak için kullanılabilir.
