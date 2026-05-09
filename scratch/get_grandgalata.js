const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkBusiness() {
  const { data, error } = await supabase
    .from('businesses')
    .select('id, slug, name')
    .ilike('name', '%grand%galata%')
    .single();

  if (error) {
    console.error('Hata:', error.message);
    process.exit(1);
  }

  console.log(JSON.stringify(data));
}

checkBusiness();
