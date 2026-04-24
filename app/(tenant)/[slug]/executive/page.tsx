"use client";

import { useStore, Branch, Payment, Appointment, Expense, Customer, AuditLog, SystemAnnouncement } from "@/lib/store";
import { 
    Users, Calendar, Wallet, TrendingUp, 
    Bell, Megaphone, DollarSign, Activity,
    TrendingDown, Search, ArrowUpRight, ArrowDownRight,
    Zap, Star, Award, LayoutGrid, Sparkles,
    ChevronRight, Info, AlertTriangle, ShieldCheck,
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

export default function ExecutiveDashboard() {
    const params = useParams();
    const slug = params?.slug as string;
    
    const { 
        branches, payments, appointments, customers, 
        expenses, allLogs, can, fetchData, systemAnnouncements 
    } = useStore();

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

    return (
        <div className="bg-[#E4E9F0] min-h-screen p-8 space-y-8 font-sans overflow-x-hidden pt-12">
            
            {/* Top KPI row */}
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
                    title="Günün Kasa Toplamı" 
                    value={`${stats.todayCash.toLocaleString('tr-TR')} TRY`} 
                    color="bg-purple-600" 
                    icon={<Wallet size={24} />} 
                    footer="KASAYA GÖZ AT"
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

            {/* Middle Section: Notifications & Announcements & Rates */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Notifications */}
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

                {/* Announcements - REAL DATA */}
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

                {/* Exchange Rates - REAL API DATA */}
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

            {/* Bottom Row 1: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Tahsilat - Satış */}
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

                {/* Heatmap - REAL DATA */}
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

                {/* Most Sold Service */}
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

            {/* Bottom Row 2: Radar & Distribution */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 pb-20">
                {/* Radar Chart */}
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

                {/* Pie Chart: Distribution */}
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

                {/* Growth Line Chart */}
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

        </div>
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
                {/* Decoration */}
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
