"use client";

import { useState } from 'react';
import { useStore, Customer } from '@/lib/store';
import { Sparkles, Bot, Search, ChevronRight, Star, History, Target, AlertCircle, Clock, Check } from 'lucide-react';

export default function AiAdvisorPage() {
    const { customers, appointments, debts, aiInsights, analyzeSystem } = useStore();
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [aiSuggesting, setAiSuggesting] = useState(false);

    // Filter customers for search
    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone.includes(search)
    );

    const selectedCustomer = customers.find(c => c.id === selectedId);
    
    // Per-Customer detailed logic (Real-Time)
    const getCustomerLogic = (customer: Customer) => {
        const history = appointments.filter(a => a.customerId === customer.id);
        const customerDebts = debts.filter(d => d.customerId === customer.id && d.status === 'açık');
        const overdueTotal = customerDebts.filter(d => new Date(d.dueDate) < new Date()).reduce((s,d) => s + d.amount, 0);

        let logic = [];
        if (overdueTotal > 0) {
            logic.push({ title: 'Kritik Tahsilat Uyarısı', desc: `₺${overdueTotal.toLocaleString('tr-TR')} tutarında gecikmiş borç var.`, impact: 'high', category: 'risk' });
        }
        if (history.length > 5 && !appointments.some(a => a.customerId === customer.id && a.packageId)) {
            logic.push({ title: 'Paket Satış Fırsatı', desc: 'Müşteri sadık ancak paket sahibi değil. %20 tasarruf teklif edilebilir.', impact: 'medium', category: 'sales' });
        }
        return logic;
    };

    const handleReanalyze = async () => {
        setAiSuggesting(true);
        await analyzeSystem();
        setAiSuggesting(false);
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-[fadeIn_0.3s_ease] h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1 text-gray-900">AI Ciro & Risk Danışmanı</h1>
                    <p className="text-gray-500 text-sm font-semibold italic uppercase tracking-widest">Veritabanı tabanlı gerçek zamanlı strateji motoru</p>
                </div>
            </div>
            
            <div className="flex gap-8 flex-1 overflow-hidden min-h-0 pb-6">
                {/* Left: Global Insights & Search */}
                <div className="w-[360px] flex flex-col gap-6">
                    {/* Search Panel */}
                    <div className="card-apple bg-white p-6 rounded-[2.5rem] shadow-sm border border-gray-100 flex flex-col h-[300px]">
                        <div className="font-black text-[10px] text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                            <Bot className="w-4 h-4 text-indigo-500"/> Müşteri Seçimi
                        </div>
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="İsim veya telefon..." 
                                className="w-full bg-gray-50 border border-gray-100 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                            {filteredCustomers.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => setSelectedId(c.id)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center group
                                        ${selectedId === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-100 hover:border-indigo-200'}
                                    `}
                                >
                                    <div className="min-w-0 flex-1">
                                        <p className="font-bold text-sm truncate flex items-center gap-2">
                                            {c.name}
                                            {c.segment === 'VIP' && <Star className={`w-3 h-3 flex-shrink-0 ${selectedId === c.id ? 'text-white' : 'text-yellow-400'} fill-current`} />}
                                        </p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 transition-all ${selectedId === c.id ? 'text-white translate-x-1' : 'text-gray-300 opacity-0 group-hover:opacity-100'}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Global Insights Panel */}
                    <div className="card-apple bg-indigo-50/50 p-6 rounded-[2.5rem] border border-indigo-100/50 flex flex-col flex-1 overflow-hidden relative">
                         <div className="font-black text-[10px] text-indigo-400 tracking-widest uppercase mb-4">Genel Sistem Analizi</div>
                         <div className="flex-1 overflow-y-auto no-scrollbar space-y-3">
                            {aiInsights.map((insight, idx) => (
                                <div key={insight.id} className="bg-white p-4 rounded-2xl border border-indigo-100 shadow-sm">
                                    <p className="text-[9px] font-black text-indigo-500 uppercase mb-1">{insight.category}</p>
                                    <h4 className="text-xs font-black text-gray-900 leading-tight mb-1">{insight.title}</h4>
                                    <p className="text-[10px] text-gray-500 font-medium leading-relaxed">{insight.desc}</p>
                                </div>
                            ))}
                            {aiInsights.length === 0 && <p className="text-xs text-gray-400 font-bold text-center mt-10">Sistem analizi için butona basın.</p>}
                         </div>
                         <button 
                            onClick={handleReanalyze}
                            className="mt-4 w-full bg-indigo-600 text-white py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-200 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-2"
                         >
                            <Sparkles className={`w-3 h-3 ${aiSuggesting ? 'animate-spin' : ''}`} /> {aiSuggesting ? 'Analiz Ediliyor...' : 'Yeniden Analiz Et'}
                         </button>
                    </div>
                </div>
                
                {/* Right: Detailed Customer Strategy */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                    {selectedCustomer ? (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="card-apple bg-white p-7 rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:rotate-12 transition-transform">
                                        <History size={120} />
                                    </div>
                                    <h3 className="font-black text-[10px] text-gray-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                                        Finansal Profil & Risk Skoru
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                                            <span className="text-xs font-bold text-gray-400">Tahsil Edilen</span>
                                            <span className="text-lg font-black text-gray-900">₺{appointments.filter(a => a.customerId === selectedId && a.status === 'completed').reduce((s,a) => s + (a.price || 0), 0).toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="flex justify-between items-end border-b border-gray-50 pb-3">
                                            <span className="text-xs font-bold text-gray-400">Bekleyen Borç</span>
                                            <span className={`text-lg font-black ${debts.some(d => d.customerId === selectedId && d.status === 'açık') ? 'text-red-500' : 'text-gray-900'}`}>
                                                ₺{debts.filter(d => d.customerId === selectedId && d.status === 'açık').reduce((s,d) => s + d.amount, 0).toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`card-apple p-7 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group ${debts.some(d => d.customerId === selectedId && d.status === 'açık' && new Date(d.dueDate) < new Date()) ? 'bg-red-600' : 'bg-indigo-600'}`}>
                                    <Bot className="w-24 h-24 text-white/10 absolute -right-4 -bottom-4 rotate-12" />
                                    <h3 className="font-bold text-xl mb-3">Stratejik Not</h3>
                                    <p className="text-indigo-50 text-xs font-bold leading-relaxed opacity-90">
                                        {debts.some(d => d.customerId === selectedId && d.status === 'açık' && new Date(d.dueDate) < new Date()) ? 
                                            `DİKKAT! Müşterinin gecikmiş borcu var. Yeni işlem yapmadan önce tahsilat ekranına yönlendirin.` : 
                                            `Müşteri sadakati yüksek. VIP Cilt Bakımı veya 10'lu Masaj Paketi teklifi sunmak için ideal zaman.`}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm flex-1">
                                <div className="mb-8">
                                    <h2 className="text-2xl font-black text-gray-900">Müşteri Bazlı YZ Analizi</h2>
                                    <p className="text-xs text-gray-400 font-bold mt-1 uppercase tracking-widest italic">Anlık veritabanı sorgularıyla hazırlanan kurgular</p>
                                </div>

                                <div className="space-y-4">
                                    {getCustomerLogic(selectedCustomer).map((s: any, idx) => (
                                        <div key={idx} className={`p-8 border-2 rounded-[2.5rem] flex items-center gap-6 group transition-all ${s.impact === 'high' ? 'border-red-50 bg-red-50/20' : 'border-indigo-50 bg-indigo-50/10 hover:border-indigo-100'}`}>
                                            <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${s.impact === 'high' ? 'bg-red-600 text-white shadow-red-100' : 'bg-white text-indigo-600'}`}>
                                                {s.impact === 'high' ? <AlertCircle className="w-8 h-8" /> : <Target className="w-8 h-8" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-3 mb-1">
                                                    <h4 className="font-black text-xl text-gray-900">{s.title}</h4>
                                                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${s.impact === 'high' ? 'bg-red-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                                        {s.impact === 'high' ? 'KRİTİK' : 'FIRSAT'}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-500 font-bold">{s.desc}</p>
                                            </div>
                                            <button className="p-4 rounded-full bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all transform hover:rotate-12">
                                                <ChevronRight className="w-6 h-6" />
                                            </button>
                                        </div>
                                    ))}
                                    {getCustomerLogic(selectedCustomer).length === 0 && (
                                         <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                            <Check className="w-10 h-10 text-green-500 mx-auto mb-4" />
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Her şey yolunda. Yeni bir fırsat bulunamadı.</p>
                                         </div>
                                    )}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 bg-white p-12 flex flex-col items-center justify-center border border-gray-100 rounded-[3rem] shadow-sm">
                            <div className="bg-indigo-50 p-10 rounded-full mb-8 border border-indigo-100 animate-pulse">
                                <Bot className="w-16 h-16 text-indigo-400" />
                            </div>
                            <h3 className="font-black text-2xl text-gray-900 mb-2 uppercase tracking-tight">AI Advisor Aktif</h3>
                            <p className="text-gray-400 font-medium text-center max-w-[320px] leading-relaxed">
                                Sol taraftan bir müşteri seçerek YZ tabanlı **ciro koruma** ve **satış artırma** stratejilerini görebilirsiniz.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
