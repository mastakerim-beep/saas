"use client";

import { useDraggable } from '@dnd-kit/core';
import { ChevronRight, Star } from 'lucide-react';
import { Customer } from '@/lib/store';

interface DraggableCustomerCardProps {
    customer: Customer;
    onClick?: () => void;
}

export default function DraggableCustomerCard({ customer, onClick }: DraggableCustomerCardProps) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: `customer-${customer.id}`,
        data: { type: 'customer', customer },
    });

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 999,
        opacity: 0.85,
    } : undefined;

    return (
        <div
            ref={setNodeRef}
            style={style}
            {...listeners}
            {...attributes}
            onClick={(e) => {
                e.stopPropagation();
                onClick?.();
            }}
            className={`
                flex items-center gap-3 p-4 bg-white border-2 rounded-[1.5rem] cursor-grab active:cursor-grabbing transition-all select-none relative group
                ${isDragging ? 'border-indigo-500/50 shadow-2xl shadow-indigo-500/10 scale-105' : 'border-gray-50 hover:border-indigo-500/30 hover:bg-gray-50'}
            `}
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-sm flex-shrink-0
                ${customer.segment === 'VIP' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                {customer.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                    <p className="font-black text-xs text-gray-900 truncate group-hover:text-indigo-600 transition-colors">{customer.name}</p>
                    {customer.segment === 'VIP' && <Star className="w-3 h-3 text-amber-500 fill-amber-500 flex-shrink-0" />}
                </div>
                <p className="text-[10px] text-gray-500 font-bold truncate">{customer.phone}</p>
            </div>
            <div className="opacity-0 group-hover:opacity-100 transition-opacity p-2 bg-gray-50 rounded-xl">
                <ChevronRight className="w-3.5 h-3.5 text-indigo-600" />
            </div>
            {customer.isChurnRisk && (
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 flex-shrink-0 animate-pulse border-2 border-white" title="Kayıp riski" />
            )}
        </div>
    );
}
