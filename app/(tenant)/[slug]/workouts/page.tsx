"use client";

import { motion } from 'framer-motion';
import { Activity, Dumbbell, Play, Plus, Search, Sparkles } from 'lucide-react';

export default function WorkoutsPage() {
    return (
        <div className="p-4 lg:p-10 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                            <Dumbbell size={20} />
                        </div>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Fitness Vertical</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">ANTRENMAN PROGRAMLARI</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-3 px-8 py-4 bg-amber-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-amber-200 hover:scale-105 active:scale-95 transition-all">
                        <Plus size={18} /> Yeni Program Oluştur
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map((i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-xl shadow-gray-200/50 group cursor-pointer hover:border-amber-200 transition-all"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="w-14 h-14 rounded-2.5xl bg-amber-50 flex items-center justify-center text-amber-600 group-hover:scale-110 transition-transform">
                                <Activity size={24} />
                            </div>
                            <span className="px-4 py-1.5 bg-gray-50 text-gray-400 text-[9px] font-black uppercase rounded-full">Taslak</span>
                        </div>
                        
                        <h3 className="text-xl font-black text-gray-900 mb-2 truncate italic">Hipertrofi Protokolü #{i}</h3>
                        <p className="text-sm text-gray-400 font-medium mb-6 line-clamp-2">İleri seviye sporcular için 12 haftalık gelişim odaklı antrenman dizisi.</p>
                        
                        <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex -space-x-2">
                                {[1, 2, 3].map(u => (
                                    <div key={u} className="w-8 h-8 rounded-full bg-gray-200 border-2 border-white" />
                                ))}
                            </div>
                            <button className="p-3 bg-gray-50 text-amber-600 rounded-xl hover:bg-amber-500 hover:text-white transition-all">
                                <Play size={16} fill="currentColor" />
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            <div className="bg-amber-50 rounded-[4rem] p-12 border border-amber-100 flex flex-col items-center text-center space-y-6">
                <div className="w-20 h-20 rounded-[2.5rem] bg-white flex items-center justify-center text-amber-500 shadow-xl shadow-amber-200/50">
                    <Sparkles size={32} />
                </div>
                <h2 className="text-3xl font-black text-amber-900 tracking-tight italic">Fitness Katmanı Hazırlanıyor</h2>
                <p className="max-w-md text-amber-700/70 font-bold text-sm leading-relaxed">
                    Fitness modülünüz başarıyla aktif edildi. Kişisel antrenman programları, ölçüm takibi ve grup dersleri özellikleri geliştirme aşamasındadır.
                </p>
            </div>
        </div>
    );
}
