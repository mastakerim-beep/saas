"use client";

import { useState } from 'react';
import { useStore, Debt, PaymentMethod } from '@/lib/store';
import { Hourglass, Calendar, AlertCircle, X, Banknote, CreditCard, Building2, CheckCircle, Wallet, TrendingUp } from 'lucide-react';

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
        <div className="fixed inset-0 bg-indigo-950/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
            <div className="bg-white dark:bg-indigo-950 rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-[slideUp_0.3s_ease] border border-indigo-100 dark:border-indigo-500/20">
                <div className="p-8 border-b border-indigo-50 dark:border-indigo-500/10 flex justify-between items-center bg-indigo-50/30 dark:bg-indigo-900/10">
                    <div>
                        <h3 className="text-xl font-black text-indigo-900 dark:text-white leading-none mb-1">Tahsilat Al</h3>
                        <p className="text-[10px] font-black text-indigo-500 dark:text-indigo-400 uppercase tracking-widest">{customer.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white dark:hover:bg-indigo-900/50 rounded-2xl transition-colors">
                        <X className="w-6 h-6 text-indigo-300" />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    {/* Debt Selector */}
                    <div>
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest block mb-3">İşlem Seçin</label>
                        <select 
                            value={selectedDebtId}
                            onChange={(e) => setSelectedDebtId(e.target.value)}
                            className="w-full bg-indigo-50/50 dark:bg-indigo-900/20 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 text-sm font-bold shadow-sm outline-none appearance-none cursor-pointer dark:text-white"
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
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-indigo-300 text-xl">₺</span>
                            <input 
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="0.00"
                                className="w-full bg-indigo-50/50 dark:bg-indigo-900/20 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] pl-12 pr-6 py-5 text-2xl font-black outline-none placeholder:text-indigo-200 dark:text-white"
                            />
                             {selectedDebt && (
                                <button 
                                    onClick={() => setAmount(selectedDebt.amount.toString())}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white dark:bg-indigo-800 border border-indigo-100 dark:border-indigo-500/20 px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-600 dark:text-indigo-100 hover:bg-indigo-50 transition"
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
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${method === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-indigo-50 dark:bg-indigo-900/20 border-transparent text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-900/40'}`}
                                >
                                    <m.icon className="w-5 h-5" />
                                    <span className="text-[10px] font-black uppercase">{m.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={handlePay}
                        disabled={isProcessing || !amount}
                        className={`w-full py-6 rounded-3xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${isProcessing ? 'bg-indigo-100 text-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 active:scale-95 shadow-indigo-200'}`}
                    >
                        {isProcessing ? (
                            <Hourglass className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                <span>Tahsilatı Tamamla</span>
                            </>
                        )}
                    </button>
                </div>
            </div>
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
        <div className="p-8 max-w-[1200px] mx-auto animate-[fadeIn_0.5s_ease] space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 text-indigo-950 dark:text-white">Açık Hesap & Bakiye</h1>
                    <p className="text-indigo-500/60 text-sm font-bold flex items-center gap-2">
                        <TrendingUp className="w-4 h-4" /> Alacak takibi ve vadelendirme merkezi
                    </p>
                </div>
                <div className="bg-indigo-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl shadow-indigo-200 flex flex-col items-end">
                    <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Toplam Alacak</p>
                    <p className="text-4xl font-black tracking-tighter">₺{totalReceivable.toLocaleString('tr-TR')}</p>
                </div>
            </div>
            
            <div className="card-apple overflow-hidden border-indigo-100/50">
                <table className="w-full text-left">
                    <thead className="bg-indigo-50/50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-500/10">
                        <tr>
                            <th className="p-6 text-[10px] font-black uppercase text-indigo-400 tracking-widest">Danışan</th>
                            <th className="p-6 text-[10px] font-black uppercase text-indigo-400 tracking-widest">Vade Durumu</th>
                            <th className="p-6 text-[10px] font-black uppercase text-indigo-400 tracking-widest text-center">Toplam Borç</th>
                            <th className="p-6 text-[10px] font-black uppercase text-indigo-400 tracking-widest text-center">Gelen Ödeme</th>
                            <th className="p-6 text-[10px] font-black uppercase text-indigo-400 tracking-widest text-right">Kalan Bakiye</th>
                            <th className="p-6 w-20"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-indigo-50 dark:divide-indigo-500/10">
                        {balanceList.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-32 text-center">
                                    <div className="flex flex-col items-center opacity-30">
                                        <Wallet className="w-16 h-16 text-indigo-200 mb-4" />
                                        <p className="text-sm font-black uppercase text-indigo-400 tracking-[0.2em]">Sistemde aktif alacak bulunmuyor</p>
                                    </div>
                                </td>
                            </tr>
                        ) : (
                            balanceList.map((c) => (
                                <tr key={c.id} className="hover:bg-indigo-50/30 dark:hover:bg-indigo-900/10 transition-colors group">
                                    <td className="p-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-11 h-11 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center font-black text-white shadow-lg shadow-indigo-100 group-hover:scale-110 transition-transform">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-black text-indigo-950 dark:text-white">{c.name}</p>
                                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-tight">{c.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6">
                                        {c.earliestDueDate ? (
                                            <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest ${c.isOverdue ? 'bg-red-50 text-red-600 border border-red-100 animate-pulse' : 'bg-amber-50 text-amber-600 border border-amber-100'}`}>
                                                {c.isOverdue ? <AlertCircle className="w-3 h-3" /> : <Calendar className="w-3 h-3" />}
                                                {new Date(c.earliestDueDate).toLocaleDateString('tr-TR')}
                                                {c.isOverdue && <span>(Gecikti)</span>}
                                            </div>
                                        ) : (
                                            <span className="text-indigo-200 font-bold text-xs">Vade Yok</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-center font-bold text-indigo-400/80">₺{c.totalDebt.toLocaleString('tr-TR')}</td>
                                    <td className="p-6 text-center font-bold text-indigo-600">₺{c.totalPaid.toLocaleString('tr-TR')}</td>
                                    <td className="p-6 text-right">
                                        <span className={`inline-block px-5 py-2.5 rounded-2xl font-black text-lg ${c.isOverdue ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'bg-indigo-50 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400'}`}>
                                            ₺{c.balance.toLocaleString('tr-TR')}
                                        </span>
                                    </td>
                                    <td className="p-6">
                                        <button 
                                            onClick={() => setPayingCustomer(c)}
                                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-all"
                                        >
                                            Tahsilat
                                        </button>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            <div className="grid grid-cols-2 gap-8">
                <div className="bg-indigo-50/50 dark:bg-indigo-950/40 p-8 rounded-[2.5rem] border border-indigo-100/50 dark:border-indigo-500/10 flex items-center justify-between">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-white dark:bg-indigo-900/50 rounded-3xl flex items-center justify-center shadow-indigo-100 shadow-xl"><Hourglass className="w-8 h-8 text-indigo-500" /></div>
                        <div>
                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Geciken Borçlu Sayısı</p>
                            <h2 className="text-3xl font-black text-red-600">{balanceList.filter(c => c.isOverdue).length} Girişimci</h2>
                        </div>
                    </div>
                </div>
                <div className="bg-indigo-600 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-200 text-white flex items-center justify-between overflow-hidden relative">
                    <div className="relative z-10">
                        <p className="text-[10px] font-black text-indigo-100 uppercase tracking-widest mb-1">Ortalama Alacak Vadesi</p>
                        <h2 className="text-3xl font-black">14 Gün</h2>
                    </div>
                    <Calendar className="w-32 h-32 absolute -right-8 -bottom-8 text-white/10 rotate-12" />
                </div>
            </div>

            {payingCustomer && (
                <DebtPaymentModal 
                    customer={payingCustomer} 
                    debts={payingCustomer.openDebts} 
                    onClose={() => setPayingCustomer(null)} 
                />
            )}
        </div>
    );
}
