-- 1. İşletme Tablosuna SaaS Yönetim Sütunları Ekleme
ALTER TABLE businesses 
ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS grace_period_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS suspension_reason TEXT;

-- 2. Personel Tablosuna Durum Alanı (Eğer Yoksa)
-- Not: Personel pasife alındığında kotadan düşmesi için bu status alanı kritiktir.
ALTER TABLE staff 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'passive', 'on-leave'));

-- 3. SaaS Dashboard İçin Kota Kullanım Görünümü (Helper View)
-- Bu view sayesinde superadmin hangi işletmenin gerçekte kaç aktif personeli olduğunu tek sorguyla görebilir.
CREATE OR REPLACE VIEW saas_quota_usage AS
SELECT 
    b.id as business_id,
    b.name as business_name,
    b.plan,
    (SELECT count(*) FROM staff s WHERE s.business_id = b.id AND s.status = 'active') as active_staff_count,
    CASE 
        WHEN b.plan = 'Basic' THEN 5 
        WHEN b.plan = 'Aura Enterprise' THEN 999 
        ELSE 5 
    END as staff_limit
FROM businesses b;

-- 4. Endeksler (Performans İçin)
CREATE INDEX IF NOT EXISTS idx_staff_business_status ON staff(business_id, status);
CREATE INDEX IF NOT EXISTS idx_businesses_unpaid_grace ON businesses(payment_status, grace_period_until) WHERE payment_status = 'unpaid';

-- 5. Manuel Örnek Sorgular (Not Amaçlı)
/*
   -- Bir işletmeye 3 gün süre ver:
   UPDATE businesses SET grace_period_until = NOW() + INTERVAL '3 days', payment_status = 'unpaid' WHERE slug = 'isletme-slug';
   
   -- Bir işletmeyi tamamen askıya al:
   UPDATE businesses SET is_suspended = TRUE, suspension_reason = 'Kural ihlali' WHERE id = 'uuid';
*/
