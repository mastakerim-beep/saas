-- Güvenli Business ID Getirme (Casting Hatasını Engeller)
CREATE OR REPLACE FUNCTION get_my_business_id()
RETURNS UUID AS $$
DECLARE
  v_uuid_str TEXT;
BEGIN
  v_uuid_str := auth.jwt() -> 'user_metadata' ->> 'business_id';
  
  -- Eğer boş veya tanımsızsa hata verme, sadece null dön
  IF v_uuid_str IS NULL OR v_uuid_str = '' OR v_uuid_str = 'main' THEN
    RETURN NULL;
  END IF;

  -- Kalanı güvenli dene (gerçek bir UUID değilse Postgres hatasını yakala ve null dön)
  BEGIN
    RETURN v_uuid_str::UUID;
  EXCEPTION WHEN invalid_text_representation THEN
    RETURN NULL;
  END;
END;
$$ LANGUAGE plpgsql STABLE;
