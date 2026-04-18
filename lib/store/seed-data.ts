
export const REALISTIC_SERVICES = [
    { name: 'Geleneksel Bali Masajı', duration: 60, price: 1250, category: 'Masaj Terapileri' },
    { name: 'Thai Masajı (Gerdirme)', duration: 75, price: 1450, category: 'Masaj Terapileri' },
    { name: 'Derin Doku (Deep Tissue)', duration: 60, price: 1350, category: 'Masaj Terapileri' },
    { name: 'Sıcak Taş Terapisi', duration: 75, price: 1650, category: 'Masaj Terapileri' },
    { name: 'Aromaterapi Masajı', duration: 60, price: 1150, category: 'Masaj Terapileri' },
    
    { name: 'Hydrafacial Cilt Bakımı', duration: 60, price: 2200, category: 'Cilt Bakımı' },
    { name: 'Anti-Aging Altın Bakım', duration: 90, price: 3500, category: 'Cilt Bakımı' },
    { name: 'Klasik Cilt Bakımı', duration: 60, price: 1200, category: 'Cilt Bakımı' },
    
    { name: 'Geleneksel Türk Hamamı', duration: 45, price: 950, category: 'Hamam Rituals' },
    { name: 'Kese & Köpük Masajı', duration: 30, price: 750, category: 'Hamam Rituals' },
    { name: 'Sultan Bakımı (Full)', duration: 90, price: 2100, category: 'Hamam Rituals' },
    
    { name: 'Medikal El Bakımı', duration: 45, price: 650, category: 'El & Ayak' },
    { name: 'Medikal Ayak Bakımı', duration: 60, price: 850, category: 'El & Ayak' },
];

export const REALISTIC_PACKAGES = [
    { name: '5 Seans Bali Masajı Paketi', groupName: 'Masaj Paketleri', totalSessions: 5, price: 5500 },
    { name: '10 Seans Bali Masajı Paketi', groupName: 'Masaj Paketleri', totalSessions: 10, price: 9900 },
    { name: '5 Seans Cilt Bakımı Paketi', groupName: 'Bakım Paketleri', totalSessions: 5, price: 9500 },
    { name: 'Gelin Hamamı Paketi (10 Kişi)', groupName: 'Grup Paketleri', totalSessions: 10, price: 18000 },
];

export const REALISTIC_PRODUCTS = [
    { name: 'Organik Hindistan Cevizi Yağı', category: 'Masaj Yağları', price: 450, stock: 24 },
    { name: 'Lavanta Esansiyel Yağı', category: 'Masaj Yağları', price: 280, stock: 15 },
    { name: 'Gül Suyu (Tonik)', category: 'Cilt Ürünleri', price: 180, stock: 40 },
    { name: 'Hamam Seti (Peştamal & Kese)', category: 'Aksesuar', price: 650, stock: 10 },
];

export const seedCatalogData = async (store: any) => {
    // 1. Clear existing first (optional but safer for clean state)
    // Actually user said "donatalım" which usually means add.
    
    const results = [];
    
    for (const s of REALISTIC_SERVICES) {
        results.push(store.addService(s));
    }
    for (const p of REALISTIC_PACKAGES) {
        results.push(store.addPackageDefinition(p));
    }
    for (const i of REALISTIC_PRODUCTS) {
        results.push(store.addProduct(i));
    }
    
    await Promise.all(results);
    return true;
};
