import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '../../.env.production.local') });

const s = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: b } = await s.from('businesses').select('id').eq('name', 'GRAND GALATA').single();
  if (!b) return console.log('Business not found');

  const today = new Date().toISOString().split('T')[0];
  const { count, error } = await s
    .from('appointments')
    .select('*', { count: 'exact', head: true })
    .eq('business_id', b.id)
    .eq('date', today);

  console.log(`Today's appointments for Grand Galata (${today}): ${count}`);
}
run();
