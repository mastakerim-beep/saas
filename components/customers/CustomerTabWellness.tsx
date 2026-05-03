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
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm p-10 flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden grid-pattern">
                <div className="flex items-center gap-8 relative z-10">
                    <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-[2rem] flex items-center justify-center shadow-2xl shadow-indigo-200">
                        <Activity className="w-10 h-10 text-white" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase italic text-gray-900 leading-none">Wellness & Bio-Intelligence</h3>
                        <p className="text-indigo-500 font-black uppercase tracking-[0.3em] text-[9px] mt-2 opacity-80">
                            {latestBio?.source === 'Manuel' ? 'Imperial Diagnostic Protocol' : 'Technogym Mywellness Quantum Sync'}
                        </p>
                    </div>
                </div>
                <div className="flex gap-4 relative z-10">
                    <div className="px-8 py-3 bg-white/50 backdrop-blur-md rounded-2xl border border-gray-100 flex flex-col items-center justify-center">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-0.5">Son Senkronizasyon</p>
                        <p className="text-sm font-black text-indigo-600">{latestBio ? new Date(latestBio.createdAt).toLocaleDateString('tr-TR') : 'BAĞLANTI YOK'}</p>
                    </div>
                    <button 
                        onClick={onAddMeasure}
                        className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-2xl shadow-indigo-600/30 flex items-center gap-3"
                    >
                        <Plus className="w-4 h-4" /> YENİ ÖLÇÜM
                    </button>
                    <button className="px-6 py-4 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10 flex items-center justify-center">
                        <RefreshCw className="w-4 h-4" />
                    </button>
                </div>
            </div>

            {!latestBio ? (
                <div className="bg-white border-2 border-dashed border-gray-100 rounded-[4rem] py-40 text-center flex flex-col items-center gap-8 grid-pattern">
                    <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200">
                        <Activity size={48} />
                    </div>
                    <div>
                        <h4 className="text-xl font-black text-gray-400 uppercase tracking-[0.3em]">Biyometrik Veri Bekleniyor</h4>
                        <p className="text-[11px] font-bold text-gray-300 mt-3 max-w-sm mx-auto leading-relaxed">Danışanın vücut kompozisyonu, metabolik hızı ve sağlık skorlarını takip etmek için ilk ölçümü gerçekleştirin.</p>
                    </div>
                    <button 
                        onClick={onAddMeasure}
                        className="px-12 py-5 bg-gradient-to-r from-indigo-600 to-purple-700 text-white rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest shadow-2xl shadow-indigo-600/20 hover:scale-105 transition-all"
                    >
                        İLK TEŞHİSİ BAŞLAT
                    </button>
                </div>
            ) : (
                <>
                    {/* Main Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Ağırlık', value: latestBio.weight || '---', unit: 'kg', icon: Target, color: 'indigo', status: 'normal' },
                            { label: 'Yağ Oranı', value: latestBio.bodyFatPercent || '---', unit: '%', icon: Activity, color: 'amber', status: (latestBio.bodyFatPercent || 0) > 25 ? 'warning' : 'optimal' },
                            { label: 'Kas Kütlesi', value: latestBio.muscleFatPercent || '---', unit: 'kg', icon: Zap, color: 'emerald', status: 'optimal' },
                            { label: 'Meta. Yaş', value: latestBio.wellnessAge || '---', unit: 'yaş', icon: Heart, color: 'rose', status: 'normal' },
                        ].map((stat, i) => (
                            <div key={i} className="bg-white rounded-[2.5rem] p-8 border border-gray-50 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group relative overflow-hidden">
                                <div className="absolute inset-0 grid-pattern opacity-5" />
                                <div className="flex justify-between items-start mb-6 relative z-10">
                                    <div className={`p-4 rounded-2xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-all duration-500`}>
                                        <stat.icon className="w-6 h-6" />
                                    </div>
                                    <span className={`text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest ${
                                        stat.status === 'optimal' ? 'bg-emerald-100 text-emerald-600' : 
                                        stat.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                                    }`}>{stat.status}</span>
                                </div>
                                <div className="relative z-10">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-4xl font-black italic tracking-tighter text-gray-900 leading-none">{stat.value}</span>
                                        <span className="text-[10px] font-black text-gray-300 uppercase italic">{stat.unit}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Advanced Biometrics Panel */}
                        <div className="lg:col-span-2 bg-white rounded-[3.5rem] border border-gray-100 p-12 shadow-sm space-y-10 relative overflow-hidden">
                            <div className="absolute inset-0 grid-pattern opacity-5" />
                            <div className="flex justify-between items-center border-b border-gray-50 pb-8 relative z-10">
                                <h4 className="text-2xl font-black italic tracking-tighter uppercase italic text-gray-900">Quantum Body Analysis</h4>
                                <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 hover:gap-4 transition-all">ANALİZ GEÇMİŞİ <ChevronRight className="w-4 h-4" /></button>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-12 relative z-10">
                                <div className="space-y-6">
                                    <div className="p-8 bg-gray-50/50 rounded-3xl flex justify-between items-center border border-gray-50 hover:border-indigo-100 transition-all">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Viseral Yağ</p>
                                            <p className="text-2xl font-black italic tracking-tighter">Level {latestBio.visceralFatLevel || '---'}</p>
                                        </div>
                                        <div className="w-16 h-3 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                                            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600" style={{ width: `${(latestBio.visceralFatLevel || 0) * 10}%` }} />
                                        </div>
                                    </div>
                                    <div className="p-8 bg-gray-50/50 rounded-3xl flex justify-between items-center border border-gray-50 hover:border-indigo-100 transition-all">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bazal Metabolizma</p>
                                            <p className="text-2xl font-black italic tracking-tighter">{latestBio.basalMetabolism || '---'} <span className="text-xs text-gray-300">kcal</span></p>
                                        </div>
                                        <RefreshCw className="w-6 h-6 text-indigo-200" />
                                    </div>
                                </div>

                                <div className="flex flex-col justify-center items-center p-10 bg-indigo-50/40 rounded-[3rem] border border-indigo-100 relative overflow-hidden group">
                                    <Bot className="w-32 h-32 text-indigo-100 absolute -bottom-8 -right-12 rotate-12 group-hover:scale-110 transition-transform duration-700" />
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl shadow-indigo-200 mb-6 relative z-10">
                                        <Sparkles className="w-6 h-6" />
                                    </div>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-6 relative z-10">Aura AI Advisor</p>
                                    <div className="text-center space-y-4 relative z-10">
                                        <p className="text-sm font-bold text-gray-700 italic leading-relaxed">
                                            {(latestBio.bodyFatPercent || 0) > 20 
                                                ? "Analiz sonuçları yağ oranında artış trendi gösteriyor. Detoks programı önerilir." 
                                                : "Vücut kompozisyonu altın oranda. Mevcut antrenman yoğunluğu korunmalıdır."}
                                        </p>
                                        <div className="h-[1px] bg-indigo-200 w-1/3 mx-auto" />
                                        <p className="text-[11px] font-black text-indigo-500 uppercase tracking-widest">Önerilen Protokol: <span className="text-indigo-700">Deep Wellness</span></p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Wellness Scores */}
                        <div className="bg-slate-950 rounded-[3.5rem] p-12 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute inset-0 grid-pattern-dark opacity-10" />
                            <div className="absolute -top-10 -right-10 p-20 opacity-10">
                                <Shield size={180} className="text-indigo-500" />
                            </div>
                            <div className="relative z-10">
                                <h4 className="text-2xl font-black italic tracking-tighter uppercase italic mb-12">Fonksiyonel Performans</h4>
                                <div className="space-y-10">
                                    {[
                                        { name: 'Mobilite', score: latestBio.mobilityScore || 0, color: 'from-amber-400 to-orange-500' },
                                        { name: 'Denge & Stabilite', score: latestBio.balanceScore || 0, color: 'from-cyan-400 to-blue-500' },
                                        { name: 'Kas Kuvveti', score: latestBio.strengthScore || 0, color: 'from-rose-400 to-red-600' }
                                    ].map((s, i) => (
                                        <div key={i} className="space-y-3">
                                            <div className="flex justify-between items-center">
                                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">{s.name}</span>
                                                <span className="text-[13px] font-black italic text-white tracking-widest">{s.score}<span className="text-[9px] text-gray-600 ml-1">/100</span></span>
                                            </div>
                                            <div className="h-2.5 bg-white/10 rounded-full overflow-hidden shadow-inner">
                                                <motion.div 
                                                    initial={{ width: 0 }}
                                                    animate={{ width: `${s.score}%` }}
                                                    transition={{ duration: 1, delay: i * 0.2 }}
                                                    className={`h-full bg-gradient-to-r ${s.color} rounded-full`}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="mt-12 bg-white/5 backdrop-blur-md border border-white/10 p-8 rounded-3xl flex items-center gap-6 relative z-10 group cursor-help">
                                <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-2xl shadow-indigo-600/20 group-hover:scale-110 transition-transform">
                                    <Zap className="w-7 h-7 fill-white" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 mb-1">Aura Health Status</p>
                                    <p className="text-xl font-black italic text-white uppercase italic tracking-tighter">İmparatorluk Standardı</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </motion.div>
    );
}
