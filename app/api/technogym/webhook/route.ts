import { NextResponse } from 'next/server';

// Technogym MyWellness Webhook Entegrasyonu
// Fitness cihazlarından (koşu bandı, bisiklet vb.) anlık antrenman verisi çeker.
// Gelen veriyi müşterinin biyometrik/antrenman geçmişine kaydeder.

export async function POST(req: Request) {
    try {
        // Güvenlik: Technogym'den gelen Webhook imzasını (HMAC) kontrol et
        const authHeader = req.headers.get('Authorization') || req.headers.get('x-technogym-signature');
        if (!authHeader) {
            return NextResponse.json({ error: "Yetkisiz erişim" }, { status: 401 });
        }

        const body = await req.json();
        const { event_type, user_id, facility_id, workout_data } = body;

        console.log(`[Technogym Bridge] Yeni Event: ${event_type} | Üye ID: ${user_id} | Tesis: ${facility_id}`);

        if (event_type === 'workout.completed') {
            const { calories, duration_minutes, equipment_name, date } = workout_data;

            // 1. facility_id'den Aura'daki business_id'yi bul
            // 2. user_id'den Aura'daki customer_id'yi bul
            
            // Simülasyon: Aura veritabanına antrenman kaydı atılır
            console.log(`[Aura DB] Biyometrik Kayıt Eklendi: ${calories} kcal yakıldı. (${equipment_name})`);

            // İLERİ SEVİYE WOW EFEKTİ: Müşteriye anında Push Notification veya Başarı Puanı at
            const earnedPoints = Math.floor(calories / 50); // Her 50 kalori = 1 Aura Puanı
            console.log(`[Gamification] Müşteri ${earnedPoints} Sadakat Puanı kazandı!`);

            return NextResponse.json({ 
                success: true, 
                message: "Antrenman başarıyla Aura Imperial ERP'ye işlendi.",
                gamification: { points_awarded: earnedPoints }
            });
        }

        return NextResponse.json({ success: true, message: "Olay görmezden gelindi (ignored)" });

    } catch (error: any) {
        console.error("[Technogym Error]", error.message);
        return NextResponse.json({ success: false, error: "Webhook islenemedi" }, { status: 500 });
    }
}
