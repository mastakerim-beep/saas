import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing keys");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAgents() {
    // 1. Get businesses
    const { data: businesses } = await supabase.from('businesses').select('*');
    console.log("Businesses:", businesses?.length);

    if (businesses && businesses.length > 0) {
        const bizId = businesses[0].id;
        console.log("Target Business ID:", bizId);

        // 2. Get agents
        const { data: agents } = await supabase.from('imperial_agents').select('*').eq('business_id', bizId);
        console.log("Current Agents:", agents);

        // 3. Activate all if needed
        const { error } = await supabase
            .from('imperial_agents')
            .update({ approval_mode: 'auto' })
            .eq('business_id', bizId);
        
        if (error) console.error("Error activating:", error);
        else console.log("All agents activated (auto mode).");
        
        // 4. Ensure AI tokens
        const { error: tokenError } = await supabase.rpc('add_ai_tokens', {
            p_business_id: bizId,
            p_amount: 1000,
            p_reason: 'Antigravity Booster'
        });
        if (tokenError) console.error("Token error:", tokenError);
        else console.log("Added 1000 AI tokens.");
    }
}

checkAgents();
