import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY // Service role to bypass RLS
);

async function checkUser() {
    const email = 'grandgalata@saas.com';
    console.log(`Checking user: ${email}...`);

    // 1. Check auth.users (via admin API)
    const { data: { users }, error: authError } = await supabase.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);
    
    if (authError) {
        console.error('Auth Error:', authError);
    }

    if (!authUser) {
        console.log('User NOT found in auth.users');
    } else {
        console.log('User found in auth.users:', authUser.id);
    }

    // 2. Check public.app_users
    const { data: appUser, error: appError } = await supabase
        .from('app_users')
        .select('*')
        .eq('email', email)
        .single();

    if (appError) {
        console.error('App User Error:', appError.message);
    } else {
        console.log('User found in app_users:', appUser);
    }
}

checkUser();
