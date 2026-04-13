-- Bu script, eğer birden fazla işletme aynı slug'ı almaya çalışırsa (örneğin ILIKE '%Aura%' ile),
-- bunları id'lerinin bir kısmını ekleyerek benzersizleştirir.

DO $$
DECLARE
    r RECORD;
BEGIN
    -- 1. Önce slug'ı null olan veya Aura içeren ama slug'ı atanmamış olanları düzeltelim
    FOR r IN (SELECT id, name FROM businesses WHERE slug IS NULL OR slug = '') LOOP
        UPDATE businesses 
        SET slug = lower(regexp_replace(name, '[^a-zA-Z0-9]', '-', 'g')) || '-' || left(id::text, 4)
        WHERE id = r.id;
    END LOOP;

    -- 2. Eğer hala çakışan slug varsa (nadiren), onları da benzersizleştir
    FOR r IN (
        SELECT slug FROM businesses 
        GROUP BY slug HAVING count(*) > 1
    ) LOOP
        -- Çakışan slug'lara sahip işletmeleri bul ve sonlarına id ekle
        FOR r IN (SELECT id FROM businesses WHERE slug = r.slug) LOOP
             UPDATE businesses SET slug = slug || '-' || left(id::text, 4) WHERE id = r.id;
        END LOOP;
    END LOOP;
END $$;
