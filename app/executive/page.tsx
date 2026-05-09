"use client";

import { useStore } from "@/lib/store";
import { 
    Activity, ShieldCheck, Zap, TrendingUp, 
    Globe, Users, Wallet, Search, Filter, 
    ArrowRight, Sparkles, Bot, ShieldAlert,
    BarChart3, PieChart, LineChart, LayoutGrid,
    Calendar, Bell, RefreshCw, LogOut, Settings
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ImperialOversight } from "../(admin)/admin/components/ImperialOversight";
import { formatPrice } from "@/lib/utils/converter";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function MasterFranchisePage() {
    const { 
        currentUser, allBusinesses, allPayments, allLogs, 
        allNotifs, zReports, fetchData, logout, 
        isInitialized, locale 
    } = useStore();
    
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'oversight' | 'analytics' | 'agents' | 'security'>('oversight');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const isSaaS = currentUser?.role === 'SaaS_Owner';
    const isHolding = !!currentUser?.holding_id;

    useEffect(() => {
        if (isInitialized && !isSaaS && !isHolding) {
            router.replace('/');
        }
    }, [isInitialized, currentUser, router, isSaaS, isHolding]);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchData(undefined, undefined, true);
        setIsRefreshing(false);
    };

    // Aggregate Global Stats
    const globalStats = useMemo(() => {
        const payments = allPayments || [];
        const businesses = allBusinesses || [];
        const logs = allLogs || [];

        const totalCiro = payments.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
        const totalCustomers = businesses.reduce((acc, b) => acc + (b.customerCount || 0), 0);
        const activeBusinesses = businesses.filter(b => b.status === 'active').length;
        const totalVetoes = logs.filter(l => l.action === 'IMPERIAL_VETO').length;

        return {
            totalCiro,
            totalCustomers,
            activeBusinesses,
            totalVetoes
        };
    }, [allPayments, allBusinesses, allLogs]);

    if (!isInitialized || (!isSaaS && !isHolding)) {
        return (
            <div className="min-h-screen bg-[#020210] flex items-center justify-center">
                <div className="animate-pulse flex flex-col items-center">
                    <Sparkles className="w-12 h-12 text-indigo-500 mb-4" />
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Yetki Doğrulanıyor...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-900 font-sans">
            {/* Header / Command Bar */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-[50] px-8 py-4 flex items-center justify-between shadow-sm backdrop-blur-md bg-white/80">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <ShieldCheck size={20} />
                        </div>
                        <div>
                            <h1 className="text-lg font-black tracking-tighter uppercase italic">Imperial Master</h1>
                            <p className="text-[8px] font-black text-indigo-500 uppercase tracking-widest leading-none">Franchise & Holding Control</p>
                        </div>
                    </div>
                    
                    <div className="h-8 w-px bg-slate-200" />
                    
                    <nav className="flex items-center gap-2">
                        <TabBtn active={activeTab === 'oversight'} onClick={() => setActiveTab('oversight')} icon={<Globe size={14} />} label="Kuş Bakışı" />
                        <TabBtn active={activeTab === 'analytics'} onClick={() => setActiveTab('analytics')} icon={<TrendingUp size={14} />} label="Global Analiz" />
                        <TabBtn active={activeTab === 'agents'} onClick={() => setActiveTab('agents')} icon={<Bot size={14} />} label="İmparatorluk Ajanları" />
                        <TabBtn active={activeTab === 'security'} onClick={() => setActiveTab('security')} icon={<ShieldAlert size={14} />} label="Güvenlik" />
                    </nav>
                </div>

                <div className="flex items-center gap-4">
                    <button 
                        onClick={handleRefresh}
                        disabled={isRefreshing}
                        className={`p-2.5 rounded-xl hover:bg-slate-100 transition-all ${isRefreshing ? 'animate-spin text-indigo-600' : 'text-slate-400'}`}
                    >
                        <RefreshCw size={18} />
                    </button>
                    <div className="h-8 w-px bg-slate-200" />
                    <div className="flex items-center gap-3 pl-2">
                        <div className="text-right">
                            <p className="text-[10px] font-black text-slate-900 leading-none uppercase">{currentUser.name}</p>
                            <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest mt-1">
                                {isSaaS ? 'SaaS Imparatoru' : 'Holding Sahibi'}
                            </p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-400 font-black text-xs uppercase">
                            {currentUser.name?.charAt(0)}
                        </div>
                    </div>
                </div>
            </div>

            <main className="p-8 max-w-[1600px] mx-auto space-y-8">
                {/* Global KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <GlobalKPICard 
                        title="Global Ciro" 
                        value={formatPrice(globalStats.totalCiro, locale)} 
                        trend="+12.4%" 
                        icon={<Wallet size={20} />} 
                        color="text-emerald-600"
                        bg="bg-emerald-50"
                    />
                    <GlobalKPICard 
                        title="Aktif İşletme" 
                        value={globalStats.activeBusinesses} 
                        trend={allBusinesses.length.toString()} 
                        icon={<Globe size={20} />} 
                        color="text-indigo-600"
                        bg="bg-indigo-50"
                    />
                    <GlobalKPICard 
                        title="Kayıp-Kaçak Engelleme" 
                        value={globalStats.totalVetoes} 
                        trend="Anlık" 
                        icon={<ShieldCheck size={20} />} 
                        color="text-amber-600"
                        bg="bg-amber-50"
                    />
                    <GlobalKPICard 
                        title="Global Danışan" 
                        value={globalStats.totalCustomers || (allBusinesses.length * 450)} 
                        trend="+5.2%" 
                        icon={<Users size={20} />} 
                        color="text-purple-600"
                        bg="bg-purple-50"
                    />
                </div>

                <AnimatePresence mode="wait">
                    {activeTab === 'oversight' && (
                        <motion.div 
                            key="oversight"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm">
                                <ImperialOversight 
                                    businesses={allBusinesses} 
                                    logs={allLogs} 
                                    zReports={zReports} 
                                    notifications={allNotifs} 
                                />
                            </div>
                        </motion.div>
                    )}
                    
                    {activeTab === 'analytics' && (
                        <motion.div 
                            key="analytics"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm h-[500px] flex items-center justify-center">
                                <div className="text-center">
                                    <BarChart3 size={48} className="text-slate-200 mx-auto mb-4" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Derin Analiz Katmanı Yükleniyor</p>
                                </div>
                            </div>
                            <div className="bg-white rounded-[3rem] p-10 border border-slate-200 shadow-sm h-[500px] flex items-center justify-center">
                                <div className="text-center">
                                    <PieChart size={48} className="text-slate-200 mx-auto mb-4" />
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Holding Verimlilik Matrisi</p>
                                </div>
                            </div>
                        </motion.div>
                    )}

                    {activeTab === 'agents' && (
                        <motion.div 
                            key="agents"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="bg-indigo-950 rounded-[3rem] p-20 text-center text-white"
                        >
                            <Bot size={64} className="text-indigo-400 mx-auto mb-6 animate-bounce" />
                            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Imperial Ajan Merkezi</h2>
                            <p className="text-indigo-300 max-w-xl mx-auto font-medium opacity-80 mb-10">
                                Global ajanlar tüm şubelerinizde 7/24 çalışarak ciroyu maksimize eder ve kaçakları engeller. 
                                Holding düzeyinde ajan politikalarını buradan yönetebilirsiniz.
                            </p>
                            <button className="px-8 py-4 bg-white text-indigo-950 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:scale-110 transition-transform shadow-2xl">
                                GLOBAL POLİTİKA OLUŞTUR
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}

function TabBtn({ active, onClick, icon, label }: any) {
    return (
        <button 
            onClick={onClick}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${active ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-slate-400 hover:bg-slate-50'}`}
        >
            {icon}
            {label}
        </button>
    );
}

function GlobalKPICard({ title, value, trend, icon, color, bg }: any) {
    return (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm group hover:border-indigo-200 transition-all">
            <div className="flex justify-between items-start mb-6">
                <div className={`p-3 ${bg} ${color} rounded-2xl transition-transform group-hover:scale-110`}>
                    {icon}
                </div>
                <div className="flex items-center gap-1 px-2 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black">
                    <TrendingUp size={10} />
                    {trend}
                </div>
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tighter italic">{value}</h3>
        </div>
    );
}
