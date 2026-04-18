"use client";

import { useState, useMemo } from 'react';
import { X, Plus, Target, Search, UserPlus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useStore, Customer } from '@/lib/store';
import DraggableCustomerCard from './DraggableCustomerCard';

interface CustomerPanelProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function CustomerPanel({ isOpen, onClose }: CustomerPanelProps) {
    const { customers, addCustomer } = useStore();
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const filtered = useMemo(() => {
        if (!search) return [];
        return customers.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase()) || 
            c.phone.includes(search)
        );
    }, [customers, search]);

    const handleQuickAdd = async () => {
        if (!newName || !newPhone) return;
        await addCustomer({
            name: newName,
            phone: newPhone,
            email: '',
            birthdate: '',
            segment: 'Standard',
            note: 'Takvim üzerinden hızlı eklendi',
            isChurnRisk: false
        });
        setIsAdding(false);
        setSearch(newName); // Otomatik olarak yeni eklenen kişiyi arama kutusuna yaz ki listelerde açık kalsın.
        setNewName('');
        setNewPhone('');
    };

    return (
        <div className={`
            fixed right-0 top-0 h-full w-[336px] bg-white border-l border-gray-100 shadow-2xl z-[150] flex flex-col
            transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            ${isOpen ? 'translate-x-0' : 'translate-x-full opacity-0 scale-95'}
        `}>
            <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-black text-gray-900 text-xl leading-none uppercase">Müşteri Rehberi</h3>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <Target className="w-3 h-3" /> Akıllı Arama Aktif
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => setIsAdding(!isAdding)} 
                            className={`p-3 rounded-2xl transition-all shadow-sm border ${isAdding ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-indigo-600 hover:bg-indigo-50'}`}
                        >
                            <Plus className={`w-5 h-5 transition-transform ${isAdding ? 'rotate-45' : ''}`} />
                        </button>
                        <button onClick={onClose} className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100 group">
                            <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                        </button>
                    </div>
                </div>

                <div className="relative group">
                    <Search className={`w-5 h-5 absolute left-5 top-4.5 transition-colors ${search ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <input 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="İsim veya numara ile ara..."
                        className="w-full bg-gray-50 border border-gray-100 focus:border-indigo-500 pl-14 pr-6 py-4.5 text-sm font-bold text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white rounded-2xl"
                    />
                </div>
            </div>

            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
                <AnimatePresence>
                    {isAdding && (
                        <motion.div 
                            initial={{ opacity: 0, y: -20 }} 
                            animate={{ opacity: 1, y: 0 }} 
                            exit={{ opacity: 0, y: -20 }}
                            className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[2.5rem] space-y-5 shadow-xl relative overflow-hidden"
                        >
                            <div className="relative z-10">
                                <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-4 text-center">YENİ MÜŞTERİ KAYDI</p>
                                <div className="space-y-3">
                                    <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ad Soyad" className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white text-sm font-bold outline-none" />
                                    <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Telefon" className="w-full bg-white/10 border border-white/20 rounded-2xl px-5 py-4 text-white text-sm font-bold outline-none" />
                                </div>
                                <div className="flex gap-3 mt-6">
                                    <button onClick={() => setIsAdding(false)} className="flex-1 text-white/70 font-black text-[11px] uppercase">Vazgeç</button>
                                    <button onClick={handleQuickAdd} className="flex-1 py-4 bg-white text-indigo-600 rounded-2xl font-black text-[11px] uppercase shadow-lg">Hızlı Kaydet</button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {search.length > 0 ? (
                    filtered.length > 0 ? (
                        filtered.map(customer => (
                            <DraggableCustomerCard key={customer.id} customer={customer} />
                        ))
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <UserPlus className="w-8 h-8 text-gray-300 mx-auto" />
                            <p className="text-gray-900 font-bold text-sm tracking-tight center">Müşteri bulunamadı.</p>
                            <button onClick={() => setIsAdding(true)} className="text-[10px] font-black text-indigo-600 uppercase hover:underline">Hemen Kaydet</button>
                        </div>
                    )
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-8">
                        <Sparkles className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Müşteri rehberinde arama yapın</p>
                    </div>
                )}
            </div>
        </div>
    );
}
