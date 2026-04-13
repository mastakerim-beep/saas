import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function cleanup() {
  const { data: businesses, error } = await supabase.from('businesses').select('*').ilike('name', '%Grand Galata%');
  
  if (businesses) {
    for (const biz of businesses) {
      if (!biz.slug) {
        console.log(`Deleting duplicate business without slug: ${biz.id}`);
        await supabase.from('businesses').delete().eq('id', biz.id);
      }
    }
  }
}

cleanup();
