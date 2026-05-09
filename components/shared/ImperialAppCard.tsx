'use client';

import React from 'react';
import { Smartphone, Download, Sparkles, ShieldCheck, ChevronRight } from 'lucide-react';
import { motion } from 'framer-motion';

export default function ImperialAppCard() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 bg-gradient-to-br from-[#020210] to-[#0A0A20] rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl border border-white/5"
        >
            {/* Background Glows */}
            <div className="absolute -top-10 -right-10 w-40 h-40 bg-indigo-500/20 blur-[80px] rounded-full" />
            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 blur-[80px] rounded-full" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-8">
                {/* Mock Phone Visual */}
                <div className="relative shrink-0">
                    <div className="w-24 h-48 bg-[#121225] border-4 border-[#1A1A35] rounded-[2rem] overflow-hidden shadow-2xl relative">
                        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1.5 bg-white/10 rounded-full" />
                        <div className="mt-8 px-3">
                            <div className="w-full h-1 bg-indigo-500/40 rounded-full mb-2" />
                            <div className="w-2/3 h-1 bg-white/5 rounded-full mb-4" />
                            <div className="grid grid-cols-2 gap-1.5">
                                <div className="h-8 bg-white/5 rounded-lg border border-white/5" />
                                <div className="h-8 bg-white/5 rounded-lg border border-white/5" />
                            </div>
                        </div>
                        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
                            <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                                <Sparkles size={10} className="text-indigo-400" />
                            </div>
                        </div>
                    </div>
                    {/* Floating Badge */}
                    <div className="absolute -top-4 -right-4 bg-indigo-600 px-3 py-1.5 rounded-full shadow-xl border border-white/20 animate-bounce">
                        <span className="text-[8px] font-black uppercase tracking-widest">YENİ</span>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center justify-center md:justify-start gap-2 mb-3">
                        <Smartphone className="w-4 h-4 text-indigo-400" />
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-400">Imperial B2C Ecosystem</span>
                    </div>
                    <h3 className="text-2xl font-black mb-3 tracking-tight">Imperial Mobile App</h3>
                    <p className="text-sm text-gray-400 font-medium mb-6 leading-relaxed">
                        Wellness yolculuğunuzu cebinize taşıyın. AI destekli <strong className="text-white">Günün Özeti</strong>, biyometrik Technogym içgörüleri ve anlık randevu yönetimi.
                    </p>
                    
                    <div className="flex flex-col sm:flex-row gap-3">
                        <button className="flex-1 bg-white text-black h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-xs hover:bg-indigo-50 transition-all active:scale-95 group">
                            <Download size={16} />
                            APP STORE
                            <ChevronRight size={14} className="opacity-40 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <button className="flex-1 bg-white/5 border border-white/10 h-12 rounded-2xl flex items-center justify-center gap-2 font-black text-xs hover:bg-white/10 transition-all active:scale-95">
                            <Download size={16} />
                            GOOGLE PLAY
                        </button>
                    </div>
                </div>
            </div>

            <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-center md:justify-start gap-6 text-[10px] font-bold text-gray-500">
                <div className="flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-emerald-500/60" />
                    BİYOMETRİK GÜVENLİK
                </div>
                <div className="flex items-center gap-1.5">
                    <Sparkles size={14} className="text-amber-500/60" />
                    AI WELLNESS MOTORU
                </div>
            </div>
        </motion.div>
    );
}
