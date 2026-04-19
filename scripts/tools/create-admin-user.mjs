import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log("HATA: .env.local icinde SUPABASE_SERVICE_ROLE_KEY bulunamadi!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  console.log("Sistem admin kullanıcısı oluşturuluyor...");
  
  const { data, error } = await supabase.auth.admin.createUser({
    email: 'kerim@mail.com',
    password: 'password123',
    email_confirm: true,
    user_metadata: {
      name: 'Kerim Kardaş',
      role: 'Business_Owner',
      business_id: 'b1000000-0000-0000-0000-000000000000'
    }
  });

  if (error) {
    if (error.message.includes('already registered')) {
        console.log("✅ Kullanıcı zaten mevcut! (E-posta: kerim@mail.com)");
    } else {
        console.log("❌ Kullanıcı oluşturulamadı:", error.message);
    }
    return;
  }

  console.log("✅ Başarılı! Kullanıcı Auth tablosuna eklendi.");
  console.log("E-posta: kerim@mail.com");
  console.log("Şifre: password123");
}

createAdmin();
