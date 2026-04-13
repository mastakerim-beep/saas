"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Sparkles, CheckCircle, Receipt, Trash2 } from 'lucide-react';

export default function ExpensesPage() {
    const { expenses, addExpense } = useStore();
    const [input, setInput] = useState('');
    const [activeFilter, setActiveFilter] = useState('Tümü');
    const tags = ["Tümü", "Kira", "Malzeme", "Maaş", "Fatura", "Bakım", "Pazarlama"];

    const handleAiInput = () => {
        if (!input) return;

        // Example: "10 litre yağ aldım 500 tl verdim"
        let amount = 0;
        const amountMatch = input.match(/(\d+(?:\.\d+)?)\s*(?:tl|lira|₺)/i);
        if (amountMatch) amount = parseFloat(amountMatch[1]);

        let category = 'Malzeme';
        if (input.toLowerCase().includes('kira')) category = 'Kira';
        if (input.toLowerCase().includes('maaş')) category = 'Maaş';
        if (input.toLowerCase().includes('fatura')) category = 'Fatura';

        addExpense({
            category,
            desc: input,
            amount: amount || 0,
            date: new Date().toISOString().split('T')[0]
        });

        setInput('');
    };

    const filteredExpenses = activeFilter === 'Tümü' 
        ? expenses 
        : expenses.filter(e => e.category === activeFilter);

    const totalExpense = filteredExpenses.reduce((s, e) => s + e.amount, 0);

    return (
        <div className="p-8 max-w-[1200px] mx-auto animate-[fadeIn_0.3s_ease]">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1 text-gray-900">Gider Takibi</h1>
                    <p className="text-gray-500 text-sm font-semibold">İşletme giderlerinizi detaylıca yönetin</p>
                </div>
                <div className="text-right">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Filtrelenmiş Toplam</p>
                    <p className="text-2xl font-black text-red-600">₺{totalExpense.toLocaleString('tr-TR')}</p>
                </div>
            </div>
            
            <div className="card-apple bg-indigo-50/50 border border-indigo-100 p-6 mb-8 flex items-center gap-4 shadow-sm group hover:border-indigo-200 transition-all rounded-3xl">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-sm flex-none">
                    <Sparkles className="w-6 h-6 text-indigo-500 group-hover:rotate-12 transition-transform" />
                </div>
                <div className="flex-1">
                    <h3 className="text-sm font-bold text-indigo-900 mb-1">Akıllı Gider Girişi (Doğal Dil)</h3>
                    <div className="flex items-center gap-3">
                        <input 
                            type="text" 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAiInput()}
                            placeholder="Örn: Bugün 10 litre yağ aldım 500 TL verdim..." 
                            className="w-full bg-white border border-indigo-100 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-transparent transition-all" 
                        />
                        <button 
                            onClick={handleAiInput}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm whitespace-nowrap shadow-sm hover:scale-105 transition-transform flex items-center gap-2"
                        >
                            <CheckCircle className="w-4 h-4" /> Sisteme İşle
                        </button>
                    </div>
                </div>
            </div>

            <div className="card-apple p-8 min-h-[400px] bg-white rounded-3xl shadow-sm border border-gray-100">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="font-bold text-gray-900 tracking-tight text-lg">Gider Listesi</h3>
                    <div className="flex flex-wrap gap-2">
                        {tags.map((t, i) => (
                            <span 
                                key={i} 
                                onClick={() => setActiveFilter(t)}
                                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border transition-all ${activeFilter === t ? 'bg-black text-white border-black' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}
                            >
                                {t}
                            </span>
                        ))}
                    </div>
                </div>

                {filteredExpenses.length === 0 ? (
                    <div className="flex flex-col items-center justify-center opacity-40 mt-20">
                        <Receipt className="w-12 h-12 mb-4" />
                        <p className="text-sm font-bold text-gray-500">Bu kategoride henüz gider kaydı yok.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {filteredExpenses.map((exp) => (
                            <div key={exp.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm">
                                        <Receipt className="w-5 h-5 text-gray-400" />
                                    </div>
                                    <div>
                                        <p className="font-bold text-sm text-gray-900">{exp.desc}</p>
                                        <p className="text-[10px] font-black uppercase text-indigo-500 tracking-wider mt-0.5">{exp.category} · {exp.date}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-black text-red-600">₺{exp.amount.toLocaleString('tr-TR')}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
