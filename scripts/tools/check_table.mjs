import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkTable() {
    const { data, error } = await supabase
        .from('system_config')
        .select('*')
        .limit(1);

    if (error) {
        console.error("Table check error:", error.message);
    } else {
        console.log("Table exists. Data count:", data.length);
    }
}

checkTable();
