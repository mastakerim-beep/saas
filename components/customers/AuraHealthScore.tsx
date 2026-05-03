"use client";

import { useMemo } from 'react';
import { Activity } from 'lucide-react';
import { Customer, Appointment, Payment } from '@/lib/store';

interface AuraHealthScoreProps {
    customer: Customer;
    appointments: Appointment[];
    payments: Payment[];
}

export function AuraHealthScore({ customer, appointments, payments }: AuraHealthScoreProps) {
    const score = useMemo(() => {
        let s = 5;
        if (customer.segment === 'VIP') s += 2;
        if (payments.length > 5) s += 1;
        const totalSpent = payments.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
        if (totalSpent > 10000) s += 1;
        const lastAppt = appointments[0];
        if (lastAppt) {
            const daysSince = (new Date().getTime() - new Date(lastAppt.date).getTime()) / (1000 * 3600 * 24);
            if (daysSince < 30) s += 1;
            if (daysSince > 90) s -= 2;
        }
        return Math.max(1, Math.min(10, s));
    }, [customer, appointments, payments]);

    const color = score > 7 ? 'text-green-500' : score > 4 ? 'text-indigo-500' : 'text-orange-500';

    return (
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
            <Activity className={`w-3.5 h-3.5 ${color}`} />
            <span className={`text-[10px] font-black uppercase tracking-tighter ${color}`}>Aura Score: {score}/10</span>
        </div>
    );
}
