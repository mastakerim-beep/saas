"use client";

import { useState, useEffect } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ShieldCheck, Activity, Ban, Coffee, Trash2, Loader2, Clock, User, MapPin, XCircle, RefreshCcw, CheckCircle2 } from 'lucide-react';
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

    const getApptTheme = (status: AppointmentStatus) => {
        switch(status) {
            case 'completed': return { 
                bg: 'bg-gradient-to-br from-emerald-50 to-white', 
                text: 'text-emerald-900', 
                ring: 'ring-2 ring-emerald-500/20 shadow-lg shadow-emerald-100/50', 
                indicator: 'bg-emerald-600',
                headerBg: 'bg-emerald-600',
                bodyBg: 'bg-emerald-500/10',
                icon: <CheckCircle2 className="w-3.5 h-3.5" />,
                badge: null,
                badgeStyle: ''
            };
            case 'arrived': return { 
                bg: 'bg-gradient-to-br from-indigo-50 to-white', 
                text: 'text-indigo-900', 
                ring: 'ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-100/50',
                indicator: 'bg-indigo-600',
                headerBg: 'bg-indigo-600',
                bodyBg: 'bg-indigo-500/10',
                icon: <Activity className="w-3.5 h-3.5" />,
                badge: null,
                badgeStyle: ''
            };
            case 'unexcused-cancel': return { 
                bg: 'bg-gradient-to-br from-red-50 to-white', 
                text: 'text-red-900', 
                ring: 'ring-2 ring-red-400/30 shadow-lg shadow-red-100/50',
                indicator: 'bg-red-500',
                headerBg: 'bg-red-500',
                bodyBg: 'bg-red-500/10',
                icon: <XCircle className="w-3.5 h-3.5" />,
                badge: 'GELMEDİ',
                badgeStyle: 'bg-red-500 text-white'
            };
            case 'excused':
            case 'cancelled': return { 
                bg: 'bg-gradient-to-br from-orange-50 to-white', 
                text: 'text-orange-900', 
                ring: 'ring-2 ring-orange-300/30 shadow-md shadow-orange-100/30',
                indicator: 'bg-orange-400',
                headerBg: 'bg-orange-400',
                bodyBg: 'bg-orange-500/10',
                icon: <RefreshCcw className="w-3.5 h-3.5" />,
                badge: 'İPTAL',
                badgeStyle: 'bg-orange-400 text-white'
            };
            case 'no-show': return { 
                bg: 'bg-gradient-to-br from-red-50 to-white', 
                text: 'text-red-900', 
                ring: 'ring-2 ring-red-400/30 shadow-lg shadow-red-100/50',
                indicator: 'bg-red-600',
                headerBg: 'bg-red-600',
                bodyBg: 'bg-red-600/10',
                icon: <Ban className="w-3.5 h-3.5" />,
                badge: 'GELMEDİ',
                badgeStyle: 'bg-red-600 text-white'
            };
            default: return { 
                bg: 'bg-gradient-to-br from-orange-50 via-white to-white', 
                text: 'text-orange-950', 
                ring: 'ring-2 ring-orange-200/40 shadow-xl shadow-orange-100/20',
                indicator: 'bg-orange-500',
                headerBg: 'bg-orange-500',
                bodyBg: 'bg-orange-500/15',
                icon: null,
                badge: 'TASLAK',
                badgeStyle: 'bg-orange-500 text-white'
            };
        }
    };

    const info = isAppt ? getApptTheme(appt.status as AppointmentStatus) : { 
        bg: 'bg-white', text: 'text-gray-500', 
        ring: 'ring-1 ring-gray-200 border-dashed',
        indicator: 'bg-gray-300',
        headerBg: 'bg-gray-300',
        bodyBg: 'bg-gray-400/5',
        icon: <Coffee className="w-3.5 h-3.5 opacity-40" />,
        badge: null, badgeStyle: ''
    };
    const room = isAppt && appt.roomId ? rooms.find(r => r.id === appt.roomId) : null;
    const customer = isAppt ? customers.find(c => c.id === appt.customerId) : null;

    return (
        <div 
            ref={setNodeRefs} 
            style={style}
            {...(!isLocked ? listeners : {})}
            {...(!isLocked ? attributes : {})}
            onClick={(e) => { 
                e.stopPropagation(); 
                if (isRecentlyResized) return;
                if (isAppt) onAction?.(appt); 
            }}
            className={`
                relative mx-1 rounded-2xl transition-all select-none group/item overflow-hidden
                ${!isLocked ? 'cursor-grab active:cursor-grabbing' : ''}
                ${isDragging ? 'opacity-30 scale-95 shadow-2xl ring-4 ring-indigo-500/50' : 'opacity-100 hover:scale-[1.02] hover:shadow-2xl hover:shadow-indigo-200/40'} 
                ${isOver ? 'ring-4 ring-indigo-400 bg-indigo-50/80 scale-[1.03]' : ''}
                ${info.bg} ${info.ring} ${info.text} flex flex-col justify-between
                backdrop-blur-[24px] border border-white/20
            `}
        >
            <div className={`absolute left-0 top-0 bottom-0 w-1 ${info.indicator}`} />
            
            {!isLocked && (!isAppt || ['Admin', 'Manager', 'Owner', 'superadmin'].includes(currentUser?.role || 'Staff')) && (
                <button 
                    onPointerDown={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(isAppt ? "Bu randevuyu silmek istediğinize emin misiniz?" : "Bu bloklamayı/molayı silmek istediğinize emin misiniz?")) {
                            if (isAppt) deleteAppointment(appt.id);
                            else removeBlock(block.id);
                        }
                    }}
                    className="absolute top-1.5 right-1.5 p-1.5 bg-white/80 backdrop-blur-md rounded-lg shadow-sm hover:bg-red-50 text-red-300 hover:text-red-500 transition-all border border-gray-100/50 opacity-0 group-hover/item:opacity-100 z-40 cursor-pointer"
                >
                    <Trash2 size={12} />
                </button>
            )}

            {isAppt && appt.syncStatus === 'syncing' && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20 backdrop-blur-[2px] rounded-[1.25rem]">
                    <Loader2 className="w-5 h-5 text-indigo-600 animate-spin" />
                </div>
            )}

            {/* Header Area: Time & Status */}
            <div className={`
                flex items-center justify-between px-2 py-1 border-b border-black/10
                ${(info as any).headerBg || info.indicator} text-white
            `}>
                <div className="flex items-center gap-1">
                    <Clock size={9} className="opacity-80 shrink-0" />
                    <span className="text-[9px] font-black tracking-tighter tabular-nums truncate">
                        {item.time} - {(() => {
                            const [h, m] = item.time.split(':').map(Number);
                            const endMin = h * 60 + m + (localDuration || 60);
                            return `${Math.floor(endMin / 60).toString().padStart(2, '0')}:${(endMin % 60).toString().padStart(2, '0')}`;
                        })()}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {(info as any).badge && (
                        <span className="text-[8px] font-black uppercase tracking-wider bg-white/20 px-1.5 py-0.5 rounded-md">
                            {(info as any).badge}
                        </span>
                    )}
                    {info.icon && <div className="opacity-90">{info.icon}</div>}
                </div>
            </div>

            {/* Body Area: Main Content */}
            <div className={`flex-1 flex flex-col justify-center px-3 py-2 overflow-hidden ${(info as any).bodyBg || 'bg-white/40'} backdrop-blur-md`}>
                <div className="flex items-center gap-1 flex-wrap justify-center">
                    <p className="font-extrabold text-[11px] leading-tight uppercase tracking-tight text-gray-900 drop-shadow-sm truncate max-w-full">
                        {isAppt ? appt.customerName : 'MEŞGUL'}
                    </p>
                    {isAppt && appt.packageId && (
                        <span className="px-1 py-0.5 bg-indigo-600 text-white text-[7px] font-black rounded-sm shadow-sm ring-1 ring-white/20">P</span>
                    )}
                </div>
                
                <p className="text-[9px] font-bold text-indigo-600/70 mt-0.5 leading-none truncate w-full text-center">
                    {isAppt ? appt.service : block.reason}
                </p>

                <div className="flex items-center justify-center gap-2 mt-2 opacity-40">
                    <div className="flex items-center gap-1 shrink-0">
                        <User size={8} />
                        <span className="text-[8px] font-black uppercase truncate max-w-[60px]">{isAppt ? (appt.staffName || '---') : 'Blok'}</span>
                    </div>
                    {room && (
                        <div className="flex items-center gap-1 shrink-0">
                            <MapPin size={8} />
                            <span className="text-[8px] font-bold italic truncate max-w-[40px]">{room.name}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Footer Area: Randevu Ref & Müşteri Kayıt Kodu - Kaçak Kontrol */}
            {isAppt && (
                <div className="px-2 py-1 flex items-center justify-between gap-1 bg-black/5 backdrop-blur-sm">
                    {/* Sol: Randevu numarası */}
                    <div className="flex items-center gap-1 min-w-0">
                        <ShieldCheck size={8} className="text-indigo-400 shrink-0" />
                        <span className="text-[8px] font-black text-indigo-600 tracking-widest truncate">
                            {appt.apptRef || ('#' + appt.id.slice(-6).toUpperCase())}
                        </span>
                    </div>
                    {/* Sağ: Müşteri kayıt kodu */}
                    <div className="flex items-center gap-1 min-w-0">
                        <span className="text-[7px] font-black text-gray-400 tracking-widest truncate">
                            {customer?.referenceCode || (customer ? customer.id.slice(-6).toUpperCase() : '---')}
                        </span>
                        <User size={7} className="text-gray-400 shrink-0" />
                    </div>
                </div>
            )}


            {!isLocked && (
                <div 
                    onPointerDown={(e) => e.stopPropagation()}
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
