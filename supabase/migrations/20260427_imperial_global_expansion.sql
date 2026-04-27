-- Imperial Global Expansion & Multi-Channel Reporting Support
-- Bu migration, global büyüme ve şube bazlı operasyonel denetim için gerekli yeni sütunları ekler.

-- 1. Şubeler için Saat Dilimi (Timezone) desteği
ALTER TABLE branches ADD COLUMN IF NOT EXISTS timezone TEXT DEFAULT 'Europe/Istanbul';

-- 2. Z-Raporları için İleri Düzey Denetim ve AI Analiz sütunları
ALTER TABLE z_reports ADD COLUMN IF NOT EXISTS ai_summary TEXT;
ALTER TABLE z_reports ADD COLUMN IF NOT EXISTS closure_notes TEXT;
ALTER TABLE z_reports ADD COLUMN IF NOT EXISTS closed_by_user_id UUID REFERENCES app_users(id);

-- 3. Müşteriler için Global Dil Tercihi (Varsayılanı güncelleme veya ekleme)
-- Bazı müşteriler en/tr dışında dile sahip olabilir
ALTER TABLE customers ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'tr';

-- 4. Audit Loglar için Global Para Birimi takibi (Opsiyonel ama denetim için faydalı)
-- Gelecekte kur farkı takibi için audit loglara metadata eklenebilir.

-- 5. Imperial Audit View Güncellemesi (Z-Raporu AI özetini de içerecek şekilde)
CREATE OR REPLACE VIEW imperial_high_oversight_view AS
SELECT 
    b.name as business_name,
    br.name as branch_name,
    z.report_date,
    z.total_difference,
    z.ai_summary as ai_intelligence_note,
    z.actual_nakit + z.actual_kart + z.actual_havale as total_turnover,
    br.timezone
FROM z_reports z
JOIN businesses b ON z.business_id = b.id
JOIN branches br ON z.branch_id = br.id
ORDER BY z.report_date DESC;

COMMENT ON VIEW imperial_high_oversight_view IS 'İmparatorluk yüksek denetim görünümü - Tüm global operasyonun AI özetli finansal röntgeni.';
