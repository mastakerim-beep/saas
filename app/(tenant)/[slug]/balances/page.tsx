"use client";

import { useState } from 'react';
import { useStore, Debt, PaymentMethod } from '@/lib/store';
import { Search, Hourglass, User as UserIcon, ArrowRight, Calendar, AlertCircle, X, Banknote, CreditCard, Building2, CheckCircle } from 'lucide-react';
import Link from 'next/link';

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
        // Simulate a slight delay for premium feel
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
            <div className="bg-white rounded-[3rem] w-full max-w-lg overflow-hidden shadow-2xl animate-[slideUp_0.3s_ease]">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div>
                        <h3 className="text-xl font-black text-gray-900 leading-none mb-1">Tahsilat Al</h3>
                        <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{customer.name}</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white rounded-2xl transition-colors">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                <div className="p-10 space-y-8">
                    {/* Debt Selector */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">İşlem Seçin</label>
                        <select 
                            value={selectedDebtId}
                            onChange={(e) => setSelectedDebtId(e.target.value)}
                            className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-6 py-4 text-sm font-bold outline-none appearance-none cursor-pointer"
                        >
                            {debts.map(d => (
                                <option key={d.id} value={d.id}>
                                    {new Date(d.createdAt).toLocaleDateString('tr-TR')} — {d.description} (₺{d.amount})
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Amount Input */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Ödenecek Tutar (Kısmi Ödeme Destekli)</label>
                        <div className="relative">
                            <span className="absolute left-6 top-1/2 -translate-y-1/2 font-black text-gray-400 text-xl">₺</span>
                            <input 
                                type="number"
                                value={amount}
                                onChange={(e) => setAmount(e.target.value)}
                                placeholder="Tutar girin..."
                                className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-600 rounded-[1.5rem] pl-12 pr-6 py-5 text-2xl font-black outline-none placeholder:text-gray-200"
                            />
                             {selectedDebt && (
                                <button 
                                    onClick={() => setAmount(selectedDebt.amount.toString())}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-white border border-gray-200 px-3 py-1.5 rounded-xl text-[10px] font-black text-indigo-600 hover:bg-indigo-50 transition"
                                >
                                    TÜMÜ
                                </button>
                             )}
                        </div>
                    </div>

                    {/* Method Selector */}
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-3">Ödeme Yöntemi</label>
                        <div className="grid grid-cols-3 gap-3">
                            {[
                                { id: 'nakit', label: 'Nakit', icon: Banknote },
                                { id: 'kredi-karti', label: 'Kart', icon: CreditCard },
                                { id: 'havale', label: 'Havale', icon: Building2 },
                            ].map((m) => (
                                <button
                                    key={m.id}
                                    onClick={() => setMethod(m.id as any)}
                                    className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all ${method === m.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-gray-100'}`}
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
                        className={`w-full py-6 rounded-3xl font-black text-sm shadow-xl flex items-center justify-center gap-2 transition-all ${isProcessing ? 'bg-gray-100 text-gray-400' : 'bg-green-600 text-white hover:bg-green-700 active:scale-95'}`}
                    >
                        {isProcessing ? (
                            <Hourglass className="w-5 h-5 animate-spin" />
                        ) : (
                            <>
                                <CheckCircle className="w-5 h-5" />
                                <span>Tahsilatı Onayla</span>
                            </>
                        )}
                    </button>
                    <p className="text-center text-gray-400 text-[9px] font-bold uppercase tracking-widest">Finansal operasyon YZ tarafından denetlenmektedir.</p>
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

        // Find earliest due date
        const sortedDebts = [...customerDebts].sort((a, b) => a.dueDate.localeCompare(b.dueDate));
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
        <div className="p-8 max-w-[1200px] mx-auto animate-[fadeIn_0.3s_ease]">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1 text-gray-900">Açık Hesap & Bakiye</h1>
                    <p className="text-gray-500 text-sm font-semibold">Müşterilerin bekleyen ödemeleri ve vade takibi</p>
                </div>
                <div className="text-right">
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Toplam Alacak</p>
                    <p className="text-3xl font-black text-indigo-900">₺{totalReceivable.toLocaleString('tr-TR')}</p>
                </div>
            </div>
            
            <div className="card-apple border border-gray-200 mb-8 overflow-hidden rounded-[2rem] shadow-sm bg-white">
                <table className="w-full text-left text-sm">
                    <thead className="bg-gray-50 border-b border-gray-100 text-[11px] font-black uppercase tracking-widest text-gray-400">
                        <tr>
                            <th className="p-5">Danışan</th>
                            <th className="p-5">Vade Tarihi</th>
                            <th className="p-5">Toplam Borç</th>
                            <th className="p-5">Toplam Ödenen</th>
                            <th className="p-5 text-right">Kalan Bakiye</th>
                            <th className="p-5 w-10"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {balanceList.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="p-20 text-center text-gray-400 font-bold uppercase tracking-widest">Açık hesapta bekleyen borç bulunmuyor.</td>
                            </tr>
                        ) : (
                            balanceList.map((c) => (
                                <tr key={c.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="p-5">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 bg-indigo-100 rounded-full flex items-center justify-center font-black text-indigo-600">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900">{c.name}</p>
                                                <p className="text-[10px] text-gray-400 font-black uppercase tracking-tight">{c.phone}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-5">
                                        {c.earliestDueDate ? (
                                            <div className={`flex items-center gap-2 font-black text-xs ${c.isOverdue ? 'text-red-500 animate-pulse' : 'text-amber-600'}`}>
                                                {c.isOverdue ? <AlertCircle className="w-4 h-4" /> : <Calendar className="w-4 h-4" />}
                                                {new Date(c.earliestDueDate).toLocaleDateString('tr-TR')}
                                                {c.isOverdue && <span className="text-[8px] bg-red-100 px-1 rounded uppercase">Gecikti</span>}
                                            </div>
                                        ) : (
                                            <span className="text-gray-300 font-bold text-xs">—</span>
                                        )}
                                    </td>
                                    <td className="p-5 font-bold text-gray-500">₺{c.totalDebt.toLocaleString('tr-TR')}</td>
                                    <td className="p-5 font-bold text-green-600">₺{c.totalPaid.toLocaleString('tr-TR')}</td>
                                    <td className="p-5 text-right">
                                        <span className={`px-4 py-2 rounded-2xl font-black text-lg ${c.isOverdue ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-red-50 text-red-600'}`}>
                                            ₺{c.balance.toLocaleString('tr-TR')}
                                        </span>
                                    </td>
                                    <td className="p-5">
                                        <button 
                                            onClick={() => setPayingCustomer(c)}
                                            className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-100 hover:scale-105 transition-transform"
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

            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-10 flex justify-between items-center shadow-sm">
                <div className="flex items-center gap-6">
                    <div className="bg-indigo-600 p-5 rounded-[1.5rem] shadow-xl shadow-indigo-100">
                        <Hourglass className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <p className="text-[11px] font-black uppercase tracking-widest text-indigo-300 mb-1">TOPLAM BEKLEYEN TAHSİLAT</p>
                        <h2 className="text-4xl font-black text-indigo-900 tracking-tighter">₺{totalReceivable.toLocaleString('tr-TR')}</h2>
                    </div>
                </div>
                <div className="flex gap-4">
                     <div className="bg-gray-50 px-6 py-4 rounded-3xl border border-gray-100">
                        <p className="text-[10px] font-black text-gray-400 uppercase mb-1">Geciken Borçlu Sayısı</p>
                        <p className="text-xl font-black text-red-600">{balanceList.filter(c => c.isOverdue).length}</p>
                     </div>
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
