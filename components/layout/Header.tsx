"use client";

import { useStore } from "@/lib/store";
import { Bell, Search, MapPin, Building2,
    LogOut, UserCircle, ShieldCheck, Home,
    Activity, Info
} from "lucide-react";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
    const { 
        currentUser, currentBusiness, currentBranch, branches, 
        isOnline, syncStatus, logout, setCurrentBranch, fetchData,
        runImperialAudit
    } = useStore();
    const router = useRouter();
    const params = useParams();
    const slug = params.slug;

    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showBranchMenu, setShowBranchMenu] = useState(false);
    const [showAuditMenu, setShowAuditMenu] = useState(false);

    if (!currentUser) return null;

    const auditAlerts = runImperialAudit ? runImperialAudit() : [];
    const criticalAuditCount = auditAlerts.filter(a => a.type === 'critical').length;

    return (
        <header className="h-[84px] bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-[100] antialiased shadow-sm transition-all duration-300">
            {/* Left: Branding or empty depending on sidebar */}
            <div className="flex items-center gap-4">
                {/* Logo can go here if sidebar is hidden, but usually sidebar has it */}
            </div>

            {/* Right Group: Search, Actions, Profile */}
            <div className="flex items-center gap-4 ml-auto">
                {/* 1. Dynamic Search */}
                <div className="relative group">
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" />
                    <input 
                        placeholder={`Ara (${currentBranch?.name || 'Tüm Şubeler'})`}
                        className="bg-indigo-50/50 border border-indigo-50 focus:border-indigo-500/50 focus:bg-white focus:ring-4 focus:ring-indigo-500/5 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold w-[400px] outline-none transition-all placeholder:text-indigo-200"
                    />
                </div>

                {/* 0. Imperial Audit (God Mode) */}
                <div className="relative">
                    <button 
                        onClick={() => setShowAuditMenu(!showAuditMenu)}
                        className={`relative p-3 rounded-2xl transition-all group ${showAuditMenu ? 'bg-indigo-50 text-indigo-600' : 'hover:bg-gray-50'}`}
                    >
                        <ShieldCheck className={`w-6 h-6 ${criticalAuditCount > 0 ? 'text-rose-500 animate-pulse' : 'text-gray-500 group-hover:text-indigo-600'}`} />
                        {auditAlerts.length > 0 && (
                            <div className={`absolute top-3 right-3 w-4 h-4 rounded-full border-2 border-white text-[8px] font-black flex items-center justify-center text-white ${criticalAuditCount > 0 ? 'bg-rose-500' : 'bg-indigo-500'}`}>
                                {auditAlerts.length}
                            </div>
                        )}
                    </button>

                    <AnimatePresence>
                        {showAuditMenu && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                className="absolute top-16 right-0 w-96 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl p-6 z-[200] overflow-hidden"
                            >
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <h3 className="font-black text-gray-900 leading-none">Imperial Audit</h3>
                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Sistem Denetim Merkezi</p>
                                    </div>
                                    <div className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full text-[10px] font-black uppercase tracking-tighter">
                                        CANLI
                                    </div>
                                </div>

                                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                    {auditAlerts.length === 0 ? (
                                        <div className="py-10 text-center opacity-40 italic flex flex-col items-center">
                                            <ShieldCheck className="w-12 h-12 mb-2 text-emerald-500" />
                                            <p className="text-sm font-bold">Sistemde herhangi bir operasyonel ihlal bulunmuyor.</p>
                                        </div>
                                    ) : (
                                        auditAlerts.map((alert, idx) => (
                                            <div key={idx} className={`p-4 rounded-2xl border-l-4 shadow-sm flex gap-4 ${
                                                alert.type === 'critical' 
                                                ? 'bg-rose-50 border-rose-500' 
                                                : alert.type === 'warning' 
                                                ? 'bg-amber-50 border-amber-500' 
                                                : 'bg-indigo-50 border-indigo-500'
                                            }`}>
                                                <div className="shrink-0 flex items-center justify-center mt-1">
                                                    {alert.type === 'critical' ? (
                                                        <Activity className="w-5 h-5 text-rose-500" />
                                                    ) : (
                                                        <Info className="w-5 h-5 text-amber-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <p className="font-black text-xs text-gray-900 mb-1">{alert.title}</p>
                                                    <p className="text-[11px] font-bold text-gray-600 leading-relaxed mb-2">{alert.desc}</p>
                                                    <button 
                                                        onClick={() => {
                                                            setShowAuditMenu(false);
                                                            if (alert.table === 'rooms') {
                                                                router.push(`/${slug}/calendar?view=room`);
                                                            } else {
                                                                router.push(`/${slug}/calendar?view=staff`);
                                                            }
                                                        }}
                                                        className={`text-[10px] font-black uppercase tracking-widest underline ${
                                                            alert.type === 'critical' ? 'text-rose-600' : 'text-indigo-600'
                                                        }`}
                                                    >
                                                        İncele / Çöz
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>

                                {auditAlerts.length > 0 && (
                                    <div className="mt-6 pt-6 border-t border-gray-50 text-center">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tüm ihlalleri gör (V3 Gelecek)</p>
                                    </div>
                                )}
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 2. Notifications */}
                <button className="relative p-3 hover:bg-gray-50 rounded-2xl transition-all group">
                    <Bell className="w-6 h-6 text-gray-500 group-hover:text-primary transition-colors" />
                    <div className="absolute top-3.5 right-3.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
                </button>

                {/* 3. Unique Branch Switcher (Home Icon Button) */}
                <div className="relative">
                    <button 
                        onClick={() => setShowBranchMenu(!showBranchMenu)}
                        className={`p-3 rounded-full border transition-all duration-300 shadow-xl ${showBranchMenu ? 'bg-indigo-950 border-indigo-950 text-white ring-4 ring-indigo-500/10 scale-110' : 'bg-white border-indigo-50 text-indigo-950 hover:border-indigo-500/50 hover:shadow-2xl shadow-indigo-100/30'}`}
                    >
                        <Home className="w-6 h-6" />
                    </button>

                    <AnimatePresence>
                        {showBranchMenu && (
                            <motion.div 
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                className="absolute top-16 right-0 w-80 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl p-4 z-[200] overflow-hidden"
                            >
                                <div className="p-6 bg-gray-50 rounded-[2rem] mb-3">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2 opacity-80">Şube Değiştirici</p>
                                    <p className="text-sm font-black text-gray-900 leading-tight">Şu an: <span className="text-primary">{currentBranch?.name || 'Tüm Şubeler'}</span></p>
                                </div>
                                <div className="space-y-1.5 px-1 py-1">
                                    {branches.map(br => (
                                        <button 
                                            key={br.id}
                                            onClick={() => {
                                                setCurrentBranch(br);
                                                localStorage.setItem('aura_last_branch', br.id);
                                                setShowBranchMenu(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all duration-300 ${
                                                currentBranch?.id === br.id 
                                                ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-500/20' 
                                                : 'text-indigo-950 hover:bg-indigo-50 hover:text-indigo-600'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`p-2 rounded-xl ${currentBranch?.id === br.id ? 'bg-white/20' : 'bg-primary/5'}`}>
                                                    <MapPin size={18} />
                                                </div>
                                                <span className="text-sm font-black tracking-tight">{br.name}</span>
                                            </div>
                                            {currentBranch?.id === br.id && <div className="w-2 h-2 bg-white rounded-full" />}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 4. User Avatar & Menu */}
                <div className="relative">
                    <div 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className="w-12 h-12 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full flex items-center justify-center text-white font-black text-sm cursor-pointer hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-100 border-4 border-white"
                    >
                        {currentUser.name?.substring(0, 2).toUpperCase()}
                    </div>

                    <AnimatePresence>
                        {showProfileMenu && (
                            <>
                                <div 
                                    className="fixed inset-0 z-[190] bg-transparent" 
                                    onClick={() => setShowProfileMenu(false)} 
                                />
                                <motion.div 
                                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                    onMouseLeave={() => setShowProfileMenu(false)}
                                    className="absolute top-16 right-0 w-80 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl p-4 z-[200] overflow-hidden"
                                >
                                    <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] text-white mb-3 shadow-lg shadow-indigo-100 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">YÖNETİCİ PANELİ</p>
                                            <p className="font-black text-xl tracking-tight mb-2 leading-none">{currentUser.name}</p>
                                            <div className="flex flex-col gap-1.5 pt-2 border-t border-white/10 mt-2">
                                                <div className="flex items-center gap-2 text-[10px] font-black opacity-80 uppercase">
                                                    <Building2 size={12} className="opacity-50" /> {currentBusiness?.name}
                                                </div>
                                                <div className="flex items-center gap-2 text-[10px] font-black opacity-80 uppercase">
                                                    <MapPin size={12} className="opacity-50" /> {currentBranch?.name}
                                                </div>
                                            </div>
                                            <div className="mt-4 inline-block px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest leading-none">
                                                {currentUser.role.replace('_', ' ')}
                                            </div>
                                        </div>
                                        <div className="absolute -right-6 -bottom-6 w-24 h-24 bg-white/10 rounded-full blur-2xl" />
                                    </div>
                                    <div className="space-y-1">
                                        <button 
                                            onClick={() => { router.push(`/${slug}/system?tab=business`); setShowProfileMenu(false); }}
                                            className="w-full flex items-center gap-4 p-4 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-3xl transition-all group"
                                        >
                                            <UserCircle className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" /> Profil Ayarları
                                        </button>
                                        <button 
                                            onClick={() => { router.push(`/${slug}/system?tab=security`); setShowProfileMenu(false); }}
                                            className="w-full flex items-center gap-4 p-4 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-3xl transition-all group"
                                        >
                                            <ShieldCheck className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" /> Şifre Değiştir
                                        </button>
                                        <button 
                                            onClick={() => { router.push(`/${slug}/system?tab=business`); setShowProfileMenu(false); }}
                                            className="w-full flex items-center gap-4 p-4 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-3xl transition-all group"
                                        >
                                            <Building2 className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" /> İşletme Bilgileri
                                        </button>
                                        <div className="h-px bg-gray-100 my-2 mx-2" />
                                        <button 
                                            onClick={logout}
                                            className="w-full flex items-center gap-4 p-4 text-xs font-black text-red-500 hover:bg-red-50 rounded-3xl transition-all"
                                        >
                                            <LogOut className="w-5 h-5" /> Güvenli Çıkış
                                        </button>
                                    </div>
                                </motion.div>
                            </>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
