"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { Banknote, CreditCard, Building2, Lock, CheckCircle, AlertCircle, Sparkles, Send, History } from 'lucide-react';
import { motion } from 'framer-motion';

export default function GunSonuPage() {
    const { getTodayPayments, appointments, closeDay, zReports } = useStore();
    const todayPayments = getTodayPayments();
    const [isSaving, setIsSaving] = useState(false);
    const [note, setNote] = useState('');

    // Calculate expected amounts from completed appointments today
    const todayStr = new Date().toISOString().split('T')[0];
    const completedToday = appointments.filter(a => a.date === todayStr && a.status === 'completed');
    
    // Sum payments by method (across all payments)
    const nakitGercek = todayPayments.reduce((acc: number, p) => 
        acc + (p.methods?.filter((m: any) => m.method === 'nakit').reduce((s: number, m: any) => s + (m.amount * (m.rate || 1)), 0) || 0), 0);
    const kartGercek = todayPayments.reduce((acc: number, p) => 
        acc + (p.methods?.filter((m: any) => m.method === 'kredi-karti').reduce((s: number, m: any) => s + (m.amount * (m.rate || 1)), 0) || 0), 0);
    const havaleGercek = todayPayments.reduce((acc: number, p) => 
        acc + (p.methods?.filter((m: any) => m.method === 'havale').reduce((s: number, m: any) => s + (m.amount * (m.rate || 1)), 0) || 0), 0);
    const toplamGercek = todayPayments.reduce((s, p) => s + p.totalAmount, 0);

    // Manual expected input (counts from the till)
    const [nakitSayılan, setNakitSayılan] = useState('');
    const [kartSayılan, setKartSayılan] = useState('');
    const [havaleSayılan, setHavaleSayılan] = useState('');

    const nakitFark = Number(nakitSayılan || 0) - nakitGercek;
    const kartFark = Number(kartSayılan || 0) - kartGercek;
    const havaleFark = Number(havaleSayılan || 0) - havaleGercek;
    const toplamFark = nakitFark + kartFark + havaleFark;
    const hasInputs = nakitSayılan || kartSayılan || havaleSayılan;

    const isAlreadyClosed = zReports.some(r => r.reportDate === todayStr);

    const handleCloseDay = async () => {
        if (!hasInputs) {
            alert('Lütfen en az bir sayım sonucu giriniz.');
            return;
        }
        if (isAlreadyClosed && !confirm('Bugün için zaten bir kapanış raporu mevcut. Yenisini eklemek istiyor musunuz?')) return;

        setIsSaving(true);
        const success = await closeDay({
            reportDate: todayStr,
            expectedNakit: nakitGercek,
            actualNakit: Number(nakitSayılan || 0),
            expectedKart: kartGercek,
            actualKart: Number(kartSayılan || 0),
            expectedHavale: havaleGercek,
            actualHavale: Number(havaleSayılan || 0),
            totalDifference: toplamFark,
            notes: note
        });
        
        setIsSaving(false);
        if (success) {
            alert('Gün sonu başarıyla kaydedildi ve kasa kapatıldı.');
            setNakitSayılan('');
            setKartSayılan('');
            setHavaleSayılan('');
            setNote('');
        }
    };

    const FarkBadge = ({ fark }: { fark: number }) => {
        if (!hasInputs) return null;
        if (fark === 0) return <span className="text-xs font-black text-green-600 bg-green-100 px-2 py-0.5 rounded-full">✓ Eşit</span>;
        return <span className={`text-xs font-black px-2 py-0.5 rounded-full ${fark > 0 ? 'text-orange-600 bg-orange-100' : 'text-red-600 bg-red-100'}`}>{fark > 0 ? `+${fark}` : fark} ₺</span>;
    };

    return (
        <div className="p-8 max-w-[1400px] mx-auto pb-32">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter mb-2 text-gray-900 italic uppercase">Gün Sonu Kasası</h1>
                    <p className="text-gray-500 text-xs font-black uppercase tracking-widest flex items-center gap-2">
                        <History size={14} className="text-indigo-500" />
                        {new Date().toLocaleDateString('tr-TR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        <span className="opacity-20">|</span> {completedToday.length} TAMAMLANAN RANDEVU
                    </p>
                </div>
                {isAlreadyClosed && (
                    <div className="px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-200">
                        <CheckCircle size={14} /> BUGÜN KAPATILDI
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                {[
                    { label: 'Nakit Tahsilat', val: nakitGercek, icon: Banknote, color: 'text-emerald-500', bg: 'bg-emerald-50' },
                    { label: 'Kart Tahsilat', val: kartGercek, icon: CreditCard, color: 'text-indigo-500', bg: 'bg-indigo-50' },
                    { label: 'Havale Tahsilat', val: havaleGercek, icon: Building2, color: 'text-blue-500', bg: 'bg-blue-50' }
                ].map((stat, i) => (
                    <div key={i} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 flex flex-col items-center shadow-lg shadow-gray-200/20 group hover:border-indigo-200 transition-all">
                        <div className={`p-4 ${stat.bg} ${stat.color} rounded-2xl mb-4 group-hover:scale-110 transition-transform`}>
                            <stat.icon size={28} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">{stat.label}</p>
                        <p className="text-4xl font-black text-gray-900 italic tracking-tighter">₺{stat.val.toLocaleString('tr-TR')}</p>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                {/* Left: Reconciliation Form */}
                <div className="space-y-8">
                    <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-xl shadow-gray-200/40 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -mr-16 -mt-16 blur-2xl" />
                        
                        <h2 className="text-2xl font-black mb-8 flex items-center gap-4 italic uppercase tracking-tighter">
                            <div className="p-3 bg-indigo-600 rounded-2xl text-white shadow-lg shadow-indigo-200"><Lock size={20} /></div>
                            Kasa Mutabakatı
                        </h2>
                        
                        <div className="space-y-6">
                            {[
                                { label: 'NAKİT SAYIM', val: nakitSayılan, set: setNakitSayılan, gercek: nakitGercek, fark: nakitFark, icon: Banknote },
                                { label: 'KART POS TOPLAM', val: kartSayılan, set: setKartSayılan, gercek: kartGercek, fark: kartFark, icon: CreditCard },
                                { label: 'HAVALE TOPLAM', val: havaleSayılan, set: setHavaleSayılan, gercek: havaleGercek, fark: havaleFark, icon: Building2 },
                            ].map(({ label, val, set, gercek, fark, icon: Icon }) => (
                                <div key={label} className="group bg-gray-50/50 rounded-[2rem] p-6 border border-gray-50 transition-all hover:bg-white hover:border-indigo-100 hover:shadow-xl hover:shadow-indigo-50/20">
                                    <div className="flex justify-between items-center mb-4">
                                        <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
                                            <Icon className="w-4 h-4 text-indigo-400" /> {label}
                                        </label>
                                        <FarkBadge fark={fark} />
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-end mb-2">
                                                <p className="text-[10px] font-bold text-gray-300 uppercase italic">Sistem Kaydı: ₺{gercek.toLocaleString('tr-TR')}</p>
                                            </div>
                                            <input 
                                                type="number" 
                                                value={val} 
                                                onChange={e => set(e.target.value)}
                                                placeholder="Sayım sonucu..."
                                                className="w-full bg-white border border-gray-200 rounded-2xl px-6 py-4 text-sm font-black focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all" 
                                            />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="mt-8 space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kapanış Notları (Opsiyonel)</label>
                            <textarea 
                                value={note}
                                onChange={e => setNote(e.target.value)}
                                placeholder="Eksik/Fazla açıklaması veya gün özeti..."
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-5 text-xs font-bold min-h-[100px] outline-none focus:bg-white focus:border-indigo-200 transition-all"
                            />
                        </div>

                        {hasInputs && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                                className={`mt-10 p-8 rounded-[2.5rem] border-4 flex items-center justify-between transition-all ${toplamFark === 0 ? 'bg-emerald-50 border-emerald-500/20 text-emerald-900 shadow-xl shadow-emerald-50' : 'bg-red-50 border-red-500/20 text-red-900'}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`p-4 rounded-2xl shadow-lg ${toplamFark === 0 ? 'bg-emerald-500 text-white shadow-emerald-200' : 'bg-red-500 text-white shadow-red-200'}`}>
                                        {toplamFark === 0 ? <CheckCircle className="w-8 h-8" /> : <AlertCircle className="w-8 h-8" />}
                                    </div>
                                    <div>
                                        <h4 className="font-black text-lg uppercase tracking-tighter italic">{toplamFark === 0 ? 'Kasa Kusursuz' : 'Kasa Farkı Mevcut'}</h4>
                                        <p className="text-[10px] font-black opacity-60 uppercase tracking-widest">{toplamFark === 0 ? 'MUTABAKAT SAĞLANDI' : 'KONTROL EDİLMELİ'}</p>
                                    </div>
                                </div>
                                <span className="text-4xl font-black italic tabular-nums">
                                    {toplamFark > 0 ? '+' : ''}{toplamFark.toLocaleString('tr-TR')} ₺
                                </span>
                            </motion.div>
                        )}

                        <button 
                            disabled={!hasInputs || isSaving}
                            onClick={handleCloseDay}
                            className="w-full mt-10 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-4 group"
                        >
                            {isSaving ? (
                                <>KAYDEDİLİYOR...</>
                            ) : (
                                <>
                                    <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" /> 
                                    GÜNÜ KAPAT VE RAPORU KAYDET
                                </>
                            )}
                        </button>
                    </div>

                    {/* AI Analytics Placeholder - Dynamic */}
                    <div className="bg-[#0f172a] rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group border border-white/5">
                        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full -mr-48 -mt-48 blur-[100px]" />
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 bg-indigo-500/20 rounded-2xl backdrop-blur-md border border-white/10">
                                        <Sparkles className="w-6 h-6 text-indigo-400" />
                                    </div>
                                    <h3 className="text-sm font-black uppercase tracking-[0.2em] text-indigo-300 italic">Akıllı Performans Analizi</h3>
                                </div>
                                <span className="text-[10px] font-black bg-indigo-500/20 px-3 py-1 rounded-full border border-indigo-500/20 uppercase">V4.0 Engine</span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Kapasite Verimliliği</p>
                                    <div className="flex items-end gap-3">
                                        <span className="text-4xl font-black italic">%74</span>
                                        <span className="text-[10px] font-black text-emerald-400 mb-2 uppercase tracking-tighter shadow-sm">+12% GEÇEN HAFTA</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-500 rounded-full w-[74%]" />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Müşteri Memnuniyeti</p>
                                    <div className="flex items-end gap-3">
                                        <span className="text-4xl font-black italic">4.9</span>
                                        <span className="text-[10px] font-black text-indigo-300 mb-2 uppercase tracking-tighter">MÜKEMMEL</span>
                                    </div>
                                    <div className="flex gap-1">
                                        {[1,2,3,4,5].map(s => <Sparkles key={s} className="w-4 h-4 text-amber-400 fill-amber-400" />)}
                                    </div>
                                </div>
                            </div>

                            <div className="mt-10 pt-8 border-t border-white/5 flex gap-10">
                                <div>
                                    <p className="text-[10px] font-black text-indigo-400 uppercase mb-2">Önerilen Aksiyon</p>
                                    <p className="text-xs font-bold text-gray-300 leading-relaxed max-w-xs"> Bali Masajı talebi pik noktada. Yarın için ek terapist mesaisi planlanabilir. </p>
                                </div>
                                <div className="flex-1 bg-white/5 rounded-2xl p-4 border border-white/5 text-center">
                                    <p className="text-[10px] font-black text-gray-500 uppercase mb-2">Yarınki Beklenti</p>
                                    <p className="text-xl font-black italic">₺42.500</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right: Transaction Detailed Feed */}
                <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-xl shadow-gray-200/40 h-fit sticky top-8">
                    <div className="flex justify-between items-center mb-10">
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 leading-none italic uppercase tracking-tighter">İşlem Beslemesi</h2>
                            <p className="text-[10px] font-black text-gray-400 mt-2 uppercase tracking-[0.2em]">GERÇEK ZAMANLI KAYITLAR</p>
                        </div>
                        <div className="px-6 py-4 bg-gray-50 rounded-2xl text-[10px] font-black text-gray-500 uppercase tracking-widest border border-gray-100 shadow-inner">
                            {todayPayments.length} TOPLAM İŞLEM
                        </div>
                    </div>

                    {todayPayments.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-gray-100 rounded-[2.5rem] bg-gray-50/30">
                            <History className="w-16 h-16 text-gray-200 mb-4 animate-pulse" />
                            <p className="font-black text-gray-300 text-[10px] uppercase tracking-[0.3em]">Henüz veri girişi yapılmadı</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {todayPayments.map(p => (
                                    <div key={p.id} className="group flex justify-between items-center bg-white hover:bg-indigo-50/30 border border-gray-100 rounded-[2rem] p-6 transition-all hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-100/20">
                                        <div className="min-w-0 flex-1 pr-4">
                                            <div className="flex items-center gap-3 mb-2">
                                                <div className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_rgba(79,70,229,0.5)]" />
                                                <p className="font-black text-sm text-gray-900 uppercase truncate italic tracking-tight">{p.customerName}</p>
                                            </div>
                                            <div className="flex flex-wrap gap-2 items-center">
                                                <span className="text-[9px] text-gray-400 font-extrabold uppercase tracking-widest">{p.service}</span>
                                                <div className="flex gap-1.5">
                                                    {p.methods?.map((m: any, idx: number) => (
                                                        <span key={idx} className="text-[8px] font-black px-2 py-1 rounded-lg bg-indigo-600 text-white shadow-sm uppercase tracking-tighter">
                                                            {m.method}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-gray-900 text-xl italic tabular-nums">₺{p.totalAmount.toLocaleString('tr-TR')}</p>
                                            <p className="text-[8px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg inline-block mt-2 border border-emerald-100">ONAYLI</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="p-10 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-[2.5rem] text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-xl" />
                                <div className="relative z-10">
                                    <div className="flex justify-between items-center opacity-60 mb-4">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em]">Net Kasa Konsolidasyonu</span>
                                        <Sparkles className="w-5 h-5" />
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-5xl font-black italic tracking-tighter tabular-nums drop-shadow-lg">₺{toplamGercek.toLocaleString('tr-TR')}</span>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black uppercase tracking-widest mb-1">BRÜT CİRO</p>
                                            <p className="text-[9px] font-bold opacity-40 uppercase tracking-tighter leading-none italic">Resmi / Gayriresmi <br/> Toplam Sistem Kaydı</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
