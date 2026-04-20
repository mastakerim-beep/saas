"use client";

import ZReportArchive from '@/components/admin/ZReportArchive';
import { motion } from 'framer-motion';
import { ShieldCheck, CalendarDays } from 'lucide-react';

export default function ReportsPage() {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-8 max-w-[1600px] mx-auto space-y-10"
        >
            <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                    <h1 className="text-4xl font-black italic tracking-tighter text-slate-900 uppercase">Yönetici Denetim Arşivi</h1>
                </div>
                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase ml-11">
                    Mühürlü Z-Raporları, AI Analizleri ve Kasa Mutabakat Geçmişi
                </p>
            </div>

            <ZReportArchive />
        </motion.div>
    );
}
