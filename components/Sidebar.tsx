"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { 
    LayoutDashboard, Calendar, Users, Briefcase, 
    Receipt, Wallet, Package, Bot, UserCog, LucideIcon,
    Crown, Zap, Sparkles, TrendingUp, ShieldCheck, LayoutGrid,
    Globe, Compass, CreditCard, FileText, ChevronRight, Info, Terminal
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';

interface SidebarItemProps {
    href: string;
    icon: LucideIcon;
    label: string;
    badge?: string;
    colorClass?: string;
    isHovered: boolean;
}

export default function Sidebar() {
    const pathname = usePathname();
    const { can, currentUser, currentBusiness, tenantModules } = useStore();
    const [isHovered, setIsHovered] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Initial mount check to prevent hydration mismatch
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Current view mode based on path
    const isAdminView = pathname.startsWith('/admin');

    const isModuleEnabled = (name: string) => {
        // SaaS_Owner sees everything
        if (currentUser?.role === 'SaaS_Owner') return true;
        const mod = tenantModules.find(m => m.moduleName === name);
        // Default to enabled if not found, or specific logic if preferred
        return mod ? mod.isEnabled : true;
    };

    if (!isMounted) return null;

    const SidebarItem = ({ href, icon: Icon, label, badge, colorClass, isHovered }: SidebarItemProps) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
            <Link href={href} className="relative block group/item">
                <div className={`
                    flex items-center gap-4 px-6 py-4 rounded-2xl text-[13px] font-semibold cursor-pointer transition-all duration-300
                    ${isActive ? 'text-white' : 'text-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/40 hover:text-indigo-900 dark:hover:text-white'}
                `}>
                    <div className="flex items-center justify-center min-w-[32px] relative z-10">
                        <Icon className={`w-5 h-5 transition-transform duration-300 group-hover/item:scale-110 ${isActive ? 'text-white' : (colorClass || 'text-indigo-400/70')}`} />
                        
                        {/* THE MARK: More prominent active indicator */}
                        {isActive && (
                            <motion.div 
                                layoutId="active-glow"
                                className="absolute -left-8 w-2 h-8 bg-primary rounded-full blur-[2px] shadow-[0_0_15px_rgba(79,70,229,0.8)]"
                            />
                        )}
                    </div>

                    <AnimatePresence>
                        {isHovered && (
                            <motion.div 
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                className="flex-1 flex items-center justify-between overflow-hidden whitespace-nowrap"
                            >
                                <span className="tracking-tight antialiased">{label}</span>
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
                            className="absolute inset-0 bg-primary rounded-2xl shadow-xl shadow-primary/20"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                    )}
                </div>
            </Link>
        );
    };

    return (
        <motion.div 
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            animate={{ width: isHovered ? 280 : 88 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="hidden md:flex flex-col border-r border-indigo-100 dark:border-indigo-900/30 bg-white/80 dark:bg-background/50 backdrop-blur-3xl z-50 shrink-0 h-screen overflow-hidden font-sans relative shadow-2xl shadow-indigo-100/20"
        >
            {/* Header / Brand */}
            <div className="p-6 h-[100px] flex items-center">
                <div className="flex items-center gap-4 min-w-[40px]">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-black shadow-xl shadow-indigo-200 shrink-0">
                        <Sparkles className="w-6 h-6 fill-white" />
                    </div>
                    {isHovered && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="overflow-hidden whitespace-nowrap"
                        >
                            <h1 className="font-black text-xl leading-none text-gray-900 dark:text-white tracking-tighter antialiased">Aura Pro</h1>
                            <p className="text-[10px] text-primary font-black tracking-[0.2em] uppercase mt-1.5 opacity-80">Enterprise</p>
                        </motion.div>
                    )}
                </div>
            </div>

            <div className="flex-1 px-3 mt-4 overflow-y-auto w-full no-scrollbar space-y-8 pb-12">
                {/* Core Ops - Hidden for Admin */}
                {!isAdminView && (
                    <div>
                        {isHovered && <p className="px-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 opacity-50 overflow-hidden whitespace-nowrap">Ana Operasyon</p>}
                        <div className="space-y-1">
                            <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/dashboard` : '/dashboard'} icon={LayoutDashboard} label="Genel Bakış" />
                            {can('manage_appointments') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/calendar` : '/calendar'} icon={Calendar} label="Takvim" />}
                            {can('manage_customers') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/customers` : '/customers'} icon={Users} label="Müşteriler" />}
                            <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/services` : '/services'} icon={LayoutGrid} label="Hizmetler" colorClass="text-indigo-500" />
                            {can('manage_staff') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/booking-settings` : '/booking-settings'} icon={Globe} label="Randevu Portalı" colorClass="text-indigo-500" />}
                            {can('manage_staff') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/staff` : '/staff'} icon={Briefcase} label="Ekip" />}
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
                            <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/memberships` : '/memberships'} icon={Crown} label="Abonelikler" badge="V2" colorClass="text-indigo-400" />
                            {isModuleEnabled('quotes') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/quotes` : '/quotes'} icon={FileText} label="Teklifler" colorClass="text-indigo-400" />}
                            {isModuleEnabled('marketing') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/marketing` : '/marketing'} icon={Compass} label="AI Pazarlama" badge="AI" colorClass="text-indigo-400" />}
                            {isModuleEnabled('inventory') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/inventory` : '/inventory'} icon={Package} label="Envanter" />}
                        </div>
                    </div>
                )}

                {/* Finance - Hidden for Admin */}
                {!isAdminView && (
                    <div>
                        {isHovered && <p className="px-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 opacity-50 overflow-hidden whitespace-nowrap">Finans</p>}
                        <div className="space-y-1">
                            {can('view_executive_summary') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/executive` : '/executive'} icon={Globe} label="Executive" badge="VIP" colorClass="text-primary" />}
                            {can('view_executive_summary') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/finances/cash` : '/finances/cash'} icon={Wallet} label="Günün Kasası" colorClass="text-indigo-500" />}
                            {can('view_executive_summary') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/finances` : '/finances'} icon={TrendingUp} label="Ciro Analizi" colorClass="text-indigo-500" />}
                            {can('view_executive_summary') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/expenses` : '/expenses'} icon={Receipt} label="Giderler" colorClass="text-indigo-500" />}
                            {can('view_executive_summary') && <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/balances` : '/balances'} icon={Wallet} label="Açık Hesap" colorClass="text-indigo-500" />}
                        </div>
                    </div>
                )}

                {/* System & Subscription - FOR TENANTS */}
                {!isAdminView && (
                    <div>
                        {isHovered && <p className="px-4 text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-4 opacity-50 overflow-hidden whitespace-nowrap">Sistem & Paket</p>}
                        <div className="space-y-1">
                            <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/billing` : '/billing'} icon={CreditCard} label="Platform Üyelik" colorClass="text-emerald-500" />
                            <SidebarItem isHovered={isHovered} href={currentBusiness?.slug ? `/${currentBusiness.slug}/users` : '/users'} icon={UserCog} label="Kullanıcı Yetkileri" />
                        </div>
                    </div>
                )}

                {/* Admin / Global Sys Admin */}
                {currentUser?.role === 'SaaS_Owner' && (
                    <div>
                        {isHovered && <p className="px-4 text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2 overflow-hidden whitespace-nowrap"><ShieldCheck size={14}/> Global Sistem</p>}
                        <div className="space-y-1">
                            <SidebarItem isHovered={isHovered} href="/admin" icon={Globe} label="Komuta Merkezi" colorClass="text-rose-500" />
                            <SidebarItem isHovered={isHovered} href="/admin#announcements" icon={Sparkles} label="Duyuru Yayını" colorClass="text-indigo-600" />
                            <SidebarItem isHovered={isHovered} href="/admin#plans" icon={CreditCard} label="Abonelik & Fiyat" colorClass="text-indigo-600" />
                            <SidebarItem isHovered={isHovered} href="/admin#logs" icon={Terminal} label="Sistem Terminali" colorClass="text-gray-900" />
                        </div>
                    </div>
                )}
            </div>

            {/* Profile / Bottom Action */}
            <div className="p-4 mt-auto border-t border-indigo-100/50">
                <div className={`
                    p-3 rounded-[1.75rem] flex items-center gap-3 group cursor-pointer hover:bg-gray-50 transition-all duration-300
                    ${!isHovered ? 'justify-center' : ''}
                `}>
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-indigo-200 shrink-0">
                        {currentUser?.name.charAt(0)}
                    </div>
                    {isHovered && (
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="min-w-0 flex-1 overflow-hidden"
                        >
                            <p className="text-[11px] font-black text-gray-900 truncate tracking-tight mb-0.5">{currentUser?.name}</p>
                            <p className="text-[9px] text-indigo-400/80 font-black uppercase tracking-widest">{currentUser?.role.replace('_', ' ')}</p>
                        </motion.div>
                    )}
                </div>
            </div>

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
