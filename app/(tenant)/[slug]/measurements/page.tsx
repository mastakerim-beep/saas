"use client";

import { motion } from 'framer-motion';
import { TrendingUp, Ruler, Plus, Calendar, ChevronRight } from 'lucide-react';

export default function MeasurementsPage() {
    return (
        <div className="p-4 lg:p-10 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em]">Performance Tracking</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">VÜCUT ÖLÇÜMLERİ</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-3 px-8 py-4 bg-orange-500 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-orange-200 hover:scale-105 active:scale-95 transition-all">
                        <Plus size={18} /> Yeni Ölçüm Girişi
                    </button>
                </div>
            </div>

            <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-2xl shadow-gray-200/50">
                <div className="p-10 border-b border-gray-50 flex items-center justify-between">
                    <h3 className="font-black text-gray-900 uppercase tracking-widest">Son Ölçümler</h3>
                    <div className="flex gap-2">
                         <div className="w-3 h-3 rounded-full bg-emerald-500" />
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Veriler Güncel</span>
                    </div>
                </div>
                
                <div className="divide-y divide-gray-50">
                    {[1, 2, 3].map((i) => (
                        <motion.div 
                            key={i}
                            whileHover={{ backgroundColor: 'rgba(249, 115, 22, 0.02)' }}
                            className="p-8 flex items-center justify-between group cursor-pointer transition-colors"
                        >
                            <div className="flex items-center gap-6">
                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all">
                                    <Ruler size={20} />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 italic uppercase">Rutin Kontrol #{i}</h4>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                                        <Calendar size={12} /> 24 Nisan 2026
                                    </p>
                                </div>
                            </div>
                            
                            <div className="flex items-center gap-12 text-center sr-only md:not-sr-only">
                                <div>
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Yağ %</p>
                                    <p className="text-xl font-black text-gray-900 italic">14.2</p>
                                </div>
                                <div>
                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Kilo</p>
                                    <p className="text-xl font-black text-gray-900 italic">78.5</p>
                                </div>
                            </div>

                            <ChevronRight size={20} className="text-gray-200 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
