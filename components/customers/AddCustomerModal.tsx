"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, User, Phone } from 'lucide-react';
import { useStore, Customer } from '@/lib/store';

interface AddCustomerModalProps {
    onClose: () => void;
    onSave: (c: Customer) => void;
}

export function AddCustomerModal({ onClose, onSave }: AddCustomerModalProps) {
    const { addCustomer } = useStore();
    const [form, setForm] = useState({ 
        name: '', 
        phone: '', 
        email: '', 
        birthdate: '', 
        segment: 'Normal' as Customer['segment'], 
        note: '' 
    });

    const h = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[1000] flex items-center justify-center p-4"
        >
            <motion.div 
                initial={{ y: 20, scale: 0.95 }} 
                animate={{ y: 0, scale: 1 }} 
                className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20"
            >
                <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-gray-50">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Yeni Danışan</h2>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 italic">Premium Kayıt Formu</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-10 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block group-focus-within:text-indigo-600 transition-colors">Ad Soyad</label>
                            <div className="relative">
                                <User className="w-5 h-5 absolute left-4 top-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                <input 
                                    value={form.name} 
                                    onChange={e => h('name', e.target.value)} 
                                    placeholder="Müşteri Adı"
                                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold transition-all outline-none" 
                                />
                            </div>
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block group-focus-within:text-indigo-600 transition-colors">Telefon</label>
                            <div className="relative">
                                <Phone className="w-5 h-5 absolute left-4 top-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                <input 
                                    value={form.phone} 
                                    onChange={e => h('phone', e.target.value)} 
                                    placeholder="05XX"
                                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold transition-all outline-none" 
                                />
                            </div>
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Segment Seçimi</label>
                        <div className="flex gap-2">
                            {(['Normal', 'VIP', 'Kurumsal'] as Customer['segment'][]).map(s => (
                                <button 
                                    key={s} 
                                    onClick={() => h('segment', s)}
                                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                        form.segment === s 
                                            ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' 
                                            : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'
                                    }`}
                                >
                                    {s === 'VIP' && '⭐ '} {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Özel Notlar</label>
                        <textarea 
                            value={form.note} 
                            onChange={e => h('note', e.target.value)} 
                            rows={3}
                            placeholder="Müşteri hakkında önemli detaylar..." 
                            className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-600 rounded-[2rem] px-6 py-5 text-sm font-bold transition-all outline-none resize-none" 
                        />
                    </div>
                </div>
                
                <div className="px-10 pb-10 flex gap-4">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 bg-gray-50 text-gray-500 font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all"
                    >
                        İptal
                    </button>
                    <button
                        disabled={!form.name || !form.phone}
                        onClick={async () => { 
                            const c = await addCustomer(form); 
                            onSave(c); 
                        }}
                        className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-40"
                    >
                        Kaydı Tamamla ✓
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
