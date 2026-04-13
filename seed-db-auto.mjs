import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function seed() {
  const bizId = 'b1000000-0000-0000-0000-000000000000';
  const branchId = 'b2000000-0000-0000-0000-000000000000';
  const cusId = 'c1000000-0000-0000-0000-000000000000';
  const staffId = 'e1000000-0000-0000-0000-000000000000';

  console.log('Seeding Businesses...');
  const { error: e1 } = await supabase.from('businesses').upsert({ id: bizId, name: 'Aura Premium Spa', slug: 'aura-spa', owner_name: 'Kerim Kardaş', plan: 'Premium', expiry_date: '2026-12-31', status: 'Aktif', mrr: 12000, max_users: 5 });
  if(e1) console.error(e1.message);

  console.log('Seeding Branches...');
  await supabase.from('branches').upsert({ id: branchId, business_id: bizId, name: 'Merkez Şube', location: 'İstanbul' });

  console.log('Seeding Customers...');
  await supabase.from('customers').upsert({ id: cusId, business_id: bizId, name: 'Erman Aydingün', phone: '+90 530 000 0000', email: 'erman@example.com', segment: 'VIP', note: 'Demonstrasyon Müşterisi' });

  console.log('Seeding Staff...');
  await supabase.from('staff').upsert({ id: staffId, business_id: bizId, branch_id: branchId, name: 'Kerim Yılmaz', role: 'Uzman', status: 'Aktif', weekly_off_day: 1 });

  console.log('Seeding Appointments...');
  await supabase.from('appointments').upsert({ id: 'a1000000-0000-0000-0000-000000000000', business_id: bizId, branch_id: branchId, customer_id: cusId, customer_name: 'Erman Aydingün', service: 'Bali Masajı', staff_name: 'Kerim Yılmaz', staff_id: staffId, date: new Date().toISOString().split('T')[0], time: '10:00', duration: 60, status: 'pending', price: 3400 });

  console.log('Done.');
}
seed();
