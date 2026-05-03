"use client";

import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';

interface MenuItem {
    id: string;
    label: string;
    icon: any;
}

interface CustomerProfileSidebarProps {
    menuItems: MenuItem[];
    activeMenu: string;
    setActiveMenu: (id: string) => void;
    isSidebarCollapsed: boolean;
    setIsSidebarCollapsed: (v: boolean) => void;
    onClose: () => void;
}

export function CustomerProfileSidebar({
    menuItems,
    activeMenu,
    setActiveMenu,
    isSidebarCollapsed,
    setIsSidebarCollapsed,
    onClose
}: CustomerProfileSidebarProps) {
    return (
        <motion.div 
            animate={{ width: isSidebarCollapsed ? 88 : 280 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            onMouseEnter={() => setIsSidebarCollapsed(false)}
            onMouseLeave={() => setIsSidebarCollapsed(true)}
            className="bg-white border-r border-gray-100 flex flex-col p-6 sticky top-0 h-full overflow-hidden group/sbar z-[60]"
        >
            <div className="flex items-center justify-between mb-10">
                {!isSidebarCollapsed && (
                    <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-5 h-5" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Geri Dön</span>
                    </button>
                )}
                {isSidebarCollapsed && (
                    <button onClick={onClose} className="mx-auto text-gray-400 hover:text-indigo-600 transition-colors">
                        <ArrowLeft className="w-5 h-5 shadow-sm" />
                    </button>
                )}
            </div>

            <div 
                className={`absolute top-24 -right-1 w-2 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center transition-all ${isSidebarCollapsed ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="w-1 h-8 bg-indigo-600/30 rounded-full" />
            </div>
            
            <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
                {menuItems.map(item => (
                    <button
                        key={item.id}
                        onClick={() => setActiveMenu(item.id)}
                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm
                            ${activeMenu === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:bg-gray-50'}
                            ${isSidebarCollapsed ? 'justify-center border-none shadow-none' : ''}
                        `}
                    >
                        <item.icon className={`w-4 h-4 shrink-0 ${activeMenu === item.id ? 'text-white' : 'text-gray-400'}`} />
                        {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                    </button>
                ))}
            </div>
        </motion.div>
    );
}
