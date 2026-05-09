"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Activity, ShieldCheck, Zap, TrendingUp, Sparkles, ArrowRight, Brain, Target, DollarSign, RefreshCw, Users } from "lucide-react";
import { useState, useEffect } from "react";
import { TechnogymIntelligence } from "@/lib/services/TechnogymIntelligence";
import { useStore } from "@/lib/store";
import { toast } from "sonner";

export default function TechnogymPartnerPortal() {
    const { currentBusiness, customers, marketingRules } = useStore();
    const [insights, setInsights] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isSimulating, setIsSimulating] = useState(false);

    const loadInsights = async () => {
        if (currentBusiness?.id) {
            setLoading(true);
            try {
                const data = await TechnogymIntelligence.getActionableInsights(currentBusiness.id);
                setInsights(data);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        }
    };

    useEffect(() => {
        loadInsights();
    }, [currentBusiness]);

    const handleSimulateSync = async () => {
        if (!currentBusiness?.id || !customers?.[0]?.id) {
            toast.error("No business or customer context found.");
            return;
        }
        
        setIsSimulating(true);
        try {
            // Simulate 3 different syncs
            await TechnogymIntelligence.triggerMockSync(currentBusiness.id, customers[0].id);
            toast.success("Technogym Mywellness Sync Successful!");
            await loadInsights();
        } catch (err) {
            toast.error("Sync failed");
        } finally {
            setIsSimulating(false);
        }
    };

    const hasActiveAutomation = marketingRules.some((r: any) => r.triggerType === 'TECHNOGYM_BIOMETRIC' && r.isActive);

    return (
        <div className="space-y-8 p-1">
            {/* Header / Brand Connection */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 bg-black rounded-2xl flex items-center justify-center shadow-2xl border border-white/10">
                        <Activity className="text-white w-8 h-8" />
                    </div>
                    <div className="flex flex-col">
                        <h2 className="text-2xl font-black tracking-tighter text-gray-900 dark:text-white uppercase italic">
                            Technogym <span className="text-indigo-600">x</span> Aura
                        </h2>
                        <div className="flex items-center gap-2">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Imperial Intelligence Engine</p>
                            {hasActiveAutomation && (
                                <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black uppercase rounded-full animate-pulse">Auto-Pilot Active</span>
                            )}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                    {!hasActiveAutomation && (
                        <a 
                            href={`/${currentBusiness?.slug}/marketing`}
                            className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline flex items-center gap-2 mr-4"
                        >
                            <Zap size={14} /> Otomasyon Kur
                        </a>
                    )}
                    <button 
                        onClick={handleSimulateSync}
                        disabled={isSimulating}
                        className="px-6 py-3 bg-white border border-gray-200 text-gray-900 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-50 transition-all flex items-center gap-2 shadow-sm"
                    >
                        <RefreshCw size={14} className={isSimulating ? "animate-spin" : ""} />
                        {isSimulating ? "Syncing..." : "Simulate Live Sync"}
                    </button>

                    <div className="px-6 py-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 flex items-center gap-3">
                        <div className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest">Mywellness Cloud: Active</span>
                    </div>
                </div>
            </div>

            {/* Main Stats - Glassmorphism Bento */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="card-apple p-6 bg-white/40 backdrop-blur-xl border-white/60">
                    <div className="flex items-center gap-2 mb-4">
                        <Target className="text-indigo-600 w-4 h-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Aura Health Score</p>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">84<span className="text-lg text-gray-300">/100</span></h3>
                    <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-emerald-600 uppercase">
                        <TrendingUp size={12} /> +4% vs last week
                    </div>
                </div>
                
                <div className="card-apple p-6 bg-white/40 backdrop-blur-xl border-white/60">
                    <div className="flex items-center gap-2 mb-4">
                        <Activity className="text-indigo-600 w-4 h-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Biometric Density</p>
                    </div>
                    <h3 className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter">{insights.length * 12} <span className="text-sm font-bold text-gray-300">Nodes</span></h3>
                    <div className="mt-4 flex items-center gap-2 text-[9px] font-black text-indigo-600 uppercase">
                        <Zap size={12} /> High-fidelity data stream
                    </div>
                </div>

                <div className="card-apple p-6 bg-white/40 backdrop-blur-xl border-white/60 md:col-span-2 bg-gradient-to-br from-indigo-600 to-violet-700 text-white border-none shadow-xl shadow-indigo-500/20">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <DollarSign className="text-white/60 w-4 h-4" />
                            <p className="text-[10px] font-black text-white/60 uppercase tracking-widest">Potential Revenue (Next 7 Days)</p>
                        </div>
                        <Sparkles className="text-indigo-300 w-4 h-4 animate-pulse" />
                    </div>
                    <h3 className="text-4xl font-black tracking-tighter">₺{insights.reduce((acc, curr) => acc + (curr.projectedRevenue || 0), 12450).toLocaleString()}</h3>
                    <p className="text-[10px] font-bold text-white/50 mt-2 uppercase tracking-tight">AI-Driven revenue opportunities from biometric fatigue triggers</p>
                </div>
            </div>

            {/* AI Insight Engine */}
            <div className="card-apple p-8 bg-white/40 backdrop-blur-xl border-white/60">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <Brain className="text-indigo-600 w-6 h-6" />
                        <div>
                            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight uppercase">Revenue Insight Engine</h3>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Hardware Signal to Financial Action</p>
                        </div>
                    </div>
                    <div className="px-4 py-2 bg-indigo-50 rounded-full border border-indigo-100 flex items-center gap-2">
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">AI Confidence: 94.2%</span>
                    </div>
                </div>

                <div className="space-y-6">
                    <AnimatePresence mode="popLayout">
                        {loading ? (
                            <div className="space-y-4">
                                {[1, 2, 3].map(i => (
                                    <div key={i} className="h-24 bg-gray-50 animate-pulse rounded-[2rem]" />
                                ))}
                            </div>
                        ) : insights.map((insight, i) => (
                            <motion.div 
                                key={`${insight.customerId}-${insight.timestamp}`}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ delay: i * 0.05 }}
                                className="p-6 bg-white border border-gray-100 rounded-[2.5rem] flex flex-col lg:flex-row items-center gap-8 hover:shadow-xl transition-all group"
                            >
                                {/* Customer Identity */}
                                <div className="flex items-center gap-5 min-w-[220px]">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-white text-xl shadow-lg ${insight.priority === 'high' ? 'bg-rose-500 shadow-rose-200' : 'bg-indigo-500 shadow-indigo-200'}`}>
                                        {insight.customerName.charAt(0)}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black text-gray-900">{insight.customerName}</h4>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full uppercase">Wellness Age: {insight.wellnessAge}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* The Reasoning (The AI Part) */}
                                <div className="flex-1">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-indigo-50/30 group-hover:border-indigo-100 transition-colors">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Target size={12} className="text-indigo-600" />
                                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">{insight.recommendation.title}</p>
                                            </div>
                                            <p className="text-[10px] text-gray-500 font-semibold leading-relaxed">{insight.recommendation.description}</p>
                                        </div>
                                        <div className="p-4 bg-emerald-50/30 rounded-2xl border border-emerald-100/50">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Brain size={12} className="text-emerald-600" />
                                                <p className="text-[10px] font-black text-emerald-700 uppercase tracking-tight">AI Reasoning</p>
                                            </div>
                                            <p className="text-[10px] text-emerald-600/80 font-bold italic">"{insight.recommendation.aiReasoning}"</p>
                                        </div>
                                    </div>
                                </div>

                                {/* The Action & Value */}
                                <div className="flex items-center gap-6 min-w-[200px]">
                                    <div className="text-right">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Est. Revenue</p>
                                        <p className="text-lg font-black text-gray-900">₺{insight.projectedRevenue}</p>
                                        <div className="flex items-center justify-end gap-1 mt-1">
                                            <div className="w-12 h-1 bg-gray-100 rounded-full overflow-hidden">
                                                <div className="h-full bg-indigo-500" style={{ width: `${insight.confidenceScore}%` }} />
                                            </div>
                                            <span className="text-[8px] font-black text-indigo-500">{insight.confidenceScore}%</span>
                                        </div>
                                    </div>
                                    <button className="h-14 px-6 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-black hover:scale-105 active:scale-95 transition-all flex items-center gap-2 shadow-lg shadow-indigo-200 group-hover:shadow-indigo-300">
                                        {insight.recommendation.action}
                                        <ArrowRight size={14} />
                                    </button>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>

                    {insights.length === 0 && !loading && (
                        <div className="text-center py-20 opacity-30">
                            <Zap className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                            <p className="text-xs font-black uppercase tracking-widest">No Actionable Insights Found</p>
                        </div>
                    )}
                </div>
            </div>

            {/* B2C Preview - The Customer Journey */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-2 space-y-6">
                    <div className="card-apple p-8 bg-white/40 backdrop-blur-xl border-white/60 h-full">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <Activity className="text-indigo-600 w-6 h-6" />
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">Biometric Stream History</h3>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Fleet Monitor</span>
                        </div>
                        
                        {/* Placeholder for a chart - using CSS bars for now for speed/stability */}
                        <div className="h-64 flex items-end justify-between gap-2 px-4 border-b border-gray-100 pb-2">
                            {[40, 70, 45, 90, 65, 80, 30, 95, 50, 75, 40, 85].map((h, i) => (
                                <motion.div 
                                    key={i}
                                    initial={{ height: 0 }}
                                    animate={{ height: `${h}%` }}
                                    className={`w-full rounded-t-lg ${h > 80 ? 'bg-rose-500' : 'bg-indigo-500/40'}`}
                                />
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 px-4">
                            <span className="text-[8px] font-black text-gray-400 uppercase">08:00</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase">12:00</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase">16:00</span>
                            <span className="text-[8px] font-black text-gray-400 uppercase">20:00</span>
                        </div>
                    </div>
                </div>

                {/* Mobile Mockup - Imperial Wellness App */}
                <div className="flex justify-center">
                    <div className="w-[280px] h-[580px] bg-[#0a0a0b] rounded-[3rem] border-[8px] border-gray-800 shadow-2xl relative overflow-hidden flex flex-col">
                        {/* Status Bar */}
                        <div className="h-10 flex items-end justify-between px-6 pb-2">
                            <span className="text-[10px] font-bold text-white">9:41</span>
                            <div className="flex items-center gap-1.5">
                                <div className="w-3 h-3 bg-white/20 rounded-full" />
                                <div className="w-5 h-2.5 bg-emerald-500 rounded-sm" />
                            </div>
                        </div>

                        {/* App Content */}
                        <div className="flex-1 p-5 overflow-y-auto space-y-6">
                            <div className="flex items-center justify-between">
                                <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                    <Users size={18} className="text-white" />
                                </div>
                                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest italic">Imperial App</span>
                            </div>

                            <div className="pt-4">
                                <h4 className="text-white text-xl font-black tracking-tight leading-tight mb-1 italic">Hoş Geldin, Kerim</h4>
                                <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Bugün harika bir performans sergiledin.</p>
                            </div>

                            {/* The AI Offer Card (Simulated) */}
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 1 }}
                                className="p-5 bg-gradient-to-br from-indigo-600 to-violet-700 rounded-3xl shadow-xl border border-white/10 relative overflow-hidden"
                            >
                                <div className="absolute -top-4 -right-4 w-16 h-16 bg-white/10 rounded-full blur-xl" />
                                <div className="relative z-10">
                                    <div className="flex items-center gap-2 mb-3">
                                        <Zap size={14} className="text-amber-300" />
                                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Akıllı Toparlanma</span>
                                    </div>
                                    <h5 className="text-white font-black text-sm leading-snug mb-3">Kas yorgunluğun %92 seviyesinde. Hızlı toparlanma ister misin?</h5>
                                    <div className="p-3 bg-white/10 rounded-xl mb-4">
                                        <p className="text-[9px] text-white/80 font-bold tracking-tight">Sana özel %20 indirimli "Recovery Massage" fırsatı hazır!</p>
                                    </div>
                                    <button className="w-full py-2.5 bg-white text-indigo-600 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-lg">
                                        ŞİMDİ REZERVE ET
                                    </button>
                                </div>
                            </motion.div>

                            {/* Recent Activity */}
                            <div className="space-y-3 pt-4">
                                <p className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Son Antrenman</p>
                                <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase">Leg Press</p>
                                        <p className="text-[8px] text-white/40 font-bold">12 Reps x 4 Sets</p>
                                    </div>
                                    <TrendingUp size={14} className="text-emerald-500" />
                                </div>
                            </div>
                        </div>

                        {/* Home Indicator */}
                        <div className="h-6 flex justify-center items-center">
                            <div className="w-20 h-1 bg-white/20 rounded-full" />
                        </div>
                    </div>
                </div>
            </div>

            {/* The "Exit" Strategic Value Footer */}
            <div className="p-10 bg-black rounded-[4rem] text-white relative overflow-hidden group shadow-2xl">
                <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-all group-hover:scale-110">
                    <ShieldCheck size={200} />
                </div>
                
                <div className="relative z-10 grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <Activity className="text-indigo-400 w-6 h-6" />
                            <span className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-400">Strategic Asset: Technogym Bridge</span>
                        </div>
                        <h3 className="text-4xl font-black mb-6 leading-tight italic tracking-tighter">Hardware into Revenue.</h3>
                        <p className="text-gray-400 text-base font-medium leading-relaxed mb-10">
                            AURA, Technogym cihazlarını sadece bir egzersiz aleti olmaktan çıkarıp, 
                            işletme sahibi için bir **"Satış Temsilcisi"** haline getirir. 
                            Biyometrik sinyalleri anlık olarak ciro fırsatına dönüştüren bu mimari, 
                            wellness endüstrisinin gelecekteki standartıdır.
                        </p>
                        <div className="flex flex-wrap gap-4">
                            {["Biometric Upsell Engine", "LTV Maximizer", "Zero-Churn AI", "Global API Mesh"].map(tag => (
                                <div key={tag} className="px-5 py-2 bg-white/5 rounded-2xl border border-white/10 text-[10px] font-black uppercase tracking-widest text-white/70">
                                    {tag}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="card-apple bg-white/5 backdrop-blur-2xl border-white/10 p-10">
                        <h4 className="text-xl font-black mb-6 tracking-tight">Financial Impact Analysis</h4>
                        <div className="space-y-6">
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Est. Revenue Uplift</span>
                                <span className="text-2xl font-black text-emerald-400">+28.4%</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Churn Reduction</span>
                                <span className="text-2xl font-black text-indigo-400">-15.2%</span>
                            </div>
                            <div className="flex justify-between items-end border-b border-white/5 pb-4">
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">Automation Efficiency</span>
                                <span className="text-2xl font-black text-white">92%</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
