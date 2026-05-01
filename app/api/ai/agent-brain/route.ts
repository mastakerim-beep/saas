import { createServiceClient } from "@/lib/supabase";
import { NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

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

        if (!apiKey || apiKey.length < 10) {
            return NextResponse.json({ 
                error: 'AI Bağlantı Hatası: Geçerli bir API Anahtarı bulunamadı. Lütfen Sistem Ayarları üzerinden GEMINI_API_KEY ekleyin.' 
            }, { status: 500 });
        }
        
        const systemPrompt = `
            Sen bir İmparatorluk Ajanısın (${agentName}). 
            Görevin, sana verilen işletme verilerini analiz etmek ve kısa bir rapor yazmaktır.
            İŞLETME VERİLERİ: ${JSON.stringify(dataContext)}
            KULLANICI TALİMATI: ${prompt}
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Try multiple models in order of preference
        const modelsToTry = ['gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-pro', 'gemini-1.0-pro'];
        let lastError = null;
        let analysisText = "";

        for (const modelName of modelsToTry) {
            try {
                console.log(`[AI-AGENT] Attempting analysis with ${modelName}...`);
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(systemPrompt);
                const response = await result.response;
                analysisText = response.text();
                
                if (analysisText) {
                    console.log(`[AI-AGENT] Success with ${modelName}`);
                    break;
                }
            } catch (err: any) {
                lastError = err.message;
                console.warn(`[AI-AGENT] Model ${modelName} failed:`, lastError);
            }
        }

        if (!analysisText) {
            // DIAGNOSTIC: List available models for this key
            let availableModels = [];
            try {
                const modelList = await genAI.listModels();
                availableModels = modelList.models?.map(m => m.name.replace('models/', '')) || [];
            } catch (listErr) {
                console.error("Failed to list models:", listErr);
            }

            throw new Error(`Google API Modelleri bulunamadı. Kullanılabilir modeller: [${availableModels.join(', ')}]. Son hata: ${lastError}`);
        }

        return NextResponse.json({ analysis: analysisText });
    } catch (error: any) {
        console.error("[AI-AGENT] CRITICAL ERROR:", error.message);
        return NextResponse.json({ 
            error: error.message,
            analysis: `Kritik Bağlantı Hatası: ${error.message}` 
        }, { status: 500 });
    }
}
