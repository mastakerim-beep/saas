"use client";

import { useState, useEffect } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ShieldCheck, Activity, Ban, Coffee, GripVertical, Trash2, Loader2, Star } from 'lucide-react';
import { useStore, Appointment, CalendarBlock, AppointmentStatus } from '@/lib/store';

const SLOT_MINUTES = 15;
const SLOT_HEIGHT = 42;
const PX_PER_MIN = SLOT_HEIGHT / 15;

const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE');
};

interface CalendarItemProps {
    item: Appointment | CalendarBlock;
    type: 'appt' | 'block';
    onCheckout?: (a: Appointment) => void;
    onAction?: (a: Appointment) => void;
    onResizeStart?: (id: string, initialDuration: number) => void;
    onResizeUpdate?: (id: string, currentDuration: number) => void;
    onResizeEnd?: () => void;
}

export default function CalendarItem({ 
    item, type, onCheckout, onAction, onResizeStart, onResizeUpdate, onResizeEnd 
}: CalendarItemProps) {
    const { currentUser, deleteAppointment, updateAppointmentStatus, updateAppointment, updateBlock, removeBlock, rooms, packages, branches, currentBranch, customers } = useStore();
    
    const isAppt = type === 'appt';
    const appt = item as Appointment;
    const block = item as CalendarBlock;

    const branch = isAppt ? (branches.find(b => b.id === appt.branchId) || currentBranch) : currentBranch;
    const branchPrefix = branch?.name?.substring(0, 3).toUpperCase() || 'SYS';
    
    const todayStr = formatDate(new Date());
    const isPast = item.date < todayStr;
    const isCompleted = isAppt && appt.status === 'completed';
    const isLocked = isPast || isCompleted;

    const [localDuration, setLocalDuration] = useState(item.duration);
    const [isResizing, setIsResizing] = useState(false);
    const [isRecentlyResized, setIsRecentlyResized] = useState(false);

    useEffect(() => {
        if (!isResizing) {
            setLocalDuration(item.duration);
        }
    }, [item.duration, isResizing]);

    const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
        id: item.id,
        data: { type: isAppt ? 'appointment' : 'block', item },
        disabled: (isAppt && appt.syncStatus === 'syncing') || isLocked || isResizing
    });

    const { setNodeRef: setDroppableRef, isOver } = useDroppable({
        id: `drop-${item.id}`,
        data: { type: 'appointment', item },
        disabled: isLocked
    });

    const setNodeRefs = (node: HTMLElement | null) => {
        setDraggableRef(node);
        setDroppableRef(node);
    };

    const currentHeight = `${localDuration * PX_PER_MIN}px`;

    const style = {
        transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
        height: currentHeight,
        zIndex: isDragging ? 100 : (isResizing ? 50 : 10),
        position: 'relative' as const,
        minHeight: '20px',
        touchAction: 'none'
    };

    const handleResizeMouseDown = (e: React.MouseEvent) => {
        if (isLocked) return;
        e.stopPropagation();
        e.preventDefault();
        setIsResizing(true);
        onResizeStart?.(item.id, localDuration);

        const startY = e.pageY;
        const startDuration = localDuration;
        let latestDuration = startDuration;

        const onMouseMove = (moveEvent: MouseEvent) => {
            const deltaY = moveEvent.pageY - startY;
            const deltaMinutes = Math.round(deltaY / (SLOT_HEIGHT / 3)) * 5; 
            const newDuration = Math.max(5, startDuration + deltaMinutes);
            setLocalDuration(newDuration);
            latestDuration = newDuration;
            onResizeUpdate?.(item.id, newDuration);
        };

        const onMouseUp = async () => {
            setIsResizing(false);
            setIsRecentlyResized(true);
            setTimeout(() => setIsRecentlyResized(false), 300);
            
            onResizeEnd?.(); 
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
            
            if (latestDuration !== item.duration) {
                if (isAppt) {
                    await updateAppointment(item.id, { duration: latestDuration });
                } else {
                    await updateBlock(item.id, { duration: latestDuration });
                }
            }
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    };

    const getAppledTheme = (status: AppointmentStatus) => {
        switch(status) {
            case 'completed': return { 
                bg: 'bg-gradient-to-br from-emerald-50 to-white', 
                text: 'text-emerald-900', 
                ring: 'ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-100/50', 
                indicator: 'bg-emerald-600', 
                icon: <ShieldCheck className="w-4 h-4 text-emerald-600 animate-[bounce_1s_infinite]" /> 
            };
            case 'arrived': return { 
                bg: 'bg-gradient-to-br from-indigo-50 to-white', 
                text: 'text-indigo-900', 
                ring: 'ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-100/50', 
                indicator: 'bg-indigo-600', 
                icon: <Activity className="w-4 h-4 text-indigo-600" /> 
            };
            case 'no-show': return { 
                bg: 'bg-gradient-to-br from-red-50 to-white', 
                text: 'text-red-900', 
                ring: 'ring-2 ring-red-500/20 shadow-lg shadow-red-100/50', 
                indicator: 'bg-red-600', 
                icon: <Ban className="w-4 h-4 text-red-600" /> 
            };
            default: return { 
                bg: 'bg-white', 
                text: 'text-gray-900', 
                ring: 'ring-1 ring-gray-200/50 shadow-md', 
                indicator: 'bg-gray-300', 
                icon: null 
            };
        }
    };

    const info = isAppt ? getAppledTheme(appt.status as AppointmentStatus) : { bg: 'bg-white', text: 'text-gray-500', ring: 'ring-1 ring-gray-200 border-dashed', indicator: 'bg-gray-200', icon: <Coffee className="w-3.5 h-3.5 opacity-40" /> };
    const room = isAppt && appt.roomId ? rooms.find(r => r.id === appt.roomId) : null;
    const customer = isAppt ? customers.find(c => c.id === appt.customerId) : null;

    return (
        <div 
            ref={setNodeRefs} 
            style={style} 
            onClick={(e) => { 
                e.stopPropagation(); 
                if (isRecentlyResized) return;
                if (isAppt) onAction?.(appt); 
            }}
            className={`
                relative mx-1 rounded-xl transition-all select-none group/item overflow-hidden
                ${isDragging ? 'opacity-30 scale-95 shadow-xl ring-2 ring-indigo-500/50' : 'opacity-100 hover:scale-[1.01] hover:shadow-xl hover:shadow-indigo-100/40'} 
                ${isOver ? 'ring-2 ring-indigo-400 bg-indigo-50/50 scale-[1.02]' : ''}
                ${info.bg} ${info.ring} ${info.text} flex flex-col justify-between
            `}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${info.indicator}`} />
            
            {!isLocked && (
                <div 
                    onMouseDown={(e) => e.stopPropagation()}
                    className="absolute top-2 left-2 right-2 flex justify-between items-start opacity-0 group-hover/item:opacity-100 transition-opacity z-40"
                >
                    <div 
                        {...listeners} 
                        {...attributes} 
                        className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-white text-indigo-400 hover:text-indigo-600 transition-all"
                    >
                        <GripVertical size={12} />
                    </div>
                    
                    {(!isAppt || ['Admin', 'Manager', 'Owner', 'superadmin'].includes(currentUser?.role || 'Staff')) && (
                        <button 
                            onMouseDown={(e) => e.stopPropagation()}
                            onClick={(e) => {
                                e.stopPropagation();
                                if (confirm(isAppt ? "Bu randevuyu silmek istediğinize emin misiniz?" : "Bu bloklamayı/molayı silmek istediğinize emin misiniz?")) {
                                    if (isAppt) deleteAppointment(appt.id);
                                    else removeBlock(block.id);
                                }
                            }}
                            className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm hover:bg-red-50 text-gray-300 hover:text-red-500 transition-all"
                        >
                            <Trash2 size={12} />
                        </button>
                    )}
                </div>
            )}

            {isAppt && appt.syncStatus === 'syncing' && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20 backdrop-blur-[2px] rounded-[1.25rem]">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                </div>
            )}

            <div className="flex flex-col gap-0.5 text-center h-full justify-center px-2 py-2">
                <span className="text-[9px] font-black opacity-40 uppercase tracking-tighter tabular-nums">{item.time}</span>
                <p className="font-extrabold text-[11px] leading-tight uppercase tracking-tight text-gray-900 drop-shadow-sm">{isAppt ? appt.customerName : 'MEŞGUL'}</p>
                <p className="text-[9px] font-bold text-indigo-600/70 border-b border-indigo-100/50 inline-block mx-auto pb-0.5 leading-none">
                    {isAppt ? appt.service : block.reason}
                </p>
                <div className="flex flex-col mt-1">
                    {isAppt && <p className="text-[8px] font-black opacity-40">{appt.staffName || '---'}</p>}
                    {room && <p className="text-[8px] font-bold opacity-30 italic">{room.name}</p>}
                </div>
                {isAppt && (
                    <div className="mt-auto pt-1 flex items-center justify-center gap-1">
                        <span className="px-1.5 py-0.5 bg-gray-100 rounded-md text-[7px] font-black text-gray-400">
                             {customer?.referenceCode || (branchPrefix + '-' + appt.id.slice(-4).toUpperCase())}
                        </span>
                        {info.icon}
                    </div>
                )}
            </div>

            {!isLocked && (
                <div 
                    onMouseDown={handleResizeMouseDown}
                    data-no-dnd="true"
                    className="absolute bottom-0 left-0 right-0 h-4 cursor-ns-resize flex items-center justify-center group/resize z-30"
                >
                    <div className="w-8 h-1 bg-gray-200 rounded-full group-hover/resize:bg-indigo-400 transition-colors" />
                </div>
            )}
        </div>
    );
}
