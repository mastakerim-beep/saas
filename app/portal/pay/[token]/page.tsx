"use client";

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from "@/lib/store";
import { motion, AnimatePresence } from 'framer-motion';
import { 
    CreditCard, ShieldCheck, CheckCircle2, Lock, 
    Sparkles, ArrowRight, Activity, ChevronRight,
    ShoppingBag, Info
} from 'lucide-react';

export default function PublicPaymentPage() {
    const { token } = useParams();
    const router = useRouter();
    const { getPaymentLink, processLinkPayment } = useStore();
    
    const [link, setLink] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [cardData, setCardData] = useState({
        number: '',
        holder: '',
        expiry: '',
        cvv: ''
    });

    useEffect(() => {
        const fetchLink = async () => {
            if (!token) return;
            const data = await getPaymentLink(token as string);
            setLink(data);
            setLoading(false);
        };
        fetchLink();
    }, [token]);

    const handlePay = async (e: React.FormEvent) => {
        e.preventDefault();
        setProcessing(true);
        
        // Simulate bank delay
        await new Promise(r => setTimeout(r, 2000));
        
        const ok = await processLinkPayment(token as string, {
            customerName: cardData.holder,
            cardLast4: cardData.number.slice(-4)
        });

        if (ok) {
            setSuccess(true);
        } else {
            alert("Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin veya işletme ile iletişime geçin.");
            setProcessing(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-[#020210] flex flex-col items-center justify-center text-white">
                <div className="w-16 h-16 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-4" />
                <p className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Aura Güvenli Ödeme Hattı...</p>
            </div>
        );
    }

    if (!link || link.status !== 'pending') {
        return (
            <div className="min-h-screen bg-[#020210] flex flex-col items-center justify-center p-6 text-center">
                <div className="w-20 h-20 bg-rose-500/10 text-rose-500 rounded-3xl flex items-center justify-center mb-8 border border-rose-500/20">
                    <Info size={40} />
                </div>
                <h1 className="text-2xl font-black text-white uppercase italic tracking-tighter mb-2">Link Geçersiz</h1>
                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest max-w-xs">Bu ödeme linki süresi dolmuş, kullanılmış veya iptal edilmiş olabilir.</p>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen bg-[#020210] flex flex-col items-center justify-center p-6 text-center">
                <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center"
                >
                    <div className="w-24 h-24 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center mb-8 border border-emerald-500/20 shadow-[0_0_50px_rgba(16,185,129,0.2)]">
                        <CheckCircle2 size={48} />
                    </div>
                    <h1 className="text-3xl font-black text-white uppercase italic tracking-tighter mb-4">Ödeme Başarılı!</h1>
                    <p className="text-emerald-400/60 text-[10px] font-black uppercase tracking-[0.4em] mb-10">İşleminiz güvenle tamamlandı.</p>
                    
                    <div className="bg-white/5 border border-white/10 rounded-[2.5rem] p-8 w-full max-w-sm backdrop-blur-xl">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Tutar</span>
                            <span className="text-2xl font-black text-white italic tracking-tighter">₺{link.amount.toLocaleString('tr-TR')}</span>
                        </div>
                        <div className="pt-6 border-t border-white/5 flex flex-col gap-2">
                             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{link.description}</p>
                             <p className="text-[8px] font-medium text-gray-600">Referans: {link.token.slice(0, 8).toUpperCase()}</p>
                        </div>
                    </div>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020210] text-white font-sans overflow-x-hidden selection:bg-indigo-500 selection:text-white">
            {/* Header / Brand */}
            <div className="max-w-4xl mx-auto p-8 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Sparkles size={20} className="text-white" />
                    </div>
                    <span className="text-sm font-black uppercase tracking-[0.3em]">AURA <span className="text-indigo-400">PAY</span></span>
                </div>
                <div className="flex items-center gap-4">
                    {link?.businesses?.iyzico_api_key && (
                        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full">
                            <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400">Powered by</span>
                            <img src="https://www.iyzico.com/assets/images/iyzico-logo.svg" className="h-3 brightness-200" alt="Iyzico" />
                        </div>
                    )}
                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full">
                        <ShieldCheck size={14} className="text-emerald-400" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-400">SSL SECURED</span>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto p-6 md:p-12 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start relative z-10">
                
                {/* Left Side: Summary */}
                <motion.div 
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    className="space-y-8"
                >
                    <div>
                        <span className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.4em] mb-4 block">GÜVENLİ ÖDEME TALEBİ</span>
                        <h1 className="text-4xl md:text-5xl font-black italic tracking-tighter uppercase leading-none mb-6">
                            Lütfen Ödemenizi <br /> <span className="text-indigo-400">Tamamlayın</span>
                        </h1>
                        <p className="text-gray-400 text-sm font-bold leading-relaxed max-w-sm">
                            İşletmemizden aldığınız hizmetler için oluşturulan güvenli ödeme bağlantısıdır. 
                            Bilgileriniz 256-bit SSL ile korunmaktadır.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-10 backdrop-blur-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                            <ShoppingBag size={100} />
                        </div>
                        <div className="relative z-10">
                            <p className="text-[9px] font-black text-indigo-300 uppercase tracking-widest mb-2">Ödeme Özeti</p>
                            <h2 className="text-xl font-black text-white mb-6 uppercase italic tracking-tight">{link.description}</h2>
                            
                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-5xl font-black italic tracking-tighter">₺{link.amount.toLocaleString('tr-TR')}</span>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">NET TUTAR</span>
                            </div>

                            <div className="space-y-4 pt-8 border-t border-white/5">
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase">Tarih</span>
                                    <span className="text-[10px] font-black text-white">{new Date().toLocaleDateString('tr-TR')}</span>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-[9px] font-bold text-gray-500 uppercase">İşlem No</span>
                                    <span className="text-[10px] font-black text-white">{link.token.slice(0, 10).toUpperCase()}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {/* Right Side: Form */}
                <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    <div className="bg-white rounded-[3.5rem] p-10 md:p-12 shadow-2xl shadow-indigo-500/10 text-gray-900 relative overflow-hidden">
                        {/* Card Preview */}
                        <div className="w-full h-48 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl p-8 mb-10 shadow-xl relative overflow-hidden flex flex-col justify-between">
                            <div className="absolute top-0 right-0 p-6 opacity-20">
                                <Activity size={80} className="text-white" />
                            </div>
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-10 bg-white/20 rounded-lg backdrop-blur-md" />
                                <Lock size={20} className="text-white/40" />
                            </div>
                            <div>
                                <p className="text-white font-mono text-xl tracking-[0.2em] mb-4">
                                    {cardData.number ? cardData.number.padEnd(16, '•').match(/.{1,4}/g)?.join(' ') : '•••• •••• •••• ••••'}
                                </p>
                                <div className="flex justify-between items-end">
                                    <div>
                                        <p className="text-[7px] text-white/50 uppercase font-bold tracking-widest">Kart Sahibi</p>
                                        <p className="text-[10px] text-white font-black uppercase tracking-widest">{cardData.holder || 'AD SOYAD'}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[7px] text-white/50 uppercase font-bold tracking-widest">VALİD THRU</p>
                                        <p className="text-[10px] text-white font-black">{cardData.expiry || 'MM/YY'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <form onSubmit={handlePay} className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">KART NUMARASI</label>
                                <input 
                                    type="text"
                                    maxLength={16}
                                    value={cardData.number}
                                    onChange={e => setCardData({...cardData, number: e.target.value.replace(/\D/g, '')})}
                                    placeholder="0000 0000 0000 0000"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-indigo-100 placeholder:text-gray-200"
                                    required
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">KART SAHİBİ</label>
                                <input 
                                    type="text"
                                    value={cardData.holder}
                                    onChange={e => setCardData({...cardData, holder: e.target.value.toUpperCase()})}
                                    placeholder="AD SOYAD"
                                    className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-indigo-100 placeholder:text-gray-200"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">SON KULLANMA</label>
                                    <input 
                                        type="text"
                                        placeholder="AA/YY"
                                        value={cardData.expiry}
                                        onChange={e => setCardData({...cardData, expiry: e.target.value})}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-indigo-100 placeholder:text-gray-200"
                                        required
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">CVV / CVC</label>
                                    <input 
                                        type="password"
                                        maxLength={3}
                                        value={cardData.cvv}
                                        onChange={e => setCardData({...cardData, cvv: e.target.value})}
                                        placeholder="•••"
                                        className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 text-sm font-black text-gray-900 outline-none focus:ring-4 focus:ring-indigo-100 placeholder:text-gray-200"
                                        required
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit"
                                disabled={processing}
                                className="w-full bg-indigo-600 text-white py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.3em] shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-10 disabled:opacity-50"
                            >
                                {processing ? (
                                    <div className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : (
                                    <>
                                        <span>ÖDEMEYİ TAMAMLA</span>
                                        <ChevronRight size={16} />
                                    </>
                                )}
                            </button>
                        </form>

                        <div className="mt-8 flex items-center justify-center gap-6 opacity-30 grayscale contrast-200">
                             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/2560px-Visa_Inc._logo.svg.png" className="h-4 object-contain" alt="Visa" />
                             <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/1280px-Mastercard-logo.svg.png" className="h-6 object-contain" alt="Mastercard" />
                        </div>
                    </div>
                </motion.div>
            </div>

            {/* Background Glows */}
            <div className="fixed top-0 left-1/4 w-[800px] h-[800px] bg-indigo-600/10 blur-[150px] rounded-full -translate-x-1/2 -translate-y-1/2 pointer-events-none" />
            <div className="fixed bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-600/10 blur-[150px] rounded-full translate-x-1/2 translate-y-1/2 pointer-events-none" />
        </div>
    );
}
