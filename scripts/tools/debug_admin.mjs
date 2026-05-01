import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkUser() {
    const { data: users, error } = await supabase
        .from('app_users')
        .select('email, role, business_id')
        .eq('email', 'kerim@mail.com');

    if (error) {
        console.error("Error:", error);
        return;
    }

    console.log("Users found:", users);

    const { count } = await supabase
        .from('businesses')
        .select('*', { count: 'exact', head: true });
    
    console.log("Total businesses in DB:", count);
}

checkUser();
