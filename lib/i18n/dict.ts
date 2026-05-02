export type Locale = 'tr' | 'en';
export type Vertical = 'spa' | 'clinic' | 'fitness';

export const dictionaryData = {
    tr: {
        dashboard: "Panel",
        calendar: "Takvim",
        customers: {
            spa: "Danışanlar",
            clinic: "Hastalar",
            fitness: "Üyeler"
        },
        services: {
            spa: "Hizmetler",
            clinic: "Tedaviler",
            fitness: "Antrenmanlar"
        },
        staff: {
            spa: "Personel",
            clinic: "Doktor/Uzman",
            fitness: "Eğitmen (PT)"
        },
        appointments: {
            spa: "Randevular",
            clinic: "Muayeneler",
            fitness: "Seanslar"
        },
        finances: "Kasa & Finans",
        inventory: "Envanter",
        marketing: "AI Pazarlama",
        executive: "Executive",
        settings: "Ayarlar",
        logout: "Çıkış Yap",
        search: "Ara...",
        welcome: "Hoş Geldiniz",
        ai_pazarlama_title: "İmparatorluk Pazarlama Paneli",
        churn_risk: "Churn Riski",
        loyalty_pulse: "Sadakat Nabzı",
        refresh: "Güncelle",
        executive_summary: "Yönetici Özeti",
        vision: "Aura Vision",
        treasury: "Hazine",
        veto: "Veto Merkezi",
        radar: "Panopticon Radar",
        forecast: "Gelecek Tahmini",
        enable_alerts: "AI ALARM KUR"
    },
    en: {
        dashboard: "Dashboard",
        calendar: "Calendar",
        customers: {
            spa: "Clients",
            clinic: "Patients",
            fitness: "Members"
        },
        services: {
            spa: "Services",
            clinic: "Treatments",
            fitness: "Workouts"
        },
        staff: {
            spa: "Staff",
            clinic: "Doctors",
            fitness: "Trainers"
        },
        appointments: {
            spa: "Appointments",
            clinic: "Consultations",
            fitness: "Sessions"
        },
        finances: "Finance & Cash",
        inventory: "Inventory",
        marketing: "AI Marketing",
        executive: "Executive",
        settings: "Settings",
        logout: "Logout",
        search: "Search...",
        welcome: "Welcome",
        ai_pazarlama_title: "Imperial Marketing Panel",
        churn_risk: "Churn Risk",
        loyalty_pulse: "Loyalty Pulse",
        refresh: "Refresh",
        executive_summary: "Executive Summary",
        vision: "Aura Vision",
        treasury: "Treasury",
        veto: "Veto Center",
        radar: "Panopticon Radar",
        forecast: "AI Forecasting",
        enable_alerts: "ENABLE AI ALERTS"
    }
};

// Geriye uyumluluk için standart dictionary exportu (Eski kodları bozmamak için)
export const dictionary = new Proxy(dictionaryData, {
    get(target, localeProp) {
        if (localeProp === 'tr' || localeProp === 'en') {
            const localeData = target[localeProp];
            return new Proxy(localeData, {
                get(locTarget, prop) {
                    const val = (locTarget as any)[prop];
                    if (val && typeof val === 'object') {
                        return val.spa; // Default fallback for static imports
                    }
                    return val;
                }
            });
        }
        return (target as any)[localeProp];
    }
});

// Yeni dinamik sözlük çözücü
export function useDynamicDictionary(locale: Locale, verticals?: string[]) {
    const base = dictionaryData[locale] || dictionaryData.tr;
    
    let v: Vertical = 'spa';
    if (verticals?.includes('clinic')) v = 'clinic';
    else if (verticals?.includes('fitness')) v = 'fitness';

    return new Proxy(base, {
        get(target, prop) {
            const val = (target as any)[prop];
            if (val && typeof val === 'object') {
                return val[v] || val.spa || prop;
            }
            return val;
        }
    });
}
