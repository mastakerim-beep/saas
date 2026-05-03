"use client";

import { motion } from 'framer-motion';
import { Bot, Activity, AlertCircle, Target, ChevronRight, CheckCircle } from 'lucide-react';

interface CustomerTabAIProps {
    insights: any[];
}

export function CustomerTabAI({ insights }: CustomerTabAIProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform">
                    <Bot size={200} />
                </div>
                <div className="relative z-10">
                    <div className="mb-10">
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">YZ Strateji Danışmanı</h2>
                        <p className="text-xs text-indigo-600 font-black mt-2 uppercase tracking-widest italic">Danışan verileri üzerinden anlık analiz sonuçları</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                        <div className={`p-7 rounded-[2.5rem] border flex items-center gap-6 ${insights.some(i => i.impact === 'high') ? 'border-red-100 bg-red-50/50' : 'border-indigo-100 bg-indigo-50/50'}`}>
                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${insights.some(i => i.impact === 'high') ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200'}`}>
                                <Bot size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">YZ Durum Notu</p>
                                <p className="text-sm font-black text-gray-900 italic">
                                    {insights.length > 0 ? 
                                        `${insights.length} adet stratejik öneri bulundu.` : 
                                        "Danışan profili stabil."}
                                </p>
                            </div>
                        </div>
                        <div className="p-7 rounded-[2.5rem] border border-gray-100 bg-white shadow-sm flex items-center gap-6">
                            <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                <Activity size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ciro Potansiyeli</p>
                                <p className="text-sm font-black text-gray-900 italic">Bu danışan sistemde aktif bir portföye sahip.</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {insights.map((s: any, idx) => (
                            <div key={idx} className={`p-8 border-2 rounded-[2.5rem] flex items-center gap-6 group transition-all ${s.impact === 'high' ? 'border-red-50 bg-red-50/20' : 'border-indigo-50 bg-indigo-50/10 hover:border-indigo-100'}`}>
                                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${s.impact === 'high' ? 'bg-red-600 text-white shadow-red-100' : 'bg-white text-indigo-600'}`}>
                                    {s.impact === 'high' ? <AlertCircle className="w-8 h-8" /> : <Target className="w-8 h-8" />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-1">
                                        <h4 className="font-black text-xl text-gray-900 italic uppercase tracking-tighter">{s.title}</h4>
                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${s.impact === 'high' ? 'bg-red-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                            {s.impact === 'high' ? 'KRİTİK' : 'FIRSAT'}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-500 font-bold">{s.desc}</p>
                                </div>
                                <button className="p-4 rounded-full bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all transform hover:rotate-12">
                                    <ChevronRight className="w-6 h-6" />
                                </button>
                            </div>
                        ))}
                        {insights.length === 0 && (
                            <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-500 shadow-sm">
                                    <CheckCircle className="w-10 h-10" />
                                </div>
                                <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic leading-tight">Müşteri durumu mükemmel.<br/>Ekstra bir YZ uyarısı bulunmamaktadır.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
