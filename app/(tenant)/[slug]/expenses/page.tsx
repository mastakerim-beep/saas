"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Sparkles, CheckCircle, Receipt, TrendingDown, LayoutGrid } from 'lucide-react';

export default function ExpensesPage() {
    const { expenses, addExpense, currentBranch } = useStore();
    const [input, setInput] = useState('');
    const [activeFilter, setActiveFilter] = useState('Tümü');
    const tags = ["Tümü", "Kira", "Malzeme", "Maaş", "Fatura", "Bakım", "Pazarlama"];

    const handleAiInput = () => {
        if (!input) return;

        let amount = 0;
        const amountMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:tl|lira|₺)/i);
        if (amountMatch) amount = parseFloat(amountMatch[1]);

        let category = 'Malzeme';
        const lower = input.toLowerCase();
        if (lower.includes('kira')) category = 'Kira';
        if (lower.includes('maaş')) category = 'Maaş';
        if (lower.includes('fatura')) category = 'Fatura';
        if (lower.includes('bakım')) category = 'Bakım';
        if (lower.includes('reklam') || lower.includes('pazarlama')) category = 'Pazarlama';

        addExpense({
            category,
            desc: input,
            amount: amount || 0,
            date: new Date().toISOString().split('T')[0],
            branchId: currentBranch?.id
        });

        setInput('');
    };

    const filteredExpenses = activeFilter === 'Tümü' 
        ? expenses 
        : expenses.filter(e => e.category === activeFilter);

    const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);

    return (
        <div className="p-8 max-w-[1200px] mx-auto animate-[fadeIn_0.5s_ease] space-y-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 text-indigo-950 dark:text-white">Gider Yönetimi</h1>
                    <p className="text-indigo-500/60 text-sm font-bold flex items-center gap-2">
                        <TrendingDown className="w-4 h-4" /> İşletme harcamalarını YZ ile kategorize edin
                    </p>
                </div>
                <div className="bg-red-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl shadow-red-100 flex flex-col items-end">
                    <p className="text-[10px] font-black text-red-100 uppercase tracking-widest mb-1">Filtrelenmiş Toplam</p>
                    <p className="text-4xl font-black tracking-tighter">₺{totalExpense.toLocaleString('tr-TR')}</p>
                </div>
            </div>
            
            <div className="card-apple bg-indigo-50/30 dark:bg-indigo-900/10 border-indigo-100/50 p-8 flex items-center gap-6 group hover:border-indigo-400/30 transition-all">
                <div className="w-16 h-16 rounded-3xl bg-white dark:bg-indigo-900/50 flex items-center justify-center shadow-xl shadow-indigo-100/50 flex-none group-hover:scale-110 transition-transform">
                    <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-black text-indigo-900 dark:text-indigo-100 uppercase tracking-widest mb-3">Akıllı Gider Girişi</h3>
                    <div className="flex items-center gap-4">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAiInput()}
                            placeholder="Örn: Bugün 1000 TL kira ödedim..." 
                            className="w-full bg-white dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-500/10 rounded-2xl px-6 py-4 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-400 transition-all dark:text-white" 
                        />
                        <button 
                            onClick={handleAiInput}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-black text-sm whitespace-nowrap shadow-xl shadow-indigo-100 hover:scale-105 transition-all flex items-center gap-2"
                        >
                            <CheckCircle className="w-5 h-5" /> Sisteme İşle
                        </button>
                    </div>
                </div>
            </div>

            <div className="card-apple p-10 min-h-[500px] border-indigo-100/50">
                <div className="flex justify-between items-center mb-10 pb-6 border-b border-indigo-50 dark:border-indigo-500/10">
                    <h3 className="font-black text-indigo-950 dark:text-white tracking-widest uppercase text-xs flex items-center gap-3">
                        <LayoutGrid className="w-4 h-4 text-indigo-500" /> Gider Hareketleri
                    </h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((t, i) => (
                            <button 
                                key={i} 
                                onClick={() => setActiveFilter(t)}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${activeFilter === t ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-100' : 'bg-indigo-50/50 dark:bg-indigo-900/20 text-indigo-400 border-transparent hover:bg-indigo-100 dark:hover:bg-indigo-900/40'}`}
                            >
                                {t}
                            </button>
                        ))}
                    </div>
                </div>

                {filteredExpenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 opacity-20">
                        <Receipt className="w-20 h-20 mb-6 text-indigo-400" />
                        <p className="text-xs font-black uppercase tracking-[0.3em] text-indigo-500 text-center">Bu kategoride henüz<br/>kayıtlı bir harcama bulunmuyor</p>
                    </div>
                ) : (
                    <div className="grid gap-4">
                        {filteredExpenses.map((exp) => (
                            <div key={exp.id} className="flex items-center justify-between p-6 bg-indigo-50/20 dark:bg-indigo-900/10 rounded-3xl border border-indigo-50 dark:border-indigo-500/10 hover:border-indigo-300 dark:hover:border-indigo-400/30 transition-all group">
                                <div className="flex items-center gap-6">
                                    <div className="w-14 h-14 bg-white dark:bg-indigo-900/50 rounded-[1.25rem] flex items-center justify-center shadow-indigo-50 shadow-lg group-hover:scale-110 transition-transform">
                                        <Receipt className="w-6 h-6 text-indigo-300" />
                                    </div>
                                    <div>
                                        <p className="font-black text-indigo-950 dark:text-white text-lg leading-tight mb-1">{exp.desc}</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 dark:bg-indigo-950 px-3 py-1 rounded-lg">{exp.category}</span>
                                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">{new Date(exp.date).toLocaleDateString('tr-TR')}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-black text-red-600 tracking-tighter">₺{exp.amount.toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
