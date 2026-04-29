import { NextResponse } from "next/server";

export async function POST(req: Request) {
    try {
        const { prompt, dataContext, agentName } = await req.json();
        
        // SDK yerine ham fetch ile doğrudan bağlantı deniyoruz
        const apiKey = "AIzaSyAYSBzKffur6mfAV_0DKebWB5LOTZlZUBc";
        const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

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
            throw new Error(`Google API Hatası (${response.status}): ${JSON.stringify(rawData.error)}`);
        }

        const text = rawData.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!text) {
            throw new Error("AI yanıt içeriği boş geldi.");
        }

        return NextResponse.json({ analysis: text });
    } catch (error: any) {
        console.error("[AI-AGENT] RAW FATAL ERROR:", error);
        return NextResponse.json({ 
            error: error.message,
            analysis: `Kritik Bağlantı Hatası: ${error.message}` 
        }, { status: 500 });
    }
}
