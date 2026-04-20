"use client";

import { useState, useMemo } from 'react';
import { useStore } from '@/lib/store';
import { 
    Calendar, FileCode, CheckCircle2, AlertTriangle, 
    Search, ChevronRight, LayoutList, TrendingUp, Zap,
    ShieldCheck, CalendarDays, BrainCircuit, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ZReportArchive() {
    const { zReports, currentUser } = useStore();
    const [selectedReportId, setSelectedReportId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const filteredReports = useMemo(() => {
        return zReports
            .filter(r => r.reportDate.includes(searchTerm) || (r.notes || '').toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime());
    }, [zReports, searchTerm]);

    const selectedReport = useMemo(() => 
        zReports.find(r => r.id === selectedReportId), 
    [zReports, selectedReportId]);

    const stats = useMemo(() => {
        const total = zReports.length;
        const risky = zReports.filter(r => (r.notes || '').includes('eksik') || (r.notes || '').includes('risk')).length;
        return { total, risky };
    }, [zReports]);

    return (
        <div className="space-y-8 p-1">
            {/* Header / Stats Overlay */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border-2 border-slate-100 p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/20 relative overflow-hidden group">
                    <LayoutList className="absolute top-4 right-4 w-12 h-12 text-slate-100 group-hover:text-indigo-50 transition-colors" />
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 italic">Toplam Mühür</p>
                    <h3 className="text-3xl font-black text-slate-900 italic tracking-tighter">{stats.total} Rapor</h3>
                    <p className="text-[10px] font-bold text-slate-300 uppercase mt-2">Arşivlenen Günler</p>
                </div>

                <div className="bg-rose-50 border-2 border-rose-100 p-8 rounded-[2.5rem] shadow-xl shadow-rose-200/20 relative overflow-hidden group">
                    <AlertTriangle className="absolute top-4 right-4 w-12 h-12 text-rose-100 group-hover:text-rose-200 transition-colors" />
                    <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-1 italic">Riskli Kapanışlar</p>
                    <h3 className="text-3xl font-black text-rose-600 italic tracking-tighter">{stats.risky} Gün</h3>
                    <p className="text-[10px] font-bold text-rose-300 uppercase mt-2 group-hover:text-rose-400">Yönetici Onaylı Risk</p>
                </div>

                <div className="bg-indigo-600 p-8 rounded-[2.5rem] text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                    <ShieldCheck className="absolute top-4 right-4 w-12 h-12 text-white/10 group-hover:rotate-12 transition-transform" />
                    <p className="text-[10px] font-black uppercase tracking-widest mb-1 opacity-60">Denetim Durumu</p>
                    <h3 className="text-3xl font-black italic tracking-tighter">Aktif Denetim</h3>
                    <p className="text-[10px] font-bold opacity-60 mt-2 uppercase tracking-widest">Aura Imperial Audit v2.0</p>
                </div>
            </div>

            {/* List and Search */}
            <div className="bg-white border-2 border-slate-100 rounded-[3rem] shadow-2xl shadow-slate-200/30 overflow-hidden">
                <div className="p-8 border-b border-slate-50 flex flex-col sm:flex-row justify-between items-center gap-6 bg-slate-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-primary shadow-sm border border-slate-100">
                            <BrainCircuit className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="text-xl font-black italic tracking-tighter text-slate-900 uppercase">Z-Raporu & AI Analiz Arşivi</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">Geçmişe Dönük Operasyonel Kontroller</p>
                        </div>
                    </div>
                    <div className="relative w-full sm:w-80 group">
                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300 group-focus-within:text-primary transition-colors" />
                        <input 
                            type="text" 
                            placeholder="Tarih veya notlarda ara..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-white border-2 border-slate-100 rounded-2xl py-4 pl-14 pr-6 text-sm font-bold text-slate-900 focus:outline-none focus:border-primary transition-all shadow-inner placeholder:text-slate-300 placeholder:font-bold"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-slate-50/30 border-b border-slate-50">
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Rapor Tarihi</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Durum</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Toplam Nakit</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Toplam Kart</th>
                                <th className="px-8 py-5 text-left text-[10px] font-black text-slate-400 uppercase tracking-widest italic">Onaylayan</th>
                                <th className="px-8 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest italic tracking-widest">İşlem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {filteredReports.map((report) => (
                                <tr 
                                    key={report.id} 
                                    className="hover:bg-slate-50/50 transition-all cursor-default group"
                                >
                                    <td className="px-8 py-6">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-500 group-hover:bg-indigo-500 group-hover:text-white transition-all">
                                                <Calendar size={18} />
                                            </div>
                                            <span className="text-sm font-black text-slate-900 tracking-tight italic">
                                                {new Date(report.reportDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-6">
                                        {(report.notes || '').includes('eksik') || (report.notes || '').includes('risk') ? (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-rose-50 text-rose-600 text-[10px] font-black uppercase rounded-full border border-rose-100">
                                                <AlertTriangle size={12} className="animate-pulse" /> Ödeme Eksik
                                            </span>
                                        ) : (
                                            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full border border-emerald-100">
                                                <CheckCircle2 size={12} /> Sorunsuz
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-8 py-6 font-black text-slate-900 italic text-sm">₺{report.actualNakit?.toLocaleString('tr-TR')}</td>
                                    <td className="px-8 py-6 font-black text-indigo-600 italic text-sm">₺{report.actualKart?.toLocaleString('tr-TR')}</td>
                                    <td className="px-8 py-6 text-xs font-bold text-slate-400 uppercase">
                                        {report.closedBy || 'Belirsiz'}
                                    </td>
                                    <td className="px-8 py-6 text-right">
                                        <button 
                                            onClick={() => setSelectedReportId(report.id)}
                                            className="p-3 hover:bg-white hover:shadow-lg hover:border-slate-100 border border-transparent rounded-[1.25rem] text-slate-400 hover:text-primary transition-all active:scale-95"
                                        >
                                            <ChevronRight size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* AI Summary Detail Modal */}
            <AnimatePresence>
                {selectedReport && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md z-[300] flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl overflow-hidden border border-white"
                        >
                            <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-50/30">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200">
                                        <Zap size={24} />
                                    </div>
                                    <div>
                                        <h2 className="text-2xl font-black italic tracking-tighter text-slate-900 uppercase">AI Rapor Detayı</h2>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest italic">{selectedReport.reportDate}</p>
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setSelectedReportId(null)}
                                    className="p-3 hover:bg-slate-100 rounded-2xl transition-all text-slate-400 hover:text-slate-900"
                                >
                                    <X size={20} />
                                </button>
                            </div>
                            
                            <div className="p-10 space-y-8 max-h-[60vh] overflow-y-auto scrollbar-hide">
                                <div className="bg-slate-50/50 p-8 rounded-[2rem] border border-slate-100">
                                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-4 flex items-center gap-2 italic">
                                        <BrainCircuit size={14} /> Aura AI Raporu
                                    </h4>
                                    <div className="whitespace-pre-wrap text-sm font-bold text-slate-600 leading-relaxed italic">
                                        {selectedReport.aiSummary || 'Bu rapor için AI özeti bulunmamaktadır.'}
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Hedef Nakit</p>
                                        <p className="font-black text-base italic">₺{selectedReport.expectedNakit?.toLocaleString('tr-TR')}</p>
                                    </div>
                                    <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100">
                                        <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Hedef Kart</p>
                                        <p className="font-black text-base italic">₺{selectedReport.expectedKart?.toLocaleString('tr-TR')}</p>
                                    </div>
                                </div>

                                {selectedReport.notes && (
                                    <div className="p-6 bg-rose-50 rounded-2xl border border-rose-100 flex items-start gap-4">
                                        <AlertTriangle className="text-rose-500 shrink-0 mt-1" size={18} />
                                        <div>
                                            <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1 italic">Yönetici Notu / Risk</p>
                                            <p className="text-sm font-bold text-rose-700 italic">{selectedReport.notes}</p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="p-8 bg-slate-50/30 border-t border-slate-50">
                                <button 
                                    onClick={() => setSelectedReportId(null)}
                                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-primary transition-all active:scale-95 shadow-lg shadow-black/10 shadow-indigo-100"
                                >
                                    Raporu Kapat
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
