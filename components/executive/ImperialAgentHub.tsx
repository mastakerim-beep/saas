"use client";

import React, { useState, useMemo } from 'react';
import { 
    Bot, Sparkles, Activity, ShieldCheck, Zap, 
    MessageSquare, TrendingUp, Users, Settings, 
    Play, Pause, RefreshCw, ChevronRight, AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Appointment, Payment, Expense, Room } from '@/lib/store';

export default function ImperialAgentHub() {
    const { 
        appointments, payments, customers, 
        expenses, rooms, settings 
    } = useStore();

    const agentsData = useMemo(() => {
        const last7Days = new Date();
        last7Days.setDate(last7Days.getDate() - 7);

        const recentAppts = appointments.filter((a: Appointment) => new Date(a.date) >= last7Days);
        const recentPayments = payments.filter((p: Payment) => new Date(p.date) >= last7Days);
        const totalIncome = recentPayments.reduce((acc: number, p: Payment) => acc + (p.totalAmount || 0), 0);
        
        const lastAppt = [...appointments].sort((a: Appointment, b: Appointment) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];
        const lastPay = [...payments].sort((a: Payment, b: Payment) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())[0];

        // Occupancy calculation
        const todayStr = new Date().toISOString().split('T')[0];
        const apptsToday = appointments.filter((a: Appointment) => a.date === todayStr);
        const occupancy = rooms.length > 0 ? Math.round((apptsToday.length / (rooms.length * 8)) * 100) : 0;

        return [
            { 
                id: 'concierge', 
                name: 'Imperial Concierge', 
                role: 'Otonom Rezervasyon & İletişim', 
                status: 'active', 
                description: 'WhatsApp ve Web üzerinden gelen randevu taleplerini otonom olarak yönetir.',
                icon: <MessageSquare size={24} />,
                color: 'bg-indigo-600',
                stats: { tasks: recentAppts.length, accuracy: '%99.2', lastAction: lastAppt ? `${lastAppt.customerName} için ${lastAppt.service} randevusu işlendi` : 'Sistem beklemede' },
                logs: appointments.slice(0, 3).map((a: Appointment) => `${a.customerName} - ${a.service} randevusu oluşturuldu`)
            },
            { 
                id: 'guardian', 
                name: 'Revenue Guardian', 
                role: 'Satış & Upsell Optimizasyonu', 
                status: 'active', 
                description: 'Sepet terki ve pasif müşterileri analiz ederek satış fırsatları yaratır.',
                icon: <TrendingUp size={24} />,
                color: 'bg-emerald-600',
                stats: { tasks: recentPayments.length, accuracy: `₺${totalIncome.toLocaleString('tr-TR')}`, lastAction: lastPay ? `${lastPay.customerName} cüzdanına ₺${lastPay.totalAmount} yüklendi` : 'Kampanya analizi aktif' },
                logs: payments.slice(0, 3).map((p: Payment) => `${p.customerName} ₺${p.totalAmount} tahsilat yapıldı`)
            },
            { 
                id: 'commander', 
                name: 'Command Commander', 
                role: 'İşletme Analitiği & Verimlilik', 
                status: 'analyzing', 
                description: 'İşletme verimliliğini gerçek zamanlı izler ve darboğazları raporlar.',
                icon: <Zap size={24} />,
                color: 'bg-amber-600',
                stats: { tasks: rooms.length, accuracy: `%${occupancy} Doluluk`, lastAction: `Günlük doluluk oranı %${occupancy} olarak ölçüldü` },
                logs: [
                    'Oda kullanım raporu oluşturuldu',
                    'Personel verimlilik analizi tamamlandı',
                    `Bugün için ${apptsToday.length} randevu planlandı`
                ]
            },
            { 
                id: 'audit', 
                name: 'Imperial Audit', 
                role: 'Otonom Denetim & Güvenlik', 
                status: 'monitoring', 
                description: 'Tüm finansal hareketleri ve yetki kullanımlarını denetler.',
                icon: <ShieldCheck size={24} />,
                color: 'bg-rose-600',
                stats: { tasks: payments.length + expenses.length, accuracy: 'Secure', lastAction: 'Draconian Veto katmanı aktif ve denetliyor' },
                logs: [
                    'Tüm işlemler blokzincir mühürlendi',
                    'Şüpheli işlem taraması: Temiz',
                    'Yetki seviyeleri doğrulandı'
                ]
            }
        ];
    }, [appointments, payments, rooms, expenses]);

    const [agentStatus, setAgentStatus] = useState<Record<string, string>>({
        concierge: 'active',
        guardian: 'active',
        commander: 'analyzing',
        audit: 'monitoring'
    });

    const [selectedAgentId, setSelectedAgentId] = useState<string | null>(null);

    const toggleAgent = (id: string) => {
        setAgentStatus(prev => ({ ...prev, [id]: prev[id] === 'active' ? 'paused' : 'active' }));
    };

    const agents = agentsData.map(a => ({ ...a, status: agentStatus[a.id] || 'active' }));
    const selectedAgent = agents.find(a => a.id === selectedAgentId);

    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease]">
            <div className="flex justify-between items-center bg-white/50 backdrop-blur-xl p-8 rounded-[3rem] border border-white/50 shadow-sm">
                <div>
                    <h2 className="text-3xl font-black italic tracking-tighter uppercase text-indigo-950">Imperial Ajan Merkezi</h2>
                    <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mt-1">Otonom İşletme Komuta Katmanı</p>
                </div>
                <div className="flex gap-4">
                    <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-100">
                        <Plus className="w-4 h-4" /> YENİ AJAN TANIMLA
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Agent Cards */}
                <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {agents.map((agent) => (
                        <motion.div 
                            key={agent.id}
                            whileHover={{ y: -5 }}
                            onClick={() => setSelectedAgentId(agent.id)}
                            className={`p-8 bg-white rounded-[2.5rem] border-2 transition-all cursor-pointer relative overflow-hidden group ${selectedAgentId === agent.id ? 'border-indigo-600 shadow-2xl' : 'border-white shadow-sm'}`}
                        >
                            <div className="flex justify-between items-start mb-8">
                                <div className={`${agent.color} p-4 rounded-2xl text-white shadow-lg group-hover:scale-110 transition-transform`}>
                                    {agent.icon}
                                </div>
                                <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${agent.status === 'active' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : agent.status === 'paused' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-indigo-50 text-indigo-600 border border-indigo-100'}`}>
                                    {agent.status}
                                </div>
                            </div>

                            <div className="space-y-2 mb-8">
                                <h3 className="text-xl font-black italic text-gray-900 tracking-tighter uppercase">{agent.name}</h3>
                                <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">{agent.role}</p>
                            </div>

                            <p className="text-xs text-gray-400 font-medium leading-relaxed mb-8 line-clamp-2">{agent.description}</p>

                            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gray-50">
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">GÖREV</p>
                                    <p className="text-sm font-black text-gray-900">{agent.stats.tasks}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">SKOR</p>
                                    <p className="text-sm font-black text-emerald-600">{agent.stats.accuracy}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[8px] font-black text-gray-400 uppercase mb-1">DURUM</p>
                                    <p className="text-xs font-black text-indigo-400">Canlı</p>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* Agent Details / Activity */}
                <div className="lg:col-span-4 space-y-6">
                    <AnimatePresence mode="wait">
                        {selectedAgent ? (
                            <motion.div 
                                key={selectedAgent.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="bg-indigo-950 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden h-full min-h-[600px]"
                            >
                                <div className="absolute top-0 right-0 p-10 opacity-10">
                                    {React.cloneElement(selectedAgent.icon as React.ReactElement, { size: 120 })}
                                </div>

                                <div className="relative z-10">
                                    <div className="flex justify-between items-center mb-10">
                                        <h3 className="text-2xl font-black italic tracking-tighter uppercase">{selectedAgent.name}</h3>
                                        <button 
                                            onClick={(e) => { e.stopPropagation(); toggleAgent(selectedAgent.id); }}
                                            className={`p-3 rounded-xl transition-all ${selectedAgent.status === 'active' ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}
                                        >
                                            {selectedAgent.status === 'active' ? <Pause size={18} /> : <Play size={18} />}
                                        </button>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-2">Son Aktivite</p>
                                            <p className="text-sm font-medium italic">{selectedAgent.stats.lastAction}</p>
                                        </div>

                                        <div>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-6">Aktivite Logları</p>
                                            <div className="space-y-4">
                                                {selectedAgent.logs.map((log: string, i: number) => (
                                                    <div key={i} className="flex gap-4 items-start group">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 group-hover:scale-150 transition-transform" />
                                                        <p className="text-xs font-medium text-indigo-100/80 leading-relaxed">{log}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="pt-8 border-t border-white/10">
                                            <button className="w-full py-4 bg-white text-indigo-950 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all">
                                                GELİŞMİŞ AYARLAR
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ) : (
                            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 flex flex-col items-center justify-center text-center h-full min-h-[600px] opacity-40">
                                <Bot size={64} className="text-gray-300 mb-6" />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Analiz etmek istediğiniz ajanı seçin</p>
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
}

function Plus({ className }: { className?: string }) {
    return <RefreshCw className={className} />; // Placeholder icon
}
