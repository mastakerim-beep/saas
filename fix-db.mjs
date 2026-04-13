import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("HATA: .env.local icinde Supabase anahtarlari bulunamadi!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  console.log("Veritabanı yaması uygulanıyor: room_id alanı ekleniyor...\n");
  
  // SQL komutunu doğrudan çalıştırmak için rpc veya query arayüzü yoksa
  // Supabase Table Editor'den yapılmasını önerebiliriz ama biz burada ALTER TABLE deneyeceğiz
  // Not: supabase-js ile doğrudan ALTER TABLE yapılamaz. 
  // Kullanıcıya bu SQL'i Dashboard'dan çalıştırmasını söylemek en güvenlisi.
  
  console.log("DİKKAT: supabase-js kütüphanesi şema değişikliği (ALTER TABLE) yapamaz.");
  console.log("Lütfen şu SQL komutunu Supabase SQL Editor üzerinden çalıştırın:");
  console.log(`
    ALTER TABLE appointments ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES rooms(id) ON DELETE SET NULL;
  `);
}

fix();
