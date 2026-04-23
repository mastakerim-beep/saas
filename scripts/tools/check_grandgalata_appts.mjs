import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env.local') });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  let b;
  const { data: bData } = await s.from('businesses').select('*').eq('name', 'Grand Galata Spa').single();
  b = bData;
  if(!b) {
      // Try slug if name fails
      const { data: b2 } = await s.from('businesses').select('*').eq('slug', 'grandgalata').single();
      if (!b2) return console.log('BIZ_NOT_FOUND');
      b = b2;
  }
  
  console.log('--- Grand Galata Recent Appointments ---');
  const { data: appts } = await s.from('appointments').select('*').eq('business_id', b.id).order('created_at', { ascending: false }).limit(20);
  
  const today = new Date().toISOString().split('T')[0];
  if (appts && appts.length > 0) {
    appts.forEach(a => {
        const isToday = a.created_at.startsWith(today);
        console.log(`[${isToday ? 'TODAY' : 'PAST'}] Appointment ID: ${a.id}`);
        console.log(` - Business ID: ${a.business_id}`);
        console.log(` - Customer: ${a.customer_name}`);
        console.log(` - Created At: ${a.created_at}`);
        console.log(` - Status: ${a.status}`);
        console.log(` - Service: ${a.service}`);
    });
  } else {
    console.log('No appointments found.');
  }

  console.log('\n--- Recent Audit Logs (Grand Galata) ---');
  const { data: logs } = await s.from('audit_logs').select('*').eq('business_id', b.id).order('created_at', { ascending: false }).limit(5);
  
  if (logs && logs.length > 0) {
    logs.forEach(l => {
        console.log(`Log Action: ${l.action} | Time: ${l.created_at}`);
        console.log(` - User ID: ${l.user_id}`);
        console.log(` - Biz ID: ${l.business_id}`);
        console.log(` - Details: ${JSON.stringify(l.details)}`);
        console.log('-------------------');
    });
  } else {
    console.log('No logs found.');
  }
}
run();
