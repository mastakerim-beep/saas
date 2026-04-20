"use client";

import { useState, useMemo } from 'react';
import { useStore, Customer, Service, Product } from '@/lib/store';
import { 
    X, Search, User, Plus, ShoppingBag, 
    ChevronRight, CheckCircle2, UserPlus, Zap
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartCheckout from './SmartCheckout';

interface QuickSaleFlowProps {
    onClose: () => void;
}

export default function QuickSaleFlow({ onClose }: QuickSaleFlowProps) {
    const { customers, services, inventory } = useStore();
    const [step, setStep] = useState<'customer' | 'items' | 'checkout'>('customer');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return customers.slice(0, 5);
        return customers.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone?.includes(searchQuery)
        ).slice(0, 10);
    }, [searchQuery, customers]);

    const handleSelectCustomer = (customer: Customer | null) => {
        setSelectedCustomer(customer);
        setStep('items');
    };

    const handleSelectService = (service: Service | null) => {
        setSelectedService(service);
        setStep('checkout');
    };

    if (step === 'checkout') {
        return (
            <SmartCheckout 
                initialCustomerId={selectedCustomer?.id}
                initialService={selectedService ? { name: selectedService.name, price: selectedService.price } : undefined}
                onClose={onClose}
            />
        );
    }

    return (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 font-sans">
            <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                exit={{ opacity: 0 }} 
                onClick={onClose}
                className="absolute inset-0 bg-black/60 backdrop-blur-md" 
            />
            
            <motion.div 
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                className="bg-white rounded-[3rem] p-10 w-full max-w-2xl relative z-10 shadow-2xl h-[80vh] flex flex-col"
            >
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">
                            {step === 'customer' ? 'Müşteri Seç' : 'Hizmet Seç'}
                        </h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">
                            {step === 'customer' ? 'Satış yapılacak kişiyi belirleyin' : 'Hangi hizmet veya ürün satılacak?'}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-4 hover:bg-gray-50 rounded-2xl transition">
                        <X className="w-6 h-6 text-gray-400" />
                    </button>
                </div>

                {step === 'customer' && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="relative mb-6">
                            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input 
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="İsim veya telefon ile ara..."
                                className="w-full bg-gray-50 border-none rounded-2xl pl-16 pr-6 py-5 text-sm font-bold text-gray-900 outline-none focus:ring-4 focus:ring-primary/10 transition-all"
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-3 pr-2">
                             <button 
                                onClick={() => handleSelectCustomer(null)}
                                className="w-full flex items-center justify-between p-6 bg-indigo-50/50 rounded-3xl border-2 border-dashed border-indigo-100 hover:border-indigo-400 transition-all group"
                            >
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><UserPlus size={20} /></div>
                                    <div className="text-left">
                                        <p className="font-black text-indigo-900 uppercase italic">KAYITSIZ MÜŞTERİ</p>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Hızlı Satış (Eski müşteriler dahil değil)</p>
                                    </div>
                                </div>
                                <ChevronRight className="w-5 h-5 text-indigo-300 group-hover:translate-x-1 transition-transform" />
                            </button>

                            {filteredCustomers.map(c => (
                                <button 
                                    key={c.id}
                                    onClick={() => handleSelectCustomer(c)}
                                    className="w-full flex items-center justify-between p-6 bg-white border-2 border-gray-50 rounded-3xl hover:border-primary hover:shadow-xl hover:shadow-primary/5 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-gray-50 text-gray-400 rounded-2xl flex items-center justify-center font-black">{c.name.charAt(0)}</div>
                                        <div className="text-left">
                                            <p className="font-black text-gray-900 uppercase italic">{c.name}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{c.phone || 'Telefon yok'}</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-primary group-hover:translate-x-1 transition-transform" />
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {step === 'items' && (
                    <div className="flex-1 flex flex-col min-h-0">
                        <div className="mb-6 flex gap-3 p-1.5 bg-gray-50 rounded-2xl w-fit">
                            <div className="px-6 py-2 bg-white rounded-xl shadow-sm"><span className="text-[10px] font-black text-primary uppercase">{selectedCustomer?.name || 'KAYITSIZ MÜŞTERİ'}</span></div>
                        </div>

                        <div className="flex-1 overflow-y-auto no-scrollbar space-y-8">
                            <section>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <Zap className="w-4 h-4 text-amber-500" /> Popüler Hizmetler
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {services.slice(0, 6).map(s => (
                                        <button 
                                            key={s.id}
                                            onClick={() => handleSelectService(s)}
                                            className="p-6 bg-white border-2 border-gray-50 rounded-3xl hover:border-primary hover:shadow-xl transition-all text-left group"
                                        >
                                            <p className="font-black text-gray-900 uppercase italic mb-1">{s.name}</p>
                                            <p className="text-xl font-black text-primary tracking-tighter italic">₺{s.price}</p>
                                        </button>
                                    ))}
                                </div>
                            </section>

                            <section>
                                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                    <ShoppingBag className="w-4 h-4 text-indigo-600" /> Sadece Ürün Satışı
                                </h4>
                                <button 
                                    onClick={() => handleSelectService(null)}
                                    className="w-full p-8 bg-gray-900 text-white rounded-[2.5rem] flex items-center justify-between group hover:scale-[1.02] transition-all shadow-xl shadow-gray-200"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center"><ShoppingBag size={24} /></div>
                                        <div className="text-left">
                                            <p className="font-black uppercase italic">DİREKT ÜRÜN SATIŞI</p>
                                            <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">Hizmet eklemeden ürün sepetine geç</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="w-6 h-6 text-white/20 group-hover:text-white transition-colors" />
                                </button>
                            </section>
                        </div>
                    </div>
                )}
            </motion.div>
        </div>
    );
}
