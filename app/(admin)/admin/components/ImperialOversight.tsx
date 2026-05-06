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

export function ImperialOversight({ businesses, logs, zReports, notifications = [] }: { businesses: any[], logs: any[], zReports: any[], notifications?: any[] }) {
    
    // Filter Imperial Veto Logs
    const vetoLogs = useMemo(() => {
        return logs.filter(l => l.action === 'IMPERIAL_VETO' || l.action === 'VETO')
                   .sort((a, b) => new Date(b.date || b.createdAt).getTime() - new Date(a.date || a.createdAt).getTime());
    }, [logs]);

    // Filter Security Alerts (Danger type from notification_logs)
    const securityAlerts = useMemo(() => {
        return (notifications || [])
            .filter(n => n.type === 'danger' || n.title?.toLowerCase().includes('security'))
            .sort((a, b) => new Date(b.sentAt || b.createdAt).getTime() - new Date(a.sentAt || a.createdAt).getTime());
    }, [notifications]);

    // Calculate Intervention Data per Business
    const businessMetrics = useMemo(() => {
        return businesses.map(biz => {
            const bizZReports = zReports.filter(z => z.businessId === biz.id);
            const totalDelta = bizZReports.reduce((s, z) => s + (z.interventionDelta || 0), 0);
            const bizVetos = vetoLogs.filter(l => l.businessId === biz.id).length;
            const totalCiro = bizZReports.reduce((s, z) => s + (z.expectedNakit + z.expectedKart + z.expectedHavale), 0);
            const bizSecurityAlerts = securityAlerts.filter(a => a.businessId === biz.id).length;
            
            return {
                name: biz.name,
                id: biz.id,
                delta: totalDelta,
                vetoCount: bizVetos,
                securityCount: bizSecurityAlerts,
                ciro: totalCiro,
                riskRatio: totalCiro > 0 ? (totalDelta / totalCiro) * 100 : 0
            };
        });
    }, [businesses, zReports, vetoLogs, securityAlerts]);

    const stats = useMemo(() => {
        const totalDelta = zReports.reduce((s, z) => s + (z.interventionDelta || 0), 0);
        const criticalSaps = businessMetrics.filter(m => m.riskRatio > 5 || m.securityCount > 0).length;
        const activeSecurityThreats = securityAlerts.filter(a => a.status === 'unread').length;
        return { totalDelta, criticalSaps, activeSecurityThreats };
    }, [zReports, businessMetrics, securityAlerts]);

    return (
        <div className="space-y-8 animate-[fadeIn_0.5s_ease] text-left">
            {/* Header Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white border border-rose-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-50 rounded-full blur-2xl group-hover:bg-rose-100 transition-colors" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-2xl flex items-center justify-center">
                            <ShieldAlert size={24} />
                        </div>
                        <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest">Güvenlik Tehditleri</p>
                    </div>
                    <p className="text-3xl font-black text-slate-900 relative z-10">{stats.activeSecurityThreats} Alarm</p>
                    <p className="text-[10px] font-bold text-rose-500 mt-2 uppercase tracking-wide">Son 24 saat içindeki ihlaller</p>
                </div>

                <div className="bg-white border border-amber-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-amber-50 rounded-full blur-2xl group-hover:bg-amber-100 transition-colors" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
                            <AlertTriangle size={24} />
                        </div>
                        <p className="text-[10px] font-black text-amber-400 uppercase tracking-widest">Riskli Segment ( {">"} %5 )</p>
                    </div>
                    <p className="text-3xl font-black text-slate-900 relative z-10">{stats.criticalSaps} İşletme</p>
                    <p className="text-[10px] font-bold text-amber-500 mt-2 uppercase tracking-wide">Acil Denetim Tavsiye Edilir</p>
                </div>

                <div className="bg-white border border-indigo-100 p-8 rounded-[2.5rem] shadow-sm relative overflow-hidden group">
                    <div className="absolute -right-4 -top-4 w-24 h-24 bg-indigo-50 rounded-full blur-2xl group-hover:bg-indigo-100 transition-colors" />
                    <div className="flex items-center gap-4 mb-4 relative z-10">
                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                            <Brain size={24} />
                        </div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">AI Fraud Analizi</p>
                    </div>
                    <p className="text-3xl font-black text-slate-900 relative z-10">{securityAlerts.length > 0 ? 'ALARM' : 'STABİL'}</p>
                    <p className={`text-[10px] font-bold mt-2 uppercase tracking-wide ${securityAlerts.length > 0 ? 'text-rose-500' : 'text-emerald-500'}`}>
                        {securityAlerts.length > 0 ? 'Anomali tespit edildi' : 'Anomali tespit edilmedi'}
                    </p>
                </div>
            </div>

            {/* Scatter Plot: Delta vs Volume */}
            <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm">
                <div className="flex justify-between items-start mb-10">
                    <div>
                        <h3 className="text-slate-900 text-xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                            <Activity className="text-indigo-600" /> Ciro vs Risk Matrisi
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">İşletme bazlı güvenlik ve performans anomalileri</p>
                    </div>
                </div>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                            <XAxis type="number" dataKey="ciro" name="Ciro" unit="₺" axisLine={false} tickLine={false} fontSize={10} />
                            <YAxis type="number" dataKey="delta" name="Sapma" unit="₺" axisLine={false} tickLine={false} fontSize={10} />
                            <ZAxis type="number" dataKey="securityCount" range={[100, 1000]} name="Güvenlik Alarmları" />
                            <Tooltip cursor={{ strokeDasharray: '3 3' }} contentStyle={{ borderRadius: '15px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }} />
                            <Scatter name="İşletmeler" data={businessMetrics}>
                                {businessMetrics.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.securityCount > 0 ? '#f43f5e' : entry.riskRatio > 5 ? '#f59e0b' : '#4f46e5'} />
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
                        <div className="w-3 h-3 rounded-full bg-amber-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Yüksek Riskli Sapma</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-rose-500" />
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Siber Güvenlik İhlali</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 pb-20">
                {/* Security Feed */}
                <div className="bg-slate-900 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden">
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20 animate-pulse">
                                <ShieldAlert size={24} />
                            </div>
                            <div>
                                <h3 className="text-white text-lg font-black uppercase tracking-tighter italic">Siber Güvenlik Akışı</h3>
                                <p className="text-rose-400 text-[10px] font-black uppercase tracking-widest">Canlı İhlal Takibi</p>
                            </div>
                        </div>
                        <span className="bg-rose-500/20 text-rose-500 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-rose-500/30">REAL-TIME</span>
                    </div>

                    <div className="space-y-4 max-h-[500px] overflow-y-auto no-scrollbar pr-2">
                        {securityAlerts.length > 0 ? (
                            securityAlerts.map((alert, i) => (
                                <motion.div 
                                    key={i} 
                                    initial={{ x: -20, opacity: 0 }} 
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="bg-white/5 border border-white/10 p-6 rounded-[2rem] hover:bg-white/10 transition-colors"
                                >
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.8)]" />
                                            <span className="text-[11px] font-black text-white uppercase tracking-widest">{alert.title}</span>
                                        </div>
                                        <span className="text-[8px] font-black text-slate-500">{new Date(alert.sentAt || alert.createdAt).toLocaleTimeString()}</span>
                                    </div>
                                    <p className="text-slate-400 text-[11px] leading-relaxed mb-4">{alert.content}</p>
                                    <div className="flex justify-between items-center">
                                        <span className="text-[8px] font-black text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md">ID: {alert.business_id?.substring(0,8)}...</span>
                                        <button className="text-[9px] font-black text-white bg-rose-600 px-4 py-1.5 rounded-lg hover:bg-rose-500 transition-colors">MÜDAHALE ET</button>
                                    </div>
                                </motion.div>
                            ))
                        ) : (
                            <div className="py-20 flex flex-col items-center justify-center text-center opacity-20">
                                <ShieldCheck size={64} className="text-emerald-500 mb-4" />
                                <p className="text-white font-black uppercase tracking-[0.3em]">Tehdit Tespit Edilmedi</p>
                                <p className="text-[10px] text-slate-400 mt-2 uppercase">İmparatorluk sınırları güvende.</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Veto Logs */}
                <div className="bg-white border border-slate-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                    <div className="flex justify-between items-center mb-8">
                        <h3 className="text-slate-900 text-lg font-black uppercase tracking-tighter italic">Veto Jurnali</h3>
                        <span className="text-[9px] font-black bg-slate-900 text-white px-3 py-1 rounded-full uppercase">Müdahale Geçmişi</span>
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
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

