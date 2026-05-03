"use client";

import { motion } from 'framer-motion';
import { User } from 'lucide-react';
import { Customer, Payment, Appointment } from '@/lib/store';

interface CustomerCardProps {
    customer: Customer;
    stats: {
        appt: number;
        spent: number;
    };
    isRisk: boolean;
    onClick: () => void;
}

export function CustomerCard({ customer, stats, isRisk, onClick }: CustomerCardProps) {
    return (
        <motion.div 
            layout
            initial={{ opacity: 0, scale: 0.95 }} 
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            onClick={onClick}
            className="group relative bg-white rounded-[4rem] p-10 shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-indigo-600/10 transition-all cursor-pointer flex flex-col gap-8 overflow-hidden"
        >
            {/* Card Header */}
            <div className="flex justify-between items-start">
                <div className="flex gap-5 items-center">
                    <div className={`w-16 h-16 rounded-[2.5rem] flex items-center justify-center font-black text-2xl transition-all shadow-md border-4 ${
                        customer.segment === 'VIP' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                        isRisk ? 'bg-red-50 border-red-100 text-red-600' :
                        'bg-indigo-50 border-white text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                    }`}>
                        {customer.name.charAt(0)}
                    </div>
                    <div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none group-hover:text-indigo-600 transition-colors">{customer.name}</h3>
                        <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">{customer.phone}</p>
                    </div>
                </div>
                <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${customer.segment === 'VIP' ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                    {customer.segment}
                </div>
            </div>

            {/* Brief Summary with Icons */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-3xl flex flex-col items-center justify-center text-center">
                    <p className="text-xl font-black italic text-gray-900 leading-none">{stats.appt}</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Randevu</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-3xl flex flex-col items-center justify-center text-center">
                    <p className="text-xl font-black italic text-indigo-600 leading-none">₺{stats.spent.toLocaleString('tr-TR')}</p>
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Harcama</p>
                </div>
            </div>

            {/* Freshness Bar */}
            <div className="space-y-1.5">
                <div className="flex justify-between items-end">
                    <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sadakat Tazeliği</p>
                    <p className={`text-[8px] font-black uppercase tracking-widest ${isRisk ? 'text-red-500' : 'text-green-500'}`}>
                        {isRisk ? 'RİSKLİ' : 'TAZE'}
                    </p>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full rounded-full ${isRisk ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: isRisk ? '30%' : '100%' }}
                    />
                </div>
            </div>

            {/* Footer Button */}
            <button className="w-full py-4 bg-gray-50 text-gray-500 rounded-3xl text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">Danışan Detayı</button>
            
            {/* Decoration */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-[0.03] transition-all -z-10 bg-indigo-600 w-full h-full blur-3xl rounded-full" />
        </motion.div>
    );
}
