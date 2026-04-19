"use client";

import { useStore, Payment, Expense, Customer, PaymentDefinition, AppUser } from "@/lib/store";
import { 
    Wallet, Search, Calendar, Filter, ArrowUpRight, 
    Landmark, Banknote, Users, Info, ChevronDown,
    Plus, Minus, Download, Save, History, Activity,
    TrendingUp, Scale, Receipt, Trash2, Edit3, ChevronRight, RefreshCcw
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ExportDropdown from "@/components/ui/ExportDropdown";

export default function CashManagementPage() {
    const { 
        payments, expenses, customers, paymentDefinitions,
        currentBranch, can, currentUser, isInitialized, getTodayDate, fetchData
    } = useStore();

    const [isMounted, setIsMounted] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [dateRange, setDateRange] = useState({ 
        start: '', 
        end: '' 
    });
    const [searchQuery, setSearchQuery] = useState("");

    const today = useMemo(() => isMounted ? getTodayDate() : '', [isMounted, getTodayDate]);
    
    // Permission Lock Logic
    const hasPastAccess = useMemo(() => {
        if (!isMounted) return false;
        if (currentUser?.role?.toLowerCase() === 'saas_owner' || currentUser?.role?.toLowerCase() === 'business_owner') return true;
        return can('view_historical_finance');
    }, [isMounted, currentUser, can]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (isMounted && isInitialized && !dateRange.start) {
            const todayStr = getTodayDate();
            setDateRange({ start: todayStr, end: todayStr });
        }
    }, [isMounted, isInitialized, getTodayDate, dateRange.start]);

    const handleSearch = async () => {
        setIsRefreshing(true);
        try {
            await fetchData(undefined, undefined, true, dateRange.start, dateRange.end);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            setTimeout(() => setIsRefreshing(false), 300);
        }
    };

    const transactions = useMemo(() => {
        const pMap = payments
            .filter(p => {
                const d = p.date.split('T')[0];
                const isDateMatch = d >= dateRange.start && d <= dateRange.end;
                const isBranchMatch = p.branchId === currentBranch?.id;
                const isSearchMatch = p.customerName.toLowerCase().includes(searchQuery.toLowerCase());
                return isDateMatch && isBranchMatch && isSearchMatch;
            })
            .map(p => ({
                id: p.id,
                date: p.date,
                party: p.customerName,
                type: 'Para girişi' as const,
                info: 'Satış',
                refCode: p.referenceCode || p.id.substring(0, 5).toUpperCase(),
                method: p.methods?.[0]?.method || 'nakit',
                toolId: p.paymentDefinitionId || p.methods?.[0]?.toolId,
                note: p.note || '',
                amount: p.totalAmount,
                original: p
            }));

        const eMap = expenses
            .filter(e => {
                const d = e.date.split('T')[0];
                const isDateMatch = d >= dateRange.start && d <= dateRange.end;
                const isBranchMatch = e.branchId === currentBranch?.id;
                const isSearchMatch = e.desc.toLowerCase().includes(searchQuery.toLowerCase());
                return isDateMatch && isBranchMatch && isSearchMatch;
            })
            .map(e => ({
                id: e.id,
                date: e.date,
                party: 'Firma / Diğer',
                type: 'Para çıkışı' as const,
                info: e.category || 'Gider',
                refCode: e.id.substring(0, 5).toUpperCase(),
                method: 'nakit',
                toolId: null,
                note: e.desc,
                amount: e.amount,
                original: e
            }));

        return [...pMap, ...eMap].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments, expenses, dateRange, currentBranch, searchQuery]);

    const stats = useMemo(() => {
        const totalIncome = transactions.filter(t => t.type === 'Para girişi').reduce((s, t) => s + t.amount, 0);
        const totalExpense = transactions.filter(t => t.type === 'Para çıkışı').reduce((s, t) => s + t.amount, 0);
        
        const methodMap: any = {};
        const toolMap: any = {};

        transactions.filter(t => t.type === 'Para girişi').forEach(t => {
            methodMap[t.method] = (methodMap[t.method] || 0) + t.amount;
            if (t.toolId) {
                const tool = paymentDefinitions.find(pd => pd.id === t.toolId);
                const toolName = tool?.name || 'Diğer';
                toolMap[toolName] = (toolMap[toolName] || 0) + t.amount;
            }
        });

        return {
            income: totalIncome,
            expense: totalExpense,
            net: totalIncome - totalExpense,
            methods: Object.entries(methodMap),
            tools: Object.entries(toolMap)
        };
    }, [transactions, paymentDefinitions]);

    if (!isMounted || !isInitialized) {
        return (
            <div className="flex-1 flex flex-col items-center justify-center bg-white min-h-screen">
                <RefreshCcw className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest animate-pulse">Kasa Başlatılıyor...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#FBFBFD] min-h-screen p-10 space-y-10">
            {/* Page Header */}
            <header className="flex justify-between items-end">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">
                        <Wallet className="w-4 h-4" />
                        <span>Resmi Kayıtlar</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-indigo-950 uppercase italic italic-indigo">
                        Günün <span className="text-indigo-600">Kasası</span>
                    </h1>
                </motion.div>
                
                <div className="flex gap-4">
                    <ExportDropdown 
                        data={transactions}
                        filename={`Kasa_Raporu_${dateRange.start}_${dateRange.end}`}
                        title={`Gunun Kasasi Finansal Raporu (${dateRange.start} - ${dateRange.end})`}
                        headers={["Tarih", "Taraf", "Tip", "Detay", "Referans", "Yöntem", "Tutar"]}
                        excelMapping={(t) => ({
                            "Tarih": new Date(t.date).toLocaleDateString('tr-TR'),
                            "İşlem Tarafı": t.party,
                            "İşlem Tipi": t.type,
                            "Detay": t.note || t.info,
                            "Referans": t.refCode,
                            "Ödeme Yöntemi": t.method,
                            "Tutar": t.amount
                        })}
                        pdfMapping={(t) => [
                            new Date(t.date).toLocaleDateString('tr-TR'),
                            t.party,
                            t.type,
                            t.note || t.info,
                            t.refCode,
                            t.method,
                            `₺${t.amount.toLocaleString('tr-TR')}`
                        ]}
                    />
                    <button className="flex items-center gap-2 px-8 py-4 bg-indigo-950 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-indigo-200">
                        <Plus size={16} /> Yeni İşlem
                    </button>
                </div>
            </header>

            {/* Filter Section */}
            <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white p-8 rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-indigo-50 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center"
            >
                <div className="relative group col-span-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                    <input 
                        type="text" 
                        placeholder="İşlem veya Danışan Ara"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-4 bg-indigo-50/50 border-none rounded-2xl text-sm font-bold focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all placeholder:text-indigo-200"
                    />
                </div>

                <div className="flex items-center gap-4 bg-indigo-50/50 p-2 rounded-[2rem] border border-indigo-50 group">
                    <Calendar className="ml-3 text-indigo-300" size={18} />
                    <input 
                        type="date" 
                        value={dateRange.start}
                        max={today}
                        disabled={!hasPastAccess}
                        onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                        className="bg-transparent text-[11px] font-black text-indigo-950 p-2 outline-none cursor-pointer disabled:opacity-30 uppercase tracking-widest"
                    />
                    <div className="w-4 h-[2px] bg-indigo-200" />
                    <input 
                        type="date" 
                        value={dateRange.end}
                        max={today}
                        disabled={!hasPastAccess}
                        onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                        className="bg-transparent text-[11px] font-black text-indigo-950 p-2 outline-none cursor-pointer disabled:opacity-30 uppercase tracking-widest"
                    />
                    {!hasPastAccess && (
                        <div className="px-3 text-rose-500" title="Geçmiş Veri Kilidi">
                            <History size={16} className="animate-pulse" />
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4 justify-end">
                    <button 
                        onClick={() => setDateRange({ start: today, end: today })}
                        className="p-4 text-rose-500 bg-rose-50 rounded-2xl hover:bg-rose-100 transition-all border border-rose-100"
                    >
                        <Trash2 size={18} />
                    </button>
                    <button 
                        onClick={handleSearch}
                        disabled={isRefreshing}
                        className="flex-1 lg:flex-none px-12 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                        {isRefreshing ? <RefreshCcw size={16} className="animate-spin" /> : <Search size={16} />} 
                        {isRefreshing ? 'GÜNCELLENİYOR...' : 'FİLTRELE'}
                    </button>
                </div>
            </motion.div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-indigo-100/50 border border-indigo-50 relative overflow-hidden group"
                >
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner"><TrendingUp size={32} /></div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 opacity-60">Toplam Gelir</p>
                        <p className="text-4xl font-black text-indigo-950 tracking-tighter">₺{stats.income.toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-emerald-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-indigo-100/50 border border-indigo-50 relative overflow-hidden group"
                >
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[1.5rem] flex items-center justify-center mb-6 shadow-inner"><Minus size={32} strokeWidth={3} /></div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 opacity-60">Toplam Gider</p>
                        <p className="text-4xl font-black text-indigo-950 tracking-tighter">₺{stats.expense.toLocaleString('tr-TR')}</p>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-rose-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                </motion.div>

                <motion.div 
                    whileHover={{ y: -5 }}
                    className="bg-indigo-950 p-10 rounded-[3.5rem] shadow-2xl shadow-indigo-900/20 text-white relative overflow-hidden group"
                >
                    <div className="relative z-10 flex flex-col items-center">
                        <div className="w-16 h-16 bg-white/10 text-white rounded-[1.5rem] flex items-center justify-center mb-6 shadow-xl backdrop-blur-md border border-white/20"><Scale size={32} /></div>
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1.5 opacity-60">Net Mutabakat</p>
                        <p className="text-4xl font-black tracking-tighter">₺{stats.net.toLocaleString('tr-TR')}</p>
                    </div>
                    <Activity className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-1000" />
                </motion.div>
            </div>

            {/* Transaction Monitoring */}
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[4rem] shadow-2xl shadow-indigo-100/50 border border-indigo-50 overflow-hidden"
            >
                <div className="px-12 py-8 border-b border-indigo-50 flex justify-between items-center bg-gray-50/30">
                    <h3 className="font-black text-indigo-950 uppercase italic tracking-tighter flex items-center gap-3">
                        <Activity size={20} className="text-indigo-600" /> İŞLEM LOGLARI
                        <span className="ml-4 px-3 py-1 bg-indigo-100 text-indigo-600 rounded-full text-[10px] font-black uppercase not-italic">CANLI</span>
                    </h3>
                    <div className="flex gap-4">
                        {stats.methods.map(([method, amount]: any) => (
                             <div key={method} className="flex items-center gap-2 px-4 py-2 bg-white rounded-xl border border-indigo-50 shadow-sm">
                                <span className="text-[10px] font-black text-indigo-400 capitalize">{method}</span>
                                <span className="text-xs font-black text-indigo-950">₺{amount.toLocaleString('tr-TR')}</span>
                             </div>
                        ))}
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-indigo-50/50">
                                <th className="px-12 py-6 text-[10px] font-black text-indigo-400 uppercase tracking-widest">TARİH</th>
                                <th className="px-12 py-6 text-[10px] font-black text-indigo-400 uppercase tracking-widest">DANIŞAN / DETAY</th>
                                <th className="px-12 py-6 text-[10px] font-black text-indigo-400 uppercase tracking-widest">AKŞAM/TİP</th>
                                <th className="px-12 py-6 text-[10px] font-black text-indigo-400 uppercase tracking-widest">REFERANS</th>
                                <th className="px-12 py-6 text-[10px] font-black text-indigo-400 uppercase tracking-widest">YÖNTEM</th>
                                <th className="px-12 py-6 text-[10px] font-black text-indigo-400 uppercase tracking-widest text-right">TUTAR</th>
                                <th className="px-12 py-6"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50">
                            <AnimatePresence mode="popLayout">
                                {transactions.map((t, idx) => {
                                    const tool = paymentDefinitions.find(pd => pd.id === t.toolId);
                                    return (
                                        <motion.tr 
                                            key={t.id}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: idx * 0.02 }}
                                            className="hover:bg-indigo-50/30 transition-all group"
                                        >
                                            <td className="px-12 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-indigo-950">{new Date(t.date).toLocaleDateString('tr-TR')}</span>
                                                    <span className="text-[9px] font-bold text-indigo-300 uppercase">{new Date(t.date).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs shadow-sm ${t.type === 'Para girişi' ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'}`}>
                                                        {t.party.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-indigo-950">{t.party}</p>
                                                        <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-tight line-clamp-1">{t.note || t.info}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-12 py-6">
                                                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                    t.type === 'Para girişi' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {t.type === 'Para girişi' ? <ArrowUpRight size={12} /> : <ChevronRight size={12} className="rotate-90" />}
                                                    {t.type}
                                                </div>
                                            </td>
                                            <td className="px-12 py-6">
                                                <span className="text-[11px] font-black text-indigo-600/60 uppercase tracking-tighter">#{t.refCode}</span>
                                            </td>
                                            <td className="px-12 py-6">
                                                <div className="flex flex-col">
                                                    <span className="text-xs font-black text-indigo-950 capitalize">{t.method}</span>
                                                    <span className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">{tool?.name || 'GENEL KASA'}</span>
                                                </div>
                                            </td>
                                            <td className="px-12 py-6 text-right">
                                                <span className={`text-lg font-black tracking-tighter ${t.type === 'Para girişi' ? 'text-indigo-950' : 'text-rose-600'}`}>
                                                    {t.type === 'Para çıkışı' && '- '}₺{t.amount.toLocaleString('tr-TR')}
                                                </span>
                                            </td>
                                            <td className="px-12 py-6 text-right">
                                                <button className="p-3 text-indigo-200 hover:text-indigo-600 hover:bg-white rounded-xl transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-transparent hover:border-indigo-50">
                                                    <Edit3 size={16} />
                                                </button>
                                            </td>
                                        </motion.tr>
                                    );
                                })}
                            </AnimatePresence>
                        </tbody>
                    </table>
                    {transactions.length === 0 && (
                        <div className="py-32 text-center flex flex-col items-center justify-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 mb-6 shadow-inner">
                                <Receipt size={48} />
                            </div>
                            <h3 className="text-2xl font-black text-indigo-950 uppercase italic tracking-tighter">İşlem Bulunmuyor</h3>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mt-3">Seçilen tarihler arasında kayıtlı finansal hareket yok.</p>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
