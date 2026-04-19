-- İşletme bazlı takvim saat ayarları (Başlangıç ve Bitiş Saatleri)
-- Bu kolonlar takvimin hangi saatler arasında görüntüleneceğini belirler.
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS calendar_start_hour INT DEFAULT 9;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS calendar_end_hour INT DEFAULT 21;
