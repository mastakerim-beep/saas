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
            
            ÖNEMLİ: Sen otopilot yeteneği olan bir sistem ajanısın. Sadece analiz yapmakla kalmaz, aynı zamanda sistem üzerinde aksiyon alabilirsin. 
            Eğer işletmenin yararına olacak doğrudan bir aksiyon (örneğin indirim tanımlamak, mühürleme uyarısı yapmak) görüyorsan, bunu \`suggested_actions\` dizisine ekle.
            Şu an desteklenen Action Type'lar şunlardır:
            - CREATE_MARKETING_RULE (Örn. payload: { "discount_percent": 15, "target": "NEW_CUSTOMER" })
            - UPDATE_PRICING (Örn. payload: { "service_id": "...", "new_price": 500 })
            
            YANITINI SADECE VE SADECE GEÇERLİ BİR JSON OLARAK VER. BAŞKA HİÇBİR METİN VEYA MARKDOWN KULLANMA.
            BEKLENEN JSON FORMATI:
            {
              "analysis": "1. DURUM ÖZETİ\\n2. TESPİTLER\\n3. ÖNERİLER şeklinde markdown formatında detaylı metin.",
              "suggested_actions": [
                {
                  "action_type": "CREATE_MARKETING_RULE",
                  "description": "Sadık müşteriler için %10 indirim kuralı oluştur",
                  "payload": { "discount_percent": 10, "target": "loyal_customers" }
                }
              ]
            }
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
                const model = genAI.getGenerativeModel({ 
                    model: modelName
                });
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
            throw new Error(`Google API Modelleri ile bağlantı kurulamadı. Son hata: ${lastError}`);
        }

        let parsedData: any = { analysis: analysisText, suggested_actions: [] };
        try {
            // Strip any markdown code block formatting if returned
            const cleanJsonStr = analysisText.replace(/```json/g, '').replace(/```/g, '').trim();
            parsedData = JSON.parse(cleanJsonStr);
        } catch (parseError) {
            console.error("AI Yanıtı JSON Parse Hatası:", parseError);
            // Fallback: If not valid JSON, treat it as pure markdown analysis
            parsedData = { analysis: analysisText, suggested_actions: [] };
        }

        return NextResponse.json(parsedData);
    } catch (error: any) {
        console.error("[AI-AGENT] CRITICAL ERROR:", error.message);
        return NextResponse.json({ 
            error: error.message,
            analysis: `Kritik Bağlantı Hatası: ${error.message}` 
        }, { status: 500 });
    }
}
