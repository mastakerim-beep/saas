import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // Use service role to bypass RLS for checking
);

async function check() {
  const { data: businesses, error: bErr } = await supabase.from('businesses').select('*').order('created_at', { ascending: false }).limit(5);
  console.log('Recent Businesses:', businesses?.map(b => ({ name: b.name, id: b.id, slug: b.slug })));

  const { data: branches, error: brErr } = await supabase.from('branches').select('*');
  console.log('Total Branches:', branches?.length);
  
  if (businesses && businesses.length > 0) {
      const zen = businesses.find(b => b.slug === 'zen-spa');
      if (zen) {
          const zenBranches = branches?.filter(br => br.business_id === zen.id);
          console.log('Zen Spa Branches:', zenBranches);
      }
  }
}

check();
