import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function provisionClient() {
  const bizId = crypto.randomUUID();
  const branchId = crypto.randomUUID();
  const staffId = crypto.randomUUID();

  console.log('1. İşletme Kaydı Oluşturuluyor (Grand Galata)...');
  const { error: bErr } = await supabase.from('businesses').insert({
    id: bizId, 
    name: 'Grand Galata Spa', 
    owner_name: 'Betül', 
    plan: 'Premium', 
    expiry_date: '2027-01-01', 
    status: 'Aktif', 
    mrr: 0, 
    max_users: 5
  });
  if (bErr) { console.error('Business Error:', bErr.message); return; }

  console.log('2. Merkez Şube Oluşturuluyor...');
  await supabase.from('branches').insert({
    id: branchId, business_id: bizId, name: 'Merkez Şube', location: 'Galata, İstanbul'
  });

  console.log('3. Sistemin Çalışması İçin İlk Personel (Betül) Ekleniyor...');
  await supabase.from('staff').insert({
    id: staffId, business_id: bizId, branch_id: branchId, name: 'Betül', role: 'Uzman', status: 'Aktif', weekly_off_day: 1
  });

  console.log('4. Kimlik Doğrulama (Auth) Kullanıcısı Açılıyor...');
  const { data: user, error: uErr } = await supabase.auth.admin.createUser({
    email: 'grandgalata@saas.com',
    password: 'betul123',
    email_confirm: true,
    user_metadata: {
      name: 'Betül (Grand Galata)',
      role: 'Owner',
      business_id: bizId
    }
  });

  if (uErr) { console.error('Auth Error:', uErr.message); return; }

  console.log('✅ İşlem Tamamlandı! Müşteriye Teslim Edilebilir.');
}

provisionClient();
