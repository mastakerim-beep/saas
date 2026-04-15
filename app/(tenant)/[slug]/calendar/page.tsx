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
    ChevronRight, ChevronLeft, Package, ShieldCheck, Target, Ban, Coffee, Info, Banknote, RefreshCcw, Cloud, CloudOff, Loader2, Trash2, MoreHorizontal, Search, Star, UserPlus, ChevronDown, Activity, HeartHandshake, MapPin, Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartCheckout from '@/components/SmartCheckout';
import BodyMap from '@/components/BodyMap';
import CustomerGallery from '@/components/CustomerGallery';
import BookingModal from '@/components/BookingModal';

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

// ---- DRAGGABLE APPOINTMENT CARD ----
function CalendarItem({ item, type, onCheckout }: { item: Appointment | CalendarBlock, type: 'appt' | 'block', onCheckout?: (a: Appointment) => void }) {
    const { deleteAppointment, updateAppointmentStatus, debts, rooms, packages, branches, currentBranch, customers } = useStore();
    
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

    const { attributes, listeners, setNodeRef: setDraggableRef, transform, isDragging } = useDraggable({
        id: item.id,
        data: { type: 'appointment', item },
        disabled: (isAppt && appt.syncStatus === 'syncing') || isLocked
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

    const [showMenu, setShowMenu] = useState(false);

    const span = Math.ceil(item.duration / SLOT_MINUTES);

    const room = isAppt && appt.roomId ? rooms.find(r => r.id === appt.roomId) : null;
    const pkg = isAppt && appt.packageId ? packages.find(p => p.id === appt.packageId) : null;

    const style = transform ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
        zIndex: 100,
    } : {
        gridRow: `span ${span}`,
        zIndex: 10
    };

    const handleDelete = async () => {
        if (confirm("Bu randevuyu kalıcı olarak silmek istediğinize emin misiniz?")) {
            await deleteAppointment(appt.id);
        }
        setShowMenu(false);
    };

    const setStatus = async (status: AppointmentStatus) => {
        await updateAppointmentStatus(appt.id, status);
        setShowMenu(false);
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
            {...listeners} 
            {...attributes}
            onClick={(e) => { e.stopPropagation(); if (isAppt) setShowMenu(true); }}
            className={`
                relative mx-1 rounded-[1rem] p-2.5 shadow-sm transition-all select-none group/item
                ${isDragging ? 'opacity-30 scale-95 shadow-xl ring-2 ring-indigo-500/50' : 'opacity-100 hover:scale-[1.01] hover:shadow-2xl hover:shadow-indigo-100'} 
                ${isOver ? 'ring-2 ring-indigo-400 bg-indigo-50/50 scale-[1.02]' : ''}
                ${isLocked ? 'cursor-default' : 'cursor-grab active:cursor-grabbing'}
                ${info.bg} ${info.ring} ${info.text} flex flex-col justify-between
            `}
        >
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
        </div>

        {/* Apple Style Action Sheet / Modal */}
        <AnimatePresence>
            {showMenu && isAppt && (
                <div className="fixed inset-0 z-[999] flex items-end sm:items-center justify-center p-3 sm:p-0 pointer-events-auto">
                    {/* Backdrop */}
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        exit={{ opacity: 0 }} 
                        onClick={(e) => { e.stopPropagation(); setShowMenu(false); }}
                        className="absolute inset-0 bg-indigo-950/30 backdrop-blur-md"
                    />
                    
                    {/* Action Sheet Card */}
                    <motion.div 
                        initial={{ opacity: 0, y: 100, scale: 0.95 }} 
                        animate={{ opacity: 1, y: 0, scale: 1 }} 
                        exit={{ opacity: 0, y: 100, scale: 0.95 }}
                        transition={{ type: "spring", damping: 28, stiffness: 300 }}
                        className="relative w-full max-w-sm bg-gray-50/95 backdrop-blur-2xl shadow-2xl rounded-[2.5rem] p-6 pb-8 sm:pb-6 flex flex-col gap-3 font-sans"
                    >
                        {/* Drag indicator (mobile) */}
                        <div className="w-12 h-1.5 bg-gray-300/80 rounded-full mx-auto mb-2 sm:hidden" />
                        
                        <div className="text-center mb-2">
                            <h3 className="font-black text-xl text-gray-900 leading-tight mb-0.5">{appt.customerName}</h3>
                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest">{appt.service} <span className="mx-1">•</span> {item.time} ({item.duration}dk)</p>
                        </div>

                        {/* Pay Action - Huge, Prominent */}
                        {!appt.isPaid && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onCheckout?.(appt); }}
                                className="w-full bg-indigo-600 text-white rounded-[2rem] p-5 shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 transition-transform active:scale-95 group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-150 transition-transform duration-500"><Banknote size={64}/></div>
                                <div className="bg-white/20 p-2.5 rounded-2xl group-active:scale-90 transition-transform relative z-10"><Banknote className="w-6 h-6" /></div>
                                <span className="font-black text-xl tracking-tight relative z-10">Kasa & Ödeme Al</span>
                            </button>
                        )}
                        
                        {/* Status Actions */}
                        <div className="grid grid-cols-2 gap-3 mt-2">
                            <button 
                                onClick={(e) => { e.stopPropagation(); setStatus('arrived'); }}
                                className={`p-4 rounded-3xl font-bold text-xs uppercase tracking-widest flex flex-col items-center gap-2 transition-transform active:scale-95 ${appt.status === 'arrived' ? 'bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500/20' : 'bg-white shadow-sm text-gray-600 border border-gray-100'}`}
                            >
                                <User className={`w-6 h-6 ${appt.status === 'arrived' ? 'text-indigo-600' : 'text-gray-400'}`} /> Salona Geldi
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setStatus('no-show'); }}
                                className={`p-4 rounded-3xl font-bold text-xs uppercase tracking-widest flex flex-col items-center gap-2 transition-transform active:scale-95 ${appt.status === 'no-show' ? 'bg-red-100 text-red-700 ring-2 ring-red-500/20' : 'bg-white shadow-sm text-gray-600 border border-gray-100'}`}
                            >
                                <Ban className={`w-6 h-6 ${appt.status === 'no-show' ? 'text-red-600' : 'text-gray-400'}`} />
                                <div className="flex flex-col items-center gap-1">
                                    <span>Gelmedi</span>
                                    <span className="text-[8px] font-black bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full">Paketten Düşer</span>
                                </div>
                            </button>
                            <button 
                                onClick={(e) => { e.stopPropagation(); setStatus('excused'); }}
                                className={`col-span-2 p-4 rounded-3xl font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 ${appt.status === 'excused' ? 'bg-primary/10 text-primary ring-2 ring-primary/20' : 'bg-white shadow-sm text-gray-600 border border-gray-100'}`}
                            >
                                <HeartHandshake className={`w-5 h-5 ${appt.status === 'excused' ? 'text-primary' : 'text-gray-400'}`} />
                                Mazeretli İptal
                                <span className="text-[9px] font-black bg-primary/10 text-primary px-2 py-0.5 rounded-full ml-1">Paketten Düşmez</span>
                            </button>
                        </div>

                        {/* Delete Action */}
                        <button 
                            onClick={(e) => { e.stopPropagation(); handleDelete(); }} 
                            className="mt-2 w-full p-4 bg-white border border-red-100 text-red-500 rounded-3xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-transform active:scale-95 shadow-sm"
                        >
                            <Trash2 className="w-4 h-4" /> Randevuyu Sil
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
        </>
    );
}

// ---- DROPPABLE SLOT ----
function TimeSlot({ staffId, time, isOff, onAdd }: { staffId: string, time: string, isOff: boolean, onAdd: (s: string, t: string) => void }) {
    const isHourStart = time.endsWith(':00');
    const { isOver, setNodeRef } = useDroppable({
        id: `slot-${staffId}-${time}`,
        data: { type: 'slot', staffId, time },
        disabled: isOff
    });

    return (
        <div 
            ref={setNodeRef}
            onClick={() => !isOff && onAdd(staffId, time)}
            className={`
                h-[48px] border-r border-white/5 transition-all relative
                ${isHourStart ? 'border-t-2 border-t-white/10' : 'border-t border-t-white/5'}
                ${isOff ? 'bg-[#FEF9E7]/50 cursor-not-allowed' : (isOver ? 'bg-primary/20 border-2 border-primary/50 z-10 scale-[1.01]' : 'bg-[#FEF9E7] hover:bg-primary/[0.03] cursor-pointer')}
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
function ServiceDropModal({ customer, staffId, time, date, onClose }: { customer: Customer, staffId: string, time: string, date: string, onClose: () => void }) {
    const { addAppointment, staffMembers, services, rooms } = useStore();
    const [selectedService, setSelectedService] = useState<string>(services[0]?.name || '');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(rooms[0]?.id || null);
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [showBodyMap, setShowBodyMap] = useState(false);
    const [note, setNote] = useState('');

    const staff = staffMembers.find(s => s.id === staffId);

    const handleSave = async () => {
        if (!staff) return;
        setIsSaving(true);
        const svc = services.find(s => s.name === selectedService);
        if(!svc) return;
        await addAppointment({
            customerId: customer.id,
            customerName: customer.name,
            service: svc.name,
            staffId: staff.id,
            staffName: staff.name,
            roomId: selectedRoomId,
            date,
            time,
            duration: svc.duration,
            status: 'pending',
            price: svc.price,
            depositPaid: 0,
            isOnline: false,
            selectedRegions,
            note
        });
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-[200] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
            <div className="modal-premium w-full max-w-md overflow-hidden animate-[slideUp_0.3s_ease]">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-1">
                            <Sparkles className="w-3 h-3 text-primary" />
                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Hızlı Randevu Kaydı</p>
                        </div>
                        <h3 className="text-xl font-black text-gray-900 leading-none">{customer.name}</h3>
                        <div className="flex items-center gap-2 mt-2">
                             <span className="text-[10px] font-black bg-gray-100 px-2 py-0.5 rounded text-gray-400 uppercase">{staff?.name}</span>
                             <span className="text-[10px] font-black bg-primary/10 px-2 py-0.5 rounded text-primary uppercase">{time}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition">
                        <X className="w-5 h-5 text-gray-400" />
                    </button>
                </div>

                <div className="p-8 space-y-3">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Hizmet Seçimi</p>
                    <div className="grid grid-cols-1 gap-2">
                        {services.map(s => (
                            <button
                                key={s.id}
                                onClick={() => setSelectedService(s.name)}
                                className={`group w-full p-4 rounded-2xl border-2 flex justify-between items-center transition-all ${selectedService === s.name ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-[1.02]' : 'bg-gray-50 border-transparent text-gray-500 hover:border-primary/30'}`}
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-2.5 h-2.5 rounded-full ${s.color} ${selectedService === s.name ? 'bg-white' : ''}`} />
                                    <span className="text-sm font-black">{s.name}</span>
                                </div>
                                <span className={`text-[10px] font-bold ${selectedService === s.name ? 'opacity-80' : 'opacity-40'}`}>{s.duration} dk • ₺{s.price.toLocaleString('tr-TR')}</span>
                            </button>
                        ))}
                    </div>

                    <div className="pt-4 space-y-3">
                        <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Oda Atama</p>
                        <div className="flex flex-wrap gap-2">
                            {rooms.map(room => (
                                <button 
                                    key={room.id}
                                    onClick={() => setSelectedRoomId(room.id)}
                                    className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all border-2 ${selectedRoomId === room.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 border-transparent text-gray-400 hover:border-primary/20'}`}
                                >
                                    {room.name}
                                </button>
                            ))}
                        </div>
                    </div>

                    <button 
                        onClick={() => setShowBodyMap(true)}
                        className={`w-full p-4 rounded-2xl border-2 border-dashed flex items-center justify-center gap-3 transition-all ${selectedRegions.length > 0 ? 'bg-primary/10 border-primary/30 text-primary' : 'bg-gray-50 border-gray-100 text-gray-400 hover:border-primary/30'}`}
                    >
                        <Activity className="w-4 h-4" />
                        <span className="text-xs font-black">
                            {selectedRegions.length > 0 ? `${selectedRegions.length} Bölge Seçildi` : 'Vücut Notu Ekle (Opsiyonel)'}
                        </span>
                    </button>

                    <div className="pt-2">
                        <textarea 
                            value={note}
                            onChange={e => setNote(e.target.value)}
                            placeholder="Örn: mb MİRA"
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-[11px] font-bold text-gray-900 outline-none focus:border-primary/30 transition-all resize-none min-h-[60px]"
                        />
                    </div>

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full mt-4 py-5 rounded-3xl font-black text-sm shadow-xl flex items-center justify-center gap-3 bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-50 shadow-primary/20"
                    >
                        {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5 text-white" />}
                        {isSaving ? 'Rezervasyon İşleniyor...' : 'Takvime İşle ✓'}
                    </button>

                    {showBodyMap && (
                        <div className="fixed inset-0 bg-background/90 backdrop-blur-md z-[250] flex items-center justify-center p-4 animate-[fadeIn_0.2s_ease]">
                            <div className="modal-premium p-8 max-w-sm w-full relative animate-[zoomIn_0.3s_ease]">
                                <button onClick={() => setShowBodyMap(false)} className="absolute top-6 right-6 p-2 text-gray-400 hover:text-red-500"><X /></button>
                                <div className="p-2 bg-gray-50 rounded-3xl mb-4">
                                    <BodyMap 
                                        selectedRegions={selectedRegions} 
                                        onToggleRegion={(id) => setSelectedRegions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} 
                                    />
                                </div>
                                <button onClick={() => setShowBodyMap(false)} className="w-full mt-2 py-5 bg-primary text-white rounded-3xl font-black text-sm shadow-xl shadow-primary/20 transition-transform active:scale-95">Notu Onayla</button>
                            </div>
                        </div>
                    )}
                    <p className="text-[9px] text-gray-600 text-center font-bold uppercase tracking-widest mt-4">Onay mesajı otomatik gönderilecek</p>
                </div>
            </div>
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
    const { staffMembers, appointments, blocks, settings, moveAppointment, syncStatus, customers, isOnline } = useStore();
    const [selectedSlot, setSelectedSlot] = useState<{staffId: string, time: string} | null>(null);
    const [checkoutAppt, setCheckoutAppt] = useState<Appointment | null>(null);
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragData, setActiveDragData] = useState<any>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [dropPreview, setDropPreview] = useState<{ customer: Customer, staffId: string, time: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState(formatDate(new Date()));
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [pickerMonth, setPickerMonth] = useState(new Date());

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
        useSensor(MouseSensor),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
    );

    const SLOTS = useMemo(() => generateSlots(settings.startHour, settings.endHour), [settings]);
    const dayOfWeek = new Date(selectedDate).getDay();

    const staffToDisplay = useMemo(() => {
        return staffMembers
            .filter(s => {
                const isActive = s.status === 'Aktif';
                const hasApptToday = appointments.some(a => a.staffId === s.id && a.date === selectedDate);
                const isExplicitlyHidden = s.isVisibleOnCalendar === false;
                
                // 1. Eğer açıkça gizlenmişse gösterme (Örn: Sadece arkada çalışanlar)
                if (isExplicitlyHidden) return false;

                // 2. Aktifse göster
                if (isActive) return true;
                
                // 3. Pasif/Ayrıldı olsa bile o gün randevusu varsa "Akıllı Görünürlük" gereği göster
                if (hasApptToday) return true;
                
                return false;
            })
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [staffMembers, appointments, selectedDate]);

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
                time: overData.time,
            });
            return;
        }

        if (activeData?.type === 'appointment' && overData?.type === 'slot') {
            const [staffId, time] = [overData.staffId, overData.time];
            await moveAppointment(active.id as string, time, staffId);
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
                        <button className="flex items-center gap-3 px-6 py-3 bg-white border border-gray-200 rounded-2xl text-[11px] font-black uppercase tracking-widest hover:border-indigo-600 transition-all shadow-sm">
                            <CalendarIcon size={16} className="text-indigo-600" />
                            Personel Takvimi
                            <ChevronDown size={14} className="text-gray-400" />
                        </button>
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
                    {/* Staff Header */}
                    <div className="flex border-b border-gray-100 bg-gray-50/50 flex-none ml-[80px] sticky top-0 z-30 shadow-sm backdrop-blur-md">
                        {staffToDisplay.map(staff => (
                            <div key={staff.id} className="flex-1 p-4 text-center border-r border-gray-100 relative group">
                                {staff.weeklyOffDay === dayOfWeek && <div className="absolute inset-0 bg-red-500/5 flex items-center justify-center"><span className="text-[8px] font-black text-red-500 border border-red-500 px-2 py-0.5 rounded-full rotate-[-15deg] bg-white">İZİNLİ</span></div>}
                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-[0.2em] mb-1 group-hover:text-indigo-600 transition-colors uppercase">Uzman</p>
                                <p className="font-extrabold text-gray-900 uppercase tracking-tight text-sm uppercase">{staff.name}</p>
                            </div>
                        ))}
                    </div>

                    <div className="flex-1 overflow-y-auto no-scrollbar relative flex">
                        {/* Time labels */}
                        <div className="w-[80px] flex-none border-r border-gray-100 bg-white sticky left-0 z-20">
                            {SLOTS.map(slot => {
                                const isHour = slot.endsWith(':00');
                                return (
                                    <div key={slot} className={`h-[48px] flex items-center justify-center ${isHour ? 'border-t border-gray-100' : ''}`}>
                                        <span className={`text-[10px] font-black ${isHour ? 'text-gray-900 italic' : 'text-gray-300'}`}>{isHour ? slot : ''}</span>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Grid */}
                        <div className="flex-1 grid relative bg-[#FEF9E7]" style={{ gridTemplateColumns: `repeat(${staffToDisplay.length || 1}, 1fr)`, gridTemplateRows: `repeat(${SLOTS.length}, 48px)` }}>
                            {staffToDisplay.map((staff, colIdx) => {
                                const isOff = staff.weeklyOffDay === dayOfWeek;
                                return SLOTS.map((slot, rowIdx) => (
                                    <div key={`${staff.id}-${slot}`} style={{ gridColumn: colIdx + 1, gridRow: rowIdx + 1 }}>
                                        <TimeSlot staffId={staff.id} time={slot} isOff={isOff} onAdd={(s, t) => setSelectedSlot({ staffId: s, time: t })} />
                                    </div>
                                ));
                            })}

                            {/* Grouped Appointments & Blocks for Splitting Cells */}
                            {(() => {
                                const todayAppts = appointments.filter(a => a.date === selectedDate);
                                const todayBlocks = blocks.filter(b => b.date === selectedDate);
                                
                                // Group by staffId + time
                                const groups: Record<string, { staffId: string, time: string, items: any[] }> = {};
                                
                                [...todayAppts.map(a => ({...a, _type: 'appt'})), ...todayBlocks.map(b => ({...b, _type: 'block'}))].forEach(item => {
                                    if (!item.staffId || !item.time) return;
                                    const key = `${item.staffId}-${item.time}`;
                                    if (!groups[key]) groups[key] = { staffId: item.staffId as string, time: item.time as string, items: [] };
                                    groups[key].items.push(item);
                                });

                                return Object.values(groups).map(group => {
                                    const staffIdx = staffToDisplay.findIndex(s => s.id === group.staffId);
                                    if (staffIdx === -1) return null;
                                    const slotIdx = SLOTS.indexOf(group.time);
                                    if (slotIdx === -1) return null;

                                    return (
                                        <div 
                                            key={`${group.staffId}-${group.time}`} 
                                            style={{ 
                                                gridColumn: staffIdx + 1, 
                                                gridRowStart: slotIdx + 1, 
                                                gridRowEnd: `span ${Math.max(...group.items.map(i => Math.ceil(i.duration / SLOT_MINUTES)))}`,
                                                position: 'relative',
                                                display: 'flex',
                                                gap: '2px',
                                                padding: '2px',
                                                zIndex: 10
                                            }}
                                        >
                                            {group.items.map((item) => (
                                                <div key={item.id} className="flex-1 min-w-0 h-full">
                                                    <CalendarItem 
                                                        item={item} 
                                                        type={item._type as any} 
                                                        onCheckout={setCheckoutAppt} 
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

            {selectedSlot && <BookingModal initialData={selectedSlot} date={selectedDate} onClose={() => setSelectedSlot(null)} />}
            {checkoutAppt && <SmartCheckout appointment={checkoutAppt} onClose={() => setCheckoutAppt(null)} />}
            {dropPreview && (
                <ServiceDropModal
                    customer={dropPreview.customer}
                    staffId={dropPreview.staffId}
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
        </div>
    );
}
