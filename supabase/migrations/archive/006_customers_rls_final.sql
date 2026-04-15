-- ============================================================
-- 006 - Müşteriler Tablosu Yetki Sıfırlama (Customers RLS Final)
-- ============================================================

-- 1. Önce Masayı Temizleyelim (Eski tüm kırıntıları siler)
DROP POLICY IF EXISTS "customers_all" ON customers;
DROP POLICY IF EXISTS "customers_select" ON customers;
DROP POLICY IF EXISTS "customers_insert" ON customers;
DROP POLICY IF EXISTS "customers_update" ON customers;
DROP POLICY IF EXISTS "customers_delete" ON customers;

-- 2. RLS'yi Tazele
ALTER TABLE customers DISABLE ROW LEVEL SECURITY;
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- 3. TEK VE GÜÇLÜ POLİTİKA (Her işleme izin ver)
-- Şart: İşlem yapan kişinin Business ID'si, kaydın Business ID'si ile eşleşmelidir.
CREATE POLICY "customers_ultimate_policy" ON customers FOR ALL
  USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID)
  WITH CHECK (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);

-- 4. GRANTS (Tabloya erişim yetkisi)
GRANT ALL ON TABLE customers TO authenticated;
GRANT ALL ON TABLE customers TO service_role;
