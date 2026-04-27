"use client";

import { motion } from 'framer-motion';
import { Zap, Beaker, FileText, Search, User, Microscope } from 'lucide-react';

export default function LabResultsPage() {
    return (
        <div className="p-4 lg:p-10 space-y-10 bg-[#fafafa] min-h-screen">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100">
                            <Zap size={20} />
                        </div>
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em]">Sanctus Klinik Modülü</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Laboratuvar & Test</h1>
                </div>

                <div className="flex items-center gap-4">
                    <button className="px-8 py-4 bg-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-emerald-600 transition-all">
                        Yeni Test Girişi
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-[4rem] p-24 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-8">
                <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-200">
                    <Microscope size={48} />
                </div>
                <div className="max-w-md">
                    <h2 className="text-3xl font-black text-gray-900 italic uppercase mb-4">Analiz Bekleniyor</h2>
                    <p className="text-sm text-gray-400 font-bold leading-relaxed">
                        Laboratuvar sonuçları ve biyometrik test verileri burada listelenecektir. Şu an için aktif bir test kaydı bulunmamaktadır.
                    </p>
                </div>
            </div>
        </div>
    );
}
