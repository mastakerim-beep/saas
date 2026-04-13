"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useStore } from '@/lib/store';
import { 
    LayoutDashboard, Calendar, Users, Briefcase, 
    Receipt, Wallet, ShieldAlert, Package, Bot, UserCog, LucideIcon,
    Crown, Zap, Sparkles, MessageSquare, Star, TrendingUp, ShieldCheck, LayoutGrid,
    Globe, Compass, Shield, CreditCard
} from 'lucide-react';
import { motion } from 'framer-motion';

interface SidebarItemProps {
    href: string;
    icon: LucideIcon;
    label: string;
    badge?: string;
    colorClass?: string;
}

export default function Sidebar() {
    const pathname = usePathname();
    const { can, currentUser, currentBusiness } = useStore();

    const SidebarItem = ({ href, icon: Icon, label, badge, colorClass }: SidebarItemProps) => {
        const isActive = pathname === href || pathname.startsWith(`${href}/`);
        return (
            <Link href={href} className="relative block">
                <div className={`
                    flex items-center justify-between px-6 py-4 rounded-2xl text-[13px] font-semibold cursor-pointer transition-all duration-300 group
                    ${isActive ? 'text-white' : 'text-gray-500 hover:bg-white/40 dark:hover:bg-white/10 hover:text-gray-900 dark:hover:text-white'}
                `}>
                    <div className="flex items-center gap-3.5 relative z-10 font-sans">
                        <Icon className={`w-5 h-5 transition-transform duration-300 group-hover:scale-110 ${isActive ? 'text-white' : (colorClass || 'text-gray-400')}`} />
                        <span className="tracking-tight antialiased">{label}</span>
                    </div>
                    {badge && (
                        <span className={`
                            relative z-10 px-2 py-[1px] rounded-full text-[9px] font-black tracking-tighter
                            ${isActive ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'}
                        `}>
                            {badge}
                        </span>
                    )}
                    
                    {isActive && (
                        <motion.div 
                            layoutId="sidebar-active"
                            className="absolute inset-0 bg-primary rounded-2xl shadow-lg shadow-primary/25"
                            initial={false}
                            transition={{ type: "spring", stiffness: 400, damping: 35 }}
                        />
                    )}
                </div>
            </Link>
        );
    };

    return (
        <div className="w-[280px] hidden md:flex flex-col border-r border-gray-100 bg-background/50 backdrop-blur-3xl z-50 shrink-0 h-screen overflow-hidden font-sans">
            {/* Header / Brand */}
            <div className="p-8 pb-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary flex items-center justify-center text-white font-black shadow-xl shadow-primary/20 select-none">
                        <Star className="w-6 h-6 fill-white" />
                    </div>
                    <div>
                        <h1 className="font-black text-xl leading-none text-gray-900 tracking-tighter antialiased">Aura Pro</h1>
                        <p className="text-[10px] text-primary font-black tracking-[0.2em] uppercase mt-1.5 opacity-80">Enterprise</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 px-4 mt-8 overflow-y-auto w-full no-scrollbar space-y-10 pb-12">
                {/* Core Ops */}
                <div>
                    <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 opacity-50">Ana Operasyon</p>
                    <div className="space-y-1">
                        <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/dashboard` : '/dashboard'} icon={LayoutDashboard} label="Genel Bakış" />
                        {can('manage_appointments') && <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/calendar` : '/calendar'} icon={Calendar} label="Takvim" />}
                        {can('manage_customers') && <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/customers` : '/customers'} icon={Users} label="Müşteriler" />}
                        <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/services` : '/services'} icon={LayoutGrid} label="Hizmetler" colorClass="text-emerald-500" />
                        {can('manage_staff') && <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/booking-settings` : '/booking-settings'} icon={Globe} label="Randevu Portalı" colorClass="text-indigo-500" />}
                        {can('manage_staff') && <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/staff` : '/staff'} icon={Briefcase} label="Ekip" />}
                    </div>
                </div>

                {/* Premium */}
                <div>
                    <p className="px-5 text-[10px] font-black text-primary uppercase tracking-widest mb-4 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 fill-primary" /> Büyüme
                    </p>
                    <div className="space-y-1">
                        <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/memberships` : '/memberships'} icon={Crown} label="Abonelikler" badge="V2" colorClass="text-indigo-400" />
                        <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/marketing` : '/marketing'} icon={Compass} label="AI Pazarlama" badge="AI" colorClass="text-indigo-400" />
                        <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/inventory` : '/inventory'} icon={Package} label="Envanter" />
                    </div>
                </div>

                {/* Finance */}
                <div>
                    <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 opacity-50">Finans</p>
                    <div className="space-y-1">
                        {can('view_executive_summary') && <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/executive` : '/executive'} icon={Globe} label="Executive" badge="VIP" colorClass="text-primary" />}
                        {can('view_executive_summary') && <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/finances/cash` : '/finances/cash'} icon={Wallet} label="Günün Kasası" colorClass="text-emerald-500" />}
                        {can('view_executive_summary') && <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/finances` : '/finances'} icon={TrendingUp} label="Ciro Analizi" />}
                        {can('view_executive_summary') && <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/expenses` : '/expenses'} icon={Receipt} label="Giderler" />}
                        {can('view_executive_summary') && <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/balances` : '/balances'} icon={Wallet} label="Açık Hesap" colorClass="text-red-500" />}
                    </div>
                </div>

                {/* Admin */}
                {(can('manage_staff') || can('manage_all_businesses')) && (
                    <div>
                        <p className="px-5 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 opacity-50">Yönetim</p>
                        <div className="space-y-1">
                            {can('manage_staff') && <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/users` : '/users'} icon={UserCog} label="Yetkiler" />}
                            <SidebarItem href={currentBusiness?.slug ? `/${currentBusiness.slug}/billing` : '/billing'} icon={CreditCard} label="Abonelik & Fatura" colorClass="text-indigo-400" />
                            {can('manage_all_businesses') && <SidebarItem href="/admin" icon={ShieldCheck} label="Master Panel" />}
                        </div>
                    </div>
                )}
            </div>

            {/* Profile / Bottom Action */}
            <div className="p-6 mt-auto border-t border-gray-100/50">
                <div className="glass p-4 rounded-[2rem] flex items-center gap-3 group cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
                    <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-black shadow-lg shadow-primary/20 group-hover:scale-105 transition-all duration-300">
                        {currentUser?.name.charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="text-[11px] font-black text-gray-900 uppercase truncate tracking-tight mb-0.5">{currentUser?.name}</p>
                        <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest opacity-70">{currentUser?.role.replace('_', ' ')}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
