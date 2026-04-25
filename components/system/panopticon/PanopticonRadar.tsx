"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, Activity, ShieldAlert, UserCheck, Crosshair } from 'lucide-react';
import { useStore } from '@/lib/store/StoreProvider';

export default function PanopticonRadar() {
    const { allLogs } = useStore();
    const [liveFeed, setLiveFeed] = useState<any[]>([]);

    useEffect(() => {
        // En son yapılan 10 işlemi radara al (Gerçekte bu realtime bir presence tablosundan beslenir)
        const recent = allLogs?.slice(0, 5) || [];
        setLiveFeed(recent);
    }, [allLogs]);

    return (
        <div className="w-full bg-slate-950 rounded-xl border border-rose-900/40 p-6 relative overflow-hidden shadow-[0_0_40px_rgba(159,18,57,0.15)] ring-1 ring-inset ring-white/5">
            {/* Background Radar Animation */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300%] h-[300%] rounded-full border border-rose-500/20 shadow-[0_0_100px_rgba(225,29,72,0.1)]"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200%] h-[200%] rounded-full border border-rose-500/30"></div>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full rounded-full border flex items-center justify-center border-rose-500/40">
                    <motion.div 
                        animate={{ rotate: 360 }}
                        transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                        className="w-[1px] h-[50%] bg-gradient-to-t from-transparent via-rose-500 to-transparent absolute top-0 origin-bottom"
                    />
                </div>
            </div>

            <div className="relative z-10 flex items-center justify-between mb-8 pb-4 border-b border-white/10">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-rose-500/20 rounded-lg text-rose-500 ring-1 ring-rose-500/40">
                        <Eye className="w-5 h-5" />
                    </div>
                    <div>
                        <h2 className="text-xl font-semibold text-white tracking-wide">Panopticon Gözetim Ağı</h2>
                        <p className="text-sm text-slate-400">Emperyal Radar: Sistem Hareketleri Canlı İzleniyor</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-3 py-1 bg-red-500/10 rounded-full border border-red-500/20">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-xs font-medium text-red-400 tracking-wider">CANLI (SOVEREIGN)</span>
                </div>
            </div>

            <div className="relative z-10 space-y-4">
                <AnimatePresence>
                    {liveFeed.map((log, i) => (
                        <motion.div
                            key={log.id || i}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            transition={{ delay: i * 0.1 }}
                            className="flex items-center gap-4 p-4 rounded-lg bg-black/40 border border-white/5 backdrop-blur-sm group hover:bg-slate-900 transition-colors"
                        >
                            <div className="p-2 rounded-full bg-slate-800 text-slate-300 group-hover:bg-rose-900/30 group-hover:text-rose-400 transition-colors">
                                {log.type?.includes('Silindi') || log.type?.includes('VETO') ? <ShieldAlert className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                            </div>
                            <div className="flex-1">
                                <div className="flex justify-between items-start">
                                    <h4 className="text-sm font-medium text-white">{log.type || log.action}</h4>
                                    <span className="text-xs text-slate-500 font-mono">
                                        {new Date(log.createdAt || log.date).toLocaleTimeString('tr-TR')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-xs text-amber-500/80 font-medium">{log.user || 'Sistem'}</span>
                                    <span className="text-slate-600 text-xs">→</span>
                                    <span className="text-xs text-slate-400">{log.target || log.customerName}</span>
                                </div>
                            </div>
                            <Crosshair className="w-4 h-4 text-white/10 group-hover:text-rose-500/50 transition-colors" />
                        </motion.div>
                    ))}
                    {liveFeed.length === 0 && (
                        <div className="text-center py-8 text-slate-500">
                            <Activity className="w-8 h-8 mx-auto mb-3 opacity-20" />
                            <p className="text-sm">Şu anda ağda kimse yok. Sessizlik hakim.</p>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
