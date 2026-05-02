import { NextResponse } from 'next/server';

// Aura PMS Bridge - Otel Entegrasyon Katmanı
// Gerçek dünyada bu katman otelin sistemine (Opera, Elektra, Protel) göre yönlendirme yapar.

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { action, roomNumber, guestName, amount, businessId } = body;

        // 1. ODA SORGULAMA (Verification)
        if (action === 'verify_room') {
            // Gerçek senaryoda: Otelin API'sine veya Aura Local Agent'ına istek atılır.
            console.log(`[Aura PMS Bridge] Oda Sorgulanıyor: ${roomNumber} (Otel ID: ${businessId})`);
            
            // DEMO/MOCK MANTIK: Sadece sonu '0' ile biten odaları dolu kabul et (Demo şovu için)
            if (roomNumber && roomNumber.endsWith('0')) {
                return NextResponse.json({
                    success: true,
                    roomInfo: {
                        roomNumber: roomNumber,
                        guestFullName: guestName || "Kerim Bey", // Eğer isim girilmediyse default
                        checkOutDate: "2026-05-10",
                        status: "OCCUPIED",
                        creditLimit: 5000
                    }
                });
            } else {
                return NextResponse.json({
                    success: false,
                    error: "Oda boş veya misafir kaydı bulunamadı."
                }, { status: 404 });
            }
        }

        // 2. HESABA YAZMA (Charge Posting)
        if (action === 'post_charge') {
            // Gerçek senaryoda: PMS'e (Örn: Opera FIAS protokolü) "Spa Harcaması" departman koduyla tutar gönderilir.
            console.log(`[Aura PMS Bridge] Folio'ya Yazılıyor: ${amount} TL -> Oda: ${roomNumber}`);
            
            // Başarılı Posting Simülasyonu
            return NextResponse.json({
                success: true,
                transactionId: `PMS-${Date.now()}`,
                message: "Tutar başarıyla otel hesabına yansıtıldı."
            });
        }

        return NextResponse.json({ error: "Bilinmeyen PMS aksiyonu" }, { status: 400 });

    } catch (error: any) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }
}
