"use client";

import { useStore } from "@/lib/store";
import { 
    CreditCard, Zap, ShieldCheck, 
    CheckCircle2, ArrowRight, Star,
    Building2, Users, HardDrive,
    X, Copy, Info, Lock, Banknote,
    Clock
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useMemo } from "react";

type BillingPeriod = 'monthly' | 'quarterly' | 'annual';

export default function BillingPage() {
    const { currentBusiness, branches, allUsers } = useStore();
    const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
    const [period, setPeriod] = useState<BillingPeriod>('monthly');
    const [paymentMethod, setPaymentMethod] = useState<'card' | 'manual'>('card');
    const [isProcessing, setIsProcessing] = useState(false);

    // Pricing Model - Adjusted to 3,000 TL monthly base
    const BASE_PRICE = 3000;
    const pricing = useMemo(() => {
        switch(period) {
            case 'quarterly':
                return {
                    label: '3 Aylık',
                    price: Math.round(BASE_PRICE * 3 * 0.9), // %10 Discount
                    monthlyEquivalent: Math.round(BASE_PRICE * 0.9),
                    discount: '%10 İndirim'
                };
            case 'annual':
                return {
                    label: 'Yıllık',
                    price: Math.round(BASE_PRICE * 12 * 0.8), // %20 Discount
                    monthlyEquivalent: Math.round(BASE_PRICE * 0.8),
                    discount: '%20 İndirim'
                };
            default:
                return {
                    label: 'Aylık',
                    price: BASE_PRICE,
                    monthlyEquivalent: BASE_PRICE,
                    discount: null
                };
        }
    }, [period]);

    // Simulated but consistent data usage based on object counts
    const estimatedDataUsage = useMemo(() => {
        const factor = (branches.length * 10) + (allUsers.length * 5);
        const used = Math.min(950, 120 + factor); // Start from 120MB + activity
        return { used, total: 1024 };
    }, [branches, allUsers]);

    if (!currentBusiness) return null;

    const currentPlan = currentBusiness.plan || 'Basic';
    const isEnterprise = currentPlan === 'Aura Enterprise';

    // Grace Period Logic
    const graceInfo = useMemo(() => {
        if (currentBusiness.paymentStatus !== 'unpaid') return null;
        const graceUntil = (currentBusiness as any).grace_period_until;
        if (!graceUntil) return null;
        
        const diff = new Date(graceUntil).getTime() - new Date().getTime();
        const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
        return { daysLeft: Math.max(0, daysLeft), date: new Date(graceUntil).toLocaleDateString('tr-TR') };
    }, [currentBusiness]);

    // Current Usage Stats
    const activeBranches = branches.length;
    const maxBranches = currentBusiness.maxBranches || 1;
    const branchUsagePct = Math.min(100, (activeBranches / maxBranches) * 100);

    const activeUsers = allUsers.filter((u: any) => u.businessId === currentBusiness.id).length;
    const maxUsers = currentBusiness.maxUsers || 5;
    const userUsagePct = Math.min(100, (activeUsers / maxUsers) * 100);

    const handleUpgradeRequest = () => {
        setIsCheckoutOpen(true);
    };

    const handleCheckout = () => {
        setIsProcessing(true);
        setTimeout(() => {
            setIsProcessing(false);
            setIsCheckoutOpen(false);
            alert("Ödeme/Talep işleminiz başarıyla alındı. Sistem yöneticisi onayından sonra planınız güncellenecektir.");
        }, 1500);
    };

    return (
        <div className="p-6 md:p-10 max-w-[1200px] mx-auto space-y-12 pb-32 font-sans overflow-hidden">
            <div className="text-center space-y-4 mb-12">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-20 h-20 bg-indigo-600/10 rounded-full flex items-center justify-center mx-auto text-indigo-600 mb-6 border border-indigo-200">
                    <ShieldCheck size={32} />
                </motion.div>
                <motion.h1 initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900">
                    Abonelik & Komuta Merkezi
                </motion.h1>
                <p className="text-gray-500 font-bold max-w-xl mx-auto uppercase tracking-widest text-[10px]">
                    İmparatorluğun sınırlarını belirleyin. Sovereign Katmanı ile tam uyumlu operasyonel yönetim.
                </p>
            </div>

            {/* Period Selector */}
            <div className="flex justify-center mb-8">
                <div className="bg-gray-100 p-1.5 rounded-[2rem] flex gap-1 border border-gray-200">
                    {(['monthly', 'quarterly', 'annual'] as BillingPeriod[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={`px-8 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all ${
                                period === p ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-600/10' : 'text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {p === 'monthly' ? 'Aylık' : p === 'quarterly' ? '3 Aylık' : 'Yıllık'}
                            {p !== 'monthly' && (
                                <span className="ml-2 bg-emerald-500 text-white px-2 py-0.5 rounded-full text-[8px]">
                                    {p === 'quarterly' ? '-%10' : '-%20'}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Current Plan Overview */}
                <motion.div 
                    initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.1 }}
                    className="bg-white border border-gray-100 p-10 rounded-[3rem] shadow-sm space-y-8 relative overflow-hidden"
                >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full blur-3xl -mr-10 -mt-10" />
                    
                    <div className="flex items-start justify-between relative z-10">
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">GÜNCEL HAKİMİYET SEVİYESİ</p>
                            <h2 className="text-3xl font-black text-gray-900 tracking-tight flex items-center gap-3">
                                {currentPlan} 
                                {isEnterprise && <Star className="w-6 h-6 text-amber-500 fill-amber-500 animate-pulse" />}
                            </h2>
                        </div>
                        <div className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-[10px] font-black uppercase tracking-widest select-none border border-emerald-100">
                            AKTİF SİSTEM
                        </div>
                    </div>

                    {graceInfo && (
                        <motion.div 
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-rose-50 border border-rose-100 p-6 rounded-[2rem] flex items-center gap-5 relative z-10"
                        >
                            <div className="w-12 h-12 bg-rose-600 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-lg shadow-rose-200">
                                <Clock size={24} />
                            </div>
                            <div>
                                <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">MÜHÜR ÖNCESİ TOLERANS SÜRESİ</p>
                                <p className="text-sm font-bold text-rose-900 leading-tight">
                                    Ödemeniz gecikmiş. Sistemi mühürlenmekten kurtarmak için son <span className="text-rose-600 underline">{graceInfo.daysLeft} gününüz</span> kaldı ({graceInfo.date}).
                                </p>
                            </div>
                        </motion.div>
                    )}

                    <div className="space-y-6 relative z-10">
                        {/* Branch Quota */}
                        <div className="space-y-3 relative">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                                        <Building2 size={16} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">Şube Kapasitesi</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeBranches} / {maxBranches} Konum</p>
                                    </div>
                                </div>
                                <span className="font-black text-sm text-gray-900">%{Math.round(branchUsagePct)}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${branchUsagePct}%` }}
                                    className={`h-full ${branchUsagePct >= 90 ? 'bg-rose-500' : 'bg-indigo-600'} transition-all`} 
                                />
                            </div>
                        </div>

                        {/* User Quota */}
                        <div className="space-y-3 relative">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                                        <Users size={16} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">Muhafız & Personel Gücü</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{activeUsers} / {maxUsers} Kullanıcı</p>
                                    </div>
                                </div>
                                <span className="font-black text-sm text-gray-900">%{Math.round(userUsagePct)}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${userUsagePct}%` }}
                                    className={`h-full ${userUsagePct >= 90 ? 'bg-rose-500' : 'bg-indigo-600'} transition-all`} 
                                />
                            </div>
                        </div>

                        {/* Server Capacity */}
                        <div className="space-y-3 relative">
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center border border-gray-100">
                                        <HardDrive size={16} className="text-gray-500" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-black text-gray-900">Merkezi Veri Depolama</p>
                                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{estimatedDataUsage.used} MB / {estimatedDataUsage.total} MB</p>
                                    </div>
                                </div>
                                <span className="font-black text-sm text-gray-900">%{Math.round((estimatedDataUsage.used / estimatedDataUsage.total) * 100)}</span>
                            </div>
                            <div className="h-2 w-full bg-gray-100 rounded-full border border-gray-200 overflow-hidden">
                                <motion.div 
                                    initial={{ width: 0 }}
                                    animate={{ width: `${(estimatedDataUsage.used / estimatedDataUsage.total) * 100}%` }}
                                    className="h-full bg-indigo-600 transition-all" 
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Upgrade Offer Card */}
                <motion.div 
                    initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.2 }}
                    className="bg-black text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group shadow-indigo-600/20"
                >
                    <div className="absolute top-0 right-0 p-8 opacity-20 pointer-events-none group-hover:scale-110 transition-transform duration-700">
                        <Zap size={200} className="text-indigo-500" />
                    </div>
                    
                    <div className="relative z-10 space-y-8 h-full flex flex-col justify-between">
                        <div>
                            <div className="flex items-center gap-2 mb-6">
                                <ShieldCheck className="w-5 h-5 text-indigo-400" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">ÜSTÜN EGEMENLİK</p>
                            </div>
                            <h3 className="text-4xl font-black tracking-tighter mb-4">Aura Enterprise</h3>
                            <p className="text-gray-400 font-bold leading-relaxed text-sm max-w-sm">
                                Tüm sınırları kaldırın. AI analitiği, limitsiz şube ve muhafız desteğiyle gerçek gücü elinize alın.
                            </p>
                        </div>

                        <ul className="space-y-4">
                            {[
                                'Limitsiz Şube & Konum Erişimi',
                                'Sınırsız Personel Hesabı',
                                'Proaktif AI Churn & Ciro Tahminlemesi',
                                'Sovereign Seviyesi VIP Destek Hattı'
                            ].map((feature, i) => (
                                <li key={i} className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                                    <span className="text-sm font-bold text-gray-200">{feature}</span>
                                </li>
                            ))}
                        </ul>

                        <div>
                            <div className="flex items-end gap-2 mb-6">
                                <span className="text-5xl font-black">₺{pricing.monthlyEquivalent.toLocaleString('tr-TR')}</span>
                                <div className="flex flex-col mb-1 italic">
                                    <span className="text-gray-500 font-bold text-xs">/ay</span>
                                    {pricing.discount && (
                                        <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">{pricing.discount} GÜCÜ</span>
                                    )}
                                </div>
                            </div>
                            <button 
                                onClick={handleUpgradeRequest}
                                className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black flex items-center justify-center gap-2 hover:bg-indigo-500 transition-all shadow-[0_0_40px_rgba(79,70,229,0.3)] active:scale-95"
                            >
                                {pricing.label.toUpperCase()} PLANA YÜKSELT <ArrowRight size={18} />
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* FULLSCREEN CHECKOUT MODAL */}
            <AnimatePresence>
                {isCheckoutOpen && (
                    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-2xl">
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 30 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 30 }}
                            className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col md:flex-row relative"
                        >
                            {/* Left: Summary */}
                            <div className="bg-black text-white p-10 md:w-2/5 flex flex-col justify-between relative overflow-hidden">
                                <div className="absolute -bottom-20 -left-20 opacity-20 pointer-events-none">
                                    <Zap size={300} className="text-indigo-500" />
                                </div>
                                <div className="relative z-10">
                                    <button onClick={() => setIsCheckoutOpen(false)} className="w-10 h-10 mb-8 flex items-center justify-center bg-white/10 hover:bg-white/20 text-white rounded-2xl transition-all md:hidden"><X size={20}/></button>
                                    
                                    <div className="flex items-center gap-2 mb-4">
                                        <Clock className="w-4 h-4 text-indigo-400" />
                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/50">{pricing.label} ÖDEME</p>
                                    </div>
                                    <h2 className="text-3xl font-black tracking-tight mb-2">Aura Enterprise</h2>
                                    <p className="text-sm text-gray-400 font-bold mb-8">Toplam Abonelik Bedeli</p>
                                    
                                    <div className="flex items-end gap-2 mb-8">
                                        <span className="text-5xl font-black">₺{pricing.price.toLocaleString('tr-TR')}</span>
                                        <span className="text-gray-500 font-black mb-1.5 uppercase text-xs">/TRY</span>
                                    </div>

                                    <div className="bg-white/5 border border-white/10 rounded-2xl p-5 mb-6">
                                        <ul className="space-y-4">
                                            <li className="flex items-center gap-3 text-xs font-bold text-gray-300">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> {pricing.label} Periyodik Erişim
                                            </li>
                                            <li className="flex items-center gap-3 text-xs font-bold text-gray-300">
                                                <CheckCircle2 className="w-4 h-4 text-emerald-400" /> Limitsiz Şube & Kapasite
                                            </li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="relative z-10 flex items-center gap-3 text-[10px] font-black text-gray-500 uppercase tracking-widest mt-8">
                                    <Lock size={14} /> 256-BIT SOVEREIGN SECURITY
                                </div>
                            </div>

                            {/* Right: Payment Details */}
                            <div className="p-10 md:w-3/5 bg-white relative flex flex-col h-[80vh] md:h-auto overflow-y-auto">
                                <button onClick={() => setIsCheckoutOpen(false)} className="absolute top-6 right-6 w-10 h-10 hidden md:flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-400 rounded-2xl transition-all"><X size={20}/></button>

                                <h3 className="text-2xl font-black text-gray-900 tracking-tight italic mb-6 mt-4 md:mt-0">Güvenli Ödeme</h3>
                                
                                <div className="flex gap-4 mb-8">
                                    <button 
                                        onClick={() => setPaymentMethod('card')}
                                        className={`flex-1 flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${
                                            paymentMethod === 'card' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 shadow-lg shadow-indigo-600/10' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                                        }`}
                                    >
                                        <CreditCard size={28} className="mb-2" />
                                        <span className="text-xs font-black uppercase tracking-widest">Kredi Kartı</span>
                                    </button>
                                    <button 
                                        onClick={() => setPaymentMethod('manual')}
                                        className={`flex-1 flex flex-col items-center justify-center p-5 rounded-3xl border-2 transition-all ${
                                            paymentMethod === 'manual' ? 'border-indigo-600 bg-indigo-50/50 text-indigo-600 shadow-lg shadow-indigo-600/10' : 'border-gray-100 bg-white text-gray-400 hover:border-gray-200'
                                        }`}
                                    >
                                        <Banknote size={28} className="mb-2" />
                                        <span className="text-xs font-black uppercase tracking-widest">Havale / EFT</span>
                                    </button>
                                </div>

                                {/* Form Area */}
                                <div className="flex-1">
                                    {paymentMethod === 'card' ? (
                                        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-5">
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Kart Üzerindeki İsim</label>
                                                <input type="text" placeholder="AD SOYAD" className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold text-sm outline-none transition-all uppercase" />
                                            </div>
                                            <div className="space-y-2 relative">
                                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Kart Numarası</label>
                                                <div className="relative">
                                                    <CreditCard className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                                                    <input type="text" placeholder="0000 0000 0000 0000" maxLength={19} className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl pl-14 pr-5 py-4 font-bold text-sm outline-none transition-all tracking-widest" />
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-5">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">Son Kullanma</label>
                                                    <input type="text" placeholder="AA / YY" maxLength={5} className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold text-sm outline-none transition-all text-center tracking-widest" />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-2">CVC</label>
                                                    <input type="text" placeholder="***" maxLength={3} className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl px-5 py-4 font-bold text-sm outline-none transition-all text-center tracking-widest" />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-700">
                                                <Info className="w-5 h-5 flex-shrink-0" />
                                                <p className="text-xs font-bold leading-relaxed">Lütfen transfer açıklama kısmına <strong>{currentBusiness.slug.toUpperCase()}</strong> kodunu ekleyin.</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="bg-gray-50 p-4 rounded-2xl relative group border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hesap Sahibi</p>
                                                    <p className="font-black text-sm text-gray-900 group-hover:text-indigo-600 transition-colors">AURA YAZILIM VE TEKNOLOJİ A.Ş.</p>
                                                    <button className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-400 hover:text-indigo-600"><Copy size={14}/></button>
                                                </div>
                                                <div className="bg-gray-50 p-4 rounded-2xl relative group border border-gray-100 hover:border-indigo-200 transition-all cursor-pointer">
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">IBAN (Garanti BBVA)</p>
                                                    <p className="font-black text-sm text-gray-900 font-mono tracking-wider group-hover:text-indigo-600 transition-colors">TR12 0006 2000 0001 2345 6789 01</p>
                                                    <button className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center bg-white rounded-xl shadow-sm text-gray-400 hover:text-indigo-600"><Copy size={14}/></button>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}
                                </div>

                                <div className="mt-8 pt-6 border-t border-gray-50">
                                    <button 
                                        disabled={isProcessing}
                                        onClick={handleCheckout}
                                        className="w-full bg-indigo-600 disabled:bg-indigo-400 text-white py-5 rounded-[1.5rem] font-black text-sm uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 flex items-center justify-center gap-2 transition-all active:scale-95"
                                    >
                                        {isProcessing ? (
                                            <span className="animate-pulse italic">İŞLEM GERÇEKLEŞTİRİLİYOR...</span>
                                        ) : (
                                            <>
                                                {paymentMethod === 'card' ? 'ABONELİĞİ BAŞLAT' : 'ÖDEMEYİ ONAYLA'} <ArrowRight size={18} />
                                            </>
                                        )}
                                    </button>
                                    <p className="text-[8px] text-center text-gray-400 mt-4 font-black tracking-widest uppercase">
                                        Onayladığınızda platform kullanım koşullarını kabul etmiş sayılırsınız.
                                    </p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
