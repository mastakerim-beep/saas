"use client";

import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Landmark, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { useStore } from '@/lib/store/StoreProvider';
import Header from '@/components/layout/Header';
import Sidebar from '@/components/layout/Sidebar';

export default function TreasuryPage() {
    const { payments, expenses, debts } = useStore();

    // Hazine Simülasyonu (Nakit Akışı)
    const { totalIncome, totalExpense, pendingDebts, projectedCashflow } = useMemo(() => {
        const income = (payments || []).reduce((acc: number, p: any) => acc + (p.totalAmount || 0), 0);
        const exp = (expenses || []).reduce((acc: number, e: any) => acc + (e.amount || 0), 0);
        const pDebts = (debts || []).filter((d: any) => d.status === 'açık').reduce((acc: number, d: any) => acc + (d.amount || 0), 0);
        
        const projected = (income - exp) + (pDebts * 0.6); // Borçların %60'ı tahsil edilecek varsayımı

        return { totalIncome: income, totalExpense: exp, pendingDebts: pDebts, projectedCashflow: projected };
    }, [payments, expenses, debts]);

    return (
        <div className="flex h-screen bg-slate-950 overflow-hidden text-slate-200">
            <Sidebar />
            <div className="flex-1 flex flex-col h-full relative z-10 w-full overflow-hidden">
                <Header />
                <main className="flex-1 overflow-y-auto p-6 lg:p-8 custom-scrollbar">
                    <div className="max-w-7xl mx-auto space-y-8">
                        <div className="flex items-center gap-4 border-b border-white/5 pb-6">
                            <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/20 text-amber-500">
                                <Landmark className="w-8 h-8" />
                            </div>
                            <div>
                                <h1 className="text-3xl font-bold text-white tracking-tight">The Treasury</h1>
                                <p className="text-slate-400 mt-1">İmparatorluk Hazinesi ve Simüle Edilmiş Nakit Akışı Yönetimi</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Stats */}
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-slate-900 border border-emerald-500/20">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg"><TrendingUp className="w-5 h-5"/></div>
                                </div>
                                <p className="text-sm text-slate-400 font-medium tracking-wide text-transform uppercase">Toplam Tahsilat</p>
                                <h3 className="text-2xl font-bold text-white mt-1">₺{totalIncome.toLocaleString('tr-TR')}</h3>
                            </motion.div>
                            
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-6 rounded-2xl bg-slate-900 border border-rose-500/20">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-rose-500/10 text-rose-400 rounded-lg"><TrendingDown className="w-5 h-5"/></div>
                                </div>
                                <p className="text-sm text-slate-400 font-medium tracking-wide text-transform uppercase">Toplam Gider / Prim</p>
                                <h3 className="text-2xl font-bold text-white mt-1">₺{totalExpense.toLocaleString('tr-TR')}</h3>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="p-6 rounded-2xl bg-slate-900 border border-amber-500/20">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-amber-500/10 text-amber-400 rounded-lg"><DollarSign className="w-5 h-5"/></div>
                                </div>
                                <p className="text-sm text-slate-400 font-medium tracking-wide text-transform uppercase">Açık Borçlar Merkezi</p>
                                <h3 className="text-2xl font-bold text-white mt-1">₺{pendingDebts.toLocaleString('tr-TR')}</h3>
                            </motion.div>

                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="p-6 rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/30">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="p-2 bg-amber-500/20 text-amber-400 rounded-lg"><Landmark className="w-5 h-5"/></div>
                                </div>
                                <p className="text-sm text-amber-200/80 font-medium tracking-wide text-transform uppercase">Projekte Edilen Kasa 30G</p>
                                <h3 className="text-3xl font-black text-amber-400 mt-1">₺{projectedCashflow.toLocaleString('tr-TR', { maximumFractionDigits: 0 })}</h3>
                            </motion.div>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
