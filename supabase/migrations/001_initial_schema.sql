-- ============================================================
-- Aura Spa SaaS - Veritabanı Şeması (PostgreSQL / Supabase)
-- Sürüm: 1.0
-- Açıklama: Çok kiracılı (multi-tenant) SaaS ERP altyapısı
-- ============================================================

-- UUID eklentisini etkinleştir
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. BUSINESSES — SaaS Müşteri İşletmeler
-- ============================================================
CREATE TABLE IF NOT EXISTS businesses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        TEXT NOT NULL,
    owner_name  TEXT NOT NULL,
    plan        TEXT NOT NULL DEFAULT 'Basic' CHECK (plan IN ('Basic', 'Pro', 'Premium')),
    expiry_date DATE NOT NULL,
    status      TEXT NOT NULL DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'Kısıtlı', 'Ödeme Bekliyor')),
    mrr         NUMERIC(10,2) DEFAULT 0,
    max_users   INT NOT NULL DEFAULT 3,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 2. BRANCHES — İşletme Şubeleri
-- ============================================================
CREATE TABLE IF NOT EXISTS branches (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    location    TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 3. APP_USERS — Sistem Kullanıcıları (RBAC)
-- ============================================================
CREATE TABLE IF NOT EXISTS app_users (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),  -- Supabase Auth uid ile aynı
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id   UUID REFERENCES branches(id) ON DELETE SET NULL,
    role        TEXT NOT NULL DEFAULT 'Staff' 
                CHECK (role IN ('SaaS_Owner', 'Business_Owner', 'Branch_Manager', 'Staff')),
    name        TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    permissions TEXT[] DEFAULT '{}',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 4. CUSTOMERS — İşletme Müşterileri
-- ============================================================
CREATE TABLE IF NOT EXISTS customers (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    phone          TEXT DEFAULT '',
    email          TEXT DEFAULT '',
    birthdate      TEXT DEFAULT '',
    segment        TEXT DEFAULT 'Normal' CHECK (segment IN ('Normal', 'VIP', 'Kurumsal')),
    note           TEXT DEFAULT '',
    is_churn_risk  BOOLEAN DEFAULT false,
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 5. STAFF — Personel
-- ============================================================
CREATE TABLE IF NOT EXISTS staff (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id    UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id      UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name           TEXT NOT NULL,
    role           TEXT DEFAULT 'Uzman',
    status         TEXT DEFAULT 'Aktif' CHECK (status IN ('Aktif', 'İzinli', 'Ayrıldı')),
    weekly_off_day INT DEFAULT 0,  -- 0=Pazar, 1=Pazartesi, ...
    created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 6. ROOMS — Odalar / Kabinler
-- ============================================================
CREATE TABLE IF NOT EXISTS rooms (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    status      TEXT DEFAULT 'Boş' CHECK (status IN ('Boş', 'Dolu', 'Bakımda')),
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 7. MEMBERSHIP_PLANS — Üyelik Paket Tanımları
-- ============================================================
CREATE TABLE IF NOT EXISTS membership_plans (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id       UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name              TEXT NOT NULL,
    price             NUMERIC(10,2) NOT NULL DEFAULT 0,
    period_days       INT DEFAULT 30,
    benefits          TEXT[] DEFAULT '{}',
    allowed_services  TEXT[] DEFAULT '{}',
    sessions_per_month INT DEFAULT 0,
    created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 8. CUSTOMER_MEMBERSHIPS — Müşteri Üyelik Kayıtları
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_memberships (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id         UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id         UUID NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    plan_id             UUID NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
    start_date          DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date         DATE NOT NULL,
    remaining_sessions  INT DEFAULT 0,
    status              TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'canceled')),
    created_at          TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 9. APPOINTMENTS — Randevular (Temel İş Tablosu)
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name   TEXT NOT NULL,
    service         TEXT NOT NULL,
    staff_name      TEXT DEFAULT '',
    staff_id        UUID REFERENCES staff(id) ON DELETE SET NULL,
    date            DATE NOT NULL,
    time            TEXT NOT NULL,  -- HH:MM formatında
    duration        INT DEFAULT 60,  -- Dakika
    status          TEXT DEFAULT 'pending' 
                    CHECK (status IN ('pending', 'completed', 'no-show', 'cancelled', 'excused')),
    price           NUMERIC(10,2) DEFAULT 0,
    deposit_paid    NUMERIC(10,2) DEFAULT 0,
    is_online       BOOLEAN DEFAULT false,
    package_id      UUID REFERENCES customer_memberships(id) ON DELETE SET NULL,  -- Paket bilgisi
    membership_id   UUID REFERENCES customer_memberships(id) ON DELETE SET NULL,
    sync_status     TEXT DEFAULT 'synced',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Randevular için indeks (sorgular hızlansın)
CREATE INDEX IF NOT EXISTS idx_appointments_business_date ON appointments(business_id, date);
CREATE INDEX IF NOT EXISTS idx_appointments_customer ON appointments(customer_id);

-- ============================================================
-- 10. PAYMENTS — Tahsilatlar
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id       UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    customer_name   TEXT NOT NULL,
    service         TEXT DEFAULT '',
    methods         JSONB NOT NULL DEFAULT '[]',  -- PaymentMethod[] JSON olarak saklanır
    total_amount    NUMERIC(10,2) NOT NULL DEFAULT 0,
    date            DATE NOT NULL DEFAULT CURRENT_DATE,
    note            TEXT DEFAULT '',
    sync_status     TEXT DEFAULT 'synced',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payments_business_date ON payments(business_id, date);

-- ============================================================
-- 11. DEBTS — Açık Hesaplar / Borçlar
-- ============================================================
CREATE TABLE IF NOT EXISTS debts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id     UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
    appointment_id  UUID REFERENCES appointments(id) ON DELETE SET NULL,
    amount          NUMERIC(10,2) NOT NULL DEFAULT 0,
    due_date        DATE NOT NULL DEFAULT CURRENT_DATE,
    description     TEXT DEFAULT '',
    status          TEXT DEFAULT 'açık' CHECK (status IN ('açık', 'kapandı')),
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. EXPENSES — Gider Takibi
-- ============================================================
CREATE TABLE IF NOT EXISTS expenses (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    "desc"      TEXT NOT NULL,
    amount      NUMERIC(10,2) NOT NULL DEFAULT 0,
    category    TEXT DEFAULT 'Genel',
    date        DATE NOT NULL DEFAULT CURRENT_DATE,
    "user"      TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 13. INVENTORY — Stok Yönetimi
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    category    TEXT DEFAULT 'Genel',
    price       NUMERIC(10,2) DEFAULT 0,
    stock       INT DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 14. AUDIT_LOGS — Güvenlik ve İşlem Logları
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id     UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    date            DATE NOT NULL DEFAULT CURRENT_DATE,
    customer_name   TEXT DEFAULT '',
    action          TEXT NOT NULL,
    old_value       TEXT,
    new_value       TEXT,
    "user"          TEXT NOT NULL DEFAULT 'system',
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_business ON audit_logs(business_id, created_at DESC);

-- ============================================================
-- 15. NOTIFICATION_LOGS — WhatsApp/SMS Gönderim Logları
-- ============================================================
CREATE TABLE IF NOT EXISTS notification_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    customer_id  UUID REFERENCES customers(id) ON DELETE SET NULL,
    type         TEXT NOT NULL CHECK (type IN ('SMS', 'WHATSAPP', 'EMAIL')),
    content      TEXT DEFAULT '',
    status       TEXT DEFAULT 'SENT' CHECK (status IN ('SENT', 'FAILED')),
    sent_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 16. COMMISSION_RULES — Prim Kuralları
-- ============================================================
CREATE TABLE IF NOT EXISTS commission_rules (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id  UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    staff_id     UUID REFERENCES staff(id) ON DELETE CASCADE,
    service_name TEXT,
    type         TEXT DEFAULT 'percentage' CHECK (type IN ('percentage', 'fixed')),
    value        NUMERIC(10,2) DEFAULT 0,
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 17. CALENDAR_BLOCKS — Takvim Blokları (İzin, Tatil vb.)
-- ============================================================
CREATE TABLE IF NOT EXISTS calendar_blocks (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID NOT NULL REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id   UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
    staff_id    UUID REFERENCES staff(id) ON DELETE CASCADE,
    date        DATE NOT NULL,
    time        TEXT NOT NULL,
    duration    INT DEFAULT 60,
    reason      TEXT DEFAULT '',
    created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- updated_at için trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_appointments_updated_at
    BEFORE UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
