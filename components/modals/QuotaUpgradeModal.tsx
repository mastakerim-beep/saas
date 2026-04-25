"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowUpCircle, Crown, Info, Zap } from "lucide-react";
import Link from "next/link";

interface QuotaUpgradeModalProps {
    isOpen: boolean;
    onClose: () => void;
    resource: 'Şube' | 'Personel';
    limit: number;
    slug: string;
}

export default function QuotaUpgradeModal({ isOpen, onClose, resource, limit, slug }: QuotaUpgradeModalProps) {
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-md flex items-center justify-center p-4">
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="max-w-xl w-full bg-white rounded-[3rem] shadow-2xl relative overflow-hidden"
                >
                    {/* Header Image/Icon Section */}
                    <div className="h-48 bg-black relative flex items-center justify-center overflow-hidden">
                        <div className="absolute inset-0 opacity-20">
                            <Zap size={300} className="text-indigo-400 -ml-20 -mt-20" />
                        </div>
                        <motion.div 
                            animate={{ y: [0, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 4 }}
                            className="relative z-10 w-24 h-24 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/40 border-4 border-indigo-400/20"
                        >
                            <Crown size={48} />
                        </motion.div>
                    </div>

                    <button 
                        onClick={onClose}
                        className="absolute top-6 right-6 w-10 h-10 bg-white/10 hover:bg-white/20 text-white rounded-2xl flex items-center justify-center transition-all z-20"
                    >
                        <X size={20} />
                    </button>

                    <div className="p-10 space-y-8 text-center">
                        <div className="space-y-4">
                            <h3 className="text-3xl font-black text-gray-900 italic tracking-tighter">
                                Sınırların Ötesine Geçin
                            </h3>
                            <p className="text-gray-500 font-bold leading-relaxed text-sm">
                                Mevcut planınızdaki <strong>{limit} {resource}</strong> kotasına ulaştınız. Operasyonunuzu büyütmek için Aura Enterprise seviyesine yükseltin.
                            </p>
                        </div>

                        <div className="bg-indigo-50 border border-indigo-100 p-5 rounded-2xl flex gap-3 text-left">
                            <Info className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                            <p className="text-[11px] font-bold text-indigo-700 leading-tight">
                                Aura Enterprise ile sınırsız şube, sınırsız personel ve gelişmiş AI analitiği anında aktif hale gelir.
                            </p>
                        </div>

                        <div className="space-y-4">
                            <Link 
                                href={`/${slug}/billing`}
                                onClick={onClose}
                                className="w-full bg-indigo-600 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/10 active:scale-95"
                            >
                                <ArrowUpCircle size={18} /> ENTERPRISE PLANINA YÜKSELT
                            </Link>
                            <button 
                                onClick={onClose}
                                className="w-full text-gray-400 font-black text-[10px] uppercase tracking-[0.2em] hover:text-gray-600 transition-colors"
                            >
                                ŞİMDİ DEĞİL, DAHA SONRA
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
