import { createClient } from '@supabase/supabase-js';

process.loadEnvFile('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function testInsert() {
    console.log("Logging in...");
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'kerim@mail.com',
        password: 'password123'
    });
    
    if (authError) {
        console.error("Login failed:", authError.message);
        return;
    }
    
    const businessId = authData.user.user_metadata.business_id;
    console.log("Business ID:", businessId);

    const testId = crypto.randomUUID();
    console.log("Testing insert on customers table... ID:", testId);
    
    const { data, error } = await supabase.from('customers').insert({
        id: testId,
        business_id: businessId,
        name: 'Test Musteri',
        phone: '123456',
        segment: 'Normal'
    });

    if (error) {
        console.error("Insert Error:", error);
    } else {
        console.log("Insert Success!");
    }
}
testInsert();
