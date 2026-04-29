import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY || "");

export async function POST(req: Request) {
    try {
        const { prompt, dataContext, agentName } = await req.json();
        
        // Debug: Anahtarın okunup okunmadığını kontrol et
        const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
        console.log(`[AI-DEBUG] API Key present: ${!!apiKey}`);

        if (!apiKey) {
            return NextResponse.json({ 
                analysis: "HATA: Gemini API anahtarı (.env.local) sistem tarafından okunamadı. Sunucunun yeniden başlatılması gerekebilir." 
            });
        }

        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const systemPrompt = `
            Sen bir İmparatorluk Ajanısın (${agentName}). 
            Görevin, sana verilen işletme verilerini analiz etmek ve kullanıcının talimatına göre kısa, öz ve aksiyon odaklı bir rapor yazmaktır.
            Dil: Türkçe.
            Ton: Profesyonel, otoriter ve sadık.
            
            İŞLETME VERİLERİ:
            ${JSON.stringify(dataContext, null, 2)}
            
            KULLANICI TALİMATI:
            ${prompt}
            
            Yanıtını doğrudan analiz sonucu olarak yaz, başka açıklama ekleme.
        `;

        const result = await model.generateContent(systemPrompt);
        const response = await result.response;
        const text = response.text();

        if (!text) {
            console.warn("[AI-AGENT] Warning: Gemini returned an empty response.");
            throw new Error("AI returned an empty response");
        }

        console.log("[AI-AGENT] Analysis completed successfully.");
        return NextResponse.json({ analysis: text });
    } catch (error: any) {
        console.error("[AI-AGENT] FATAL ERROR:", error);
        return NextResponse.json({ 
            error: error.message,
            analysis: `Üzgünüm, analiz sırasında bir hata oluştu: ${error.message}` 
        }, { status: 500 });
    }
}
