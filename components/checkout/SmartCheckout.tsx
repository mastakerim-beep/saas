"use client";

import { useState, useEffect } from "react";
import { useStore, Appointment, PaymentMethod, Product, Customer, PaymentDefinition, BankAccount, Package, CustomerMembership, MembershipPlan } from "@/lib/store";
import { 
    X, Plus, CreditCard, Banknote, Landmark,
    Trash2, Save, AlertCircle, Calendar,
    Zap, Crown, Package as PackageIcon, Sparkles, Printer, CheckCircle2, HeartHandshake, Percent, ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SmartCheckoutProps {
    appointment?: Appointment; // Opsiyonel (Hızlı Satış için)
    onClose: () => void;
    initialCustomerId?: string;
    initialService?: { name: string, price: number };
}

export default function SmartCheckout({ appointment, onClose, initialCustomerId, initialService }: SmartCheckoutProps) {
    const { 
        customers, customerMemberships, membershipPlans, 
        processCheckout, inventory, getUpsellSuggestions, 
        paymentDefinitions, getTodayDate, currentBusiness,
        packages, services, updateAppointment, bankAccounts,
        currentBranch, staff: allStaffRaw
    } = useStore();
    const allStaff = allStaffRaw ?? [];
    
    // Resolve target data
    const targetCustomerId = appointment?.customerId || initialCustomerId;
    const customer = customers.find((c: Customer) => c.id === targetCustomerId);
    const targetBranchId = appointment?.branchId || currentBranch?.id || "";
    
    const initialServiceName = appointment?.service || initialService?.name || "Hızlı Satış";
    const initialServicePrice = appointment?.price || initialService?.price || 0;
    
    // TÜM paketleri göster (seans kalan)
    const allCustomerPackagesWithStatus = packages.filter((p: Package) => 
        p.customerId === targetCustomerId && 
        (p.totalSessions - (p.usedSessions || 0)) > 0
    ).map((p: Package) => {
        const isExpired = p.expiry && new Date(p.expiry) < new Date();
        return { ...p, isExpired };
    });

    const isMatchingPackage = (p: any) => 
        p.id === appointment?.packageId ||
        p.name.toLowerCase().includes(initialServiceName.toLowerCase()) || 
        (p.serviceName && p.serviceName.toLowerCase().includes(initialServiceName.toLowerCase()));

    const applicablePackages = [
        ...allCustomerPackagesWithStatus.filter((p: any) => isMatchingPackage(p) && !p.isExpired),      // Önerilen & Aktif
        ...allCustomerPackagesWithStatus.filter((p: any) => !isMatchingPackage(p) && !p.isExpired),     // Diğer Aktifler
        ...allCustomerPackagesWithStatus.filter((p: any) => p.isExpired)                                // Süresi Dolanlar
    ];

    const activeMembership = customerMemberships.find((m: CustomerMembership) => m.customerId === targetCustomerId && m.status === 'active' && m.remainingSessions > 0);
    const membershipPlan = activeMembership ? membershipPlans.find((p: MembershipPlan) => p.id === activeMembership.planId) : null;
    
    // UI State
    const [selectedPackageId, setSelectedPackageId] = useState<string | null>(appointment?.packageId || null);
    const [methods, setMethods] = useState<Omit<PaymentMethod, 'id'>[]>([]);
    const [soldProducts, setSoldProducts] = useState<{ productId: string, name: string, price: number, quantity: number }[]>([]);
    const [note, setNote] = useState("");
    const [sellerId, setSellerId] = useState<string>(appointment?.staffId || "");
    const [dueDate, setDueDate] = useState<string>(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    });

    const [discountMode, setDiscountMode] = useState<'none'|'fixed'|'percentage'>('percentage');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [tip, setTip] = useState<number>(0);
    const { currentStaff } = useStore();
    const staffMaxDiscount = currentStaff?.maxDiscount || 0;
    const [pointsUsed, setPointsUsed] = useState<number>(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    // Gift (İkram) System State
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [authReason, setAuthReason] = useState<'gift' | 'excessive-discount' | null>(null);
    const [giftTarget, setGiftTarget] = useState<{type: 'service' | 'product', id?: string} | null>(null);
    const [isAuthorized, setIsAuthorized] = useState(false);
    const [giftedItems, setGiftedItems] = useState<Set<string>>(new Set()); 
    const [isServiceGift, setIsServiceGift] = useState(false);

    // New Smart Features
    const [installments, setInstallments] = useState<number>(1);
    const [installmentDates, setInstallmentDates] = useState<string[]>([]);
    
    // Service Override State
    const [overrideService, setOverrideService] = useState(initialServiceName);
    const [overridePrice, setOverridePrice] = useState(initialServicePrice);
    const [isServiceEditorOpen, setIsServiceEditorOpen] = useState(false);

    useEffect(() => {
        const dates = [];
        for (let i = 0; i < installments; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() + i + 1);
            dates.push(d.toISOString().split('T')[0]);
        }
        setInstallmentDates(dates);
    }, [installments]);

    // Auto-add deposit if exists
    useEffect(() => {
        if (appointment?.depositPaid && appointment.depositPaid > 0) {
            setMethods([{ method: 'nakit', amount: appointment.depositPaid, currency: 'TRY', rate: 1, isDeposit: true }]);
        }
    }, [appointment?.depositPaid]);

    const isPackageUsed = !!selectedPackageId;
    const isServiceGifted = isServiceGift;
    
    const servicePrice = (isServiceGifted || isPackageUsed) ? 0 : (overridePrice || 0);
    const productsPrice = soldProducts.reduce((s, p) => s + (giftedItems.has(p.productId) ? 0 : p.price * p.quantity), 0);
    const totalOriginalPrice = (overridePrice || 0) + soldProducts.reduce((s, p) => s + (p.price * p.quantity), 0);
    
    const subTotal = servicePrice + productsPrice;
    const discountAmount = discountMode === 'fixed' ? discountValue : discountMode === 'percentage' ? (subTotal * discountValue / 100) : 0;
    const grandTotal = Math.max(0, subTotal - discountAmount) + tip;
    
    const totalPaid = methods.reduce((sum, m) => sum + (m.amount * m.rate), 0);
    const remaining = grandTotal - totalPaid - pointsUsed;
    const earnedPoints = Math.floor(totalPaid / 10);

    const handleProcess = async () => {
        if (isSaving) return;
        setIsSaving(true);
        try {
            const installmentList = remaining > 0 ? installmentDates.map((date, idx) => ({
                amount: Math.floor(remaining / installments) + (idx === 0 ? remaining % installments : 0),
                dueDate: date
            })) : undefined;

            const ok = await processCheckout(
                {
                    appointmentId: appointment?.id,
                    branchId: targetBranchId,
                    customerId: targetCustomerId,
                    customerName: customer?.name || "Guest",
                    service: overrideService,
                    methods: methods.map((m: any) => ({ ...m, id: crypto.randomUUID() })),
                    totalAmount: totalPaid,
                    date: getTodayDate(),
                    isGift: isServiceGift || giftedItems.size > 0,
                    originalPrice: totalOriginalPrice,
                    finalPrice: grandTotal,
                    discountAmount: discountAmount,
                    note: note,
                    staffId: sellerId,
                    status: remaining <= 0 ? 'paid' : 'partial'
                },
                {
                    installments: installmentList,
                    soldProducts: soldProducts.map((p: any) => ({ 
                        productId: p.productId, 
                        name: p.name,
                        price: p.price,
                        quantity: p.quantity,
                        isGift: giftedItems.has(p.productId)
                    })),
                    earnedPoints,
                    tipAmount: tip,
                    pointsUsed,
                    packageId: selectedPackageId || undefined
                }
            );
            
            // Sync appointment if service was changed
            if (ok?.success && appointment && (overrideService !== appointment.service || overridePrice !== appointment.price)) {
                await updateAppointment(appointment.id, {
                    service: overrideService,
                    price: overridePrice
                });
            }

            if (ok?.success) {
                setIsSuccess(true);
            } else {
                alert(ok?.message || ok?.error?.message || "Ödeme kaydedilirken bir hata oluştu.");
            }
        } catch (error: any) {
            console.error(error);
            alert(error?.message || "Ödeme kaydedilirken bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleGiftToggle = (type: 'service' | 'product', id?: string) => {
        const isCurrentlyGifted = type === 'service' ? isServiceGift : giftedItems.has(id!);
        if (isCurrentlyGifted) {
            if (type === 'service') setIsServiceGift(false);
            else {
                const newGifted = new Set(giftedItems);
                newGifted.delete(id!);
                setGiftedItems(newGifted);
            }
            return;
        }
        setGiftTarget({ type, id });
        setAuthReason('gift');
        setIsPinModalOpen(true);
    };

    const effectiveDiscountPercent = subTotal > 0 ? (discountAmount / subTotal) * 100 : 0;
    const needsAuthForDiscount = effectiveDiscountPercent > staffMaxDiscount && !isAuthorized;

    const confirmPin = () => {
        const correctPin = currentBusiness?.managerPin || "0000"; 
        if (pin === correctPin) {
            if (authReason === 'gift') {
                if (giftTarget?.type === 'service') {
                    setIsServiceGift(true);
                } else if (giftTarget?.id) {
                    const newGifted = new Set(giftedItems);
                    newGifted.add(giftTarget.id);
                    setGiftedItems(newGifted);
                }
            } else if (authReason === 'excessive-discount') {
                setIsAuthorized(true);
            }
            setIsPinModalOpen(false);
            setPin("");
            setGiftTarget(null);
            setAuthReason(null);
        } else {
            alert("Hatalı PIN! İşletme sahibi onayı gereklidir.");
        }
    };

    const addMethod = (type: PaymentMethod['method'], predefinedAmount?: number) => {
        const amountToAdd = predefinedAmount !== undefined ? predefinedAmount : Math.max(0, remaining);
        if (amountToAdd <= 0) return;
        
        const defaultTool = paymentDefinitions.find((d: PaymentDefinition) => d.type === (type === 'kredi-karti' ? 'Bank' : 'Cash'));
        
        setMethods([...methods, { 
            method: type, 
            amount: amountToAdd, 
            currency: 'TRY', 
            rate: 1, 
            isDeposit: false,
            toolId: defaultTool?.id 
        }]);
    };

    const updateMethod = (index: number, field: keyof Omit<PaymentMethod, 'id'>, value: any) => {
        const newMethods = [...methods];
        (newMethods[index] as any)[field] = value;
        setMethods(newMethods);
    };

    const removeMethod = (index: number) => {
        setMethods(methods.filter((_, i) => i !== index));
    };

    const addProduct = (id: string) => {
        const p = inventory.find((x: Product) => x.id === id);
        if (!p) return;
        const existing = soldProducts.find((x: any) => x.productId === id);
        if (existing) {
            setSoldProducts(soldProducts.map((x: any) => x.productId === id ? { ...x, quantity: x.quantity + 1 } : x));
        } else {
            setSoldProducts([...soldProducts, { productId: p.id, name: p.name, price: p.price, quantity: 1 }]);
        }
    };

    const removeProduct = (id: string) => {
        setSoldProducts(soldProducts.filter(x => x.productId !== id));
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 text-sans">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-premium p-12 flex flex-col items-center justify-center max-w-md w-full text-center shadow-2xl">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
                        <CheckCircle2 className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase italic tracking-tighter">Ödeme Alındı!</h2>
                    <p className="text-gray-500 font-semibold mb-8">Tahsilat ve seans kullanımı başarıyla kaydedildi.</p>
                    <button onClick={onClose} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm transition uppercase tracking-widest shadow-xl shadow-indigo-100">Kapat</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xl z-[900] flex items-center justify-center p-4 md:p-6 font-sans">
            <motion.div 
                initial={{ y: 100, opacity: 0, scale: 0.95 }} 
                animate={{ y: 0, opacity: 1, scale: 1 }} 
                exit={{ y: 100, opacity: 0, scale: 0.95 }}
                className="modal-premium w-full max-w-7xl h-[95vh] flex flex-col shadow-[0_150px_200px_-50px_rgba(0,0,0,0.4)]"
            >
                
                {/* PIN Modal Overlay */}
                <AnimatePresence>
                    {isPinModalOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-xl z-[1100] flex items-center justify-center p-6">
                            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl">
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <Sparkles size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">Yönetici Onayı</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Hediye işlem için 4 haneli PIN kodunu girin.</p>
                                <input 
                                    type="password" 
                                    maxLength={4}
                                    value={pin}
                                    onChange={e => setPin(e.target.value)}
                                    placeholder="••••"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-5 text-center text-3xl font-black tracking-[1em] outline-none focus:ring-4 focus:ring-indigo-500/10 mb-8"
                                    autoFocus
                                />
                                <div className="flex gap-4">
                                    <button onClick={() => setIsPinModalOpen(false)} className="flex-1 py-4 text-xs font-black text-gray-400 uppercase tracking-widest">Vazgeç</button>
                                    <button onClick={confirmPin} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-100">Onayla</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                <div className="p-8 border-b border-indigo-100/50 flex justify-between items-center bg-white/40 backdrop-blur-md sticky top-0 z-20">
                    <div className="flex items-center gap-8">
                        <motion.div 
                            whileHover={{ scale: 1.05, rotate: 5 }}
                            className="w-20 h-20 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] flex items-center justify-center text-white font-black text-3xl shadow-[0_20px_40px_rgba(79,70,229,0.3)]"
                        >
                            {customer?.name.charAt(0)}
                        </motion.div>
                        <div>
                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.4em] mb-1 block">YENİ TAHSİLAT</span>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic leading-none">{customer?.name}</h2>
                            <div className="flex gap-4 mt-2.5 text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                <span className="flex items-center gap-1.5"><Calendar size={12} /> {new Date().toLocaleDateString('tr-TR')}</span>
                                <span className={`px-4 py-1.5 rounded-full italic ${customer?.segment === 'VIP' ? 'bg-amber-100 text-amber-600 border border-amber-200' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>{customer?.segment} SEGMENT</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-14 h-14 flex items-center justify-center hover:bg-rose-50 rounded-2xl transition-all border border-slate-100 group">
                        <X className="w-6 h-6 text-slate-300 group-hover:text-rose-500 transition-colors" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Panel */}
                    <div className="flex-1 p-6 overflow-y-auto no-scrollbar space-y-6 border-r border-gray-50 bg-gray-50/20">
                        
                        {/* 0. Paket Kullanımı */}
                        {applicablePackages.length > 0 && (
                            <div className="space-y-4 bg-emerald-50/30 p-6 rounded-[2rem] border border-emerald-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
                                <div className="relative">
                                    <h3 className="text-[10px] font-black text-emerald-600 uppercase tracking-widest flex items-center gap-2 mb-6">
                                        <PackageIcon className="w-4 h-4" /> AKTİF PAKETLER (SEANSLAR)
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {applicablePackages.map((pkg: any) => {
                                            const isMatch = isMatchingPackage(pkg);
                                            const isSelected = selectedPackageId === pkg.id;
                                            const isExpired = pkg.isExpired;

                                            return (
                                                <button 
                                                    key={pkg.id}
                                                    disabled={isExpired && !isSelected} // Prevent regular selection if expired unless manager override
                                                    onClick={() => {
                                                        if (isExpired && !isSelected) {
                                                            if (confirm('Bu paketin süresi dolmuş. Yine de kullandırmak istiyor musunuz? (Bu işlem işletme politikasına bağlıdır)')) {
                                                                setSelectedPackageId(pkg.id);
                                                            }
                                                        } else {
                                                            setSelectedPackageId(isSelected ? null : pkg.id);
                                                        }
                                                    }}
                                                    className={`flex items-center justify-between p-4 rounded-[1.5rem] border-2 transition-all ${isSelected ? 'bg-emerald-600 border-emerald-600 shadow-lg shadow-emerald-200' : isExpired ? 'bg-red-50 border-red-100' : 'bg-white border-white hover:border-emerald-200'}`}
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isSelected ? 'bg-white/20 text-white' : isExpired ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                                                            {isExpired ? <AlertCircle size={18} /> : <Zap size={18} />}
                                                        </div>
                                                        <div className="text-left">
                                                            <div className="flex items-center gap-1.5 mb-0.5">
                                                                <p className={`font-black uppercase text-[10px] italic ${isSelected ? 'text-white' : isExpired ? 'text-red-900' : 'text-emerald-900'}`}>{pkg.name}</p>
                                                            </div>
                                                            <p className={`text-[8px] font-bold uppercase tracking-widest ${isSelected ? 'text-emerald-100' : isExpired ? 'text-red-400' : 'text-emerald-400'}`}>
                                                                {pkg.totalSessions - (pkg.usedSessions || 0)} SEANS {isExpired ? 'KALDI (SÜRESİ DOLDU)' : 'KALDI'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    {isSelected && <CheckCircle2 className="text-white w-5 h-5" />}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* 0.5. İndirim Uygula (Üstte) */}
                        <div className={`p-4 rounded-[1.5rem] border transition-all relative overflow-hidden group animate-[fadeIn_0.4s_ease] ${needsAuthForDiscount ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                            <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform ${needsAuthForDiscount ? 'bg-amber-100/50' : 'bg-purple-50'}`} />
                            <div className="relative">
                                <div className="flex justify-between items-start mb-2">
                                    <p className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-2 ${needsAuthForDiscount ? 'text-amber-600' : 'text-purple-600'}`}>
                                        <Percent className="w-3 h-3" /> İndirim Uygula
                                    </p>
                                    <p className="text-[9px] font-black text-gray-400 italic">Limit: %{staffMaxDiscount}</p>
                                </div>
                                <div className="flex gap-3 items-center">
                                    <div className="flex gap-1 p-1 bg-gray-50 rounded-lg">
                                        {(['fixed', 'percentage'] as const).map(m => (
                                            <button 
                                                key={m} 
                                                onClick={() => setDiscountMode(m)}
                                                className={`px-3 py-1.5 rounded-md text-[8px] font-black uppercase transition-all ${discountMode === m ? (needsAuthForDiscount ? 'bg-amber-600 text-white' : 'bg-purple-600 text-white') : 'text-gray-400 hover:bg-white'}`}
                                            >
                                                {m === 'fixed' ? 'TL' : '%'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative flex-1">
                                        <input 
                                            type="number"
                                            value={discountValue || ''}
                                            onChange={e => {
                                                setDiscountValue(Number(e.target.value));
                                                setIsAuthorized(false); 
                                            }}
                                            placeholder={discountMode === 'fixed' ? 'Tutar' : 'Oran'}
                                            className={`w-full bg-gray-50 border-2 rounded-lg px-3 py-1.5 text-xs font-black outline-none transition-all placeholder:text-gray-300 ${needsAuthForDiscount ? 'border-amber-400 text-amber-600 focus:bg-white' : 'border-transparent focus:border-purple-600 text-purple-600'}`}
                                        />
                                    </div>
                                    {needsAuthForDiscount && (
                                        <button 
                                            onClick={() => {
                                                setAuthReason('excessive-discount');
                                                setIsPinModalOpen(true);
                                            }}
                                            className="px-4 py-2 bg-amber-600 text-white rounded-lg font-black text-[8px] uppercase tracking-widest shadow-lg shadow-amber-100 animate-pulse"
                                        >
                                            PIN
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 1. Ödeme Kanalları */}
                        <div className="space-y-6 bg-white p-6 rounded-[2rem] border border-indigo-50 shadow-sm relative overflow-hidden group">
                             <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
                             <div className="relative">
                                 <div className="flex justify-between items-center mb-6">
                                    <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                        <Banknote className="w-4 h-4" /> Ödeme Kanalları
                                    </h3>
                                    {remaining > 0 && (
                                        <div className="flex gap-3 p-1.5 bg-gray-100/50 rounded-2xl">
                                            <button onClick={() => addMethod('nakit', remaining)} className="px-5 py-2.5 rounded-xl bg-white shadow-sm text-[10px] font-black text-gray-900 hover:text-indigo-600 transition-all uppercase tracking-widest">Tümü Nakit</button>
                                            <button onClick={() => addMethod('kredi-karti', remaining)} className="px-5 py-2.5 rounded-xl bg-white shadow-sm text-[10px] font-black text-gray-900 hover:text-indigo-600 transition-all uppercase tracking-widest">Tümü Kart</button>
                                        </div>
                                    )}
                                 </div>
                                 
                                 <div className="grid grid-cols-1 gap-4">
                                    {methods.map((m, idx) => (
                                        <div key={idx} className="flex gap-4 items-center animate-[fadeIn_0.3s_ease]">
                                            <div className="flex-1 tactile-card p-6 border-indigo-100/50 flex flex-col gap-4 group focus-within:border-indigo-600 focus-within:glow-indigo transition-all">
                                                <div className="flex justify-between items-center w-full">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">
                                                            {m.method === 'kredi-karti' ? <CreditCard size={24} /> : m.method === 'havale' ? <Landmark size={24} /> : <Banknote size={24} />}
                                                        </div>
                                                        <div>
                                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 block mb-0.5">
                                                                {m.method === 'kredi-karti' ? 'KREDİ KARTI' : m.method === 'havale' ? 'BANKA TRANSFERİ' : 'NAKİT ÖDEME'}
                                                            </span>
                                                            <span className="text-[8px] font-bold text-emerald-500 uppercase">Aktif Kanal</span>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <span className="text-slate-300 font-black text-xl leading-none">₺</span>
                                                        <input 
                                                            type="number" value={m.amount || ''} 
                                                            onChange={e => updateMethod(idx, 'amount', Number(e.target.value))}
                                                            className="bg-transparent text-right font-black text-4xl italic tracking-tighter text-slate-900 w-36 outline-none"
                                                            autoFocus={idx > 0}
                                                        />
                                                    </div>
                                                </div>

                                                {(m.method === 'kredi-karti' || m.method === 'havale') && (
                                                    <div className="pt-3 border-t border-dashed border-gray-200 flex items-center gap-3">
                                                        <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest min-w-max">POS/BANKA:</p>
                                                        <div className="flex-1 flex gap-2 overflow-x-auto no-scrollbar pb-1">
                                                            {bankAccounts.map((bank: BankAccount) => (
                                                                <button 
                                                                    key={bank.id}
                                                                    onClick={() => updateMethod(idx, 'toolId', bank.id)}
                                                                    className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase transition-all border shrink-0 ${m.toolId === bank.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                                                                >
                                                                    {bank.bankName}
                                                                </button>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            <button onClick={() => removeMethod(idx)} className="p-4 bg-red-50 text-red-400 rounded-[1.5rem] hover:bg-red-500 hover:text-white transition-all h-full"><Trash2 size={20} /></button>
                                        </div>
                                    ))}

                                    {remaining > 0 && (
                                         <div className="mt-8 pt-8 border-t border-dashed border-gray-100 animate-[fadeIn_0.5s_ease]">
                                             <div className="flex justify-between items-center mb-6">
                                                 <div className="flex items-center gap-3">
                                                     <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-red-600"><AlertCircle size={20} /></div>
                                                     <div>
                                                         <p className="text-[10px] font-black text-red-600 uppercase tracking-widest">KALAN TUTAR (AÇIK HESAP)</p>
                                                         <p className="text-2xl font-black text-red-900 italic tracking-tight">₺{remaining.toLocaleString('tr-TR')}</p>
                                                     </div>
                                                 </div>
                                                 <div className="text-right">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Ödeme Sözü / Vade</p>
                                                    <select 
                                                        value={installments}
                                                        onChange={e => setInstallments(Number(e.target.value))}
                                                        className="bg-gray-50 border-none rounded-xl px-3 py-2 text-[10px] font-black text-gray-900 outline-none"
                                                    >
                                                        <option value={1}>TEK ÖDEME (VADE)</option>
                                                        <option value={2}>2 TAKSİT</option>
                                                        <option value={3}>3 TAKSİT</option>
                                                        <option value={6}>6 TAKSİT</option>
                                                    </select>
                                                 </div>
                                             </div>
                                             
                                             <div className="grid grid-cols-2 gap-4">
                                                <button 
                                                    onClick={() => addMethod('nakit', remaining)}
                                                    className="py-4 bg-gray-900 text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all shadow-xl shadow-gray-200"
                                                >
                                                    TAMAMINI TAHSİL ET
                                                </button>
                                                <div 
                                                    className="py-4 bg-indigo-50 border-2 border-indigo-200 text-indigo-600 rounded-[2rem] font-black text-[10px] uppercase tracking-widest text-center flex items-center justify-center gap-2"
                                                >
                                                    <CheckCircle2 size={14} /> AÇIK HESEBA EKLENECEK
                                                </div>
                                             </div>
                                             <p className="mt-4 text-[9px] font-bold text-gray-400 text-center uppercase tracking-widest italic animate-pulse">Kalan tutar müşterinin açık hesabına (veresiye) borç olarak işlenecektir.</p>
                                         </div>
                                     )}

                                    {remaining > 0 && methods.length === 0 && (
                                        <div className="grid grid-cols-3 gap-4">
                                            {['nakit', 'kredi-karti', 'havale'].map((m: any) => (
                                                <button key={m} onClick={() => addMethod(m)} className="p-10 bg-gray-50/50 hover:bg-white border-2 border-dashed border-gray-200 hover:border-indigo-600 rounded-[3rem] transition-all flex flex-col items-center gap-4 group">
                                                    <Plus className="w-8 h-8 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                                                    <span className="text-[10px] font-black text-gray-400 group-hover:text-indigo-600 uppercase tracking-widest">{m.replace('-', ' ')} Ekle</span>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                 </div>
                             </div>
                        </div>

                        {/* 2. Tahsilat Kalemleri */}
                        <div className="space-y-4">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <PackageIcon className="w-4 h-4 text-indigo-600" /> Tahsilat ve İkram Kalemleri
                            </h3>
                            
                            <div className={`p-6 rounded-[2rem] border transition-all duration-500 flex flex-col gap-4 ${isServiceGift ? 'bg-indigo-50/50 border-indigo-100 opacity-80 shadow-inner' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className="flex justify-between items-center w-full">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${isServiceGift ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400'}`}><Calendar size={20} /></div>
                                        <div>
                                            <p className="font-black text-gray-900 text-lg uppercase tracking-tight">{overrideService}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">Hizmet Bedeli</p>
                                                {isServiceGift && <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[7px] font-black rounded uppercase">İkram</span>}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-6">
                                        <div className="text-right">
                                            {isServiceGift && <p className="text-[9px] font-black text-gray-300 line-through">₺{overridePrice}</p>}
                                            <p className={`font-black text-xl italic tracking-tighter ${isServiceGift ? 'text-indigo-600' : 'text-gray-900'}`}>₺{servicePrice.toLocaleString('tr-TR')}</p>
                                        </div>
                                        <div className="flex gap-1.5">
                                            <button 
                                                onClick={() => setIsServiceEditorOpen(!isServiceEditorOpen)}
                                                className={`p-3 rounded-xl transition-all ${isServiceEditorOpen ? 'bg-indigo-100 text-indigo-600' : 'bg-gray-50 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50'}`}
                                            >
                                                <Zap size={18} />
                                            </button>
                                            <button onClick={() => handleGiftToggle('service')} className={`p-3 rounded-xl transition-all ${isServiceGift ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                                <HeartHandshake size={18} />
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {isServiceEditorOpen && (
                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="pt-6 border-t border-dashed border-gray-100 space-y-4 overflow-hidden">
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hizmet Değiştir</label>
                                                <select 
                                                    value={overrideService}
                                                    onChange={e => {
                                                        const s = services.find((x: any) => x.name === e.target.value);
                                                        setOverrideService(e.target.value);
                                                        if (s) setOverridePrice(s.price);
                                                    }}
                                                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                >
                                                    {services.map((s: any) => <option key={s.id} value={s.name}>{s.name}</option>)}
                                                </select>
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Manuel Fiyat (₺)</label>
                                                <input 
                                                    type="number"
                                                    value={overridePrice}
                                                    onChange={e => setOverridePrice(Number(e.target.value))}
                                                    className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-xs font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/10"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {soldProducts.map(p => {
                                const isGift = giftedItems.has(p.productId);
                                return (
                                    <div key={p.productId} className={`p-4 rounded-[1.5rem] border transition-all duration-500 flex justify-between items-center ${isGift ? 'bg-indigo-50/50 border-indigo-100 opacity-80' : 'bg-white border-gray-100 shadow-sm'}`}>
                                        <div className="flex items-center gap-4">
                                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isGift ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400'}`}><ShoppingBag size={18} /></div>
                                            <div>
                                                <p className="font-black text-gray-900 text-sm uppercase tracking-tight">{p.name}</p>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest">{p.quantity} Adet x ₺{p.price}</p>
                                                    {isGift && <span className="px-1.5 py-0.5 bg-indigo-600 text-white text-[7px] font-black rounded uppercase">İkram</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right">
                                                {isGift && <p className="text-[8px] font-black text-gray-300 line-through">₺{p.price * p.quantity}</p>}
                                                <p className={`font-black text-lg italic tracking-tighter ${isGift ? 'text-indigo-600' : 'text-gray-900'}`}>₺{(isGift ? 0 : p.price * p.quantity).toLocaleString('tr-TR')}</p>
                                            </div>
                                            <div className="flex gap-1.5">
                                                <button onClick={() => handleGiftToggle('product', p.productId)} className={`p-2.5 rounded-xl transition-all ${isGift ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                                    <HeartHandshake size={16} />
                                                </button>
                                                <button onClick={() => removeProduct(p.productId)} className="p-2.5 bg-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 3. Önerilen Ürünler */}
                        <div className="pt-6 border-t border-dashed border-gray-100">
                             <div className="flex justify-between items-center mb-4">
                                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                     <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> ÖNERİLEN ÜRÜNLER
                                 </h3>
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                {inventory.slice(0, 4).map((p: Product) => (
                                    <button 
                                        key={p.id} 
                                        onClick={() => addProduct(p.id)}
                                        className="p-4 bg-white border border-indigo-50 rounded-[2.2rem] hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-100/50 transition-all text-center group relative overflow-hidden"
                                    >
                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mx-auto mb-2 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-110">
                                            <ShoppingBag size={18} />
                                        </div>
                                        <p className="text-[9px] font-black text-gray-900 uppercase truncate mb-0.5">{p.name}</p>
                                        <p className="text-[10px] font-black text-indigo-600 italic">₺{p.price}</p>
                                    </button>
                                ))}
                             </div>
                        </div>


                        {/* 5. Sadakat Puanı (Sayfa Sonu) */}
                        <div className="bg-white p-6 rounded-[2.5rem] border border-indigo-50 shadow-sm flex items-center justify-between group transition-all hover:border-indigo-200">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 shadow-inner group-hover:scale-110 transition-transform"><Sparkles size={24} /></div>
                                <div>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-0.5">SADAKAT PUANLARI</p>
                                    <p className="text-2xl font-black text-gray-900 tracking-tighter italic leading-none">{customer?.loyaltyPoints || 0} <span className="text-[10px] text-gray-400 not-italic ml-1 uppercase">PUAN</span></p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                               {pointsUsed > 0 && (
                                   <button 
                                       onClick={() => setPointsUsed(0)}
                                       className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all shadow-sm"
                                       title="Puanı Sıfırla"
                                   >
                                       <Trash2 size={16} />
                                   </button>
                               )}
                               <button 
                                   onClick={() => {
                                       const obtainable = Math.min(customer?.loyaltyPoints || 0, Math.floor(remaining + pointsUsed));
                                       if (pointsUsed > 0) {
                                           setPointsUsed(0);
                                       } else if(obtainable > 0) {
                                           setPointsUsed(obtainable);
                                       }
                                   }}
                                   disabled={!customer?.loyaltyPoints || (remaining <= 0 && pointsUsed === 0)}
                                   className={`px-6 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg ${pointsUsed > 0 ? 'bg-amber-400 text-indigo-950 shadow-amber-200' : 'bg-indigo-600 text-white shadow-indigo-100 disabled:opacity-30'}`}
                               >
                                   {pointsUsed > 0 ? 'PUAN İPTAL' : 'PUAN KULLAN'}
                               </button>
                            </div>
                        </div>

                        {/* 6. Memnuniyet Bahşişi */}
                        <div className="bg-[#0D0D2B] p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group border border-white/5 animate-[fadeIn_0.6s_ease]">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
                            <div className="relative flex flex-col md:flex-row items-center justify-between gap-10">
                                <div className="flex items-center gap-6 self-start md:self-center">
                                    <div className="w-20 h-20 bg-white/5 rounded-[2rem] flex items-center justify-center text-white backdrop-blur-md border border-white/10 shadow-inner group-hover:scale-105 transition-transform duration-500">
                                        <Sparkles size={40} className="text-amber-400 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-white italic tracking-tighter uppercase mb-1">Memnuniyet Bahşişi</h3>
                                        <p className="text-[10px] font-black text-indigo-300/60 uppercase tracking-[0.2em]">Doğrudan uzmana iletilecek 🎁</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-5 w-full md:w-auto">
                                    <div className="flex flex-wrap md:flex-nowrap gap-3 justify-center md:justify-end w-full">
                                        {[100, 250, 500].map(amt => (
                                            <button 
                                                key={amt} 
                                                onClick={() => setTip(amt)}
                                                className={`px-8 py-4 rounded-[1.5rem] text-xs font-black border-2 transition-all active:scale-95 flex-1 md:flex-none ${tip === amt ? 'bg-amber-400 border-amber-400 text-indigo-950 shadow-[0_10px_30px_rgba(251,191,36,0.3)]' : 'bg-white/5 border-white/10 text-white hover:bg-white/10 hover:border-white/20'}`}
                                            >
                                                ₺{amt}
                                            </button>
                                        ))}
                                        <div className="relative flex-1 md:flex-none">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 font-black text-xs">₺</div>
                                            <input 
                                                type="number"
                                                value={tip || ''}
                                                onChange={e => setTip(Number(e.target.value))}
                                                placeholder="Özel"
                                                className={`w-full md:w-32 bg-white/5 border-2 rounded-[1.5rem] pl-8 pr-4 py-4 text-xs font-black text-white outline-none transition-all placeholder:text-white/20 ${[100,250,500].includes(tip) ? 'border-white/10' : tip > 0 ? 'border-amber-400 shadow-[0_10px_30px_rgba(251,191,36,0.3)]' : 'border-white/10 focus:border-white/30'}`}
                                            />
                                        </div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </div>

                    {/* Right Panel - Premium Receipt */}
                    <div className="w-full lg:w-[480px] receipt-gradient flex flex-col border-l border-indigo-100/50 p-10 relative">
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="text-center mb-12">
                                <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 4, repeat: Infinity }} className="mx-auto w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-200 mb-6">
                                    <Sparkles size={24} />
                                </motion.div>
                                <h2 className="text-5xl font-black text-slate-900 tracking-tighter italic uppercase mb-1 leading-none">AURA ERP</h2>
                                <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.5em] mt-2">Empire Command Billing</p>
                            </div>

                            <div className="bg-white rounded-[3.5rem] shadow-2xl shadow-indigo-200/40 border border-indigo-50/50 p-12 space-y-10 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/20 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-700" />
                                
                                <div className="space-y-2">
                                    <div className="flex justify-between font-black text-slate-400 text-[9px] uppercase tracking-[0.3em]"><span>Hizmet / Ürün</span><span>Birim Fiyat</span></div>
                                    <div className="h-px bg-slate-100 w-full" />
                                </div>
                                
                                <div className="space-y-4">
                                    {/* Seller Selection */}
                                    <div className="flex flex-col gap-2 p-4 bg-gray-50 rounded-[1.5rem] border border-gray-100">
                                        <label className="text-[8px] font-black text-gray-400 uppercase tracking-widest ml-1">Satışı Yapan Personel</label>
                                        <select 
                                            value={sellerId}
                                            onChange={(e) => setSellerId(e.target.value)}
                                            className="bg-white border-none rounded-xl px-4 py-2 text-xs font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/10 appearance-none"
                                        >
                                            <option value="">Seçiniz...</option>
                                            {allStaff.map((s: any) => (
                                                <option key={s.id} value={s.id}>{s.name} {s.isVisibleOnCalendar ? '(Terapist)' : '(Satış/Hizmet)'}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="flex justify-between items-center group">
                                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{overrideService}</span>
                                        <span className={`text-xl font-black italic tracking-tighter ${isServiceGifted || isPackageUsed ? 'text-indigo-600' : 'text-gray-900'}`}>{isServiceGifted || isPackageUsed ? '₺0' : `₺${overridePrice}`}</span>
                                    </div>
                                    {soldProducts.map(p => (
                                        <div key={p.productId} className="flex justify-between items-center">
                                            <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{p.name}</span>
                                            <span className={`text-lg font-black italic tracking-tighter ${giftedItems.has(p.productId) ? 'text-indigo-600' : 'text-gray-900'}`}>{giftedItems.has(p.productId) ? '₺0' : `₺${p.price * p.quantity}`}</span>
                                        </div>
                                    ))}
                                    {pointsUsed > 0 && (
                                        <div className="flex justify-between items-center py-2 px-4 bg-indigo-50 rounded-2xl border border-indigo-100/50">
                                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2"><Zap size={14} /> Puan İndirimi</span>
                                            <span className="text-sm font-black text-indigo-600">- ₺{pointsUsed}</span>
                                        </div>
                                    )}
                                    {tip > 0 && (
                                        <div className="flex justify-between items-center py-2 px-4 bg-amber-50 rounded-2xl border border-amber-100/50">
                                            <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2"><Sparkles size={14} /> Memnuniyet Bahşişi</span>
                                            <span className="text-sm font-black text-amber-600">+ ₺{tip}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="pt-8 border-t border-dashed border-gray-100 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">TOPLAM DEĞER</span>
                                        <span className="text-sm font-black text-gray-400 line-through">₺{totalOriginalPrice.toLocaleString('tr-TR')}</span>
                                    </div>
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">ÖDENECEK TUTAR</span>
                                        <span className="text-5xl font-black text-gray-900 tracking-tighter italic leading-none">₺{grandTotal.toLocaleString('tr-TR')}</span>
                                    </div>
                                </div>

                                {remaining > 0 ? (
                                    <div className="space-y-4 pt-4">
                                        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[10px] font-black text-red-900 uppercase tracking-widest flex items-center gap-2">
                                                    <AlertCircle size={14} /> KALAN BAKİYE: ₺{remaining}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-2 mt-4">
                                                <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Taksit:</span>
                                                {[1, 2, 3, 6].map(n => (
                                                    <button 
                                                        key={n} 
                                                        onClick={() => setInstallments(n)}
                                                        className={`flex-1 py-2 rounded-xl text-[10px] font-black transition-all ${installments === n ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-400 border border-gray-100'}`}
                                                    >
                                                        {n} T.
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="px-2 space-y-3">
                                            {installmentDates.map((date, idx) => (
                                                <div key={idx} className="bg-gray-50 p-4 rounded-2xl border border-gray-100 space-y-2">
                                                    <div className="flex justify-between items-center text-[10px] font-black text-gray-900 uppercase tracking-widest">
                                                        <span>{idx + 1}. Taksit Vadesi:</span>
                                                    </div>
                                                    <input 
                                                        type="date"
                                                        value={date}
                                                        onChange={(e) => {
                                                            const newDates = [...installmentDates];
                                                            newDates[idx] = e.target.value;
                                                            setInstallmentDates(newDates);
                                                        }}
                                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2 text-[11px] font-black text-gray-900 outline-none focus:border-indigo-600 transition-all"
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-emerald-600 p-6 rounded-[2rem] flex flex-col items-center justify-center gap-2 shadow-xl shadow-emerald-100 animate-[fadeIn_0.5s_ease]">
                                        <div className="flex items-center gap-3">
                                            <CheckCircle2 size={24} className="text-white" />
                                            <span className="text-sm font-black text-white uppercase tracking-widest italic">Tahsilat Hazır</span>
                                        </div>
                                        <div className="h-px w-full bg-white/20 my-2" />
                                        <div className="flex items-center gap-2 text-white/80">
                                            <Sparkles size={14} />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">{earnedPoints} Sadakat Puanı Kazanıldı</span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-10">
                            <button 
                                onClick={() => {
                                    if (needsAuthForDiscount) {
                                        setAuthReason('excessive-discount');
                                        setIsPinModalOpen(true);
                                    } else {
                                        handleProcess();
                                    }
                                }}
                                className={`w-full py-8 rounded-[2.5rem] font-black text-sm shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em] ${needsAuthForDiscount ? 'bg-amber-600 text-white shadow-amber-200 animate-pulse' : 'bg-indigo-600 text-white shadow-indigo-200'}`}
                            >
                                {needsAuthForDiscount ? <Sparkles size={24} /> : <CheckCircle2 size={24} />}
                                {needsAuthForDiscount ? 'Yönetici Onayı Bekleniyor' : 'TAHSİLATI TAMAMLA'}
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
