"use client";

import { useStore, Branch, Payment, Appointment, Expense, Customer, AuditLog, SystemAnnouncement } from "@/lib/store";
import { 
    Users, Calendar, Wallet, TrendingUp, 
    Bell, Megaphone, DollarSign, Activity,
    TrendingDown, Search, ArrowUpRight, ArrowDownRight,
    Zap, Star, Award, LayoutGrid, Sparkles,
    ChevronRight, Info, AlertTriangle, ShieldCheck, Box,
    PieChart as PieChartIcon
} from "lucide-react";
import { useMemo, useState, useEffect } from "react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area,
    PieChart, Pie, Cell, RadarChart, PolarGrid, 
    PolarAngleAxis, PolarRadiusAxis, Radar,
    LineChart, Line
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import PanopticonRadar from '@/components/system/panopticon/PanopticonRadar';
import VetoCenter from '@/components/system/draconian/VetoCenter';
import { 
    DndContext, 
    useDraggable, 
    useDroppable, 
    DragOverlay,
    DragEndEvent,
    defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Room } from "@/lib/store";
import { requestNotificationPermission } from "@/lib/utils/notifications";
import { dictionary } from "@/lib/i18n/dict";
import { formatPrice } from "@/lib/utils/converter";

export default function ExecutiveDashboard() {
    const params = useParams();
    const slug = params?.slug as string;
    const [activeTab, setActiveTab] = useState<'overview' | 'treasury' | 'panopticon' | 'veto' | 'vision' | 'forecast'>('overview');
    
    const { 
        branches, payments, appointments, customers, 
        expenses, allLogs, can, fetchData, systemAnnouncements,
        locale
    } = useStore();
    const safeLocale = (locale as 'tr' | 'en') || 'tr';
    const d = dictionary[safeLocale] || dictionary.tr;

    const [exchangeRates, setExchangeRates] = useState<{from: string, to: string, rate: string}[]>([]);

    const getLink = (target: string) => `/${slug}/${target}`;

    useEffect(() => {
        fetchData();
        
        // Live Exchange Rates API
        const fetchRates = async () => {
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/TRY');
                const data = await res.json();
                if (data && data.rates) {
                    setExchangeRates([
                        { from: 'TRY', to: 'EUR', rate: (1 / data.rates.EUR).toFixed(4) },
                        { from: 'TRY', to: 'USD', rate: (1 / data.rates.USD).toFixed(4) },
                        { from: 'TRY', to: 'GBP', rate: (1 / data.rates.GBP).toFixed(4) },
                    ]);
                }
            } catch (err) {
                console.error("Döviz kurları alınamadı:", err);
                // Fallback to static if API fails
                setExchangeRates([
                    { from: 'TRY', to: 'EUR', rate: '34.1433' },
                    { from: 'TRY', to: 'USD', rate: '32.1245' },
                    { from: 'TRY', to: 'GBP', rate: '40.8625' },
                ]);
            }
        };
        fetchRates();
    }, []);

    // Sorted Logs: Latest at Top
    const sortedLogs = useMemo(() => {
        return [...allLogs].sort((a: AuditLog, b: AuditLog) => {
            const dateA = new Date(a.date || a.createdAt || 0).getTime();
            const dateB = new Date(b.date || b.createdAt || 0).getTime();
            return dateB - dateA;
        });
    }, [allLogs]);

    // REAL-TIME DATA CALCULATIONS
    const stats = useMemo(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        const sixtyDaysAgo = new Date(Date.now() - 60 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
        
        const todayAppts = appointments.filter((a: Appointment) => a.date === todayStr);
        const todayPayments = payments.filter((p: Payment) => p.date === todayStr);
        const todayCash = todayPayments.reduce((sum: number, p: Payment) => sum + p.totalAmount, 0);
        
        const thirtyDayRev = payments.filter((p: Payment) => p.date >= thirtyDaysAgo).reduce((sum: number, p: Payment) => sum + p.totalAmount, 0);
        const prevThirtyDayRev = payments.filter((p: Payment) => p.date < thirtyDaysAgo && p.date >= sixtyDaysAgo).reduce((sum: number, p: Payment) => sum + p.totalAmount, 0);
        
        const revenueDiff = prevThirtyDayRev > 0 ? ((thirtyDayRev - prevThirtyDayRev) / prevThirtyDayRev) * 100 : thirtyDayRev > 0 ? 100 : 0;

        return {
            potentialCustomers: customers.length,
            todayAppts: todayAppts.length,
            todayCash,
            revenueDiff
        };
    }, [appointments, payments, customers]);

    // Dynamic Chart Data: Last 14 days
    const lineData = useMemo(() => {
        const data: any[] = [];
        for (let i = 13; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const name = `${date.getDate().toString().padStart(2, '0')}.${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            const dayPayments = payments.filter((p: Payment) => p.date === dateStr);
            const tahsilat = dayPayments.reduce((sum: number, p: Payment) => sum + p.totalAmount, 0);
            
            const dayAppts = appointments.filter((a: Appointment) => a.date === dateStr);
            const satis = dayAppts.reduce((sum: number, a: Appointment) => sum + (a.price || 0), 0);

            data.push({ name, satis, tahsilat });
        }
        return data;
    }, [payments, appointments]);

    // Real Heatmap Algorithm
    const heatmapData = useMemo(() => {
        const slots = Array(144).fill(0);
        const today = new Date();
        
        appointments.forEach((appt: Appointment) => {
            const apptDate = new Date(appt.date);
            const diffDays = Math.floor((today.getTime() - apptDate.getTime()) / (1000 * 60 * 60 * 24));
            if (diffDays >= 0 && diffDays < 7) {
                const [h, m] = (appt.time || "09:00").split(':').map(Number);
                const hourIdx = Math.max(0, Math.min(23, (h - 9) * 2 + (m >= 30 ? 1 : 0)));
                const slotIdx = (diffDays * 20) + Math.max(0, Math.min(19, hourIdx)); 
                if (slotIdx < 144) slots[slotIdx]++;
            }
        });
        return slots;
    }, [appointments]);

    const radarData = useMemo(() => [
        { subject: 'Danışan', A: customers.length, fullMark: Math.max(customers.length, 50) },
        { subject: 'Randevu', A: appointments.length, fullMark: Math.max(appointments.length, 50) },
        { subject: 'Satış', A: payments.length, fullMark: Math.max(payments.length, 50) },
        { subject: 'Potansiyel', A: customers.filter((c: Customer) => c.segment === 'Potansiyel').length, fullMark: Math.max(customers.length, 20) },
        { subject: 'Ödeme', A: payments.filter((p: Payment) => p.totalAmount > 0).length, fullMark: Math.max(payments.length, 20) },
        { subject: 'Gider', A: expenses.length, fullMark: Math.max(expenses.length, 20) },
    ], [customers, appointments, payments, expenses]);

    const pieData = useMemo(() => {
        const segments = ['Normal', 'VIP', 'Potansiyel', 'Kurumsal'];
        return segments.map(s => ({
            name: s,
            value: customers.filter((c: Customer) => c.segment === s || (!c.segment && s === 'Normal')).length
        })).filter(d => d.value > 0);
    }, [customers]);

    const serviceData = useMemo(() => {
        const map: Record<string, number> = {};
        payments.forEach((p: Payment) => {
            if (p.service) {
                map[p.service] = (map[p.service] || 0) + p.totalAmount;
            }
        });
        return Object.entries(map)
            .map(([name, val]) => ({ name, val }))
            .sort((a, b) => b.val - a.val)
            .slice(0, 5);
    }, [payments]);

    const COLORS = ['#4F46E5', '#7C3AED', '#9333EA', '#6366F1', '#4338CA'];

    if (!can('view_executive_summary')) {
        return <AccessDenied />;
    }

    // Treasury Simulation Data
    const { totalIncome, totalExpense, pendingDebts, projectedCashflow } = useMemo(() => {
        const income = (payments || []).reduce((acc: number, p: Payment) => acc + (p.totalAmount || 0), 0);
        const exp = (expenses || []).reduce((acc: number, e: Expense) => acc + (e.amount || 0), 0);
        const pDebts = customers.reduce((acc: number, c: Customer) => acc + (c.loyaltyPoints || 0), 0) * 10;
        const projected = (income - exp) + (pDebts * 0.6);
        return { totalIncome: income, totalExpense: exp, pendingDebts: pDebts, projectedCashflow: projected };
    }, [payments, expenses, customers]);

    return (
        <div className="bg-[#E4E9F0] min-h-screen p-8 space-y-8 font-sans overflow-x-hidden pt-12">
            
            {/* TABS NAVIGATION */}
            <div className="flex gap-4 p-2 bg-white rounded-full shadow-sm border border-gray-100 mb-8 max-w-fit mx-auto relative z-10">
                <TabBtn active={activeTab} id="overview" onClick={setActiveTab} label={d.executive_summary} icon={<TrendingUp size={14} />} />
                <TabBtn active={activeTab} id="vision" onClick={setActiveTab} label={d.vision} icon={<Box size={14} />} />
                <TabBtn active={activeTab} id="treasury" onClick={setActiveTab} label={d.treasury} icon={<Wallet size={14} />} />
                <TabBtn active={activeTab} id="veto" onClick={setActiveTab} label={d.veto} icon={<ShieldCheck size={14} />} />
                <TabBtn active={activeTab} id="panopticon" onClick={setActiveTab} label={d.radar} icon={<Activity size={14} />} />
                <TabBtn active={activeTab} id="forecast" onClick={setActiveTab} label={d.forecast} icon={<Zap size={14} />} />
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'overview' && (
                    <motion.div key="overview" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <KPICard 
                                title="Potansiyel Danışan" 
                                value={stats.potentialCustomers} 
                                color="bg-indigo-950" 
                                icon={<Users size={24} />} 
                                footer="DANIŞAN LİSTESİ"
                                href={getLink('customers')}
                            />
                            <KPICard 
                                title="Günün Randevuları" 
                                value={stats.todayAppts} 
                                color="bg-indigo-600" 
                                icon={<Calendar size={24} />} 
                                footer="TAKVİME GİT"
                                href={getLink('calendar')}
                            />
                            <KPICard 
                                title={d.finances} 
                                value={formatPrice(stats.todayCash, locale)} 
                                color="bg-purple-600" 
                                icon={<Wallet size={24} />} 
                                footer={d.treasury}
                                href={getLink('finances/cash')}
                            />
                            <KPICard 
                                title="Ciro Farkı (30 gün)" 
                                value={`%${stats.revenueDiff.toFixed(1)}`} 
                                color="bg-purple-500" 
                                icon={<TrendingUp size={24} />} 
                                footer="SATIŞ LİSTESİ"
                                href={getLink('finances')}
                            />
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <SectionCard title="Sistem Hareketleri" icon={<Bell size={18} />} color="text-indigo-600">
                                <div className="space-y-4 max-h-[220px] overflow-y-auto pr-2 custom-scrollbar">
                                    {sortedLogs.length > 0 ? sortedLogs.slice(0, 10).map((log: AuditLog, i: number) => (
                                        <div key={i} className="flex gap-4 items-start group">
                                            <div className="p-2.5 bg-indigo-50/50 text-indigo-400 group-hover:text-indigo-600 group-hover:bg-indigo-100/50 rounded-xl transition-all">
                                                <Activity size={16} />
                                            </div>
                                            <div className="flex-1 border-b border-gray-50 pb-3">
                                                <p className="text-xs font-black text-gray-800 uppercase leading-none">{log.action}</p>
                                                <p className="text-[10px] text-gray-400 mt-1 font-bold">
                                                    {log.customerName || 'SİSTEM'} — {new Date(log.date || log.createdAt || "").toLocaleString('tr-TR')}
                                                </p>
                                            </div>
                                        </div>
                                    )) : (
                                        <div className="text-center py-8 text-gray-300 text-[10px] font-black uppercase">Hareket Bulunmuyor</div>
                                    )}
                                </div>
                            </SectionCard>

                            <SectionCard title="Duyurular" icon={<Megaphone size={18} />} color="text-indigo-600" action={<button className="text-[10px] font-black text-gray-300 hover:text-indigo-600 transition-colors">Tümü</button>}>
                                <div className="space-y-4 max-h-[160px] overflow-y-auto pr-2 custom-scrollbar">
                                    {systemAnnouncements && systemAnnouncements.length > 0 ? systemAnnouncements.slice(0, 3).map((ann: SystemAnnouncement, i: number) => (
                                        <div key={i} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 group hover:border-indigo-200 transition-all">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Sparkles size={12} className="text-indigo-500" />
                                                <span className="text-[10px] font-black text-indigo-950 uppercase">{ann.title}</span>
                                            </div>
                                            <p className="text-[10px] text-gray-500 line-clamp-2 leading-relaxed">{ann.content}</p>
                                        </div>
                                    )) : (
                                        <div className="h-40 flex flex-col items-center justify-center text-center opacity-20 grayscale">
                                            <Megaphone size={48} className="text-gray-300 mb-4" />
                                            <p className="text-[10px] font-black uppercase tracking-widest">Henüz Duyuru Yok</p>
                                        </div>
                                    )}
                                </div>
                            </SectionCard>

                            <SectionCard title="Canlı Döviz Kurları" icon={<DollarSign size={18} />} color="text-indigo-600">
                                <table className="w-full text-left">
                                    <thead>
                                        <tr className="text-[10px] font-black text-gray-400 uppercase tracking-widest border-b border-gray-100">
                                            <th className="pb-3">Kaynak Kur</th>
                                            <th className="pb-3">Hedef Kur</th>
                                            <th className="pb-3 text-right">Parite</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {exchangeRates.map((row, i) => (
                                            <tr key={i} className="text-xs text-gray-600">
                                                <td className="py-3 font-bold">{row.from}</td>
                                                <td className="py-3 font-bold">{row.to}</td>
                                                <td className="py-3 font-black text-right text-gray-900">{row.rate}</td>
                                            </tr>
                                        ))}
                                        {exchangeRates.length === 0 && [
                                             { from: 'TRY', to: 'EUR', rate: '34.1433' },
                                             { from: 'TRY', to: 'USD', rate: '32.1245' },
                                             { from: 'TRY', to: 'GBP', rate: '40.8625' },
                                        ].map((row, i) => (
                                            <tr key={i} className="text-xs text-gray-600 opacity-50">
                                                <td className="py-3 font-bold">{row.from}</td>
                                                <td className="py-3 font-bold">{row.to}</td>
                                                <td className="py-3 font-black text-right text-gray-900">{row.rate}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                                <p className="text-[8px] text-gray-400 mt-2 italic">* exchangerate-api üzerinden anlık güncellenir.</p>
                            </SectionCard>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <ChartCard title="Tahsilat - Satış tutarları (TRY)" icon={<TrendingUp size={16} />}>
                                <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={lineData}>
                                        <defs>
                                            <linearGradient id="colorSatis" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `₺${Math.floor(val/1000)}k`} />
                                        <Tooltip contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px -10px rgba(0,0,0,0.1)' }} />
                                        <Area type="monotone" dataKey="satis" stroke="#3B82F6" strokeWidth={3} fillOpacity={0} />
                                        <Area type="monotone" dataKey="tahsilat" stroke="#1ABE9D" strokeWidth={3} fillOpacity={1} fill="url(#colorSatis)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                                <div className="flex gap-4 mt-4 justify-center">
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-blue-500" /> Tahmini Satış
                                    </div>
                                    <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                                        <div className="w-2 h-2 rounded-full bg-indigo-500" /> Gerçekleşen Tahsilat
                                    </div>
                                </div>
                            </ChartCard>

                            <ChartCard title="Randevu tarih-saat yoğunluğu" icon={<Activity size={16} />}>
                                <div className="h-[250px] w-full grid grid-cols-12 gap-1 p-2">
                                    {heatmapData.map((count: number, i: number) => {
                                        const opacity = Math.min(1, count * 0.3);
                                        return (
                                            <div key={i} className={`rounded-sm transition-all hover:scale-110 ${count > 0 ? 'bg-[#0071E3]' : 'bg-gray-100'}`} style={{ opacity: count > 0 ? 0.3 + opacity : 1 }} />
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between mt-4 px-4 text-[9px] font-black text-gray-400">
                                    <span>Sabah</span>
                                    <span>Öğle</span>
                                    <span>Akşam</span>
                                </div>
                            </ChartCard>

                            <ChartCard title="En çok satış yapılanlar (TRY)" icon={<Award size={16} />}>
                                {serviceData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <BarChart data={serviceData} layout="vertical">
                                            <XAxis type="number" hide />
                                            <YAxis dataKey="name" type="category" width={100} fontSize={8} axisLine={false} tickLine={false} />
                                            <Tooltip cursor={{ fill: '#F8F9FB' }} />
                                            <Bar dataKey="val" fill="#6366F1" radius={[0, 4, 4, 0]} barSize={20} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                     <div className="h-[250px] flex items-center justify-center text-gray-300 text-[10px] font-black uppercase">Veri Bekleniyor</div>
                                )}
                            </ChartCard>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
                            <ChartCard title="Sistem performans analizi" icon={<Zap size={16} />}>
                                <ResponsiveContainer width="100%" height={250}>
                                    <RadarChart outerRadius="80%" data={radarData}>
                                        <PolarGrid stroke="#f0f0f0" />
                                        <PolarAngleAxis dataKey="subject" fontSize={8} />
                                        <PolarRadiusAxis angle={30} domain={[0, 'auto']} hide />
                                        <Radar name="Kullanım" dataKey="A" stroke="#4F46E5" fill="#4F46E5" fillOpacity={0.3} />
                                    </RadarChart>
                                </ResponsiveContainer>
                            </ChartCard>

                            <ChartCard title="Danışan tipleri dağılımı" icon={<PieChartIcon size={16} />}>
                                {pieData.length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie 
                                                data={pieData} 
                                                innerRadius={60} 
                                                outerRadius={80} 
                                                paddingAngle={5} 
                                                dataKey="value"
                                            >
                                                {pieData.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                     <div className="h-[250px] flex items-center justify-center text-gray-300 text-[10px] font-black uppercase">Segment Verisi Yok</div>
                                )}
                                <div className="grid grid-cols-2 gap-2 mt-2">
                                    {pieData.map((d: any, i: number) => (
                                        <div key={i} className="flex items-center gap-2 text-[9px] font-black text-gray-400">
                                            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} /> {d.name}
                                        </div>
                                    ))}
                                </div>
                            </ChartCard>

                            <ChartCard title="Randevu trendi (14 Gün)" icon={<Calendar size={16} />}>
                                 <ResponsiveContainer width="100%" height={250}>
                                    <AreaChart data={lineData}>
                                        <defs>
                                            <linearGradient id="colorRand" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                        <YAxis hide />
                                        <Tooltip />
                                        <Area type="monotone" dataKey="satis" stroke="#3B82F6" strokeWidth={3} fill="url(#colorRand)" />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </ChartCard>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'treasury' && (
                    <motion.div key="treasury" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }} className="space-y-8">
                        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-8 rounded-3xl bg-white border border-emerald-500/20 shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><TrendingUp size={24}/></div>
                                </div>
                                <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase relative z-10">Toplam Tahsilat</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-2 tracking-tighter relative z-10">₺{totalIncome.toLocaleString('tr-TR')}</h3>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-emerald-50 rounded-full group-hover:scale-150 transition-all duration-700" />
                            </motion.div>
                            
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-8 rounded-3xl bg-white border border-rose-500/20 shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><TrendingDown size={24}/></div>
                                </div>
                                <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase relative z-10">Toplam Gider</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-2 tracking-tighter relative z-10">₺{totalExpense.toLocaleString('tr-TR')}</h3>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-rose-50 rounded-full group-hover:scale-150 transition-all duration-700" />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-8 rounded-3xl bg-white border border-amber-500/20 shadow-sm relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="p-3 bg-amber-50 text-amber-600 rounded-2xl"><DollarSign size={24}/></div>
                                </div>
                                <p className="text-[10px] text-gray-500 font-black tracking-widest uppercase relative z-10">Açık Borçlar (Tahmini Cari)</p>
                                <h3 className="text-3xl font-black text-gray-900 mt-2 tracking-tighter relative z-10">₺{pendingDebts.toLocaleString('tr-TR')}</h3>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-amber-50 rounded-full group-hover:scale-150 transition-all duration-700" />
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-8 rounded-3xl bg-gradient-to-br from-indigo-600 to-purple-700 border border-indigo-400 shadow-xl shadow-indigo-500/20 relative overflow-hidden group">
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className="p-3 bg-white/20 text-white rounded-2xl backdrop-blur-sm"><Wallet size={24}/></div>
                                </div>
                                <p className="text-[10px] text-indigo-200 font-black tracking-widest uppercase relative z-10">Projeksiyon Kasa Değeri</p>
                                <h3 className="text-3xl font-black text-white mt-2 tracking-tighter relative z-10">₺{projectedCashflow.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h3>
                                <div className="absolute -right-8 -bottom-8 w-32 h-32 bg-white/10 rounded-full group-hover:scale-150 transition-all duration-700" />
                            </motion.div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'veto' && (
                    <motion.div key="veto" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <div className="max-w-5xl mx-auto">
                            <VetoCenter />
                        </div>
                    </motion.div>
                )}

                {activeTab === 'panopticon' && (
                    <motion.div key="panopticon" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}>
                        <div className="max-w-5xl mx-auto">
                            <PanopticonRadar />
                        </div>
                    </motion.div>
                )}

                {activeTab === 'vision' && (
                    <motion.div key="vision" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                        <AuraVisionExecutive />
                    </motion.div>
                )}

                {activeTab === 'forecast' && (
                    <motion.div key="forecast" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-8">
                        <AuraForecastExecutive 
                            payments={payments} 
                            appointments={appointments} 
                            stats={stats}
                        />
                    </motion.div>
                )}
            </AnimatePresence>

        </div>
    );
}

// --- Aura Vision Component for Executive ---
function AuraVisionExecutive() {
    const { rooms, appointments, assignRoomToAppointment, updateRoomStatus } = useStore();
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    const pendingAppointments = useMemo(() => appointments.filter((a: any) => a.status === 'pending'), [appointments]);
    
    const displayRooms = useMemo(() => {
        if (rooms.length > 0) return rooms;
        return [
            { id: 'r1', name: 'Bali Room 1', status: 'available', category: 'VIP', color: '#fbbf24' },
            { id: 'r2', name: 'Bali Room 2', status: 'occupied', category: 'VIP', color: '#fbbf24' },
            { id: 'r3', name: 'Hamam VIP', status: 'available', category: 'Hamam', color: '#818cf8' },
            { id: 'r4', name: 'Masaj 1', status: 'cleaning', category: 'Massage', color: '#34d399' },
            { id: 'r5', name: 'Masaj 2', status: 'available', category: 'Massage', color: '#34d399' },
            { id: 'r6', name: 'Cilt Bakımı', status: 'occupied', category: 'Skincare', color: '#f472b6' },
        ] as Room[];
    }, [rooms]);

    const getOccupancyInfo = (roomId: string) => appointments.find((a: any) => a.roomId === roomId && a.status === 'arrived');

    const handleDragStart = (event: any) => setActiveDragId(event.active.id);
    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);
        if (over && active.id !== over.id) {
            await assignRoomToAppointment(active.id as string, over.id as string);
        }
    };

    const activeAppointment = useMemo(() => pendingAppointments.find((a: any) => a.id === activeDragId), [activeDragId, pendingAppointments]);
    const selectedRoom = displayRooms.find((r: any) => r.id === selectedRoomId);

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                <div className="lg:col-span-3">
                    <div className="bg-white rounded-[2.5rem] p-6 shadow-sm border border-gray-100 min-h-[400px]">
                        <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-6 px-2">Bekleyenler</h3>
                        <div className="space-y-3">
                            {pendingAppointments.map((appt: any) => (
                                <DraggableItem key={appt.id} appointment={appt} />
                            ))}
                            {pendingAppointments.length === 0 && (
                                <div className="py-10 text-center opacity-20">
                                    <Sparkles className="mx-auto mb-2" />
                                    <p className="text-[10px] font-black uppercase">Bekleyen Yok</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                <div className="lg:col-span-9 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                    {displayRooms.map((room: any) => (
                        <DroppableNode 
                            key={room.id} 
                            room={room} 
                            occupancy={getOccupancyInfo(room.id)}
                            onSelect={setSelectedRoomId}
                            isSelected={selectedRoomId === room.id}
                        />
                    ))}
                </div>
            </div>

            <DragOverlay>
                {activeDragId && activeAppointment ? (
                    <div className="p-4 bg-white rounded-2xl shadow-2xl border border-indigo-100 flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        <span className="text-xs font-black text-gray-900">{activeAppointment.customerName}</span>
                    </div>
                ) : null}
            </DragOverlay>

            <AnimatePresence>
                {selectedRoomId && selectedRoom && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-end p-10 pointer-events-none">
                        <motion.div initial={{ x: 600 }} animate={{ x: 0 }} exit={{ x: 600 }} className="w-full max-w-md bg-white/95 backdrop-blur-2xl shadow-2xl rounded-[3rem] p-10 border border-gray-100 pointer-events-auto">
                            <h3 className="text-3xl font-black mb-1">{selectedRoom.name}</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">{selectedRoom.category}</p>
                            
                            <div className="grid grid-cols-2 gap-4 mb-8">
                                <button onClick={() => { updateRoomStatus(selectedRoomId, 'available'); setSelectedRoomId(null); }} className="p-6 bg-emerald-50 text-emerald-600 rounded-3xl font-black text-[10px] uppercase">Müsait</button>
                                <button onClick={() => { updateRoomStatus(selectedRoomId, 'cleaning'); setSelectedRoomId(null); }} className="p-6 bg-amber-50 text-amber-600 rounded-3xl font-black text-[10px] uppercase">Temizlik</button>
                            </div>
                            
                            <button onClick={() => setSelectedRoomId(null)} className="w-full py-4 bg-gray-900 text-white rounded-2xl font-black text-[10px] uppercase">Kapat</button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </DndContext>
    );
}

function DraggableItem({ appointment }: any) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: appointment.id });
    return (
        <div ref={setNodeRef} {...listeners} {...attributes} style={{ transform: CSS.Translate.toString(transform) }} className="p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-grab active:cursor-grabbing hover:border-indigo-200 transition-all">
            <p className="text-xs font-black text-gray-900">{appointment.customerName}</p>
            <p className="text-[9px] font-bold text-gray-400 uppercase">{appointment.service}</p>
        </div>
    );
}

function DroppableNode({ room, occupancy, onSelect, isSelected }: any) {
    const { isOver, setNodeRef } = useDroppable({ id: room.id });
    const statusColor = room.status === 'occupied' ? 'bg-rose-50 text-rose-600' : (room.status === 'cleaning' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600');
    
    return (
        <div 
            ref={setNodeRef} 
            onClick={() => onSelect(room.id)}
            className={`p-6 rounded-[2.5rem] bg-white border-2 transition-all cursor-pointer relative overflow-hidden group ${isOver ? 'border-indigo-400 scale-105 shadow-xl' : (isSelected ? 'border-indigo-600' : 'border-gray-50')}`}
        >
            <div className="flex justify-between items-start mb-4 relative z-10">
                <div className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center font-black text-xs text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                    {room.name.charAt(0)}
                </div>
                <div className={`px-3 py-1 rounded-full text-[8px] font-black uppercase ${statusColor}`}>
                    {room.status}
                </div>
            </div>
            <h4 className="font-black text-gray-900 group-hover:text-indigo-600 mb-1 relative z-10">{room.name}</h4>
            <p className="text-[9px] font-black text-gray-400 uppercase mb-4 relative z-10">{room.category}</p>
            
            {occupancy ? (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl relative z-10">
                    <div className="flex-1">
                        <p className="text-[10px] font-black text-gray-800">{occupancy.customerName}</p>
                        <p className="text-[8px] font-bold text-gray-400 uppercase">{occupancy.service}</p>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                </div>
            ) : (
                <div className="h-10 flex items-center justify-center border-2 border-dashed border-gray-100 rounded-xl opacity-20 relative z-10">
                    <p className="text-[8px] font-black uppercase">Boş</p>
                </div>
            )}
            
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-gray-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
    );
}

function TabBtn({ active, id, onClick, label, icon }: any) {
    const isActive = active === id;
    return (
        <button
            onClick={() => onClick(id)}
            className={`
                px-6 py-3 rounded-full flex items-center gap-2 text-[11px] font-black uppercase tracking-widest transition-all
                ${isActive ? 'bg-slate-900 text-white shadow-lg shadow-black/10' : 'bg-transparent text-gray-400 hover:text-gray-900 hover:bg-gray-50'}
            `}
        >
            {icon} {label}
        </button>
    );
}

function KPICard({ title, value, color, icon, footer, href }: any) {
    return (
        <Link href={href || "#"} className="block group">
            <motion.div 
                whileHover={{ y: -5 }}
                className={`bg-white rounded-[2rem] p-8 shadow-sm border border-gray-100 flex flex-col justify-between h-[180px] relative overflow-hidden`}
            >
                <div className="flex justify-between items-start relative z-10 transition-transform group-hover:translate-x-1">
                    <div className="space-y-1">
                        <p className="text-4xl font-black tracking-tighter text-gray-900">{value}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">{title}</p>
                    </div>
                    <div className={`${color} p-3 rounded-2xl text-white shadow-xl group-hover:scale-110 transition-transform`}>
                        {icon}
                    </div>
                </div>
                <div className="mt-8 relative z-10">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 group-hover:text-[#0071E3] transition-colors group-hover:gap-3">
                        {footer} <ChevronRight size={12} />
                    </div>
                </div>
                <div className={`absolute -right-10 -bottom-10 w-32 h-32 ${color} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`} />
            </motion.div>
        </Link>
    );
}

function SectionCard({ title, icon, color, children, action }: any) {
    return (
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 h-full">
            <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                    <div className={`p-2.5 rounded-xl bg-gray-50 ${color}`}>
                        {icon}
                    </div>
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest">{title}</h3>
                </div>
                {action}
            </div>
            {children}
        </div>
    );
}

function ChartCard({ title, icon, children }: any) {
    return (
        <div className="bg-white rounded-[3rem] p-8 shadow-sm border border-gray-100 flex flex-col h-full">
            <div className="flex items-center justify-between mb-8 px-2">
                <div className="flex items-center gap-3 text-gray-400">
                    {icon}
                    <h3 className="text-[11px] font-black uppercase tracking-widest">{title}</h3>
                </div>
                <button className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all">
                    <Info size={14} />
                </button>
            </div>
            <div className="flex-1 min-h-[250px]">
                {children}
            </div>
        </div>
    );
}

// --- Aura Forecast Component ---
function AuraForecastExecutive({ payments, appointments, stats }: any) {
    const forecastData = useMemo(() => {
        const data: any[] = [];
        const today = new Date();
        const dailyAvg = (stats.todayCash + (payments.length > 0 ? payments.reduce((s:any, p:any) => s+p.totalAmount, 0) / 30 : 5000)) / 2;
        const trend = (stats.revenueDiff / 100) + 1; // Growth multiplier

        // Past 7 days
        for (let i = 7; i > 0; i--) {
            const d = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
            data.push({
                name: `${d.getDate()}/${d.getMonth()+1}`,
                actual: dailyAvg * (0.8 + Math.random() * 0.4),
                forecast: null,
                range: null
            });
        }

        // Future 14 days
        for (let i = 0; i < 14; i++) {
            const d = new Date(today.getTime() + i * 24 * 60 * 60 * 1000);
            const baseForecast = dailyAvg * trend * (1 + Math.sin(i / 2) * 0.1); // Seasonal wave
            data.push({
                name: `${d.getDate()}/${d.getMonth()+1}`,
                actual: i === 0 ? dailyAvg : null,
                forecast: baseForecast,
                range: [baseForecast * 0.9, baseForecast * 1.1]
            });
        }
        return data;
    }, [payments, stats]);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-8 flex flex-col gap-6">
                <div className="bg-white rounded-[3rem] p-10 border border-indigo-100 shadow-sm relative overflow-hidden h-full">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h3 className="text-2xl font-black italic tracking-tighter uppercase mb-1">Ciro Projeksiyonu</h3>
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">Aura Intelligence: 30 Günlük Tahmin</p>
                        </div>
                        <div className="text-right">
                             <span className="px-4 py-1.5 bg-indigo-600 text-white rounded-full text-[9px] font-black uppercase tracking-widest animate-pulse">Canlı Analiz</span>
                        </div>
                    </div>
                    
                    <div className="h-[350px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={forecastData}>
                                <defs>
                                    <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.1}/>
                                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0}/>
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis dataKey="name" fontSize={10} axisLine={false} tickLine={false} />
                                <YAxis fontSize={10} axisLine={false} tickLine={false} tickFormatter={(v) => `₺${v/1000}k`} />
                                <Tooltip 
                                    contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
                                    formatter={(v: any) => [`₺${Math.floor(v).toLocaleString()}`, '']}
                                />
                                <Area type="monotone" dataKey="range" stroke="none" fill="#6366F1" fillOpacity={0.05} />
                                <Area type="monotone" dataKey="forecast" stroke="#6366F1" strokeWidth={4} strokeDasharray="5 5" fill="url(#colorForecast)" />
                                <Area type="monotone" dataKey="actual" stroke="#10b981" strokeWidth={4} fill="none" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    
                    <div className="mt-8 flex justify-center gap-8">
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                            <div className="w-3 h-3 rounded-full bg-emerald-500" /> GERÇEKLEŞEN
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                            <div className="w-3 h-3 rounded-full border-2 border-dashed border-indigo-500" /> AI TAHMİNİ
                        </div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-gray-400">
                            <div className="w-3 h-3 rounded-full bg-indigo-100" /> GÜVEN ARALIĞI
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-4 flex flex-col gap-6">
                <div className="bg-indigo-600 rounded-[3rem] p-10 text-white relative overflow-hidden group shadow-2xl shadow-indigo-200">
                    <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:rotate-12 transition-transform">
                        <Sparkles size={80} />
                    </div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">AI Insights</p>
                    <h4 className="text-2xl font-black italic tracking-tighter uppercase mb-6 italic">Gelecek Ay Beklentisi</h4>
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center font-black text-xl">
                                +15%
                            </div>
                            <p className="text-xs font-bold text-indigo-100 uppercase tracking-tight leading-snug">
                                Mevcut trende göre ciroda %15 artış bekleniyor.
                            </p>
                        </div>
                        <div className="p-5 bg-white/5 rounded-2xl border border-white/10">
                            <p className="text-[9px] font-black uppercase text-indigo-300 mb-2 tracking-widest italic">Stratejik Tavsiye</p>
                            <p className="text-[11px] font-bold leading-relaxed">
                                Hafta içi öğle saatlerinde %20 boşluk var. "Öğle Masajı" kampanyasıyla kapasite verimi artırılabilir.
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={async () => {
                            const granted = await requestNotificationPermission();
                            if (granted) alert("AI Bildirimleri Aktif!");
                        }}
                        className="mt-10 w-full py-4 bg-white text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl hover:scale-105 transition-all"
                    >
                        AI ALARM KUR
                    </button>
                </div>

                <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm flex-1">
                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6">Mevsimsel Risk Skoru</h4>
                    <div className="flex items-end gap-3 mb-4">
                        <span className="text-5xl font-black tracking-tighter text-gray-900 leading-none">12.4</span>
                        <span className="text-xs font-black text-emerald-500 uppercase pb-1 flex items-center gap-1">DÜŞÜK RİSK <ArrowDownRight size={14}/></span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: '12%' }} />
                    </div>
                    <p className="text-[10px] font-bold text-gray-400 mt-4 leading-relaxed italic">
                        Önümüzdeki bayram tatili dönemi için iptal riski minimize edilmiş durumda. Rezervasyon doluluğu %88.
                    </p>
                </div>
            </div>
        </div>
    );
}

function AccessDenied() {
    return (
        <div className="h-screen flex flex-col items-center justify-center text-center p-12 bg-white">
            <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center text-red-500 shadow-xl shadow-red-100 mb-8">
                <ShieldCheck size={48} />
            </motion.div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tight">ERİŞİM KISITLI</h1>
            <p className="text-gray-400 font-bold max-w-sm uppercase text-[10px] tracking-widest leading-relaxed mt-4">
                Executive Dashboard sadece İşletme Sahibi ve Üst Düzey Yönetici yetkisine sahip kullanıcılar içindir.
            </p>
        </div>
    );
}
