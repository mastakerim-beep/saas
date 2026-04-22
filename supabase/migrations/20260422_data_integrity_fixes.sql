-- ============================================================
-- 026 - Veri Bütünlüğü ve Otomatik Denetim (Data Integrity & Auto-Audit)
-- Sürüm: 1.0
-- Açıklama: Silme işlemlerini loglar ve mühürlü randevuları korur.
-- ============================================================

-- 1. SİLME İŞLEMLERİNİ OTOMATİK LOGLAYAN FONKSİYON
CREATE OR REPLACE FUNCTION audit_deletions_trigger_fn()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (business_id, action, old_value, "user", created_at)
  VALUES (
    OLD.business_id, 
    'DELETED_' || UPPER(TG_TABLE_NAME), 
    row_to_json(OLD)::TEXT, 
    COALESCE(current_setting('app.current_user_email', true), 'database_trigger'), 
    NOW()
  );
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. TAMAMLANMIŞ RANDEVU KORUMA FONKSİYONU
CREATE OR REPLACE FUNCTION protect_sealed_appointments_fn()
RETURNS TRIGGER AS $$
BEGIN
  -- Eğer randevu 'completed' veya 'excused' durumundaysa silinmesini engelle
  IF OLD.status IN ('completed', 'excused') THEN
    RAISE EXCEPTION 'Tamamlanmış veya Mazeretli işaretlenmiş randevular silinemez. Lütfen önce randevu durumunu güncelleyin.';
  END IF;
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- 3. TETİKLEYİCİLERİ (TRIGGERS) UYGULA

-- Randevular için Denetim ve Koruma
DROP TRIGGER IF EXISTS trg_audit_appointments_delete ON appointments;
CREATE TRIGGER trg_audit_appointments_delete
  BEFORE DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION audit_deletions_trigger_fn();

DROP TRIGGER IF EXISTS trg_protect_sealed_appointments ON appointments;
CREATE TRIGGER trg_protect_sealed_appointments
  BEFORE DELETE ON appointments
  FOR EACH ROW EXECUTE FUNCTION protect_sealed_appointments_fn();

-- Ödemeler için Denetim (Ödemeler asla silinmemeli, ancak silinirse logla)
DROP TRIGGER IF EXISTS trg_audit_payments_delete ON payments;
CREATE TRIGGER trg_audit_payments_delete
  BEFORE DELETE ON payments
  FOR EACH ROW EXECUTE FUNCTION audit_deletions_trigger_fn();

-- 4. FATURA BİLGİLERİ İÇİN EK KONTROL (Optional - Constraints)
-- Not: is_manual_override sütunu 20260419 migration'ında eklenmişti.
-- Burada sadece tutarlılık için yorumlar ekleyelim.
COMMENT ON TABLE appointments IS 'Kritik operasyonel tablo: Tamamlanmış kayıtlar veritabanı seviyesinde korunur.';
