-- AURA SPA SaaS ERP - PERFORMANCE OPTIMIZATION INDEXES
-- Tarih: 2026-04-28
-- Amaç: İşletme sayfalarındaki veri çekme hızını (SELECT) optimize etmek.

-- 1. BUSINESS_ID bazlı temel indeksler (Neredeyse her sorgu bu kolonu kullanıyor)
CREATE INDEX IF NOT EXISTS idx_appointments_business_id ON appointments(business_id);
CREATE INDEX IF NOT EXISTS idx_customers_business_id ON customers(business_id);
CREATE INDEX IF NOT EXISTS idx_payments_business_id ON payments(business_id);
CREATE INDEX IF NOT EXISTS idx_staff_business_id ON staff(business_id);
CREATE INDEX IF NOT EXISTS idx_inventory_business_id ON inventory(business_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_id ON audit_logs(business_id);
CREATE INDEX IF NOT EXISTS idx_expenses_business_id ON expenses(business_id);
CREATE INDEX IF NOT EXISTS idx_services_business_id ON services(business_id);
CREATE INDEX IF NOT EXISTS idx_packages_business_id ON packages(business_id);
CREATE INDEX IF NOT EXISTS idx_debts_business_id ON debts(business_id);
CREATE INDEX IF NOT EXISTS idx_customer_memberships_business_id ON customer_memberships(business_id);
CREATE INDEX IF NOT EXISTS idx_z_reports_business_id ON z_reports(business_id);

-- 2. TARIH ve DURUM bazlı kompozit indeksler (Takvim ve Finansal raporlar için)
CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON appointments(business_id, date);
CREATE INDEX IF NOT EXISTS idx_payments_business_date ON payments(business_id, date);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- 3. CUSTOMER ve STAFF detay sorguları için
CREATE INDEX IF NOT EXISTS idx_appointments_customer_id ON appointments(customer_id);
CREATE INDEX IF NOT EXISTS idx_appointments_staff_id ON appointments(staff_id);
CREATE INDEX IF NOT EXISTS idx_payments_customer_id ON payments(customer_id);

-- 4. BRANCH izolasyonu için
CREATE INDEX IF NOT EXISTS idx_appointments_branch_id ON appointments(branch_id);
CREATE INDEX IF NOT EXISTS idx_staff_branch_id ON staff(branch_id);

-- 5. TEXT SEARCH (Slug bazlı çözünürlük için)
CREATE INDEX IF NOT EXISTS idx_businesses_slug ON businesses(slug);

ANALYZE;
