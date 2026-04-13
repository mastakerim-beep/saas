import { createClient } from '@supabase/supabase-js';

// Load .env variables natively in Node v24
process.loadEnvFile('.env.local');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

const tables = [
    'businesses', 'branches', 'appointments', 'customers', 
    'membership_plans', 'customer_memberships', 'payments', 
    'debts', 'staff', 'inventory', 'rooms', 'expenses', 
    'services', 'app_users', 'audit_logs', 'customer_media', 
    'packages', 'commission_rules', 'calendar_blocks', 'notification_logs'
];

async function testFetch() {
    console.log("Fetching all 20 tables...");
    for (const table of tables) {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
            console.error(`Error fetching from ${table}:`, error.message);
        } else {
            console.log(`Success: ${table}`);
        }
    }
}
testFetch();
