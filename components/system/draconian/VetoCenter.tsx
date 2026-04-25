"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, XCircle, AlertTriangle, CheckCircle, Hand } from 'lucide-react';
import { useStore } from '@/lib/store/StoreProvider';

export default function VetoCenter() {
    const { pendingVetoes, approveDraconianVeto, rejectDraconianVeto } = useStore();
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const handleAction = async (id: string, type: 'payment' | 'appointment', action: 'approve' | 'reject') => {
        setActionLoading(id);
        if (action === 'approve') {
            await approveDraconianVeto(type, id);
        } else {
            await rejectDraconianVeto(type, id, "Yönetici inisiyatifiyle reddedildi.");
        }
        setActionLoading(null);
    };

    if (!pendingVetoes || pendingVetoes.length === 0) return null;

    return (
        <div className="w-full bg-slate-900 rounded-xl border border-rose-900/40 p-6 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-rose-500 to-red-600 animate-pulse" />
            
            <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-red-500/20 rounded-xl text-red-500 border border-red-500/30">
                    <Hand className="w-6 h-6" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-white tracking-tight">Veto Merkezi</h2>
                    <p className="text-sm text-slate-400">Yüksek İndirim/Riskli İşlemler İmparator Onayı Bekliyor</p>
                </div>
            </div>

            <div className="space-y-4">
                <AnimatePresence>
                    {pendingVetoes.map((veto: any) => {
                        const { type, data } = veto;
                        const isPayment = type === 'payment';
                        
                        return (
                            <motion.div
                                key={data.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="p-4 bg-black/40 border border-red-900/30 rounded-lg flex flex-col md:flex-row items-center justify-between gap-4"
                            >
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-1">
                                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                                        <span className="text-sm font-bold text-amber-500 tracking-wider">
                                            {isPayment ? 'ŞÜPHELİ TAHSİLAT' : 'ŞÜPHELİ İPTAL'}
                                        </span>
                                    </div>
                                    <h4 className="text-white font-medium">{data.customerName || 'Müşteri'}</h4>
                                    <p className="text-sm text-slate-400 mt-1">
                                        İşlem: {isPayment ? `${data.referenceCode} / ${data.totalAmount} TL` : data.service}
                                        {isPayment && data.originalPrice && (
                                            <span className="ml-2 text-rose-400">(Orj: {data.originalPrice} TL)</span>
                                        )}
                                    </p>
                                </div>
                                <div className="flex items-center gap-3 w-full md:w-auto">
                                    <button
                                        onClick={() => handleAction(data.id, type, 'reject')}
                                        disabled={actionLoading === data.id}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-slate-800 hover:bg-rose-900/50 text-rose-500 rounded-lg border border-rose-900/50 transition-colors disabled:opacity-50"
                                    >
                                        <XCircle className="w-4 h-4" />
                                        <span className="font-medium">Reddet</span>
                                    </button>
                                    <button
                                        onClick={() => handleAction(data.id, type, 'approve')}
                                        disabled={actionLoading === data.id}
                                        className="flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2 bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-400 rounded-lg border border-emerald-500/30 transition-colors disabled:opacity-50"
                                    >
                                        <CheckCircle className="w-4 h-4" />
                                        <span className="font-medium">Onayla & Geçir</span>
                                    </button>
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}
