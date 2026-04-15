import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, name, staffId, permissions } = await req.json();

    if (!email || !password || !staffId) {
      return NextResponse.json({ error: 'Eksik bilgi: Email, şifre ve personel ID gerekli.' }, { status: 400 });
    }

    // 1. Yetki Kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
    });
    
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) return NextResponse.json({ error: 'Oturum açılmamış.' }, { status: 401 });

    const { data: { user: requesterAuth }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !requesterAuth) return NextResponse.json({ error: 'Oturum bilgisi doğrulanamadı.' }, { status: 401 });

    const serviceClient = createServiceClient();
    
    // İstek yapanın rolünü ve işletme ID'sini DB'den doğrula
    const { data: requesterAppUser, error: roleError } = await serviceClient
        .from('app_users')
        .select('role, business_id')
        .eq('id', requesterAuth.id)
        .single();

    if (roleError || !['SaaS_Owner', 'Business_Owner'].includes(requesterAppUser?.role)) {
        return NextResponse.json({ error: 'Bu işlem için yetkiniz yok. Sadece İşletme Sahibi yapabilir.' }, { status: 403 });
    }

    const businessId = requesterAppUser.business_id;

    // 2. Limit Kontrolü (max_users)
    const { data: business } = await serviceClient.from('businesses').select('max_users').eq('id', businessId).single();
    const { count: activeUsers } = await serviceClient.from('app_users').select('*', { count: 'exact', head: true }).eq('business_id', businessId);

    if (activeUsers !== null && activeUsers >= (business?.max_users || 5)) {
        return NextResponse.json({ 
            error: `Kullanıcı limiti aşıldı (Kullanılan: ${activeUsers}, Limit: ${business?.max_users}). Lütfen koltuk satın alın.` 
        }, { status: 403 });
    }

    // 3. Personel Doğrulama (Kendi işletmesine mi ait?)
    const { data: staff } = await serviceClient.from('staff').select('business_id').eq('id', staffId).single();
    if (!staff || staff.business_id !== businessId) {
        return NextResponse.json({ error: 'Personel bilgisi bulunamadı veya yetkisiz erişim.' }, { status: 403 });
    }

    // 4. Auth Kullanıcısını Oluştur
    const { data: authUser, error: createUserError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'Staff',
        business_id: businessId,
        name: name
      }
    });

    if (createUserError) {
        return NextResponse.json({ error: `Auth Hatası: ${createUserError.message}` }, { status: 500 });
    }

    const newAuthId = authUser.user.id;

    // 5. app_users Tablosuna Kaydet
    const { error: dbError } = await serviceClient.from('app_users').insert({
      id: newAuthId,
      business_id: businessId,
      role: 'Staff',
      name: name || 'Personel',
      email: email,
      staff_id: staffId, // Robust linking
      permissions: permissions || ['view_calendar']
    });

    if (dbError) {
        return NextResponse.json({ error: `Veritabanı Kayıt Hatası: ${dbError.message}` }, { status: 500 });
    }

    // 6. staff Tablosunu Güncelle (can_login_system = true)
    await serviceClient.from('staff').update({ 
        can_login_system: true,
        last_login_at: new Date().toISOString() // Marker
    }).eq('id', staffId);

    return NextResponse.json({ 
        success: true, 
        message: 'Personel giriş yetkisi başarıyla tanımlandı.',
        userId: newAuthId
    });

  } catch (error: any) {
    console.error('Staff Provisioning Error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
