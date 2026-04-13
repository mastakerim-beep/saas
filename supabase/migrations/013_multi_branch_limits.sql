-- ============================================================
-- 013 - Multi-Branch Limits & Isolation
-- ============================================================

-- 1. Tablo Güncellemeleri
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS max_branches INTEGER DEFAULT 1;

-- 2. Granüler Şube Yetkilendirme Tablosu
-- Eğer bir personelin birden fazla şubeye girme yetkisi varsa buradan bakılacak.
CREATE TABLE IF NOT EXISTS user_branch_access (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, branch_id)
);

-- RLS Etkinleştir
ALTER TABLE user_branch_access ENABLE ROW LEVEL SECURITY;

-- user_branch_access RLS
CREATE POLICY "user_branch_access_all" ON user_branch_access FOR ALL
  USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner')
  WITH CHECK (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- 3. RLS Politikalarını Güncelleyelim (Branş Bazlı İzolasyon)
-- Mevcut politikalara "Şube Yetkisi" kontrolü ekliyoruz.

-- [BRANCHES] - Kim hangi şubeyi görebilir?
DROP POLICY IF EXISTS "branches_all" ON branches;
CREATE POLICY "branches_all" ON branches FOR ALL
  USING (
    business_id = get_my_business_id() AND (
      get_my_role() IN ('SaaS_Owner', 'Business_Owner') OR 
      EXISTS (SELECT 1 FROM user_branch_access WHERE user_id = auth.uid() AND branch_id = branches.id)
    )
    OR get_my_role() = 'SaaS_Owner'
  );

-- [APPOINTMENTS] - Şubeye özel randevu izolasyonu
DROP POLICY IF EXISTS "appointments_all" ON appointments;
CREATE POLICY "appointments_all" ON appointments FOR ALL
  USING (
    business_id = get_my_business_id() AND (
      get_my_role() IN ('SaaS_Owner', 'Business_Owner') OR 
      EXISTS (SELECT 1 FROM user_branch_access WHERE user_id = auth.uid() AND branch_id = appointments.branch_id)
      OR branch_id IS NULL -- Global veriler (olursa)
    )
    OR get_my_role() = 'SaaS_Owner'
  );

-- [STAFF] - Şubeye özel personel izolasyonu
DROP POLICY IF EXISTS "staff_all" ON staff;
CREATE POLICY "staff_all" ON staff FOR ALL
  USING (
    business_id = get_my_business_id() AND (
      get_my_role() IN ('SaaS_Owner', 'Business_Owner') OR 
      EXISTS (SELECT 1 FROM user_branch_access WHERE user_id = auth.uid() AND branch_id = staff.branch_id)
    )
    OR get_my_role() = 'SaaS_Owner'
  );

-- [PAYMENTS] - Şubeye özel kasa izolasyonu
DROP POLICY IF EXISTS "payments_all" ON payments;
CREATE POLICY "payments_all" ON payments FOR ALL
  USING (
    business_id = get_my_business_id() AND (
      get_my_role() IN ('SaaS_Owner', 'Business_Owner') OR 
      EXISTS (SELECT 1 FROM user_branch_access WHERE user_id = auth.uid() AND branch_id = payments.branch_id)
    )
    OR get_my_role() = 'SaaS_Owner'
  );

-- Diğer tablolar (Rooms, Expenses vb.) için de benzer mantık uygulanabilir.
-- Şimdilik en kritik olanlar bunlar.
