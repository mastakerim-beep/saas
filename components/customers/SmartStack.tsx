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
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`flex-none w-48 p-5 rounded-[2rem] transition-all flex flex-col gap-4 relative overflow-hidden group
                ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white border border-gray-100 text-gray-900 hover:shadow-lg'}
            `}
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors
                ${active ? 'bg-white/20 text-white' : `${color} bg-opacity-10`}
            `}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white/60' : 'text-gray-400'}`}>{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black italic">{count}</span>
                    <span className={`text-[10px] font-bold ${active ? 'text-white/60' : 'text-gray-400'}`}>Kayıt</span>
                </div>
            </div>
            {!active && (
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <ArrowUpRight className="w-4 h-4 text-gray-300" />
                </div>
            )}
        </motion.button>
    );
}
