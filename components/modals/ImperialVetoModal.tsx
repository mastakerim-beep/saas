"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { ShieldAlert, X, Save, Terminal, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface ImperialVetoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    title?: string;
    description?: string;
}

export default function ImperialVetoModal({ 
    isOpen, 
    onClose, 
    onConfirm, 
    title = "İmparatorluk Müdahalesi (Veto)",
    description = "Bu kayıt mühürlenmiş durumdadır. Bu müdahale sistemsel düzeyde loglanacak ve denetçilere bildirilecektir."
}: ImperialVetoModalProps) {
    const [reason, setReason] = useState('');

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-6">
            <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={onClose}
                className="absolute inset-0 bg-gray-950/80 backdrop-blur-xl" 
            />
            
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-white dark:bg-zinc-900 w-full max-w-lg rounded-[3rem] shadow-2xl relative overflow-hidden border border-zinc-200 dark:border-zinc-800"
            >
                {/* Header with Hazard Pattern */}
                <div className="h-2 w-full bg-gradient-to-r from-amber-500 via-orange-600 to-amber-500" />
                
                <div className="p-8 lg:p-12">
                    <div className="flex items-center gap-6 mb-8">
                        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 border border-amber-200 dark:border-amber-900/30">
                            <ShieldAlert size={32} />
                        </div>
                        <div>
                            <h3 className="text-2xl font-black text-gray-900 dark:text-white italic uppercase tracking-tight">{title}</h3>
                            <p className="text-[10px] font-bold text-amber-600 uppercase tracking-[0.2em] mt-1">Drakoniyen Bypass Protokolü</p>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-950/20 p-6 rounded-2.5xl mb-8 border border-amber-100 dark:border-amber-900/20 flex gap-4">
                        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                        <p className="text-xs text-amber-900 dark:text-amber-200 font-bold leading-relaxed">
                            {description}
                        </p>
                    </div>

                    <div className="space-y-4">
                        <div className="relative">
                            <Terminal className="absolute left-4 top-4 text-zinc-400" size={16} />
                            <textarea 
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                rows={4}
                                className="w-full bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-4 pl-12 text-sm font-bold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-500 transition-all resize-none"
                                placeholder="Müdahale gerekçesini giriniz..."
                            />
                        </div>
                        
                        <div className="flex gap-4">
                            <button 
                                onClick={onClose}
                                className="flex-1 py-4 bg-zinc-100 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-all"
                            >
                                Vazgeç
                            </button>
                            <button 
                                disabled={!reason.trim()}
                                onClick={() => onConfirm(reason)}
                                className="flex-[2] py-4 bg-gray-900 dark:bg-amber-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-xl shadow-amber-500/10 hover:bg-amber-500 disabled:opacity-50 disabled:hover:bg-gray-900 transition-all flex items-center justify-center gap-3"
                            >
                                <Save size={18} /> Protokolü Onayla
                            </button>
                        </div>
                    </div>
                </div>

                {/* Footer Trace */}
                <div className="bg-zinc-50 dark:bg-zinc-950/50 p-6 px-10 border-t border-zinc-100 dark:border-zinc-800">
                    <div className="flex items-center justify-between text-[8px] font-black text-zinc-400 uppercase tracking-[0.3em]">
                        <span>Audit Level: Level 3</span>
                        <span>Trace ID: {crypto.randomUUID().slice(0, 8)}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
