"use client";

import { motion } from "framer-motion";
import { Lock, ShieldAlert, CreditCard, Headphones, Zap, LogOut } from "lucide-react";
import Link from "next/link";
import { useStore } from "@/lib/store";

interface EmpireLockScreenProps {
    reason: 'unpaid' | 'suspended' | 'quota_exceeded' | null;
    message: string;
    slug: string;
}

export default function EmpireLockScreen({ reason, message, slug }: EmpireLockScreenProps) {
    const { logout } = useStore();

    return (
        <div className="fixed inset-0 z-[9999] bg-white/80 backdrop-blur-2xl flex items-center justify-center p-6">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="max-w-2xl w-full bg-black text-white p-12 rounded-[4rem] shadow-2xl relative overflow-hidden text-center"
            >
                {/* Background Decoration */}
                <div className="absolute -top-20 -right-20 opacity-10 pointer-events-none">
                    <Zap size={400} className="text-indigo-500" />
                </div>

                <motion.div 
                    initial={{ rotate: -10 }}
                    animate={{ rotate: 0 }}
                    className="w-24 h-24 bg-rose-600 rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-rose-600/30 border-4 border-rose-500/20"
                >
                    <Lock size={40} className="text-white" />
                </motion.div>

                <div className="space-y-6 relative z-10">
                    <h2 className="text-5xl font-black italic tracking-tighter leading-tight">
                        Sistem Mühürlendi
                    </h2>
                    
                    <div className="bg-white/5 border border-white/10 p-6 rounded-3xl inline-block max-w-lg">
                        <p className="text-lg font-bold text-gray-200 leading-relaxed italic">
                            "{message}"
                        </p>
                    </div>

                    <div className="pt-10 flex flex-col sm:flex-row gap-4 justify-center mt-8">
                        {reason === 'unpaid' && (
                            <Link 
                                href={`/${slug}/billing`}
                                className="flex-1 bg-indigo-600 text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20"
                            >
                                <CreditCard size={18} /> Ödeme Sayfasına Git
                            </Link>
                        )}
                        
                        <button 
                            className="flex-1 bg-white/10 text-white px-8 py-5 rounded-[2rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-white/20 transition-all border border-white/10"
                            onClick={() => window.open('mailto:support@auraspa.io')}
                        >
                            <Headphones size={18} /> Destek Hattı
                        </button>
                    </div>

                    <div className="pt-4">
                        <button 
                            onClick={() => { if(confirm('Oturumu kapatmak istiyor musunuz?')) logout(); }}
                            className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 mx-auto text-[10px] font-black uppercase tracking-widest"
                        >
                            <LogOut size={12} /> Oturumu Kapat
                        </button>
                    </div>

                    <div className="pt-8 flex items-center justify-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest">
                        <ShieldAlert size={14} className="text-rose-500" /> Aura Sovereign Security Protocols
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
