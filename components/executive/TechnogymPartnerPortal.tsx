"use client";

import { motion } from "framer-motion";
import { Activity, ShieldCheck, Zap, TrendingUp, Sparkles, ArrowRight, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { TechnogymIntelligence } from "@/lib/services/TechnogymIntelligence";
import { useStore } from "@/lib/store";

export default function TechnogymPartnerPortal() {
    const { currentBusiness } = useStore();
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentBusiness?.id) {
            TechnogymIntelligence.getActionableInsights(currentBusiness.id)
                .then(setInsights)
                .finally(() => setLoading(false));
        }
    }, [currentBusiness]);

    return (
        <div className="space-y-8 p-1">
            {/* Header / Brand Connection */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-2xl">
                        <Activity className="text-white w-8 h-8" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
                            Technogym <span className="text-indigo-600">x</span> Aura
                        </h2>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Hardware-to-Revenue Bridge</p>
                    </div>
                </div>
                
                <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <div className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest">Mywellness Cloud: Connected</span>
                </div>
            </div>

            {/* Main Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="card-apple p-8 bg-white/40 backdrop-blur-xl border-white/60">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Sync Status</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">Real-Time</h3>
                    <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase">
                        <TrendingUp size={12} /> Last sync: 2 mins ago
                    </div>
                </div>
                <div className="card-apple p-8 bg-white/40 backdrop-blur-xl border-white/60">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Active Biometrics</p>
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">{insights.length * 42} <span className="text-sm font-bold text-gray-300">Records</span></h3>
                    <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase">
                        <Zap size={12} /> +12 New Today
                    </div>
                </div>
                <div className="card-apple p-8 bg-indigo-600 text-white shadow-xl shadow-indigo-500/20">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Conversion Value</p>
                    <h3 className="text-2xl font-black tracking-tighter">₺12,450</h3>
                    <p className="text-[9px] font-bold text-white/50 mt-1 uppercase">Predicted Revenue from AI Recommendations</p>
                </div>
            </div>

            {/* AI Action Board */}
            <div className="card-apple p-8 bg-white/40 backdrop-blur-xl border-white/60">
                <div className="flex items-center gap-3 mb-8">
                    <Sparkles className="text-indigo-600 w-5 h-5" />
                    <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase">AI Revenue Recommendations</h3>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="h-20 bg-gray-50 animate-pulse rounded-2xl" />
                    ) : insights.map((insight, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: i * 0.1 }}
                            className="p-6 bg-white border border-gray-100 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6 hover:shadow-lg transition-all"
                        >
                            <div className="flex items-center gap-5">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-white ${insight.priority === 'high' ? 'bg-rose-500' : 'bg-indigo-500'}`}>
                                    {insight.customerName.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="text-sm font-black text-gray-900">{insight.customerName}</h4>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Wellness Age: {insight.wellnessAge}</span>
                                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                        <span className="text-[9px] font-black text-indigo-500 uppercase">{insight.source.replace('_', ' ')}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex-1 px-8">
                                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                                    <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{insight.recommendation.title}</p>
                                    <p className="text-[9px] text-gray-500 font-bold mt-1">{insight.recommendation.description}</p>
                                </div>
                            </div>

                            <button className="px-6 py-3 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all flex items-center gap-2">
                                {insight.recommendation.action}
                                <ArrowRight size={14} />
                            </button>
                        </motion.div>
                    ))}

                    {insights.length === 0 && !loading && (
                        <div className="text-center py-20 opacity-30">
                            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-xs font-black uppercase tracking-widest">No Actionable Insights Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Exit Proof Section */}
            <div className="p-8 bg-gray-900 rounded-[3rem] text-white relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:opacity-10 transition-opacity">
                    <ShieldCheck size={150} />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Activity className="text-indigo-400 w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-[0.4em] text-indigo-400">Exit Proof: Asset Integration</span>
                    </div>
                    <h3 className="text-2xl font-black mb-4 leading-tight italic">Neden Technogym AURA'yı Satın Almalı?</h3>
                    <p className="text-gray-400 text-sm font-semibold leading-relaxed mb-8 max-w-2xl">
                        AURA, donanım verisini (biometrics) finansal değere (revenue) dönüştüren tek ERP sistemidir. 
                        Technogym bu sistemle sadece bir cihaz üreticisi değil, lüks wellness işletmelerinin 
                        merkezi operasyonel beyni haline gelir.
                    </p>
                    <div className="flex flex-wrap gap-4">
                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest">Global Scalability</div>
                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest">B2C Monetization</div>
                        <div className="px-4 py-2 bg-white/5 rounded-xl border border-white/10 text-[9px] font-black uppercase tracking-widest">Automated Recovery Upsell</div>
                    </div>
                </div>
            </div>
        </div>
    );
}
