"use client";

import { useStore } from "@/lib/store";
import { 
    Bell, Search, MapPin, Building2,
    LogOut, UserCircle, ShieldCheck, Home
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
        <header className="h-[84px] bg-white border-b border-gray-100 flex items-center justify-between px-10 sticky top-0 z-[100] antialiased shadow-sm transition-all duration-300">
            {/* Left: Branding or empty depending on sidebar */}
            <div className="flex items-center gap-4">
                {/* Logo can go here if sidebar is hidden, but usually sidebar has it */}
            </div>

            {/* Right Group: Search, Actions, Profile */}
            <div className="flex items-center gap-4 ml-auto">
                {/* 1. Dynamic Search */}
                <div className="relative group">
                    <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" />
                    <input 
                        placeholder={`Ara (${currentBranch?.name || 'Tüm Şubeler'})`}
                        className="bg-gray-50/80 border border-gray-100 focus:border-primary/50 focus:bg-white focus:ring-4 focus:ring-primary/5 rounded-2xl pl-12 pr-6 py-3 text-sm font-bold w-[400px] outline-none transition-all placeholder:text-gray-400"
                    />
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
                        className={`p-3 rounded-full border transition-all duration-300 shadow-lg ${showBranchMenu ? 'bg-primary border-primary text-white ring-4 ring-primary/10' : 'bg-white border-gray-100 text-gray-600 hover:border-primary/50 hover:shadow-xl'}`}
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
                                                setShowBranchMenu(false);
                                            }}
                                            className={`w-full flex items-center justify-between p-4 rounded-3xl transition-all duration-300 ${
                                                currentBranch?.id === br.id 
                                                ? 'bg-primary text-white shadow-xl shadow-primary/20' 
                                                : 'text-gray-600 hover:bg-gray-50 hover:text-primary'
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
                            <motion.div 
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                className="absolute top-16 right-0 w-72 bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl p-4 z-[200] overflow-hidden"
                            >
                                <div className="p-6 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[2rem] text-white mb-3 shadow-lg shadow-indigo-100">
                                    <p className="text-[10px] font-black opacity-60 uppercase tracking-[0.2em] mb-1">Yönetici Paneli</p>
                                    <p className="font-black text-lg tracking-tight mb-1">{currentUser.name}</p>
                                    <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[9px] font-black uppercase tracking-widest">{currentUser.role.replace('_', ' ')}</div>
                                </div>
                                <div className="space-y-1">
                                    <button className="w-full flex items-center gap-4 p-4 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-3xl transition-all">
                                        <UserCircle className="w-5 h-5 text-gray-400" /> Profil Ayarları
                                    </button>
                                    <button className="w-full flex items-center gap-4 p-4 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-3xl transition-all">
                                        <ShieldCheck className="w-5 h-5 text-gray-400" /> Şifre Değiştir
                                    </button>
                                    <button className="w-full flex items-center gap-4 p-4 text-xs font-black text-gray-700 hover:bg-gray-50 rounded-3xl transition-all">
                                        <Building2 className="w-5 h-5 text-gray-400" /> İşletme Bilgileri
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
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </header>
    );
}
