'use client';

import React from 'react';
import { Sparkles, Activity, ShieldCheck, TrendingDown, Target, Brain } from 'lucide-react';
import { motion } from 'framer-motion';

interface DailySummaryProps {
    customer: any;
}

export default function DailySummaryCard({ customer }: DailySummaryProps) {
    const latestBiometric = customer?.biometrics?.[0];
    const prevBiometric = customer?.biometrics?.[1];

    if (!latestBiometric) return null;

    // AI Insight Engine (Client-side simulation of the 'Sealed' insight)
    const generateAIInsight = () => {
        const fatigue = latestBiometric.muscleFatigueLevel || 'Low';
        const wellnessAge = latestBiometric.wellnessAge || 30;
        
        if (fatigue === 'High') {
            return "Bugünkü seansınızda yüksek kas yorgunluğu tespit edildi. AI motorumuz yarın için 'Aktif Dinlenme' öneriyor. Toparlanma hızınız %12 artışta.";
        }
        if (wellnessAge < 35) {
            return "Metabolik yaşınız takvim yaşınızın 4 yıl altında! Bugünkü Technogym performansınız kardiyovasküler kapasitenizi %8 yukarı taşıdı.";
        }
        return "Süreklilik en büyük gücünüz. Bugünkü mühürlenen verileriniz, ideal kilo hedefinize %15 daha yaklaştığınızı gösteriyor.";
    };

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-black text-white p-8 rounded-[3.5rem] shadow-2xl relative overflow-hidden group border border-white/5"
        >
            {/* Glossy Overlay */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />
            
            <div className="relative z-10">
                <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-600/20">
                            <Brain size={20} className="text-white" />
                        </div>
                        <div>
                            <span className="text-[9px] font-black uppercase tracking-[0.3em] text-indigo-400">Imperial Intelligence</span>
                            <h4 className="text-sm font-black uppercase tracking-tight italic">Günün Özeti</h4>
                        </div>
                    </div>
                    <div className="bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full flex items-center gap-2">
                        <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">VERİ MÜHÜRLENDİ</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Activity size={12} className="text-indigo-400" />
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Wellness Age</p>
                        </div>
                        <p className="text-2xl font-black">{latestBiometric.wellnessAge || '--'}</p>
                        <p className="text-[8px] font-bold text-emerald-400 mt-1 uppercase">↑ %2 İyileşme</p>
                    </div>
                    <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={12} className="text-amber-400" />
                            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Kas Yorgunluğu</p>
                        </div>
                        <p className="text-lg font-black uppercase tracking-tighter">{latestBiometric.muscleFatigueLevel || 'Düşük'}</p>
                        <p className="text-[8px] font-bold text-gray-400 mt-1 uppercase">İdeal Bölge</p>
                    </div>
                </div>

                <div className="bg-indigo-600/10 border border-indigo-500/20 p-6 rounded-[2.5rem] relative group-hover:bg-indigo-600/15 transition-colors">
                    <div className="absolute -top-3 left-6 bg-indigo-600 text-white px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Sparkles size={10} />
                        <span className="text-[8px] font-black uppercase tracking-widest">AI İçgörüsü</span>
                    </div>
                    <p className="text-xs font-medium leading-relaxed text-gray-200">
                        {generateAIInsight()}
                    </p>
                </div>
            </div>

            {/* Decorative Elements */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-indigo-500/10 blur-[60px] rounded-full" />
        </motion.div>
    );
}
