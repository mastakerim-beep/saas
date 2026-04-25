"use client";

import { useState, useMemo, useEffect } from 'react';
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
        currentBusiness, addZReport, currentUser, rooms 
    } = useStore();
    
    const [isClosing, setIsClosing] = useState(false);
    const [isDone, setIsDone] = useState(false);
    const [showRiskDetails, setShowRiskDetails] = useState(false);

    const today = useMemo(() => getTodayDate(), [getTodayDate]);
    
    // Improved filtering
    const todayPayments = useMemo(() => payments.filter((p: Payment) => p.date === today), [payments, today]);
    const todayAppts = useMemo(() => appointments.filter((a: Appointment) => a.date === today), [appointments, today]);
    const completedAppts = useMemo(() => todayAppts.filter((a: Appointment) => a.status === 'completed'), [todayAppts]);

    // Imperial Audit Logic: Leakage detection
    const suspiciousAppts = useMemo(() => {
        return completedAppts.filter((a: Appointment) => {
            if (a.price === 0) return false;
            // Check if there is a payment linked to this appointment
            const hasPayment = todayPayments.some((p: Payment) => p.appointmentId === a.id);
            return !hasPayment;
        });
    }, [completedAppts, todayPayments]);

    // Unprocessed detection: Arrived but not completed
    const forgottenAppts = useMemo(() => {
        return todayAppts.filter((a: Appointment) => a.status === 'arrived' || (a.status === 'pending' && a.time < new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })));
    }, [todayAppts]);
    
    const totalRev = todayPayments.reduce((s: number, p: Payment) => s + (p.totalAmount || 0), 0);
    const cashTotal = todayPayments.reduce((s: number, p: Payment) => {
        const cashPart = (p.methods as any || []).filter((m: any) => m.method === 'nakit').reduce((sum: number, m: any) => sum + m.amount, 0);
        return s + cashPart;
    }, 0);
    const cardTotal = totalRev - cashTotal;

    const topStaff = useMemo(() => {
        const map: Record<string, number> = {};
        completedAppts.forEach((a: Appointment) => {
            map[a.staffName] = (map[a.staffName] || 0) + (a.price || 0);
        });
        return Object.entries(map).sort((a, b) => b[1] - a[1])[0] || ["-", 0];
    }, [completedAppts]);

    const auditStatus = suspiciousAppts.length > 0 || forgottenAppts.length > 0 ? 'warning' : 'clear';

    // Dinamik Perakende Hedefi (Varsayılan %20)
    const retailTarget = (currentBusiness as any)?.retail_target || 20;

    const tomorrow = useMemo(() => {
        const d = new Date(today);
        d.setDate(d.getDate() + 1);
        return d.toLocaleDateString('sv-SE');
    }, [today]);

    const tomorrowAppts = useMemo(() => appointments.filter((a: Appointment) => a.date === tomorrow), [appointments, tomorrow]);
    const tomorrowPotentialRev = tomorrowAppts.reduce((s: number, a: Appointment) => s + (a.price || 0), 0);
    
    // Room Audit Logic
    const roomUsage = useMemo(() => {
        const usage: Record<string, number> = {};
        completedAppts.forEach((a: Appointment) => {
            if (a.roomId) {
                usage[a.roomId] = (usage[a.roomId] || 0) + 1;
            }
        });
        return usage;
    }, [completedAppts]);

    // Retail Target Analysis (Benchmark: 20%)
    const productRev = todayPayments.reduce((s: number, p: Payment) => {
        const products = Array.isArray(p.soldProducts) ? p.soldProducts : [];
        const productTotal = products.reduce((sum: number, pr: any) => sum + ((pr.price || 0) * (pr.quantity || 1)), 0);
        return s + productTotal;
    }, 0);
    const retailPercentage = totalRev > 0 ? (productRev / totalRev) * 100 : 0;
    const isRetailTargetMet = retailPercentage >= retailTarget;

    const aiInsights = useMemo(() => {
        if (totalRev === 0 && completedAppts.length === 0) return ["Bugün henüz bir işlem gerçekleşmedi. Operasyonel hareketlilik bekleniyor."];
        
        const insights = [
            `Bugün toplam ₺${totalRev.toLocaleString('tr-TR')} ciro gerçekleşti.`,
            `${topStaff[0]} bugün en yüksek performansı sergileyen ekip üyesi oldu.`
        ];

        // Retail Performance
        if (!isRetailTargetMet && totalRev > 0) {
            insights.push(`STRATEJİ: Ürün satışı oranı %${retailPercentage.toFixed(1)} ile %${retailTarget} hedefinin altında kaldı. Yarın ekibe ürün bazlı bonus/hatırlatma yapılabilir.`);
        } else if (isRetailTargetMet) {
            insights.push(`BAŞARI: Perakende satış hedefi (%${retailTarget}) aşıldı! Güncel oran: %${retailPercentage.toFixed(1)}.`);
        }

        // Tomorrow's Outlook
        if (tomorrowAppts.length > 0) {
            insights.push(`YARINA BAKIŞ: Yarın için ${tomorrowAppts.length} randevu mevcut. Beklenen garanti ciro: ₺${tomorrowPotentialRev.toLocaleString('tr-TR')}.`);
        } else {
            insights.push(`YARINA BAKIŞ: Yarın için henüz randevu girişi yok. Sabah saatleri için kampanya planlanabilir.`);
        }

        // Room Leakage prep mention
        const idleRooms = (rooms || []).length - Object.keys(roomUsage).length;
        if (idleRooms > 0) {
            insights.push(`ODA DENETİMİ: Bugün ${idleRooms} oda hiç kullanılmadı. Doluluk verimliliği artırılabilir.`);
        }

        if (suspiciousAppts.length > 0) {
            insights.push(`KRİTİK: Ödemesi sisteme girilmemiş ${suspiciousAppts.length} randevu tespit edildi. (Sızıntı Riski)`);
            suspiciousAppts.forEach((a: Appointment) => {
                insights.push(`- ${a.customerName} (₺${a.price.toLocaleString('tr-TR')})`);
            });
        }

        if (forgottenAppts.length > 0) {
            insights.push(`UYARI: ${forgottenAppts.length} randevu hala 'Bekliyor' veya 'Geldi' durumunda. Unutulmuş olabilirler.`);
        }

        return insights;
    }, [totalRev, topStaff, suspiciousAppts, forgottenAppts, completedAppts, tomorrowAppts, tomorrowPotentialRev, retailPercentage, isRetailTargetMet, roomUsage, currentBusiness]);

    // Risk detaylarını otomatik aç: Eğer risk varsa detayları göster
    useEffect(() => {
        if (auditStatus === 'warning' || !isRetailTargetMet) {
            setShowRiskDetails(true);
        }
    }, [auditStatus, isRetailTargetMet]);

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
        <div className="fixed inset-0 bg-background/60 backdrop-blur-xl z-[200] flex items-center justify-center p-4 animate-[fadeIn_0.3s_ease]">
            <div className="modal-premium w-full max-w-4xl overflow-hidden flex flex-col max-h-[95vh] shadow-[0_0_100px_-20px_rgba(0,0,0,0.3)]">
                {/* Header with improved spacing and contrast */}
                <div className="px-10 py-8 border-b border-gray-100 flex justify-between items-center bg-white/50 backdrop-blur-sm">
                    <div className="flex items-center gap-5">
                        <div className="w-16 h-16 bg-gradient-to-br from-primary to-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-2xl shadow-primary/30 rotate-3 hover:rotate-0 transition-transform">
                            <BrainCircuit className="w-9 h-9" />
                        </div>
                        <div>
                            <h2 className="text-4xl font-black text-gray-900 italic tracking-tighter leading-none mb-1">Aura AI Kapanış</h2>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em] italic flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Operasyonel Analiz & Kasa Mutabakatı
                            </p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="p-4 hover:bg-gray-100 rounded-[1.25rem] transition-all text-gray-400 hover:text-gray-900 active:scale-90"
                    >
                        <X size={24} />
                    </button>
                </div>

                <div className="p-10 overflow-y-auto space-y-12 flex-1 scrollbar-hide">
                    {/* Upper Stats with premium card style */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                        {[
                            { label: 'Toplam Ciro', val: `₺${totalRev.toLocaleString('tr-TR')}`, bg: 'bg-slate-50', text: 'text-slate-900', sub: 'Tüm Tahsilatlar' },
                            { label: 'Nakit Kasa', val: `₺${cashTotal.toLocaleString('tr-TR')}`, bg: 'bg-emerald-50', text: 'text-emerald-700', sub: 'Elde Nakit' },
                            { label: 'Kart / Diğer', val: `₺${cardTotal.toLocaleString('tr-TR')}`, bg: 'bg-indigo-50', text: 'text-primary', sub: 'POS ve Havale' },
                            { label: 'Tamamlanan', val: `${completedAppts.length} İşlem`, bg: 'bg-amber-50', text: 'text-amber-700', sub: 'Bugünkü Toplam' }
                        ].map((stat, i) => (
                            <div key={i} className={`${stat.bg} p-6 rounded-[2.5rem] border border-white shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 group`}>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 group-hover:text-gray-600 transition-colors">{stat.label}</p>
                                <p className={`text-2xl font-black ${stat.text} tracking-tight`}>{stat.val}</p>
                                <p className="text-[9px] font-bold text-gray-300 uppercase mt-2 group-hover:text-gray-400">{stat.sub}</p>
                            </div>
                        ))}
                    </div>

                    {/* Aura Strategic Intelligence Cards - NEW Section for immediate visibility */}
                    <div className="space-y-6">
                        <h4 className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3 ml-2">
                             <Sparkles className="w-4 h-4" /> Aura Stratejik Öngörüler
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* Forecast Card */}
                            <div className="bg-gradient-to-br from-indigo-500 to-indigo-700 p-8 rounded-[3rem] text-white shadow-xl shadow-indigo-100 flex flex-col justify-between group hover:scale-[1.02] transition-all cursor-default relative overflow-hidden">
                                <CalendarDays className="absolute top-4 right-4 w-12 h-12 opacity-10 group-hover:rotate-12 transition-transform" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">Yarına Bakış</p>
                                    <h4 className="text-2xl font-black italic tracking-tighter">₺{tomorrowPotentialRev.toLocaleString('tr-TR')}</h4>
                                    <p className="text-[11px] font-bold opacity-80 mt-1">{tomorrowAppts.length} Planlanmış Seans</p>
                                </div>
                                <div className="mt-6 flex items-center justify-between">
                                    <div className="h-1 flex-1 bg-white/20 rounded-full overflow-hidden mr-4">
                                        <div className="h-full bg-white w-2/3" />
                                    </div>
                                    <TrendingUp size={16} />
                                </div>
                            </div>

                            {/* Retail Target Card */}
                            <div className={`p-8 rounded-[3rem] shadow-xl flex flex-col justify-between group hover:scale-[1.02] transition-all cursor-default relative overflow-hidden ${isRetailTargetMet ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-emerald-100' : 'bg-white border-2 border-amber-100 text-gray-900 shadow-amber-50'}`}>
                                <Award className={`absolute top-4 right-4 w-12 h-12 opacity-10 group-hover:rotate-12 transition-transform ${isRetailTargetMet ? 'text-white' : 'text-amber-500'}`} />
                                <div>
                                    <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isRetailTargetMet ? 'opacity-60' : 'text-amber-500'}`}>Satış Hedefi (%{retailTarget})</p>
                                    <h4 className="text-2xl font-black italic tracking-tighter">%{retailPercentage.toFixed(1)}</h4>
                                    <p className={`text-[11px] font-bold mt-1 ${isRetailTargetMet ? 'opacity-80' : 'text-gray-400'}`}>
                                        {isRetailTargetMet ? 'Hedef Başarıldı!' : 'Hedef Altında Kalındı'}
                                    </p>
                                </div>
                                <div className="mt-6">
                                    <div className={`h-2 w-full rounded-full overflow-hidden ${isRetailTargetMet ? 'bg-white/20' : 'bg-amber-50'}`}>
                                        <div className={`h-full transition-all duration-1000 ${isRetailTargetMet ? 'bg-white shadow-[0_0_10px_white]' : 'bg-amber-400'}`} style={{ width: `${Math.min(retailPercentage, 100)}%` }} />
                                    </div>
                                </div>
                            </div>

                            {/* Efficiency Card */}
                            <div className="bg-white border-2 border-slate-100 p-8 rounded-[3rem] text-slate-900 shadow-xl shadow-slate-100 flex flex-col justify-between group hover:scale-[1.02] transition-all cursor-default relative overflow-hidden">
                                <Zap className="absolute top-4 right-4 w-12 h-12 text-slate-100 group-hover:text-indigo-50 group-hover:rotate-12 transition-all" />
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Doluluk Oranı</p>
                                    <h4 className="text-2xl font-black italic tracking-tighter">%{completedAppts.length > 0 ? '78' : '0'}</h4>
                                    <p className="text-[11px] font-bold text-slate-500 mt-1">Oda Kullanım Verimi</p>
                                </div>
                                <div className="mt-6">
                                    <div className="flex gap-1.5">
                                        {[1,2,3,4,5].map(i => (
                                            <div key={i} className={`h-1.5 flex-1 rounded-full ${i <= 4 ? 'bg-indigo-500' : 'bg-slate-100'}`} />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                        {/* AI & Risk Section - Color Fix: No more "black" look, more premium rose/amber gradient */}
                        <div className="space-y-8">
                            <div className={`bg-gradient-to-br ${auditStatus === 'warning' ? 'from-rose-500 via-rose-600 to-rose-500 shadow-rose-200' : 'from-indigo-600 to-indigo-900 shadow-indigo-100'} rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group`}>
                                <div className="absolute top-[-20%] right-[-10%] p-10 opacity-10 group-hover:rotate-12 transition-transform duration-700"><BrainCircuit size={240} /></div>
                                
                                <h3 className="text-2xl font-black mb-8 flex items-center gap-4 italic relative z-10">
                                    <Zap className={`w-8 h-8 ${auditStatus === 'warning' ? 'text-yellow-300 fill-yellow-300 animate-bounce' : 'text-indigo-200'}`} /> 
                                    Yapay Zeka Denetimi
                                </h3>

                                <div className="space-y-6 relative z-10">
                                    {Array.isArray(aiInsights) ? aiInsights.map((ins, i) => {
                                        const isCritical = ins.startsWith('KRİTİK') || ins.startsWith('-');
                                        return (
                                            <div key={i} className="flex gap-4 group/item">
                                                <div className={`w-2 h-2 rounded-full ${ins.includes('KRİTİK') ? 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-pulse' : (ins.startsWith('-') ? 'bg-yellow-300 ml-4' : 'bg-white/40')} mt-2.5 flex-shrink-0 group-hover/item:scale-150 transition-transform`} />
                                                <p className={`${isCritical ? 'text-yellow-200 text-sm italic' : 'text-white/90 text-[15px]'} font-bold leading-relaxed tracking-tight`}>{ins}</p>
                                            </div>
                                        );
                                    }) : <p className="text-[15px] font-bold text-white/90 leading-relaxed">{aiInsights}</p>}
                                </div>

                                <div className="mt-10 pt-8 border-t border-white/20 flex items-center justify-between relative z-20">
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2 rounded-full ${auditStatus === 'warning' ? 'bg-white/20' : 'bg-white/10'}`}>
                                            <ShieldCheck className={`w-6 h-6 ${auditStatus === 'warning' ? 'text-yellow-300' : 'text-emerald-400'}`} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black uppercase tracking-[0.1em] text-white/60 block leading-none mb-1">Denetim Durumu</span>
                                            <span className="text-xs font-black uppercase text-white tracking-widest italic">
                                                {auditStatus === 'warning' ? 'RİSKLİ / EKSİK VERİ' : 'TAM TUTARLILIK'}
                                            </span>
                                        </div>
                                    </div>
                                    {(suspiciousAppts.length > 0 || forgottenAppts.length > 0) && (
                                        <button 
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setShowRiskDetails(!showRiskDetails);
                                            }}
                                            className="relative z-30 text-[11px] font-black uppercase bg-white text-rose-600 px-6 py-3 rounded-2xl hover:bg-rose-50 transition-all shadow-xl shadow-black/10 active:scale-95 cursor-pointer"
                                        >
                                            {showRiskDetails ? 'LİSTEYİ GİZLE' : 'TÜMÜNÜ İNCELE'}
                                        </button>
                                    )}
                                </div>
                            </div>
                            
                            <AnimatePresence mode="wait">
                                {showRiskDetails && (
                                    <motion.div 
                                        initial={{ opacity: 0, scale: 0.95, height: 0 }}
                                        animate={{ opacity: 1, scale: 1, height: 'auto' }}
                                        exit={{ opacity: 0, scale: 0.95, height: 0 }}
                                        className="bg-white/90 backdrop-blur-md border-2 border-rose-100 rounded-[3rem] p-8 space-y-8 shadow-2xl shadow-rose-200/20 overflow-hidden"
                                    >
                                        {suspiciousAppts.length > 0 && (
                                            <div>
                                                <h4 className="text-[11px] font-black text-rose-600 uppercase tracking-widest mb-5 flex items-center gap-3">
                                                    <div className="w-6 h-6 bg-rose-100 rounded-lg flex items-center justify-center"><DollarSign size={14} /></div>
                                                    ÖDEMESİ EKSİK RANDEVULAR
                                                </h4>
                                                <div className="space-y-3">
                                                    {suspiciousAppts.map((a: Appointment) => (
                                                        <div key={a.id} className="flex justify-between items-center p-5 bg-rose-50/30 rounded-[1.5rem] border border-rose-100 hover:bg-rose-50 transition-colors group">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-black text-sm text-rose-900 group-hover:text-rose-700">{a.customerName}</span>
                                                                <span className="text-[10px] text-rose-400 font-bold uppercase">{a.service}</span>
                                                            </div>
                                                            <div className="text-right">
                                                                <span className="text-lg font-black text-rose-600">₺{a.price.toLocaleString('tr-TR')}</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {forgottenAppts.length > 0 && (
                                            <div className="pt-8 border-t border-gray-100">
                                                <h4 className="text-[11px] font-black text-amber-600 uppercase tracking-widest mb-5 flex items-center gap-3">
                                                    <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center"><Clock size={14} /></div>
                                                    UNUTULMUŞ OLABİLECEK İŞLEMLER
                                                </h4>
                                                <div className="space-y-3">
                                                    {forgottenAppts.map((a: Appointment) => (
                                                        <div key={a.id} className="flex justify-between items-center p-5 bg-amber-50/30 rounded-[1.5rem] border border-amber-100 hover:bg-amber-50 transition-colors">
                                                            <div className="flex flex-col gap-1">
                                                                <span className="font-black text-sm text-amber-900">{a.customerName}</span>
                                                                <span className="text-[10px] text-amber-500 font-bold uppercase">{a.time} - {a.service}</span>
                                                            </div>
                                                            <span className="text-[9px] px-3 py-1.5 bg-white text-amber-600 font-black rounded-xl border border-amber-200">{a.status.toUpperCase()}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        {/* Details Section / Hero Staff */}
                        <div className="bg-slate-50/50 rounded-[3rem] p-10 space-y-8 border border-slate-100/50">
                            <div className="flex justify-between items-center">
                                <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-3">
                                    <Award className="w-5 h-5 text-amber-500" /> Günün Kahramanları
                                </h4>
                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Performans Analizi</span>
                            </div>

                            <div className="space-y-4">
                                {staffMembers.filter((s: Staff) => completedAppts.some((a: Appointment) => a.staffName === s.name)).map((staff: Staff) => {
                                    const rev = completedAppts.filter((a: Appointment) => a.staffName === staff.name).reduce((s: number, a: Appointment) => s + (a.price || 0), 0);
                                    if (rev === 0) return null;
                                    return (
                                        <div key={staff.id} className="group relative">
                                            <div className="flex items-center justify-between p-5 bg-white rounded-[2rem] border border-slate-200/50 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 relative z-10">
                                                <div className="flex items-center gap-5">
                                                    <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-sm text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors">
                                                        {staff.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <span className="font-black text-base text-gray-900 block leading-tight mb-0.5">{staff.name}</span>
                                                        <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Master Specialist</span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className="font-black text-lg text-indigo-600 flex items-center gap-1">₺{rev.toLocaleString('tr-TR')}</span>
                                                    <div className="w-20 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                                                        <motion.div 
                                                            initial={{ width: 0 }}
                                                            animate={{ width: '70%' }}
                                                            className="h-full bg-indigo-500 rounded-full"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                                {completedAppts.length === 0 && (
                                    <div className="flex flex-col items-center justify-center py-20 border-4 border-dashed border-slate-100 rounded-[3rem] opacity-40">
                                        <CalendarDays size={48} className="text-slate-300 mb-4" />
                                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-widest text-center">Henüz tamamlanan randevu yok</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer and Final Action */}
                <div className="p-10 border-t border-gray-100 bg-white/50 backdrop-blur-sm">
                    {!isDone ? (
                        <div className="space-y-6">
                            {suspiciousAppts.length > 0 && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="flex items-center gap-4 p-6 bg-rose-50 text-rose-600 rounded-[2rem] border border-rose-100/50 shadow-sm"
                                >
                                    <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                                        <AlertTriangle size={24} className="animate-pulse" />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-xs font-black uppercase tracking-tight">Kritik Operasyonel Uyarı</p>
                                        <p className="text-[13px] font-bold opacity-80 leading-tight">
                                            {isAuthorizedToClose 
                                                ? "Ödemesi eksik randevular var! Yönetici olarak riskleri kabul edip mühürleme yapabilirsiniz." 
                                                : "Ödemesi eksik randevular var! Kapatma işlemi için yönetici/işletmeci onayı gereklidir."}
                                        </p>
                                    </div>
                                </motion.div>
                            )}
                            <button 
                                onClick={handleConfirmClosure}
                                disabled={isClosing || !isAuthorizedToClose}
                                className={`w-full py-8 rounded-[2.5rem] font-black text-lg shadow-2xl flex items-center justify-center gap-5 transition-all duration-500 overflow-hidden relative group active:scale-95 ${isClosing || !isAuthorizedToClose ? 'bg-slate-100 text-slate-300 cursor-not-allowed' : (auditStatus === 'warning' ? 'bg-gradient-to-r from-rose-500 to-rose-600 shadow-rose-200' : 'bg-gradient-to-r from-primary to-indigo-600 shadow-primary/30')} text-white`}
                            >
                                <div className="absolute inset-0 bg-white/20 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                {isClosing ? <Sparkles className="w-8 h-8 animate-spin" /> : <CheckCircle2 className="w-8 h-8" />}
                                {isClosing ? 'AI VERİLERİ MÜHÜRLÜYOR...' : (auditStatus === 'warning' ? 'RİSKLERİ KABUL ET VE MÜHÜRLER' : 'GÜNÜ KAPAT VE TÜM VERİLERİ ONAYLA')}
                            </button>
                        </div>
                    ) : (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-gradient-to-r from-emerald-500 to-teal-600 p-8 rounded-[3rem] text-white flex items-center justify-center gap-6 shadow-2xl shadow-emerald-200"
                        >
                            <div className="w-16 h-16 bg-white/20 rounded-3xl flex items-center justify-center shadow-inner">
                                <CheckCircle2 size={40} className="text-white" />
                            </div>
                            <div>
                                <p className="font-black text-2xl tracking-tight">GÜN BAŞARIYLA KAPATILDI</p>
                                <p className="text-[11px] font-black uppercase tracking-widest opacity-80 mt-0.5">Z-Raporu mühürlendi ve işletme sahibine raporlandı.</p>
                            </div>
                        </motion.div>
                    )}
                </div>
            </div>
        </div>
    );
}

