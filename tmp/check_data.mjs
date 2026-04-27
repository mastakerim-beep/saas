import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
dotenv.config()

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)

async function check() {
  const { data: payments } = await supabase.from('payments').select('id, created_at').gt('created_at', new Date(Date.now() - 3600000).toISOString())
  const { data: services } = await supabase.from('services').select('id, created_at').gt('created_at', new Date(Date.now() - 3600000).toISOString())
  console.log('Recent Payments:', payments?.length || 0)
  console.log('Recent Services:', services?.length || 0)
}
check()
