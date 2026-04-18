'use client';

import { Check, QrCode } from 'lucide-react';
import { motion } from 'framer-motion';

export default function WalletPassTicket({ 
    businessName, 
    serviceName, 
    date, 
    time, 
    staffName, 
    customerName,
    ticketId
}: any) {
    return (
        <div className="mt-8 animate-[slideUp_0.5s_ease] perspective-1000">
            <motion.div 
                initial={{ rotateX: 90 }}
                animate={{ rotateX: 0 }}
                transition={{ duration: 0.8, type: "spring" }}
                className="bg-black text-white p-6 rounded-[2.5rem] shadow-2xl relative overflow-hidden group hover:scale-105 transition-all w-full max-w-sm mx-auto"
            >
                {/* Visual Effects */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/30 rounded-full blur-[50px] pointer-events-none" />
                <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-pink-500/20 rounded-full blur-[50px] pointer-events-none" />

                <div className="flex justify-between items-start mb-6 relative z-10 w-full">
                    <div className="text-left w-full">
                        <div className="flex items-center gap-2 mb-4">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Apple_Wallet_Icon.svg/1024px-Apple_Wallet_Icon.svg.png" alt="Wallet" className="w-5 h-5 object-contain" />
                            <span className="text-[10px] font-black uppercase text-white/50 tracking-widest">Apple Wallet</span>
                        </div>
                        <h3 className="text-xl font-black">{businessName}</h3>
                        <p className="text-xs text-white/60 font-semibold">{serviceName} • {staffName}</p>
                    </div>
                </div>

                <div className="bg-white/10 p-4 rounded-2xl flex items-center justify-between backdrop-blur-md border border-white/10 relative z-10 mb-6">
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Tarih</p>
                        <p className="font-bold text-sm">{date}</p>
                    </div>
                    <div className="h-8 w-px bg-white/20 mx-2" />
                    <div className="text-right">
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Saat</p>
                        <p className="font-bold text-sm">{time}</p>
                    </div>
                </div>

                <div className="bg-white p-4 rounded-2xl flex flex-col items-center justify-center relative z-10 py-6">
                    <QrCode className="w-24 h-24 text-black mb-2" />
                    <p className="text-black font-black text-xs tracking-widest uppercase">Kiosktan Okutun</p>
                    <p className="text-gray-400 font-bold text-[9px] mt-1 tracking-widest">{ticketId || 'TICKET-19034'}</p>
                </div>

                <button className="w-full mt-4 bg-white/20 hover:bg-white/30 backdrop-blur-md text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all shadow-inner border border-white/10">
                    Cüzdana Ekle
                </button>
            </motion.div>
        </div>
    );
}
