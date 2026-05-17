import { createServiceClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

export async function POST(req: Request) {
    try {
        const payload = await req.json();
        const { from, body, businessId } = payload; // Assuming standard webhook payload

        if (!from || !body || !businessId) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const supabase = createServiceClient();
        
        // 1. Fetch Business Context (Services, Staff, Availability)
        const { data: business } = await supabase.from('businesses').select('*').eq('id', businessId).single();
        const { data: services } = await supabase.from('services').select('*').eq('business_id', businessId);
        const { data: staff } = await supabase.from('staff').select('*').eq('business_id', businessId).eq('status', 'active');

        // 2. Initialize Gemini for B2C Concierge
        const { data: config } = await supabase.from('system_config').select('value').eq('key', 'GEMINI_API_KEY').single();
        const genAI = new GoogleGenerativeAI(config?.value || process.env.GEMINI_API_KEY || "");
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const systemPrompt = `
            Sen ${business.name} işletmesinin WhatsApp AI Concierge botusun. 
            Görevin müşterilere yardımcı olmak, sorularını yanıtlamak ve randevu almalarını sağlamaktır.
            
            HİZMETLERİMİZ: ${JSON.stringify(services)}
            EKİBİMİZ: ${JSON.stringify(staff)}
            
            KURALLAR:
            1. Nazik, lüks bir dil kullan (Spa/Wellness segmenti).
            2. Müşteri randevu almak isterse, uygun hizmeti ve personeli sor.
            3. Randevu onaylandığında (simüle), müşteriye onay mesajı ver.
            4. Yanıtın kısa ve WhatsApp'a uygun olsun.
            
            MÜŞTERİ MESAJI: "${body}"
        `;

        const result = await model.generateContent(systemPrompt);
        const aiResponse = result.response.text();

        // 3. Queue the response back to WhatsApp
        await supabase.from('whatsapp_queue').insert({
            business_id: businessId,
            recipient_phone: from,
            message_body: aiResponse,
            status: 'pending'
        });

        return NextResponse.json({ success: true, response: aiResponse });
    } catch (err: any) {
        console.error("[WhatsApp-AI] Error:", err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
