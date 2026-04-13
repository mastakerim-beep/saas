import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAndFix() {
  const email = 'grandgalata@saas.com';
  
  console.log(`Checking user: ${email}...`);
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  
  if (!user) {
    console.log('User not found. Provisioning manual...');
    return;
  }
  
  console.log('User found:', user.id);
  console.log('User metadata:', user.user_metadata);
  
  const { data: businesses, error: bizError } = await supabase.from('businesses').select('*').ilike('name', '%Grand Galata%');
  console.log('Businesses found:', businesses);
  
  if (businesses && businesses.length > 0) {
    const biz = businesses[0];
    if (user.user_metadata?.business_id !== biz.id) {
      console.log(`Mismatch! Updating user metadata with business_id: ${biz.id}`);
      await supabase.auth.admin.updateUserById(user.id, {
        user_metadata: { ...user.user_metadata, business_id: biz.id, role: 'Owner' }
      });
      console.log('Metadata updated.');
    } else {
      console.log('User already correctly linked.');
    }
  } else {
    console.log('Business not found in table.');
  }
}

checkAndFix();
