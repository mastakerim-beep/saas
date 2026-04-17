import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env from root
dotenv.config({ path: path.join(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is missing in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const PRESERVED_EMAIL = 'kerim@mail.com';

async function performReset() {
  console.log('🚀 Aura Spa ERP - COMPREHENSIVE NUCLEAR FACTORY RESET Initiated...');
  console.log(`Preserved Admin: ${PRESERVED_EMAIL}\n`);

  try {
    // 1. CLEAR AUTH USERS (CRITICAL)
    console.log('1. Fetching all users from Supabase Auth...');
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) throw listError;
    
    const usersToDelete = users.filter(u => u.email !== PRESERVED_EMAIL);
    console.log(`   Found ${usersToDelete.length} users to delete from Auth.`);

    for (const user of usersToDelete) {
        console.log(`   Deleting Auth User: ${user.email} (${user.id})...`);
        const { error: delError } = await supabase.auth.admin.deleteUser(user.id);
        if (delError) {
            console.error(`   ❌ Failed to delete ${user.email}:`, delError.message);
        } else {
            console.log(`   ✅ Deleted ${user.email}`);
        }
    }

    // 2. Delete all businesses (Cascades to branches, services, staff, appointments, customers, payments etc.)
    console.log('\n2. Deleting all businesses from Database...');
    const { count: bizCount, error: bizError } = await supabase
      .from('businesses')
      .delete({ count: 'exact' })
      .not('id', 'is', null);
    
    if (bizError) throw bizError;
    console.log(`   ✅ Deleted ${bizCount || 0} businesses and their cascaded data.`);

    // 3. Clean up app_users
    console.log(`\n3. Cleaning up app_users table (Keeping ${PRESERVED_EMAIL})...`);
    const { count: userCount, error: userError } = await supabase
      .from('app_users')
      .delete({ count: 'exact' })
      .neq('email', PRESERVED_EMAIL);
    
    if (userError) throw userError;
    console.log(`   ✅ Deleted ${userCount || 0} residual app_users.`);

    // 4. Clear global logs and notifications
    console.log('\n4. Clearing global logs and notifications...');
    await supabase.from('audit_logs').delete().not('id', 'is', null);
    await supabase.from('notifications').delete().not('id', 'is', null);
    console.log('   ✅ Global system logs cleared.');

    console.log('\n✨ FULL COMPREHENSIVE RESET COMPLETE. AUTH + DB ARE NOW CLEAN.');
  } catch (err) {
    console.error('\n❌ RESET FAILED:', err.message);
    process.exit(1);
  }
}

performReset();
