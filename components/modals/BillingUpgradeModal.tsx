"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Zap, Crown, Shield, CreditCard, Sparkles, User } from 'lucide-react';
import { useStore } from '@/lib/store';

interface BillingUpgradeModalProps {
    onClose: () => void;
}

export function BillingUpgradeModal({ onClose }: BillingUpgradeModalProps) {
    const { currentTenant } = useStore();
    const [selectedPlan, setSelectedPlan] = useState<'BASIC' | 'ENTERPRISE'>('ENTERPRISE');
    const [isProcessing, setIsProcessing] = useState(false);

    const plans = [
        {
            id: 'BASIC',
            name: 'Aura Basic',
            price: '₺990',
            period: '/ ay',
            icon: Zap,
            color: 'text-gray-400',
            bg: 'bg-white',
            features: [
                '1 Şube Yönetimi',
                '5 Kullanıcı Tanımlama',
                'Temel Raporlama',
                'Z-Raporu Mühürleme',
                'Müşteri Kayıt (CRM)'
            ]
        },
        {
            id: 'ENTERPRISE',
            name: 'Aura Enterprise',
            price: '₺2.490',
            period: '/ ay',
            icon: Crown,
            color: 'text-amber-500',
            bg: 'bg-amber-50/50',
            popular: true,
            features: [
                'Sınırsız Şube Yönetimi',
                'Sınırsız Kullanıcı',
                'Aura Intelligence YZ Analiz',
                'Technogym Entegrasyonu',
                'Özel İstatistik Paneli',
                '7/24 Öncelikli Destek'
            ]
        }
    ];

    const handleUpgrade = async () => {
        setIsProcessing(true);
        // Simulate API call to Iyzico/Stripe
        setTimeout(() => {
            setIsProcessing(false);
            alert('Ödeme sistemine yönlendiriliyorsunuz...');
            onClose();
        }, 1500);
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[3000] flex items-center justify-center p-4 md:p-8"
        >
            <motion.div 
                initial={{ y: 50, scale: 0.9, opacity: 0 }} 
                animate={{ y: 0, scale: 1, opacity: 1 }} 
                className="bg-white rounded-[2rem] md:rounded-[4rem] shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto border border-white/20 relative"
            >
                <div className="flex items-center justify-between px-12 pt-12 pb-8 border-b border-gray-50">
                    <div>
                        <h2 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic">Aura Premium'a Geçin</h2>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] mt-2 italic">İşletmenizin Gücünü Serbest Bırakın</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-14 h-14 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-3xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-10">
                    {plans.map((plan) => (
                        <div 
                            key={plan.id}
                            onClick={() => setSelectedPlan(plan.id as any)}
                            className={`p-10 rounded-[3rem] border-4 transition-all cursor-pointer relative group ${
                                selectedPlan === plan.id 
                                    ? 'border-indigo-600 bg-indigo-50/10 shadow-2xl shadow-indigo-600/10' 
                                    : 'border-gray-50 bg-white hover:border-gray-100'
                            }`}
                        >
                            {plan.popular && (
                                <div className="absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 bg-indigo-600 text-white rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl">
                                    EN POPÜLER SEÇİM
                                </div>
                            )}

                            <div className="flex justify-between items-start mb-10">
                                <div className={`w-16 h-16 rounded-[2rem] flex items-center justify-center ${selectedPlan === plan.id ? 'bg-indigo-600 text-white' : 'bg-gray-50 text-gray-400'}`}>
                                    <plan.icon className="w-8 h-8" />
                                </div>
                                <div className="text-right">
                                    <h3 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900">{plan.name}</h3>
                                    <div className="flex items-baseline justify-end gap-1 mt-1">
                                        <span className="text-3xl font-black italic text-indigo-600">{plan.price}</span>
                                        <span className="text-[10px] font-bold text-gray-400 uppercase">{plan.period}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4 mb-10">
                                {plan.features.map((feature, i) => (
                                    <div key={i} className="flex items-center gap-4">
                                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${selectedPlan === plan.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                            <Check className="w-3 h-3" />
                                        </div>
                                        <span className="text-sm font-bold text-gray-600">{feature}</span>
                                    </div>
                                ))}
                            </div>

                            <div className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-center ${
                                selectedPlan === plan.id 
                                    ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                                    : 'bg-gray-50 text-gray-400 group-hover:bg-gray-100'
                            }`}>
                                {selectedPlan === plan.id ? 'SEÇİLDİ ✓' : 'PLANI SEÇ'}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="px-12 pb-12 pt-4 flex flex-col md:flex-row items-center justify-between gap-8 border-t border-gray-50 mt-4 bg-gray-50/50">
                    <div className="flex items-center gap-6">
                        <div className="flex -space-x-4">
                            {[1,2,3,4].map(i => (
                                <div key={i} className="w-12 h-12 rounded-full border-4 border-white bg-gray-100 flex items-center justify-center">
                                    <User className="w-5 h-5 text-gray-300" />
                                </div>
                            ))}
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">GÜVENLİ ÖDEME</p>
                            <p className="text-sm font-bold text-gray-600">500+ İşletme Aura Altyapısını Kullanıyor</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6 w-full md:w-auto">
                        <div className="flex items-center gap-2 text-gray-400">
                            <Shield className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest italic">SSL SECURE</span>
                        </div>
                        <button 
                            onClick={handleUpgrade}
                            disabled={isProcessing}
                            className="flex-1 md:flex-none px-12 py-5 bg-black text-white rounded-[2rem] font-black uppercase text-xs tracking-[0.2em] shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3"
                        >
                            {isProcessing ? (
                                <Sparkles className="w-5 h-5 animate-spin" />
                            ) : (
                                <>GÜVENLİ ÖDEME YAP <CreditCard className="w-5 h-5" /></>
                            )}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
