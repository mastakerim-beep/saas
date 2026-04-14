"use client";

import { useState, useEffect } from "react";
import { useStore, Appointment, PaymentMethod } from "@/lib/store";
import { 
    X, Plus, CreditCard, Banknote, Landmark,
    Trash2, Save, AlertCircle, Calendar,
    Zap, Crown, Package, Sparkles, Printer, CheckCircle2, HeartHandshake, Percent
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
        paymentDefinitions, getTodayDate 
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
    const [discountMode, setDiscountMode] = useState<'none'|'fixed'|'percentage'>('none');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [tip, setTip] = useState<number>(0);
    const [isSuccess, setIsSuccess] = useState(false);

    // Auto-add deposit if exists
    useEffect(() => {
        if (appointment.depositPaid > 0) {
            setMethods([{ method: 'nakit', amount: appointment.depositPaid, currency: 'TRY', rate: 1, isDeposit: true }]);
        }
    }, [appointment.depositPaid]);

    const servicePrice = appointment.price;
    const productsPrice = soldProducts.reduce((s, p) => s + (p.price * p.quantity), 0);
    
    const subTotal = servicePrice + productsPrice;
    
    // Calculate discounts
    const discountAmount = discountMode === 'fixed' ? discountValue : discountMode === 'percentage' ? (subTotal * discountValue / 100) : 0;
    
    // Grand Total is Subtotal - Discount + Tip
    const grandTotal = Math.max(0, subTotal - discountAmount) + tip;
    
    const totalPaid = methods.reduce((sum, m) => sum + (m.amount * m.rate), 0);
    const remaining = grandTotal - totalPaid;

    const addMethod = (type: PaymentMethod['method'], predefinedAmount?: number) => {
        const amountToAdd = predefinedAmount !== undefined ? predefinedAmount : Math.max(0, remaining);
        if (amountToAdd <= 0) return;
        
        // Auto-select first matching tool if any
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

    const useMembershipSession = () => {
        if (activeMembership && membershipPlan) {
            if (methods.some(m => m.method === 'abonelik')) return;
            setMethods([...methods, { method: 'abonelik', amount: servicePrice, currency: 'TRY', rate: 1, isDeposit: false }]);
        }
    };

    const handleProcess = () => {
        setIsSuccess(true); // Gösterişli işlem tamamlandı ekranı
        
        // Asıl kaydetme işlemi arkada çalışsın
        processCheckout(
            {
                appointmentId: appointment.id,
                branchId: appointment.branchId,
                customerId: appointment.customerId,
                customerName: appointment.customerName,
                service: appointment.service,
                methods: methods.map(m => ({ ...m, id: crypto.randomUUID() })),
                paymentDefinitionId: methods[0]?.toolId, // Also record primary tool at top level
                totalAmount: totalPaid,
                date: getTodayDate(),
                note: note + (discountAmount > 0 ? ` [İskonto: ₺${discountAmount}]` : '') + (tip > 0 ? ` [Bahşiş: ₺${tip}]` : '')
            },
            remaining > 0 ? { amount: remaining, dueDate } : undefined,
            soldProducts.map(p => ({ productId: p.productId, quantity: p.quantity }))
        );
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[400] flex items-center justify-center p-6">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="modal-premium p-12 flex flex-col items-center justify-center max-w-md w-full text-center shadow-2xl"
                >
                    <motion.div 
                        initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 10, delay: 0.2 }}
                        className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100"
                    >
                        <CheckCircle2 className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2">Ödeme Alındı!</h2>
                    <p className="text-gray-500 font-semibold mb-8">Tahsilat başarıyla sisteme kaydedildi ve kasa kapatıldı.</p>
                    
                    <div className="flex flex-col gap-3 w-full">
                        <button onClick={() => window.print()} className="w-full bg-gray-50 border border-gray-200 text-gray-900 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-2 hover:bg-gray-100 transition shadow-sm">
                            <Printer className="w-5 h-5" /> Fişi Yazdır (PDF)
                        </button>
                        <button onClick={onClose} className="w-full bg-primary text-white py-4 rounded-2xl font-black text-sm transition hover:shadow-lg shadow-primary/20">
                            Kapat
                        </button>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 md:p-6 font-sans">
            <motion.div 
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="modal-premium w-full max-w-7xl h-[95vh] md:h-[90vh] flex flex-col overflow-hidden"
            >
                {/* Header Section */}
                <div className="p-6 md:p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50 backdrop-blur-sm sticky top-0 z-10">
                    <div className="flex items-center gap-4 md:gap-6">
                        <div className="w-12 h-12 md:w-16 md:h-16 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xl md:text-2xl shadow-lg shadow-primary/20">
                            {customer?.name.charAt(0)}
                        </div>
                        <div>
                            <h2 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">{customer?.name}</h2>
                            <div className="flex gap-4 mt-1 text-[10px] md:text-[11px] font-black text-gray-400 uppercase tracking-widest">
                                <span>{customer?.phone}</span>
                                <span className={`px-2 py-0.5 rounded italic ${customer?.segment === 'VIP' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>{customer?.segment} SEGMENT</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        {activeMembership && (
                            <div className="hidden md:flex items-center gap-4 bg-primary/10 border border-primary/20 px-6 py-3 rounded-2xl">
                                <Crown className="w-5 h-5 text-primary" />
                                <div>
                                    <p className="text-[10px] font-black text-primary/60 uppercase tracking-widest">Aktif Abonelik</p>
                                    <p className="text-sm font-black text-primary">{membershipPlan?.name} ({activeMembership.remainingSessions} Seans)</p>
                                </div>
                            </div>
                        )}
                        <button onClick={onClose} className="p-3 md:p-4 hover:bg-white rounded-2xl transition shadow-sm border border-gray-100 group bg-gray-50/50">
                            <X className="w-6 h-6 text-gray-400 group-hover:text-red-500 transition-colors" />
                        </button>
                    </div>
                </div>

                <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
                    {/* Left Panel */}
                    <div className="flex-1 p-6 md:p-10 overflow-y-auto no-scrollbar space-y-8 border-r border-gray-50">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Package className="w-4 h-4 text-primary" /> Tahsilat Kalemleri
                                </h3>
                                {activeMembership && (
                                    <button onClick={useMembershipSession} className="bg-primary text-white px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5 hover:bg-primary/90 shadow-sm transition-all md:hidden shadow-primary/20">
                                        <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> Abonelik Kullan
                                    </button>
                                )}
                            </div>
                            
                            {/* Service Row */}
                            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center hover:border-primary/20 transition-colors">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary"><Calendar className="w-5 h-5" /></div>
                                    <div>
                                        <p className="font-black text-gray-900 text-sm md:text-base">{appointment.service}</p>
                                        <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Hizmet Bedeli</p>
                                    </div>
                                </div>
                                <p className="font-black text-lg text-gray-900">₺{servicePrice.toLocaleString('tr-TR')}</p>
                            </div>

                            {/* Products List (Animated) */}
                            <AnimatePresence>
                                {soldProducts.map(p => (
                                    <motion.div 
                                        initial={{ opacity: 0, height: 0, scale: 0.9 }}
                                        animate={{ opacity: 1, height: 'auto', scale: 1 }}
                                        exit={{ opacity: 0, height: 0, scale: 0.9 }}
                                        key={p.productId} 
                                        className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm flex justify-between items-center"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600"><Package className="w-5 h-5" /></div>
                                            <div>
                                                <p className="font-black text-gray-900 text-sm md:text-base">{p.name}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{p.quantity} Adet x ₺{p.price}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4 md:gap-6">
                                            <p className="font-black text-lg text-gray-900">₺{(p.price * p.quantity).toLocaleString('tr-TR')}</p>
                                            <button onClick={() => removeProduct(p.productId)} className="text-gray-300 hover:text-red-500 transition-colors p-2 rounded-lg hover:bg-red-50"><Trash2 className="w-4 h-4 md:w-5 md:h-5" /></button>
                                        </div>
                                    </motion.div>
                                ))}
                            </AnimatePresence>

                            {/* Upsell / Extras */}
                            <div className="pt-4 border-t border-dashed border-gray-200">
                                <div className="flex flex-wrap gap-2">
                                    {getUpsellSuggestions(appointment.service).map(p => (
                                        <button 
                                            key={`upsell-${p.id}`}
                                            onClick={() => addProduct(p.id)}
                                            className="px-4 py-2.5 bg-primary/5 border border-primary/10 hover:border-primary/30 rounded-xl text-xs font-black text-primary transition-all flex items-center gap-2 shadow-sm"
                                        >
                                            <Sparkles className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" /> {p.name} Ekle (+₺{p.price})
                                        </button>
                                    ))}
                                    {inventory.filter(p => !soldProducts.some(s => s.productId === p.id) && !getUpsellSuggestions(appointment.service).some(u => u.id === p.id)).map(p => (
                                        <button 
                                            key={`inv-${p.id}`} 
                                            onClick={() => addProduct(p.id)}
                                            className="px-4 py-2.5 bg-gray-50 border border-gray-200 hover:border-gray-300 rounded-xl text-xs font-black text-gray-600 transition-all flex items-center gap-2"
                                        >
                                            <Plus className="w-3.5 h-3.5" /> {p.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Extra Fees: Discount & Tip */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-100">
                            {/* Discount */}
                            <div className="bg-gray-50 p-5 rounded-3xl border border-gray-100 space-y-3">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <Percent className="w-4 h-4" /> İskonto / İndirim
                                </h3>
                                <div className="flex gap-2">
                                    <button onClick={() => setDiscountMode(discountMode === 'percentage' ? 'none' : 'percentage')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${discountMode === 'percentage' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-gray-600 border-gray-200'}`}>% Oran</button>
                                    <button onClick={() => setDiscountMode(discountMode === 'fixed' ? 'none' : 'fixed')} className={`flex-1 py-2 rounded-xl text-xs font-black transition-all border ${discountMode === 'fixed' ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-white text-gray-600 border-gray-200'}`}>₺ Tutar</button>
                                </div>
                                <AnimatePresence>
                                    {discountMode !== 'none' && (
                                        <motion.input 
                                            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                                            type="number" value={discountValue || ''} onChange={e => setDiscountValue(Number(e.target.value))}
                                            placeholder={discountMode === 'percentage' ? "% Değer" : "₺ Tutar"}
                                            className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 font-black text-sm outline-none focus:border-primary"
                                        />
                                    )}
                                </AnimatePresence>
                            </div>
                            {/* Tip */}
                            <div className="bg-amber-50/50 p-5 rounded-3xl border border-amber-100/50 space-y-3">
                                <h3 className="text-[10px] font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                                    <HeartHandshake className="w-4 h-4" /> Personel Bahşişi
                                </h3>
                                <div className="flex gap-2 flex-wrap">
                                    {[0, 50, 100, 200].map(t => (
                                        <button key={t} onClick={() => setTip(t)} className={`px-3 py-2 rounded-xl text-xs font-black transition-all border ${tip === t ? 'bg-amber-100 text-amber-700 border-amber-300' : 'bg-white text-gray-500 border-gray-200'}`}>
                                            {t === 0 ? 'Yok' : `₺${t}`}
                                        </button>
                                    ))}
                                    <div className="flex-1 min-w-[80px]">
                                        <input type="number" placeholder="Özel" value={tip || ''} onChange={e => setTip(Number(e.target.value))} className="w-full bg-white border border-gray-200 rounded-xl px-3 py-2 font-black text-xs text-amber-700 outline-none focus:border-amber-400" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Payment Selection */}
                        <div className="space-y-6 pt-8 border-t border-gray-100">
                             <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ödeme Kanalları</h3>
                                
                                {/* 1-Click Quick Pays */}
                                {remaining > 0 && (
                                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-2 p-1.5 bg-gray-100 rounded-xl w-fit">
                                        <button onClick={() => addMethod('nakit', remaining)} className="px-3 py-1.5 rounded-lg bg-white shadow-sm text-[10px] font-black text-emerald-600 hover:bg-emerald-50 transition-colors uppercase">Tümü Nakit</button>
                                        <button onClick={() => addMethod('kredi-karti', remaining)} className="px-3 py-1.5 rounded-lg bg-white shadow-sm text-[10px] font-black text-primary hover:bg-primary/5 transition-colors uppercase">Tümü Kart</button>
                                    </motion.div>
                                )}
                             </div>
                             
                             {/* Manual Add Buttons */}
                             {remaining > 0 && methods.length === 0 && (
                                <div className="flex flex-wrap gap-2">
                                    {[
                                        { id: 'nakit', label: 'Nakit Ekle', icon: Banknote, color: 'hover:text-emerald-500 hover:border-emerald-200' },
                                        { id: 'kredi-karti', label: 'Kredi Kartı Ekle', icon: CreditCard, color: 'hover:text-primary hover:border-primary/20' },
                                        { id: 'havale', label: 'Havale Ekle', icon: Landmark, color: 'hover:text-amber-500 hover:border-amber-200' },
                                    ].map(btn => (
                                        <button key={btn.id} onClick={() => addMethod(btn.id as any)} className={`flex items-center gap-2 px-5 py-3 bg-white border border-dashed border-gray-300 rounded-2xl text-[11px] font-black text-gray-500 uppercase tracking-widest transition-all ${btn.color}`}>
                                            <btn.icon className="w-4 h-4" /> {btn.label}
                                        </button>
                                    ))}
                                </div>
                             )}

                             <div className="space-y-3">
                                <AnimatePresence>
                                    {methods.map((m, idx) => (
                                        <motion.div 
                                            initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -20, opacity: 0 }}
                                            key={idx} className="flex gap-3 items-center group/method"
                                        >
                                            <div className="flex-[3] p-4 rounded-2xl border flex flex-col gap-3 relative overflow-hidden transition-all bg-white border-gray-200 focus-within:border-primary shadow-sm">
                                                {m.isDeposit && <div className="absolute top-0 left-0 h-full w-1 bg-emerald-400" />}
                                                <div className="flex justify-between items-center">
                                                    <span className={`text-[10px] sm:text-xs font-black uppercase ${m.isDeposit ? 'text-emerald-600' : 'text-gray-500'}`}>
                                                        {m.isDeposit ? 'Yatan Kapora' : m.method === 'kredi-karti' ? 'Kredi Kartı' : m.method}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="text-gray-400 font-black text-sm">₺</span>
                                                        <input 
                                                            type="number" value={m.amount || ''} disabled={m.isDeposit}
                                                            onChange={e => updateMethod(idx, 'amount', Number(e.target.value))}
                                                            className="bg-transparent text-right font-black text-lg sm:text-xl text-gray-900 w-24 sm:w-32 outline-none disabled:opacity-50"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Tool Selection (Bank/Cash Account) */}
                                                {!m.isDeposit && (
                                                    <div className="flex items-center gap-2 pt-2 border-t border-gray-50">
                                                        <Landmark size={12} className="text-gray-400" />
                                                        <select 
                                                            value={m.toolId || ''} 
                                                            onChange={e => updateMethod(idx, 'toolId', e.target.value)}
                                                            className="bg-transparent text-[10px] font-black text-primary uppercase tracking-widest outline-none flex-1"
                                                        >
                                                            <option value="">Ödeme Aracı Seçin...</option>
                                                            {paymentDefinitions.map(d => (
                                                                <option key={d.id} value={d.id}>{d.name} ({d.type})</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                )}
                                            </div>
                                            {!m.isDeposit && (
                                                <button onClick={() => removeMethod(idx)} className="p-4 bg-red-50 text-red-400 rounded-2xl hover:bg-red-500 hover:text-white transition-all">
                                                    <Trash2 className="w-5 h-5" />
                                                </button>
                                            )}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                             </div>
                        </div>

                        {remaining > 0 && (
                            <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-red-50 rounded-3xl border border-red-100 p-6 space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="bg-white p-2.5 rounded-xl shadow-sm"><AlertCircle className="w-5 h-5 text-red-500" /></div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-red-900 text-sm md:text-base uppercase tracking-tight">Kalan Bakiyeyi Borçlandır</h3>
                                        <p className="text-red-600 font-bold text-[11px] md:text-xs mt-1">₺{remaining.toLocaleString('tr-TR')} tutarı müşteri cari hesabına borç kaydedilecek.</p>
                                        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mt-4">
                                            <label className="text-[10px] font-black text-red-400 uppercase tracking-widest">Vade Planı:</label>
                                            <input type="date" value={dueDate} onChange={e => setDueDate(e.target.value)} className="bg-white border border-red-200 focus:border-red-400 rounded-xl px-4 py-2 font-black text-xs text-red-900 outline-none w-full sm:w-auto" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Right Panel - Digital Receipt */}
                    <div className="w-full lg:w-[400px] bg-gray-50 flex flex-col relative border-l border-gray-200">
                        {/* Cut/Torn edge effect at the top (CSS pseudo-element approximation) */}
                        <div className="h-4 w-full bg-[radial-gradient(circle_at_10px_0,transparent_10px,#f9fafb_11px)] bg-[length:20px_10px] absolute top-[-4px] left-0 right-0 hidden lg:block z-20" />
                        
                        <div className="p-8 pb-4 flex-1 overflow-y-auto no-scrollbar">
                            <div className="text-center mb-8">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1">Müşteri Fişi</p>
                                <h2 className="text-2xl font-black text-gray-900 tracking-tighter">AURA SPA</h2>
                            </div>

                            {/* Receipt Body */}
                            <div className="bg-white rounded-xl shadow-sm border border-gray-200 border-dashed p-6 space-y-4 font-mono text-sm">
                                <div className="flex justify-between font-bold text-gray-800"><span>Hizmet Tutarı</span><span>₺{servicePrice}</span></div>
                                {productsPrice > 0 && <div className="flex justify-between font-bold text-gray-800"><span>Ürünler</span><span>₺{productsPrice}</span></div>}
                                
                                {/* Dashed Separator */}
                                <div className="border-b border-dashed border-gray-300" />
                                
                                <div className="flex justify-between text-gray-500"><span>Ara Toplam</span><span>₺{subTotal}</span></div>
                                
                                {discountAmount > 0 && <div className="flex justify-between text-primary font-bold"><span>İskonto</span><span>-₺{discountAmount}</span></div>}
                                {tip > 0 && <div className="flex justify-between text-amber-600 font-bold"><span>Bahşiş</span><span>+₺{tip}</span></div>}
                                
                                <div className="border-b border-dashed border-gray-300" />
                                
                                <div className="flex justify-between items-end">
                                    <span className="text-gray-500 font-bold text-xs uppercase tracking-widest">Genel Toplam</span>
                                    <span className="text-2xl font-black text-gray-900">₺{grandTotal.toLocaleString('tr-TR')}</span>
                                </div>
                            </div>

                            {/* Payment status badge */}
                            <div className={`mt-6 p-4 rounded-xl flex items-center justify-center gap-2 border ${remaining > 0 ? 'bg-red-50 border-red-100 text-red-600' : 'bg-emerald-50 border-emerald-100 text-emerald-600'}`}>
                                {remaining > 0 ? (
                                    <><AlertCircle className="w-5 h-5"/> <span className="font-black text-sm uppercase tracking-wider">Açık Bakiye: ₺{remaining}</span></>
                                ) : (
                                    <><CheckCircle2 className="w-5 h-5"/> <span className="font-black text-sm uppercase tracking-wider">Tahsilat Tamamlandı</span></>
                                )}
                            </div>

                            <div className="mt-8">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Dahili Not (Opsiyonel)</label>
                                <textarea value={note} onChange={e => setNote(e.target.value)} rows={2} className="w-full bg-white border border-gray-200 rounded-xl p-3 text-xs font-bold outline-none focus:border-primary" />
                            </div>
                        </div>

                        {/* Sticky Action Button */}
                        <div className="p-6 bg-gray-50 border-t border-gray-200">
                            <button 
                                onClick={handleProcess}
                                disabled={grandTotal > 0 && totalPaid > grandTotal}
                                className="w-full py-5 rounded-[2rem] bg-primary text-white font-black text-sm shadow-xl shadow-primary/20 hover:bg-primary/90 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:hover:scale-100"
                            >
                                <CheckCircle2 className="w-5 h-5" /> İşlemi Onayla ve Kaydet
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
