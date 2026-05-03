"use client";

import { motion } from 'framer-motion';
import { Activity, Target, Zap, Heart, Shield, Bot, RefreshCw, Plus, ChevronRight } from 'lucide-react';
import { Customer } from '@/lib/store';

interface CustomerTabWellnessProps {
    customer: Customer;
    latestBio: any;
    onAddMeasure: () => void;
}

export function CustomerTabWellness({ customer, latestBio, onAddMeasure }: CustomerTabWellnessProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 pb-20">
            {/* Header / Sync Status */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                        <Activity className="w-8 h-8 text-white" />
                    </div>
                    <div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase italic">Wellness & Biyometrik</h3>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">
                            {latestBio?.source === 'Manuel' ? 'Manuel Ölçüm Verileri' : 'Technogym Mywellness Entegrasyonu'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4">
                    <div className="px-6 py-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center">
                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Son Veri</p>
                        <p className="text-xs font-black text-gray-900">{latestBio ? new Date(latestBio.createdAt).toLocaleDateString('tr-TR') : 'Kayıt Yok'}</p>
                    </div>
                    <button 
                        onClick={onAddMeasure}
                        className="px-8 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-amber-500/20 flex items-center gap-3"
                    >
                        <Plus className="w-4 h-4" /> ÖLÇÜM EKLE
                    </button>
                    <button className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10 flex items-center gap-3">
                        <RefreshCw className="w-4 h-4" /> SYNC
                    </button>
                </div>
            </div>

            {!latestBio ? (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] py-32 text-center flex flex-col items-center gap-6">
                    <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300">
                        <Activity size={40} />
                    </div>
                    <div>
                        <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Henüz Biyometrik Veri Girişi Yapılmamış</p>
                        <p className="text-[10px] font-bold text-gray-300 mt-2">Müşterinin vücut kompozisyonu ve fitness seviyesini takip etmek için ilk ölçümü ekleyin.</p>
                    </div>
                    <button 
                        onClick={onAddMeasure}
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all"
                    >
                        İLK ÖLÇÜMÜ KAYDET
                    </button>
                </div>
            ) : (
                <>
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Ağırlık', value: latestBio.weight || '---', unit: 'kg', icon: Target, color: 'indigo', status: 'normal' },
                            { label: 'Yağ %', value: latestBio.bodyFatPercent || '---', unit: '%', icon: Activity, color: 'amber', status: (latestBio.bodyFatPercent || 0) > 25 ? 'warning' : 'normal' },
                            { label: 'Kas Kütlesi', value: latestBio.muscleFatPercent || '---', unit: 'kg', icon: Zap, color: 'blue', status: 'good' },
                            { label: 'Meta. Yaş', value: latestBio.wellnessAge || '---', unit: 'yaş', icon: Heart, color: 'green', status: 'normal' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white rounded-[2rem] p-8 border border-gray-50 shadow-sm hover:shadow-md transition-all group">
                                <div className="flex justify-between items-start mb-6">
                                    <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                                        <stat.icon className="w-5 h-5" />
                                    </div>
                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                                        stat.status === 'good' ? 'bg-green-100 text-green-600' : 
                                        stat.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                                    }`}>{stat.status}</span>
                                </div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-4xl font-black italic tracking-tighter text-gray-900">{stat.value}</span>
                                    <span className="text-sm font-black text-gray-400 uppercase italic">{stat.unit}</span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Advanced Biometrics Panel */}
                        <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm space-y-10">
                            <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                                <h4 className="text-xl font-black italic tracking-tighter uppercase italic">Detaylı Analiz</h4>
                                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">GEÇMİŞİ GÖR <ChevronRight className="w-4 h-4" /></button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-6">
                                    <div className="p-6 bg-gray-50/50 rounded-2xl flex justify-between items-center border border-gray-100">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">İç Yağlanma</p>
                                            <p className="text-xl font-black italic tracking-tighter">Seviye {latestBio.visceralFatLevel || '---'}</p>
                                        </div>
                                        <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-green-500" style={{ width: `${(latestBio.visceralFatLevel || 0) * 10}%` }} />
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50/50 rounded-2xl flex justify-between items-center border border-gray-100">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Bazal Metabolizma</p>
                                            <p className="text-xl font-black italic tracking-tighter">{latestBio.basalMetabolism || '---'} kcal</p>
                                        </div>
                                    </div>
                                    <div className="p-6 bg-gray-50/50 rounded-2xl flex justify-between items-center border border-gray-100">
                                        <div>
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Veri Kaynağı</p>
                                            <p className="text-xl font-black italic tracking-tighter">{latestBio.source}</p>
                                        </div>
                                        <span className="text-[10px] font-black px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg">Doğrulanmış</span>
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center items-center p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-50 relative overflow-hidden">
                                    <Bot className="w-24 h-24 text-indigo-100 absolute -bottom-4 -right-10 rotate-12" />
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Wellness Advisor</p>
                                    <div className="text-center space-y-4 relative z-10">
                                        <p className="text-sm font-bold text-gray-700 italic leading-snug">
                                            {(latestBio.bodyFatPercent || 0) > 20 
                                                ? "Yağ oranı düşüşü için kardiyo ve diyet planı güncellenmelidir." 
                                                : "Vücut analizi ideal seviyelerde. Mevcut rutini korumanız önerilir."}
                                        </p>
                                        <div className="h-[1px] bg-indigo-100 w-1/2 mx-auto" />
                                        <p className="text-[10px] font-black text-indigo-400 italic">YZ Önerilen Hizmet: Aura Detoks</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Wellness Scores */}
                        <div className="bg-black rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-10 opacity-10">
                                <Shield size={160} />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-xl font-black italic tracking-tighter uppercase italic mb-10">Fonksiyonel Skor</h4>
                                <div className="space-y-8">
                                    {[
                                        { name: 'Mobilite', score: latestBio.mobilityScore || 0, color: 'bg-yellow-400' },
                                        { name: 'Denge', score: latestBio.balanceScore || 0, color: 'bg-cyan-400' },
                                        { name: 'Güç', score: latestBio.strengthScore || 0, color: 'bg-rose-400' }
                                    ].map((s, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.name}</span>
                                                <span className="text-[10px] font-black uppercase tracking-widest text-white">{s.score}/100</span>
                                            </div>
                                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${s.score}%` }}
                                                    className={`h-full ${s.color} rounded-full`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-12 bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                                <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                    <Zap className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Wellness Seviyesi</p>
                                    <p className="text-lg font-black italic text-white uppercase italic tracking-tighter">İmparatorluk Standardı</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
}
