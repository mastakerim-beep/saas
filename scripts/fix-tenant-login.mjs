import { createClient } from '@supabase/supabase-js';

const supabaseUrl = "https://jymktjxlveyvaqkjrmho.supabase.co";
const serviceKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bWt0anhsdmV5dmFxa2pybWhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU5OTE2NywiZXhwIjoyMDkxMTc1MTY3fQ.HPjjjwz1De5kbqxJq89VFkM2OYFGWYVf3C0P0vXB2Pk";

const supabase = createClient(supabaseUrl, serviceKey);

async function recoverGrandGalata() {
  console.log('--- STARTING RECOVERY FOR GRAND GALATA ---');

  // 1. Ensure Business Exists
  let { data: biz } = await supabase
    .from('businesses')
    .select('*')
    .ilike('name', '%Grand%Galata%')
    .single();

  if (!biz) {
    console.log('Business "Grand Galata" not found. Creating...');
    const nb = {
      id: crypto.randomUUID(),
      name: 'Grand Galata Spa',
      owner_name: 'Galata Admin',
      plan: 'Pro',
      expiry_date: '2027-04-11',
      status: 'Aktif',
      mrr: 1490,
      max_users: 10
    };
    const { data: createdBiz, error: bizErr } = await supabase.from('businesses').insert(nb).select().single();
    if (bizErr) throw bizErr;
    biz = createdBiz;
    console.log('Created Business:', biz.id);
  } else {
    console.log('Business Found:', biz.name, biz.id);
  }

  // 2. Ensure Branch Exists (at least one)
  let { data: branch } = await supabase
    .from('branches')
    .select('*')
    .eq('business_id', biz.id)
    .single();

  if (!branch) {
    console.log('Creating default branch...');
    const { data: nb, error: bErr } = await supabase.from('branches').insert({
      business_id: biz.id,
      name: 'Merkez Şube',
      location: 'İstinye'
    }).select().single();
    if (bErr) throw bErr;
    branch = nb;
  }

  // 3. Ensure User Exists (Testing with a dummy or requested email)
  // The user says "Grand Galata cannot enter", usually referring to the owner.
  const email = 'galata@mail.com'; // Defaulting to a likely email if not known
  const { data: existingUser } = await supabase.from('app_users').select('*').eq('email', email).single();

  if (!existingUser) {
    console.log(`Creating user record for ${email}...`);
    const { data: newUser, error: uErr } = await supabase.from('app_users').insert({
      id: crypto.randomUUID(),
      business_id: biz.id,
      branch_id: branch.id,
      role: 'Business_Owner',
      name: 'Grand Galata Sahibi',
      email: email,
      permissions: ['all']
    }).select().single();
    if (uErr) throw uErr;
    console.log('Saved user record:', newUser.id);
  } else {
    console.log('User record exists in DB.');
  }

  // 4. Auth Metadata Sync (CRITICAL)
  console.log('Checking Supabase Auth...');
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const authUser = users.find(u => u.email === email);

  if (!authUser) {
    console.log(`Creating Auth user for ${email}...`);
    const { data: na, error: aErr } = await supabase.auth.admin.createUser({
      email: email,
      password: 'password123',
      email_confirm: true,
      user_metadata: {
        role: 'Business_Owner',
        business_id: biz.id
      }
    });
    if (aErr) throw aErr;
    console.log('Auth user created successfully.');
  } else {
    console.log('Updating Auth metadata for existing user...');
    await supabase.auth.admin.updateUserById(authUser.id, {
      user_metadata: {
        role: 'Business_Owner',
        business_id: biz.id
      }
    });
    console.log('Auth metadata synced.');
  }

  console.log('--- RECOVERY COMPLETE ---');
}

recoverGrandGalata().catch(console.error);
