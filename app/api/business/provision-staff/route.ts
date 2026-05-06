import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, name, role, branchId } = await req.json();

    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Eksik bilgi: Email, şifre ve isim gerekli.' }, { status: 400 });
    }

    // 1. Yetki Kontrolü
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
    });
    
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return NextResponse.json({ error: 'Oturum açılmamış.' }, { status: 401 });
    }

    const { data: { user: requesterAuth }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !requesterAuth) {
        return NextResponse.json({ error: 'Oturum bilgisi doğrulanamadı.' }, { status: 401 });
    }

    // Requester'ın Business_Owner veya Manager olduğunu ve businessId'sini doğrula
    const serviceClient = createServiceClient();
    const { data: requesterAppUser, error: roleError } = await serviceClient
        .from('app_users')
        .select('role, business_id')
        .eq('id', requesterAuth.id)
        .single();

    if (roleError || !['Business_Owner', 'Manager', 'SaaS_Owner'].includes(requesterAppUser?.role)) {
        return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
    }

    const targetBusinessId = requesterAppUser.business_id;
    if (!targetBusinessId) {
        return NextResponse.json({ error: 'İşletme bilgisi bulunamadı.' }, { status: 400 });
    }

    // 2. Auth Kullanıcısını Oluştur
    const targetRole = role || 'Staff';
    const { data: authUser, error: createUserError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: targetRole,
        business_id: targetBusinessId,
        name: name
      }
    });

    if (createUserError) {
        return NextResponse.json({ error: `Auth Hatası: ${createUserError.message}` }, { status: 500 });
    }

    const authUserId = authUser.user.id;

    // 3. app_users Tablosuna Kaydet
    const { error: dbError } = await serviceClient.from('app_users').upsert({
      id: authUserId,
      business_id: targetBusinessId,
      branch_id: branchId || null,
      role: targetRole,
      name: name,
      email: email,
      permissions: targetRole === 'Manager' ? ['all'] : ['view_calendar', 'manage_appointments'] // Default perms
    });

    if (dbError) {
      return NextResponse.json({ error: `Veritabanı Kayıt Hatası: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Personel başarıyla oluşturuldu ve yetkilendirildi.',
        userId: authUserId
    });

  } catch (error: any) {
    console.error('Provisioning Error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
