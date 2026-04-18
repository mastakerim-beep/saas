import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runMigration() {
  console.log('🚀 Running database alignment migration...');

  // Adding columns to appointments table
  // communication_source: TEXT
  // selected_regions: TEXT[] (using TEXT for flexibility if needed, but array is standard for regions)
  
  const sql = `
    DO $$ 
    BEGIN 
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='communication_source') THEN
            ALTER TABLE public.appointments ADD COLUMN communication_source TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='selected_regions') THEN
            ALTER TABLE public.appointments ADD COLUMN selected_regions TEXT[] DEFAULT '{}';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='appointments' AND COLUMN_NAME='body_map_data') THEN
            ALTER TABLE public.appointments ADD COLUMN body_map_data JSONB;
        END IF;
    END $$;
  `;

  try {
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      if (error.message.includes('function "exec_sql" does not exist')) {
        console.warn('⚠️ RPC "exec_sql" not found. Falling back to direct query (if possible) or informative error.');
        console.log('Please run the following SQL in your Supabase SQL Editor:');
        console.log(sql);
      } else {
        throw error;
      }
    } else {
      console.log('✅ Migration successful!');
    }
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
  }
}

runMigration();
