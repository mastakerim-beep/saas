"use client";

import { motion } from 'framer-motion';
import { Users, Plus, Star, MapPin, Clock } from 'lucide-react';

export default function ClassesPage() {
    return (
        <div className="p-4 lg:p-10 space-y-10">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Group Activities</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic">GRUP DERSLERİ</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-105 active:scale-95 transition-all">
                        <Plus size={18} /> Yeni Seans Tanımla
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                {[1, 2].map((i) => (
                    <motion.div 
                        key={i}
                        initial={{ opacity: 0, x: i % 2 === 0 ? 20 : -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="bg-white border border-gray-100 rounded-[4rem] p-10 shadow-2xl shadow-indigo-100/30 flex flex-col items-center text-center group"
                    >
                        <div className="w-20 h-20 rounded-[2.5rem] bg-indigo-50 flex items-center justify-center text-indigo-600 mb-8 group-hover:rotate-6 transition-transform">
                            <Star size={32} />
                        </div>
                        
                        <h3 className="text-2xl font-black text-gray-900 mb-4 italic uppercase">CrossFit Power Hour</h3>
                        
                        <div className="flex items-center justify-center gap-6 mb-8">
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <Clock size={14} className="text-indigo-400" /> 18:30
                            </div>
                            <div className="w-1 h-1 bg-gray-200 rounded-full" />
                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <MapPin size={14} className="text-indigo-400" /> Ana Salon
                            </div>
                        </div>

                        <div className="w-full bg-gray-50 rounded-3xl p-6 flex items-center justify-between">
                            <div className="flex items-center gap-3 font-black text-indigo-900 text-xs italic">
                                <Users size={16} /> 12 / 15 Katılımcı
                            </div>
                            <button className="px-6 py-2 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest border border-indigo-100 shadow-sm hover:bg-indigo-600 hover:text-white transition-all">İncele</button>
                        </div>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
