import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function reset() {
  const email = 'grandgalata@saas.com';
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (user) {
    console.log(`Resetting password for ${email}...`);
    await supabase.auth.admin.updateUserById(user.id, {
      password: 'betul123',
      email_confirm: true
    });
    console.log('Password reset to betul123');
  } else {
    console.log('User not found.');
  }
}

reset();
