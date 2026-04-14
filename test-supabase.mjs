import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("HATA: .env.local icinde Supabase anahtarlari bulunamadi!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  console.log("Supabase veritabanına bağlanılıyor...\n");
  
  // Tablolardan birine deneme sorgusu
  const { data: businesses, error: bizError } = await supabase.from('businesses').select('*');
  
  if (bizError) {
    if (bizError.code === '42P01') {
      console.log("❌ Tablolar kurulamamış! (Hata: businesses tablosu bulunamadı)");
    } else {
      console.log("❌ Bağlantı hatası:", bizError.message);
    }
    return;
  }

  const { data: customers, error: cusError } = await supabase.from('customers').select('*');
  const { data: appointments, error: appError } = await supabase.from('appointments').select('*');

  console.log("✅ HARİKA! Supabase Veritabanı ve Tablolar Başarıyla Kurulmuş!");
  console.log("-----------------------------------------");
  console.log("🎯 İçerideki Kayıt Sayıları:");
  console.log(`- İşletmeler (Businesses): ${businesses?.length || 0}`);
  console.log(`- Müşteriler (Customers): ${customers?.length || 0}`);
  console.log(`- Randevular (Appointments): ${appointments?.length || 0}`);
  
  if (businesses?.length > 0) {
      console.log("\nÖrnek İşletme Adı:", businesses[0].name);
  }
}

check();
