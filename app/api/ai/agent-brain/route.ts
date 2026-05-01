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

        const dbKey = configData?.value?.trim();
        const envKey = process.env.GEMINI_API_KEY?.trim();
        
        let apiKey = dbKey || envKey;

        console.log(`[AI-TRACE] Key Source: ${dbKey ? 'DATABASE' : 'ENV'}`);
        console.log(`[AI-TRACE] Key Prefix: ${apiKey?.substring(0, 10)}...`);

        if (!apiKey || apiKey.length < 10) {
            return NextResponse.json({ 
                error: 'AI Bağlantı Hatası: Geçerli bir API Anahtarı bulunamadı. Lütfen Sistem Ayarları üzerinden GEMINI_API_KEY ekleyin.' 
            }, { status: 500 });
        }
        
        const systemPrompt = `
            SENİN ROLÜN: Sen ${dataContext.business.name} işletmesinin stratejik beynisin. 
            GÖREVİN: Kendi işletmenin verilerini analiz etmek, karlılığı artırmak ve operasyonel mükemmeliyeti sağlamaktır.
            BİLGİ SEVİYEN: İşletmenin tüm hizmetlerine, personeline, finansal durumuna (gelir/borç) ve randevu geçmişine tam hakimsin.
            ÜSLUBUN: O işletmenin bir parçası gibi konuş. "İşletmeniz" yerine "İşletmemiz" veya "${dataContext.business.name}" diyerek aidiyet kur. Kesin, stratejik ve profesyonel ol.
            
            İŞLETME VERİLERİ (TAM KAPSAM): ${JSON.stringify(dataContext)}
            KULLANICI ÖZEL TALİMATI: ${prompt}
            
            Lütfen analizi şu başlıklarla sun:
            1. ${dataContext.business.name.toUpperCase()} DURUM ÖZETİ
            2. KRİTİK FİNANSAL VE OPERASYONEL TESPİTLER
            3. GELİR ARTIRICI STRATEJİK ÖNERİLER
        `;

        const genAI = new GoogleGenerativeAI(apiKey);
        
        // Updated model list for May 2026 standards
        const modelsToTry = [
            'gemini-2.5-flash', 
            'gemini-2.5-pro', 
            'gemini-2.0-flash', 
            'gemini-1.5-flash', 
            'gemini-pro'
        ];
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
