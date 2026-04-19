import { createClient } from '@supabase/supabase-js';

process.loadEnvFile('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testFetch() {
    console.log("Logging in...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'kerim@mail.com',
        password: 'password123'
    });
    
    if (authError) {
        console.error("Login failed:", authError.message);
        return;
    }
    console.log("Logged in! User:", authData.user.id);

    console.log("Testing RLS on businesses table...");
    const start = Date.now();
    const { data, error } = await supabase.from('businesses').select('*');
    if (error) {
        console.error("RLS Error:", error.message);
    } else {
        console.log("Data fetched:", data.length, "rows");
    }
    console.log(`Took ${Date.now() - start}ms`);
}
testFetch();
