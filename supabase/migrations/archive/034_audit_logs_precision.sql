-- ============================================================
-- 034 - Audit Logs Atomik Hassasiyet Güncellemesi
-- ============================================================

-- 1. Tarih alanını DATE'den TIMESTAMPTZ'ye yükseltme
-- Var olan veriler otomatik olarak o günün 00:00 saatine çekilecektir.
ALTER TABLE audit_logs 
ALTER COLUMN date TYPE TIMESTAMPTZ USING date::TIMESTAMPTZ;

-- 2. Default değerlerin ve hassasiyetin garantiye alınması
ALTER TABLE audit_logs 
ALTER COLUMN date SET DEFAULT NOW();

-- 3. RLS Politikalarının Kernel Log gereksinimlerine göre güncellenmesi
DROP POLICY IF EXISTS "audit_logs_all" ON audit_logs;

CREATE POLICY "audit_logs_all" ON audit_logs FOR ALL
  USING (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID)
  WITH CHECK (business_id = (auth.jwt() -> 'user_metadata' ->> 'business_id')::UUID);

-- 4. İndeksleme (Zaman bazlı sorgular için performans artışı)
CREATE INDEX IF NOT EXISTS idx_audit_logs_date_precise ON audit_logs(business_id, date DESC);

-- Not: Artık loglarda sadece gün değil, işlem saniyesi de tutulmaktadır.
