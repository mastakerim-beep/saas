import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function fix() {
  const email = 'grandgalata@saas.com';
  const bizSlug = 'grand-galata';
  
  // 1. Find business
  const { data: biz } = await supabase.from('businesses').select('*').eq('slug', bizSlug).single();
  if (!biz) {
    console.error('Business not found');
    return;
  }
  console.log('Found business:', biz.id);

  // 2. Find user
  const { data: { users } } = await supabase.auth.admin.listUsers();
  const user = users.find(u => u.email === email);
  if (!user) {
    console.error('User not found');
    return;
  }
  console.log('Found user:', user.id);

  // 3. Update user metadata and password
  const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
    user.id,
    {
      password: 'password123', // Setting a simpler password to be sure
      user_metadata: {
        ...user.user_metadata,
        role: 'Owner',
        business_id: biz.id,
        name: 'Grand Galata Admin'
      }
    }
  );

  if (updateError) {
    console.error('Update error:', updateError);
  } else {
    console.log('User updated successfully. Password set to: password123');
    
    // 4. Upsert into app_users table
    const { error: appUserError } = await supabase.from('app_users').upsert({
      id: user.id,
      business_id: biz.id,
      role: 'Business_Owner', // Using a valid role from types
      name: 'Grand Galata Admin',
      email: email,
      permissions: ['*']
    });

    if (appUserError) {
      console.error('app_users upsert error:', appUserError);
    } else {
      console.log('app_users record created/updated successfully');
    }
  }
}

fix();
