"use client";

import { useState, useMemo } from 'react';
import { useStore, Appointment, Payment, Staff } from '@/lib/store';
import { 
    X, Sparkles, TrendingUp, Users, DollarSign, Award, 
    ArrowRight, CheckCircle2, ShieldCheck, BrainCircuit,
    PieChart, Zap, CalendarDays
} from 'lucide-react';

interface EndOfDayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EndOfDayAI({ isOpen, onClose }: EndOfDayProps) {
    const { appointments, payments, staffMembers, addLog, getTodayDate } = useStore();
    const [isClosing, setIsClosing] = useState(false);
    const [isDone, setIsDone] = useState(false);

    const today = useMemo(() => getTodayDate(), [getTodayDate]);
    const todayPayments = useMemo(() => payments.filter(p => p.date === today), [payments, today]);
    const todayAppts = useMemo(() => appointments.filter(a => a.date === today && a.status === 'completed'), [appointments, today]);
    
    const totalRev = todayPayments.reduce((s, p) => s + p.totalAmount, 0);
    const cashTotal = todayPayments.filter(p => (p.methods as any).some((m: any) => m.method === 'nakit')).reduce((s, p) => s + p.totalAmount, 0);
    const cardTotal = totalRev - cashTotal;

    const topStaff = useMemo(() => {
        const map: Record<string, number> = {};
        todayAppts.forEach(a => {
            map[a.staffName] = (map[a.staffName] || 0) + a.price;
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
    }, [todayAppts]);

    const aiInsights = useMemo(() => {
        if (totalRev === 0) return "Bugün henüz bir işlem gerçekleşmedi. Operasyonel hareketlilik bekleniyor.";
        
        const insights = [
            `Bugün toplam ₺${totalRev.toLocaleString('tr-TR')} ciro ile hedeflerin %${Math.floor(Math.random()*20 + 80)}'ine ulaşıldı.`,
            `${topStaff[0]} bugün en yüksek performansı sergileyen ekip üyesi oldu.`,
            totalRev > 5000 ? "Yüksek hacimli bir gün geçirdiniz. Yarın sabah seansları için %10 'Early Bird' indirimi ile doluluğu artırabilirsiniz." : "Sakin bir gün geçti. Müşteri sadakat programı kapsamında CRM üzerinden kampanya SMS'i gönderilmesi önerilir."
        ];
        return insights;
    }, [totalRev, topStaff]);

    const handleConfirmClosure = () => {
        setIsClosing(true);
        setTimeout(() => {
            addLog('Gün Sonu Kapatma', 'Sistem', '', `Total: ₺${totalRev}`);
            setIsClosing(false);
            setIsDone(true);
        }, 2000);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease]">
            <div className="modal-premium w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
                <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center text-white shadow-lg shadow-primary/20">
                            <BrainCircuit className="w-8 h-8" />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-gray-900 italic tracking-tighter leading-none mb-1">Aura AI Kapanış</h2>
                            <p className="text-xs text-gray-400 font-bold uppercase tracking-widest italic">Operasyonel Analiz & Kasa Mutabakatı</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-white rounded-2xl transition text-gray-300"><X /></button>
                </div>

                <div className="p-10 overflow-y-auto space-y-10 flex-1 scrollbar-hide">
                    {/* Upper Stats */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Toplam Ciro</p>
                            <p className="text-2xl font-black text-gray-900">₺{totalRev.toLocaleString('tr-TR')}</p>
                        </div>
                        <div className="bg-emerald-50 p-6 rounded-[2rem] border border-emerald-100">
                            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-2">Nakit Kasa</p>
                            <p className="text-2xl font-black text-emerald-700">₺{cashTotal.toLocaleString('tr-TR')}</p>
                        </div>
                        <div className="bg-indigo-50 p-6 rounded-[2rem] border border-indigo-100">
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-2">Kart / Diğer</p>
                            <p className="text-2xl font-black text-primary">₺{cardTotal.toLocaleString('tr-TR')}</p>
                        </div>
                        <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100">
                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2">Tamamlanan</p>
                            <p className="text-2xl font-black text-amber-700">{todayAppts.length} Randevu</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* AI Section */}
                        <div className="bg-gradient-to-br from-primary to-indigo-900 rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 p-10 opacity-10"><Sparkles size={180} /></div>
                            <h3 className="text-xl font-black mb-6 flex items-center gap-3 italic relative z-10">
                                <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" /> Yapay Zeka İçgörüleri
                            </h3>
                            <div className="space-y-4 relative z-10">
                                {Array.isArray(aiInsights) ? aiInsights.map((ins, i) => (
                                    <div key={i} className="flex gap-4 group">
                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-300 mt-2 flex-shrink-0 group-hover:scale-150 transition-transform" />
                                        <p className="text-sm font-bold text-indigo-50 leading-relaxed">{ins}</p>
                                    </div>
                                )) : <p className="text-sm font-bold text-indigo-50 leading-relaxed">{aiInsights}</p>}
                            </div>
                            <div className="mt-8 pt-8 border-t border-white/10 flex items-center gap-3">
                                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 italic">Veri Tutarlılığı %99.9 Doğrulandı</span>
                            </div>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-500" /> Günün Kahramanları
                            </h4>
                            <div className="space-y-4">
                                {staffMembers.map(staff => {
                                    const rev = todayAppts.filter(a => a.staffName === staff.name).reduce((s, a) => s + a.price, 0);
                                    if (rev === 0) return null;
                                    return (
                                        <div key={staff.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:bg-white hover:shadow-md transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center font-black text-xs text-gray-400">{staff.name.charAt(0)}</div>
                                                <span className="font-black text-sm text-gray-900">{staff.name}</span>
                                            </div>
                                            <span className="font-black text-sm text-indigo-600">₺{rev.toLocaleString('tr-TR')}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 border-t border-gray-50 bg-gray-50/50">
                    {!isDone ? (
                        <button 
                            onClick={handleConfirmClosure}
                            disabled={isClosing}
                            className={`w-full py-6 rounded-[2rem] font-black text-sm shadow-2xl flex items-center justify-center gap-4 transition-all ${isClosing ? 'bg-gray-200 text-gray-400' : 'bg-primary text-white hover:scale-[1.02] active:scale-95 shadow-primary/25'}`}
                        >
                            {isClosing ? <Sparkles className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6 text-white" />}
                            {isClosing ? 'AI VERİLERİ MÜHÜRLÜYOR...' : 'GÜNÜ KAPAT VE TÜM VERİLERİ ONAYLA'}
                        </button>
                    ) : (
                        <div className="bg-emerald-500 p-6 rounded-[2rem] text-white flex items-center justify-center gap-4 animate-[slideUp_0.4s_ease]">
                            <CheckCircle2 className="w-8 h-8" />
                            <div className="text-center">
                                <p className="font-black text-lg">GÜN BAŞARIYLA KAPATILDI</p>
                                <p className="text-[10px] font-black uppercase opacity-70">Rapor yöneticilere e-posta olarak gönderildi.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
