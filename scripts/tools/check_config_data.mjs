import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.production.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkConfig() {
    const { data, error } = await supabase
        .from('system_config')
        .select('*');

    if (error) {
        console.error("Config check error:", error.message);
    } else {
        console.log("System Config Rows:", JSON.stringify(data, null, 2));
    }
}

checkConfig();
