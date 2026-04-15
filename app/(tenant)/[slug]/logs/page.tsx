"use client";

import { useStore } from "@/lib/store";
import { 
    Terminal, Search, Filter, Calendar as CalendarIcon, 
    User, ArrowRight, History, Shield, Info, AlertTriangle,
    CheckCircle2, Clock, Trash2, Edit3, PlusCircle, Move,
    ChevronDown, Download, Zap
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { tr } from "date-fns/locale";

export default function KernelLogsPage() {
    const { allLogs } = useStore();
    const [search, setSearch] = useState("");
    const [filter, setFilter] = useState("Tümü");

    const categories = ["Tümü", "Randevu", "Müşteri", "Finans", "Sistem"];

    const filteredLogs = useMemo(() => {
        return allLogs
            .filter(log => {
                const matchesSearch = log.customerName?.toLowerCase().includes(search.toLowerCase()) || 
                                     log.action.toLowerCase().includes(search.toLowerCase()) ||
                                     log.user.toLowerCase().includes(search.toLowerCase());
                
                if (filter === "Tümü") return matchesSearch;
                if (filter === "Randevu") return matchesSearch && log.action.includes("Randevu");
                if (filter === "Müşteri") return matchesSearch && log.action.includes("Müşteri");
                if (filter === "Finans") return matchesSearch && (log.action.includes("Ödeme") || log.action.includes("Borç") || log.action.includes("Gider"));
                if (filter === "Sistem") return matchesSearch && (!log.action.includes("Randevu") && !log.action.includes("Müşteri") && !log.action.includes("Ödeme"));
                return matchesSearch;
            })
            .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    }, [allLogs, search, filter]);

    const getActionIcon = (action: string) => {
        if (action.includes("Oluşturuldu") || action.includes("Kaydedildi")) return <PlusCircle className="text-emerald-500" size={18} />;
        if (action.includes("Silindi")) return <Trash2 className="text-rose-500" size={18} />;
        if (action.includes("Güncellendi") || action.includes("Değişti")) return <Edit3 className="text-amber-500" size={18} />;
        if (action.includes("Taşındı")) return <Move className="text-indigo-500" size={18} />;
        if (action.includes("Ödeme") || action.includes("Tahsil")) return <CheckCircle2 className="text-emerald-500" size={18} />;
        return <Info className="text-gray-400" size={18} />;
    };

    return (
        <div className="p-8 pb-32 max-w-7xl mx-auto animate-[fadeIn_0.5s_ease]">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-gray-900 rounded-xl shadow-lg">
                            <Terminal className="w-6 h-6 text-white" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-gray-900">Kernel Logs</h1>
                    </div>
                    <p className="text-gray-500 font-medium tracking-tight">İşletme bünyesinde gerçekleşen tüm atomik hareketler ve sistem günlükleri.</p>
                </div>

                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-gray-900 transition-all shadow-sm">
                        <Download size={14} />
                        Dışa Aktar (.CSV)
                    </button>
                    <div className="h-12 w-[1px] bg-gray-100 hidden md:block mx-2" />
                    <div className="flex items-center gap-1.5 p-1.5 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="px-4 py-2 bg-emerald-500 rounded-xl text-[10px] font-black text-white uppercase tracking-widest shadow-lg shadow-emerald-500/20">
                            Live Sync
                        </div>
                    </div>
                </div>
            </div>

            {/* Dashboard Stats (Atomic View) */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                {[
                    { label: 'Toplam Log', value: allLogs.length, icon: History, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Kritik İşlem', value: allLogs.filter(l => l.action.includes('Silindi')).length, icon: AlertTriangle, color: 'text-rose-600', bg: 'bg-rose-50' },
                    { label: 'Başarılı Sync', value: '100%', icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                    { label: 'Sistem Yükü', value: 'Normal', icon: Zap, color: 'text-amber-600', bg: 'bg-amber-50' },
                ].map((stat, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        key={i} className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm flex items-center gap-5"
                    >
                        <div className={`${stat.bg} p-4 rounded-3xl`}>
                            <stat.icon size={24} className={stat.color} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">{stat.label}</p>
                            <p className="text-2xl font-black tracking-tighter text-gray-900 leading-none">{stat.value}</p>
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Search & Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1 relative group">
                    <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-gray-900 transition-colors" size={20} />
                    <input 
                        value={search} onChange={(e) => setSearch(e.target.value)}
                        placeholder="Personel, işlem veya müşteri ara..."
                        className="w-full bg-white border border-gray-200 rounded-[2rem] pl-16 pr-8 py-5 text-sm font-bold placeholder:text-gray-400 outline-none focus:border-gray-900 transition-all shadow-sm"
                    />
                </div>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                    {categories.map(cat => (
                        <button 
                            key={cat} onClick={() => setFilter(cat)}
                            className={`px-8 py-5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all whitespace-nowrap
                                ${filter === cat ? 'bg-gray-900 text-white shadow-xl translate-y-[-2px]' : 'bg-white text-gray-500 border border-gray-200 hover:border-gray-900'}
                            `}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
            </div>

            {/* Logs Timeline */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {filteredLogs.map((log, idx) => (
                        <motion.div 
                            layout
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            key={log.id}
                            className="bg-white rounded-[2rem] border border-gray-100 p-6 flex items-center gap-6 hover:shadow-xl hover:shadow-gray-100 transition-all group"
                        >
                            {/* Time Badge */}
                            <div className="min-w-[100px] text-center px-4 py-3 bg-gray-50 rounded-2xl border border-gray-100 group-hover:bg-gray-900 group-hover:text-white transition-colors duration-500">
                                <p className="text-[14px] font-black leading-none mb-1">
                                    {format(new Date(log.date), 'HH:mm')}
                                </p>
                                <p className="text-[9px] font-black uppercase tracking-tighter opacity-60">
                                    {format(new Date(log.date), 'dd MMM', { locale: tr })}
                                </p>
                            </div>

                            {/* Action Icon */}
                            <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center shrink-0 border border-gray-100">
                                {getActionIcon(log.action)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 items-center gap-6">
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-0.5">{log.action}</p>
                                    <p className="text-base font-black tracking-tight text-gray-900">{log.customerName}</p>
                                </div>

                                <div className="flex items-center gap-4 bg-gray-50/50 p-3 rounded-2xl border border-dashed border-gray-200">
                                    <div className="text-[10px] font-medium text-gray-400 italic max-w-[120px] truncate">{log.oldValue || '-'}</div>
                                    <ArrowRight size={14} className="text-gray-300 shrink-0" />
                                    <div className="text-[11px] font-black text-gray-900">{log.newValue || '-'}</div>
                                </div>

                                <div className="flex items-center justify-end gap-3">
                                    <div className="text-right">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-0.5">İşlem Yapan</p>
                                        <p className="text-[13px] font-bold text-gray-900">{log.user}</p>
                                    </div>
                                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center text-gray-500 font-black text-sm">
                                        {log.user.charAt(0)}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {filteredLogs.length === 0 && (
                    <div className="py-32 flex flex-col items-center justify-center text-center">
                        <div className="w-24 h-24 bg-gray-50 rounded-[2.5rem] flex items-center justify-center mb-6">
                            <History size={40} className="text-gray-200" />
                        </div>
                        <h3 className="text-xl font-black tracking-tight text-gray-900 mb-2">Log Kaydı Bulunamadı</h3>
                        <p className="text-gray-400 max-w-xs font-medium">Arama kriterlerinize uygun hiçbir işlem kaydı mevcut değil.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
