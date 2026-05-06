import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Users, Shield, Briefcase, Zap, ChevronDown, Wallet, Calendar } from 'lucide-react';

export const CreateBusinessModal = ({ isOpen, onClose, onCreate, isCreating }: any) => {
    const [modalStep, setModalStep] = useState(1);
    const [newBiz, setNewBiz] = useState<any>({
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
        verticals: ['spa'] as string[],
        extraUsers: [] as { email: string, password: string, name: string }[]
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
                verticals: ['spa'],
                extraUsers: []
            });
        }
    };

    // Keyboard Listener for ESC
    React.useEffect(() => {
        const handleEsc = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleEsc);
        return () => window.removeEventListener('keydown', handleEsc);
    }, [onClose]);

    if (!isOpen) return null;

    const steps = [
        { id: 1, label: 'Kimlik', icon: <Briefcase size={16} /> },
        { id: 2, label: 'Finans', icon: <Wallet size={16} /> },
        { id: 3, label: 'Erişim', icon: <Users size={16} /> },
    ];

    return (
        <div 
            className="fixed inset-0 z-[200] flex items-center justify-center p-4 md:p-10 backdrop-blur-2xl bg-slate-950/80"
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-[#0a0b14] border border-white/10 rounded-[3rem] w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-[0_64px_128px_-24px_rgba(0,0,0,0.9)] relative flex flex-col text-left"
            >
                {/* Header - Fixed */}
                <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.02]">
                    <div className="space-y-6">
                        <div className="flex items-center gap-3">
                            {steps.map((s, idx) => (
                                <React.Fragment key={s.id}>
                                    <div className="flex items-center gap-3 group">
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-500 border ${
                                            modalStep >= s.id 
                                            ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' 
                                            : 'bg-white/5 border-white/10 text-slate-500'
                                        }`}>
                                            {modalStep > s.id ? <Check size={16} strokeWidth={3} /> : s.icon}
                                        </div>
                                        <span className={`text-[11px] font-black uppercase tracking-[0.15em] hidden md:block ${modalStep >= s.id ? 'text-white' : 'text-slate-600'}`}>
                                            {s.label}
                                        </span>
                                    </div>
                                    {idx < steps.length - 1 && (
                                        <div className={`h-[1px] w-6 rounded-full transition-all duration-500 ${modalStep > s.id ? 'bg-indigo-600' : 'bg-white/10'}`} />
                                    )}
                                </React.Fragment>
                            ))}
                        </div>
                        <div>
                            <h2 className="text-white text-2xl md:text-3xl font-black italic uppercase tracking-tighter leading-none">İmparatorluk Kurulumu</h2>
                            <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.4em] mt-3 flex items-center gap-2 opacity-80">
                                <Shield size={12} className="text-indigo-500" /> Sovereign Yetkilendirme Adımı {modalStep}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-slate-400 transition-all border border-white/10 group active:scale-95">
                        <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* Content - Scrollable */}
                <div className="p-8 md:p-10 overflow-y-auto no-scrollbar flex-1">
                    <div className="min-h-[300px]">
                        <AnimatePresence mode="wait">
                            {modalStep === 1 && (
                                <motion.div 
                                    key="step1"
                                    initial={{ opacity: 0, x: 20 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-8"
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">İşletme Adı</label>
                                            <input value={newBiz.name} onChange={e => setNewBiz({...newBiz, name: e.target.value})} placeholder="Aura Spa & Wellness" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-indigo-500 focus:bg-white/10 transition-all shadow-xl" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Domain Slug (URL)</label>
                                            <div className="relative group">
                                                <input value={newBiz.slug} onChange={e => setNewBiz({...newBiz, slug: e.target.value})} placeholder="aura-spa" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 pr-24 text-white font-bold outline-none focus:border-indigo-500 focus:bg-white/10 transition-all shadow-xl" />
                                                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 font-bold text-[11px] group-focus-within:text-indigo-400 transition-colors">.auraspa.io</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Node Limit (Koltuk)</label>
                                            <div className="relative">
                                                <input type="number" value={newBiz.seatCount} onChange={e => setNewBiz({...newBiz, seatCount: parseInt(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all" />
                                                <Users size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600" />
                                            </div>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Sektörel Paket</label>
                                            <div className="relative">
                                                <select 
                                                    value={newBiz.plan} 
                                                    onChange={e => setNewBiz({...newBiz, plan: e.target.value})}
                                                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                                >
                                                    <option value="Basic" className="bg-[#0a0b14]">Aura Basic</option>
                                                    <option value="Aura Enterprise" className="bg-[#0a0b14]">Imperial Enterprise</option>
                                                </select>
                                                <ChevronDown size={18} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-5">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">İmparatorluk Sektörleri</label>
                                        <div className="flex gap-4">
                                            {[
                                                { id: 'spa', label: 'SPA', color: 'bg-indigo-500' },
                                                { id: 'clinic', label: 'CLINIC', color: 'bg-emerald-500' },
                                                { id: 'fitness', label: 'GYM', color: 'bg-amber-500' }
                                            ].map(v => (
                                                <button 
                                                    key={v.id}
                                                    onClick={() => {
                                                        const next = newBiz.verticals.includes(v.id) 
                                                            ? newBiz.verticals.filter((x: any) => x !== v.id)
                                                            : [...newBiz.verticals, v.id];
                                                        if (next.length === 0) return;
                                                        setNewBiz({ ...newBiz, verticals: next });
                                                    }}
                                                    className={`flex-1 py-5 px-6 rounded-2xl border-2 transition-all group relative overflow-hidden ${
                                                        newBiz.verticals.includes(v.id)
                                                        ? 'border-indigo-600 bg-indigo-600/20'
                                                        : 'border-white/5 bg-white/[0.02] hover:border-white/10'
                                                    }`}
                                                >
                                                    <div className={`w-2 h-2 rounded-full absolute top-4 left-4 ${v.color} ${newBiz.verticals.includes(v.id) ? 'shadow-[0_0_12px_rgba(255,255,255,0.6)]' : 'opacity-20'}`} />
                                                    <span className={`text-[11px] font-black tracking-widest ${newBiz.verticals.includes(v.id) ? 'text-white' : 'text-slate-600'}`}>{v.label}</span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    <button onClick={() => setModalStep(2)} className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-[13px] uppercase tracking-[0.25em] shadow-[0_20px_40px_rgba(255,255,255,0.1)] hover:scale-[1.02] active:scale-95 transition-all mt-6">SONRAKİ AŞAMA: FİNANSAL VARLIKLAR</button>
                                </motion.div>
                            )}

                            {modalStep === 2 && (
                                <motion.div 
                                    key="step2"
                                    initial={{ opacity: 0, x: 20 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-8"
                                >
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Vergi Numarası</label>
                                            <input value={newBiz.taxId} onChange={e => setNewBiz({...newBiz, taxId: e.target.value})} placeholder="1234567890" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all shadow-xl" />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Vergi Dairesi</label>
                                            <input value={newBiz.taxOffice} onChange={e => setNewBiz({...newBiz, taxOffice: e.target.value})} placeholder="Global Office" className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all shadow-xl" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">MRR (₺) Aylık Katılım Payı</label>
                                        <div className="relative">
                                            <input type="number" value={newBiz.mrr} onChange={e => setNewBiz({...newBiz, mrr: parseFloat(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all" />
                                            <Zap size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-indigo-500 shadow-sm" />
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Vade/Sözleşme Sonu</label>
                                        <div className="relative">
                                            <input type="date" value={newBiz.expiryDate} onChange={e => setNewBiz({...newBiz, expiryDate: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all" />
                                            <Calendar size={16} className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" />
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-12">
                                        <button onClick={() => setModalStep(1)} className="flex-1 py-6 bg-white/5 text-slate-400 rounded-3xl font-black text-[12px] uppercase tracking-widest border border-white/10 hover:text-white transition-all">GERİ</button>
                                        <button onClick={() => setModalStep(3)} className="flex-[2] py-6 bg-indigo-600 text-white rounded-3xl font-black text-[12px] uppercase tracking-widest shadow-2xl shadow-indigo-600/40 hover:bg-indigo-500 transition-all">İLERİ: YETKİLENDİRME MATRİSİ</button>
                                    </div>
                                </motion.div>
                            )}

                            {modalStep === 3 && (
                                <motion.div 
                                    key="step3"
                                    initial={{ opacity: 0, x: 20 }} 
                                    animate={{ opacity: 1, x: 0 }} 
                                    exit={{ opacity: 0, x: -20 }}
                                    transition={{ duration: 0.3 }}
                                    className="space-y-6"
                                >
                                    <div className="space-y-6">
                                        <div className="max-h-[380px] overflow-y-auto pr-4 no-scrollbar space-y-4">
                                            {/* Main Owner */}
                                            <div className="bg-white/5 border border-white/10 p-8 rounded-[3rem] space-y-6 group">
                                                <p className="text-[11px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-3">
                                                    <div className="w-2 h-2 bg-indigo-400 rounded-full shadow-[0_0_12px_rgba(129,140,248,0.9)]" /> BİRİNCİL YÖNETİCİ KULLANICI (Sovereign)
                                                </p>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                    <input 
                                                        value={newBiz.email} 
                                                        onChange={e => setNewBiz({...newBiz, email: e.target.value})} 
                                                        placeholder="Yönetici E-postası" 
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all" 
                                                    />
                                                    <input 
                                                        type="password" 
                                                        value={newBiz.password} 
                                                        onChange={e => setNewBiz({...newBiz, password: e.target.value})} 
                                                        placeholder="Erişim Anahtarı (Şifre)" 
                                                        className="w-full bg-black/40 border border-white/10 rounded-2xl py-5 px-6 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all" 
                                                    />
                                                </div>
                                            </div>

                                            {/* Extra Users */}
                                            {newBiz.extraUsers?.map((user: any, idx: number) => (
                                                <motion.div 
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    key={idx} 
                                                    className="bg-white/[0.02] border border-white/5 p-8 rounded-[3rem] space-y-6 relative group"
                                                >
                                                    <button 
                                                        onClick={() => {
                                                            const next = [...newBiz.extraUsers];
                                                            next.splice(idx, 1);
                                                            setNewBiz({ ...newBiz, extraUsers: next });
                                                        }}
                                                        className="absolute top-8 right-8 text-slate-600 hover:text-rose-500 transition-colors"
                                                    >
                                                        <X size={20} />
                                                    </button>
                                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] flex items-center gap-3">
                                                        <div className="w-2 h-2 bg-slate-700 rounded-full" /> YARDIMCI KULLANICI DÜĞÜMÜ #{idx + 1}
                                                    </p>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                                        <input 
                                                            value={user.email} 
                                                            onChange={e => {
                                                                const next = [...newBiz.extraUsers];
                                                                next[idx].email = e.target.value;
                                                                setNewBiz({ ...newBiz, extraUsers: next });
                                                            }} 
                                                            placeholder="Kullanıcı E-postası" 
                                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-6 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all" 
                                                        />
                                                        <input 
                                                            type="password" 
                                                            value={user.password} 
                                                            onChange={e => {
                                                                const next = [...newBiz.extraUsers];
                                                                next[idx].password = e.target.value;
                                                                setNewBiz({ ...newBiz, extraUsers: next });
                                                            }} 
                                                            placeholder="Erişim Anahtarı" 
                                                            className="w-full bg-black/40 border border-white/5 rounded-2xl py-5 px-6 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all" 
                                                        />
                                                    </div>
                                                </motion.div>
                                            ))}

                                            <button 
                                                onClick={() => {
                                                    const next = [...(newBiz.extraUsers || []), { email: '', password: '', name: 'Ek Kullanıcı' }];
                                                    setNewBiz({ ...newBiz, extraUsers: next });
                                                }}
                                                className="w-full py-6 border-2 border-dashed border-white/10 rounded-[2.5rem] text-[11px] font-black text-slate-500 uppercase tracking-[0.4em] hover:border-indigo-600/40 hover:text-indigo-400 hover:bg-indigo-600/5 transition-all flex items-center justify-center gap-3 group"
                                            >
                                                <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-all">
                                                    <Users size={14} className="text-slate-600 group-hover:text-white" />
                                                </div>
                                                EK KULLANICI DÜĞÜMÜ TANIMLA
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-4 bg-indigo-600/10 p-6 rounded-[2.5rem] border border-indigo-600/20 mt-6">
                                        <div className="relative">
                                            <input type="checkbox" id="isStaff" checked={newBiz.isStaff} onChange={e => setNewBiz({...newBiz, isStaff: e.target.checked})} className="w-6 h-6 opacity-0 absolute cursor-pointer z-10" />
                                            <div className={`w-6 h-6 rounded-lg border-2 transition-all flex items-center justify-center ${newBiz.isStaff ? 'bg-indigo-600 border-indigo-600' : 'bg-slate-900 border-slate-700'}`}>
                                                {newBiz.isStaff && <Check size={14} strokeWidth={4} className="text-white" />}
                                            </div>
                                        </div>
                                        <label htmlFor="isStaff" className="text-[11px] font-bold text-slate-400 leading-tight uppercase tracking-[0.2em] select-none">Yetkili kullanıcılar otomatik olarak Personel havuzuna eklensin</label>
                                    </div>

                                    <div className="flex gap-4 mt-8">
                                        <button onClick={() => setModalStep(2)} className="flex-1 py-6 bg-white/5 text-slate-400 rounded-3xl font-black text-[12px] uppercase tracking-widest border border-white/10 hover:text-white transition-all">GERİ</button>
                                        <button onClick={handleSubmit} disabled={isCreating} className="flex-[2] py-6 bg-white text-black rounded-[2.5rem] font-black text-[13px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-50 transition-all active:scale-95">
                                            {isCreating ? 'YÜKLENİYOR...' : 'TAMAMLA VE ALTYAPIYI DAĞIT ✓'}
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};
