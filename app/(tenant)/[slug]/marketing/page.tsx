'use client';

import { useStore } from '@/lib/store';
import { 
    Megaphone, Target, Users, Zap, 
    Gift, ArrowRight, TrendingDown, 
    MessageSquare, Mail, Calendar,
    Plus, Sparkles, AlertCircle, X,
    UserMinus, Crown
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    BarChart, Bar, XAxis, YAxis, 
    CartesianGrid, Tooltip, ResponsiveContainer,
    Cell 
} from 'recharts';

export default function MarketingPage() {
    const { 
        customers, appointments, marketingRules, 
        addMarketingRule, deleteMarketingRule 
    } = useStore();
    
    const [activeTab, setActiveTab] = useState<'overview' | 'automation' | 'campaigns'>('overview');
    const [showRuleModal, setShowRuleModal] = useState(false);

    // --- CHURN ANALYSIS ---
    const churnStats = useMemo(() => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
        const sixtyDaysAgo = new Date(now.setDate(now.getDate() - 30)); // Resetting back another 30
        
        const riskList: any[] = [];
        const churnedList: any[] = [];
        const activeList: any[] = [];

        customers.forEach((c: any) => {
            const customerAppts = appointments.filter((a: any) => a.customerId === c.id)
                .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());
            
            const lastVisitDate = customerAppts.length > 0 ? new Date(customerAppts[0].date) : null;
            
            if (!lastVisitDate) {
                churnedList.push({ ...c, lastVisit: 'Hiç gelmedi' });
            } else if (lastVisitDate < sixtyDaysAgo) {
                churnedList.push({ ...c, lastVisit: lastVisitDate.toLocaleDateString('tr-TR') });
            } else if (lastVisitDate < thirtyDaysAgo) {
                riskList.push({ ...c, lastVisit: lastVisitDate.toLocaleDateString('tr-TR') });
            } else {
                activeList.push({ ...c, lastVisit: lastVisitDate.toLocaleDateString('tr-TR') });
            }
        });

        return { riskList, churnedList, activeList };
    }, [customers, appointments]);

    const chartData = [
        { name: 'Aktif', count: churnStats.activeList.length, color: '#10b981' },
        { name: 'Riskli', count: churnStats.riskList.length, color: '#f59e0b' },
        { name: 'Kaybedilmiş', count: churnStats.churnedList.length, color: '#f43f5e' },
    ];

    return (
        <div className="p-8 space-y-10 max-w-7xl mx-auto animate-[fadeIn_0.5s_ease]">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter flex items-center gap-4">
                        <Megaphone className="text-indigo-600 w-10 h-10" /> İmparatorluk Pazarlama
                    </h1>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mt-2">Büyüme & Müşteri Bağlılığı Komutası</p>
                </div>
                <div className="flex bg-slate-100 p-1 rounded-2xl">
                    <button 
                        onClick={() => setActiveTab('overview')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'overview' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        Genel Bakış
                    </button>
                    <button 
                        onClick={() => setActiveTab('automation')}
                        className={`px-6 py-2 rounded-xl text-xs font-black uppercase transition-all ${activeTab === 'automation' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
                    >
                        Otomasyon
                    </button>
                </div>
            </div>

            {activeTab === 'overview' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Churn Chart */}
                    <div className="lg:col-span-2 bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h3 className="text-slate-900 text-xl font-black italic uppercase tracking-tighter">Müşteri Sadakat Nabzı</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Son 60 Günlük Analiz</p>
                            </div>
                            <div className="text-right">
                                <p className="text-3xl font-black text-indigo-600">%{Math.round((churnStats.riskList.length / (customers.length || 1)) * 100)}</p>
                                <p className="text-[9px] font-black text-amber-500 uppercase">Risk Oranı</p>
                            </div>
                        </div>
                        <div className="h-[300px]">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900 }} />
                                    <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                                    <Bar dataKey="count" radius={[10, 10, 0, 0]}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Quick Stats */}
                    <div className="space-y-6">
                        <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white relative overflow-hidden group h-full flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                                <Sparkles size={80} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2">Otomatik Büyüme</p>
                                <h3 className="text-2xl font-black leading-tight italic uppercase">Aktif Kampanya Sayısı</h3>
                            </div>
                            <div className="mt-8">
                                <p className="text-6xl font-black">{marketingRules.length}</p>
                                <button 
                                    onClick={() => setActiveTab('automation')}
                                    className="mt-6 w-full py-4 bg-white/10 hover:bg-white/20 rounded-2xl text-xs font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                                >
                                    YENİ KURAL EKLE <Plus size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Risk List */}
                    <div className="lg:col-span-3 bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-slate-900 text-lg font-black uppercase tracking-tighter italic flex items-center gap-3">
                                <UserMinus className="text-rose-500" /> Kaybolmaya Yakın Vatandaşlar
                            </h3>
                            <span className="text-[9px] font-black bg-rose-50 text-rose-600 px-4 py-1.5 rounded-full uppercase">Acil Aksiyon Gerekli</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {churnStats.riskList.slice(0, 6).map((c, i) => (
                                <div key={i} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 group hover:border-amber-200 transition-all cursor-pointer">
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-900 shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-all">
                                            <Target size={20} />
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[8px] font-black text-amber-600 uppercase bg-amber-50 px-2 py-0.5 rounded">RİSKLİ</p>
                                            <p className="text-[9px] font-bold text-slate-400 mt-1">{c.lastVisit} son ziyaret</p>
                                        </div>
                                    </div>
                                    <h4 className="font-black text-slate-900 uppercase text-xs">{c.name}</h4>
                                    <p className="text-[10px] font-bold text-slate-400 mt-1">{c.phone}</p>
                                    <button className="mt-4 w-full py-2.5 bg-white border border-indigo-100 rounded-xl text-[10px] font-black text-indigo-600 hover:bg-indigo-600 hover:text-white transition-all">
                                        ÖZEL TEKLİF GÖNDER
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'automation' && (
                <div className="space-y-8">
                    <div className="flex justify-between items-center">
                        <h3 className="text-slate-900 text-xl font-black italic uppercase tracking-tighter">Pazarlama Otomatları</h3>
                        <button 
                            onClick={() => setShowRuleModal(true)}
                            className="bg-indigo-600 text-white px-8 py-4 rounded-full text-xs font-black uppercase tracking-widest shadow-xl shadow-indigo-100 flex items-center gap-2 hover:scale-105 active:scale-95 transition-all"
                        >
                            <Plus size={16} /> OTOMASYON KURGULA
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {marketingRules.length > 0 ? marketingRules.map((rule: any) => (
                            <div key={rule.id} className="bg-white border border-slate-100 p-8 rounded-[3rem] shadow-sm relative overflow-hidden group">
                                <div className={`absolute top-0 right-0 p-8 opacity-10 ${rule.isActive ? 'text-indigo-600' : 'text-slate-300'}`}>
                                    {rule.triggerType === 'CHURN_RISK' ? <TrendingDown size={60} /> : <Gift size={60} />}
                                </div>
                                <div className="flex items-center gap-4 mb-6">
                                    <div className={`w-12 h-12 ${rule.isActive ? 'bg-indigo-50 text-indigo-600' : 'bg-slate-100 text-slate-400'} rounded-2xl flex items-center justify-center`}>
                                        {rule.triggerType === 'CHURN_RISK' ? <Zap size={24} /> : <Gift size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-slate-900 uppercase text-sm tracking-tight">{rule.name}</h4>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{rule.triggerType} TETİKLEYİCİSİ</p>
                                    </div>
                                </div>
                                <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 mb-6 font-mono text-[11px] text-slate-600 italic">
                                    "{rule.messageTemplate}"
                                </div>
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${rule.isActive ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                                        <span className="text-[10px] font-black uppercase text-slate-500">{rule.isActive ? 'AKTİF' : 'DURDURULDU'}</span>
                                    </div>
                                    <button 
                                        onClick={() => deleteMarketingRule(rule.id)}
                                        className="text-rose-500 text-[10px] font-black uppercase hover:underline"
                                    >
                                        KURALI SİL
                                    </button>
                                </div>
                            </div>
                        )) : (
                            <div className="col-span-2 py-20 text-center border-2 border-dashed border-slate-200 rounded-[3rem]">
                                <Megaphone size={48} className="mx-auto text-slate-200 mb-4" />
                                <p className="text-slate-400 font-black uppercase italic">Henüz aktif bir otomasyon kuralı bulunamadı.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {showRuleModal && (
                <RuleModal 
                    onClose={() => setShowRuleModal(false)} 
                    onSave={(rule) => addMarketingRule(rule)} 
                />
            )}
        </div>
    );
}

function RuleModal({ onClose, onSave }: { onClose: () => void, onSave: (rule: any) => void }) {
    const [name, setName] = useState('');
    const [triggerType, setTriggerType] = useState('NEW_CUSTOMER');
    const [threshold, setThreshold] = useState(0);
    const [messageTemplate, setMessageTemplate] = useState('');

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl">
                <div className="flex justify-between items-center mb-8">
                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Yeni Otomasyon Kurgula</h3>
                    <button onClick={onClose} className="p-2 hover:bg-slate-50 rounded-full text-slate-400 hover:text-slate-900"><X size={24} /></button>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Kural İsmi</label>
                        <input value={name} onChange={e => setName(e.target.value)} placeholder="Örn: Hoşgeldin İndirimi" className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all text-slate-900" />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Tetikleyici</label>
                            <select value={triggerType} onChange={e => setTriggerType(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-4 py-4 text-xs font-bold outline-none text-slate-900">
                                <option value="NEW_CUSTOMER">Yeni Kayıt</option>
                                <option value="CHURN_RISK">Kayıp Riski (Gün)</option>
                                <option value="LOYALTY_POINTS">Sadakat Puanı</option>
                                <option value="BIRTHDAY">Doğum Günü</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Eşik Değer</label>
                            <input type="number" value={threshold} onChange={e => setThreshold(Number(e.target.value))} className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none text-slate-900" />
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 tracking-widest block mb-2">Mesaj Şablonu</label>
                        <textarea value={messageTemplate} onChange={e => setMessageTemplate(e.target.value)} placeholder="Müşteriye gidecek mesaj..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none h-32 resize-none text-slate-900" />
                    </div>
                    
                    <button 
                        onClick={() => {
                            if (!name || !messageTemplate) return;
                            onSave({ name, triggerType, threshold, messageTemplate, isActive: true });
                            onClose();
                        }}
                        className="w-full py-5 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all"
                    >
                        OTOMASYONU AKTİF ET
                    </button>
                </div>
            </motion.div>
        </div>
    );
}

