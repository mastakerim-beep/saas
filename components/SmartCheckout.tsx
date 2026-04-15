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
    const [discountMode, setDiscountMode] = useState<'none'|'fixed'|'percentage'>('none');
    const [discountValue, setDiscountValue] = useState<number>(0);
    const [tip, setTip] = useState<number>(0);
    const [isSuccess, setIsSuccess] = useState(false);

    // Gift (İkram) System State
    const [isPinModalOpen, setIsPinModalOpen] = useState(false);
    const [pin, setPin] = useState("");
    const [giftTarget, setGiftTarget] = useState<{type: 'service' | 'product', id?: string} | null>(null);
    const [giftedItems, setGiftedItems] = useState<Set<string>>(new Set()); 
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
    const remaining = grandTotal - totalPaid;

    const handleGiftToggle = (type: 'service' | 'product', id?: string) => {
        const isCurrentlyGifted = type === 'service' ? isServiceGift : giftedItems.has(id!);
        if (isCurrentlyGifted) {
            // If already gifted, just toggle back without PIN (optional policy)
            if (type === 'service') setIsServiceGift(false);
            else {
                const newGifted = new Set(giftedItems);
                newGifted.delete(id!);
                setGiftedItems(newGifted);
            }
            return;
        }
        setGiftTarget({ type, id });
        setIsPinModalOpen(true);
    };

    const confirmPin = () => {
        const correctPin = currentBusiness?.managerPin || "0000"; 
        if (pin === correctPin) {
            if (giftTarget?.type === 'service') {
                setIsServiceGift(true);
            } else if (giftTarget?.id) {
                const newGifted = new Set(giftedItems);
                newGifted.add(giftTarget.id);
                setGiftedItems(newGifted);
            }
            setIsPinModalOpen(false);
            setPin("");
            setGiftTarget(null);
        } else {
            alert("Hatalı PIN! Yönetici onayı gereklidir.");
        }
    };

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
        setIsSuccess(true);
        processCheckout(
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
                note: note + (isServiceGift ? ' [HİZMET HEDİYE]' : '') + (giftedItems.size > 0 ? ' [ÜRÜN HEDİYE]' : '')
            },
            remaining > 0 ? { amount: remaining, dueDate } : undefined,
            soldProducts.map(p => ({ 
                productId: p.productId, 
                name: p.name,
                price: p.price,
                quantity: p.quantity,
                isGift: giftedItems.has(p.productId)
            }))
        );
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[400] flex items-center justify-center p-6 text-sans">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="modal-premium p-12 flex flex-col items-center justify-center max-w-md w-full text-center shadow-2xl">
                    <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }} className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-6 border border-emerald-100">
                        <CheckCircle2 className="w-12 h-12" />
                    </motion.div>
                    <h2 className="text-3xl font-black text-gray-900 mb-2 uppercase italic tracking-tighter">Ödeme Alındı!</h2>
                    <p className="text-gray-500 font-semibold mb-8">Tahsilat ve ikramlar başarıyla sisteme kaydedildi.</p>
                    <button onClick={onClose} className="w-full bg-black text-white py-4 rounded-2xl font-black text-sm transition uppercase tracking-widest">Kapat</button>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[300] flex items-center justify-center p-4 md:p-6 font-sans">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="modal-premium w-full max-w-7xl h-[95vh] md:h-[90vh] flex flex-col overflow-hidden">
                
                {/* PIN Modal Overlay */}
                <AnimatePresence>
                    {isPinModalOpen && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-xl z-[500] flex items-center justify-center p-6">
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
                                    <button onClick={confirmPin} className="flex-1 py-4 bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest">Onayla</button>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Header Section */}
                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-black rounded-[1.5rem] flex items-center justify-center text-white font-black text-2xl shadow-2xl">
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
                    <div className="flex-1 p-10 overflow-y-auto no-scrollbar space-y-10 border-r border-gray-50">
                        <div className="space-y-6">
                            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                <Package className="w-4 h-4 text-indigo-600" /> Tahsilat ve İkram Kalemleri
                            </h3>
                            
                            {/* Service Row */}
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

                            {/* Products List */}
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
                                                <button onClick={() => handleGiftToggle('product', p.productId)} className={`p-4 rounded-2xl transition-all ${isGift ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-300 hover:text-indigo-600 hover:bg-indigo-50'}`}>
                                                    <HeartHandshake size={20} />
                                                </button>
                                                <button onClick={() => removeProduct(p.productId)} className="p-4 bg-gray-50 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"><Trash2 size={20} /></button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Upsell / Extras */}
                        <div className="pt-8 border-t border-dashed border-gray-100">
                             <h3 className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-6">ÜRÜN VE EKSTRALAR</h3>
                             <div className="flex flex-wrap gap-4">
                                {inventory.map(p => (
                                    <button 
                                        key={p.id} 
                                        onClick={() => addProduct(p.id)}
                                        className="px-6 py-4 bg-white border border-gray-100 rounded-2xl text-xs font-black text-gray-900 hover:border-indigo-600 hover:shadow-xl hover:shadow-indigo-50 transition-all flex items-center gap-3 uppercase tracking-wider"
                                    >
                                        <Plus className="w-4 h-4 text-indigo-600" /> {p.name}
                                        <span className="text-gray-300 ml-2">₺{p.price}</span>
                                    </button>
                                ))}
                             </div>
                        </div>

                        {/* Payment Selection */}
                        <div className="space-y-8 pt-10 border-t border-gray-100">
                             <div className="flex justify-between items-center">
                                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Ödeme Kanalları</h3>
                                {remaining > 0 && (
                                    <div className="flex gap-3 p-1.5 bg-gray-100 rounded-2xl">
                                        <button onClick={() => addMethod('nakit', remaining)} className="px-5 py-2.5 rounded-xl bg-white shadow-sm text-[10px] font-black text-gray-900 hover:text-indigo-600 transition-all uppercase tracking-widest">Tümü Nakit</button>
                                        <button onClick={() => addMethod('kredi-karti', remaining)} className="px-5 py-2.5 rounded-xl bg-white shadow-sm text-[10px] font-black text-gray-900 hover:text-indigo-600 transition-all uppercase tracking-widest">Tümü Kart</button>
                                    </div>
                                )}
                             </div>
                             
                             <div className="grid grid-cols-1 gap-4">
                                {methods.map((m, idx) => (
                                    <div key={idx} className="flex gap-4 items-center">
                                        <div className="flex-1 bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex justify-between items-center group focus-within:border-indigo-600 transition-all">
                                            <div className="flex items-center gap-4">
                                                <div className="w-12 h-12 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                                    {m.method === 'kredi-karti' ? <CreditCard size={24} /> : <Banknote size={24} />}
                                                </div>
                                                <span className="text-xs font-black uppercase tracking-widest text-gray-500">{m.method} Ödeme</span>
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
                                            <button key={m} onClick={() => addMethod(m)} className="p-10 bg-gray-50 hover:bg-white border-2 border-dashed border-gray-200 hover:border-indigo-600 rounded-[3rem] transition-all flex flex-col items-center gap-4 group">
                                                <Plus className="w-8 h-8 text-gray-300 group-hover:text-indigo-600 transition-colors" />
                                                <span className="text-[10px] font-black text-gray-400 group-hover:text-indigo-600 uppercase tracking-widest">{m.replace('-', ' ')} Ekle</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
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
                                    <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-center justify-center gap-2">
                                        <AlertCircle size={16} className="text-red-500" />
                                        <span className="text-[10px] font-black text-red-900 uppercase tracking-widest">KALAN BAKİYE: ₺{remaining}</span>
                                    </div>
                                ) : (
                                    <div className="bg-indigo-600 p-4 rounded-2xl flex items-center justify-center gap-2 shadow-xl shadow-indigo-200 animate-pulse">
                                        <CheckCircle2 size={16} className="text-white" />
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest">Tahsilat Hazır</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-10">
                            <button 
                                onClick={handleProcess}
                                className="w-full py-8 rounded-[2.5rem] bg-black text-white font-black text-sm shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-4 uppercase tracking-[0.2em]"
                            >
                                <CheckCircle2 size={24} /> TAHSİLATI TAMAMLA
                            </button>
                        </div>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
