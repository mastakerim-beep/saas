import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Hata: SUPABASE_URL veya SERVICE_ROLE_KEY bulunamadı!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function wipeData() {
  const targetEmail = 'kerim@mail.com';
  console.log(`>>> Sistem Temizliği Başlatıldı: ${targetEmail} hariç her şey silinecek.`);

  try {
    // 1. Kerim'in UUID'sini bul
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    if (userError) throw userError;

    const kerimUser = users.users.find(u => u.email === targetEmail);
    if (!kerimUser) {
      console.error(`Hata: ${targetEmail} kullanıcısı auth tablosunda bulunamadı!`);
      return;
    }
    const kerimId = kerimUser.id;
    console.log(`[OK] Kerim bulundu. ID: ${kerimId}`);

    // 2. Diğer kullanıcıları auth.users'dan sil
    const otherUsers = users.users.filter(u => u.email !== targetEmail);
    console.log(`[INFO] ${otherUsers.length} diğer kullanıcı silinecek...`);
    for (const user of otherUsers) {
      const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
      if (delError) console.warn(`[WARN] Kullanıcı silinemedi (${user.email}):`, delError.message);
      else console.log(`[OK] Kullanıcı silindi: ${user.email}`);
    }

    // 3. Tüm bağımlı tabloları temizle (Cascade eksikliği olanlar için garanti çözüm)
    const tablesToClear = [
      'quotes', 'z_reports', 'audit_logs', 'ai_insights', 'commission_rules', 
      'calendar_blocks', 'payments', 'debts', 'expenses', 'inventory', 
      'customer_memberships', 'membership_plans', 'packages', 'package_definitions', 
      'services', 'rooms', 'staff', 'customers', 'branches', 'payment_definitions',
      'bank_accounts', 'referral_sources', 'consent_form_templates', 'booking_settings',
      'system_announcements', 'tenant_modules'
    ];

    console.log('[INFO] Bağımlı tablolar temizleniyor...');
    for (const table of tablesToClear) {
      const { error: clearError } = await supabase.from(table).delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (clearError) console.warn(`[WARN] ${table} temizlenemedi:`, clearError.message);
    }

    // 4. Businesses tablosunu temizle
    console.log('[INFO] Tüm işletmeler siliniyor...');
    const { error: bizError } = await supabase.from('businesses').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (bizError) throw bizError;
    console.log('[OK] İşletmeler silindi.');

    // 5. app_users tablosunda Kerim hariç her şeyi sil
    console.log('[INFO] app_users temizleniyor...');
    const { error: appUserDelError } = await supabase.from('app_users').delete().not('id', 'eq', kerimId);
    if (appUserDelError) throw appUserDelError;

    // 6. Kerim'in profilini SaaS_Owner olarak güncelle
    console.log('[INFO] Kerim süperadmin yetkileri tanımlanıyor...');
    const { error: updateError } = await supabase.from('app_users').upsert({
      id: kerimId,
      email: targetEmail,
      name: kerimUser.user_metadata?.name || 'Kerim Kardaş',
      role: 'SaaS_Owner',
      business_id: null,
      permissions: ['*']
    });
    if (updateError) throw updateError;
    console.log('[OK] Kerim SaaS_Owner olarak güncellendi.');

    console.log('>>> TEMİZLİK TAMAMLANDI. Sistem hazır.');

    console.log('>>> TEMİZLİK TAMAMLANDI. Sistem hazır.');
  } catch (error) {
    console.error('KRİTİK HATA:', error.message);
  }
}

wipeData();
