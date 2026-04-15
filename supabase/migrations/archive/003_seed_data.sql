-- ============================================================
-- Aura Spa SaaS - Seed Data (Demo Verileri)
-- ============================================================

-- DİKKAT: Parolalar veya kimlik doğrulaması Supabase Auth üzerinden sağlanmalıdır.
-- Buradaki seed verisi, sadece işletme sınırlarını ve arayüzü görebilmek içindir.

-- 1. Demo İşletmesinin Oluşturulması
INSERT INTO businesses (id, name, owner_name, plan, expiry_date, status, mrr, max_users)
VALUES 
  ('b1000000-0000-0000-0000-000000000000', 'Aura Premium Spa', 'Kerim Kardaş', 'Premium', '2026-12-31', 'Aktif', 12000, 5)
ON CONFLICT (id) DO NOTHING;

-- 2. Demo Şubesinin Oluşturulması
INSERT INTO branches (id, business_id, name, location)
VALUES 
  ('b2000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'Merkez Şube', 'İstanbul')
ON CONFLICT (id) DO NOTHING;

-- 3. Demo Müşteri Oluşturulması
INSERT INTO customers (id, business_id, name, phone, email, segment, note)
VALUES
  ('c1000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'Erman Aydingün', '+90 530 000 0000', 'erman@example.com', 'VIP', 'Alerjik reaksiyon: Lavanta asitleri')
ON CONFLICT (id) DO NOTHING;

-- 4. Demo Personel (Staff) Oluşturulması
INSERT INTO staff (id, business_id, branch_id, name, role, status, weekly_off_day)
VALUES
  ('e1000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'b2000000-0000-0000-0000-000000000000', 'Kerim', 'Uzman Uzman', 'Aktif', 1)
ON CONFLICT (id) DO NOTHING;

-- 5. Demo Randevu Oluşturulması
INSERT INTO appointments (id, business_id, branch_id, customer_id, customer_name, service, staff_name, staff_id, date, time, duration, status, price, deposit_paid)
VALUES
  ('a1000000-0000-0000-0000-000000000000', 'b1000000-0000-0000-0000-000000000000', 'b2000000-0000-0000-0000-000000000000', 'c1000000-0000-0000-0000-000000000000', 'Erman Aydingün', 'Bali Masajı', 'Kerim', 'e1000000-0000-0000-0000-000000000000', CURRENT_DATE, '10:00', 60, 'pending', 3400, 500)
ON CONFLICT (id) DO NOTHING;
