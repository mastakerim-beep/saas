import React, { useMemo, useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Zap, Settings as SettingsIcon, X, RefreshCw } from 'lucide-react';
import { useStore } from '@/lib/store';

export const TenantCard = ({ biz, onImpersonate, onDelete, onToggleStatus, onEdit, isLoading }: any) => {
    const { renewSubscription } = useStore();
    const isActive = biz.status === 'active' || biz.status === 'Aktif';
    
    const daysLeft = useMemo(() => {
        if (!biz.expiryDate) return null;
        const diff = new Date(biz.expiryDate).getTime() - Date.now();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    }, [biz.expiryDate]);

    const isNearExpiry = daysLeft !== null && daysLeft < 5;
    const isOverdue = daysLeft !== null && daysLeft < 0;

    return (
        <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-8 group hover:border-indigo-500/50 transition-all flex flex-col justify-between h-[420px] shadow-sm hover:shadow-xl relative overflow-hidden text-left">
            {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-indigo-600" size={24} />
                </div>
            )}
            
            {biz.is_suspended && (
                <div className="absolute top-4 right-20 bg-rose-600 text-white text-[8px] font-black px-3 py-1.5 rounded-lg -rotate-12 shadow-2xl z-20 border-2 border-rose-500">MÜHÜRLÜ</div>
            )}

            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-black italic">
                        {biz.name.charAt(0)}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={onToggleStatus}
                            className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-emerald-100 text-emerald-600 hover:bg-amber-100 hover:text-amber-600' : 'bg-amber-100 text-amber-600 hover:bg-emerald-100 hover:text-emerald-600'}`}
                        >
                            {isActive ? 'AKTİF' : 'PASİF'}
                        </button>
                        <button 
                            onClick={onDelete}
                            className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            title="İşletmeyi Sil"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
                
                <h4 className="text-slate-900 text-xl font-black italic tracking-tighter line-clamp-1">{biz.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">/{biz.slug}</p>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                     <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-300 uppercase">PLAN</span>
                         <span className="text-[10px] font-black text-indigo-600 uppercase truncate">{biz.plan || 'Basic'}</span>
                     </div>
                     <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-300 uppercase">KOLTUK</span>
                         <span className="text-[10px] font-black text-slate-900 uppercase">{biz.maxUsers || 5} Node</span>
                     </div>
                </div>

                <div className={`p-4 rounded-2xl border ${isOverdue ? 'bg-rose-50 border-rose-100' : isNearExpiry ? 'bg-amber-50 border-amber-100' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-[8px] font-black text-slate-400 uppercase">KALAN SÜRE</span>
                        <span className={`text-[9px] font-black ${isOverdue ? 'text-rose-600' : isNearExpiry ? 'text-amber-600' : 'text-indigo-600'}`}>
                            {daysLeft !== null ? (isOverdue ? `${Math.abs(daysLeft)} GÜN GEÇTİ` : `${daysLeft} GÜN`) : 'BELİRSİZ'}
                        </span>
                    </div>
                    <div className="h-1 bg-white rounded-full overflow-hidden">
                        <motion.div initial={{ width: 0 }} animate={{ width: daysLeft !== null ? `${Math.max(0, Math.min(100, (daysLeft / 30) * 100))}%` : '0%' }} className={`h-full ${isOverdue ? 'bg-rose-500' : isNearExpiry ? 'bg-amber-500' : 'bg-indigo-600'}`} />
                    </div>
                </div>
            </div>
            
            <div className="space-y-2 mt-6">
                <div className="flex gap-2">
                    <button 
                        onClick={onImpersonate}
                        className="flex-1 py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all"
                    >
                        <Zap size={12} className="fill-current" /> GOD MODE
                    </button>
                    <button 
                        onClick={onEdit}
                        className="flex-1 py-4 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-50 transition-all"
                    >
                        <SettingsIcon size={12} /> YÖNET
                    </button>
                </div>
            </div>
        </div>
    );
};

export const EditBusinessModal = ({ biz, onClose, onUpdate, loading }: any) => {
    const [localBiz, setLocalBiz] = useState<any>(null);

    useEffect(() => {
        if (biz) setLocalBiz({ ...biz });
    }, [biz]);

    if (!biz || !localBiz) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-left">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-white border border-indigo-100 rounded-[2.5rem] w-full max-w-xl overflow-hidden shadow-2xl"
            >
                <div className="p-10 space-y-8">
                    <div className="flex justify-between items-center">
                        <div>
                            <h2 className="text-slate-900 text-2xl font-black italic uppercase tracking-tighter">İşletme Yönetimi</h2>
                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">{biz.name}</p>
                        </div>
                        <button onClick={onClose} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Abonelik Planı</label>
                            <select 
                                value={localBiz.plan || 'Basic'} 
                                onChange={e => setLocalBiz({...localBiz, plan: e.target.value})}
                                className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all appearance-none"
                            >
                                <option value="Basic">Basic</option>
                                <option value="Aura Enterprise">Aura Enterprise</option>
                            </select>
                        </div>
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Koltuk (Node) Limiti</label>
                            <input 
                                type="number" 
                                value={localBiz.maxUsers || 5} 
                                onChange={e => setLocalBiz({...localBiz, maxUsers: parseInt(e.target.value)})}
                                className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all"
                            />
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Tolerans Süresi (Grace Period)</label>
                        <input 
                            type="date" 
                            value={localBiz.grace_period_until ? localBiz.grace_period_until.split('T')[0] : ''} 
                            onChange={e => setLocalBiz({...localBiz, grace_period_until: e.target.value})}
                            className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all"
                        />
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
                                        const currentVents = localBiz.verticals || ['spa'];
                                        const next = currentVents.includes(v.id) 
                                            ? currentVents.filter((x: string) => x !== v.id)
                                            : [...currentVents, v.id];
                                        if (next.length === 0) return;
                                        setLocalBiz({ ...localBiz, verticals: next });
                                    }}
                                    className={`flex-1 py-3 px-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                                        (localBiz.verticals || ['spa']).includes(v.id)
                                        ? 'border-indigo-600 bg-indigo-50/50'
                                        : 'border-slate-100 bg-white'
                                    }`}
                                >
                                    <div className={`w-3 h-3 rounded-full ${v.color} ${(localBiz.verticals || ['spa']).includes(v.id) ? 'scale-125' : 'opacity-40'}`} />
                                    <span className={`text-[9px] font-black tracking-widest ${(localBiz.verticals || ['spa']).includes(v.id) ? 'text-indigo-950' : 'text-slate-400'}`}>{v.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6">
                         <div className="flex items-center justify-between bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
                            <div>
                                <p className="text-[11px] font-black text-rose-900 uppercase">HESABI ASKIYA AL</p>
                                <p className="text-[9px] font-bold text-rose-400 uppercase tracking-wider">Sistem Mührünü Manuel Aktif Et</p>
                            </div>
                            <button 
                                onClick={() => setLocalBiz({...localBiz, is_suspended: !localBiz.is_suspended})}
                                className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${localBiz.is_suspended ? 'bg-rose-600 text-white' : 'bg-white text-rose-600 border border-rose-200'}`}
                            >
                                {localBiz.is_suspended ? 'ASKIYA ALINDI' : 'ASKIYA AL'}
                            </button>
                         </div>
                    </div>

                    <button 
                        onClick={() => onUpdate(biz.id, { 
                            plan: localBiz.plan, 
                            maxUsers: localBiz.maxUsers, 
                            grace_period_until: localBiz.grace_period_until, 
                            is_suspended: localBiz.is_suspended,
                            verticals: localBiz.verticals || ['spa']
                        })}
                        disabled={loading}
                        className="w-full py-6 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/40 hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                        {loading ? 'GÜNCELLENİYOR...' : 'DEĞİŞİKLİKLERİ KAYDET ✓'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
