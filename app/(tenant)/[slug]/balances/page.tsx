"use client";

import { useState } from 'react';
import { useStore, Debt, PaymentMethod } from '@/lib/store';
import { Hourglass, Calendar, AlertCircle, X, Banknote, CreditCard, Building2, CheckCircle, Wallet, TrendingUp, ChevronRight, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ---- SUB-COMPONENT: DEBT PAYMENT MODAL ----
function DebtPaymentModal({ customer, debts, onClose }: { customer: any, debts: Debt[], onClose: () => void }) {
    const { payDebt } = useStore();
    const [selectedDebtId, setSelectedDebtId] = useState(debts[0]?.id || '');
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState<'nakit' | 'kredi-karti' | 'havale'>('nakit');
    const [isProcessing, setIsProcessing] = useState(false);

    const selectedDebt = debts.find(d => d.id === selectedDebtId);

    const handlePay = () => {
        const payVal = Number(amount);
        if (!payVal || payVal <= 0 || !selectedDebtId) return;
        
        setIsProcessing(true);
        setTimeout(() => {
            const methods: PaymentMethod[] = [{
                id: Date.now().toString(),
                method,
                amount: payVal,
                currency: 'TRY',
                rate: 1,
                isDeposit: false
            }];
            
            payDebt(selectedDebtId, payVal, methods);
            setIsProcessing(false);
            onClose();
        }, 800);
    };

    return (
        <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4">
            <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl border border-white/20"
            >
                <div className="p-8 border-b border-indigo-50 flex justify-between items-center bg-gradient-to-r from-indigo-50/50 to-purple-50/50">
                    <div>
                        <h3 className="text-xl font-black text-indigo-950 leading-none mb-1">Tahsilat Al</h3>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{customer.name}</p>
                    </div>
                    <button onClick={onClose} className="w-10 h-10 flex items-center justify-center hover:bg-white rounded-2xl transition-all shadow-sm">
                        <X className="w-5 h-5 text-indigo-400" />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    {/* Debt Selector */}
                    <div>
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-3">İşlem Seçin</label>
                        <select 
                            value={selectedDebtId}
                            onChange={(e) => setSelectedDebtId(e.target.value)}
                            className="w-full bg-indigo-50/50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm outline-none appearance-none cursor-pointer"
                        >
                            {debts.map(d => (
                                <option key={d.id} value={d.id}>
                                    {d.createdAt ? new Date(d.createdAt).toLocaleDateString('tr-TR') : '---'} — {d.description || 'Borç Kaydı'} (₺{d.amount})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-3">Ödenecek Tutar</label>
                        <div className="relative group">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-300 text-2xl group-focus-within:text-indigo-600 transition-colors">₺</span>
                            <input 
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-indigo-50/50 border-2 border-transparent focus:border-indigo-600 rounded-[1.75rem] pl-14 pr-24 py-6 text-3xl font-black outline-none placeholder:text-indigo-100 transition-all focus:bg-white"
                            />
                             {selectedDebt && (
                                <button 
                                    onClick={() => setAmount(selectedDebt.amount.toString())}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                                >
                                    TÜMÜ
                                </button>
                             )}
                        </div>
                    </div>

                    {/* Method Selector */}
                    <div>
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-3">Ödeme Yöntemi</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'nakit', label: 'Nakit', icon: Banknote },
                                { id: 'kredi-karti', label: 'Kart', icon: CreditCard },
                                { id: 'havale', label: 'Havale', icon: Building2 },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMethod(m.id as any)}
                                    className={`flex flex-col items-center gap-3 p-5 rounded-3xl border-2 transition-all duration-300 ${method === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200 scale-105' : 'bg-gray-50 border-transparent text-indigo-300 hover:bg-indigo-50'}`}
                                >
                                    <m.icon className={`w-6 h-6 ${method === m.id ? 'text-white' : 'text-indigo-200'}`} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handlePay}
                        disabled={isProcessing || !amount}
                        className={`w-full py-6 rounded-[2rem] font-black text-sm shadow-2xl flex items-center justify-center gap-3 transition-all duration-500 ${isProcessing ? 'bg-indigo-100 text-indigo-400' : 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white hover:scale-[1.02] active:scale-95 shadow-indigo-200'}`}
                    >
                        {isProcessing ? (
                            <Hourglass className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5 shadow-sm" />
                                <span className="uppercase tracking-[0.1em]">Tahsilatı Tamamla</span>
                            </>
                        )}
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

export default function BalancesPage() {
    const { customers, appointments, payments, packages, debts } = useStore();
    const [payingCustomer, setPayingCustomer] = useState<any | null>(null);

    // Calculate balances and due dates for each customer
    const balanceList = customers.map(customer => {
        const customerAppts = appointments.filter(a => a.customerId === customer.id);
        const customerPkgs = packages.filter(p => p.customerId === customer.id);
        const customerPayments = payments.filter(p => p.customerId === customer.id);
        const customerDebts = debts.filter(d => d.customerId === customer.id && d.status === 'açık');

        const totalDebt = customerAppts.reduce((s, a) => s + a.price, 0) + 
                          customerPkgs.reduce((s, p) => s + p.price, 0);
        
        const totalPaid = customerPayments.reduce((s, p) => s + (p.totalAmount || 0), 0);
        const balance = totalDebt - totalPaid;

        const sortedDebts = [...customerDebts].sort((a, b) => (a.dueDate || '').localeCompare(b.dueDate || ''));
        const earliestDueDate = sortedDebts[0]?.dueDate || null;
        
        const isOverdue = earliestDueDate ? new Date(earliestDueDate) < new Date() : false;

        return {
            ...customer,
            balance,
            totalDebt,
            totalPaid,
            earliestDueDate,
            isOverdue,
            openDebts: customerDebts,
            lastActivity: customerAppts[0]?.date || customer.createdAt
        };
    }).filter(c => c.balance > 0); 

    const totalReceivable = balanceList.reduce((s, c) => s + c.balance, 0);

    return (
        <div className="p-10 max-w-[1400px] mx-auto space-y-10">
            <header className="flex justify-between items-end">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">
                        <Wallet className="w-4 h-4" />
                        <span>Finansal Takip</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-indigo-950 uppercase italic italic-indigo">
                        Açık <span className="text-indigo-600">Hesaplar</span>
                    </h1>
                </motion.div>
                
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }}
                    className="bg-indigo-600 bg-gradient-to-br from-indigo-600 to-purple-700 text-white px-10 py-6 rounded-[2.5rem] shadow-2xl shadow-indigo-200 flex flex-col items-end relative overflow-hidden"
                >
                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1 relative z-10 opacity-70">Toplam Alacak Stoku</p>
                    <p className="text-5xl font-black tracking-tighter relative z-10 font-mono">₺{totalReceivable.toLocaleString('tr-TR')}</p>
                    <TrendingUp className="absolute -left-4 -bottom-4 w-24 h-24 text-white/10 -rotate-12" />
                </motion.div>
            </header>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-[3rem] overflow-hidden shadow-2xl shadow-indigo-100/50 border border-indigo-50"
            >
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-indigo-50/50 border-b border-indigo-100">
                                <th className="p-8 text-[11px] font-black uppercase text-indigo-400 tracking-[0.2em]">Danışan Bilgisi</th>
                                <th className="p-8 text-[11px] font-black uppercase text-indigo-400 tracking-[0.2em]">Vade / Risk</th>
                                <th className="p-8 text-[11px] font-black uppercase text-indigo-400 tracking-[0.2em] text-center">Toplam Ciro</th>
                                <th className="p-8 text-[11px] font-black uppercase text-indigo-400 tracking-[0.2em] text-center">Tahsilat</th>
                                <th className="p-8 text-[11px] font-black uppercase text-indigo-400 tracking-[0.2em] text-right">Kalan Borç</th>
                                <th className="p-8 w-20"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-indigo-50">
                            {balanceList.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-32 text-center">
                                        <div className="flex flex-col items-center">
                                            <div className="w-24 h-24 bg-indigo-50 rounded-[2rem] flex items-center justify-center text-indigo-200 mb-6 shadow-inner">
                                                <CheckCircle className="w-12 h-12" />
                                            </div>
                                            <p className="text-sm font-black uppercase text-indigo-400 tracking-[0.3em]">Tüm hesaplar kapatıldı</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                balanceList.map((c, idx) => (
                                    <motion.tr 
                                        key={c.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className="hover:bg-indigo-50/30 transition-all group"
                                    >
                                        <td className="p-8">
                                            <div className="flex items-center gap-5">
                                                <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[1.25rem] flex items-center justify-center font-black text-white text-xl shadow-xl shadow-indigo-100 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-indigo-950 text-lg tracking-tight group-hover:text-indigo-600 transition-colors uppercase">{c.name}</p>
                                                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest mt-0.5">{c.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-8">
                                            {c.earliestDueDate ? (
                                                <div className={`inline-flex items-center gap-2.5 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-sm border ${
                                                    c.isOverdue 
                                                    ? 'bg-rose-50 text-rose-600 border-rose-100 animate-pulse' 
                                                    : 'bg-amber-50 text-amber-600 border-amber-100'
                                                }`}>
                                                    {c.isOverdue ? <AlertCircle className="w-3.5 h-3.5" /> : <Calendar className="w-3.5 h-3.5" />}
                                                    {new Date(c.earliestDueDate).toLocaleDateString('tr-TR')}
                                                    {c.isOverdue && <span className="ml-1">Gecikti</span>}
                                                </div>
                                            ) : (
                                                <span className="text-indigo-200 font-black text-[10px] uppercase tracking-widest">Açık Vade</span>
                                            )}
                                        </td>
                                        <td className="p-8 text-center font-bold text-indigo-300">₺{c.totalDebt.toLocaleString('tr-TR')}</td>
                                        <td className="p-8 text-center font-bold text-emerald-600">₺{c.totalPaid.toLocaleString('tr-TR')}</td>
                                        <td className="p-8 text-right">
                                            <span className={`inline-block px-6 py-3 rounded-2xl font-black text-xl transition-all ${
                                                c.isOverdue 
                                                ? 'bg-rose-600 text-white shadow-xl shadow-rose-200 scale-105' 
                                                : 'bg-indigo-50 text-indigo-600'
                                            }`}>
                                                ₺{c.balance.toLocaleString('tr-TR')}
                                            </span>
                                        </td>
                                        <td className="p-8">
                                            <button 
                                                onClick={() => setPayingCustomer(c)}
                                                className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-3 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all outline-none"
                                            >
                                                Tahsilat
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </motion.div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white p-10 rounded-[3.5rem] border border-indigo-100 flex items-center justify-between shadow-2xl shadow-indigo-100/50 active:scale-95 transition-transform cursor-pointer"
                >
                    <div className="flex items-center gap-8">
                        <div className="w-20 h-20 bg-rose-50 rounded-[2rem] flex items-center justify-center shadow-inner relative group">
                            <Hourglass className="w-10 h-10 text-rose-500 group-hover:rotate-180 transition-transform duration-700" />
                            <div className="absolute -top-2 -right-2 w-8 h-8 bg-rose-600 rounded-full flex items-center justify-center text-white font-black text-xs border-4 border-white">
                                {balanceList.filter(c => c.isOverdue).length}
                            </div>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 opacity-60">Kritik Vade Bekleyen</p>
                            <h2 className="text-4xl font-black text-rose-600 italic tracking-tighter uppercase line-clamp-1">Gecikmiş Ödemeler</h2>
                        </div>
                    </div>
                    <ChevronRight className="w-8 h-8 text-rose-200" />
                </motion.div>

                <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-indigo-950 p-10 rounded-[3.5rem] shadow-2xl shadow-indigo-200/50 text-white flex items-center justify-between overflow-hidden relative group cursor-pointer active:scale-95 transition-transform"
                >
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1.5 opacity-60">Operasyonel Verimlilik</p>
                        <h2 className="text-4xl font-black italic uppercase tracking-tighter">Vade Ortalaması</h2>
                        <div className="flex items-center gap-2 mt-2">
                            <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                                <motion.div initial={{ width: 0 }} animate={{ width: '45%' }} transition={{ duration: 1, delay: 0.5 }} className="h-full bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.5)]" />
                            </div>
                            <span className="text-xl font-black italic">14 Gün</span>
                        </div>
                    </div>
                    <Calendar className="w-32 h-32 absolute -right-8 -bottom-8 text-white/5 rotate-12 group-hover:rotate-0 group-hover:scale-110 transition-all duration-700" />
                </motion.div>
            </div>

            <AnimatePresence>
                {payingCustomer && (
                    <DebtPaymentModal 
                        customer={payingCustomer} 
                        debts={payingCustomer.openDebts} 
                        onClose={() => setPayingCustomer(null)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
