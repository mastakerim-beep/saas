"use client";

import { motion } from 'framer-motion';
import { Calendar, Banknote, TrendingUp, Activity } from 'lucide-react';
import { Appointment, Payment } from '@/lib/store';

interface CustomerTabYolculukProps {
    appts: Appointment[];
    payments: Payment[];
}

export function CustomerTabYolculuk({ appts, payments }: CustomerTabYolculukProps) {
    const journeyItems = [
        ...appts.map((a: Appointment) => ({ type: 'appt', date: a.date, data: a })), 
        ...payments.map((p: Payment) => ({ type: 'payment', date: p.date, data: p }))
    ].sort((a,b) => b.date.localeCompare(a.date));

    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl">
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-10 opacity-5">
                    <TrendingUp className="w-64 h-64" />
                 </div>
                 <div className="flex items-center gap-6 mb-12 border-b border-gray-50 pb-8">
                    <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white">
                        <Activity className="w-10 h-10" />
                    </div>
                    <div>
                        <h3 className="text-3xl font-black italic tracking-tighter uppercase italic">Müşteri Yolculuğu</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Aura Intelligence Otomatik Zaman Çizelgesi</p>
                    </div>
                 </div>

                 <div className="space-y-12 relative before:absolute before:inset-0 before:left-[2.25rem] before:w-0.5 before:bg-gray-50 pb-10">
                    {journeyItems.map((item, idx) => (
                        <div key={idx} className="flex gap-10 relative">
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 shadow-sm 
                                ${item.type === 'appt' ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'}`}>
                                {item.type === 'appt' ? <Calendar className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                            </div>
                            <div className="flex-1 pt-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic">{item.date}</span>
                                    <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                        item.type === 'appt' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-green-50 text-green-600 border-green-100'
                                    }`}>
                                        {item.type === 'appt' ? 'Randevu' : 'Tahsilat'}
                                    </span>
                                </div>
                                <h4 className="text-xl font-black italic tracking-tighter uppercase italic">
                                    {item.type === 'appt' ? (item.data as any).service : `₺${(item.data as any).totalAmount.toLocaleString('tr-TR')} Ödeme`}
                                </h4>
                                <p className="text-gray-500 text-sm font-bold mt-1">
                                    {item.type === 'appt' ? `${(item.data as any).staffName} ile seans` : (item.data as any).service}
                                </p>
                            </div>
                        </div>
                    ))}
                    {journeyItems.length === 0 && (
                        <div className="py-20 text-center text-gray-300 uppercase font-black tracking-widest text-xs">Henüz bir yolculuk verisi bulunmamaktadır</div>
                    )}
                 </div>
            </div>
        </motion.div>
    );
}
