import { createServiceClient } from "@/lib/supabase";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { prompt, dataContext, agentName } = await req.json();
        
        // 1. Dinamik API Anahtarı Kontrolü (Veritabanından)
        const supabase = createServiceClient();
        const { data: configData } = await supabase
            .from('system_config' as any)
            .select('value')
            .eq('key', 'GEMINI_API_KEY')
            .single();

        let apiKey = (configData?.value || process.env.GEMINI_API_KEY)?.trim();

        if (!apiKey) {
            return NextResponse.json({ 
                error: 'AI Bağlantı Hatası: API Anahtarı bulunamadı. Lütfen Sistem Ayarları üzerinden GEMINI_API_KEY ekleyin.' 
            }, { status: 500 });
        }
        
        // Using the most stable model identifier and production endpoint
        const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`;

        const systemPrompt = `
            Sen bir İmparatorluk Ajanısın (${agentName}). 
            Görevin, sana verilen işletme verilerini analiz etmek ve kısa bir rapor yazmaktır.
            İŞLETME VERİLERİ: ${JSON.stringify(dataContext)}
            KULLANICI TALİMATI: ${prompt}
        `;

        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{ parts: [{ text: systemPrompt }] }]
            })
        });

        const rawData = await response.json();
        
        if (!response.ok) {
            // Log the error for internal debugging but return a clean message
            console.error("Gemini API Error details:", rawData.error);
            throw new Error(`Google API Hatası: ${rawData.error?.message || 'Bağlantı reddedildi.'}`);
        }

        const text = rawData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("AI yanıt içeriği boş geldi.");
        }

        return NextResponse.json({ analysis: text });
    } catch (error: any) {
        console.error("[AI-AGENT] ERROR:", error.message);
        return NextResponse.json({ 
            error: error.message,
            analysis: `Kritik Bağlantı Hatası: ${error.message}` 
        }, { status: 500 });
    }
}
