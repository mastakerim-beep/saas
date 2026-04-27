import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

export const CreateBusinessModal = ({ isOpen, onClose, onCreate, isCreating }: any) => {
    const [modalStep, setModalStep] = useState(1);
    const [newBiz, setNewBiz] = useState({
        name: '',
        slug: '',
        mrr: 1500,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        plan: 'Basic',
        taxId: '',
        taxOffice: '',
        billingAddress: '',
        email: '',
        password: '',
        seatCount: 5,
        isStaff: true,
        verticals: ['spa'] as string[]
    });

    const handleSubmit = async () => {
        const success = await onCreate(newBiz);
        if (success) {
            setModalStep(1);
            setNewBiz({
                name: '', slug: '', mrr: 1500, plan: 'Basic',
                expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                taxId: '', taxOffice: '', billingAddress: '',
                email: '', password: '', seatCount: 5, isStaff: true,
                verticals: ['spa']
            });
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-left">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white border border-indigo-100 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl"
            >
                <div className="p-10">
                    <div className="flex justify-between items-center mb-10">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white font-black italic text-xl">
                                {modalStep}
                            </div>
                            <div>
                                <h2 className="text-slate-900 text-2xl font-black italic uppercase tracking-tighter">İşletme Kurulumu</h2>
                                <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Aşama {modalStep} / 3</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="min-h-[350px]">
                        {modalStep === 1 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">İşletme Adı</label>
                                    <input value={newBiz.name} onChange={e => setNewBiz({...newBiz, name: e.target.value})} placeholder="Örn: Aura Spa Merkezi" className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slug (URL)</label>
                                    <input value={newBiz.slug} onChange={e => setNewBiz({...newBiz, slug: e.target.value})} placeholder="aura-spa" className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Koltuk Sayısı</label>
                                        <input type="number" value={newBiz.seatCount} onChange={e => setNewBiz({...newBiz, seatCount: parseInt(e.target.value)})} className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Plan</label>
                                        <select 
                                            value={newBiz.plan} 
                                            onChange={e => setNewBiz({...newBiz, plan: e.target.value})}
                                            className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner appearance-none"
                                        >
                                            <option value="Basic">Basic</option>
                                            <option value="Aura Enterprise">Aura Enterprise</option>
                                         </select>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Aktif Dikey Projeler (Kingdoms)</label>
                                    <div className="flex gap-3">
                                        {[
                                            { id: 'spa', label: 'SPA', color: 'bg-indigo-500' },
                                            { id: 'clinic', label: 'KLİNİK', color: 'bg-emerald-500' },
                                            { id: 'fitness', label: 'FITNESS', color: 'bg-amber-500' }
                                        ].map(v => (
                                            <button 
                                                key={v.id}
                                                onClick={() => {
                                                    const next = newBiz.verticals.includes(v.id) 
                                                        ? newBiz.verticals.filter(x => x !== v.id)
                                                        : [...newBiz.verticals, v.id];
                                                    if (next.length === 0) return;
                                                    setNewBiz({ ...newBiz, verticals: next });
                                                }}
                                                className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                                    newBiz.verticals.includes(v.id)
                                                    ? 'border-indigo-600 bg-indigo-50/50'
                                                    : 'border-slate-100 bg-white'
                                                }`}
                                            >
                                                <div className={`w-3 h-3 rounded-full ${v.color} ${newBiz.verticals.includes(v.id) ? 'scale-125' : 'opacity-40'}`} />
                                                <span className={`text-[9px] font-black tracking-widest ${newBiz.verticals.includes(v.id) ? 'text-indigo-950' : 'text-slate-400'}`}>{v.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <button onClick={() => setModalStep(2)} className="w-full py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest mt-8">SONRAKİ ADIM: CARİ & FİNANS</button>
                            </motion.div>
                        )}

                        {modalStep === 2 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vergi Numarası</label>
                                        <input value={newBiz.taxId} onChange={e => setNewBiz({...newBiz, taxId: e.target.value})} placeholder="1234567890" className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Vergi Dairesi</label>
                                        <input value={newBiz.taxOffice} onChange={e => setNewBiz({...newBiz, taxOffice: e.target.value})} placeholder="Ümraniye V.D." className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Ücret (₺) / Aylık</label>
                                    <input type="number" value={newBiz.mrr} onChange={e => setNewBiz({...newBiz, mrr: parseFloat(e.target.value)})} className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Abonelik Bitiş Tarihi</label>
                                    <input type="date" value={newBiz.expiryDate} onChange={e => setNewBiz({...newBiz, expiryDate: e.target.value})} className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button onClick={() => setModalStep(1)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest">GERİ</button>
                                    <button onClick={() => setModalStep(3)} className="flex-[2] py-5 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest">SONRAKİ: YÖNETİCİ HESABI</button>
                                </div>
                            </motion.div>
                        )}

                        {modalStep === 3 && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">E-posta</label>
                                    <input value={newBiz.email} onChange={e => setNewBiz({...newBiz, email: e.target.value})} placeholder="admin@isletme.com" className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geçici Şifre</label>
                                    <input type="password" value={newBiz.password} onChange={e => setNewBiz({...newBiz, password: e.target.value})} placeholder="••••••••" className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner" />
                                </div>
                                <div className="flex items-center gap-4 bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                                    <input type="checkbox" id="isStaff" checked={newBiz.isStaff} onChange={e => setNewBiz({...newBiz, isStaff: e.target.checked})} className="w-5 h-5 accent-indigo-600" />
                                    <label htmlFor="isStaff" className="text-xs font-bold text-slate-700 leading-tight">İşletme sahibi aynı zamanda bir personel koltuğu kaplasın</label>
                                </div>
                                <div className="flex gap-4 mt-8">
                                    <button onClick={() => setModalStep(2)} className="flex-1 py-5 bg-slate-50 text-slate-400 rounded-2xl font-black text-[11px] uppercase tracking-widest">GERİ</button>
                                    <button onClick={handleSubmit} disabled={isCreating} className="flex-[2] py-5 bg-indigo-600 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30">
                                        {isCreating ? 'İŞLENİYOR...' : 'SİSTEMİ KUR VE TAMAMLA ✓'}
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
