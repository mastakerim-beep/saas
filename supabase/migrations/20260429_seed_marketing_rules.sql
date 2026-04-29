-- Seed default Imperial Marketing Rules for all businesses
INSERT INTO marketing_rules (business_id, name, trigger_type, threshold, message_template, is_active)
SELECT b.id, 'İmparatorluk Karşılaması', 'NEW_CUSTOMER', 0, 'İmparatorluğa hoş geldiniz! İlk seansınızda %15 indirim sizi bekliyor. Kod: AURA15', true
FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM marketing_rules m WHERE m.business_id = b.id AND m.name = 'İmparatorluk Karşılaması');

INSERT INTO marketing_rules (business_id, name, trigger_type, threshold, message_template, is_active)
SELECT b.id, 'Sadakat Ödülü (500 Puan)', 'LOYALTY_POINTS', 500, '500 sadakat puanına ulaştınız! Bir sonraki masajınızda ₺100 indirim kazandınız. Kod: LOYAL100', true
FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM marketing_rules m WHERE m.business_id = b.id AND m.name = 'Sadakat Ödülü (500 Puan)');

INSERT INTO marketing_rules (business_id, name, trigger_type, threshold, message_template, is_active)
SELECT b.id, 'Geri Kazanım Operasyonu', 'CHURN_RISK', 30, 'Sizi özledik! Geri dönüşünüze özel %20 indirim tanımladık. Sizi tekrar aramızda görmek isteriz.', true
FROM businesses b
WHERE NOT EXISTS (SELECT 1 FROM marketing_rules m WHERE m.business_id = b.id AND m.name = 'Geri Kazanım Operasyonu');
