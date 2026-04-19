import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'plus@mail.com',
    password: 'password123'
  });

  if (error) {
    console.error('Login Failed:', error.message);
  } else {
    console.log('Login Success! User ID:', data.user.id);
    console.log('User Metadata:', data.user.user_metadata);
  }
}

testLogin();
