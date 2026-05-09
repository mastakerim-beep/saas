import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.7.1'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Parse the Technogym MyWellness Webhook payload
    // Expected to receive physical telemetry and member identification
    const payload = await req.json()
    
    console.log("AURA AI: Received Physical Telemetry from Technogym", payload);

    const {
      business_id, // Usually mapped via API key or webhook URL param
      member_id,   // Technogym's member ID, needs to be mapped to our customer_id
      hardware_type, // e.g., 'Treadmill', 'Kinesis'
      duration_minutes,
      heart_rate_avg,
      muscle_fatigue_index, // Proprietary metric calculated by Technogym
      mobility_score
    } = payload;

    if (!business_id || !member_id) {
        return new Response(
            JSON.stringify({ error: 'Missing critical identification (business_id or member_id)' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }

    // 1. Map Technogym Member ID to Aura Customer ID
    const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('id')
        .eq('business_id', business_id)
        .eq('external_member_id', member_id)
        .single();

    if (customerError || !customer) {
        console.error("Customer mapping failed", customerError);
        return new Response(
            JSON.stringify({ error: 'Customer not found in Aura DB' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        )
    }

    const auraCustomerId = customer.id;

    // 2. Insert into customer_biometrics (This will automatically trigger our PostgreSQL AI Trigger Engine)
    const { data: insertedBio, error: insertError } = await supabase
        .from('customer_biometrics')
        .insert([{
            business_id: business_id,
            customer_id: auraCustomerId,
            source: 'Technogym_Mywellness_API',
            muscle_fatigue_level: muscle_fatigue_index > 80 ? 'High' : (muscle_fatigue_index > 50 ? 'Medium' : 'Low'),
            mobility_score: mobility_score || 0,
            strength_score: payload.strength_score || 0,
            raw_telemetry: payload // Store full payload for future AI model training
        }])
        .select()
        .single();

    if (insertError) {
        throw insertError;
    }

    return new Response(
      JSON.stringify({ 
        message: 'Telemetry processed successfully. AURA AI triggers activated.',
        biometric_record_id: insertedBio.id
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error("AURA AI Webhook Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    )
  }
})
