import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email, password, name, businessId, isStaff } = await req.json();

    if (!email || !password || !businessId) {
      return NextResponse.json({ error: 'Eksik bilgi: Email, şifre ve işletme ID gerekli.' }, { status: 400 });
    }

    // 1. Yetki Kontrolü (Sadece SaaS_Owner yapabilir)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    const cookieStore = cookies();
    
    // Geçici istemci ile mevcut kullanıcıyı doğrula
    // Not: Middleware zaten JWT kontrolü yapıyor olmalı ama burada role spesifik bakıyoruz
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
    });
    
    // Request header'dan token al
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return NextResponse.json({ error: 'Oturum açılmamış.' }, { status: 401 });
    }

    const { data: { user: requesterAuth }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !requesterAuth) {
        return NextResponse.json({ error: 'Oturum bilgisi doğrulanamadı.' }, { status: 401 });
    }

    // verify role from DB
    const serviceClient = createServiceClient();
    const { data: requesterAppUser, error: roleError } = await serviceClient
        .from('app_users')
        .select('role')
        .eq('id', requesterAuth.id)
        .single();

    if (roleError || requesterAppUser?.role !== 'SaaS_Owner') {
        return NextResponse.json({ error: 'Bu işlem için yetkiniz yok. Sadece SaaS Owner yapabilir.' }, { status: 403 });
    }

    // 2. Service Client ile İşleme Başla (Already declared above)

    // 3. Auth Kullanıcısını Hazırla (Ekle veya Güncelle)
    let authUserId: string;
    const { data: authUser, error: createUserError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: 'Business_Owner',
        business_id: businessId,
        name: name
      }
    });

    if (createUserError) {
      if (createUserError.message.includes('already been registered')) {
        // Kullanıcı zaten var, ID'sini bulalım
        const { data: { users }, error: listError } = await serviceClient.auth.admin.listUsers();
        const existingUser = users.find(u => u.email === email);
        
        if (listError || !existingUser) {
           return NextResponse.json({ error: `Kullanıcı zaten var ama bilgilerine erişilemedi.` }, { status: 500 });
        }
        
        authUserId = existingUser.id;
        
        // Mevcut kullanıcının metadata'sını güncelle
        await serviceClient.auth.admin.updateUserById(authUserId, {
            user_metadata: {
                role: 'Business_Owner',
                business_id: businessId,
                name: name
            }
        });
      } else {
        return NextResponse.json({ error: `Auth Hatası: ${createUserError.message}` }, { status: 500 });
      }
    } else {
      authUserId = authUser.user.id;
    }

    // 4. app_users Tablosuna Kaydet (Upsert kullanıyoruz)
    let { data: branch } = await serviceClient
        .from('branches')
        .select('id')
        .eq('business_id', businessId)
        .limit(1)
        .single();
    
    // 3.5. Eğer Personel ise staff Kaydı Oluştur
    let staffId: string | null = null;
    if (isStaff) {
        staffId = crypto.randomUUID();
        await serviceClient.from('staff').insert({
            id: staffId,
            business_id: businessId,
            branch_id: branch?.id || null,
            name: name || 'İşletme Sahibi',
            role: 'Yönetici',
            status: 'Aktif',
            can_login_system: true,
            is_visible_on_calendar: true
        });
    }

    const { error: dbError } = await serviceClient.from('app_users').upsert({
      id: authUserId,
      business_id: businessId,
      branch_id: branch?.id || null,
      staff_id: staffId,
      role: 'Business_Owner',
      name: name || 'İşletme Sahibi',
      email: email,
      permissions: ['*']
    }, { onConflict: 'id' });

    if (dbError) {
      console.error('DB Upsert Error:', dbError);
      return NextResponse.json({ error: `Veritabanı Kayıt Hatası: ${dbError.message}` }, { status: 500 });
    }

    return NextResponse.json({ 
        success: true, 
        message: 'Kullanıcı başarıyla hazırlandı ve işletmeye bağlandı.',
        userId: authUserId
    });

  } catch (error: any) {
    console.error('Provisioning Error:', error);
    return NextResponse.json({ error: 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
