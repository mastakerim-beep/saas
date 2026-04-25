'use client';

import { useState } from 'react';
import { useStore, Appointment } from '@/lib/store';
import { QrCode, Search, CheckCircle2, AlertCircle, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function KioskClient() {
    const { appointments, updateAppointmentStatus } = useStore();
    const [ticketId, setTicketId] = useState('');
    const [status, setStatus] = useState<'idle' | 'scanning' | 'success' | 'error'>('idle');
    const [matchedAppt, setMatchedAppt] = useState<Appointment | null>(null);

    const handleCheckIn = async (e?: React.FormEvent) => {
        if (e) e.preventDefault();
        if (!ticketId) return;

        setStatus('scanning');
        
        // Simüle edilmiş bir arama, normalde veritabanında "ticket_id" = ticketId diye arar.
        // TicketId consists of the first chunk of the Appointment UUID
        const found = appointments.find((a: Appointment) => 
            (a.status === 'pending' || a.status === 'confirmed') &&
            a.id.toUpperCase().startsWith(ticketId.toUpperCase().replace('TK-', ''))
        );

        setTimeout(async () => {
            if (found) {
                setMatchedAppt(found);
                await updateAppointmentStatus(found.id, 'arrived');
                setStatus('success');
                setTimeout(() => {
                    setStatus('idle');
                    setTicketId('');
                    setMatchedAppt(null);
                }, 5000);
            } else {
                setStatus('error');
                setTimeout(() => setStatus('idle'), 3000);
            }
        }, 1500);
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center relative overflow-hidden font-sans">
            {/* Background Effects */}
            <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-indigo-600/20 rounded-full blur-[150px] pointer-events-none animate-pulse" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none" />

            <div className="w-full max-w-2xl px-8 relative z-10 text-center flex flex-col items-center">
                
                <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-white mb-4">
                    Aura<span className="text-indigo-500">Spa</span> Check-in
                </h1>
                <p className="text-gray-400 font-semibold mb-12 flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-emerald-500" /> Tam Korumalı Kayıt Sistemi
                </p>

                <AnimatePresence mode="wait">
                    {status === 'idle' && (
                        <motion.div 
                            key="idle"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="w-full"
                        >
                            <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-12 rounded-[3.5rem] shadow-2xl relative overflow-hidden group">
                                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                
                                <div className="w-32 h-32 bg-indigo-500/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 border border-white/10 relative z-10 group-hover:scale-105 transition-transform duration-500">
                                    <QrCode className="w-16 h-16 text-indigo-400" />
                                </div>
                                <h2 className="text-2xl font-black text-white mb-2 relative z-10">Karekodunuzu Okutun</h2>
                                <p className="text-white/50 text-sm font-semibold mb-10 relative z-10">veya bilet numaranızı manuel girin</p>

                                <form onSubmit={handleCheckIn} className="flex gap-4 max-w-sm mx-auto relative z-10">
                                    <div className="relative flex-1">
                                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                                        <input 
                                            value={ticketId}
                                            onChange={(e) => setTicketId(e.target.value)}
                                            type="text" 
                                            placeholder="TK-XXXX"
                                            className="w-full bg-black/50 border border-white/20 focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 font-black text-white outline-none transition tracking-widest uppercase placeholder-gray-600"
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={!ticketId}
                                        className="bg-indigo-600 text-white font-black px-8 rounded-2xl hover:bg-indigo-500 transition shadow-lg disabled:opacity-50"
                                    >
                                        GİRİŞ
                                    </button>
                                </form>
                            </div>
                        </motion.div>
                    )}

                    {status === 'scanning' && (
                        <motion.div 
                            key="scanning"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="bg-white/10 backdrop-blur-3xl p-12 rounded-[3.5rem] text-center"
                        >
                            <div className="w-24 h-24 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin mx-auto mb-6" />
                            <h2 className="text-2xl font-black text-white">Bilet Doğrulanıyor...</h2>
                        </motion.div>
                    )}

                    {status === 'success' && (
                        <motion.div 
                            key="success"
                            initial={{ opacity: 0, scale: 0.9, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0 }}
                            className="bg-emerald-500/10 backdrop-blur-3xl border border-emerald-500/30 p-12 rounded-[3.5rem] w-full text-center relative overflow-hidden"
                        >
                            <div className="absolute inset-0 bg-emerald-500/5 shine-effect" />
                            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-[0_0_40px_rgba(16,185,129,0.5)]">
                                <CheckCircle2 className="w-12 h-12 text-white" />
                            </div>
                            <h2 className="text-3xl font-black text-white mb-2">Hoş Geldiniz, {matchedAppt?.customerName || 'Misafirimiz'}!</h2>
                            <p className="text-emerald-200 font-semibold mb-6">Check-in işleminiz başarıyla tamamlandı.</p>
                            
                            <div className="bg-black/40 p-4 rounded-2xl inline-block text-left text-sm font-bold text-gray-300">
                                <p><span className="text-gray-500">Hizmet:</span> <span className="text-white">{matchedAppt?.service || 'VIP Bakım'}</span></p>
                                <p><span className="text-gray-500">Uzman:</span> <span className="text-white">{matchedAppt?.staffName || 'Atanıyor..'}</span></p>
                            </div>
                            
                            <p className="text-[10px] uppercase tracking-widest text-emerald-500/50 mt-8 font-black">Sistem Tarafından Otomatik Olarak 'Geldi' Statüsüne Alındı</p>
                        </motion.div>
                    )}

                    {status === 'error' && (
                        <motion.div 
                            key="error"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0 }}
                            className="bg-red-500/10 backdrop-blur-3xl border border-red-500/30 p-12 rounded-[3.5rem] text-center"
                        >
                            <div className="w-24 h-24 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <AlertCircle className="w-12 h-12 text-red-500" />
                            </div>
                            <h2 className="text-2xl font-black text-white mb-2">Bilet Bulunamadı</h2>
                            <p className="text-red-200 font-semibold">Girdiğiniz numaraya ait bir barkod kaydı veya randevu bulunamadı.</p>
                        </motion.div>
                    )}
                </AnimatePresence>

            </div>
        </div>
    );
}
