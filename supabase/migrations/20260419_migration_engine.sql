-- AURA SPA - MIGRATION ENGINE DATABASE INFRASTRUCTURE
-- Tarih: 2026-04-19

-- 1. STAGING TABLE (GEÇİCİ ALAN)
CREATE TABLE IF NOT EXISTS temp_migrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    data_type TEXT NOT NULL, -- 'customer', 'service', 'staff', 'appointment', 'package'
    raw_data JSONB NOT NULL,
    status TEXT DEFAULT 'pending', -- 'pending', 'validating', 'error', 'imported'
    system_note TEXT, -- Hata mesajı veya eşleştirme notu
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for temp_migrations
ALTER TABLE temp_migrations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "access_policy_temp_migrations" ON temp_migrations;
CREATE POLICY "access_policy_temp_migrations" ON temp_migrations 
FOR ALL TO authenticated 
USING (business_id = get_my_business_id() OR get_my_role() = 'SaaS_Owner');

-- 2. HELPER FUNCTIONS
-- Hata loglama için yardımcı fonksiyon
CREATE OR REPLACE FUNCTION log_migration_error(migration_id UUID, note TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE temp_migrations 
    SET status = 'error', system_note = note, updated_at = NOW()
    WHERE id = migration_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. GEÇMİŞ RANDEVU VE HİZMET İŞLEYİCİLERİ
-- Hizmetleri staging'den ana tabloya aktarır (Eşleştirme onayına göre)
CREATE OR REPLACE FUNCTION process_services_migration(p_business_id UUID)
RETURNS TABLE(success_count INT, new_created INT) AS $$
DECLARE
    rec RECORD;
    v_success INT := 0;
    v_new INT := 0;
BEGIN
    FOR rec IN SELECT * FROM temp_migrations 
               WHERE business_id = p_business_id 
               AND data_type = 'service' 
               AND status IN ('pending', 'validating')
    LOOP
        -- Eğer hizmet zaten varsa atla, yoksa yeni oluştur (Onay alınmış varsayıyoruz)
        IF NOT EXISTS (SELECT 1 FROM services WHERE business_id = p_business_id AND name = rec.raw_data->>'name') THEN
            INSERT INTO services (
                business_id, name, duration, price, category
            ) VALUES (
                p_business_id,
                rec.raw_data->>'name',
                (rec.raw_data->>'duration')::INT,
                (rec.raw_data->>'price')::NUMERIC,
                COALESCE(rec.raw_data->>'category', 'Genel')
            );
            v_new := v_new + 1;
        END IF;
        
        UPDATE temp_migrations SET status = 'imported' WHERE id = rec.id;
        v_success := v_success + 1;
    END LOOP;
    
    RETURN QUERY SELECT v_success, v_new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Geriye dönük randevuları (Historical Appointments) aktarır
CREATE OR REPLACE FUNCTION process_appointments_migration(p_business_id UUID)
RETURNS TABLE(success_count INT, error_count INT) AS $$
DECLARE
    rec RECORD;
    v_customer_id UUID;
    v_staff_id UUID;
    v_success INT := 0;
    v_error INT := 0;
BEGIN
    FOR rec IN SELECT * FROM temp_migrations 
               WHERE business_id = p_business_id 
               AND data_type = 'appointment' 
               AND status = 'pending'
    LOOP
        BEGIN
            -- 1. Müşteriyi bul (Telefon veya isimden)
            SELECT id INTO v_customer_id FROM customers 
            WHERE business_id = p_business_id 
            AND (phone = rec.raw_data->>'customer_phone' OR name = rec.raw_data->>'customer_name')
            LIMIT 1;

            -- 2. Personeli bul (İsimden)
            SELECT id INTO v_staff_id FROM staff 
            WHERE business_id = p_business_id AND name = rec.raw_data->>'staff_name'
            LIMIT 1;

            -- 3. Randevuyu oluştur (Geçmiş tarihli)
            INSERT INTO appointments (
                business_id, customer_id, customer_name, service, staff_id, staff_name,
                date, time, status, price, is_paid, created_at
            ) VALUES (
                p_business_id,
                v_customer_id,
                rec.raw_data->>'customer_name',
                rec.raw_data->>'service',
                v_staff_id,
                rec.raw_data->>'staff_name',
                (rec.raw_data->>'date')::DATE,
                rec.raw_data->>'time',
                'completed', -- Geçmiş randevular otomatik tamamlanmış sayılır
                (rec.raw_data->>'price')::NUMERIC,
                true,
                COALESCE((rec.raw_data->>'created_at')::TIMESTAMPTZ, NOW())
            );

            UPDATE temp_migrations SET status = 'imported' WHERE id = rec.id;
            v_success := v_success + 1;
            
        EXCEPTION WHEN OTHERS THEN
            PERFORM log_migration_error(rec.id, SQLERRM);
            v_error := v_error + 1;
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_success, v_error;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. MÜŞTERİ AKTARIM İŞLEYİCİSİ (UPSERT DESTEKLİ)
CREATE OR REPLACE FUNCTION process_customers_migration(p_business_id UUID)
RETURNS TABLE(success_count INT, error_count INT) AS $$
DECLARE
    rec RECORD;
    v_success INT := 0;
    v_error INT := 0;
BEGIN
    FOR rec IN SELECT * FROM temp_migrations 
               WHERE business_id = p_business_id 
               AND data_type = 'customer' 
               AND status = 'pending' 
    LOOP
        BEGIN
            INSERT INTO customers (
                business_id, name, phone, email, note, created_at
            ) VALUES (
                p_business_id,
                rec.raw_data->>'name',
                rec.raw_data->>'phone',
                rec.raw_data->>'email',
                rec.raw_data->>'note',
                NOW()
            )
            -- Telefon numarası çakışırsa veriyi güncelle ve not ekle
            ON CONFLICT (business_id, phone) DO UPDATE SET
                name = EXCLUDED.name,
                email = EXCLUDED.email,
                note = customers.note || ' | GÖÇ: ' || EXCLUDED.note;
            
            UPDATE temp_migrations SET status = 'imported' WHERE id = rec.id;
            v_success := v_success + 1;
        EXCEPTION WHEN OTHERS THEN
            PERFORM log_migration_error(rec.id, SQLERRM);
            v_error := v_error + 1;
        END;
    END LOOP;
    
    RETURN QUERY SELECT v_success, v_error;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
