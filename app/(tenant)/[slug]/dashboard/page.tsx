"use client";

import { useState, useMemo, useEffect } from 'react';
import { useStore } from "@/lib/store";
import { 
    Users, TrendingUp, DollarSign, Package, AlertCircle, 
    Star, Award, Calendar, ChevronRight, Activity, ShieldCheck, Clock,
    Sparkles, Zap, ArrowUpRight, MessageSquare, TrendingDown, Moon,
    ArrowRight, Wallet, Target, Info, Plus
} from "lucide-react";
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import EndOfDayAI from "@/components/EndOfDayAI";

export default function Dashboard() {
    const { appointments, payments, staffMembers, customers, debts, aiInsights, currentUser, can } = useStore();
    const [isEndOfDayOpen, setIsEndOfDayOpen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // 1. Stats Calculation
    const today = new Date().toISOString().split('T')[0];
    const dailyRevenue = payments.filter((p: any) => p.date === today).reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    const monthlyRevenue = payments.filter((p: any) => p.date?.startsWith(today.slice(0, 7))).reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    const pendingAppointments = appointments.filter((a: any) => a.date === today && a.status === 'pending').length;

    // 2. Chart Data (Last 7 Days)
    const chartData = useMemo(() => {
        const last7Days = [];
        const daily: Record<string, number> = {};
        
        payments.forEach(p => {
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

    const churnRiskCount = customers.filter(c => c.isChurnRisk).length;
    const suspiciousCount = appointments.filter(a => a.status === 'completed' && a.price > 0 && !payments.some(p => p.appointmentId === a.id)).length;

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
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 leading-tight">
                            Hoş Geldiniz, <span className="text-gradient">{currentUser?.name.split(' ')[0]}</span>
                        </h1>
                    </div>
                    <p className="text-gray-400 font-bold text-sm tracking-tight flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        İşletmeniz şu an %84 kapasiteyle çalışıyor. <span className="text-primary hover:underline cursor-pointer">Verimliliği gör</span>
                    </p>
                </div>
                
                <div className="flex gap-3">
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
                    <button className="h-12 px-6 bg-primary text-white rounded-2xl shadow-xl shadow-primary/20 flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all">
                        <Plus className="w-4 h-4 text-white" />
                        <span className="text-[11px] font-black uppercase tracking-widest">Hızlı Satış</span>
                    </button>
                </div>
            </motion.div>

            {/* Core Stats Bento Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <motion.div variants={itemVariants} className="card-apple p-6 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-6 opacity-0 group-hover:opacity-10 transition-opacity">
                        <TrendingUp size={80} className="text-emerald-500" />
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bugünkü Ciro</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">₺{dailyRevenue.toLocaleString('tr-TR')}</h3>
                    <div className="mt-4 inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-black uppercase tracking-tighter">
                        <ArrowUpRight className="w-3 h-3" /> +12% vs Dün
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="card-apple p-6 group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Bekleyen İşlem</p>
                    <h3 className="text-3xl font-black text-gray-900 tracking-tighter">{pendingAppointments} <span className="text-lg font-bold text-gray-300 tracking-normal">Randevu</span></h3>
                    <div className="mt-4 flex -space-x-2">
                        {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[8px] font-black text-gray-400">?</div>)}
                        <div className="pl-4 text-[10px] text-gray-400 font-bold flex items-center">Hazırlık Bekliyor</div>
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="bg-primary p-6 rounded-[2.5rem] shadow-xl shadow-primary/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-500 text-white group cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity">
                        <DollarSign size={80} />
                    </div>
                    <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-1 leading-none">Aylık Hedef</p>
                    <h3 className="text-3xl font-black text-white tracking-tighter">₺{monthlyRevenue.toLocaleString('tr-TR')}</h3>
                    <div className="w-full h-1.5 bg-white/20 rounded-full mt-5 overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: '65%' }} transition={{ duration: 1.5, delay: 0.5 }} className="h-full bg-white" />
                    </div>
                    <div className="flex justify-between items-center mt-2 text-[9px] font-black uppercase text-white/80">
                        <span>Tamamlandı %65</span>
                        <Zap className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                    </div>
                </motion.div>

                <motion.div variants={itemVariants} className="card-apple p-6 group">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Güvenlik & Churn</p>
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
                <motion.div variants={itemVariants} className="lg:col-span-2 card-apple p-8 md:p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 tracking-tight">Performans Analitiği</h3>
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

                {/* AI & Automation Panel */}
                <div className="space-y-8">
                   <motion.div variants={itemVariants} className="bg-gradient-to-br from-indigo-700 to-indigo-900 text-white rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 blur-[80px] group-hover:bg-white/20 transition-all duration-500" />
                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-white/20 rounded-xl"><Sparkles className="w-4 h-4 text-white" /></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Aura AI Advisor</h4>
                            </div>
                            <h5 className="text-xl font-black mb-3 leading-tight">Yarın yoğun geçecek!</h5>
                            <p className="text-indigo-100 text-xs font-semibold leading-relaxed mb-8">Sabah saatlerindeki 3 boşluk için sadık müşterilerinize otomatik indirim SMS'i gönderelim mi?</p>
                            <button className="w-full py-4 bg-white text-indigo-900 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-100 transition-all flex items-center justify-center gap-2 btn-premium">
                                Otomasyonu Onayla <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                        </div>
                   </motion.div>

                   <motion.div variants={itemVariants} className="card-apple p-8">
                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Son İşlem Kayıtları</h4>
                        <div className="space-y-5">
                            {aiInsights.slice(0, 3).map((insight, i) => (
                                <div key={i} className="flex gap-4 items-start">
                                    <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                                    <div>
                                        <p className="text-xs font-black text-gray-900 leading-tight">{insight.title}</p>
                                        <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-tighter">{insight.category}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                   </motion.div>
                </div>
            </div>

            {/* Modal */}
            <EndOfDayAI isOpen={isEndOfDayOpen} onClose={() => setIsEndOfDayOpen(false)} />
        </motion.div>
    );
}
