// @ts-nocheck
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

serve(async (req: Request) => {
  try {
    const { business_id, report_date } = await req.json()

    // 1. Günün verilerini topla
    const { data: report, error: reportError } = await supabase
      .from('z_reports')
      .select('*')
      .eq('business_id', business_id)
      .eq('report_date', report_date)
      .single()

    if (reportError) throw reportError

    // 2. AI Strateji Analizi (Gemini/OpenAI simülasyonu)
    const aiAnalysis = `
      Günün Özeti: ${report.total_revenue} TL ciro ile hedefin %12 üzerindeyiz. 
      Insight: Technogym verileri akşam saatlerinde yüksek yorgunluk sinyali veriyor. 
      Aksiyon: Yarın sabah 09:00 - 12:00 arası 'Detox Juice' promosyonu ile B2C tarafında hareketlilik sağla.
    `.trim();

    // 3. Raporu AI özeti ile güncelle
    await supabase
      .from('z_reports')
      .update({ ai_summary: aiAnalysis })
      .eq('id', report.id)

    // 4. İşletme Sahibine Bildirim Gönder
    console.log(`[Z-Report AI] Biz: ${business_id} için analiz tamamlandı.`)

    return new Response(JSON.stringify({ success: true, analysis: aiAnalysis }), {
      headers: { "Content-Type": "application/json" },
    })

  } catch (error: any) {
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), { status: 500 })
  }
})
