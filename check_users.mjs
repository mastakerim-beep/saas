import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
async function run() {
  const { data: b } = await s.from('businesses').select('*').eq('slug', 'grandgalata').single();
  if(!b) return console.log('BIZ_NOT_FOUND');
  console.log('BIZ:', b.name, b.id);
  const { data: u } = await s.from('app_users').select('*').eq('business_id', b.id);
  console.log('USERS:', u?.length || 0);
  u?.forEach(x => console.log(` - ${x.name} (ID: ${x.id}, BID: ${x.business_id}, Role: ${x.role})`));
  const { data: st } = await s.from('staff').select('*').eq('business_id', b.id);
  console.log('STAFF:', st?.length || 0);
  st?.forEach(x => console.log(` - ${x.name} (BID: ${x.business_id})`));
}
run();
