import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://jymktjxlveyvaqkjrmho.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp5bWt0anhsdmV5dmFxa2pybWhvIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU5OTE2NywiZXhwIjoyMDkxMTc1MTY3fQ.HPjjjwz1De5kbqxJq89VFkM2OYFGWYVf3C0P0vXB2Pk';

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

const bizId = 'b1000000-0000-0000-0000-000000000000';
const userId = '1f15adb8-f86d-45c3-bb40-7c4e896f5e81'; // kerim@mail.com

async function seed() {
    console.log('Seeding Aura Spa data...');

    // 1. Business
    const { error: bizErr } = await supabase.from('businesses').upsert({
        id: bizId,
        name: 'Aura Spa',
        slug: 'aura-spa',
        status: 'active',
        plan: 'Premium',
        max_branches: 5,
        max_users: 20
    });
    if (bizErr) console.error('Biz error:', bizErr);

    // 2. App User (Kerim)
    const { error: userErr } = await supabase.from('app_users').upsert({
        id: userId,
        business_id: bizId,
        name: 'Kerim (Owner)',
        email: 'kerim@mail.com',
        role: 'Business_Owner',
        permissions: ['*']
    });
    if (userErr) console.error('User error:', userErr);

    // 3. Branches
    const branchId = '00000000-0000-0000-0000-000000000002';
    await supabase.from('branches').upsert({
        id: branchId,
        business_id: bizId,
        name: 'Bursa Şube',
        status: 'active'
    });

    // 4. Staff
    const staff = [
        { id: 's1', name: 'Aslı Yılmaz', role: 'Terapist' },
        { id: 's2', name: 'Elif Kaya', role: 'Resepsiyon' },
        { id: 's3', name: 'Melisa Demir', role: 'Terapist' }
    ];
    await supabase.from('staff').upsert(staff.map(s => ({
        id: s.id,
        business_id: bizId,
        branch_id: branchId,
        name: s.name,
        role: s.role,
        status: 'Aktif'
    })));

    // 5. Services
    const services = [
        { name: 'Bali Masajı', price: 1200, duration: 60 },
        { name: 'İsveç Masajı', price: 1000, duration: 60 },
        { name: 'Aromaterapi', price: 1350, duration: 75 }
    ];
    await supabase.from('services').upsert(services.map(s => ({
        id: crypto.randomUUID(),
        business_id: bizId,
        name: s.name,
        base_price: s.price,
        duration: s.duration
    })));

    // 6. Payments (Historical for last 7 days)
    const payments = [];
    const today = new Date();
    for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];

        payments.push({
            id: crypto.randomUUID(),
            business_id: bizId,
            branch_id: branchId,
            customer_name: 'Örnek Müşteri ' + i,
            total_amount: 1000 + (i * 150),
            date: dateStr,
            reference_code: Math.random().toString(36).substring(2, 7).toUpperCase(),
            methods: [{ method: 'nakit', amount: 1000 + (i * 150), currency: 'TRY', rate: 1 }]
        });
    }
    await supabase.from('payments').upsert(payments);

    console.log('Seed completed successfully!');
}

seed();
