"use client";

import { useDroppable } from '@dnd-kit/core';

interface TimeSlotProps {
    staffId?: string;
    roomId?: string;
    time: string;
    isOff: boolean;
    onAdd: (data: { staffId?: string, roomId?: string, time: string }) => void;
    onSelectionStart: (id: string, t: string) => void;
    onSelectionEnter: (t: string) => void;
    isSelected: boolean;
}

export default function TimeSlot({ 
    staffId, roomId, time, isOff, onAdd, onSelectionStart, onSelectionEnter, isSelected 
}: TimeSlotProps) {
    const isHourStart = time.endsWith(':00');
    const { isOver, setNodeRef } = useDroppable({
        id: `slot-${staffId || roomId}-${time}`,
        data: { type: 'slot', staffId, roomId, time },
        disabled: isOff
    });

    return (
        <div 
            ref={setNodeRef}
            onMouseDown={(e) => {
                if (!isOff && e.button === 0) onSelectionStart(staffId || roomId || '', time);
            }}
            onMouseEnter={() => {
                if (!isOff) onSelectionEnter(time);
            }}
            onClick={() => {
                if (!isOff) onAdd({ staffId, roomId, time });
            }}
            className={`
                h-[42px] border-r border-gray-100/30 transition-all relative box-border
                ${isHourStart ? 'border-t-[2px] border-t-indigo-100/50' : 'border-t border-t-gray-100/50 border-dashed'}
                ${isOff ? 'bg-indigo-50/20 cursor-not-allowed opacity-40' : (isOver ? 'bg-indigo-50/50 border-2 border-indigo-400 z-30 scale-[1.01] shadow-xl shadow-indigo-100/50' : 'hover:bg-indigo-50/10 cursor-pointer')}
                ${isSelected ? 'bg-indigo-600/10 ring-2 ring-indigo-500/30 z-20' : ''}
            `}
        >
            {isOver && !isOff && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-0.5 bg-indigo-600/30" />
                    <div className="absolute bg-indigo-600 text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg shadow-indigo-600/20">{time}</div>
                </div>
            )}
            {isOff && time.endsWith(':30') && (
                <div className="absolute inset-0 flex items-center justify-center opacity-10 rotate-[-15deg]">
                    <span className="text-[10px] font-black text-white border border-white px-2 py-0.5 rounded uppercase">İzinli</span>
                </div>
            )}
        </div>
    );
}
