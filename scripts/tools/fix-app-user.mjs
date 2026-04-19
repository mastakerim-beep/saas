import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  const user = users.users.find(u => u.email === 'kerim@mail.com');
  
  if (user) {
    console.log("Found user ID:", user.id);
    const { error: upsertError } = await supabase.from('app_users').upsert({
      id: user.id,
      email: 'kerim@mail.com',
      name: 'Kerim Kardaş',
      role: 'SaaS_Owner',
      business_id: '00000000-0000-0000-0000-000000000000',
      permissions: ['*']
    });
    if (upsertError) console.error("Upsert error:", upsertError.message);
    else console.log("App user synchronized successfully as SaaS_Owner.");
  }
}
run();
