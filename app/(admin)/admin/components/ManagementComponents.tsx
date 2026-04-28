import React, { useMemo, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Settings as SettingsIcon, X, RefreshCw, Shield, Users, Calendar, Fingerprint } from 'lucide-react';
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
    const { allUsers } = useStore();
    const [localBiz, setLocalBiz] = useState<any>(null);

    useEffect(() => {
        if (biz) setLocalBiz({ ...biz });
    }, [biz]);

    if (!biz || !localBiz) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 backdrop-blur-xl bg-slate-950/60 text-left">
            <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-[#0f111a] border border-white/5 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative"
            >
                {/* Neon Background Accents */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-600/10 blur-[100px] -z-10" />
                
                <div className="p-12">
                    <div className="flex justify-between items-start mb-10">
                        <div>
                            <h2 className="text-white text-3xl font-black italic uppercase tracking-tighter leading-none">İşletme Yönetimi</h2>
                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-3 flex items-center gap-2">
                                <Shield size={12} /> Imperial Control: {biz.name}
                            </p>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-slate-400 transition-all border border-white/5 group">
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                        {/* Settings Form */}
                        <div className="space-y-8">
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Abonelik Planı</label>
                                    <select 
                                        value={localBiz.plan || 'Basic'} 
                                        onChange={e => setLocalBiz({...localBiz, plan: e.target.value})}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                                    >
                                        <option value="Basic" className="bg-[#0f111a]">Aura Basic</option>
                                        <option value="Aura Enterprise" className="bg-[#0f111a]">Imperial Enterprise</option>
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Node Limiti</label>
                                    <input 
                                        type="number" 
                                        value={localBiz.maxUsers || 5} 
                                        onChange={e => setLocalBiz({...localBiz, maxUsers: parseInt(e.target.value)})}
                                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 flex items-center gap-2">
                                    <Calendar size={12} /> Tolerans Süresi (Grace Period)
                                </label>
                                <input 
                                    type="date" 
                                    value={localBiz.grace_period_until ? localBiz.grace_period_until.split('T')[0] : ''} 
                                    onChange={e => setLocalBiz({...localBiz, grace_period_until: e.target.value})}
                                    className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all"
                                />
                            </div>

                            <div className="space-y-5">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Active Kingdoms</label>
                                <div className="flex gap-2">
                                    {[
                                        { id: 'spa', label: 'SPA', color: 'bg-indigo-500' },
                                        { id: 'clinic', label: 'CLINIC', color: 'bg-emerald-500' },
                                        { id: 'fitness', label: 'GYM', color: 'bg-amber-500' }
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
                                            className={`flex-1 py-3 rounded-xl border transition-all text-[9px] font-black tracking-widest flex items-center justify-center gap-2 ${
                                                (localBiz.verticals || ['spa']).includes(v.id)
                                                ? 'border-white/20 bg-white/10 text-white'
                                                : 'border-white/5 bg-transparent text-slate-600'
                                            }`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${v.color} ${(localBiz.verticals || ['spa']).includes(v.id) ? 'shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'opacity-20'}`} />
                                            {v.label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className={`p-6 rounded-[2rem] border transition-all ${localBiz.is_suspended ? 'bg-rose-950/20 border-rose-500/30' : 'bg-slate-900/40 border-white/5'}`}>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className={`text-[10px] font-black uppercase tracking-widest ${localBiz.is_suspended ? 'text-rose-500' : 'text-slate-400'}`}>
                                            {localBiz.is_suspended ? 'SİSTEM MÜHÜRLÜ' : 'SİSTEM AKTİF'}
                                        </p>
                                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-wider mt-1">PROTOKOL-X ERİŞİM ENGELİ</p>
                                    </div>
                                    <button 
                                        onClick={() => setLocalBiz({...localBiz, is_suspended: !localBiz.is_suspended})}
                                        className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${localBiz.is_suspended ? 'bg-rose-600 text-white shadow-[0_0_20px_rgba(225,29,72,0.4)]' : 'bg-white/5 text-slate-400 border border-white/5 hover:bg-white/10'}`}
                                    >
                                        {localBiz.is_suspended ? 'MÜHÜRÜ KALDIR' : 'MÜHÜRLE'}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* User Management */}
                        <div className="bg-black/20 border border-white/5 rounded-[2.5rem] p-8 space-y-6">
                            <div className="flex justify-between items-center">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    <Users size={12} /> Node Matrix Users
                                </label>
                                <span className="bg-indigo-600/20 text-indigo-400 px-3 py-1 rounded-full text-[8px] font-black border border-indigo-500/20">
                                    {localBiz.maxUsers || 5} MAX
                                </span>
                            </div>
                            
                            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 no-scrollbar">
                                {(allUsers || []).filter((u: any) => u.businessId === biz.id).map((user: any) => (
                                    <div key={user.id} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl flex justify-between items-center group hover:bg-white/[0.04] transition-all">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-indigo-600/20 border border-indigo-500/20 rounded-lg flex items-center justify-center text-[10px] font-black text-indigo-400">
                                                {user.name?.charAt(0) || 'U'}
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-white leading-tight">{user.name}</p>
                                                <p className="text-[8px] font-bold text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                        <div className="px-3 py-1 bg-white/5 border border-white/5 rounded-lg text-[7px] font-black text-slate-400 uppercase tracking-widest">
                                            {user.role}
                                        </div>
                                    </div>
                                ))}

                                <div className="mt-6 pt-6 border-t border-dashed border-white/10 space-y-4">
                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                                        <Fingerprint size={12} /> DEPLOY NEW AUTH NODE
                                    </p>
                                    <div className="grid grid-cols-1 gap-3">
                                        <input 
                                            id="new_user_email"
                                            placeholder="Node E-mail" 
                                            className="bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-[10px] font-bold text-white outline-none focus:border-indigo-500 transition-all" 
                                        />
                                        <input 
                                            type="password" 
                                            id="new_user_pass"
                                            placeholder="Access Key" 
                                            className="bg-black/40 border border-white/5 rounded-xl py-3 px-4 text-[10px] font-bold text-white outline-none focus:border-indigo-500 transition-all" 
                                        />
                                    </div>
                                    <button 
                                        onClick={async () => {
                                            const email = (document.getElementById('new_user_email') as HTMLInputElement).value;
                                            const pass = (document.getElementById('new_user_pass') as HTMLInputElement).value;
                                            if (!email || !pass) return alert("E-posta ve şifre gerekli.");
                                            
                                            const { provisionBusinessUser, fetchData } = useStore();
                                            const res = await provisionBusinessUser({
                                                email,
                                                password: pass,
                                                name: "Yeni Kullanıcı",
                                                businessId: biz.id,
                                                isStaff: true
                                            });
                                            if (res.success) {
                                                alert("Kullanıcı başarıyla eklendi.");
                                                await fetchData(undefined, undefined, true);
                                            } else {
                                                alert("Hata: " + res.error);
                                            }
                                        }}
                                        className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest shadow-lg shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                                    >
                                        INITIALIZE NODE ACCESS
                                    </button>
                                </div>
                            </div>
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
                        className="w-full py-6 bg-white text-black rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-indigo-50 transition-all mt-10"
                    >
                        {loading ? 'DEPLOYING UPDATES...' : 'FINALIZE ALL CHANGES ✓'}
                    </button>
                </div>
            </motion.div>
        </div>
    );
};
