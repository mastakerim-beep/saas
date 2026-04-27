"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { 
    LayoutDashboard, Calendar, Users, Briefcase, 
    Receipt, Wallet, Package, Bot, UserCog, LucideIcon,
    Crown, Zap, Sparkles, TrendingUp, ShieldCheck, LayoutGrid,
    Globe, Compass, CreditCard, FileText, ChevronRight, Info, Terminal, Settings as SettingsIcon, LogOut, FileCode, Lock, Moon, Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, memo, useMemo } from 'react';
import { hasFeature } from '@/lib/utils/feature-gate';

interface SidebarItemProps {
    href: string;
    icon: LucideIcon;
    label: string;
    badge?: string;
    colorClass?: string;
    isHovered: boolean;
    pathname: string;
    isLocked?: boolean;
}

const SidebarItem = memo(({ href, icon: Icon, label, badge, colorClass, isHovered, pathname, isLocked }: SidebarItemProps) => {
    const isActive = useMemo(() => {
        // High-precision matching: 
        // 1. Exact match is always true
        if (pathname === href) return true;
        
        // 2. Trailing slash normalization
        const normalizedPath = pathname.endsWith('/') ? pathname.slice(0, -1) : pathname;
        const normalizedHref = href.endsWith('/') ? href.slice(0, -1) : href;
        if (normalizedPath === normalizedHref) return true;

        // 3. Sub-path matching only for specific parent items, otherwise return false
        // This prevents "Finances" from being active when on "Finances/Cash" if they are both in sidebar
        const subPathsToIgnorePrefixMatch = ['/finances', '/executive'];
        const isIgnored = subPathsToIgnorePrefixMatch.some(p => normalizedHref.endsWith(p));
        
        if (isIgnored) return false;

        return pathname.startsWith(`${href}/`);
    }, [pathname, href]);
    return !isLocked ? (
        <Link href={href} className="relative block group/item">
            <div className={`
                flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-semibold cursor-pointer transition-all duration-300
                ${isActive ? 'text-white' : 'text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 hover:text-indigo-900 dark:hover:text-white'}
            `}>
                <div className="flex items-center justify-center min-w-[32px] relative z-10">
                    {isLocked ? (
                        <Lock className="w-4 h-4 text-gray-400" />
                    ) : (
                        <Icon className={`w-5 h-5 transition-transform duration-300 group-hover/item:scale-110 ${isActive ? 'text-white' : (colorClass || 'text-indigo-500/80 dark:text-indigo-300/80')}`} />
                    )}
                    
                    {/* THE MARK: More prominent active indicator */}
                    {isActive && (
                        <motion.div 
                            layoutId="active-glow"
                            className="absolute -left-10 w-2 h-10 bg-indigo-500 rounded-full blur-[4px] shadow-[0_0_20px_rgba(79,70,229,1)]"
                        />
                    )}
                </div>

                <AnimatePresence mode="wait">
                    {isHovered && (
                        <motion.div 
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap relative z-10"
                        >
                            <span className={`tracking-tight antialiased ${isLocked ? 'text-gray-400 italic' : ''}`}>{label}</span>
                            {badge && (
                                <span className={`
                                    px-2 py-[1px] rounded-full text-[9px] font-black tracking-tighter
                                    ${isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}
                                `}>
                                    {badge}
                                </span>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
                
                {isActive && (
                    <motion.div 
                        layoutId="sidebar-active"
                        className="absolute inset-0 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-500/20"
                        initial={false}
                        transition={{ type: "spring", stiffness: 400, damping: 35 }}
                    />
                )}
            </div>
        </Link>
    ) : (
        <div className="relative block cursor-not-allowed group/item grayscale opacity-50">
             <div className="flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-semibold transition-all duration-300">
                <div className="flex items-center justify-center min-w-[32px] relative z-10">
                    <Lock className="w-4 h-4 text-gray-400" />
                </div>
                {isHovered && (
                    <div className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap relative z-10 text-gray-400">
                        <span className="tracking-tight antialiased italic">{label}</span>
                        <Crown size={12} className="text-amber-500 opacity-50" />
                    </div>
                )}
             </div>
        </div>
    );
});

SidebarItem.displayName = 'SidebarItem';

export default function Sidebar() {
    const pathname = usePathname();
    const { 
        can, currentUser, currentBusiness, tenantModules, 
        allBusinesses, logout, isImpersonating, setImpersonatedBusinessId,
        isInitialized
    } = useStore();
    const [isHovered, setIsHovered] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Initial mount check to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    const isAdminView = pathname.startsWith('/admin');

    // URL'den slug ayıklama (fallback için)
    const urlSlug = pathname.split('/')[1];

    // Daha güvenilir slug bulma (currentBusiness veya allBusinesses üzerinden)
    const resolvedSlug = useMemo(() => {
        if (currentBusiness?.slug) return currentBusiness.slug;
        if (currentUser?.businessId) {
            const biz = allBusinesses.find((b: any) => b.id === currentUser.businessId);
            if (biz?.slug) return biz.slug;
        }
        
        // Root path list to exclude from being treated as slugs
        const rootPaths = ['login', 'admin', 'dashboard', 'calendar', 'customers', 'staff', 'billing', 'system', 'inventory', 'memberships', 'marketing', 'quotes', 'finances', 'expenses', 'balances', 'executive', 'logs', 'users', 'booking-settings'];
        
        // Fallback to URL if we are in a tenant path
        if (urlSlug && !rootPaths.includes(urlSlug)) return urlSlug;
        return null;
    }, [currentBusiness, currentUser, allBusinesses, urlSlug]);
    
    // Doğru rotayı hesapla
    const getTenantLink = (target: string) => {
        if (isAdminView || !resolvedSlug) return `/${target}`;
        return `/${resolvedSlug}/${target}`;
    };

    const isModuleEnabled = (name: string) => {
        // SaaS_Owner sees everything
        if (currentUser?.role === 'SaaS_Owner') return true;
        const mod = tenantModules.find((m: any) => m.moduleName === name);
        // Default to enabled if not found, or specific logic if preferred
        return mod ? mod.isEnabled : true;
    };

    if (!isMounted) return null;


    return (
        <motion.div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{ width: isHovered ? 280 : 88 }}
            transition={{ type: "spring", stiffness: 300, damping: 35, restDelta: 0.5 }}
            className="hidden md:flex flex-col border-r border-indigo-100 dark:border-indigo-900/30 bg-white/80 dark:bg-background/50 backdrop-blur-3xl z-[150] shrink-0 h-screen overflow-hidden font-sans relative shadow-2xl shadow-indigo-100/20 [will-change:width]"
            style={{ transform: 'translateZ(0)' }}
        >
            {/* Header / Brand */}
            <div className="p-6 h-[100px] flex items-center justify-between">
                <div className="flex items-center gap-4 min-w-[40px]">
                    <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${
                        currentBusiness?.verticals?.includes('clinic') ? 'from-emerald-500 to-teal-600' :
                        currentBusiness?.verticals?.includes('fitness') ? 'from-amber-500 to-orange-600' :
                        'from-indigo-500 to-purple-600'
                    } flex items-center justify-center text-white font-black shadow-xl shadow-indigo-200 shrink-0`}>
                        {currentBusiness?.verticals?.includes('clinic') ? <Activity className="w-6 h-6 fill-white" /> :
                         currentBusiness?.verticals?.includes('fitness') ? <TrendingUp className="w-6 h-6 stroke-white" /> :
                         <Sparkles className="w-6 h-6 fill-white" />}
                    </div>
                    {isHovered && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <h1 className="font-black text-xl leading-none text-gray-900 dark:text-white tracking-tighter antialiased">
                                {currentBusiness?.name || 'Aura Kingdom'}
                            </h1>
                            <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto no-scrollbar pb-0.5">
                                {(currentBusiness?.verticals || ['spa']).map((v: string) => (
                                    <span key={v} className={`text-[8px] font-black tracking-widest uppercase px-1.5 py-0.5 rounded-md border ${
                                        v === 'spa' ? 'bg-indigo-50 border-indigo-100 text-indigo-500' :
                                        v === 'clinic' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' :
                                        'bg-amber-50 border-amber-100 text-amber-600'
                                    }`}>
                                        {v}
                                    </span>
                                ))}
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* SUPERADMIN RESET BUTTON */}
                {currentUser?.role === 'SaaS_Owner' && isImpersonating && isHovered && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        onClick={() => setImpersonatedBusinessId(null)}
                        className="p-3 bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-200 hover:bg-rose-600 transition-all flex items-center gap-2"
                        title="İşletme Taklidini Durdur"
                    >
                        <ShieldCheck size={16} />
                        <span className="text-[9px] font-black uppercase whitespace-nowrap">Admin'e Dön</span>
                    </motion.button>
                )}
            </div>

            <div className="flex-1 px-3 mt-4 overflow-y-auto w-full no-scrollbar space-y-8 pb-12">
                {/* Core Ops - Hidden for Admin */}
                {!isAdminView && (
                    <div>
                        {isHovered && <p className="px-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 opacity-50 overflow-hidden whitespace-nowrap">Ana Operasyon</p>}
                        <div className="space-y-1">
                            <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('dashboard')} icon={LayoutDashboard} label="Genel Bakış" />
                            {can('move_appt') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('calendar')} icon={Calendar} label="Takvim" />}
                            {can('manage_customers') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('customers')} icon={Users} label={currentBusiness?.verticals?.includes('clinic') ? "Hastalar" : "Müşteriler"} />}
                            {can('manage_staff') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('booking-settings')} icon={Globe} label="Randevu Portalı" colorClass="text-indigo-500" />}
                            {can('manage_staff') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('staff')} icon={Briefcase} label="Ekip" />}
                        </div>
                    </div>
                )}

                {/* Vertical Specific Tools */}
                {!isAdminView && currentBusiness?.verticals && (currentBusiness.verticals.includes('fitness') || currentBusiness.verticals.includes('clinic')) && (
                    <div>
                        {isHovered && (
                            <p className="px-4 text-[10px] font-black text-emerald-500 dark:text-emerald-400 uppercase tracking-widest mb-4 opacity-50 overflow-hidden whitespace-nowrap">
                                {currentBusiness.verticals.includes('clinic') ? "Klinik Yönetimi" : "Fitness Yönetimi"}
                            </p>
                        )}
                        <div className="space-y-1">
                            {currentBusiness.verticals.includes('fitness') && (
                                <>
                                    <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('workouts')} icon={Activity} label="Antrenman Programları" colorClass="text-orange-500" />
                                    <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('measurements')} icon={TrendingUp} label="Vücut Ölçümleri" colorClass="text-orange-500" />
                                    <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('classes')} icon={Users} label="Grup Dersleri" colorClass="text-orange-500" />
                                </>
                            )}
                            {currentBusiness.verticals.includes('clinic') && (
                                <>
                                    <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('medical-records')} icon={FileText} label="Hasta Dosyaları" colorClass="text-emerald-500" />
                                    <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('prescriptions')} icon={FileCode} label="Reçeteler" colorClass="text-emerald-500" />
                                    <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('lab-results')} icon={Zap} label="Laboratuvar & Test" colorClass="text-emerald-500" />
                                </>
                            )}
                        </div>
                    </div>
                )}


                {/* Growth - Hidden for Admin */}
                {!isAdminView && (
                    <div>
                        {isHovered && (
                            <p className="px-4 text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2 overflow-hidden whitespace-nowrap">
                                <Sparkles className="w-3.5 h-3.5 fill-primary" /> Büyüme
                            </p>
                        )}
                        <div className="space-y-1">
                            <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('memberships')} icon={Crown} label="Abonelikler" badge="V2" colorClass="text-indigo-400" />
                            {isModuleEnabled('quotes') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('quotes')} icon={FileText} label="Teklifler" colorClass="text-indigo-400" />}
                            {isModuleEnabled('marketing') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('marketing')} icon={Compass} label="AI Pazarlama" badge="AI" colorClass="text-indigo-400" isLocked={!hasFeature(currentBusiness || {}, 'hasAI')} />}
                            {isModuleEnabled('inventory') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('inventory')} icon={Package} label="Envanter" />}
                        </div>
                    </div>
                )}

                {/* Finance - Hidden for Admin */}
                {!isAdminView && (
                    <div>
                        {isHovered && <p className="px-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 opacity-50 overflow-hidden whitespace-nowrap">Finans</p>}
                        <div className="space-y-1">
                            {can('view_cash') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('executive')} icon={Globe} label="Executive" badge="VIP" colorClass="text-primary" isLocked={!hasFeature(currentBusiness || {}, 'hasAdvancedAnalytics')} />}
                            {can('view_historical_finance') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('executive/reports')} icon={FileCode} label="Z-Raporu Arşivi" colorClass="text-indigo-500" />}
                            {can('view_cash') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('finances/cash')} icon={Wallet} label="Günün Kasası" colorClass="text-indigo-500" />}
                            {can('view_historical_finance') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('finances')} icon={TrendingUp} label="Ciro Analizi" colorClass="text-indigo-500" />}
                            {can('manage_expenses') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('expenses')} icon={Receipt} label="Giderler" colorClass="text-indigo-500" />}
                            {can('view_historical_finance') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('balances')} icon={Wallet} label="Açık Hesap" colorClass="text-indigo-500" />}
                        </div>
                    </div>
                )}

                {/* System & Subscription - FOR TENANTS */}
                {!isAdminView && (
                    <div>
                        {isHovered && <p className="px-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 opacity-50 overflow-hidden whitespace-nowrap">Sistem & Paket</p>}
                        <div className="space-y-1">
                            {can('manage_business_settings') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('billing')} icon={CreditCard} label="Platform Üyelik" colorClass="text-emerald-500" />}
                            {can('manage_business_settings') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('system')} icon={SettingsIcon} label="Sistem Tanımlamalar" colorClass="text-indigo-600" />}
                            {can('view_audit_logs') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('logs')} icon={Terminal} label="Kernel Log" colorClass="text-gray-900" />}
                            {can('manage_users') && <SidebarItem isHovered={isHovered} pathname={pathname} href={getTenantLink('users')} icon={UserCog} label="Kullanıcı Yetkileri" />}
                        </div>
                    </div>
                )}

                {/* Admin / Global Sys Admin */}
                {currentUser?.role === 'SaaS_Owner' && (
                    <div>
                        {isHovered && <p className="px-4 text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2 overflow-hidden whitespace-nowrap"><ShieldCheck size={14}/> Global Sistem</p>}
                        <div className="space-y-1">
                            <SidebarItem isHovered={isHovered} pathname={pathname} href="/admin" icon={Globe} label="Komuta Merkezi" colorClass="text-rose-500" />
                            <SidebarItem isHovered={isHovered} pathname={pathname} href="/admin#announcements" icon={Sparkles} label="Duyuru Yayını" colorClass="text-indigo-600" />
                            <SidebarItem isHovered={isHovered} pathname={pathname} href="/admin#plans" icon={CreditCard} label="Abonelik & Fiyat" colorClass="text-indigo-600" />
                            <SidebarItem isHovered={isHovered} pathname={pathname} href="/admin#logs" icon={Terminal} label="Sistem Terminali" colorClass="text-gray-900" />
                        </div>
                    </div>
                )}

                {/* GUEST ERROR STATE */}
                {isInitialized && !currentUser && (
                    <div className="px-4">
                        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 rounded-2xl border border-rose-100 dark:border-rose-500/10">
                            <div className="flex items-center gap-3 text-rose-600 mb-2">
                                <ShieldCheck size={16} />
                                {isHovered && <span className="text-[10px] font-black uppercase tracking-widest">Yetki Hatası</span>}
                            </div>
                            {isHovered && (
                                <>
                                    <p className="text-[9px] font-bold text-rose-400 leading-normal mb-3">Oturum açıldı ancak profil verisi yüklenemedi. Lütfen tekrar giriniz.</p>
                                    <button onClick={() => logout()} className="w-full py-2 bg-rose-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-rose-700 transition-all">Yeniden Gir</button>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Profile / Bottom Action */}
            <div className="p-4 border-t border-indigo-100/50">
                <div className={`
                    p-3 rounded-[1.75rem] flex items-center gap-3 group cursor-pointer hover:bg-gray-50 transition-all duration-300
                    ${!isHovered ? 'justify-center' : ''}
                `}>
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200 shrink-0">
                        {currentUser?.name?.charAt(0) || '?'}
                    </div>
                    {isHovered && (
                        <div className="flex items-center gap-2">
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="min-w-0 flex-1 overflow-hidden"
                            >
                                <p className="text-[11px] font-black text-gray-900 dark:text-white truncate tracking-tight mb-0.5">{currentUser?.name}</p>
                                <p className="text-[9px] text-indigo-400/80 font-black uppercase tracking-widest">{currentUser?.role?.replace('Business_Owner', 'İŞLETME SAHİBİ').replace('SaaS_Owner', 'SİSTEM SAHİBİ').replace('Branch_Manager', 'ŞUBE MÜDÜRÜ').replace('_', ' ') || ''}</p>
                            </motion.div>
                            <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    logout();
                                }}
                                className="p-2 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-xl transition-all"
                                title="Çıkış Yap"
                            >
                                <LogOut size={16} />
                            </button>
                        </div>
                    )}
                    {!isHovered && (
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center bg-white/90 rounded-2xl z-20">
                             <button 
                                onClick={(e) => {
                                    e.stopPropagation();
                                    logout();
                                }}
                                className="p-2 text-red-500 rounded-xl transition-all"
                            >
                                <LogOut size={18} />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* SECURITY BADGE */}
            {isHovered && (
                <div className="px-6 pb-6 mt-2">
                    <div className="p-5 bg-indigo-50 dark:bg-indigo-950/40 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/10 shadow-sm relative overflow-hidden group/audit">
                        <div className="flex items-center gap-3 mb-1">
                            <ShieldCheck className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                            <span className="text-[8px] font-black text-indigo-950 dark:text-white uppercase tracking-[0.2em]">GÜVENLİK PROTOKOLÜ</span>
                        </div>
                        <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest pl-7">AKTİF</p>
                        <div className="absolute -right-2 -bottom-2 w-10 h-10 bg-indigo-600/5 rounded-full group-hover/audit:scale-150 transition-transform duration-700" />
                    </div>
                </div>
            )}

            {/* EXPAND INDICATOR: Make "that mark" more prominent */}
            {!isHovered && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                    <div className="w-1 h-12 bg-indigo-100 rounded-l-full group-hover:bg-primary transition-colors" />
                    <ChevronRight className="w-3 h-3 text-indigo-300 mt-2 animate-pulse" />
                </div>
            )}
        </motion.div>
    );
}
