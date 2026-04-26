import { createServiceClient } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { 
        name, ownerName, slug, plan, expiryDate, 
        maxUsers, mrr, taxId, taxOffice, billingAddress, verticals 
    } = await req.json();

    if (!name || !slug) {
      return NextResponse.json({ error: 'Eksik bilgi: İsim ve URL (slug) gerekli.' }, { status: 400 });
    }

    // 1. Yetki Kontrolü (Sadece SaaS_Owner yapabilir)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
    
    // Geçici istemci ile mevcut kullanıcıyı doğrula
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
        auth: { persistSession: false }
    });
    
    const authHeader = req.headers.get('Authorization');
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token) {
        return NextResponse.json({ error: 'Oturum açılmamış.' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user || user.user_metadata?.role !== 'SaaS_Owner') {
        return NextResponse.json({ error: 'Bu işlem için yetkiniz yok.' }, { status: 403 });
    }

    // 2. Service Client ile İşleme Başla (Bypass RLS)
    const serviceClient = createServiceClient();

    // 3. Slug Çakışması Kontrolü (Fail-safe)
    let finalSlug = slug;
    const { data: existingBiz } = await serviceClient
        .from('businesses')
        .select('id')
        .eq('slug', finalSlug)
        .limit(1)
        .single();
    
    if (existingBiz) {
        finalSlug = `${slug}-${Math.floor(Math.random() * 999)}`;
    }

    // 4. İşletme Kaydı Oluştur
    const businessId = crypto.randomUUID();
    const { data: business, error: bizError } = await serviceClient
        .from('businesses')
        .insert({
            id: businessId,
            name,
            owner_name: ownerName,
            slug: finalSlug,
            plan: plan || 'Basic',
            expiry_date: expiryDate,
            max_users: maxUsers || 5,
            max_branches: maxUsers && maxUsers > 10 ? 3 : 1, // Örnek otomatik limit mantığı
            mrr: mrr || 0,
            status: 'Aktif',
            tax_id: taxId,
            tax_office: taxOffice,
            billing_address: billingAddress,
            payment_status: 'paid',
            last_payment_date: new Date().toISOString(),
            last_payment_amount: mrr || 0,
            subscription_history: [{
                date: new Date().toISOString(),
                event: 'Kurulum (SaaS Start)',
                amount: mrr || 0,
                plan: plan || 'Basic'
            }],
            verticals: verticals || ['spa']
        })
        .select()
        .single();

    if (bizError) throw bizError;

    // 5. Otomatik Şube Oluştur (Merkez Şube)
    const branchId = crypto.randomUUID();
    const { error: branchError } = await serviceClient
        .from('branches')
        .insert({
            id: branchId,
            business_id: businessId,
            name: 'Merkez Şube',
            location: 'Ana Merkez'
        });

    if (branchError) console.error('Auto-Branch Creation Failed:', branchError);

    // 6. Varsayılan Hizmet Oluştur (Genel Seans)
    const { error: serviceError } = await serviceClient
        .from('services')
        .insert({
            business_id: businessId,
            name: 'Genel Seans',
            duration: 60,
            price: 500,
            color: 'bg-indigo-500',
            vertical: verticals && verticals.length > 0 ? verticals[0] : 'spa'
        });

    if (serviceError) console.error('Auto-Service Creation Failed:', serviceError);

    return NextResponse.json({ 
        success: true, 
        business: business,
        message: 'İşletme, merkez şubesi ve varsayılan hizmeti ile beraber başarıyla kuruldu.'
    });

  } catch (error: any) {
    console.error('Create Business Error:', error);
    return NextResponse.json({ error: error.message || 'Sunucu hatası oluştu.' }, { status: 500 });
  }
}
