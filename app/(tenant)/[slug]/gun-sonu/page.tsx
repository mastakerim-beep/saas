"use client";

import { useState, useMemo, useEffect } from 'react';
import { useStore } from '@/lib/store';
import { Payment } from '@/lib/store/types';
import { 
    Banknote, CreditCard, Building2, Lock, CheckCircle, AlertCircle, 
    Sparkles, Send, History, ShieldAlert, Bot, RefreshCw, Box, UserCheck 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GunSonuPage() {
    const { getTodayPayments, appointments, closeDay, zReports, runImperialAudit, updateRoomStatus } = useStore();
    const todayPayments = getTodayPayments();
    const [isSaving, setIsSaving] = useState(false);
    const [note, setNote] = useState('');
    const [auditResults, setAuditResults] = useState<{ type: 'critical' | 'warning' | 'info'; title: string; desc: string; targetId?: string; table?: string }[]>([]);

    // Calculate expected amounts
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = appointments.filter((a: any) => a.date === todayStr && a.status === 'completed');
    
    useEffect(() => {
        const results = runImperialAudit();
        setAuditResults(results);
    }, [appointments, runImperialAudit]); // Re-run audit when appointments change

    const nakitGercek = todayPayments.reduce((acc: number, p: Payment) => 
        acc + (p.methods?.filter((m: any) => m.method === 'nakit').reduce((s: number, m: any) => s + (m.amount * (m.rate || 1)), 0) || 0), 0);
    const kartGercek = todayPayments.reduce((acc: number, p: Payment) => 
        acc + (p.methods?.filter((m: any) => m.method === 'kredi-karti').reduce((s: number, m: any) => s + (m.amount * (m.rate || 1)), 0) || 0), 0);
    const havaleGercek = todayPayments.reduce((acc: number, p: Payment) => 
        acc + (p.methods?.filter((m: any) => m.method === 'havale').reduce((s: number, m: any) => s + (m.amount * (m.rate || 1)), 0) || 0), 0);
    const toplamGercek = todayPayments.reduce((s: number, p: any) => s + p.totalAmount, 0);
    const toplamHediye = todayPayments.reduce((s: number, p: any) => s + (p.isGift ? (p.originalPrice || 0) - p.totalAmount : 0), 0);

    const [nakitSayılan, setNakitSayılan] = useState('');
    const [kartSayılan, setKartSayılan] = useState('');
    const [havaleSayılan, setHavaleSayılan] = useState('');

    const nakitFark = Number(nakitSayılan || 0) - nakitGercek;
    const kartFark = Number(kartSayılan || 0) - kartGercek;
    const havaleFark = Number(havaleSayılan || 0) - havaleGercek;
    const toplamFark = nakitFark + kartFark + havaleFark;
    const hasInputs = nakitSayılan || kartSayılan || havaleSayılan;

    const verticalBreakdown = useMemo(() => {
        const breakdown: Record<string, number> = {};
        todayPayments.forEach(p => {
            const v = (p as any).vertical || 'spa';
            breakdown[v] = (breakdown[v] || 0) + p.totalAmount;
        });
        return breakdown;
    }, [todayPayments]);

    const isAlreadyClosed = zReports.some((r: any) => r.reportDate === todayStr);

    const handleCloseDay = async () => {
        if (!hasInputs) {
            alert('Lütfen en az bir sayım sonucu giriniz.');
            return;
        }

        const criticalAlerts = auditResults.filter((a: any) => a.type === 'critical');
        if (criticalAlerts.length > 0) {
            const proceed = confirm(`Sistemde ${criticalAlerts.length} adet KRİTİK kaçak tespit edildi! Kapatmadan önce bunları düzeltmeniz önerilir.\n\nDevam etmek istiyor musunuz?`);
            if (!proceed) return;
        }

        if (isAlreadyClosed && !confirm('Bugün için zaten bir kapanış raporu mevcut. Yenisini eklemek istiyor musunuz?')) return;

        setIsSaving(true);
        const auditLogText = auditResults.map(a => `[${a.type.toUpperCase()}] ${a.title}: ${a.desc}`).join('\n');
        
        const success = await closeDay({
            reportDate: todayStr,
            expectedNakit: nakitGercek,
            actualNakit: Number(nakitSayılan || 0),
            expectedKart: kartGercek,
            actualKart: Number(kartSayılan || 0),
            expectedHavale: havaleGercek,
            actualHavale: Number(havaleSayılan || 0),
            totalDifference: toplamFark,
            notes: note + (auditLogText ? `\n\n--- AI DENETIM RAPORU ---\n${auditLogText}` : '')
        });
        
        setIsSaving(false);
        if (success) {
            alert('Gün sonu başarıyla kaydedildi.');
            setNakitSayılan(''); setKartSayılan(''); setHavaleSayılan(''); setNote('');
        }
    };

    const FarkBadge = ({ fark }: { fark: number }) => {
        if (!hasInputs) return null;
        if (fark === 0) return <span className="text-xs font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Eşit</span>;
        return <span className={`text-xs font-black px-2 py-0.5 rounded-full ${fark > 0 ? 'text-orange-600 bg-orange-100' : 'text-red-600 bg-red-100'}`}>{fark > 0 ? `+${fark}` : fark} ₺</span>;
    };

    return (
        <div className="p-8 max-w-[1500px] mx-auto pb-32 font-sans">
            <div className="flex justify-between items-end mb-12">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="bg-indigo-600 text-white p-2.5 rounded-2xl shadow-lg shadow-indigo-200">
                            <Lock size={20} />
                        </div>
                        <h1 className="text-3xl md:text-5xl font-black tracking-tighter text-gray-900 uppercase italic">Gün Sonu Kasası</h1>
                    </div>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <History size={14} className="text-indigo-500" />
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        <span className="opacity-20">|</span> {completedToday.length} TAMAMLANAN RANDEVU
                    </p>
                </div>
                {isAlreadyClosed && (
                    <div className="px-5 py-2.5 bg-emerald-50 text-emerald-600 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100 shadow-sm">
                        <CheckCircle size={14} /> BUGÜN KAPATILDI
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Left: AI Audit Center */}
                <div className="lg:col-span-4 space-y-8">
                    <div className="bg-[#0f172a] rounded-[3rem] p-8 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/20 rounded-2xl backdrop-blur-md border border-white/10">
                                        <Bot className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-300 italic">Imperial Audit</h3>
                                </div>
                                <div className="animate-pulse flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500" />
                                    <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Canlı Denetim</span>
                                </div>
                            </div>
                            
                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                {auditResults.length > 0 ? (
                                    auditResults.map((alert, idx) => (
                                        <motion.div 
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            key={idx} 
                                            className={`p-5 rounded-3xl border ${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`mt-1 ${alert.type === 'critical' ? 'text-red-400' : 'text-amber-400'}`}>
                                                    <ShieldAlert size={18} />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[11px] font-black uppercase tracking-wider mb-1">{alert.title}</p>
                                                    <p className="text-xs text-gray-400 font-bold leading-relaxed mb-3">{alert.desc}</p>
                                                    
                                                    {alert.table === 'rooms' && (
                                                        <button 
                                                            onClick={async () => {
                                                                if (alert.targetId) {
                                                                    await updateRoomStatus(alert.targetId, 'available');
                                                                    setAuditResults(prev => prev.filter(a => a.targetId !== alert.targetId));
                                                                }
                                                            }}
                                                            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all"
                                                        >
                                                            <RefreshCw size={12} /> Odayı Boşalt
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </motion.div>
                                    ))
                                ) : (
                                    <div className="py-20 text-center opacity-30">
                                        <UserCheck className="w-12 h-12 mx-auto mb-4 text-emerald-400" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">Hata/Kaçak tespiti yok</p>
                                    </div>
                                )}
                            </div>

                            <div className="mt-8 pt-8 border-t border-white/5">
                                <p className="text-[10px] font-black text-indigo-400 uppercase mb-4 tracking-widest">AI Önerisi</p>
                                <div className="bg-white/5 rounded-2xl p-5 border border-white/5">
                                    <p className="text-xs font-bold text-gray-300 leading-relaxed italic">
                                        {auditResults.filter(a => a.type === 'critical').length > 0 
                                            ? "Dikkat! Hayalet odalar tespit edildi. Kapatmadan önce odaları 'Müsait' yaparak kasa kaçaklarını önleyin."
                                            : "Tüm operasyonel veriler mutabık. Kasayı güvenle kapatabilirsiniz."}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="card-apple p-10 bg-white/40 shadow-xl border-white underline-none">
                         <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-6 text-center italic">Operasyonel Skor</h4>
                         <div className="flex flex-col items-center">
                            <div className="relative w-40 h-40 flex items-center justify-center">
                                <svg className="w-full h-full rotate-[-90deg]">
                                    <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-gray-100" />
                                    <circle cx="80" cy="80" r="72" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray="452.3" strokeDashoffset={452.3 - (452.3 * 92 / 100)} className="text-indigo-600 transition-all duration-1000" />
                                </svg>
                                <span className="absolute text-5xl font-black italic tracking-tighter">92</span>
                            </div>
                            <p className="mt-6 text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Hatasızlık Oranı</p>
                         </div>
                    </div>
                </div>

                {/* Right: Reconciliation & Feed */}
                <div className="lg:col-span-8 space-y-8">
                    <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-xl shadow-gray-200/40">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-2xl font-black italic uppercase tracking-tighter">Kasa Mutabakatı</h2>
                                <div className="flex gap-2 mt-2">
                                    {Object.entries(verticalBreakdown).map(([v, amount]) => (
                                        <div key={v} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg flex items-center gap-2">
                                            <div className={`w-1.5 h-1.5 rounded-full ${v === 'fitness' ? 'bg-amber-500' : v === 'clinic' ? 'bg-emerald-500' : 'bg-indigo-500'}`} />
                                            <span className="text-[10px] font-black uppercase text-gray-500 tracking-tighter">{v}: ₺{amount.toLocaleString('tr-TR')}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100"><Banknote className="text-gray-400" /></div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                            {[
                                { label: 'NAKİT', val: nakitSayılan, set: setNakitSayılan, gercek: nakitGercek, fark: nakitFark, icon: Banknote, color: 'emerald' },
                                { label: 'KART', val: kartSayılan, set: setKartSayılan, gercek: kartGercek, fark: kartFark, icon: CreditCard, color: 'indigo' },
                                { label: 'HAVALE', val: havaleSayılan, set: setHavaleSayılan, gercek: havaleGercek, fark: havaleFark, icon: Building2, color: 'blue' },
                            ].map(({ label, val, set, gercek, fark, icon: Icon, color }) => (
                                <div key={label} className="group bg-gray-50/50 rounded-[2.5rem] p-8 border border-gray-50 transition-all hover:bg-white hover:border-indigo-100 hover:shadow-2xl hover:shadow-indigo-50/40">
                                    <div className="flex justify-between items-center mb-6">
                                        <div className={`p-3 bg-${color}-100 text-${color}-600 rounded-2xl shadow-sm`}><Icon size={18} /></div>
                                        <FarkBadge fark={fark} />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 italic">{label} SAYIM</p>
                                    <input 
                                        type="number" 
                                        value={val} 
                                        onChange={e => set(e.target.value)}
                                        placeholder="0"
                                        className="w-full bg-transparent border-b-2 border-gray-200 text-3xl font-black focus:outline-none focus:border-indigo-600 transition-all placeholder:text-gray-200 tabular-nums italic" 
                                    />
                                    <p className="mt-4 text-[9px] font-bold text-gray-300 uppercase tracking-tighter">Sistem Kaydı: ₺{gercek.toLocaleString('tr-TR')}</p>
                                </div>
                            ))}
                            <div className="group bg-rose-50/50 rounded-[2.5rem] p-8 border border-rose-100/50 transition-all hover:bg-white hover:border-rose-200 hover:shadow-2xl hover:shadow-rose-50/40">
                                <div className="flex justify-between items-center mb-6">
                                    <div className="p-3 bg-rose-100 text-rose-600 rounded-2xl shadow-sm"><CheckCircle size={18} /></div>
                                    <span className="text-[9px] font-black text-rose-600 bg-rose-100 px-2 py-0.5 rounded-full">IKRAM</span>
                                </div>
                                <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 italic">HEDİYE EDİLEN</p>
                                <div className="text-3xl font-black text-rose-900 tabular-nums italic">₺{toplamHediye.toLocaleString('tr-TR')}</div>
                                <p className="mt-4 text-[9px] font-bold text-rose-300 uppercase tracking-tighter leading-tight">Bu tutar cirodan düşülmüş,<br/>ancak hizmet verilmiştir.</p>
                            </div>
                        </div>

                        <div className="flex flex-col lg:flex-row gap-8 mt-10">
                            <div className="flex-1 space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 italic">Kapanış Notu (Opsiyonel)</label>
                                <textarea 
                                    value={note}
                                    onChange={e => setNote(e.target.value)}
                                    placeholder="Günün özeti ve kaçak açıklamaları..."
                                    className="w-full bg-gray-50 border border-gray-100 rounded-[2.5rem] p-8 text-sm font-bold min-h-[140px] outline-none focus:bg-white focus:border-indigo-200 transition-all shadow-inner"
                                />
                            </div>
                            <div className="w-full lg:w-80 bg-gradient-to-br from-indigo-600 to-indigo-900 rounded-[3rem] p-10 text-white shadow-2xl flex flex-col justify-between group">
                                <div className="relative">
                                    <div className="absolute -top-4 -right-4 blur-2xl opacity-20"><Sparkles size={100} /></div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-2">Net Kasa Farkı</p>
                                    <p className="text-5xl font-black italic tracking-tighter drop-shadow-xl">₺{toplamFark.toLocaleString('tr-TR')}</p>
                                </div>
                                <button 
                                    disabled={!hasInputs || isSaving}
                                    onClick={handleCloseDay}
                                    className="w-full mt-10 py-6 bg-white text-indigo-900 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl hover:bg-gray-100 hover:scale-105 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                                >
                                    {isSaving ? 'KAYDEDİLİYOR...' : 'GÜNÜ KAPAT'}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Today's Transactions Feed */}
                    <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-xl shadow-gray-200/40">
                        <div className="flex justify-between items-center mb-10">
                            <div>
                                <h2 className="text-xl font-black italic uppercase tracking-tighter">Tahsilat Detayları</h2>
                                <p className="text-[10px] font-medium text-gray-400 uppercase tracking-widest">Bugün gerçekleştirilen ödemeler</p>
                            </div>
                            <span className="text-[10px] font-black bg-gray-50 px-4 py-2 rounded-xl text-gray-400 uppercase border border-gray-100">{todayPayments.length} İşlem</span>
                        </div>
                        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                            {todayPayments.map((p: Payment) => (
                                <div key={p.id} className="flex justify-between items-center bg-gray-50/50 border border-gray-50 rounded-[2.5rem] p-8 hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/20 transition-all group">
                                    <div className="flex items-center gap-5">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(79,70,229,0.6)] group-hover:scale-125 transition-transform" />
                                        <div>
                                            <p className="font-black text-base text-gray-900 uppercase italic leading-none mb-1">{p.customerName}</p>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-tighter">{p.service}</p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black text-gray-900 text-2xl italic tabular-nums">₺{p.totalAmount.toLocaleString('tr-TR')}</p>
                                        <div className="flex gap-1 justify-end mt-2">
                                            {p.methods?.map((m: any, id: number) => (
                                                <span key={id} className="text-[9px] font-black bg-indigo-50 px-2 py-1 rounded-lg text-indigo-400 uppercase tracking-tighter">{m.method}</span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
