"use client";

import { useState, useMemo } from 'react';
import { useStore, Appointment, Payment, Staff } from '@/lib/store';
import { 
    X, Sparkles, TrendingUp, Users, DollarSign, Award, 
    ArrowRight, CheckCircle2, ShieldCheck, BrainCircuit,
    PieChart, Zap, CalendarDays, Clock, AlertTriangle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface EndOfDayProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function EndOfDayAI({ isOpen, onClose }: EndOfDayProps) {
    const { 
        appointments, payments, staffMembers, addLog, getTodayDate, 
        currentBusiness, addZReport, currentUser 
    } = useStore();
    
    const [isClosing, setIsClosing] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [showRiskDetails, setShowRiskDetails] = useState(false);

    const today = useMemo(() => getTodayDate(), [getTodayDate]);
    
    // Improved filtering
    const todayPayments = useMemo(() => payments.filter(p => p.date === today), [payments, today]);
    const todayAppts = useMemo(() => appointments.filter(a => a.date === today), [appointments, today]);
    const completedAppts = useMemo(() => todayAppts.filter(a => a.status === 'completed'), [todayAppts]);

    // Imperial Audit Logic: Leakage detection
    const suspiciousAppts = useMemo(() => {
        return completedAppts.filter(a => {
            if (a.price === 0) return false;
            // Check if there is a payment linked to this appointment
            const hasPayment = todayPayments.some(p => p.appointmentId === a.id);
            return !hasPayment;
        });
    }, [completedAppts, todayPayments]);

    // Unprocessed detection: Arrived but not completed
    const forgottenAppts = useMemo(() => {
        return todayAppts.filter(a => a.status === 'arrived' || (a.status === 'pending' && a.time < new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })));
    }, [todayAppts]);
    
    const totalRev = todayPayments.reduce((s, p) => s + (p.totalAmount || 0), 0);
    const cashTotal = todayPayments.reduce((s, p) => {
        const cashPart = (p.methods as any || []).filter((m: any) => m.method === 'nakit').reduce((sum: number, m: any) => sum + m.amount, 0);
        return s + cashPart;
    }, 0);
    const cardTotal = totalRev - cashTotal;

    const topStaff = useMemo(() => {
        const map: Record<string, number> = {};
        completedAppts.forEach(a => {
            map[a.staffName] = (map[a.staffName] || 0) + (a.price || 0);
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
    }, [completedAppts]);

    const auditStatus = suspiciousAppts.length > 0 || forgottenAppts.length > 0 ? 'warning' : 'clear';

    const aiInsights = useMemo(() => {
        if (totalRev === 0 && completedAppts.length === 0) return "Bugün henüz bir işlem gerçekleşmedi. Operasyonel hareketlilik bekleniyor.";
        
        const insights = [
            `Bugün toplam ₺${totalRev.toLocaleString('tr-TR')} ciro gerçekleşti.`,
            `${topStaff[0]} bugün en yüksek performansı sergileyen ekip üyesi oldu.`
        ];

        if (suspiciousAppts.length > 0) {
            insights.push(`DİKKAT: ${suspiciousAppts.length} randevunun ödemesi henüz sisteme girilmemiş görünüyor. Sızıntı riski mevcut.`);
        }

        if (forgottenAppts.length > 0) {
            insights.push(`BİLGİ: ${forgottenAppts.length} randevu hala 'Bekliyor' veya 'Geldi' durumunda. Unutulmuş olabilirler.`);
        }

        return insights;
    }, [totalRev, topStaff, suspiciousAppts, forgottenAppts, completedAppts]);

    const isAuthorizedToClose = useMemo(() => {
        if (auditStatus === 'clear') return true;
        const managerRoles = ['manager', 'Manager', 'Business_Owner', 'SaaS_Owner'];
        return managerRoles.includes(currentUser?.role || '');
    }, [auditStatus, currentUser]);

    const handleConfirmClosure = async () => {
        if (!isAuthorizedToClose) return;
        setIsClosing(true);
        
        const reportData = {
            reportDate: today,
            expectedNakit: cashTotal,
            expectedKart: cardTotal,
            actualNakit: cashTotal, // User could input these in a more advanced version
            actualKart: cardTotal,
            totalDifference: 0,
            aiSummary: Array.isArray(aiInsights) ? aiInsights.join(' | ') : aiInsights,
            notes: suspiciousAppts.length > 0 ? `${suspiciousAppts.length} ödemesiz randevu ile kapatıldı.` : 'Sorunsuz kapanış.'
        };

        const success = await addZReport(reportData);
        
        if (success) {
            await addLog('Günü Kapatma', 'Sistem', '', `Rapor mühürlendi ve yöneticiye iletildi. Ciro: ₺${totalRev}`);
            setIsClosing(false);
            setIsDone(true);
        } else {
            alert('Rapor kaydedilirken bir hata oluştu.');
            setIsClosing(false);
        }
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
                            <p className="text-2xl font-black text-amber-700">{completedAppts.length} Randevu</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* AI & Risk Section */}
                        <div className="space-y-6">
                            <div className={`bg-gradient-to-br ${auditStatus === 'warning' ? 'from-rose-600 to-rose-800' : 'from-primary to-indigo-900'} rounded-[2.5rem] p-10 text-white shadow-xl relative overflow-hidden`}>
                                <div className="absolute top-0 right-0 p-10 opacity-10"><Sparkles size={180} /></div>
                                <h3 className="text-xl font-black mb-6 flex items-center gap-3 italic relative z-10">
                                    <Zap className="w-6 h-6 text-yellow-400 fill-yellow-400" /> Yapay Zeka Denetimi
                                </h3>
                                <div className="space-y-4 relative z-10">
                                    {Array.isArray(aiInsights) ? aiInsights.map((ins, i) => (
                                        <div key={i} className="flex gap-4 group">
                                            <div className={`w-1.5 h-1.5 rounded-full ${ins.includes('DİKKAT') ? 'bg-yellow-400 animate-pulse' : 'bg-indigo-300'} mt-2 flex-shrink-0`} />
                                            <p className="text-sm font-bold text-indigo-50 leading-relaxed">{ins}</p>
                                        </div>
                                    )) : <p className="text-sm font-bold text-indigo-50 leading-relaxed">{aiInsights}</p>}
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/10 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <ShieldCheck className={`w-5 h-5 ${auditStatus === 'warning' ? 'text-yellow-400' : 'text-emerald-400'}`} />
                                        <span className="text-[10px] font-black uppercase tracking-widest text-indigo-200 italic">
                                            {auditStatus === 'warning' ? 'TUTARSIZLIK SAPTANDI' : 'TUTARLILIK DOĞRULANDI'}
                                        </span>
                                    </div>
                                    {(suspiciousAppts.length > 0 || forgottenAppts.length > 0) && (
                                        <button 
                                            onClick={() => setShowRiskDetails(!showRiskDetails)}
                                            className="text-[10px] font-black uppercase bg-white/20 px-4 py-2 rounded-xl hover:bg-white/30 transition-all"
                                        >
                                            {showRiskDetails ? 'ÖZETİ GÖR' : 'RİSKLERİ İNCELE'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <AnimatePresence>
                                {showRiskDetails && (
                                    <motion.div 
                                        initial={{ opacity: 0, y: -20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -20 }}
                                        className="bg-white border-2 border-rose-100 rounded-[2.5rem] p-8 space-y-6 shadow-xl shadow-rose-100/20"
                                    >
                                        {suspiciousAppts.length > 0 && (
                                            <div>
                                                <h4 className="text-[10px] font-black text-rose-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <DollarSign size={14} /> ÖDEMESİ EKSİK RANDEVULAR
                                                </h4>
                                                <div className="space-y-3">
                                                    {suspiciousAppts.map(a => (
                                                        <div key={a.id} className="flex justify-between items-center p-4 bg-rose-50/50 rounded-2xl border border-rose-100 text-xs font-bold text-rose-900 leading-none">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-black uppercase tracking-tight">{a.customerName}</span>
                                                                <span className="text-[10px] opacity-60">{a.service}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="font-black">₺{a.price.toLocaleString('tr-TR')}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {forgottenAppts.length > 0 && (
                                            <div className="pt-4 border-t border-gray-100">
                                                <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                                    <Clock size={14} /> UNUTULMUŞ OLABİLECEK (AÇIK) RANDEVULAR
                                                </h4>
                                                <div className="space-y-3">
                                                    {forgottenAppts.map(a => (
                                                        <div key={a.id} className="flex justify-between items-center p-4 bg-amber-50/50 rounded-2xl border border-amber-100 text-xs font-bold text-amber-900 leading-none">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-black uppercase tracking-tight">{a.customerName}</span>
                                                                <span className="text-[10px] opacity-60">{a.time} - {a.service}</span>
                                                            </div>
                                                            <span className="text-[9px] px-2 py-1 bg-white rounded-lg border border-amber-200">{a.status.toUpperCase()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Details Section */}
                        <div className="space-y-6">
                            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2">
                                <Award className="w-4 h-4 text-amber-500" /> Günün Kahramanları
                            </h4>
                            <div className="space-y-4">
                                {staffMembers.filter(s => completedAppts.some(a => a.staffName === s.name)).map(staff => {
                                    const rev = completedAppts.filter(a => a.staffName === staff.name).reduce((s, a) => s + (a.price || 0), 0);
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
                                {completedAppts.length === 0 && (
                                    <p className="text-[10px] text-gray-300 font-bold uppercase text-center py-10 border-2 border-dashed border-gray-50 rounded-[2rem]">Henüz tamamlanan randevu yok</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="p-10 border-t border-gray-50 bg-gray-50/50">
                    {!isDone ? (
                        <div className="space-y-4">
                            {suspiciousAppts.length > 0 && (
                                <div className="flex items-center gap-3 p-4 bg-rose-50 text-rose-600 rounded-2xl mb-4 text-[10px] font-black uppercase italic animate-pulse">
                                    <AlertTriangle size={16} />
                                    <span>
                                        {isAuthorizedToClose 
                                            ? "Dikkat: Ödemesi eksik randevular var! Yönetici olarak yine de kapatmak istiyor musunuz?" 
                                            : "Dikkat: Ödemesi eksik randevular var! Kapatmak için yönetici onayı gereklidir."}
                                    </span>
                                </div>
                            )}
                            <button 
                                onClick={handleConfirmClosure}
                                disabled={isClosing || !isAuthorizedToClose}
                                className={`w-full py-6 rounded-[2rem] font-black text-sm shadow-2xl flex items-center justify-center gap-4 transition-all ${isClosing || !isAuthorizedToClose ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : (auditStatus === 'warning' ? 'bg-rose-600 shadow-rose-200' : 'bg-primary shadow-primary/25')} text-white hover:scale-[1.02] active:scale-95`}
                            >
                                {isClosing ? <Sparkles className="w-6 h-6 animate-spin" /> : <CheckCircle2 className="w-6 h-6" />}
                                {isClosing ? 'AI VERİLERİ MÜHÜRLÜYOR...' : (auditStatus === 'warning' ? 'RİSKLERİ KABUL ET VE MÜHÜRLE' : 'GÜNÜ KAPAT VE TÜM VERİLERİ ONAYLA')}
                            </button>
                        </div>
                    ) : (
                        <div className="bg-emerald-500 p-6 rounded-[2rem] text-white flex items-center justify-center gap-4 animate-[slideUp_0.4s_ease]">
                            <CheckCircle2 className="w-8 h-8" />
                            <div className="text-center">
                                <p className="font-black text-lg text-white">GÜN BAŞARIYLA KAPATILDI</p>
                                <p className="text-[10px] font-black uppercase opacity-70">Z-Raporu mühürlendi ve işletme sahibine raporlandı.</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

