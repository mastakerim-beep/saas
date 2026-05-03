"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { X, Activity, Target, Zap, Heart } from 'lucide-react';
import { useStore } from '@/lib/store';

interface AddBiometricModalProps {
    customerId: string;
    onClose: () => void;
    onSave: () => void;
}

export function AddBiometricModal({ customerId, onClose, onSave }: AddBiometricModalProps) {
    const { addBiometric } = useStore();
    const [form, setForm] = useState({ 
        weight: 0, 
        bodyFatPercent: 0, 
        muscleFatPercent: 0, 
        visceralFatLevel: 0,
        basalMetabolism: 0,
        wellnessAge: 0,
        mobilityScore: 0,
        balanceScore: 0,
        strengthScore: 0,
        source: 'Manuel'
    });

    const h = (k: string, v: number) => setForm(f => ({ ...f, [k]: v }));

    return (
        <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4"
        >
            <motion.div 
                initial={{ y: 20, scale: 0.95 }} 
                animate={{ y: 0, scale: 1 }} 
                className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20"
            >
                <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-gray-50">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Ölçüm Kaydı</h2>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1 italic">Manuel Biyometrik Veri Girişi</p>
                    </div>
                    <button 
                        onClick={onClose} 
                        className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                
                <div className="p-10 grid grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vücut Bileşimi</label>
                        <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase mb-2">Ağırlık (kg)</p>
                                <input 
                                    type="number" step="0.1" value={form.weight || ''} 
                                    onChange={e => h('weight', Number(e.target.value))} 
                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" 
                                />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase mb-2">Yağ Oranı (%)</p>
                                <input 
                                    type="number" step="0.1" value={form.bodyFatPercent || ''} 
                                    onChange={e => h('bodyFatPercent', Number(e.target.value))} 
                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" 
                                />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase mb-2">Kas Kütlesi (kg)</p>
                                <input 
                                    type="number" step="0.1" value={form.muscleFatPercent || ''} 
                                    onChange={e => h('muscleFatPercent', Number(e.target.value))} 
                                    className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Metabolik Veriler</label>
                        <div className="space-y-4 p-6 bg-amber-50/30 rounded-[2rem] border border-amber-50">
                            <div>
                                <p className="text-[9px] font-black text-amber-600 uppercase mb-2">İç Yağlanma (Level)</p>
                                <input 
                                    type="number" value={form.visceralFatLevel || ''} 
                                    onChange={e => h('visceralFatLevel', Number(e.target.value))} 
                                    className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" 
                                />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-amber-600 uppercase mb-2">Bazal Meta. (kcal)</p>
                                <input 
                                    type="number" value={form.basalMetabolism || ''} 
                                    onChange={e => h('basalMetabolism', Number(e.target.value))} 
                                    className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" 
                                />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-amber-600 uppercase mb-2">Metabolik Yaş</p>
                                <input 
                                    type="number" value={form.wellnessAge || ''} 
                                    onChange={e => h('wellnessAge', Number(e.target.value))} 
                                    className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" 
                                />
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2 space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fonksiyonel Skorlar (0-100)</label>
                        <div className="grid grid-cols-3 gap-6 p-6 bg-black rounded-[2rem]">
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Mobilite</p>
                                <input 
                                    type="number" max="100" value={form.mobilityScore || ''} 
                                    onChange={e => h('mobilityScore', Number(e.target.value))} 
                                    className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" 
                                />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Denge</p>
                                <input 
                                    type="number" max="100" value={form.balanceScore || ''} 
                                    onChange={e => h('balanceScore', Number(e.target.value))} 
                                    className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" 
                                />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Güç</p>
                                <input 
                                    type="number" max="100" value={form.strengthScore || ''} 
                                    onChange={e => h('strengthScore', Number(e.target.value))} 
                                    className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" 
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-10 pb-10 pt-4 flex gap-4">
                    <button 
                        onClick={onClose} 
                        className="flex-1 py-4 bg-gray-50 text-gray-500 font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all"
                    >
                        İptal
                    </button>
                    <button
                        onClick={async () => { 
                            await addBiometric({ ...form, customerId }); 
                            onSave(); 
                        }}
                        className="flex-[2] py-4 bg-black text-white font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 shadow-xl shadow-black/20 transition-all"
                    >
                        VERİLERİ KAYDET ✓
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}
