"use client";

import { useState, useMemo, useEffect } from 'react';
import { useStore } from "@/lib/store";
import { 
    Users, TrendingUp, DollarSign, Package, AlertCircle, 
    Star, Award, Calendar, ChevronRight, Activity, ShieldCheck, Clock,
    Sparkles, Zap, ArrowUpRight, MessageSquare, TrendingDown, Moon,
    ArrowRight, Wallet, Target, Info, Plus, Edit2, CheckCircle2, FileCode
} from "lucide-react";

import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import EndOfDayAI from "@/components/ai/EndOfDayAI";
import QuickSaleFlow from "@/components/checkout/QuickSaleFlow";

export default function Dashboard() {
    const { 
        appointments, payments, staffMembers, customers, debts, aiInsights, 
        currentUser, currentBusiness, updateBusiness, can, rates, allLogs,
        addLog
    } = useStore();
    const [isEndOfDayOpen, setIsEndOfDayOpen] = useState(false);
    const [isTargetModalOpen, setIsTargetModalOpen] = useState(false);
    const [isQuickSaleOpen, setIsQuickSaleOpen] = useState(false);
    const [isEfficiencyOpen, setIsEfficiencyOpen] = useState(false);
    const [isAutomationConfirmed, setIsAutomationConfirmed] = useState(false);
    const [newTarget, setNewTarget] = useState({ daily: 0, monthly: 0 });
    const [mounted, setMounted] = useState(false);
    const [currency, setCurrency] = useState<'TRY' | 'USD' | 'EUR'>('TRY');

    useEffect(() => {
        setMounted(true);
    }, []);

    const getRate = (code: string) => rates.find((r: any) => r.code === code)?.rate || 1;

    const formatPrice = (val: number) => {
        if (currency === 'TRY') return `₺${val.toLocaleString('tr-TR')}`;
        const rate = getRate(currency);
        const converted = val / rate;
        return `${currency === 'USD' ? '$' : '€'}${converted.toLocaleString('tr-TR', { maximumFractionDigits: 2 })}`;
    };

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toISOString().split('T')[0];

    const dailyRevenue = payments.filter((p: any) => p.date === today).reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    const yesterdayRevenue = payments.filter((p: any) => p.date === yesterdayStr).reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    
    const dailyGrowth = useMemo(() => {
        if (yesterdayRevenue === 0) return dailyRevenue > 0 ? 100 : 0;
        return Math.round(((dailyRevenue - yesterdayRevenue) / yesterdayRevenue) * 100);
    }, [dailyRevenue, yesterdayRevenue]);

    const monthlyRevenue = payments.filter((p: any) => p.date?.startsWith(today.slice(0, 7))).reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    const pendingAppointments = appointments.filter((a: any) => a.date === today && (a.status === 'pending' || a.status === 'confirmed' || a.status === 'arrived')).length;

    const timeGreeting = useMemo(() => {
        const hour = new Date().getHours();
        if (hour < 12) return "Günaydın";
        if (hour < 18) return "Tünaydın";
        return "İyi Akşamlar";
    }, []);

    // Capacity Logic: Real data based
    const capacity = useMemo(() => {
        const activeStaff = staffMembers.filter((s: any) => s.status === 'active').length;
        if (activeStaff === 0) return 0;
        // Simplified: avg 8 appointments per staff max
        const maxDaily = activeStaff * 8;
        const current = appointments.filter((a: any) => a.date === today && a.status !== 'cancelled').length;
        return Math.min(100, Math.round((current / maxDaily) * 100));
    }, [staffMembers, appointments, today]);

    const monthlyTarget = currentBusiness?.monthly_target || 50000;
    const monthlyProgress = Math.min(100, Math.round((monthlyRevenue / monthlyTarget) * 100));

    const handleUpdateTargets = async () => {
        if (!can('manage_business')) return;
        await updateBusiness({
            daily_target: newTarget.daily,
            monthly_target: newTarget.monthly
        });
        setIsTargetModalOpen(false);
    };

    // 2. Chart Data (Last 7 Days)
    const chartData = useMemo(() => {
        const last7Days = [];
        const daily: Record<string, number> = {};
        
        payments.forEach((p: any) => {
            const d = p.date;
            daily[d] = (daily[d] || 0) + p.totalAmount;
        });

        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const dayName = d.toLocaleDateString('tr-TR', { weekday: 'short' });
            last7Days.push({
                name: dayName,
                ciro: daily[dateStr] || 0,
                date: dateStr
            });
        }
        return last7Days;
    }, [payments]);

    const churnRiskCount = customers.filter((c: any) => c.isChurnRisk).length;
    const suspiciousCount = appointments.filter((a: any) => a.status === 'completed' && a.price > 0 && !payments.some((p: any) => p.appointmentId === a.id)).length;

    const containerVariants = {
        hidden: { opacity: 0 },
        show: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        show: { opacity: 1, y: 0 }
    };

    return (
        <motion.div 
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-10 font-sans"
        >
            {/* Top Bar / Header */}
            <motion.div 
                variants={itemVariants}
                className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6"
            >
                <div>
                    <div className="flex items-center gap-3 mb-3">
                        <div className="bg-primary/10 text-primary p-2 rounded-2xl">
                            <Activity className="w-5 h-5" />
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 dark:text-white leading-tight">
                            {timeGreeting}, <span className="text-gradient">{currentUser?.name?.split(' ')[0] || ''}</span>
                            <span className="block text-lg font-bold text-gray-400 mt-1">{currentBusiness?.name || ''}</span>
                        </h1>
                    </div>
                    <p className="text-gray-400 font-bold text-sm tracking-tight flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        İşletmeniz şu an %{capacity} kapasiteyle çalışıyor. <span onClick={() => setIsEfficiencyOpen(true)} className="text-primary hover:underline cursor-pointer">Verimliliği gör</span>
                    </p>
                </div>
                
                <div className="flex gap-3">
                    <div className="flex bg-gray-100/50 p-1 rounded-2xl border border-gray-100 mr-2">
                        {['TRY', 'USD', 'EUR'].map((c) => (
                            <button
                                key={c}
                                onClick={() => setCurrency(c as any)}
                                className={`px-4 py-1.5 rounded-xl text-[10px] font-black transition-all ${currency === c ? 'bg-white text-primary shadow-sm scale-105' : 'text-gray-400 hover:text-gray-600'}`}
                            >
                                {c}
                            </button>
                        ))}
                    </div>
                    <button className="h-12 w-12 bg-white border border-gray-100 rounded-2xl flex items-center justify-center shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all text-gray-400 hover:text-primary">
                        <MessageSquare className="w-5 h-5" />
                    </button>
                    <button 
                         onClick={() => setIsEndOfDayOpen(true)}
                         className="h-12 px-6 bg-white border border-gray-100 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all group"
                    >
                        <Moon className="w-4 h-4 text-gray-400 group-hover:text-primary" />
                        <span className="text-[11px] font-black uppercase tracking-widest text-gray-600">Gün Sonu</span>
                    </button>
                    {currentBusiness?.verticals?.includes('clinic') && (
                        <>
                             <button className="h-12 px-6 bg-emerald-50 text-emerald-600 border border-emerald-100 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all">
                                <FileCode className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Reçete</span>
                            </button>
                            <button className="h-12 px-6 bg-teal-50 text-teal-600 border border-teal-100 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all">
                                <Zap className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Lab</span>
                            </button>
                        </>
                    )}

                    {currentBusiness?.verticals?.includes('fitness') && (
                        <>
                             <button className="h-12 px-6 bg-orange-50 text-orange-600 border border-orange-100 rounded-2xl flex items-center justify-center gap-3 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all">
                                <Activity className="w-4 h-4" />
                                <span className="text-[11px] font-black uppercase tracking-widest">Program</span>
                            </button>
                        </>
                    )}
                    <button 
                        onClick={() => setIsQuickSaleOpen(true)}
                        className="h-12 px-6 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4 text-white" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Hızlı Satış</span>
                    </button>
                </div>
            </motion.div>

            {/* Core Stats Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div variants={itemVariants} className="card-apple p-6 relative overflow-hidden group bg-white/40 backdrop-blur-xl border-white/60">
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                        {dailyGrowth >= 0 ? <TrendingUp size={80} className="text-emerald-500" /> : <TrendingDown size={80} className="text-rose-500" />}
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bugünkü Ciro</p>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{formatPrice(dailyRevenue)}</h3>
                    <div className={`mt-4 inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-tighter ${dailyGrowth >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                        {dailyGrowth >= 0 ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />} 
                        {dailyGrowth >= 0 ? '+' : ''}{dailyGrowth}% Düne Göre
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="card-apple p-6 group bg-white/40 backdrop-blur-xl border-white/60">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                        {currentBusiness?.verticals?.includes('clinic') ? 'Bekleyen Vizite' : 'Bekleyen İşlem'}
                    </p>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {pendingAppointments} <span className="text-lg font-bold text-gray-300 tracking-normal">{currentBusiness?.verticals?.includes('clinic') ? 'Hasta' : 'Randevu'}</span>
                    </h3>
                    <div className="mt-4 flex -space-x-2">
                        {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-400">?</div>)}
                        <div className="pl-4 text-[10px] text-gray-400 font-bold flex items-center">
                            {currentBusiness?.verticals?.includes('clinic') ? 'Triyaj Bekliyor' : 'Hazırlık Bekliyor'}
                        </div>
                    </div>
                </motion.div>


                <motion.div 
                    variants={itemVariants} 
                    onClick={() => can('manage_business') && setIsTargetModalOpen(true)}
                    className={`p-6 rounded-[2.5rem] shadow-xl transition-all duration-500 text-white group cursor-pointer relative overflow-hidden ${can('manage_business') ? 'bg-primary hover:shadow-2xl hover:scale-[1.02]' : 'bg-primary/80 opacity-90'}`}
                >
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Target size={80} />
                    </div>
                    <div className="flex justify-between items-start mb-1">
                        <p className="text-[10px] font-black text-white/70 uppercase tracking-widest leading-none">Aylık Hedef</p>
                        {can('manage_business') && <Edit2 size={14} className="opacity-0 group-hover:opacity-60 transition-opacity" />}
                    </div>
                    <h3 className="text-3xl font-black text-white tracking-tighter">{formatPrice(monthlyTarget)}</h3>
                    <div className="w-full h-1.5 bg-white/20 rounded-full mt-5 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${monthlyProgress}%` }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-white" />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[9px] font-black uppercase text-white/80">
                        <span>Tamamlandı %{monthlyProgress}</span>
                        <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="card-apple p-6 group bg-white/40 backdrop-blur-xl border-white/60">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Güvenlik & Müşteri Kaybı</p>
                    <h3 className="text-3xl font-black text-amber-600 tracking-tighter">{suspiciousCount + churnRiskCount} <span className="text-lg font-bold text-gray-300 tracking-normal">Risk</span></h3>
                    <div className="mt-4 flex gap-2">
                        <div className="px-3 py-1 bg-amber-50 text-amber-700 rounded-xl text-[9px] font-black uppercase">Sızıntı: {suspiciousCount}</div>
                        <div className="px-3 py-1 bg-red-50 text-red-700 rounded-xl text-[9px] font-black uppercase">Kayıp: {churnRiskCount}</div>
                    </div>
                </motion.div>
            </div>

            {/* AI Advisor & Chart Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Visual Analytics */}
                <motion.div variants={itemVariants} className="lg:col-span-2 card-apple p-8 md:p-10 bg-white/40 backdrop-blur-xl border-white/60">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Performans Analitiği</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">İşletme Büyüme Trendi (Son 7 Gün)</p>
                        </div>
                        <select className="bg-gray-50 border-none rounded-xl px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-500 outline-none cursor-pointer">
                            <option>Haftalık</option>
                            <option>Aylık</option>
                        </select>
                    </div>
                    <div className="h-[340px] w-full">
                        {mounted ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={chartData}>
                                    <defs>
                                        <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                                        </linearGradient>
                                    </defs>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fontWeight: 'bold', fill: '#9ca3af'}} dy={15} />
                                    <YAxis hide />
                                    <Tooltip 
                                        contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 20px 40px rgba(0,0,0,0.1)', fontWeight: 'bold', padding: '15px'}} 
                                        labelStyle={{color: '#9ca3af', marginBottom: '5px'}}
                                    />
                                    <Area type="monotone" dataKey="ciro" stroke="hsl(var(--primary))" strokeWidth={5} fillOpacity={1} fill="url(#colorCiro)" />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="w-full h-full bg-gray-50 animate-pulse rounded-[2rem]" />
                        )}
                    </div>
                </motion.div>

                {/* AI & Activity Panel */}
                <div className="space-y-8">
                   <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-[80px] group-hover:bg-white/20 transition-all duration-500" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-white/20 rounded-xl"><Sparkles className="w-4 h-4 text-white" /></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Aura AI Danışmanı</h4>
                            </div>
                            <h5 className="text-xl font-black mb-3 leading-tight">Yarın yoğun geçecek!</h5>
                            <p className="text-indigo-100 text-xs font-semibold leading-relaxed mb-8">Sabah saatlerindeki 3 boşluk için sadık müşterilerinize otomatik indirim SMS'i gönderelim mi?</p>
                            <button 
                                onClick={async () => {
                                    setIsAutomationConfirmed(true);
                                    await addLog("AI Otomasyon Onaylandı", "Sistem", "Boşluklar için kampanya başlatıldı", "Aura AI");
                                    setTimeout(() => setIsAutomationConfirmed(false), 3000);
                                }}
                                disabled={isAutomationConfirmed}
                                className={`w-full py-4 ${isAutomationConfirmed ? 'bg-emerald-500' : 'bg-white'} ${isAutomationConfirmed ? 'text-white' : 'text-indigo-900'} rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2 btn-premium`}
                            >
                                {isAutomationConfirmed ? <CheckCircle2 className="w-3.5 h-3.5" /> : null}
                                {isAutomationConfirmed ? "Kampanya Onaylandı" : "Otomasyonu Onayla"} {!isAutomationConfirmed && <ChevronRight className="w-3.5 h-3.5" />}
                            </button>
                        </div>
                   </motion.div>

                   <motion.div variants={itemVariants} className="card-apple p-8 bg-white/40 backdrop-blur-xl border-white/60">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Canlı Şube Hareketleri</h4>
                        <div className="space-y-5 max-h-[350px] overflow-y-auto no-scrollbar">
                            {allLogs.slice(0, 10).map((log: any, i: number) => (
                                <div key={i} className="flex gap-4 items-start border-b border-gray-50 pb-4 last:border-0">
                                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${log.action.includes('Randevu') ? 'bg-blue-50 text-blue-500' : 'bg-green-50 text-green-500'}`}>
                                        <Activity className="w-4 h-4" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-[11px] font-black text-gray-900 dark:text-white leading-tight truncate">{log.action}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-0.5 truncate">{log.customerName || 'Sistem Kararı'}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[8px] font-black text-gray-300 uppercase">{new Date(log.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                            <span className="text-[8px] font-black text-primary uppercase cursor-pointer hover:underline">Detay</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {allLogs.length === 0 && (
                                <div className="text-center py-10 opacity-30">
                                    <Clock className="w-8 h-8 mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase">Henüz hareket yok</p>
                                </div>
                            )}
                        </div>
                   </motion.div>
                </div>
            </div>

            {/* Target Settings Modal */}
            <AnimatePresence>
                {isTargetModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setIsTargetModalOpen(false)}
                            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] p-10 w-full max-w-md relative z-10 shadow-2xl"
                        >
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter uppercase italic mb-2">Hedef Belirle</h3>
                            <p className="text-xs font-bold text-gray-400 mb-8 uppercase tracking-widest">İşletmenizin geleceğini inşa edin</p>
                            
                            <div className="space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Günlük Ciro Hedefi</label>
                                    <input 
                                        type="number"
                                        defaultValue={currentBusiness?.daily_target}
                                        onChange={(e) => setNewTarget(prev => ({ ...prev, daily: Number(e.target.value) }))}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-xl font-black text-indigo-600 outline-none focus:ring-2 focus:ring-indigo-100"
                                        placeholder="₺0"
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Aylık Ciro Hedefi</label>
                                    <input 
                                        type="number"
                                        defaultValue={currentBusiness?.monthly_target}
                                        onChange={(e) => setNewTarget(prev => ({ ...prev, monthly: Number(e.target.value) }))}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-xl font-black text-primary outline-none focus:ring-2 focus:ring-primary/10"
                                        placeholder="₺0"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3 mt-10">
                                <button onClick={() => setIsTargetModalOpen(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[11px] uppercase tracking-widest">Vazgeç</button>
                                <button onClick={handleUpdateTargets} className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl">Kaydet</button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Modal */}
            {/* Efficiency Modal */}
            <AnimatePresence>
                {isEfficiencyOpen && (
                    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsEfficiencyOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-md" />
                        <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="bg-white rounded-[3rem] p-12 max-w-2xl w-full relative z-10 shadow-2xl">
                            <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter italic uppercase mb-8">Operasyonel Verimlilik</h3>
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kapasite Kullanımı</p>
                                    <div className="text-4xl font-black text-primary">%{capacity}</div>
                                    <p className="text-xs text-gray-500 font-bold">Aktif {staffMembers.filter((s: any) => s.status === 'active').length} uzman baz alındı.</p>
                                </div>

                                <div className="space-y-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hizmet/Ürün Dengesi</p>
                                    <div className="text-4xl font-black text-indigo-600">70/30</div>
                                    <p className="text-xs text-gray-500 font-bold">Cironun %30'u ürün satışından geliyor.</p>
                                </div>
                            </div>
                            <div className="mt-10 pt-10 border-t border-gray-100">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">AI Önerisi</h4>
                                <p className="text-sm font-bold text-gray-700 leading-relaxed italic">"Öğleden sonraki boşluklar için 'Happy Hour' kampanyası %12 verim artışı sağlayabilir."</p>
                            </div>
                            <button onClick={() => setIsEfficiencyOpen(false)} className="w-full mt-10 py-4 bg-gray-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest">Kapat</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <EndOfDayAI isOpen={isEndOfDayOpen} onClose={() => setIsEndOfDayOpen(false)} />
            
            {/* Quick Sale Flow */}
            {isQuickSaleOpen && (
                <QuickSaleFlow onClose={() => setIsQuickSaleOpen(false)} />
            )}
        </motion.div>
    );
}
