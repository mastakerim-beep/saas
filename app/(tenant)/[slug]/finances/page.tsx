"use client";

import { useMemo, useState, useEffect } from "react";
import { useStore } from "@/lib/store";
import { 
  AlertTriangle, TrendingUp, Wallet, ShieldAlert, Receipt, 
  Award, Zap, LayoutGrid, PieChart as PieChartIcon, ArrowUpRight,
  Calendar, MapPin, Download, Sparkles, ChevronRight, Info
} from "lucide-react";
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { format, subDays, isWithinInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { tr } from 'date-fns/locale';
import { exportFinancialBooklet } from "@/lib/utils/export-utils";

export default function FinancesPage() {
  const { 
    appointments, payments, debts, calculateCommission, 
    expenses, staffMembers, branches, currentBusiness 
  } = useStore();

  const [isMounted, setIsMounted] = useState(false);
  const [dateRange, setDateRange] = useState({
      start: subDays(new Date(), 30),
      end: new Date()
  });
  const [selectedBranchId, setSelectedBranchId] = useState<string | 'all'>('all');
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Filter Data
  const filteredPayments = useMemo(() => {
      return payments.filter((p: any) => {
          const pDate = parseISO(p.date);
          const inDate = isWithinInterval(pDate, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) });
          const inBranch = selectedBranchId === 'all' || p.branchId === selectedBranchId;
          return inDate && inBranch;
      });
  }, [payments, dateRange, selectedBranchId]);

  const filteredAppointments = useMemo(() => {
    return appointments.filter((a: any) => {
        const aDate = parseISO(a.date);
        const inDate = isWithinInterval(aDate, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) });
        const inBranch = selectedBranchId === 'all' || a.branchId === selectedBranchId;
        return inDate && inBranch;
    });
  }, [appointments, dateRange, selectedBranchId]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter((e: any) => {
        const eDate = parseISO(e.date);
        const inDate = isWithinInterval(eDate, { start: startOfDay(dateRange.start), end: endOfDay(dateRange.end) });
        const inBranch = selectedBranchId === 'all' || e.branchId === selectedBranchId;
        return inDate && inBranch;
    });
  }, [expenses, dateRange, selectedBranchId]);

  const filteredDebts = useMemo(() => {
    return debts.filter((d: any) => {
        const inBranch = selectedBranchId === 'all' || d.branchId === selectedBranchId;
        return inBranch;
    });
  }, [debts, selectedBranchId]);

  // Calculations
  const totalExpected = filteredAppointments.reduce((s: number, a: any) => s + (a.status === 'completed' || a.status === 'pending' ? a.price : 0), 0);
  const totalCollected = filteredPayments.reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
  const totalActiveDebt = filteredDebts.filter((d: any) => d.status === 'açık').reduce((s: number, d: any) => s + d.amount, 0);
  
  const staffCommData = useMemo(() => {
    return staffMembers.map((st: any) => {
        const staffAppointments = filteredAppointments.filter((a: any) => (a.staffId === st.id || a.staffName === st.name) && a.status === 'completed');
        const totalSales = staffAppointments.reduce((s: number, a: any) => s + a.price, 0);
        const totalComm = staffAppointments.reduce((s: number, a: any) => s + calculateCommission(st.id, a.service, a.price), 0);
        return { 
            name: st.name, 
            sales: totalSales, 
            commission: totalComm,
            performance: Math.min(100, Math.round((totalSales / 50000) * 100)) // Hedef: 50k
        };
    }).filter((s: any) => s.sales > 0 || s.commission > 0).sort((a: any, b: any) => b.sales - a.sales);
  }, [staffMembers, filteredAppointments, calculateCommission]);

  const totalCommissions = staffCommData.reduce((s: number, d: any) => s + d.commission, 0);
  const totalOtherExpenses = filteredExpenses.reduce((s: number, e: any) => s + e.amount, 0);
  const totalExpenses = totalCommissions + totalOtherExpenses;
  const netProfit = totalCollected - totalExpenses;

  // Real AI Insights Generator
  const aiInsight = useMemo(() => {
    if (totalCollected === 0) return "Seçili dönemde tahsilat verisi bulunmuyor. Şube operasyonları ve ödeme girişleri başladığında analiz motoru aktifleşecektir.";
    
    const avgSale = totalCollected / (filteredPayments.length || 1);
    const debtRatio = (totalActiveDebt / (totalCollected + totalActiveDebt || 1)) * 100;
    const expenseRatio = (totalExpenses / (totalCollected || 1)) * 100;
    
    let text = `Bu dönemde ortalama işlem tutarı ₺${Math.floor(avgSale).toLocaleString('tr-TR')} olarak gerçekleşti. `;
    
    if (debtRatio > 15) {
        text += `Açık hesap oranı (%${debtRatio.toFixed(1)}) yüksek seyrediyor; tahsilat birimiyle koordinasyon önerilir. `;
    } else {
        text += "Nakit akışı ve tahsilat dengesi oldukça sağlıklı görünüyor. ";
    }
    
    if (expenseRatio > 40) {
        text += `Gider kalemleri cironun %${expenseRatio.toFixed(0)}'ine ulaştı. Operasyonel maliyet kontrolü kritik.`;
    } else {
        text += "Mevcut kar marjı sürdürülebilir büyüme hedefleriyle uyumlu.";
    }
    
    return text;
  }, [totalCollected, filteredPayments.length, totalActiveDebt, totalExpenses]);

  const suspiciousActivities: any[] = useMemo(() => {
    const leaks: any[] = [];
    filteredAppointments.filter((a: any) => 
        a.status === 'completed' && a.price > 0 && 
        !payments.some((p: any) => p.appointmentId === a.id) &&
        !debts.some((d: any) => d.appointmentId === a.id)
    ).forEach((a: any) => {
        leaks.push({
            type: 'Kayıtsız İşlem',
            desc: `${a.customerName} için ${a.service} randevusu tahsilat girişi yapılmadan kapatıldı.`,
            severity: 'high',
            date: a.date
        });
    });
    return leaks;
  }, [filteredAppointments, payments, debts]);

  const chartData = useMemo(() => {
    const result = [];
    for (let i = 6; i >= 0; i--) {
        const d = subDays(dateRange.end, i);
        const dateStr = format(d, 'yyyy-MM-dd');
        const dailyCiro = filteredPayments.filter((p: any) => p.date === dateStr).reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
        const dailyExpense = filteredExpenses.filter((e: any) => e.date === dateStr).reduce((s: number, e: any) => s + (e.amount || 0), 0);
        result.push({ 
            name: format(d, 'dd MMM', { locale: tr }), 
            ciro: dailyCiro, 
            kar: Math.max(0, dailyCiro - dailyExpense) 
        });
    }
    return result;
  }, [filteredPayments, filteredExpenses, dateRange]);

  const handleDownloadBooklet = () => {
    exportFinancialBooklet({
        businessName: currentBusiness?.name || 'Aura Spa',
        period: `${format(dateRange.start, 'dd.MM.yyyy')} - ${format(dateRange.end, 'dd.MM.yyyy')}`,
        stats: [
            { label: "Toplam Beklenen Gelir", value: `₺${totalExpected.toLocaleString('tr-TR')}` },
            { label: "Net Tahsilat", value: `₺${totalCollected.toLocaleString('tr-TR')}` },
            { label: "Toplam Gider & Prim", value: `₺${totalExpenses.toLocaleString('tr-TR')}` },
            { label: "Net Kar", value: `₺${netProfit.toLocaleString('tr-TR')}` }
        ],
        staffData: staffCommData,
        chartData: chartData,
        suspicious: suspiciousActivities
    });
  };

  const handleDatePreset = (days: number) => {
      setDateRange({
          start: subDays(new Date(), days),
          end: new Date()
      });
      setIsDatePickerOpen(false);
  };

  // Trend Calculations
  const prevDateRange = {
    start: subDays(dateRange.start, Math.max(1, Math.floor((dateRange.end.getTime() - dateRange.start.getTime()) / 86400000))),
    end: dateRange.start
  };

  const getPeriodStats = (start: Date, end: Date) => {
    const pSteps = payments.filter((p: any) => {
        const d = parseISO(p.date);
        return isWithinInterval(d, { start: startOfDay(start), end: endOfDay(end) }) && (selectedBranchId === 'all' || p.branchId === selectedBranchId);
    });
    const aSteps = appointments.filter((a: any) => {
        const d = parseISO(a.date);
        return isWithinInterval(d, { start: startOfDay(start), end: endOfDay(end) }) && (selectedBranchId === 'all' || a.branchId === selectedBranchId);
    });
    const dSteps = debts.filter((d: any) => (selectedBranchId === 'all' || d.branchId === selectedBranchId));
    
    const collected = pSteps.reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
    const expected = aSteps.reduce((s: number, a: any) => s + (a.status === 'completed' ? a.price : 0), 0);
    const debt = dSteps.filter((d: any) => d.status === 'açık').reduce((s: number, d: any) => s + d.amount, 0);
    
    return { collected, expected, debt };
  };

  const currentStats = { collected: totalCollected, expected: totalExpected, debt: totalActiveDebt, commissions: totalCommissions };
  const previousStats = useMemo(() => {
    const stats = getPeriodStats(prevDateRange.start, prevDateRange.end);
    // Commission for previous period is harder to calculate exactly without full re-run, so we estimate or use 0 for now to keep it safe
    return { ...stats, commissions: 0 }; 
  }, [prevDateRange.start, prevDateRange.end, selectedBranchId]);

  const calcTrend = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? '+100%' : '0%';
    const pct = ((curr - prev) / prev) * 100;
    return `${pct >= 0 ? '+' : ''}${pct.toFixed(1)}%`;
  };

  const kpis = [
    { label: "Beklenen Gelir", val: totalExpected, icon: Receipt, color: "text-indigo-600", bg: "bg-indigo-50", trend: calcTrend(currentStats.expected, previousStats.expected), chartColor: "#4f46e5" },
    { label: "Net Tahsilat", val: totalCollected, icon: Wallet, color: "text-emerald-500", bg: "bg-emerald-50", trend: calcTrend(currentStats.collected, previousStats.collected), chartColor: "#10b981" },
    { label: "Açık Hesap", val: totalActiveDebt, icon: AlertTriangle, color: "text-rose-500", bg: "bg-rose-50", trend: calcTrend(currentStats.debt, previousStats.debt), chartColor: "#f43f5e" },
    { label: "Personel Prim", val: totalCommissions, icon: Award, color: "text-purple-600", bg: "bg-purple-50", trend: calcTrend(currentStats.commissions, previousStats.commissions), chartColor: "#8b5cf6" },
  ];

  if (!isMounted) return null;

  return (
    <div className="p-8 max-w-[1600px] mx-auto animate-[fadeIn_0.5s_ease] space-y-8 pb-32">
      
      {/* HEADER & FILTERS */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-5xl font-black tracking-tight text-indigo-950 dark:text-white italic">Aura Finans</h1>
            <div className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black rounded-full shadow-lg shadow-indigo-200">Sürüm 3.0</div>
          </div>
          <div className="flex items-center gap-4">
            <p className="text-indigo-500 font-bold text-sm flex items-center gap-2 opacity-60">
                <Zap className="w-4 h-4 fill-indigo-500" /> Yapay zeka destekli finansal denetim motoru aktif.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3 bg-white/50 dark:bg-indigo-900/20 backdrop-blur-xl p-3 rounded-[2.5rem] border border-white dark:border-indigo-500/10 shadow-2xl shadow-indigo-100/50 relative z-[30]">
            {/* Branch Switcher */}
            <div className="flex items-center gap-2 px-4 py-3 bg-white dark:bg-indigo-950 rounded-[1.5rem] border border-indigo-50 dark:border-indigo-800 shadow-sm relative">
                <MapPin size={16} className="text-indigo-500" />
                <select 
                    value={selectedBranchId}
                    onChange={(e) => setSelectedBranchId(e.target.value)}
                    className="bg-transparent border-none text-[11px] font-black text-indigo-950 dark:text-white uppercase tracking-widest focus:ring-0 cursor-pointer appearance-none pr-8"
                >
                    <option value="all">TÜM ŞUBELER</option>
                    {branches.map((b: any) => (
                        <option key={b.id} value={b.id}>{b.name.toUpperCase()}</option>
                    ))}
                </select>
                <ChevronRight size={12} className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-indigo-300 pointer-events-none" />
            </div>

            {/* Functional Date Preset Picker */}
            <div className="relative">
                <button 
                    onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    className="flex items-center gap-3 px-6 py-3 bg-white dark:bg-indigo-950 rounded-[1.5rem] border border-indigo-50 dark:border-indigo-800 shadow-sm hover:border-indigo-300 transition-all"
                >
                    <Calendar size={16} className="text-indigo-500" />
                    <span className="text-[11px] font-black text-indigo-950 dark:text-white uppercase tracking-widest">
                        {format(dateRange.start, 'dd MMM')} - {format(dateRange.end, 'dd MMM')}
                    </span>
                </button>

                <AnimatePresence>
                    {isDatePickerOpen && (
                        <motion.div 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 10 }}
                            className="absolute top-full mt-2 left-0 w-48 bg-white dark:bg-indigo-950 p-2 rounded-2xl shadow-2xl border border-indigo-50 dark:border-indigo-800 z-[100]"
                        >
                            {[
                                { l: 'Bugün', d: 0 },
                                { l: 'Son 7 Gün', d: 7 },
                                { l: 'Son 30 Gün', d: 30 },
                                { l: 'Son 90 Gün', d: 90 },
                            ].map(p => (
                                <button 
                                    key={p.d}
                                    onClick={() => handleDatePreset(p.d)}
                                    className="w-full text-left px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 dark:hover:bg-indigo-900/50 rounded-lg transition-all"
                                >
                                    {p.l}
                                </button>
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Export Booklet */}
            <button 
                onClick={handleDownloadBooklet}
                className="flex items-center gap-3 px-8 py-4 bg-gradient-to-br from-indigo-600 to-violet-700 text-white rounded-[1.75rem] text-[11px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-indigo-200"
            >
                <Download size={16} />
                FINANSAL KITAPÇIK
            </button>
        </div>
      </div>

      {/* AI PREMIUM ADVISOR (Dynamic) */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-8 bg-gradient-to-r from-indigo-900 to-indigo-950 rounded-[3rem] border border-white/5 relative overflow-hidden group"
      >
          <div className="absolute top-0 right-0 p-12 opacity-10 group-hover:scale-110 transition-transform duration-1000">
              <Sparkles className="w-48 h-48 text-indigo-400" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center gap-8">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-400 to-purple-500 rounded-2xl flex items-center justify-center shrink-0 shadow-2xl shadow-indigo-500/50">
                  <BotIcon />
              </div>
              <div className="flex-1">
                  <h4 className="text-indigo-300 text-[10px] font-black uppercase tracking-[0.4em] mb-2">Aura AI Kıdemli Danışman</h4>
                  <p className="text-white text-xl font-medium tracking-tight leading-relaxed max-w-4xl">
                      "{aiInsight}"
                  </p>
              </div>
              <button 
                onClick={handleDownloadBooklet}
                className="px-6 py-3 bg-white/10 hover:bg-white/20 text-white text-[10px] font-black rounded-xl border border-white/10 transition-all uppercase tracking-widest"
              >
                Raporu Dışa Aktar
              </button>
          </div>
      </motion.div>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {kpis.map((item, i) => (
              <motion.div 
                key={i} 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className="card-apple p-8 flex flex-col justify-between group relative overflow-hidden"
              >
                  <div className="flex justify-between items-start mb-8 z-10">
                      <div className={`p-4 ${item.bg} dark:bg-indigo-900/30 rounded-[1.25rem] group-hover:scale-110 transition-transform`}><item.icon className={`w-6 h-6 ${item.color} dark:text-white`} /></div>
                      <div className={`px-3 py-1 rounded-full text-[10px] font-black ${item.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                          {item.trend}
                      </div>
                  </div>
                  <div className="z-10">
                    <div className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1">{item.label}</div>
                    <div className={`text-4xl font-black text-indigo-950 dark:text-white tracking-tighter`}>₺{item.val.toLocaleString('tr-TR')}</div>
                  </div>

                  {/* MINI SPARKLINE BACKGROUND */}
                  <div className="absolute bottom-0 left-0 right-0 h-16 opacity-10 group-hover:opacity-20 transition-opacity">
                      <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={chartData}>
                              <Area type="monotone" dataKey="ciro" stroke={item.chartColor} fill={item.chartColor} strokeWidth={0} />
                          </AreaChart>
                      </ResponsiveContainer>
                  </div>
              </motion.div>
          ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* MAIN CHART */}
          <div className="lg:col-span-2 card-apple p-10 relative overflow-hidden">
             <div className="flex justify-between items-center mb-10">
                 <div>
                    <h3 className="text-2xl font-black text-indigo-950 dark:text-white tracking-tight flex items-center gap-3">
                        <TrendingUp className="w-7 h-7 text-indigo-500" /> Performans Trendi
                    </h3>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mt-1">Ciro ve Net Kar Karşılaştırması</p>
                 </div>
                 <div className="flex gap-2">
                    <div className="flex items-center gap-2 px-3 py-2 bg-indigo-50 dark:bg-indigo-900/40 rounded-xl">
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" />
                        <span className="text-[9px] font-black text-indigo-900 dark:text-indigo-200 uppercase">Brüt Ciro</span>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 dark:bg-purple-900/40 rounded-xl">
                        <div className="w-2 h-2 bg-purple-500 rounded-full" />
                        <span className="text-[9px] font-black text-indigo-900 dark:text-indigo-200 uppercase">Net Kar</span>
                    </div>
                 </div>
             </div>

             <div className="h-[400px] w-full">
                {isMounted ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                                <linearGradient id="colorKar" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.4}/>
                                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" opacity={0.5} />
                            <XAxis 
                                dataKey="name" 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fontWeight: '900', fill: '#6366f1'}} 
                                dy={15} 
                            />
                            <YAxis 
                                axisLine={false} 
                                tickLine={false} 
                                tick={{fontSize: 10, fontWeight: '900', fill: '#94a3b8'}} 
                                tickFormatter={(val) => `₺${val / 1000}k`}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Area 
                                type="monotone" 
                                dataKey="ciro" 
                                stroke="#6366f1" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#colorCiro)" 
                                animationDuration={1500}
                                dot={{ r: 4, fill: '#6366f1', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#6366f1' }}
                            />
                            <Area 
                                type="monotone" 
                                dataKey="kar" 
                                stroke="#a855f7" 
                                strokeWidth={4} 
                                fillOpacity={1} 
                                fill="url(#colorKar)" 
                                animationDuration={2000}
                                dot={{ r: 4, fill: '#a855f7', strokeWidth: 2, stroke: '#fff' }}
                                activeDot={{ r: 8, strokeWidth: 0, fill: '#a855f7' }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="w-full h-full bg-gray-50 animate-pulse rounded-[2rem]" />
                )}
             </div>
          </div>

          {/* FRAUD ENGINE (Compact Version) */}
          <div className="bg-indigo-950 dark:bg-indigo-900/10 border border-white/5 rounded-[3rem] p-10 flex flex-col shadow-2xl text-white relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              
              <div className="flex items-center gap-4 mb-8">
                  <div className="w-14 h-14 bg-red-600 rounded-2xl flex items-center justify-center shadow-xl shadow-red-900/50"><ShieldAlert className="w-7 h-7" /></div>
                  <div>
                    <h4 className="text-[10px] font-black uppercase tracking-[0.3em] text-white opacity-60">Risk Denetim Motoru</h4>
                    <p className="text-red-500 font-black text-lg leading-none">{suspiciousActivities.length} Kritik Risk</p>
                  </div>
              </div>
              
              <div className="space-y-4 flex-1">
                 {suspiciousActivities.slice(0, 4).map((act, i) => (
                    <div key={i} className="bg-white/5 p-5 rounded-[1.75rem] border border-white/5 backdrop-blur-md hover:bg-white/10 transition-colors">
                        <p className="text-[9px] font-black text-red-500 uppercase mb-1 tracking-widest">{act.type}</p>
                        <p className="text-xs font-bold text-indigo-100 leading-snug opacity-90">{act.desc}</p>
                    </div>
                 ))}
                 {suspiciousActivities.length === 0 && (
                     <div className="py-20 text-center opacity-30">
                         <Zap className="w-16 h-16 text-indigo-400 mx-auto mb-4 animate-pulse" />
                         <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-200">Sistem Temiz</p>
                     </div>
                 )}
              </div>

              <button className="w-full mt-8 py-5 bg-white/10 hover:bg-white/20 transition-all rounded-2xl text-[11px] font-black uppercase tracking-widest text-white border border-white/10 flex items-center justify-center gap-2">
                  DENETİM MERKEZİNE GİT <ChevronRight size={14} />
              </button>
          </div>
      </div>

      {/* STAFF PERFORMANCE TABLE */}
      <div className="card-apple p-12 relative overflow-hidden">
          <div className="flex justify-between items-center mb-12">
              <div>
                <h3 className="text-3xl font-black text-indigo-950 dark:text-white tracking-tight flex items-center gap-3">
                    <PieChartIcon className="w-9 h-9 text-indigo-500" /> Personel Verimlilik & Prim
                </h3>
                <p className="text-[11px] text-indigo-400 font-bold uppercase tracking-widest mt-2">Dönemsel Performans ve Hak Ediş Matrisi</p>
              </div>
              <div className="px-6 py-3 bg-indigo-50 dark:bg-indigo-900/40 rounded-2xl">
                  <span className="text-[10px] font-black text-indigo-600 uppercase">Aktif Uzman Sayısı: <span className="text-lg ml-1">{staffCommData.length}</span></span>
              </div>
          </div>

          <div className="overflow-x-auto">
              <table className="w-full">
                  <thead>
                      <tr className="text-left border-b border-indigo-50 dark:border-indigo-500/10">
                          <th className="pb-8 text-[11px] font-black text-indigo-400 uppercase tracking-widest">Uzman / Terapist</th>
                          <th className="pb-8 text-[11px] font-black text-indigo-400 uppercase tracking-widest text-center">Toplam Ciro</th>
                          <th className="pb-8 text-[11px] font-black text-indigo-400 uppercase tracking-widest px-8">Verimlilik (Hedef: 50k)</th>
                          <th className="pb-8 text-[11px] font-black text-indigo-400 uppercase tracking-widest text-right text-indigo-600">Hak Ediş (Prim)</th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-indigo-50 dark:divide-indigo-500/10">
                      {staffCommData.map((st: any, i: number) => (
                          <tr key={i} className="group hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-all">
                              <td className="py-8">
                                  <div className="flex gap-4 items-center">
                                      <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                                          {st.name[0]}
                                      </div>
                                      <div>
                                        <p className="font-black text-indigo-950 dark:text-white text-base leading-none mb-1">{st.name}</p>
                                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.15em]">Kıdemli Uzman</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="py-8 text-center">
                                  <div className="inline-block px-4 py-2 bg-slate-50 dark:bg-slate-800/50 rounded-xl font-bold text-indigo-950 dark:text-white">
                                      ₺{st.sales.toLocaleString('tr-TR')}
                                  </div>
                              </td>
                              <td className="py-8 px-8">
                                  <div className="flex flex-col gap-2">
                                      <div className="flex justify-between text-[10px] font-black text-indigo-900 dark:text-white">
                                          <span>%{st.performance}</span>
                                          <span className="opacity-50">HEdef UYUMLULUK</span>
                                      </div>
                                      <div className="w-full h-2.5 bg-indigo-100/50 dark:bg-indigo-900/30 rounded-full overflow-hidden border border-indigo-50 dark:border-indigo-800">
                                          <motion.div 
                                            initial={{ width: 0 }}
                                            animate={{ width: `${st.performance}%` }}
                                            className={`h-full bg-gradient-to-r ${st.performance > 80 ? 'from-emerald-400 to-teal-500' : 'from-indigo-500 to-violet-600'} rounded-full`}
                                          />
                                      </div>
                                  </div>
                              </td>
                              <td className="py-8 text-right">
                                  <div className="flex flex-col items-end">
                                      <p className="font-black text-3xl text-indigo-600 tracking-tighter">₺{st.commission.toLocaleString('tr-TR')}</p>
                                      <div className="flex items-center gap-1 mt-1">
                                          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                                          <p className="text-[9px] font-black text-emerald-600 uppercase tracking-widest">Tahakkuk Etti</p>
                                      </div>
                                  </div>
                              </td>
                          </tr>
                      ))}
                  </tbody>
               </table>
          </div>
      </div>
    </div>
  );
}

// PREMIUM TOOLTIP
function CustomTooltip({ active, payload, label }: any) {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 dark:bg-indigo-950/90 backdrop-blur-2xl p-6 rounded-[2rem] shadow-2xl border border-indigo-50 dark:border-indigo-800/50 min-w-[200px]">
                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-4 border-b border-indigo-50 dark:border-indigo-800 pb-2">{label}</p>
                <div className="space-y-3">
                    {payload.map((p: any, i: number) => (
                        <div key={i} className="flex justify-between items-center gap-8">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
                                <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase">{p.name === 'ciro' ? 'BRÜT CİRO' : 'NET KAR'}</span>
                            </div>
                            <span className="text-sm font-black text-indigo-950 dark:text-white">₺{p.value.toLocaleString('tr-TR')}</span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }
    return null;
}

function BotIcon() {
    return (
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2Z" stroke="white" strokeWidth="2"/>
            <path d="M8 12H16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <path d="M12 8L12 16" stroke="white" strokeWidth="2" strokeLinecap="round"/>
            <circle cx="9" cy="11" r="1.5" fill="white"/>
            <circle cx="15" cy="11" r="1.5" fill="white"/>
        </svg>
    )
}
