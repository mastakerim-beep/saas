"use client";

import { useStore, Payment, Debt, Customer, PaymentDefinition } from "@/lib/store";
import { 
    Wallet, Receipt, TrendingUp, TrendingDown, 
    Search, Calendar, Filter, ArrowUpRight, 
    CreditCard, Landmark, Banknote, Users,
    ChevronRight, Info, AlertCircle, Trash2,
    CalendarDays, PieChart, Activity
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function CashManagementPage() {
    const { 
        payments, debts, customers, paymentDefinitions,
        currentBranch, can
    } = useStore();

    const [dateRange, setDateRange] = useState({ 
        start: new Date().toISOString().split('T')[0], 
        end: new Date().toISOString().split('T')[0] 
    });
    const [searchQuery, setSearchQuery] = useState("");
    const [debtQuery, setDebtQuery] = useState("");

    // Filtered Data
    const filteredPayments = useMemo(() => {
        return payments.filter(p => {
            const d = p.date.split('T')[0];
            const isDateMatch = d >= dateRange.start && d <= dateRange.end;
            const isBranchMatch = p.branchId === currentBranch?.id;
            const isSearchMatch = p.customerName.toLowerCase().includes(searchQuery.toLowerCase());
            return isDateMatch && isBranchMatch && isSearchMatch;
        });
    }, [payments, dateRange, currentBranch, searchQuery]);

    const activeDebts = useMemo(() => {
        return debts.filter(d => d.status === 'açık' && d.branchId === currentBranch?.id)
            .map(d => ({
                ...d,
                customer: customers.find(c => c.id === d.customerId)
            }))
            .filter(d => d.customer?.name.toLowerCase().includes(debtQuery.toLowerCase()));
    }, [debts, customers, currentBranch, debtQuery]);

    // Analytics
    const totals = useMemo(() => {
        const totalIncome = filteredPayments.reduce((sum, p) => sum + p.totalAmount, 0);
        
        // Method Breakdown
        const methodMap: any = { 'Nakit': 0, 'Kredi Kartı': 0, 'Banka Hesabı': 0 };
        filteredPayments.forEach(p => {
            p.methods.forEach(m => {
                const label = m.method === 'nakit' ? 'Nakit' : m.method === 'kredi-karti' ? 'Kredi Kartı' : 'Banka Hesabı';
                methodMap[label] = (methodMap[label] || 0) + m.amount;
            });
        });

        // Tool Breakdown
        const toolMap: any = {};
        filteredPayments.forEach(p => {
            p.methods.forEach(m => {
                const tool = paymentDefinitions.find(d => d.id === m.toolId);
                const toolName = tool?.name || 'Diğer / Tanımsız';
                toolMap[toolName] = (toolMap[toolName] || 0) + m.amount;
            });
        });

        return {
            income: totalIncome,
            methods: Object.entries(methodMap),
            tools: Object.entries(toolMap)
        };
    }, [filteredPayments, paymentDefinitions]);

    return (
        <div className="flex h-screen bg-[#F0F2F5] overflow-hidden">
            {/* Left Sidebar: Borçlu Müşteriler */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                <div className="p-6 border-b border-gray-100 bg-gray-50/50">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="w-10 h-10 rounded-2xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-100">
                            <Users size={20} />
                        </div>
                        <div>
                            <h2 className="text-sm font-black text-gray-900 tracking-tight">BORÇLU LİSTESİ</h2>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeDebts.length} Borçlu Kaydı</p>
                        </div>
                    </div>
                    
                    <div className="relative group">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-rose-500 transition-colors" size={14} />
                        <input 
                            type="text" 
                            placeholder="Müşteri Ara..."
                            value={debtQuery}
                            onChange={(e) => setDebtQuery(e.target.value)}
                            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-100 rounded-xl text-xs focus:ring-2 focus:ring-rose-100 outline-none transition-all shadow-sm"
                        />
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                    <AnimatePresence>
                        {activeDebts.map((debt) => (
                            <motion.div 
                                key={debt.id} 
                                initial={{ opacity: 0, x: -10 }} 
                                animate={{ opacity: 1, x: 0 }}
                                className="p-4 bg-white border border-gray-50 rounded-2xl hover:border-rose-100 hover:shadow-md transition-all group flex justify-between items-center"
                            >
                                <div className="space-y-1">
                                    <p className="text-xs font-black text-gray-900 group-hover:text-rose-600 transition-colors">{debt.customer?.name}</p>
                                    <p className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-tight">
                                        <CalendarDays size={10} /> {new Date(debt.dueDate).toLocaleDateString('tr-TR')}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm font-black text-rose-600 leading-none">₺{debt.amount.toLocaleString()}</p>
                                    <button className="text-[8px] font-black text-gray-300 uppercase tracking-widest mt-1.5 hover:text-black">Detay</button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {activeDebts.length === 0 && (
                        <div className="text-center py-12 opacity-40 grayscale flex flex-col items-center gap-3">
                            <Users size={40} className="text-gray-300" />
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Borçlu Bulunmuyor</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#F0F2F5]">
                {/* Header / Filter */}
                <header className="bg-white/90 backdrop-blur-md border-b border-gray-200 px-8 py-6 sticky top-0 z-10 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                    <div>
                        <h1 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-100">
                                <Wallet size={18} />
                            </div>
                            Günün Kasası
                        </h1>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
                        <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-2xl border border-gray-100 shadow-inner">
                            <input 
                                type="date" 
                                value={dateRange.start}
                                onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                                className="bg-transparent text-[11px] font-black uppercase text-gray-500 outline-none" 
                            />
                            <div className="w-4 h-[1px] bg-gray-300" />
                            <input 
                                type="date"
                                value={dateRange.end}
                                onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                                className="bg-transparent text-[11px] font-black uppercase text-gray-500 outline-none" 
                            />
                        </div>
                        <button className="px-6 py-3 bg-[#1ABE9D] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-[#158C73] transition-all shadow-lg shadow-emerald-100 flex items-center gap-2">
                            <Search size={14} /> ARA
                        </button>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                           <TrendingUp className="absolute -right-6 -bottom-6 w-32 h-32 text-emerald-50 opacity-50 transition-transform group-hover:scale-110" />
                           <div className="relative z-10">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> GELİR
                                </p>
                                <div className="flex items-baseline gap-2">
                                    <span className="text-4xl font-black text-gray-900">₺{totals.income.toLocaleString('tr-TR')}</span>
                                    <span className="text-sm font-bold text-gray-400">TRY</span>
                                </div>
                           </div>
                        </motion.div>
                        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 }} className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-sm group">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" /> NET DURUM
                            </p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-4xl font-black text-gray-900">₺{totals.income.toLocaleString('tr-TR')}</span>
                                <span className="text-sm font-bold text-gray-400">TRY</span>
                            </div>
                        </motion.div>
                    </div>

                    {/* Breakdown Sections */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Income Details */}
                        <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full">
                            <div className="p-8 border-b border-gray-50 flex items-center gap-3 bg-[#1ABE9D]/5">
                                <div className="w-8 h-8 rounded-xl bg-[#1ABE9D] text-white flex items-center justify-center shadow-lg shadow-emerald-50">
                                    <Plus size={16} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">Gelir - Detaylar</h3>
                            </div>
                            
                            <div className="grid grid-cols-2 h-full">
                                {/* Methods */}
                                <div className="p-8 border-r border-gray-50">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Banknote size={14} className="text-[#1ABE9D]" /> Ödeme Yöntemleri
                                    </h4>
                                    <div className="space-y-4">
                                        {totals.methods.map(([method, amount]: any) => (
                                            <div key={method} className="flex justify-between items-center group">
                                                <span className="text-xs font-bold text-gray-500 group-hover:text-black transition-colors">{method}</span>
                                                <span className="text-xs font-black text-gray-900">₺{amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Tools */}
                                <div className="p-8">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        <Landmark size={14} className="text-[#1ABE9D]" /> Ödeme Araçları
                                    </h4>
                                    <div className="space-y-4">
                                        {totals.tools.map(([tool, amount]: any) => (
                                            <div key={tool} className="flex justify-between items-center group">
                                                <span className="text-xs font-bold text-gray-500 group-hover:text-black transition-colors">{tool}</span>
                                                <span className="text-xs font-black text-gray-900">₺{amount.toLocaleString()}</span>
                                            </div>
                                        ))}
                                        {totals.tools.length === 0 && (
                                            <p className="text-[10px] text-gray-300 italic">Kayıt bulunamadı</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Expense Details (Mocked for now) */}
                        <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden flex flex-col h-full opacity-60">
                            <div className="p-8 border-b border-gray-50 flex items-center gap-3 bg-rose-500/5">
                                <div className="w-8 h-8 rounded-xl bg-rose-500 text-white flex items-center justify-center shadow-lg shadow-rose-50">
                                    <TrendingDown size={16} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight">Gider - Detaylar</h3>
                            </div>
                            <div className="flex-1 flex flex-col items-center justify-center p-12 text-center grayscale">
                                <Receipt size={48} className="text-gray-200 mb-4" />
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Gider verileri bu tarih aralığında bulunmuyor</p>
                            </div>
                        </div>
                    </div>

                    {/* Transaction List */}
                    <div className="bg-white rounded-[4rem] border border-gray-100 shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-xl bg-indigo-500 text-white flex items-center justify-center shadow-lg shadow-indigo-50">
                                    <Activity size={16} />
                                </div>
                                <h3 className="text-lg font-black text-gray-900 tracking-tight uppercase italic">İşlem Geçmişi</h3>
                            </div>
                            <button className="px-4 py-2 border border-blue-100 text-[#0071E3] rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-all">
                                EXCEL AKTAR
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-[#FBFBFD] border-b border-gray-50">
                                    <tr className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em]">
                                        <th className="px-8 py-6">Müşteri</th>
                                        <th className="px-8 py-6">Hizmet / Paket</th>
                                        <th className="px-8 py-6">Yöntem / Araç</th>
                                        <th className="px-8 py-6">Tutar</th>
                                        <th className="px-8 py-6 text-right"></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {filteredPayments.map((p) => {
                                        const tool = paymentDefinitions.find(d => d.id === p.paymentDefinitionId);
                                        return (
                                            <tr key={p.id} className="hover:bg-gray-50/50 transition-colors group">
                                                <td className="px-8 py-6 font-black text-gray-900 text-sm">{p.customerName}</td>
                                                <td className="px-8 py-6 text-gray-500 text-xs font-bold">{p.service}</td>
                                                <td className="px-8 py-6">
                                                    <div className="flex flex-col">
                                                        <span className="text-xs font-black text-gray-700 capitalize">{p.methods[0]?.method}</span>
                                                        <span className="text-[10px] font-bold text-[#1ABE9D] uppercase tracking-widest">{tool?.name || '---'}</span>
                                                    </div>
                                                </td>
                                                <td className="px-8 py-6 font-black text-gray-900 text-sm">₺{p.totalAmount.toLocaleString()}</td>
                                                <td className="px-8 py-6 text-right">
                                                    <button className="p-2 text-gray-300 hover:text-black transition-colors opacity-0 group-hover:opacity-100">
                                                        <Info size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {filteredPayments.length === 0 && (
                                <div className="py-20 text-center flex flex-col items-center gap-4 opacity-30">
                                    <PieChart size={64} className="text-gray-300" />
                                    <p className="text-[10px] font-black uppercase tracking-widest">İşlem Bulunmuyor</p>
                                </div>
                            )}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}

function Plus(props: any) {
    return (
        <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-plus"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
    )
}
