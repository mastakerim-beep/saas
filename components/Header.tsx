"use client";

import { useStore } from "@/lib/store";
import { 
    Cloud, CloudOff, RefreshCcw, 
    ChevronDown, ShieldCheck, 
    Bell, Search, MapPin, Building2,
    LogOut, UserCircle
} from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function Header() {
    const { 
        currentUser, currentBusiness, currentBranch, branches, 
        isOnline, syncStatus, logout, setCurrentBranch, fetchData 
    } = useStore();
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [showBranchMenu, setShowBranchMenu] = useState(false);

    if (!currentUser) return null;

    return (
        <header className="h-[72px] bg-background/50 backdrop-blur-3xl border-b border-gray-100/50 flex items-center justify-between px-8 sticky top-0 z-[100] antialiased">
            {/* Search & Branch Selector */}
            <div className="flex items-center gap-6">
                <div className="relative group/branch">
                    <div 
                        onClick={() => branches.length > 1 && setShowBranchMenu(!showBranchMenu)}
                        className="flex items-center gap-3 bg-white/50 border border-gray-100 px-5 py-2.5 rounded-2xl cursor-pointer hover:bg-white hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 group"
                    >
                        <Building2 className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-gray-400 uppercase tracking-[0.1em]">{currentBusiness?.name}</span>
                            <span className="text-xs font-black text-gray-900 leading-none mt-0.5">{currentBranch?.name || 'Tüm Şubeler'}</span>
                        </div>
                        {branches.length > 1 && <ChevronDown className={`w-3.5 h-3.5 text-gray-400 ml-1 transition-transform duration-300 ${showBranchMenu ? 'rotate-180' : ''}`} />}
                    </div>

                    <AnimatePresence>
                        {showBranchMenu && (
                            <motion.div 
                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                className="absolute top-16 left-0 w-64 bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-3 z-[150] overflow-hidden"
                            >
                                <div className="p-4 bg-gray-50/50 rounded-2xl mb-2">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Şube Değiştir</p>
                                    <p className="text-xs font-black text-gray-900 tracking-tight">Geçiş yapmak istediğiniz şubeyi seçin.</p>
                                </div>
                                <div className="space-y-1 max-h-[300px] overflow-y-auto pr-1">
                                    {branches.map(br => (
                                        <button 
                                            key={br.id}
                                            onClick={() => {
                                                setCurrentBranch(br);
                                                setShowBranchMenu(false);
                                            }}
                                            className={`w-full flex items-center gap-3.5 p-3.5 text-xs font-black rounded-2xl transition-all duration-300 ${
                                                currentBranch?.id === br.id 
                                                ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                                                : 'text-gray-600 hover:bg-primary/5 hover:text-primary'
                                            }`}
                                        >
                                            <MapPin className="w-4 h-4" /> {br.name}
                                        </button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                <div className="relative group">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors duration-300" />
                    <input 
                        placeholder="Müşteri veya İşlem Ara..." 
                        className="bg-white/50 border border-gray-100 focus:border-primary/30 focus:bg-white focus:shadow-lg focus:shadow-primary/5 rounded-2xl pl-12 pr-6 py-2.5 text-[11px] font-black w-[280px] outline-none transition-all duration-300 placeholder:text-gray-300"
                    />
                </div>
            </div>

            {/* Sync & Connectivity Center */}
            <div className="flex items-center gap-6">
                <div className="flex items-center gap-6 border-r border-gray-100/50 pr-8">
                    <button 
                        onClick={() => fetchData(undefined, undefined, true)}
                        disabled={syncStatus === 'syncing'}
                        className="flex items-center gap-2.5 p-2 hover:bg-white rounded-xl transition-all duration-300 active:scale-95 group"
                    >
                        {syncStatus === 'syncing' ? (
                            <div className="flex items-center gap-2.5 text-primary animate-pulse">
                                <RefreshCcw className="w-4 h-4 animate-spin" />
                                <span className="text-[10px] font-black uppercase tracking-widest antialiased">Senkronize...</span>
                            </div>
                        ) : syncStatus === 'error' ? (
                            <div className="flex items-center gap-2.5 text-red-500">
                                <CloudOff className="w-4 h-4" />
                                <span className="text-[10px] font-black uppercase tracking-widest">Hata</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2.5 text-emerald-500 group-hover:text-primary">
                                <ShieldCheck className="w-4 h-4 group-hover:scale-110 transition-transform" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-60 group-hover:opacity-100">Güncel</span>
                            </div>
                        )}
                    </button>
                    
                    <div className="flex items-center gap-2.5">
                        <div className="relative flex h-2 w-2">
                            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${isOnline ? 'bg-emerald-400' : 'bg-red-400'} opacity-75`}></span>
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${isOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest antialiased">
                            {isOnline ? 'Online' : 'Offline'}
                        </span>
                    </div>
                </div>

                {/* User & Notifications */}
                <div className="flex items-center gap-5">
                    <button className="relative p-2.5 hover:bg-white hover:shadow-md rounded-xl transition-all duration-300 group">
                        <Bell className="w-5 h-5 text-gray-400 group-hover:text-primary" />
                        <div className="absolute top-3 right-3 w-1.5 h-1.5 bg-red-500 rounded-full border-2 border-white" />
                    </button>
                    
                    <div className="relative">
                        <div 
                            onClick={() => setShowProfileMenu(!showProfileMenu)}
                            className="flex items-center gap-4 pl-4 border-l border-gray-100 cursor-pointer hover:opacity-80 transition-all group"
                        >
                            <div className="text-right hidden lg:block">
                                <p className="text-xs font-black text-gray-900 leading-none">{currentUser.name}</p>
                                <span className="text-[9px] font-black text-primary uppercase bg-primary/10 px-2 py-0.5 rounded-full mt-1.5 inline-block tracking-wider">
                                    {currentUser.role.replace('_', ' ')}
                                </span>
                            </div>
                            <div className="w-10 h-10 bg-primary rounded-2xl flex items-center justify-center text-white font-black text-xs shadow-lg shadow-primary/20 group-hover:scale-105 transition-all duration-300 ring-4 ring-primary/5">
                                {currentUser.name.charAt(0)}
                            </div>
                        </div>

                        {/* Profile Dropdown */}
                        <AnimatePresence>
                            {showProfileMenu && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                                    className="absolute top-16 right-0 w-64 bg-white border border-gray-100 rounded-[2rem] shadow-2xl p-3 z-[150] overflow-hidden"
                                >
                                    <div className="p-4 bg-gray-50/50 rounded-2xl mb-2">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 opacity-60">Oturum Bilgisi</p>
                                        <p className="text-xs font-black text-gray-900 truncate tracking-tight">{currentUser.email}</p>
                                    </div>
                                    <button className="w-full flex items-center gap-3.5 p-3.5 text-xs font-black text-gray-600 hover:bg-primary/5 hover:text-primary rounded-2xl transition-all duration-300">
                                        <UserCircle className="w-4 h-4" /> Profil Ayarları
                                    </button>
                                    <button 
                                        onClick={logout}
                                        className="w-full flex items-center gap-3.5 p-3.5 text-xs font-black text-red-500 hover:bg-red-50 rounded-2xl transition-all duration-300 mt-1"
                                    >
                                        <LogOut className="w-4 h-4" /> Güvenli Çıkış
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </header>
    );
}
