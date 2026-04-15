"use client";

import { useStore, Payment, Expense, Customer, PaymentDefinition, AppUser } from "@/lib/store";
import { 
    Wallet, Search, Calendar, Filter, ArrowUpRight, 
    Landmark, Banknote, Users, Info, ChevronDown,
    Plus, Minus, Download, Save, History, Activity,
    TrendingUp, Scale, Receipt, Trash2, Edit3
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";

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
        // Business Owner veya SaaS Owner ise her zaman true
        if (currentUser?.role?.toLowerCase() === 'saas_owner' || currentUser?.role?.toLowerCase() === 'business_owner') return true;
        return can('view_historical_finance');
    }, [isMounted, currentUser, can]);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Tarih aralığını sadece bir kez (ilk açılışta) ayarla
    useEffect(() => {
        if (isMounted && isInitialized && !dateRange.start) {
            const todayStr = getTodayDate();
            setDateRange({ start: todayStr, end: todayStr });
        }
    }, [isMounted, isInitialized, getTodayDate, dateRange.start]);

    // Hatalı auto-reset useEffect kaldırıldı.

    const handleSearch = async () => {
        setIsRefreshing(true);
        try {
            await fetchData(undefined, undefined, true, dateRange.start, dateRange.end);
        } catch (err) {
            console.error("Search failed:", err);
        } finally {
            // Küçük bir gecikme ekleyerek UI sıçramalarını önleyelim
            setTimeout(() => setIsRefreshing(false), 300);
        }
    };

    // Combined Transactions (Payments + Expenses)
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
                method: 'nakit', // Expenses usually cash but could be extended
                toolId: null,
                note: e.desc,
                amount: e.amount,
                original: e
            }));

        return [...pMap, ...eMap].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [payments, expenses, dateRange, currentBranch, searchQuery]);

    // Totals Breakdown
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
            <div className="flex-1 flex flex-col items-center justify-center bg-[#F3F4F6] min-h-screen">
                <div className="w-12 h-12 border-4 border-[#1ABE9D] border-t-transparent rounded-full animate-spin mb-4" />
                <p className="text-xs font-black text-gray-400 uppercase tracking-widest animate-pulse">Veriler Hazırlanıyor...</p>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-[#F3F4F6] min-h-screen">
            {/* Page Header */}
            <div className="bg-white px-8 py-5 border-b border-gray-200 shadow-sm flex justify-between items-center">
                <div className="flex items-center gap-3">
                    <h1 className="text-xl font-bold text-gray-800 tracking-tight">Kasa</h1>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg text-xs font-bold border border-gray-200 hover:bg-gray-100 transition-all shadow-sm"
                    >
                        Yazdır / Dışa Aktar <ChevronDown size={14} />
                    </button>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white m-6 p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                <div className="flex flex-wrap items-center gap-4">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                        <input 
                            type="text" 
                            placeholder="Arama kriterleri"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-[#1ABE9D]/20 outline-none"
                        />
                    </div>
                    <button className="px-5 py-2.5 bg-white border border-[#1ABE9D] text-[#1ABE9D] rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-[#1ABE9D]/5 transition-all">
                        <Save size={14} /> Aramayı kaydet
                    </button>
                </div>

                <div className="flex items-center gap-8 pt-4 border-t border-gray-50">
                    <div className="flex items-center gap-4">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">Tarih aralığı</span>
                        <div className={`flex items-center gap-2 bg-gray-50 p-1 rounded-xl border border-gray-100 ${!hasPastAccess ? 'opacity-50 cursor-not-allowed' : ''}`}>
                            <input 
                                type="date" 
                                value={dateRange.start}
                                max={today}
                                disabled={!hasPastAccess}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="bg-transparent text-sm font-bold text-gray-700 p-2 outline-none cursor-pointer disabled:cursor-not-allowed"
                            />
                            <div className="w-4 h-[2px] bg-gray-300" />
                            <input 
                                type="date" 
                                value={dateRange.end}
                                max={today}
                                disabled={!hasPastAccess}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="bg-transparent text-sm font-bold text-gray-700 p-2 outline-none cursor-pointer disabled:cursor-not-allowed"
                            />
                        </div>
                        {!hasPastAccess && (
                            <div className="flex items-center gap-2 text-rose-500">
                                <History size={14} className="animate-pulse" />
                                <span className="text-[10px] font-black uppercase">Geçmiş Veri Kilidi Aktif</span>
                            </div>
                        )}
                        <button 
                            onClick={() => setDateRange({ start: today, end: today })}
                            title="Tarihi Sıfırla"
                            className="p-2.5 text-rose-500 bg-rose-50 rounded-lg hover:bg-rose-100 transition-all border border-rose-100"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                    <button 
                        onClick={handleSearch}
                        disabled={isRefreshing}
                        className="px-10 py-3 bg-[#1ABE9D] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[#158C73] transition-all shadow-lg shadow-emerald-100 flex items-center gap-2 ml-auto disabled:opacity-50"
                    >
                        {isRefreshing ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <Search size={16} />} 
                        {isRefreshing ? 'GÜNCELLENİYOR...' : 'Ara'}
                    </button>
                </div>
            </div>

            <div className="px-6 space-y-8 pb-20">
                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                        <TrendingUp className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-50 opacity-50 group-hover:scale-110 transition-transform" />
                        <div className="w-12 h-12 bg-emerald-50 text-[#1ABE9D] rounded-2xl flex items-center justify-center mb-4"><TrendingUp size={24} /></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Gelir</p>
                        <p className="text-3xl font-black text-gray-900 leading-none">{stats.income.toLocaleString('tr-TR')} TRY</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm flex flex-col items-center justify-center relative overflow-hidden group">
                        <Scale className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-50 opacity-50 group-hover:scale-110 transition-transform" />
                        <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mb-4"><Scale size={24} /></div>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Net</p>
                        <p className="text-3xl font-black text-gray-900 leading-none">{stats.net.toLocaleString('tr-TR')} TRY</p>
                    </div>
                </div>

                {/* Detail Panels */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Income Details */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-[#1ABE9D] px-8 py-5 flex items-center gap-3 text-white">
                            <Plus size={20} className="stroke-[3]" />
                            <h3 className="font-black text-lg">Gelir - Detaylar</h3>
                        </div>
                        <div className="grid grid-cols-2 flex-1 divide-x divide-gray-50">
                            <div className="p-8">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Banknote size={14} className="text-[#1ABE9D]" /> Ödeme Yöntemleri
                                </h4>
                                <div className="space-y-4">
                                    {stats.methods.map(([method, amount]: any) => (
                                        <div key={method} className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-600 capitalize">{method}</span>
                                            <span className="text-xs font-black text-gray-900">{amount.toLocaleString('tr-TR')} TRY</span>
                                        </div>
                                    ))}
                                    {stats.methods.length === 0 && <p className="text-[10px] text-gray-300 italic">Veri bulunmuyor</p>}
                                </div>
                            </div>
                            <div className="p-8">
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                    <Landmark size={14} className="text-[#1ABE9D]" /> Ödeme Araçları
                                </h4>
                                <div className="space-y-4">
                                    {stats.tools.map(([tool, amount]: any) => (
                                        <div key={tool} className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-600">{tool}</span>
                                            <span className="text-xs font-black text-gray-900">{amount.toLocaleString('tr-TR')} TRY</span>
                                        </div>
                                    ))}
                                    {stats.tools.length === 0 && <p className="text-[10px] text-gray-300 italic">Veri bulunmuyor</p>}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Expense Details */}
                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden flex flex-col">
                        <div className="bg-rose-500 px-8 py-5 flex items-center gap-3 text-white">
                            <Minus size={20} className="stroke-[3]" />
                            <h3 className="font-black text-lg">Gider - Detaylar</h3>
                        </div>
                        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center opacity-40">
                            <Receipt size={40} className="text-gray-300 mb-2" />
                            <p className="text-[10px] font-black uppercase tracking-widest">Gider detayı bulunmuyor</p>
                        </div>
                    </div>
                </div>

                {/* Transaction Table */}
                <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-8 py-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                        <h3 className="font-black text-gray-800 uppercase tracking-tighter italic flex items-center gap-2">
                            <Activity size={18} className="text-[#1ABE9D]" /> İşlem Geçmişi
                        </h3>
                        <button className="text-[10px] font-black text-blue-600 uppercase tracking-widest hover:underline flex items-center gap-1">
                            <Download size={12} /> Excel Aktar
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                                <tr className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                    <th className="px-8 py-5">Ödeme tarihi</th>
                                    <th className="px-8 py-5">Danışan/Firma</th>
                                    <th className="px-8 py-5">İşlem tipi</th>
                                    <th className="px-8 py-5">Bilgi</th>
                                    <th className="px-8 py-5">Referans kodu</th>
                                    <th className="px-8 py-5">Ödeme Yöntemi</th>
                                    <th className="px-8 py-5">Ödeme Aracı</th>
                                    <th className="px-8 py-5">Not</th>
                                    <th className="px-8 py-5">Tutar</th>
                                    <th className="px-8 py-5 text-right">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {transactions.map((t) => {
                                    const tool = paymentDefinitions.find(pd => pd.id === t.toolId);
                                    return (
                                        <tr key={t.id} className="hover:bg-gray-50/30 transition-colors group">
                                            <td className="px-8 py-6 text-xs font-bold text-gray-600">{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                                            <td className="px-8 py-6 text-sm font-black text-gray-900">{t.party}</td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider ${
                                                    t.type === 'Para girişi' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                                                }`}>
                                                    {t.type}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-xs text-gray-500 font-bold">{t.info}</td>
                                            <td className="px-8 py-6 text-xs font-black text-indigo-600 uppercase tracking-tighter">{t.refCode}</td>
                                            <td className="px-8 py-6 text-xs font-bold text-gray-700 capitalize">{t.method}</td>
                                            <td className="px-8 py-6 text-[10px] font-black uppercase tracking-widest text-[#1ABE9D]">
                                                {tool?.name || '---'}
                                            </td>
                                            <td className="px-8 py-6 text-[10px] text-gray-400 font-bold max-w-[150px] truncate">{t.note}</td>
                                            <td className="px-8 py-6 text-sm font-black text-gray-900">{t.amount.toLocaleString('tr-TR')} TRY</td>
                                            <td className="px-8 py-6 text-right">
                                                <button className="p-2 bg-gray-50 text-gray-400 hover:text-gray-900 rounded-lg border border-gray-100 transition-all opacity-0 group-hover:opacity-100">
                                                    <Edit3 size={14} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                        {transactions.length === 0 && (
                            <div className="py-24 text-center grayscale opacity-30 flex flex-col items-center">
                                <History size={64} className="mb-4 text-gray-300" />
                                <p className="text-[10px] font-black uppercase tracking-[0.3em]">Seçili tarihlerde işlem bulunmuyor</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
