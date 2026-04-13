"use client";

import { useState } from 'react';
import { useStore, Customer } from '@/lib/store';
import { Sparkles, Bot, Search, ChevronRight, Star, History, Target, AlertCircle, Clock } from 'lucide-react';

export default function AiAdvisorPage() {
    const { customers, appointments, debts } = useStore();
    const [search, setSearch] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const [aiSuggesting, setAiSuggesting] = useState(false);

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone.includes(search)
    );

    const selectedCustomer = customers.find(c => c.id === selectedId);
    const customerAppts = appointments.filter(a => a.customerId === selectedId && a.status === 'completed');
    const customerDebts = debts.filter(d => d.customerId === selectedId && d.status === 'açık');
    const overdueTotal = customerDebts.filter(d => new Date(d.dueDate) < new Date()).reduce((s,d) => s + d.amount, 0);

    // AI Logic Augmented with Debt Control
    const getSuggestions = (customer: Customer) => {
        const history = appointments.filter(a => a.customerId === customer.id).map(a => a.service);
        const uniqueServices = Array.from(new Set(history));
        let suggest = [];

        // Priority 1: Debt Collection (Kaçak Önleme)
        if (overdueTotal > 0) {
            suggest.push({ 
                service: 'Borç Tahsilatı Önceliği', 
                reason: `Danışanın ₺${overdueTotal.toLocaleString('tr-TR')} tutarında gecikmiş borcu bulunuyor. Yeni hizmetten önce bakiye kapatılması YZ tarafından önerilir.`,
                critical: true
            });
        }

        // Priority 2: Upsell
        if (!uniqueServices.includes('VIP Cilt Bakımı')) {
            suggest.push({ service: 'VIP Cilt Bakımı', reason: 'Daha önce hiç cilt bakımı almadı. Segmentine uygun bir başlangıç paketi sunulabilir.' });
        }
        if (uniqueServices.includes('Bali Masajı') && history.length > 3) {
            suggest.push({ service: '10\'lu Masaj Paketi', reason: 'Sık masaj alıyor. Paket satışı sadakati artıracaktır.' });
        }
        
        return suggest.length > 0 ? suggest : [{ service: 'Genel Tanıtım', reason: 'Müşteri profili çok yeni, genel bir kampanya sunulabilir.' }];
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-[fadeIn_0.3s_ease] h-[calc(100vh-2rem)] flex flex-col">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1 text-gray-900">AI Ciro & Risk Danışmanı</h1>
                    <p className="text-gray-500 text-sm font-semibold">Müşteri özelinde satış stratejilerini ve tahsilat risklerini YZ ile yönetin.</p>
                </div>
            </div>
            
            <div className="flex gap-8 flex-1 overflow-hidden min-h-0 pb-6">
                {/* Left: Customer Selection */}
                <div className="w-[360px] flex flex-col gap-4">
                    <div className="card-apple bg-white p-5 rounded-[2rem] shadow-sm border border-gray-100 flex flex-col flex-1 overflow-hidden">
                        <div className="font-black text-[10px] text-gray-400 tracking-widest uppercase mb-4 flex items-center gap-2">
                            <Bot className="w-4 h-4 text-indigo-500"/> Hedef Danışan Seçin
                        </div>
                        <div className="relative mb-4">
                            <Search className="w-4 h-4 absolute left-4 top-3.5 text-gray-400" />
                            <input 
                                type="text" 
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                placeholder="İsim veya telefon..." 
                                className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all"
                            />
                        </div>
                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-2">
                            {filtered.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => setSelectedId(c.id)}
                                    className={`p-4 rounded-2xl border cursor-pointer transition-all flex justify-between items-center group
                                        ${selectedId === c.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-white border-gray-100 hover:border-indigo-200'}
                                    `}
                                >
                                    <div>
                                        <p className="font-bold text-sm flex items-center gap-2">
                                            {c.name}
                                            {c.segment === 'VIP' && <Star className={`w-3 h-3 ${selectedId === c.id ? 'text-white' : 'text-yellow-400'} fill-current`} />}
                                        </p>
                                        <p className={`text-[11px] font-semibold mt-0.5 ${selectedId === c.id ? 'text-indigo-100' : 'text-gray-400'}`}>{c.phone}</p>
                                    </div>
                                    <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 transform translate-x-0 group-hover:translate-x-1 transition-all ${selectedId === c.id ? 'text-white' : 'text-indigo-400'}`} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Right: AI Strategy Panel */}
                <div className="flex-1 flex flex-col gap-6 overflow-y-auto no-scrollbar">
                    {selectedCustomer ? (
                        <>
                            <div className="grid grid-cols-2 gap-6">
                                <div className="card-apple bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                                    <h3 className="font-black text-[10px] text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <History className="w-4 h-4" /> Finansal Profil (AI)
                                    </h3>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-gray-500">Toplam Bakiye</span>
                                            <span className={`text-sm font-black ${customerDebts.length > 0 ? 'text-red-500' : 'text-gray-900'}`}>
                                                ₺{customerDebts.reduce((s,d)=>s+d.amount,0).toLocaleString('tr-TR')}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-gray-500">Gecikmiş Alacak</span>
                                            <span className={`text-sm font-black ${overdueTotal > 0 ? 'text-red-600 animate-pulse' : 'text-green-600'}`}>₺{overdueTotal.toLocaleString('tr-TR')}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-xs font-bold text-gray-500">Risk Durumu</span>
                                            <span className={`text-[10px] font-black px-2 py-0.5 rounded-full uppercase ${overdueTotal > 0 ? 'bg-red-600 text-white shadow-lg shadow-red-100' : 'bg-green-50 text-green-600'}`}>
                                                {overdueTotal > 0 ? 'Yüksek Risk (Kaçak)' : 'Güvenli'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className={`card-apple p-6 rounded-[2rem] text-white shadow-xl relative overflow-hidden group ${overdueTotal > 0 ? 'bg-red-600' : 'bg-indigo-600'}`}>
                                    <AlertCircle className="w-20 h-20 text-white/10 absolute -right-4 -bottom-4 rotate-12 group-hover:rotate-45 transition-transform duration-700" />
                                    <h3 className="font-bold text-lg mb-2">AI Advisor Notu</h3>
                                    <p className="text-indigo-50 text-xs font-medium leading-relaxed">
                                        {overdueTotal > 0 ? 
                                            `Dikkat! Bu müşteri ${customerDebts.length} adet borç kaydıyla toplam ₺${overdueTotal} gecikme yaşatıyor. Tahsilat almadan yeni randevu vermeyin.` : 
                                            `Bu müşterinin bugün Paket Satın Alma eğilimi %78 olarak hesaplanmıştır. VIP Cilt Bakımı önerilebilir.`}
                                    </p>
                                </div>
                            </div>

                            <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm flex-1">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h2 className="text-xl font-black text-gray-900">YZ Strateji ve Güvenlik Önerileri</h2>
                                        <p className="text-xs text-gray-500 font-bold mt-1">Kaçak önleme ve ciro artırma kurguları</p>
                                    </div>
                                    <button 
                                        onClick={() => { setAiSuggesting(true); setTimeout(() => setAiSuggesting(false), 1500); }}
                                        className="bg-black text-white px-6 py-2.5 rounded-2xl text-xs font-black flex items-center gap-2 hover:scale-105 transition-transform"
                                    >
                                        <Sparkles className={`w-4 h-4 ${aiSuggesting ? 'animate-spin' : ''}`} /> Yeniden Analiz Et
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    {getSuggestions(selectedCustomer).map((s: any, idx) => (
                                        <div key={idx} className={`p-6 border-2 rounded-[2rem] flex items-start gap-5 transition-all cursor-pointer group ${s.critical ? 'border-red-100 bg-red-50/30' : 'border-indigo-50 bg-indigo-50/20 hover:border-indigo-200'}`}>
                                            <div className={`p-4 rounded-2xl shadow-sm group-hover:rotate-6 transition-transform ${s.critical ? 'bg-red-600 text-white' : 'bg-white text-indigo-600'}`}>
                                                {s.critical ? <Clock className="w-6 h-6" /> : <Target className="w-6 h-6" />}
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-black text-lg text-gray-900">{s.service}</h4>
                                                    {s.critical && <span className="bg-red-600 text-[8px] font-black text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">YZ Uyarısı</span>}
                                                </div>
                                                <p className="text-sm text-gray-500 font-medium mt-1">{s.reason}</p>
                                                <button className={`mt-4 text-[10px] font-black uppercase tracking-widest border-b-2 pb-0.5 transition-all ${s.critical ? 'text-red-600 border-red-200 hover:border-red-600' : 'text-indigo-600 border-indigo-200 hover:border-indigo-600'}`}>
                                                    {s.critical ? 'Tahsilat Ekranına Git →' : 'Bu Kurguyu Uygula →'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 card-apple bg-white p-8 flex flex-col items-center justify-center border border-gray-100 rounded-[2.5rem] shadow-sm">
                            <div className="bg-indigo-50 p-6 rounded-full mb-6 border border-indigo-100 shadow-inner">
                                <Bot className="w-12 h-12 text-indigo-500" />
                            </div>
                            <h3 className="font-extrabold text-2xl text-gray-900 mb-2">AI Koruma Modu Aktif</h3>
                            <p className="text-gray-400 font-bold text-sm max-w-[280px] text-center">
                                Bir müşteri seçtiğinizde hem ciro artırmak için satış fikirleri vereceğim hem de açık hesap risklerini denetleyeceğim.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
