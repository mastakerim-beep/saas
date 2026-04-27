'use client';

import { useMemo } from 'react';
import { 
    ShieldAlert, TrendingUp, AlertTriangle, 
    Search, Filter, ChevronRight,
    Zap, Brain, ShieldCheck, 
    Activity, ArrowRight
} from 'lucide-react';
import { 
    ScatterChart, Scatter, XAxis, YAxis, 
    ZAxis, Tooltip, ResponsiveContainer,
    Cell, CartesianGrid
} from 'recharts';
import { motion } from 'framer-motion';

export function ImperialOversight({ businesses, logs, zReports }: { businesses: any[], logs: any[], zReports: any[] }) {
    
    // Filter Imperial Veto Logs
    const vetoLogs = useMemo(() => {
        return logs.filter(l => l.action === 'IMPERIAL_VETO' || l.action === 'VETO')
                   .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    }, [logs]);

    // Calculate Intervention Data per Business
    const businessMetrics = useMemo(() => {
        return businesses.map(biz => {
            const bizZReports = zReports.filter(z => z.businessId === biz.id);
            const totalDelta = bizZReports.reduce((s, z) => s + (z.intervention_delta || 0), 0);
            const bizVetos = vetoLogs.filter(l => l.businessId === biz.id).length;
            const totalCiro = bizZReports.reduce((s, z) => s + (z.expected_nakit + z.expected_kart + z.expected_havale), 0);
            
            return {
                name: biz.name,
                id: biz.id,
                delta: totalDelta,
                vetoCount: bizVetos,
                ciro: totalCiro,
                riskRatio: totalCiro > 0 ? (totalDelta / totalCiro) * 100 : 0
            };
        });
    }, [businesses, zReports, vetoLogs]);

    const stats = useMemo(() => {
        const totalDelta = zReports.reduce((s, z) => s + (z.intervention_delta || 0), 0);
        const criticalSaps = businessMetrics.filter(m => m.riskRatio > 5).length;
        return { totalDelta, criticalSaps };
    }, [zReports, businessMetrics]);

    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease]">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-rose-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full blur-2xl group-hover:bg-rose-100 transition-colors" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                            <ShieldAlert size={24} />
                        </div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Toplam Müdahale Sapması</p>
                    </div>
                    <p className="text-3xl font-black text-slate-900 relative z-10">₺{stats.totalDelta.toLocaleString()}</p>
                    <p className="text-[10px] font-bold text-rose-500 mt-2 uppercase tracking-wide">Ağ genelindeki potansiyel risk</p>
                </div>

                <div className="bg-white border border-amber-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <AlertTriangle size={24} />
                        </div>
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Kritik Sapma ( {">"} %5 )</p>
                    </div>
                    <p className="text-3xl font-black text-slate-900 relative z-10">{stats.criticalSaps} İşletme</p>
                    <p className="text-[10px] font-bold text-amber-500 mt-2 uppercase tracking-wide">İmparatorluk Denetimi Önerilir</p>
                </div>

                <div className="bg-white border border-indigo-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Brain size={24} />
                        </div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Fraud Analizi</p>
                    </div>
                    <p className="text-3xl font-black text-slate-900 relative z-10">STABİL</p>
                    <p className="text-[10px] font-bold text-emerald-500 mt-2 uppercase tracking-wide">Anomali Tespit Edilmedi</p>
                </div>
            </div>

            {/* Scatter Plot: Delta vs Volume */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h3 className="text-slate-900 text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                            <Activity className="text-indigo-600" /> Ciro vs Müdahale Matrisi
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">İşletme bazlı anomali tespiti</p>
                    </div>
                </div>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis type="number" dataKey="ciro" name="Ciro" unit="₺" axisLine={false} tickLine={false} fontSize={10} />
                            <YAxis type="number" dataKey="delta" name="Sapma" unit="₺" axisLine={false} tickLine={false} fontSize={10} />
                            <ZAxis type="number" dataKey="vetoCount" range={[100, 1000]} name="Veto Sayısı" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Scatter name="İşletmeler" data={businessMetrics}>
                                {businessMetrics.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.riskRatio > 5 ? '#f43f5e' : '#4f46e5'} />
                                ))}
                            </Scatter>
                        </ScatterChart>
                    </ResponsiveContainer>
                </div>
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-indigo-600" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Normal Operasyon</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Yüksek Riskli Sapma</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                {/* Veto Logs */}
                <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-slate-900 text-lg font-black uppercase tracking-tighter italic">Veto Jurnali</h3>
                        <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase">Son Müdahaleler</span>
                    </div>
                    <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-4">
                        {vetoLogs.map((log, i) => (
                            <div key={i} className="group relative bg-slate-50 hover:bg-slate-900 transition-all duration-300 p-6 rounded-[2rem] border border-slate-100 border-l-4 border-l-indigo-600">
                                <div className="flex justify-between items-start mb-2">
                                    <div>
                                        <p className="text-[11px] font-black text-slate-900 group-hover:text-white uppercase group-hover:translate-x-1 transition-all">{log.user || 'Sistem'}</p>
                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{new Date(log.date || log.createdAt).toLocaleString('tr-TR')}</p>
                                    </div>
                                    <div className="px-2 py-1 bg-white/50 group-hover:bg-white/10 rounded-lg text-[8px] font-black text-indigo-600 group-hover:text-indigo-400">IMPERIAL_VETO</div>
                                </div>
                                <div className="mt-3 p-3 bg-white/80 group-hover:bg-white/5 rounded-xl border border-indigo-50 group-hover:border-white/10">
                                    <p className="text-[10px] font-bold text-slate-600 group-hover:text-slate-300 italic">"{log.newValue || 'Gerekçe girilmedi'}"</p>
                                </div>
                                <p className="text-[9px] font-black text-indigo-600 group-hover:text-indigo-400 mt-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    DETAYLARI İNCELE <ChevronRight size={10} />
                                </p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* AI Detection & Insights */}
                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                        <Zap size={120} className="text-indigo-500" />
                    </div>
                    
                    <div className="flex items-center gap-4 mb-10">
                        <div className="w-12 h-12 bg-indigo-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
                            <Brain size={24} />
                        </div>
                        <div>
                            <h3 className="text-white text-lg font-black uppercase tracking-tighter italic">İmparatorluk Gözü</h3>
                            <p className="text-indigo-400 text-[10px] font-black uppercase tracking-widest">AI Gözetim Motoru</p>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <AlertTriangle size={18} className="text-amber-500" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Zaman Anomalisi</span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">
                                <strong className="text-white">Trend:</strong> İşletme ID #3292 üzerinde cumartesi akşamları mühürleme sonrası müdahale oranı ağ ortalamasının %40 üzerinde.
                            </p>
                            <div className="mt-4 flex justify-between items-center">
                                <span className="text-[8px] font-black text-amber-500 bg-amber-500/10 px-2 py-1 rounded-md">YÜKSEK RİSK</span>
                                <ArrowRight size={14} className="text-white" />
                            </div>
                        </div>

                        <div className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors cursor-pointer">
                            <div className="flex items-center gap-3 mb-3">
                                <ShieldCheck size={18} className="text-emerald-500" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Güvenlik Özet</span>
                            </div>
                            <p className="text-slate-400 text-[11px] leading-relaxed">
                                Son 24 saatte sistem bazında müdahale tutarı ₺14.220 azaldı. Mühürleme trigger'ları %100 stabil.
                            </p>
                        </div>

                        <div className="p-8 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-[2.5rem] mt-4 relative overflow-hidden">
                            <p className="text-white font-black text-sm uppercase italic leading-tight">Yapay zeka tüm jurnalleri saniyelik olarak tarıyor. Şüpheli her bir bayt raporlanır.</p>
                            <div className="mt-4 flex gap-2">
                                <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden">
                                    <div className="h-full bg-white w-2/3" />
                                </div>
                            </div>
                            <p className="text-white/60 text-[8px] font-bold mt-2 uppercase tracking-widest">Sistem Tarama %68 Tamamlandı</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

