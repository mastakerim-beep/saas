"use client";

import { useState, useMemo, useEffect } from 'react';
import { useStore, Appointment, Staff, CalendarBlock, Customer, AppointmentStatus, Service } from '@/lib/store';
import { 
    DndContext, 
    useDraggable, 
    useDroppable, 
    DragEndEvent,
    PointerSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import { 
    X, Plus, Sparkles, AlertCircle, Clock, User, 
    ChevronRight, ChevronLeft, Package, ShieldCheck, Target, Ban, Coffee, Info, Banknote, RefreshCcw, Cloud, CloudOff, Loader2, Trash2, GripVertical, MoreHorizontal, Search, Star, UserPlus, ChevronDown, Activity, HeartHandshake, MapPin, Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartCheckout from '@/components/checkout/SmartCheckout';
import BodyMap from '@/components/crm/BodyMap';
import CustomerGallery from '@/components/crm/CustomerGallery';
import BookingModal from '@/components/calendar/BookingModal';

// ---- CONFIG & UTILS ----
const SLOT_MINUTES = 15;

const formatDate = (date: Date) => {
    // Shifting to Istanbul time before ISO conversion
    return new Date(date.getTime() + (3 * 3600000)).toISOString().split('T')[0];
};

const generateSlots = (start: number, end: number) => {
    const slots = [];
    for (let h = start; h < end; h++) {
        for (let m = 0; m < 60; m += SLOT_MINUTES) {
            slots.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
        }
    }
    return slots;
};

// ---- DRAGGABLE CUSTOMER CARD (Sağ Panel) ----
function DraggableCustomerCard({ customer, onClick }: { customer: Customer, onClick?: () => void }) {
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

function CalendarItem({ item, type, onCheckout, onAction, onResizeStart, onResizeUpdate, onResizeEnd }: { 
    item: Appointment | CalendarBlock, 
    type: 'appt' | 'block', 
    onCheckout?: (a: Appointment) => void, 
    onAction?: (a: Appointment) => void,
    onResizeStart?: (id: string, initialDuration: number) => void,
    onResizeUpdate?: (id: string, currentDuration: number) => void,
    onResizeEnd?: () => void
}) {
    const { currentUser, deleteAppointment, updateAppointmentStatus, updateAppointment, updateBlock, removeBlock, debts, rooms, packages, branches, currentBranch, customers } = useStore();
    
    const isAppt = type === 'appt';
    const appt = item as Appointment;
    const block = item as CalendarBlock;

    const branch = isAppt ? (branches.find(b => b.id === appt.branchId) || currentBranch) : currentBranch;
    const branchPrefix = branch?.name?.substring(0, 3).toUpperCase() || 'SYS';
    
    // Locking Logic: Past days or Completed status
    const todayStr = formatDate(new Date());
    const isPast = item.date < todayStr;
    const isCompleted = isAppt && appt.status === 'completed';
    const isLocked = isPast || isCompleted;

    const [localDuration, setLocalDuration] = useState(item.duration);
    const [isResizing, setIsResizing] = useState(false);

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

    // Combinative ref for dnd-kit
    const setNodeRefs = (node: HTMLElement | null) => {
        setDraggableRef(node);
        setDroppableRef(node);
    };

    // const [showMenu, setShowMenu] = useState(false); // REMOVED

    const span = Math.ceil(item.duration / SLOT_MINUTES);

    const room = isAppt && appt.roomId ? rooms.find(r => r.id === appt.roomId) : null;
    const pkg = isAppt && appt.packageId ? packages.find(p => p.id === appt.packageId) : null;

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : {
        gridRow: `span ${Math.ceil(localDuration / SLOT_MINUTES)}`,
        zIndex: isResizing ? 50 : 10,
        position: 'relative' as const
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
            const deltaSlots = Math.round(deltaY / 48); // 48px per 15 min slot
            const newDuration = Math.max(15, startDuration + (deltaSlots * 15));
            setLocalDuration(newDuration);
            latestDuration = newDuration;
            onResizeUpdate?.(item.id, newDuration);
        };

        const onMouseUp = async () => {
            setIsResizing(false);
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

    const handleDelete = async () => {
        if (confirm("Bu randevuyu kalıcı olarak silmek istediğinize emin misiniz?")) {
            await deleteAppointment(appt.id);
        }
    };

    const setStatus = async (status: AppointmentStatus) => {
        await updateAppointmentStatus(appt.id, status);
    };

    const getAppledTheme = (s: AppointmentStatus) => {
        switch(s) {
            case 'completed': return { bg: 'bg-emerald-50', text: 'text-emerald-700', ring: 'ring-1 ring-emerald-200', icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> };
            case 'arrived': return { bg: 'bg-indigo-50', text: 'text-indigo-700', ring: 'ring-1 ring-indigo-200', icon: <Activity className="w-3.5 h-3.5 text-indigo-500" /> };
            case 'no-show': return { bg: 'bg-red-50', text: 'text-red-700', ring: 'ring-1 ring-red-200', icon: <Ban className="w-3.5 h-3.5 text-red-500" /> };
            default: return { bg: 'bg-white', text: 'text-gray-900', ring: 'ring-1 ring-gray-100 shadow-sm', icon: null };
        }
    };

    const info = isAppt ? getAppledTheme(appt.status as AppointmentStatus) : { bg: 'bg-gray-50', text: 'text-gray-500', ring: 'ring-1 ring-gray-100 border-dashed', icon: <Coffee className="w-3.5 h-3.5 opacity-40" /> };

    return (
        <>
        <div 
            ref={setNodeRefs} 
            style={style} 
            onClick={(e) => { e.stopPropagation(); if (isAppt) onAction?.(appt); }}
            className={`
                relative mx-1 rounded-[1rem] p-2.5 shadow-sm transition-all select-none group/item
                ${isDragging ? 'opacity-30 scale-95 shadow-xl ring-2 ring-indigo-500/50' : 'opacity-100 hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-100'} 
                ${isOver ? 'ring-2 ring-indigo-400 bg-indigo-50/50 scale-[1.02]' : ''}
                ${info.bg} ${info.ring} ${info.text} flex flex-col justify-between
            `}
        >
            {/* Drag Handle & Quick Actions */}
            {!isLocked && (
                <div 
                    onMouseDown={(e) => e.stopPropagation()} // Grid seçimini tetiklemesini engelle
                    className="absolute top-2 left-2 right-2 flex justify-between items-start opacity-0 group-hover/item:opacity-100 transition-opacity z-40"
                >
                    <div 
                        {...listeners} 
                        {...attributes} 
                        className="p-1.5 bg-white/80 backdrop-blur-sm rounded-lg shadow-sm cursor-grab active:cursor-grabbing hover:bg-white text-indigo-400 hover:text-indigo-600 transition-all"
                    >
                        <GripVertical size={12} />
                    </div>
                    
                    {/* Delete button: Restricted for Appointments, Open for Blocks */}
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
            {/* Tooltip on hover */}
            {isAppt && appt.note && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-48 p-3 bg-indigo-600 text-white text-[10px] font-bold rounded-2xl opacity-0 group-hover/item:opacity-100 transition-opacity pointer-events-none z-[100] shadow-2xl shadow-indigo-200">
                    <p className="text-white/60 font-black uppercase tracking-widest mb-1 text-[8px]">Randevu Notu</p>
                    {appt.note}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-indigo-600" />
                </div>
            )}
            {isAppt && appt.syncStatus === 'syncing' && (
                <div className="absolute inset-0 bg-white/50 flex items-center justify-center z-20 backdrop-blur-[2px] rounded-[1.25rem]">
                    <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
            )}

            <div className="flex flex-col gap-0.5 text-center h-full justify-center">
                <p className="text-[10px] font-bold opacity-60 uppercase">{item.time} - {new Date(new Date(`2000-01-01T${item.time}`).getTime() + item.duration * 60000).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}</p>
                <p className="font-black text-[11px] leading-tight uppercase">{isAppt ? appt.customerName : 'Meşgul'}</p>
                <p className="text-[9px] font-bold opacity-80">({isAppt ? appt.service : block.reason})</p>
                {isAppt && <p className="text-[9px] font-bold opacity-80">{appt.staffName || '---'}</p>}
                {room && <p className="text-[9px] font-bold opacity-80">{room.name}</p>}
                <p className="text-[9px] font-bold opacity-80">{isAppt ? (appt.status === 'pending' ? 'Beklemede' : appt.status) : ''}</p>
                {isAppt && (
                    <p className="text-[9px] font-black opacity-60 mt-1">
                        ({customers.find(c => c.id === appt.customerId)?.referenceCode || (branchPrefix + '-' + appt.id.slice(-4).toUpperCase())})
                    </p>
                )}
            </div>

            {/* Resize Handle */}
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

        {/* Modal removed from here to top-level */}
        </>
    );
}

// ---- DROPPABLE SLOT ----
function TimeSlot({ staffId, roomId, time, isOff, onAdd, onSelectionStart, onSelectionEnter, isSelected }: { 
    staffId?: string, 
    roomId?: string, 
    time: string, 
    isOff: boolean, 
    onAdd: (id: string, t: string) => void,
    onSelectionStart: (id: string, t: string) => void,
    onSelectionEnter: (t: string) => void,
    isSelected: boolean
}) {
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
            className={`
                h-[48px] border-r border-gray-200/50 transition-all relative
                ${isHourStart ? 'border-t-[1.5px] border-t-gray-300' : 'border-t border-t-gray-200/60 border-dashed'}
                ${isOff ? 'bg-secondary/30 cursor-not-allowed opacity-40' : (isOver ? 'bg-indigo-50/50 border-2 border-indigo-200 z-10 scale-[1.01]' : 'hover:bg-indigo-50/10 cursor-pointer')}
                ${isSelected ? 'bg-indigo-600/20 ring-2 ring-indigo-500/50 z-20' : ''}
            `}
        >
            {isOver && !isOff && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-full h-0.5 bg-primary/30" />
                    <div className="absolute bg-primary text-white text-[9px] font-black px-2 py-1 rounded-full shadow-lg shadow-primary/20">{time}</div>
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

// ---- SERVICE SELECTION MODAL (müşteri sürükleyince çıkar) ----
function ServiceDropModal({ customer, staffId, roomId, time, date, onClose }: { customer: Customer, staffId?: string, roomId?: string, time: string, date: string, onClose: () => void }) {
    const { addAppointment, staffMembers, services, rooms, addBodyMap } = useStore();
    const [selectedService, setSelectedService] = useState<string>(services[0]?.name || '');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(roomId || rooms[0]?.id || null);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showBodyMap, setShowBodyMap] = useState(false);
    const [note, setNote] = useState('');

    const staff = staffId ? staffMembers.find(s => s.id === staffId) : null;

    const handleSave = async () => {
        setIsSaving(true);
        const svc = services.find(s => s.name === selectedService);
        if(!svc) {
            setIsSaving(false);
            return;
        }

        const success = await addAppointment({
            customerId: customer.id,
            customerName: customer.name,
            service: svc.name,
            staffId: staff?.id || staffId || null,
            staffName: staff?.name || 'Bilinmeyen',
            roomId: selectedRoomId,
            date,
            time,
            duration: svc.duration,
            status: 'pending',
            price: svc.price,
            depositPaid: 0,
            isOnline: false,
            note
        });

        if (success) {
            // Save Body Map if any regions selected
            if (selectedRegions.length > 0) {
                addBodyMap({
                    customerId: customer.id,
                    appointmentId: '', 
                    mapData: { regions: selectedRegions, notes: note },
                    isCritical: true,
                    createdAt: new Date().toISOString()
                });
            }
            setIsSaving(false);
            onClose();
        } else {
            setIsSaving(false);
            alert("Randevu kaydedilemedi! Lütfen eksik alanları veya bağlantınızı kontrol edin.");
        }
    };

    return (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xl z-[900] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
            <div className="modal-premium w-full max-w-lg overflow-hidden animate-[slideUp_0.3s_ease] !bg-white">
                <div className="p-10 border-b border-indigo-50 bg-gradient-to-br from-white to-indigo-50/30 flex justify-between items-center bg-white">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-primary animate-pulse" />
                            <p className="text-[10px] font-black text-primary uppercase tracking-[0.2em] leading-none">Hızlı Randevu Kaydı</p>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 leading-none tracking-tight uppercase italic">{customer.name}</h3>
                        <div className="flex items-center gap-2 mt-4">
                             {staff && <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full uppercase shadow-lg shadow-indigo-200">{staff.name}</span>}
                             {selectedRoomId && <span className="text-[10px] font-black bg-purple-600 text-white px-3 py-1 rounded-full uppercase shadow-lg shadow-purple-200">{rooms.find(r => r.id === selectedRoomId)?.name}</span>}
                             <span className="text-[10px] font-black bg-white border border-gray-100 px-3 py-1 rounded-full text-primary uppercase shadow-sm">{time}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-red-50 rounded-2xl transition group">
                        <X className="w-6 h-6 text-gray-300 group-hover:text-red-500 transition-all" />
                    </button>
                </div>

                <div className="p-10 space-y-6">
                    <div>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-3">Hizmet Seçimi</p>
                        <div className="grid grid-cols-1 gap-3 max-h-[30vh] overflow-y-auto pr-2 no-scrollbar">
                            {services.map(s => (
                                <button
                                    key={s.id}
                                    onClick={() => setSelectedService(s.name)}
                                    className={`group w-full p-5 rounded-[1.5rem] border-2 flex justify-between items-center transition-all duration-300 ${selectedService === s.name ? 'bg-primary border-primary text-white shadow-xl shadow-primary/30 scale-[1.02]' : 'bg-white border-gray-100 text-gray-500 hover:border-primary/20 hover:bg-indigo-50/30'}`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-3 h-3 rounded-full ${s.color} ${selectedService === s.name ? 'ring-2 ring-white ring-offset-2 ring-offset-primary' : ''}`} />
                                        <span className="text-sm font-black uppercase tracking-tight">{s.name}</span>
                                    </div>
                                    <span className={`text-[10px] font-black ${selectedService === s.name ? 'text-white' : 'text-primary'}`}>{s.duration} dk • ₺{s.price.toLocaleString('tr-TR')}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Oda Atama {roomId && '(Önerilen)'}</p>
                        <div className="flex flex-wrap gap-2.5">
                            {rooms.map(room => (
                                <button 
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase transition-all duration-300 border-2 ${selectedRoomId === room.id ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-200 scale-105' : 'bg-white border-gray-100 text-gray-400 hover:border-purple-200'}`}
                                >
                                    {room.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <button 
                            onClick={() => setShowBodyMap(true)}
                            className={`w-full p-5 rounded-[1.5rem] border-2 border-dashed flex items-center justify-center gap-4 transition-all duration-300 ${selectedRegions.length > 0 ? 'bg-indigo-50 border-primary text-primary' : 'bg-white border-gray-100 text-gray-400 hover:border-primary'}`}
                        >
                            <Activity className="w-5 h-5" />
                            <span className="text-xs font-black uppercase tracking-widest">
                                {selectedRegions.length > 0 ? `${selectedRegions.length} Bölge Seçildi` : 'Vücut Notu Ekle (Opsiyonel)'}
                            </span>
                        </button>
                        <textarea 
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Randevu notlarınızı veya özel isteklerinizi buraya ekleyebilirsiniz..."
                            className="w-full bg-white border-2 border-gray-50 rounded-[1.5rem] px-6 py-4 text-sm font-bold text-gray-900 outline-none focus:border-primary transition-all resize-none min-h-[80px] shadow-inner"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl flex items-center justify-center gap-4 bg-primary text-white hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 shadow-primary/30"
                    >
                        {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6 text-white" />}
                        {isSaving ? 'Rezervasyon İşleniyor...' : 'Takvime İşle ✓'}
                    </button>

                    <p className="text-[9px] text-gray-400 text-center font-black uppercase tracking-widest">Onay mesajı otomatik gönderilecek</p>
                </div>
            </div>

            {showBodyMap && (
                <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
                    <div className="modal-premium p-10 max-w-md w-full relative animate-[zoomIn_0.3s_ease] !bg-white">
                        <button onClick={() => setShowBodyMap(false)} className="absolute top-8 right-8 p-2 text-gray-400 hover:text-red-500"><X className="w-6 h-6" /></button>
                        <h4 className="text-xl font-black text-gray-900 mb-8 uppercase italic tracking-tight">Vücut Haritası</h4>
                        <div className="p-4 bg-gray-50 rounded-[2.5rem] mb-8">
                            <BodyMap 
                                selectedRegions={selectedRegions} 
                                onToggleRegion={(id) => setSelectedRegions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} 
                            />
                        </div>
                        <button onClick={() => setShowBodyMap(false)} className="w-full py-5 bg-primary text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 transition-all active:scale-95">Değişiklikleri Kaydet</button>
                    </div>
                </div>
            )}
        </div>
    );
}


// ---- RIGHT PANEL: CUSTOMER SEARCH & MANAGEMENT ----
function CustomerPanel({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
    const { customers, appointments, addCustomer } = useStore();
    const [search, setSearch] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    const [newName, setNewName] = useState('');
    const [newPhone, setNewPhone] = useState('');

    const filtered = useMemo(() => {
        if (!search) return [];
        return customers.filter(c => 
            c.name.toLowerCase().includes(search.toLowerCase()) || 
            c.phone.includes(search)
        );
    }, [customers, search]);

    const handleQuickAdd = async () => {
        if (!newName || !newPhone) return;
        await addCustomer({
            name: newName,
            phone: newPhone,
            email: '',
            birthdate: '',
            segment: 'Standard',
            note: 'Takvim üzerinden hızlı eklendi',
            isChurnRisk: false
        });
        setIsAdding(false);
        setNewName('');
        setNewPhone('');
    };

    return (
        <div className={`
            fixed right-0 top-0 h-full w-[336px] bg-white border-l border-gray-100 shadow-2xl z-[150] flex flex-col
            transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)]
            ${isOpen ? 'translate-x-0' : 'translate-x-full opacity-0 scale-95'}
        `}>
            {/* Header */}
            <div className="p-8 border-b border-gray-50 bg-gray-50/50">
                <div className="flex items-center justify-between mb-6">
                    <div>
                        <h3 className="font-black text-gray-900 text-xl leading-none uppercase">Müşteri Rehberi</h3>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-2 flex items-center gap-2">
                             <Target className="w-3 h-3" /> Akıllı Arama Aktif
                        </p>
                    </div>
                    <button onClick={onClose} className="p-3 bg-white hover:bg-gray-50 rounded-2xl transition-all shadow-sm border border-gray-100 group">
                        <X className="w-5 h-5 text-gray-400 group-hover:text-red-500" />
                    </button>
                </div>

                <div className="relative group">
                    <Search className={`w-5 h-5 absolute left-5 top-4.5 transition-colors ${search ? 'text-indigo-600' : 'text-gray-400'}`} />
                    <input 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="İsim veya numara ile ara..."
                        className="w-full bg-gray-50 border border-gray-100 focus:border-indigo-500/50 rounded-2.5xl pl-14 pr-6 py-4.5 text-sm font-bold text-gray-900 outline-none transition-all placeholder:text-gray-400 focus:bg-white"
                    />
                    {search && (
                        <button onClick={() => setSearch('')} className="absolute right-4 top-4.5 p-1 hover:bg-gray-100 rounded-lg">
                            <X className="w-3 h-3 text-gray-400" />
                        </button>
                    )}
                </div>
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto no-scrollbar p-6 space-y-3">
                {isAdding ? (
                    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] space-y-4 shadow-sm">
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest text-center">HIZLI YENİ KAYIT</p>
                        <input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Müşteri Ad Soyad" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-xs font-bold outline-none focus:border-indigo-500/50" />
                        <input value={newPhone} onChange={e => setNewPhone(e.target.value)} placeholder="Telefon" className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-xs font-bold outline-none focus:border-indigo-500/50" />
                        <div className="flex gap-2">
                            <button onClick={() => setIsAdding(false)} className="flex-1 py-3 text-[10px] font-black text-gray-400 uppercase hover:text-gray-600 transition-colors">Vazgeç</button>
                            <button onClick={handleQuickAdd} className="flex-2 py-3 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase shadow-lg shadow-indigo-500/20">Kaydet</button>
                        </div>
                    </motion.div>
                ) : search.length > 0 ? (
                    filtered.length > 0 ? (
                        filtered.map(customer => (
                            <DraggableCustomerCard key={customer.id} customer={customer} />
                        ))
                    ) : (
                        <div className="py-20 text-center space-y-4">
                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto border border-gray-100">
                                <UserPlus className="w-8 h-8 text-gray-300" />
                            </div>
                            <div>
                                <p className="text-gray-900 font-bold text-sm tracking-tight text-center">Bu müşteri henüz kayıtlı değil.</p>
                                <button onClick={() => setIsAdding(true)} className="mt-4 text-[10px] font-black text-indigo-600 uppercase hover:underline">Hemen Kaydet +</button>
                            </div>
                        </div>
                    )
                ) : (
                    <div className="h-full flex flex-col items-center justify-center opacity-30 text-center px-8">
                        <Sparkles className="w-12 h-12 text-gray-300 mb-4" />
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Arayarak veya numara girerek müşterilerinize ulaşın</p>
                    </div>
                )}
            </div>

            {/* Footer */}
            <div className="p-8 border-t border-gray-50 bg-gray-50/50">
                <div className="bg-white rounded-2.5xl p-5 border border-gray-100 group shadow-sm">
                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 group-hover:text-indigo-600 transition-colors uppercase">Kısayol Bilgisi</p>
                    <p className="text-[10px] text-gray-500 font-bold leading-relaxed italic">"İsim veya telefon yazdıktan sonra müşteriyi tutup takvime sürükleyebilirsiniz."</p>
                </div>
            </div>
        </div>
    );
}

// ---- MAIN PAGE: RECEPTION COMMAND CENTER ----
export default function CalendarPage() {
    const { staffMembers, appointments, blocks, settings, moveAppointment, syncStatus, customers, isOnline, rooms, currentBranch, updateAppointmentStatus, deleteAppointment, updateBlock } = useStore();
    const [viewMode, setViewMode] = useState<'staff' | 'room'>('staff');
    const [selectedSlot, setSelectedSlot] = useState<{staffId?: string, roomId?: string, time: string, duration?: number} | null>(null);
    const [selection, setSelection] = useState<{ staffId?: string, roomId?: string, start: string, end: string } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [checkoutAppt, setCheckoutAppt] = useState<Appointment | null>(null);
    const [actionAppt, setActionAppt] = useState<Appointment | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragData, setActiveDragData] = useState<any>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [dropPreview, setDropPreview] = useState<{ customer: Customer, staffId?: string, roomId?: string, time: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [pickerMonth, setPickerMonth] = useState(new Date());

    // --- NEW: Global Resizing State for Visual Feedback ---
    const [resizingId, setResizingId] = useState<string | null>(null);
    const [resizingDuration, setResizingDuration] = useState<number>(0);

    const sensors = useSensors(
        useSensor(PointerSensor, { 
            activationConstraint: { distance: 5 },
            // Prevent dragging when clicking on elements with data-no-dnd
            onActivation: ({ event }) => {
                const target = event.target as HTMLElement;
                if (target?.closest('[data-no-dnd="true"]')) {
                    return false;
                }
            }
        }),
        useSensor(MouseSensor),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
    );

    const SLOTS = useMemo(() => generateSlots(settings.startHour, settings.endHour), [settings]);
    const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay();

    const staffToDisplay = useMemo(() => {
        return staffMembers
            .filter(s => {
                // Enforce branch filtering
                if (currentBranch?.id && s.branchId !== currentBranch.id) return false;

                const isActive = s.status === 'active';
                const hasApptToday = appointments.some(a => a.staffId === s.id && a.date === selectedDate);
                const isExplicitlyHidden = s.isVisibleOnCalendar === false;
                
                // 1. Eğer açıkça gizlenmişse gösterme
                if (isExplicitlyHidden) return false;

                // 2. Aktifse göster
                if (isActive) return true;
                
                // 3. Pasif olsa bile o gün randevusu varsa göster
                if (hasApptToday) return true;
                
                return false;
            })
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [staffMembers, appointments, selectedDate, currentBranch]);

    const roomsToDisplay = useMemo(() => {
        return (rooms || []).filter(r => r.status !== 'passive');
    }, [rooms]);

    const columnsToDisplay = viewMode === 'staff' ? staffToDisplay : roomsToDisplay;

    // Keyboard Shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            if (e.key.toLowerCase() === 't') setSelectedDate(formatDate(new Date()));
            if (e.key.toLowerCase() === 'n') setSelectedSlot({ staffId: staffToDisplay[0]?.id, time: '09:00' });
            if (e.key === 'ArrowRight') {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() + 1);
                setSelectedDate(formatDate(d));
            }
            if (e.key === 'ArrowLeft') {
                const d = new Date(selectedDate);
                d.setDate(d.getDate() - 1);
                setSelectedDate(formatDate(d));
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedDate, staffToDisplay]);

    // Range Selection Handlers
    const handleAddClick = (id: string, time: string) => {
        setSelectedSlot({
            staffId: viewMode === 'staff' ? id : undefined,
            roomId: viewMode === 'room' ? id : undefined,
            time
        });
    };

    const handleSelectionStart = (id: string, time: string) => {
        setSelection({
            staffId: viewMode === 'staff' ? id : undefined,
            roomId: viewMode === 'room' ? id : undefined,
            start: time,
            end: time
        });
        setIsSelecting(true);
    };

    const handleSelectionEnter = (time: string) => {
        if (isSelecting && selection) {
            setSelection({ ...selection, end: time });
        }
    };

    useEffect(() => {
        const handleGlobalMouseUp = () => {
            if (isSelecting && selection) {
                const startIdx = SLOTS.indexOf(selection.start);
                const endIdx = SLOTS.indexOf(selection.end);
                
                const finalStart = SLOTS[Math.min(startIdx, endIdx)];
                const finalEnd = SLOTS[Math.max(startIdx, endIdx)];
                
                // At least 15 minutes
                const duration = Math.max(15, (Math.abs(startIdx - endIdx) + 1) * SLOT_MINUTES);
                
                setSelectedSlot({
                    staffId: selection.staffId,
                    roomId: selection.roomId,
                    time: finalStart,
                    duration
                });
                
                setSelection(null);
                setIsSelecting(false);
            }
        };

        if (isSelecting) {
            window.addEventListener('mouseup', handleGlobalMouseUp);
            return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
        }
    }, [isSelecting, selection, SLOTS, SLOT_MINUTES]);

    const handleDragStart = (event: any) => {
        setActiveId(event.active.id as string);
        setActiveDragData(event.active.data.current);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveDragData(null);

        if (!over) return;

        const overData = over.data.current as any;
        const activeData = active.data.current as any;

        if (activeData?.type === 'customer' && overData?.type === 'slot') {
            setDropPreview({
                customer: activeData.customer,
                staffId: overData.staffId,
                roomId: overData.roomId,
                time: overData.time,
            });
            return;
        }

        if (activeData?.type === 'appointment' && overData?.type === 'slot') {
            const [id, time] = [overData.staffId || overData.roomId, overData.time];
            if (viewMode === 'staff') {
                await moveAppointment(active.id as string, time, id);
            } else {
                await moveAppointment(active.id as string, time, undefined, id);
            }
        }

        if (activeData?.type === 'block' && overData?.type === 'slot') {
            const [targetId, time] = [overData.staffId || overData.roomId, overData.time];
            const updates: any = { time };
            if (viewMode === 'staff') updates.staffId = targetId;
            else updates.roomId = targetId;
            await updateBlock(active.id as string, updates);
        }

        // --- NEW: Handle Dropping an Appointment onto another (for Cell Splitting) ---
        if (activeData?.type === 'appointment' && overData?.type === 'appointment') {
            const targetItem = overData.item;
            if (targetItem && targetItem.id !== active.id && targetItem.staffId && targetItem.time) {
                await moveAppointment(active.id as string, targetItem.time, targetItem.staffId);
            }
        }
        // --- NEW: Handle Dropping a Customer onto an Appointment ---
        if (activeData?.type === 'customer' && overData?.type === 'appointment') {
            const targetItem = overData.item;
            if (targetItem && targetItem.staffId && targetItem.time) {
                setDropPreview({
                    customer: activeData.customer,
                    staffId: targetItem.staffId,
                    time: targetItem.time,
                });
            }
        }
    };

    const activeAppt = appointments.find(a => a.id === activeId);
    const activeCustomer = activeDragData?.type === 'customer' ? activeDragData.customer : null;

    return (
        <div className={`p-8 h-[calc(100vh-72px)] flex flex-col overflow-hidden bg-white animate-[fadeIn_0.5s_ease] transition-all duration-300 ${isPanelOpen ? 'pr-[352px]' : 'pr-8'}`}>
            {/* Unified Command Bar */}
            <div className="grid grid-cols-3 items-center mb-8 flex-none px-4 text-gray-900 border-b border-gray-100 pb-6">
                {/* Left: Dropdown */}
                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <select 
                            value={viewMode}
                            onChange={(e) => setViewMode(e.target.value as any)}
                            className="bg-white border border-gray-200 rounded-2xl px-6 py-3 text-[11px] font-black uppercase tracking-widest hover:border-indigo-600 transition-all shadow-sm outline-none appearance-none cursor-pointer pr-10"
                        >
                            <option value="staff">Uzman Görünümü</option>
                            <option value="room">Oda Görünümü</option>
                        </select>
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                            <ChevronDown size={14} className="text-gray-400" />
                        </div>
                    </div>
                </div>

                {/* Center: Date Navigator */}
                <div className="flex items-center justify-center gap-2">
                    <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()-1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                        <ChevronLeft className="w-5 h-5 text-gray-400" />
                    </button>
                    <div 
                        onClick={() => {
                            setPickerMonth(new Date(selectedDate));
                            setIsDatePickerOpen(true);
                        }}
                        className="px-6 text-center cursor-pointer hover:bg-gray-50 rounded-xl py-2"
                    >
                        <p className="text-sm font-black text-gray-900 tabular-nums">
                            {new Date(selectedDate).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                        </p>
                    </div>
                    <button onClick={() => { const d = new Date(selectedDate); d.setDate(d.getDate()+1); setSelectedDate(d.toISOString().split('T')[0]); }} className="p-2 hover:bg-gray-100 rounded-xl transition-all">
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                {/* Right: Actions */}
                <div className="flex justify-end gap-3">
                    <button className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-indigo-600 transition-all shadow-sm">
                        <ChevronDown size={14} className="text-gray-400" />
                        Renk kaynağı
                    </button>
                    <button className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-indigo-600 transition-all shadow-sm">
                        <ChevronDown size={14} className="text-gray-400" />
                        İşlemler
                    </button>
                    <button onClick={() => setIsPanelOpen(!isPanelOpen)} className={`p-3 rounded-2xl border transition-all ${isPanelOpen ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white text-gray-400 border-gray-200 hover:border-indigo-600'}`}>
                        <Search size={20} />
                    </button>
                </div>
            </div>

            <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
                <div className="flex-1 bg-white border border-gray-100 rounded-[3.5rem] shadow-2xl flex flex-col overflow-hidden relative">
                    {/* Header Columns */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50 flex-none ml-[100px] sticky top-0 z-30 shadow-sm backdrop-blur-md">
                        {columnsToDisplay.map(col => (
                            <div key={col.id} className="flex-1 p-4 text-center border-r border-gray-100 relative group">
                                {viewMode === 'staff' && (col as Staff).weeklyOffDay === dayOfWeek && (
                                    <div className="absolute inset-0 bg-red-500/5 flex items-center justify-center">
                                        <span className="text-[8px] font-black text-red-500 border border-red-500 px-2 py-0.5 rounded-full rotate-[-15deg] bg-white">İZİNLİ</span>
                                    </div>
                                )}
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 group-hover:text-indigo-600 transition-colors uppercase">
                                    {viewMode === 'staff' ? 'Uzman' : 'Oda'}
                                </p>
                                <p className="font-extrabold text-gray-900 uppercase tracking-tight text-sm uppercase">{col.name}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar relative flex">
                        {/* Time labels */}
                        <div className="w-[100px] flex-none border-r border-gray-100 bg-white sticky left-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
                            {SLOTS.map(slot => {
                                const [h, m] = slot.split(':');
                                const isHour = m === '00';
                                const isHalf = m === '30';
                                
                                return (
                                    <div key={slot} className={`h-[48px] flex flex-col items-center justify-center transition-colors ${isHour ? 'bg-gray-50/30' : ''}`}>
                                        <span className={`
                                            transition-all duration-300 tabular-nums
                                            ${isHour ? 'text-[13px] font-black text-gray-900 italic' : 'text-[10px] font-bold text-gray-300'}
                                            ${isHalf ? 'text-gray-400' : ''}
                                        `}>
                                            {slot}
                                        </span>
                                        {isHour && (
                                            <div className="w-1 h-1 bg-indigo-500 rounded-full mt-1 animate-pulse" />
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grid */}
                        <div className="flex-1 grid relative bg-[#FEF9E7]" style={{ gridTemplateColumns: `repeat(${columnsToDisplay.length || 1}, 1fr)`, gridTemplateRows: `repeat(${SLOTS.length}, 48px)` }}>
                            {columnsToDisplay.map((col, colIdx) => {
                                const isOff = viewMode === 'staff' && (col as Staff).weeklyOffDay === dayOfWeek;
                                return SLOTS.map((time, rowIdx) => (
                                    <div key={`${col.id}-${time}`} style={{ gridColumn: colIdx + 1, gridRow: rowIdx + 1 }}>
                                        <TimeSlot 
                                            staffId={viewMode === 'staff' ? col.id : undefined}
                                            roomId={viewMode === 'room' ? col.id : undefined}
                                            time={time}
                                            isOff={isOff}
                                            onAdd={handleAddClick}
                                            onSelectionStart={handleSelectionStart}
                                            onSelectionEnter={handleSelectionEnter}
                                            isSelected={selection ? (
                                                (selection.staffId === col.id || selection.roomId === col.id) &&
                                                SLOTS.indexOf(time) >= Math.min(SLOTS.indexOf(selection.start), SLOTS.indexOf(selection.end)) &&
                                                SLOTS.indexOf(time) <= Math.max(SLOTS.indexOf(selection.start), SLOTS.indexOf(selection.end))
                                            ) : false}
                                        />
                                    </div>
                                ));
                            })}

                            {/* Grouped Appointments & Blocks for Splitting Cells */}
                            {(() => {
                                const todayAppts = appointments.filter(a => a.date === selectedDate);
                                const todayBlocks = blocks.filter(b => b.date === selectedDate);
                                
                                // Group by staffId + time OR roomId + time
                                const groups: Record<string, { staffId?: string, roomId?: string, time: string, items: any[] }> = {};
                                
                                [...todayAppts.map(a => ({...a, _type: 'appt'})), ...todayBlocks.map(b => ({...b, _type: 'block'}))].forEach((item: any) => {
                                    const colId = viewMode === 'staff' ? item.staffId : item.roomId;
                                    const key = `${colId}-${item.time}`;
                                    if (!colId || !item.time) return;

                                    if (!groups[key]) groups[key] = { staffId: item.staffId, roomId: item.roomId, time: item.time, items: [] };
                                    groups[key].items.push(item);
                                });

                                return Object.values(groups).map((group: any) => {
                                    const colId = viewMode === 'staff' ? group.staffId : group.roomId;
                                    const colIdx = columnsToDisplay.findIndex(c => c.id === colId);
                                    if (colIdx === -1) return null;
                                    const slotIdx = SLOTS.indexOf(group.time);
                                    if (slotIdx === -1) return null;

                                    // Dinamik Span: Eğer içindeki bir eleman şu an büyütülüyorsa, kapsayıcıyı da büyüt
                                    let maxSpan = Math.max(...group.items.map((i: any) => Math.ceil(i.duration / SLOT_MINUTES)));
                                    if (resizingId && group.items.some((i: any) => i.id === resizingId)) {
                                        maxSpan = Math.max(maxSpan, Math.ceil(resizingDuration / SLOT_MINUTES));
                                    }

                                    return (
                                        <div 
                                            key={`${colId}-${group.time}`} 
                                            style={{ 
                                                gridColumn: colIdx + 1, 
                                                gridRowStart: slotIdx + 1, 
                                                gridRowEnd: `span ${maxSpan}`,
                                                position: 'relative',
                                                display: 'flex',
                                                gap: '2px',
                                                padding: '2px',
                                                zIndex: resizingId && group.items.some((i: any) => i.id === resizingId) ? 100 : 10
                                            }}
                                        >
                                            {group.items.map((item: any) => (
                                                <div key={item.id} className="flex-1 min-w-0 h-full">
                                                    <CalendarItem 
                                                        item={item} 
                                                        type={item._type as any} 
                                                        onCheckout={setCheckoutAppt} 
                                                        onAction={setActionAppt}
                                                        onResizeStart={(id, dur) => {
                                                            setResizingId(id);
                                                            setResizingDuration(dur);
                                                        }}
                                                        onResizeUpdate={(id, dur) => {
                                                            setResizingDuration(dur);
                                                        }}
                                                        onResizeEnd={() => {
                                                            setResizingId(null);
                                                            setResizingDuration(0);
                                                        }}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    );
                                });
                            })()}
                        </div>
                    </div>

                    <DragOverlay dropAnimation={null}>
                        {activeCustomer ? (
                            <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-2xl w-64 border-4 border-white animate-pulse">
                                <p className="text-[10px] font-black uppercase tracking-widest mb-1">Müşteri Taşınıyor</p>
                                <p className="font-black text-xl uppercase">{activeCustomer.name}</p>
                            </div>
                        ) : activeAppt ? (
                            <div className="bg-white rounded-[2rem] p-6 text-gray-900 shadow-2xl w-64 border-4 border-indigo-600 opacity-90">
                                <p className="text-[10px] font-black uppercase opacity-50 mb-1 tracking-widest">Randevu Kaydırılıyor</p>
                                <p className="font-black text-xl tracking-tight uppercase leading-none">{activeAppt.customerName}</p>
                            </div>
                        ) : null}
                    </DragOverlay>
                </div>

                <CustomerPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
            </DndContext>

            {selectedSlot && (
                <BookingModal 
                    initialData={{ 
                        staffId: selectedSlot.staffId || '', 
                        roomId: selectedSlot.roomId || '', 
                        time: selectedSlot.time,
                        duration: selectedSlot.duration
                    }} 
                    date={selectedDate} 
                    onClose={() => setSelectedSlot(null)} 
                />
            )}
            {checkoutAppt && <SmartCheckout appointment={checkoutAppt} onClose={() => setCheckoutAppt(null)} />}
            {dropPreview && (
                <ServiceDropModal
                    customer={dropPreview.customer}
                    staffId={dropPreview.staffId}
                    roomId={dropPreview.roomId}
                    time={dropPreview.time}
                    date={selectedDate}
                    onClose={() => setDropPreview(null)}
                />
            )}

            {/* Premium Date Picker Modal */}
            <AnimatePresence>
                {isDatePickerOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-8 bg-black/40 backdrop-blur-xl">
                        {/* Backdrop for explicit close */}
                        <motion.div 
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="absolute inset-0" onClick={() => setIsDatePickerOpen(false)} 
                        />
                        
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }} 
                            animate={{ scale: 1, opacity: 1, y: 0 }} 
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="relative bg-white rounded-[3rem] shadow-2xl border border-white/20 w-full max-w-4xl overflow-hidden flex flex-col md:flex-row h-[700px] z-10"
                        >
                            {/* Left Side: Shortcuts & Month Selection */}
                            <div className="w-full md:w-80 bg-gray-50 p-10 flex flex-col justify-between border-r border-gray-100">
                                <div>
                                    <div className="flex items-center gap-3 mb-10">
                                        <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-600/20">
                                            <CalendarIcon className="w-6 h-6 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-black tracking-tighter uppercase italic">Tarih Seç</h2>
                                    </div>

                                    <div className="space-y-4">
                                        {[
                                            { label: 'Bugün', date: new Date() },
                                            { label: 'Yarın', date: new Date(Date.now() + 86400000) },
                                            { label: 'Gelecek Pazartesi', date: (() => {
                                                const d = new Date();
                                                d.setDate(d.getDate() + ((7 - d.getDay() + 1) % 7 || 7));
                                                return d;
                                            })() },
                                            { label: 'Gelecek Ay', date: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1) },
                                        ].map((jump, i) => (
                                            <button 
                                                key={i}
                                                onClick={() => {
                                                    setSelectedDate(jump.date.toISOString().split('T')[0]);
                                                    setIsDatePickerOpen(false);
                                                }}
                                                className="w-full text-left px-6 py-4 rounded-2xl bg-white border border-gray-100 text-[10px] font-black uppercase tracking-widest hover:border-indigo-600 hover:text-indigo-600 transition-all flex justify-between items-center group"
                                            >
                                                {jump.label}
                                                <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-indigo-600 transition-transform group-hover:translate-x-1" />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-auto">
                                    <div className="p-6 bg-indigo-50 rounded-3xl border border-indigo-100">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Seçilen Tarih Özeti</p>
                                        <p className="text-lg font-black text-gray-900 tracking-tight">{new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</p>
                                        <p className="text-[10px] text-gray-500 font-bold uppercase mt-2">{appointments.filter(a => a.date === selectedDate).length} Mevcut Randevu</p>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: Month Grid */}
                            <div className="flex-1 p-10 flex flex-col">
                                <div className="flex justify-between items-center mb-10">
                                    <div className="flex items-center gap-4">
                                        <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() - 1, 1))} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-all">
                                            <ChevronLeft className="w-5 h-5" />
                                        </button>
                                        <h3 className="text-xl font-black tracking-tight uppercase italic min-w-[150px] text-center">
                                            {pickerMonth.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                                        </h3>
                                        <button onClick={() => setPickerMonth(new Date(pickerMonth.getFullYear(), pickerMonth.getMonth() + 1, 1))} className="p-3 bg-gray-50 rounded-2xl hover:bg-gray-100 text-gray-400 hover:text-indigo-600 transition-all">
                                            <ChevronRight className="w-5 h-5" />
                                        </button>
                                    </div>
                                    <button onClick={() => setIsDatePickerOpen(false)} className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[1.2rem] transition-all">
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                <div className="flex-1 grid grid-cols-7 gap-2">
                                    {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'].map(d => (
                                        <div key={d} className="text-center text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">
                                            {d}
                                        </div>
                                    ))}
                                    {(() => {
                                        const days = [];
                                        const year = pickerMonth.getFullYear();
                                        const month = pickerMonth.getMonth();
                                        const firstDayOffset = (new Date(year, month, 1).getDay() || 7) - 1;
                                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                                        
                                        // Previous month filler
                                        for (let i = 0; i < firstDayOffset; i++) {
                                            days.push(<div key={`prev-${i}`} className="h-16 opacity-30" />);
                                        }
                                        
                                        // Current month days
                                        for (let d = 1; d <= daysInMonth; d++) {
                                            const dateObj = new Date(year, month, d);
                                            const dateStr = dateObj.toISOString().split('T')[0];
                                            const isSelected = selectedDate === dateStr;
                                            const isToday = new Date().toISOString().split('T')[0] === dateStr;
                                            const apptCount = appointments.filter(a => a.date === dateStr).length;

                                            days.push(
                                                <button
                                                    key={d}
                                                    onClick={() => {
                                                        setSelectedDate(dateStr);
                                                        setIsDatePickerOpen(false);
                                                    }}
                                                    className={`h-20 rounded-2xl flex flex-col items-center justify-center gap-1.5 transition-all relative group
                                                        ${isSelected ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'hover:bg-gray-50 text-gray-900 border border-transparent hover:border-gray-200'}
                                                        ${isToday && !isSelected ? 'border-indigo-200 bg-indigo-50/30' : ''}
                                                    `}
                                                >
                                                    <span className={`text-base font-black ${isSelected ? 'text-white' : 'text-gray-900'}`}>{d}</span>
                                                    {apptCount > 0 && (
                                                        <div className="flex gap-0.5">
                                                            {Array.from({ length: Math.min(apptCount, 3) }).map((_, idx) => (
                                                                <div key={idx} className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-300' : 'bg-indigo-500'}`} />
                                                            ))}
                                                            {apptCount > 3 && <div className={`w-1 h-1 rounded-full ${isSelected ? 'bg-indigo-200' : 'bg-indigo-400'}`} />}
                                                        </div>
                                                    )}
                                                </button>
                                            );
                                        }
                                        return days;
                                    })()}
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Appointment Action Modal (Centralized) */}
            <AnimatePresence>
                {actionAppt && (
                    <div className="fixed inset-0 z-[2000] flex items-end sm:items-center justify-center p-3 sm:p-0 pointer-events-auto">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }} 
                            onClick={() => setActionAppt(null)}
                            className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xl"
                        />
                        
                        <motion.div 
                            initial={{ opacity: 0, y: 100, scale: 0.95 }} 
                            animate={{ opacity: 1, y: 0, scale: 1 }} 
                            exit={{ opacity: 0, y: 100, scale: 0.95 }}
                            transition={{ type: "spring", damping: 28, stiffness: 300 }}
                            className="relative w-full max-w-sm bg-white shadow-2xl rounded-[3rem] p-8 flex flex-col gap-4 font-sans border border-indigo-50"
                        >
                            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-2 sm:hidden" />
                            
                            <div className="text-center mb-4">
                                <h3 className="font-black text-2xl text-gray-900 leading-tight mb-1 uppercase italic tracking-tighter">{actionAppt.customerName}</h3>
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em]">{actionAppt.service} • {actionAppt.time} ({actionAppt.duration}dk)</p>
                            </div>

                            {!actionAppt.isPaid && (
                                <button 
                                    onClick={() => { setActionAppt(null); setCheckoutAppt(actionAppt); }}
                                    className="w-full bg-indigo-600 text-white rounded-[2rem] p-6 shadow-2xl shadow-indigo-600/30 flex items-center justify-center gap-4 transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden"
                                >
                                    <Banknote className="w-7 h-7" />
                                    <span className="font-black text-xl tracking-tight uppercase italic">Ödeme Al</span>
                                </button>
                            )}
                            
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={async () => { await updateAppointmentStatus(actionAppt.id, 'arrived'); setActionAppt(null); }}
                                    className={`p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-3 transition-all active:scale-95 ${actionAppt.status === 'arrived' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-white hover:border-indigo-600 hover:text-indigo-600'}`}
                                >
                                    <User className="w-6 h-6" /> Salona Geldi
                                </button>
                                <button 
                                    onClick={async () => { await updateAppointmentStatus(actionAppt.id, 'no-show'); setActionAppt(null); }}
                                    className={`p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex flex-col items-center gap-3 transition-all active:scale-95 ${actionAppt.status === 'no-show' ? 'bg-red-600 text-white shadow-xl shadow-red-600/20' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-white hover:border-red-600 hover:text-red-600'}`}
                                >
                                    <Ban className="w-6 h-6" /> Gelmedi
                                </button>
                                <button 
                                    onClick={async () => { await updateAppointmentStatus(actionAppt.id, 'excused'); setActionAppt(null); }}
                                    className={`col-span-2 p-5 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-4 transition-all active:scale-95 ${actionAppt.status === 'excused' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'bg-gray-50 text-gray-400 border border-gray-100 hover:bg-white hover:border-primary hover:text-primary'}`}
                                >
                                    <HeartHandshake className="w-5 h-5" /> Mazeretli İptal
                                </button>
                            </div>

                            <button 
                                onClick={async () => { if(confirm("Emin misiniz?")) { await deleteAppointment(actionAppt.id); setActionAppt(null); } }} 
                                className="w-full p-5 bg-white border-2 border-red-50 text-red-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 transition-all hover:bg-red-50 active:scale-95 shadow-sm"
                            >
                                <Trash2 className="w-4 h-4" /> Randevuyu Sil
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
