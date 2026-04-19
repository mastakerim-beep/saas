import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: users, error: listError } = await supabase.auth.admin.listUsers();
  if (listError) {
    console.error("List error:", listError.message);
    return;
  }

  const user = users.users.find(u => u.email === 'kerim@mail.com');
  if (!user) {
    console.log("User not found, creating...");
    const { error: createError } = await supabase.auth.admin.createUser({
      email: 'kerim@mail.com',
      password: 'password123',
      email_confirm: true,
      user_metadata: { role: 'SaaS_Owner', name: 'Kerim Kardaş', businessId: '00000000-0000-0000-0000-000000000000' }
    });
    if (createError) console.error("Create error:", createError.message);
    else console.log("Created successfully with password: password123");
  } else {
    console.log("User found, resetting password...");
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: 'password123'
    });
    if (updateError) console.error("Update error:", updateError.message);
    else console.log("Password reset successfully to: password123");
  }
}
run();
