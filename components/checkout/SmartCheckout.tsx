"use client";

import { useState, useEffect } from "react";
import { useStore, Appointment, PaymentMethod } from "@/lib/store";
import { 
    X, Plus, CreditCard, Banknote, Landmark,
    Trash2, Save, AlertCircle, Calendar,
    Zap, Crown, Package, Sparkles, Printer, CheckCircle2, HeartHandshake, Percent, ShoppingBag
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SmartCheckoutProps {
    appointment: Appointment;
    onClose: () => void;
}

export default function SmartCheckout({ appointment, onClose }: SmartCheckoutProps) {
    const { 
        customers, customerMemberships, membershipPlans, 
        processCheckout, inventory, getUpsellSuggestions, 
        paymentDefinitions, getTodayDate, currentBusiness 
    } = useStore();
    const customer = customers.find(c => c.id === appointment.customerId);
    const activeMembership = customerMemberships.find(m => m.customerId === appointment.customerId && m.status === 'active' && m.remainingSessions > 0);
    const membershipPlan = activeMembership ? membershipPlans.find(p => p.id === activeMembership.planId) : null;
    
    // UI State
    const [methods, setMethods] = useState<Omit<PaymentMethod, 'id'>[]>([]);
    const [soldProducts, setSoldProducts] = useState<{ productId: string, name: string, price: number, quantity: number }[]>([]);
    const [note, setNote] = useState("");
    const [dueDate, setDueDate] = useState<string>(() => {
        const date = new Date();
        date.setDate(date.getDate() + 30);
        return date.toISOString().split('T')[0];
    });

    // New phase 2 features
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
    
    // New Smart Features
    const [installments, setInstallments] = useState<number>(1);
    const [installmentDates, setInstallmentDates] = useState<string[]>([]);

    // Auto-update installment dates when count changes
    useEffect(() => {
        const dates = [];
        for (let i = 0; i < installments; i++) {
            const d = new Date();
            d.setMonth(d.getMonth() + i + 1);
            dates.push(d.toISOString().split('T')[0]);
        }
        setInstallmentDates(dates);
    }, [installments]);
    const [isServiceGift, setIsServiceGift] = useState(false);

    // Auto-add deposit if exists
    useEffect(() => {
        if (appointment.depositPaid > 0) {
            setMethods([{ method: 'nakit', amount: appointment.depositPaid, currency: 'TRY', rate: 1, isDeposit: true }]);
        }
    }, [appointment.depositPaid]);

    const isServiceGifted = isServiceGift;
    const servicePrice = isServiceGifted ? 0 : appointment.price;
    const productsPrice = soldProducts.reduce((s, p) => s + (giftedItems.has(p.productId) ? 0 : p.price * p.quantity), 0);
    const totalOriginalPrice = appointment.price + soldProducts.reduce((s, p) => s + (p.price * p.quantity), 0);
    
    const subTotal = servicePrice + productsPrice;
    
    // Calculate discounts
    const discountAmount = discountMode === 'fixed' ? discountValue : discountMode === 'percentage' ? (subTotal * discountValue / 100) : 0;
    
    // Grand Total is Subtotal - Discount + Tip
    const grandTotal = Math.max(0, subTotal - discountAmount) + tip;
    
    const totalPaid = methods.reduce((sum, m) => sum + (m.amount * m.rate), 0);
    const totalWithPoints = totalPaid + pointsUsed;
    const remaining = grandTotal - totalWithPoints;
    
    const earnedPoints = Math.floor(totalPaid / 10);

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

    // Calculate effective percentage for security
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
        
        const defaultTool = paymentDefinitions.find(d => d.type === (type === 'kredi-karti' ? 'Bank' : 'Cash'));
        
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
        const p = inventory.find(x => x.id === id);
        if (!p) return;
        const existing = soldProducts.find(x => x.productId === id);
        if (existing) {
            setSoldProducts(soldProducts.map(x => x.productId === id ? { ...x, quantity: x.quantity + 1 } : x));
        } else {
            setSoldProducts([...soldProducts, { productId: p.id, name: p.name, price: p.price, quantity: 1 }]);
        }
    };

    const removeProduct = (id: string) => {
        setSoldProducts(soldProducts.filter(x => x.productId !== id));
    };

    const handleProcess = async () => {
        if (isSaving) return;
        setIsSaving(true);

        const installmentList = remaining > 0 ? installmentDates.map((date, idx) => ({
            amount: Math.floor(remaining / installments) + (idx === 0 ? remaining % installments : 0),
            dueDate: date
        })) : undefined;

        const ok = await processCheckout(
            {
                appointmentId: appointment.id,
                branchId: appointment.branchId,
                customerId: appointment.customerId,
                customerName: appointment.customerName,
                service: appointment.service,
                methods: methods.map(m => ({ ...m, id: crypto.randomUUID() })),
                paymentDefinitionId: methods[0]?.toolId,
                totalAmount: totalPaid,
                date: getTodayDate(),
                isGift: isServiceGift || giftedItems.size > 0,
                originalPrice: totalOriginalPrice,
                finalPrice: subTotal - discountAmount,
                discountAmount: discountAmount,
                discountNote: discountMode !== 'none' ? `${discountMode === 'percentage' ? '%' : '₺'}${discountValue} indirim` : '',
                note: note,
                status: remaining <= 0 ? 'paid' : 'partial'
            },
            installmentList,
            soldProducts.map(p => ({ 
                productId: p.productId, 
                name: p.name,
                price: p.price,
                quantity: p.quantity,
                isGift: giftedItems.has(p.productId)
            })),
            earnedPoints,
            tip,
            pointsUsed
        );
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[1000] flex items-center justify-center p-6 text-sans">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-premium p-12 flex flex-col items-center justify-center max-w-md w-full text-center shadow-2xl">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
                        <CheckCircle2 className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase italic tracking-tighter">Ödeme Alındı!</h2>
                    <p className="text-gray-500 font-semibold mb-8">Tahsilat ve ikramlar başarıyla sisteme kaydedildi.</p>
                    <button onClick={onClose} className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-black text-sm transition uppercase tracking-widest shadow-xl shadow-indigo-100">Kapat</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[900] flex items-center justify-center p-4 md:p-6 font-sans">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-premium w-full max-w-7xl h-[95vh] md:h-[90vh] flex flex-col overflow-hidden">
                
                {/* PIN Modal Overlay */}
                <AnimatePresence>
                    {isPinModalOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-xl z-[1100] flex items-center justify-center p-6">
                            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl">
                                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-[1.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                                    <Sparkles size={40} />
                                </div>
                                <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">Yönetici Onayı</h3>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-8">Hediye işlemi için 4 haneli PIN kodunu girin.</p>
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

                <div className="p-8 border-b border-indigo-50 flex justify-between items-center bg-white/80 backdrop-blur-sm">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-xl">
                            {customer?.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">{customer?.name}</h2>
                            <div className="flex gap-4 mt-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <span>{customer?.phone}</span>
                                <span className={`px-3 py-1 rounded-full italic ${customer?.segment === 'VIP' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>{customer?.segment} SEGMENT</span>
                            </div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-white rounded-[1.2rem] transition border border-gray-100 group bg-gray-50/50">
                        <X className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" />
                    </button>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Panel */}
                    <div className="flex-1 p-10 overflow-y-auto no-scrollbar space-y-10 border-r border-gray-50 bg-gray-50/20">
                        
                        {/* 1. Ödeme Kanalları (TOP) */}
                        <div className="space-y-8 bg-white p-10 rounded-[3rem] border border-indigo-50 shadow-sm relative overflow-hidden group">
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
                                        <div key={idx} className="flex gap-4 items-center">
                                            <div className="flex-1 bg-gray-50/50 p-6 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center group focus-within:border-indigo-600 transition-all">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">
                                                        {m.method === 'kredi-karti' ? <CreditCard size={24} /> : <Banknote size={24} />}
                                                    </div>
                                                    <span className="text-xs font-black uppercase tracking-widest text-gray-500 tracking-wider">
                                                        {m.method === 'kredi-karti' ? 'KREDİ KARTI' : m.method === 'havale' ? 'HAVALE' : 'NAKİT'} ÖDEME
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-gray-300 font-black text-lg">₺</span>
                                                    <input 
                                                        type="number" value={m.amount || ''} 
                                                        onChange={e => updateMethod(idx, 'amount', Number(e.target.value))}
                                                        className="bg-transparent text-right font-black text-3xl italic tracking-tighter text-gray-900 w-32 outline-none"
                                                    />
                                                </div>
                                            </div>
                                            <button onClick={() => removeMethod(idx)} className="p-6 bg-red-50 text-red-400 rounded-[2rem] hover:bg-red-500 hover:text-white transition-all"><Trash2 size={24} /></button>
                                        </div>
                                    ))}

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

                        {/* 2. Tahsilat Kalemleri (MIDDLE) */}
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Package className="w-4 h-4 text-indigo-600" /> Tahsilat ve İkram Kalemleri
                            </h3>
                            
                            <div className={`p-8 rounded-[2.5rem] border transition-all duration-500 flex justify-between items-center ${isServiceGift ? 'bg-indigo-50/50 border-indigo-100 opacity-80 shadow-inner' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className="flex items-center gap-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isServiceGift ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400'}`}><Calendar size={24} /></div>
                                    <div>
                                        <p className="font-black text-gray-900 text-xl uppercase tracking-tight">{appointment.service}</p>
                                        <div className="flex items-center gap-3 mt-1">
                                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">Hizmet Bedeli</p>
                                            {isServiceGift && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded uppercase">İkram</span>}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-8">
                                    <div className="text-right">
                                        {isServiceGift && <p className="text-[10px] font-black text-gray-300 line-through">₺{appointment.price}</p>}
                                        <p className={`font-black text-2xl italic tracking-tighter ${isServiceGift ? 'text-indigo-600' : 'text-gray-900'}`}>₺{servicePrice.toLocaleString('tr-TR')}</p>
                                    </div>
                                    <button onClick={() => handleGiftToggle('service')} className={`p-4 rounded-2xl transition-all ${isServiceGift ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                        <HeartHandshake size={20} />
                                    </button>
                                </div>
                            </div>

                            {soldProducts.map(p => {
                                const isGift = giftedItems.has(p.productId);
                                return (
                                    <div key={p.productId} className={`p-8 rounded-[2.5rem] border transition-all duration-500 flex justify-between items-center ${isGift ? 'bg-indigo-50/50 border-indigo-100 opacity-80' : 'bg-white border-gray-100 shadow-sm'}`}>
                                        <div className="flex items-center gap-6">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-colors ${isGift ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400'}`}><ShoppingBag size={24} /></div>
                                            <div>
                                                <p className="font-black text-gray-900 text-xl uppercase tracking-tight">{p.name}</p>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{p.quantity} Adet x ₺{p.price}</p>
                                                    {isGift && <span className="px-2 py-0.5 bg-indigo-600 text-white text-[8px] font-black rounded uppercase">İkram</span>}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                {isGift && <p className="text-[10px] font-black text-gray-300 line-through">₺{p.price * p.quantity}</p>}
                                                <p className={`font-black text-2xl italic tracking-tighter ${isGift ? 'text-indigo-600' : 'text-gray-900'}`}>₺{(isGift ? 0 : p.price * p.quantity).toLocaleString('tr-TR')}</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => handleGiftToggle('product', p.productId)} className={`p-4 rounded-2xl transition-all ${isGift ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-indigo-300 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                                    <HeartHandshake size={20} />
                                                </button>
                                                <button onClick={() => removeProduct(p.productId)} className="p-4 bg-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* 3. Önerilen Ürünler (MIDDLE) */}
                        <div className="pt-8 border-t border-dashed border-gray-100">
                             <div className="flex justify-between items-center mb-6">
                                 <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-2">
                                     <Sparkles className="w-4 h-4 text-amber-500 animate-pulse" /> ÖNERİLEN ÜRÜNLER
                                 </h3>
                                 <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Müşteri Segmentine Özel</p>
                             </div>
                             <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4">
                                {inventory.slice(0, 4).map(p => (
                                    <button 
                                        key={p.id} 
                                        onClick={() => addProduct(p.id)}
                                        className="p-5 bg-white border border-gray-100 rounded-[2rem] hover:border-indigo-600 hover:shadow-2xl hover:shadow-indigo-500/10 transition-all text-center group relative overflow-hidden"
                                    >
                                        <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-indigo-600 group-hover:text-white transition-all transform group-hover:scale-110">
                                            <ShoppingBag size={20} />
                                        </div>
                                        <p className="text-[10px] font-black text-gray-900 uppercase truncate mb-1">{p.name}</p>
                                        <p className="text-[11px] font-black text-indigo-600 italic tracking-tighter tabular-nums">₺{p.price}</p>
                                        <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center shadow-lg"><Plus size={14} className="text-white" /></div>
                                        </div>
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* 4. Sadakat ve İndirim (BOTTOM) */}
                        <div className="grid grid-cols-2 gap-6 pt-10 border-t border-gray-100">
                            <div className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform" />
                                <div className="relative">
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Zap className="w-3.5 h-3.5" /> Sadakat Puanı
                                    </p>
                                    <div className="flex items-end gap-3 mb-6">
                                        <p className="text-4xl font-black text-gray-900 tracking-tighter italic leading-none">{customer?.loyaltyPoints || 0}</p>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Birikmiş Puan</p>
                                    </div>
                                    <button 
                                        onClick={() => {
                                            const obtainable = Math.min(customer?.loyaltyPoints || 0, Math.floor(remaining));
                                            if(obtainable > 0) setPointsUsed(prev => prev + obtainable);
                                        }}
                                        disabled={!customer?.loyaltyPoints || remaining <= 0}
                                        className="w-full py-3 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-30"
                                    >
                                        Puan Kullan (₺1 = 1 Puan)
                                    </button>
                                </div>
                            </div>

                            <div className={`p-8 rounded-[3rem] border transition-all relative overflow-hidden group ${needsAuthForDiscount ? 'bg-amber-50 border-amber-200' : 'bg-white border-gray-100 shadow-sm'}`}>
                                <div className={`absolute top-0 right-0 w-32 h-32 rounded-full -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform ${needsAuthForDiscount ? 'bg-amber-100/50' : 'bg-purple-50'}`} />
                                <div className="relative">
                                    <div className="flex justify-between items-start mb-4">
                                        <p className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${needsAuthForDiscount ? 'text-amber-600' : 'text-purple-600'}`}>
                                            <Percent className="w-3.5 h-3.5" /> İndirim Uygula
                                        </p>
                                        <p className="text-[10px] font-black text-gray-400">Limit: %{staffMaxDiscount}</p>
                                    </div>
                                    <div className="flex gap-2 mb-4">
                                        {(['fixed', 'percentage'] as const).map(m => (
                                            <button 
                                                key={m} 
                                                onClick={() => setDiscountMode(m)}
                                                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase transition-all ${discountMode === m ? (needsAuthForDiscount ? 'bg-amber-600 text-white shadow-lg' : 'bg-purple-600 text-white shadow-lg') : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-white'}`}
                                            >
                                                {m === 'fixed' ? 'Tutar (TL)' : 'Oran (%)'}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="relative">
                                        <input 
                                            type="number"
                                            value={discountValue || ''}
                                            onChange={e => {
                                                setDiscountValue(Number(e.target.value));
                                                setIsAuthorized(false); // Reset on change
                                            }}
                                            placeholder={discountMode === 'fixed' ? '₺ Tutar Girin' : '% Oran Girin'}
                                            className={`w-full bg-gray-50 border-2 rounded-2xl px-6 py-4 text-sm font-black outline-none transition-all placeholder:text-gray-300 ${needsAuthForDiscount ? 'border-amber-400 text-amber-600 focus:bg-white' : 'border-transparent focus:border-purple-600 text-purple-600'}`}
                                        />
                                        {discountMode === 'fixed' && discountValue > 0 && (
                                            <p className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400 italic">
                                                ~ %{effectiveDiscountPercent.toFixed(1)}
                                            </p>
                                        )}
                                    </div>
                                    {needsAuthForDiscount && (
                                        <button 
                                            onClick={() => {
                                                setAuthReason('excessive-discount');
                                                setIsPinModalOpen(true);
                                            }}
                                            className="w-full mt-4 py-3 bg-amber-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-xl shadow-amber-100 animate-pulse"
                                        >
                                            Yönetici PIN Onayı Gerekli
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* 5. Memnuniyet Bahşişi (BOTTOM) */}
                        <div className="bg-indigo-950 p-10 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-br from-indigo-800 to-indigo-950 opacity-50" />
                            <div className="relative flex flex-col md:flex-row items-center justify-between gap-8">
                                <div className="flex items-center gap-6">
                                    <div className="w-16 h-16 bg-white/10 rounded-[1.8rem] flex items-center justify-center text-white backdrop-blur-md border border-white/20">
                                        <Sparkles size={32} className="text-amber-400 animate-pulse" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-white italic tracking-tighter uppercase mb-1">Memnuniyet Bahşişi</h3>
                                        <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">Doğrudan uzmana iletilecek 🎁</p>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-4">
                                    <div className="flex gap-3">
                                        {[100, 250, 500].map(amt => (
                                            <button 
                                                key={amt} 
                                                onClick={() => setTip(amt)}
                                                className={`px-6 py-3 rounded-2xl text-[11px] font-black border-2 transition-all active:scale-95 ${tip === amt ? 'bg-amber-400 border-amber-400 text-indigo-950 shadow-xl' : 'bg-white/5 border-white/10 text-white hover:bg-white/10'}`}
                                            >
                                                ₺{amt}
                                            </button>
                                        ))}
                                        <div className="relative">
                                            <input 
                                                type="number"
                                                value={tip || ''}
                                                onChange={e => setTip(Number(e.target.value))}
                                                placeholder="₺Özel"
                                                className="w-24 bg-white/5 border-2 border-white/10 rounded-2xl px-4 py-3 text-[11px] font-black text-white outline-none focus:border-amber-400 transition-all placeholder:text-white/30"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Panel - Premium Receipt */}
                    <div className="w-full lg:w-[450px] bg-[#FDFDFD] flex flex-col border-l border-gray-100 p-10 relative">
                        <div className="flex-1 overflow-y-auto no-scrollbar">
                            <div className="text-center mb-12">
                                <Sparkles className="mx-auto w-10 h-10 text-indigo-600 mb-4" />
                                <h2 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase mb-1 leading-none">AURA SPA</h2>
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.4em]">Tahsilat Fişi</p>
                            </div>

                            <div className="bg-white rounded-[3rem] shadow-2xl shadow-indigo-100/50 border border-gray-50 p-10 space-y-8 relative overflow-hidden">
                                <div className="space-y-1">
                                    <div className="flex justify-between font-black text-gray-400 text-[10px] uppercase tracking-widest"><span>Açıklama</span><span>Tutar</span></div>
                                    <div className="h-px bg-gray-50 w-full" />
                                </div>
                                
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight">{appointment.service}</span>
                                        <span className={`text-xl font-black italic tracking-tighter ${isServiceGift ? 'text-indigo-600' : 'text-gray-900'}`}>{isServiceGift ? '₺0' : `₺${appointment.price}`}</span>
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
                                                        <span className="text-indigo-600 italic">Vade Seçin</span>
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
