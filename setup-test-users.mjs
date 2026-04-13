import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing SUPABASE environment variables!");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const BIZ_ID = 'b1000000-0000-0000-0000-000000000000';

async function setup() {
  console.log("Setting up test users...");

  const users = [
    {
      email: 'kerim@mail.com',
      password: 'password123',
      name: 'Kerim Kardaş',
      role: 'SaaS_Owner',
      business_id: '00000000-0000-0000-0000-000000000000'
    },
    {
      email: 'auraspa_owner@mail.com',
      password: 'password123',
      name: 'Aura Spa Yöneticisi',
      role: 'Business_Owner',
      business_id: BIZ_ID
    }
  ];

  for (const u of users) {
    console.log(`Processing user: ${u.email}`);
    
    // Auth Create/Update
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: u.email,
      password: u.password,
      email_confirm: true,
      user_metadata: { name: u.name, role: u.role, business_id: u.business_id }
    });

    let userId = authUser?.user?.id;

    if (authError) {
      if (authError.message.includes('already registered')) {
        console.log(`User ${u.email} already exists in Auth.`);
        const { data: existing } = await supabase.auth.admin.listUsers();
        userId = existing.users.find(eu => eu.email === u.email)?.id;
      } else {
        console.error(`Error creating ${u.email} in Auth:`, authError.message);
        continue;
      }
    }

    // App User Sync
    if (userId) {
      const { error: upsertError } = await supabase.from('app_users').upsert({
        id: userId,
        email: u.email,
        name: u.name,
        role: u.role,
        business_id: u.business_id,
        permissions: ['*']
      });
      
      if (upsertError) console.error(`Error syncing ${u.email} to app_users:`, upsertError.message);
      else console.log(`Successfully setup ${u.email}.`);
    }
  }

  console.log("Done.");
}

setup();
