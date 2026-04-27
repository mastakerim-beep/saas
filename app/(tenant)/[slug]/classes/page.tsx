"use client";

import { motion } from 'framer-motion';
import { Users, Plus, Search, Calendar, Clock, MapPin } from 'lucide-react';

export default function ClassesPage() {
    return (
        <div className="p-4 lg:p-10 space-y-10 bg-[#fafafa] min-h-screen">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
                            <Users size={20} />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em]">Titan Fitness Modülü</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Grup Dersleri</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button className="px-8 py-4 bg-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-orange-600 transition-all">
                        Ders Programı Oluştur
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {[1, 2, 3].map(i => (
                    <motion.div 
                        key={i}
                        whileHover={{ y: -10 }}
                        className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-50 space-y-6"
                    >
                        <div className="flex justify-between items-start">
                            <div className="p-4 bg-orange-50 rounded-2xl text-orange-600">
                                <Users size={24} />
                            </div>
                            <span className="px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full">Kontenjan Var</span>
                        </div>
                        
                        <div>
                            <h3 className="text-xl font-black text-gray-900 uppercase italic">CrossFit Elite</h3>
                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Antrenör: Demir Yılmaz</p>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center gap-3 text-gray-500">
                                <Calendar size={16} />
                                <span className="text-[11px] font-bold uppercase tracking-wider">Bugün, 18:30</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-500">
                                <MapPin size={16} />
                                <span className="text-[11px] font-bold uppercase tracking-wider">Alt Kat - Area A</span>
                            </div>
                        </div>

                        <button className="w-full py-4 bg-gray-50 hover:bg-orange-50 text-gray-900 hover:text-orange-600 font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all border border-transparent hover:border-orange-100">
                            Rezervasyon Yönet
                        </button>
                    </motion.div>
                ))}
            </div>
        </div>
    );
}
