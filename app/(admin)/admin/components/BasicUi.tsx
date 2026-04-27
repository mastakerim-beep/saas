import React from 'react';
import { motion } from 'framer-motion';
import { LucideIcon, ArrowUpRight } from 'lucide-react';

export const StatCard = ({ title, value, icon: Icon, trend, color }: any) => {
    const colors: any = {
        indigo: 'bg-indigo-600 shadow-indigo-600/20',
        purple: 'bg-purple-600 shadow-purple-600/20',
        blue: 'bg-blue-600 shadow-blue-600/20'
    };
    
    return (
        <motion.div whileHover={{ y: -5 }} className="bg-white border border-indigo-100 rounded-[2.5rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-500/5">
            <div className={`w-14 h-14 ${colors[color]} rounded-2xl flex items-center justify-center text-white mb-8 shadow-2xl`}>
                <Icon size={28} />
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{title}</p>
            <div className="flex items-end justify-between">
                <h3 className="text-3xl font-black text-slate-900 tracking-tighter">{value}</h3>
                <div className="flex items-center gap-1 text-[10px] font-black text-emerald-500 bg-emerald-50 px-2.5 py-1 rounded-lg">
                    <ArrowUpRight size={12} /> {trend}
                </div>
            </div>
        </motion.div>
    );
};

export const MetricBox = ({ label, value, trend }: any) => (
    <div className="p-6 bg-slate-50 border border-slate-100 rounded-3xl group hover:border-indigo-200 transition-all">
        <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 group-hover:text-indigo-400 transition-colors">{label}</p>
        <div className="flex items-center justify-between">
            <p className="text-xl font-black text-slate-900">{value}</p>
            <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${trend === 'Stabil' || trend === 'Nominal' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-600'}`}>
                {trend}
            </span>
        </div>
    </div>
);

export const NavBtn = ({ id, active, onClick, icon: Icon, label, badge }: any) => (
    <button 
        onClick={() => onClick(id)}
        className={`group relative flex items-center gap-4 px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
            active === id 
            ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-600/5 border border-indigo-100' 
            : 'text-slate-400 hover:text-slate-600 hover:bg-slate-50'
        }`}
    >
        {active === id && <motion.div layoutId="nav-glow" className="absolute inset-0 bg-indigo-600/5 rounded-2xl blur-xl" />}
        <Icon size={18} className={active === id ? 'text-indigo-600' : 'group-hover:translate-x-1 transition-transform'} />
        {label}
        {badge && (
            <span className={`ml-auto px-2 py-0.5 rounded-lg text-[8px] font-black ${
                active === id ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'
            }`}>
                {badge}
            </span>
        )}
    </button>
);
