-- 1. APPOINTMENTS TABLOSUNA DENETİM ALANLARI EKLEME
ALTER TABLE appointments 
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS check_out_time TIMESTAMPTZ;

-- 2. Z_REPORTS TABLOSUNA AUDIT LOG ALANI EKLEME
ALTER TABLE z_reports
ADD COLUMN IF NOT EXISTS audit_log JSONB DEFAULT '[]';

-- 3. REALTIME YAYININI GÜNCELLEME
-- Mevcut yayını temizle ve ihtiyaç duyulan tabloları ekle
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE 
    appointments, 
    rooms, 
    z_reports, 
    payments, 
    debts, 
    customers, 
    system_announcements, 
    tenant_modules;

-- 4. RLS POLICIES (Z_REPORTS İÇİN EKSİK OLABİLİR)
-- Eğer z_reports için policy yoksa ekleyelim (MASTER_DB_INSTALL'da toplu eklenmiş olmalı ama garantiye alalım)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'z_reports' AND policyname = 'access_policy_z_reports') THEN
        ALTER TABLE z_reports ENABLE ROW LEVEL SECURITY;
        CREATE POLICY "access_policy_z_reports" ON z_reports 
        FOR ALL TO authenticated 
        USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');
    END IF;
END $$;
