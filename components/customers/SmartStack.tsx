"use client";

import { motion } from 'framer-motion';
import { ArrowUpRight } from 'lucide-react';

interface SmartStackProps {
    icon: any;
    label: string;
    count: number;
    color: string;
    active: boolean;
    onClick: () => void;
}

export function SmartStack({ icon: Icon, label, count, color, active, onClick }: SmartStackProps) {
    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -4 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`flex-none w-48 p-6 rounded-[2.5rem] transition-all flex flex-col gap-4 relative overflow-hidden group
                ${active ? 'bg-indigo-600 text-white shadow-2xl shadow-indigo-600/30' : 'bg-white border border-gray-100 text-gray-900 hover:shadow-xl hover:border-indigo-100'}
            `}
        >
            {/* Background Accent */}
            <div className={`absolute inset-0 opacity-10 pointer-events-none ${active ? 'grid-pattern-dark' : 'grid-pattern'}`} />
            
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 group-hover:scale-110
                ${active ? 'bg-white/20 text-white backdrop-blur-md' : `${color} bg-opacity-10`}
            `}>
                <Icon className={`w-6 h-6 ${active ? 'animate-pulse' : ''}`} />
            </div>
            <div className="relative z-10">
                <p className={`text-[9px] font-black uppercase tracking-[0.2em] mb-1 ${active ? 'text-indigo-100' : 'text-gray-400'}`}>{label}</p>
                <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-black italic tracking-tighter">{count}</span>
                    <span className={`text-[9px] font-black uppercase tracking-widest ${active ? 'text-indigo-200' : 'text-gray-300'}`}>Kayıt</span>
                </div>
            </div>
            
            {active && (
                <motion.div 
                    layoutId="stack-active-indicator"
                    className="absolute bottom-0 left-0 right-0 h-1.5 bg-white/30 backdrop-blur-sm"
                />
            )}

            {!active && (
                <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                    <ArrowUpRight className="w-4 h-4 text-indigo-400" />
                </div>
            )}
        </motion.button>
    );
}
