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
        enable_alerts: "AI ALARM KUR",
        
        // Sidebar New Keys
        portal: "Portal",
        team: "Ekip",
        workouts: "Antrenman Programları",
        measurements: "Vücut Ölçümleri",
        classes: "Grup Dersleri",
        medical_records: "Hasta Dosyaları",
        prescriptions: "Reçeteler",
        lab_results: "Laboratuvar & Test",
        memberships: "Üyelikler",
        quotes: "Teklifler",
        z_report: "Z-Raporu",
        analysis: "Analiz",
        platform_membership: "Platform Üyelik",
        system_definitions: "Sistem Tanımlamalar",
        kernel_log: "Kernel Log",
        user_permissions: "Kullanıcı Yetkileri",
        command_center: "Komuta Merkezi",
        announcements: "Duyuru Yayını",
        plans_pricing: "Abonelik & Fiyat",
        system_terminal: "Sistem Terminali",
        
        // Roles
        role_owner: "İŞLETME SAHİBİ",
        role_saas: "SİSTEM SAHİBİ",
        role_manager: "ŞUBE MÜDÜRÜ",
        role_staff: "PERSONEL",

        // Dashboard
        good_morning: "Günaydın",
        good_afternoon: "Tünaydın",
        good_evening: "İyi Akşamlar",
        capacity_msg: "İşletmeniz şu an %{capacity} kapasiteyle çalışıyor.",
        view_efficiency: "Verimliliği gör",
        end_of_day: "Gün Sonu",
        quick_sale: "Hızlı Satış",
        daily_revenue: "Bugünkü Ciro",
        vs_yesterday: "Düne Göre",
        pending_action: {
            spa: "Bekleyen İşlem",
            clinic: "Bekleyen Vizite",
            fitness: "Bekleyen Seans"
        },
        unit_patient: "Hasta",
        unit_appointment: "Randevu",
        waiting_prep: "Hazırlık Bekliyor",
        waiting_triage: "Triyaj Bekliyor",
        monthly_target: "Aylık Hedef",
        completed: "Tamamlandı",
        security_risk: "Güvenlik & Müşteri Kaybı",
        leak: "Sızıntı",
        loss: "Kayıp",
        performance_analytics: "Performans Analitiği",
        growth_trend: "İşletme Büyüme Trendi (Son 7 Gün)",
        weekly: "Haftalık",
        monthly: "Aylık",
        ai_advisor: "Aura AI Danışmanı",
        ai_busy_tomorrow: "Yarın yoğun geçecek!",
        ai_busy_msg: "Sabah saatlerindeki 3 boşluk için sadık müşterilerinize otomatik indirim SMS'i gönderelim mi?",
        confirm_automation: "Otomasyonu Onayla",
        automation_confirmed: "Kampanya Onaylandı",
        live_activity: "Canlı Şube Hareketleri",
        no_activity: "Henüz hareket yok",
        set_target: "Hedef Belirle",
        build_future: "İşletmenizin geleceğini inşa edin",
        daily_target: "Günlük Ciro Hedefi",
        cancel: "Vazgeç",
        save: "Kaydet"
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
        enable_alerts: "ENABLE AI ALERTS",

        // Sidebar New Keys
        portal: "Portal",
        team: "Team",
        workouts: "Workouts",
        measurements: "Measurements",
        classes: "Classes",
        medical_records: "Medical Records",
        prescriptions: "Prescriptions",
        lab_results: "Lab & Tests",
        memberships: "Memberships",
        quotes: "Quotes",
        z_report: "Z-Report",
        analysis: "Analysis",
        platform_membership: "Platform Subscription",
        system_definitions: "System Definitions",
        kernel_log: "Kernel Log",
        user_permissions: "User Permissions",
        command_center: "Command Center",
        announcements: "Announcements",
        plans_pricing: "Plans & Pricing",
        system_terminal: "System Terminal",

        // Roles
        role_owner: "BUSINESS OWNER",
        role_saas: "SYSTEM OWNER",
        role_manager: "BRANCH MANAGER",
        role_staff: "STAFF",

        // Dashboard
        good_morning: "Good Morning",
        good_afternoon: "Good Afternoon",
        good_evening: "Good Evening",
        capacity_msg: "Your business is operating at %{capacity} capacity.",
        view_efficiency: "View Efficiency",
        end_of_day: "End of Day",
        quick_sale: "Quick Sale",
        daily_revenue: "Daily Revenue",
        vs_yesterday: "Vs Yesterday",
        pending_action: {
            spa: "Pending Action",
            clinic: "Pending Visit",
            fitness: "Pending Session"
        },
        unit_patient: "Patient",
        unit_appointment: "Appointment",
        waiting_prep: "Waiting Prep",
        waiting_triage: "Waiting Triage",
        monthly_target: "Monthly Target",
        completed: "Completed",
        security_risk: "Security & Churn",
        leak: "Leak",
        loss: "Loss",
        performance_analytics: "Performance Analytics",
        growth_trend: "Business Growth Trend (Last 7 Days)",
        weekly: "Weekly",
        monthly: "Monthly",
        ai_advisor: "Aura AI Advisor",
        ai_busy_tomorrow: "Tomorrow will be busy!",
        ai_busy_msg: "Should we send an automated discount SMS to your loyal customers for the 3 gaps in the morning?",
        confirm_automation: "Confirm Automation",
        automation_confirmed: "Campaign Confirmed",
        live_activity: "Live Branch Activity",
        no_activity: "No activity yet",
        set_target: "Set Target",
        build_future: "Build the future of your business",
        daily_target: "Daily Revenue Target",
        cancel: "Cancel",
        save: "Save",

        // Header
        system_audit: "System Audit Center",
        live: "LIVE",
        no_violations: "No operational violations found in the system.",
        examine_resolve: "Examine / Resolve",
        branch_switcher: "Branch Switcher",
        currently: "Currently",
        all_branches: "All Branches",
        profile_settings: "Profile Settings",
        change_password: "Change Password",
        business_info: "Business Info",
        secure_logout: "Secure Logout"
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
