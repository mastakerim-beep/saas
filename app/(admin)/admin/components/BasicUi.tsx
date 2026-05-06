import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

export const StatCard = ({ title, value, icon: Icon, trend, color }: any) => {
    const colors: any = {
        indigo: 'bg-indigo-600 shadow-indigo-600/20',
        purple: 'bg-purple-600 shadow-purple-600/20',
        blue: 'bg-blue-600 shadow-blue-600/20',
        rose: 'bg-rose-600 shadow-rose-600/20'
    };
    
    return (
        <motion.div whileHover={{ y: -5 }} className="bg-white border border-indigo-100 rounded-[3rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-500/5">
            <div className={`w-16 h-16 ${colors[color] || colors.indigo} rounded-[1.5rem] flex items-center justify-center text-white mb-10 shadow-2xl`}>
                <Icon size={32} />
            </div>
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">{title}</p>
            <div className="flex items-end justify-between">
                <h3 className="text-4xl font-black text-slate-900 tracking-tighter italic">{value}</h3>
                <div className="flex items-center gap-1.5 text-[11px] font-black text-emerald-500 bg-emerald-50 px-3 py-1.5 rounded-xl">
                    <ArrowUpRight size={14} /> {trend}
                </div>
            </div>
        </motion.div>
    );
};

export const MetricBox = ({ label, value, trend }: any) => (
    <div className="p-8 bg-slate-50 border border-slate-100 rounded-[2.5rem] group hover:border-indigo-200 transition-all hover:bg-white hover:shadow-lg">
        <p className="text-[11px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2 group-hover:text-indigo-400 transition-colors">{label}</p>
        <div className="flex items-center justify-between">
            <p className="text-2xl font-black text-slate-900 italic tracking-tighter">{value}</p>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg uppercase tracking-widest ${trend === 'Stabil' || trend === 'Nominal' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {trend}
            </span>
        </div>
    </div>
);

export const NavBtn = ({ id, active, onClick, icon: Icon, label, badge }: any) => (
    <button 
        onClick={() => onClick(id)}
        className={`group relative flex items-center gap-5 px-6 py-4.5 rounded-[1.5rem] font-black text-[12px] uppercase tracking-[0.15em] transition-all ${
            active === id 
            ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-600/5 border border-indigo-100 py-5' 
            : 'text-slate-400 hover:text-slate-900 hover:bg-white/50'
        }`}
    >
        {active === id && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-indigo-600/5 rounded-[1.5rem] blur-2xl" />}
        <Icon size={20} className={active === id ? 'text-indigo-600' : 'group-hover:translate-x-1 transition-transform'} />
        {label}
        {badge && (
            <span className={`ml-auto px-2.5 py-1 rounded-xl text-[10px] font-black tracking-normal ${
                active === id ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
            }`}>
                {badge}
            </span>
        )}
    </button>
);
