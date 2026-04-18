"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore, Appointment, Staff, CalendarBlock, Customer, AppointmentStatus, Service } from '@/lib/store';
import { 
    DndContext, 
    DragEndEvent,
    PointerSensor,
    MouseSensor,
    TouchSensor,
    useSensor,
    useSensors,
    DragOverlay,
} from '@dnd-kit/core';
import { 
    X, Plus, Sparkles, Clock, User, 
    ChevronRight, ChevronLeft, Info, Banknote, RefreshCcw, Loader2, Search, Star, MapPin, 
    CheckCircle2, XCircle, Trash2, Calendar as CalendarIcon, ExternalLink
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import SmartCheckout from '@/components/checkout/SmartCheckout';
import BodyMap from '@/components/crm/BodyMap';
import CustomerGallery from '@/components/crm/CustomerGallery';
import BookingModal from '@/components/calendar/BookingModal';

// ---- NEW COMPONENTS ----
import CalendarHeader from './components/CalendarHeader';
import CalendarItem from './components/CalendarItem';
import TimeSlot from './components/TimeSlot';
import ServiceDropModal from './components/ServiceDropModal';
import CustomerPanel from './components/CustomerPanel';
import DraggableCustomerCard from './components/DraggableCustomerCard';

// ---- CONFIG & UTILS ----
const SLOT_MINUTES = 15;
const SLOT_HEIGHT = 42;
const PX_PER_MIN = SLOT_HEIGHT / 15;

const formatDate = (date: Date) => {
    return date.toLocaleDateString('sv-SE');
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

export default function CalendarPage() {
    const { 
        staffMembers, appointments, blocks, settings, moveAppointment, 
        syncStatus, customers, isOnline, rooms, currentBranch, 
        updateAppointmentStatus, deleteAppointment, updateBlock 
    } = useStore();
    
    const searchParams = useSearchParams();
    
    // URL Params Sync
    const initialView = searchParams.get('view') === 'room' ? 'room' : 'staff';
    const initialDate = searchParams.get('date') || formatDate(new Date());

    const [viewMode, setViewMode] = useState<'staff' | 'room'>(initialView);
    const [selectedSlot, setSelectedSlot] = useState<{staffId?: string, roomId?: string, time: string, duration?: number} | null>(null);
    const [selection, setSelection] = useState<{ staffId?: string, roomId?: string, start: string, end: string } | null>(null);
    const [isSelecting, setIsSelecting] = useState(false);
    const [checkoutAppt, setCheckoutAppt] = useState<Appointment | null>(null);
    const [actionAppt, setActionAppt] = useState<Appointment | null>(null); // For blocks
    const [actionMenuAppt, setActionMenuAppt] = useState<Appointment | null>(null); // For appointment details/actions
    const [activeId, setActiveId] = useState<string | null>(null);
    const [activeDragData, setActiveDragData] = useState<any>(null);
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [dropPreview, setDropPreview] = useState<{ customer: Customer, staffId?: string, roomId?: string, time: string } | null>(null);
    const [selectedDate, setSelectedDate] = useState(initialDate);
    const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
    const [pickerMonth, setPickerMonth] = useState(new Date());

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 3 } }),
        useSensor(MouseSensor),
        useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
    );

    const SLOTS = useMemo(() => generateSlots(settings.startHour, settings.endHour), [settings]);
    const dayOfWeek = new Date(selectedDate + 'T00:00:00').getDay();
    const staffToDisplay = useMemo(() => {
        return staffMembers
            .filter(s => {
                // Şube seçilmişse: Sadece o şubeye ait olanlar VEYA hiç şubesi atanmamış olanlar görünsün.
                if (currentBranch?.id && s.branchId && s.branchId !== currentBranch.id) return false;
                
                const isActive = s.status === 'active';
                const hasApptToday = appointments.some(a => a.staffId === s.id && a.date === selectedDate);
                const isExplicitlyHidden = s.isVisibleOnCalendar === false;
                
                if (isExplicitlyHidden) return false;
                if (isActive) return true;
                if (hasApptToday) return true;
                return false;
            })
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
    }, [staffMembers, appointments, selectedDate, currentBranch]);

    const roomsToDisplay = useMemo(() => {
        return (rooms || []).filter(r => r.status !== 'passive');
    }, [rooms]);

    // ---- HANDLERS ----
    const handleDragStart = (event: any) => {
        setActiveId(event.active.id);
        setActiveDragData(event.active.data.current);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveId(null);
        setActiveDragData(null);

        if (!over) return;

        const activeData = active.data.current;
        const overData = over.data.current;

        // Customer Drop Logic
        if (activeData?.type === 'customer' && overData?.type === 'slot') {
            setDropPreview({
                customer: activeData.customer,
                staffId: overData.staffId,
                roomId: overData.roomId,
                time: overData.time
            });
            return;
        }

        // Appointment/Block Move Logic
        if (activeData?.type === 'appointment' && overData?.type === 'slot') {
            const appt = activeData.item as Appointment;
            await moveAppointment(appt.id, overData.time, overData.staffId, overData.roomId);
        } else if (activeData?.type === 'block' && overData?.type === 'slot') {
            const block = activeData.item as CalendarBlock;
            await updateBlock(block.id, { 
                time: overData.time, 
                staffId: overData.staffId || null, 
                roomId: overData.roomId || null 
            });
        }
    };

    const handleSelectionStart = (id: string, time: string) => {
        setIsSelecting(true);
        const pos = { [viewMode === 'staff' ? 'staffId' : 'roomId']: id, start: time, end: time };
        setSelection(pos as any);
    };

    const handleSelectionEnter = (time: string) => {
        if (!isSelecting || !selection) return;
        setSelection({ ...selection, end: time });
    };

    const handleSelectionEnd = () => {
        if (!isSelecting || !selection) return;
        setIsSelecting(false);
        
        const [startH, startM] = selection.start.split(':').map(Number);
        const [endH, endM] = selection.end.split(':').map(Number);
        const startTime = Math.min(startH * 60 + startM, endH * 60 + endM);
        const endTime = Math.max(startH * 60 + startM, endH * 60 + endM) + SLOT_MINUTES;
        
        setSelectedSlot({
            staffId: selection.staffId,
            roomId: selection.roomId,
            time: `${Math.floor(startTime / 60).toString().padStart(2, '0')}:${(startTime % 60).toString().padStart(2, '0')}`,
            duration: endTime - startTime
        });
        setSelection(null);
    };

    const nextDay = () => {
        const d = new Date(selectedDate + 'T00:00:00');
        d.setDate(d.getDate() + 1);
        setSelectedDate(formatDate(d));
    };

    const prevDay = () => {
        const d = new Date(selectedDate + 'T00:00:00');
        d.setDate(d.getDate() - 1);
        setSelectedDate(formatDate(d));
    };

    const goToday = () => setSelectedDate(formatDate(new Date()));

    const changePickerMonth = (offset: number) => {
        const d = new Date(pickerMonth);
        d.setMonth(d.getMonth() + offset);
        setPickerMonth(d);
    };

    return (
        <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="flex flex-col h-screen bg-[#fafafa] overflow-hidden select-none" onMouseUp={handleSelectionEnd}>
                
                <CalendarHeader 
                    selectedDate={selectedDate}
                    onPrevDay={prevDay}
                    onNextDay={nextDay}
                    onToday={goToday}
                    onDatePickerToggle={() => setIsDatePickerOpen(!isDatePickerOpen)}
                    currentBranch={currentBranch}
                    viewMode={viewMode}
                    setViewMode={setViewMode}
                    syncStatus={syncStatus}
                    onPanelToggle={() => setIsPanelOpen(!isPanelOpen)}
                />

                <main className="flex-1 flex overflow-hidden relative">
                    <div className="flex-1 flex flex-col overflow-hidden">
                        {/* Time Grid Wrapper */}
                        <div className="flex-1 overflow-x-auto overflow-y-auto no-scrollbar relative bg-white">
                            <div className="flex min-w-max h-full relative">
                                
                                {/* Time Column */}
                                <div className="sticky left-0 w-24 bg-white/95 backdrop-blur-md z-30 border-r border-gray-100 flex flex-col pt-[80px] shadow-2xl shadow-indigo-50/20">
                                    {SLOTS.map(time => {
                                        const isHour = time.endsWith(':00');
                                        return (
                                            <div key={time} className={`h-[42px] flex items-center justify-center relative group/time px-2 ${isHour ? 'bg-indigo-50/30' : ''}`}>
                                                <div className={`
                                                    w-full h-8 rounded-xl flex items-center justify-center transition-all duration-300
                                                    ${isHour ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 ring-2 ring-indigo-500/20' : 'bg-gray-50/50 text-gray-400 border border-gray-100/50 group-hover/time:bg-white'}
                                                `}>
                                                    <span className={`text-[10px] font-black tracking-tight tabular-nums ${isHour ? '' : 'text-[9px] opacity-60'}`}>
                                                        {time}
                                                    </span>
                                                </div>
                                                {isHour && (
                                                    <div className="absolute right-0 w-1.5 h-full flex flex-col justify-center">
                                                        <div className="w-full h-1/2 bg-indigo-600/10 rounded-l-full" />
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Columns Grid */}
                                <div className="flex flex-1 min-w-full">
                                    {(viewMode === 'staff' ? staffToDisplay : roomsToDisplay).map(target => (
                                        <div key={target.id} className="min-w-[280px] flex-1 flex flex-col relative group/col border-r border-gray-100/30">
                                            {/* Column Header */}
                                            <div className="sticky top-0 h-[80px] bg-white/90 backdrop-blur-xl z-20 border-b border-gray-100 flex flex-col items-center justify-center group-hover/col:bg-indigo-50/20 transition-all px-4">
                                                <div className="relative">
                                                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-50 to-gray-50 flex items-center justify-center mb-1 group-hover/col:scale-110 transition-transform duration-500 shadow-sm border border-gray-100">
                                                        <User size={18} className="text-gray-400 group-hover/col:text-indigo-600" />
                                                    </div>
                                                    {viewMode === 'staff' && (target as Staff).status === 'active' && (
                                                        <div className="absolute -top-1 -right-1 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white shadow-sm" />
                                                    )}
                                                </div>
                                                <h3 className="text-[10px] font-black text-gray-900 uppercase tracking-widest truncate w-full text-center">{target.name}</h3>
                                            </div>

                                            {/* Slots Grid */}
                                            <div className="relative flex-1">
                                                {SLOTS.map(time => {
                                                    const isSelected = !!selection && selection[viewMode === 'staff' ? 'staffId' : 'roomId'] === target.id && 
                                                        time >= (selection.start < selection.end ? selection.start : selection.end) && 
                                                        time <= (selection.start < selection.end ? selection.end : selection.start);
                                                    
                                                    const isOff = viewMode === 'staff' && (target as Staff).offDay === dayOfWeek;
                                                    
                                                    return (
                                                        <TimeSlot 
                                                            key={time}
                                                            staffId={viewMode === 'staff' ? target.id : undefined}
                                                            roomId={viewMode === 'room' ? target.id : undefined}
                                                            time={time}
                                                            isOff={isOff}
                                                            isSelected={isSelected}
                                                            onAdd={(data) => setSelectedSlot(data)}
                                                            onSelectionStart={handleSelectionStart}
                                                            onSelectionEnter={handleSelectionEnter}
                                                        />
                                                    );
                                                })}

                                                {/* Global Items (Appointments & Blocks) */}
                                                <div className="absolute inset-0 pointer-events-none">
                                                    {(viewMode === 'staff' 
                                                        ? [...appointments.filter(a => a.staffId === target.id), ...blocks.filter(b => b.staffId === target.id && b.date === selectedDate)]
                                                        : [...appointments.filter(a => a.roomId === target.id), ...blocks.filter(b => b.roomId === target.id && b.date === selectedDate)]
                                                    ).filter(item => item.date === selectedDate).map(item => {
                                                        const [h, m] = item.time.split(':').map(Number);
                                                        const startMinutes = (h - settings.startHour) * 60 + m;
                                                        const top = (startMinutes / SLOT_MINUTES) * SLOT_HEIGHT;
                                                        const height = (item.duration || 60) * (SLOT_HEIGHT / 15);
                                                        
                                                        return (
                                                            <div key={item.id} className="absolute inset-x-0 pointer-events-auto" style={{ top, height }}>
                                                                <CalendarItem 
                                                                    item={item} 
                                                                    type={(item as Appointment).customerId ? 'appt' : 'block'}
                                                                    onAction={(data) => {
                                                                        if ((data as Appointment).customerId) {
                                                                            setActionMenuAppt(data as Appointment);
                                                                        } else {
                                                                            setActionAppt(data as Appointment);
                                                                        }
                                                                    }}
                                                                />
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Left/Right Overlays */}
                    <CustomerPanel isOpen={isPanelOpen} onClose={() => setIsPanelOpen(false)} />
                </main>

                <DragOverlay>
                    {activeId && activeDragData?.type === 'customer' && (
                        <div className="w-64">
                            <DraggableCustomerCard customer={activeDragData.customer} />
                        </div>
                    )}
                    {activeId && (activeDragData?.type === 'appointment' || activeDragData?.type === 'block') && (
                        <div className="w-[260px] opacity-80 cursor-grabbing rotate-2 shadow-2xl">
                             <CalendarItem item={activeDragData.item} type={activeDragData.type === 'appointment' ? 'appt' : 'block'} />
                        </div>
                    )}
                </DragOverlay>

                {/* Date Picker Modal */}
                <AnimatePresence>
                    {isDatePickerOpen && (
                        <div className="fixed inset-0 z-[600] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setIsDatePickerOpen(false)}
                                className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xl"
                            />
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                                className="relative bg-white p-10 rounded-[3rem] shadow-2xl border border-gray-100 w-full max-w-md"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <h3 className="text-xl font-black text-gray-900 uppercase italic">Tarih Seçimi</h3>
                                    <div className="flex gap-2">
                                        <button onClick={() => changePickerMonth(-1)} className="p-3 hover:bg-gray-100 rounded-2xl"><ChevronLeft size={20} /></button>
                                        <button onClick={() => changePickerMonth(1)} className="p-3 hover:bg-gray-100 rounded-2xl"><ChevronRight size={20} /></button>
                                    </div>
                                </div>
                                <div className="grid grid-cols-7 gap-1 mb-4">
                                    {['Pz', 'Pt', 'Sa', 'Ça', 'Pe', 'Cu', 'Ct'].map(d => (
                                        <div key={d} className="h-10 flex items-center justify-center text-[10px] font-black text-gray-400 uppercase">{d}</div>
                                    ))}
                                    {Array.from({ length: 42 }).map((_, i) => {
                                        const d = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), 1);
                                        const startDay = d.getDay();
                                        const date = new Date(pickerMonth.getFullYear(), pickerMonth.getMonth(), i - startDay + 1);
                                        const isCurrentMonth = date.getMonth() === pickerMonth.getMonth();
                                        const dateStr = formatDate(date);
                                        const isSelected = dateStr === selectedDate;

                                        return (
                                            <button
                                                key={i}
                                                onClick={() => { setSelectedDate(dateStr); setIsDatePickerOpen(false); }}
                                                className={`h-12 w-full rounded-2xl text-xs font-bold transition-all ${!isCurrentMonth ? 'opacity-20' : ''} ${isSelected ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-200' : 'hover:bg-indigo-50 text-gray-700'}`}
                                            >
                                                {date.getDate()}
                                            </button>
                                        );
                                    })}
                                </div>
                                <button onClick={() => { setSelectedDate(formatDate(new Date())); setIsDatePickerOpen(false); }} className="w-full py-5 bg-gray-50 text-indigo-600 font-black text-[11px] uppercase rounded-2.5xl hover:bg-indigo-50 transition-all mt-4">BUGÜNE DÖN</button>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Other Modals */}
                {selectedSlot && (
                    <BookingModal 
                        isOpen={!!selectedSlot}
                        onClose={() => setSelectedSlot(null)}
                        date={selectedDate}
                        initialData={{
                            time: selectedSlot.time,
                            duration: selectedSlot.duration || SLOT_MINUTES,
                            staffId: selectedSlot.staffId,
                            roomId: selectedSlot.roomId
                        }}
                    />
                )}
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
                {checkoutAppt && <SmartCheckout appointment={checkoutAppt} onClose={() => setCheckoutAppt(null)} />}
                {actionAppt && (
                    <BookingModal 
                        isOpen={!!actionAppt} 
                        onClose={() => setActionAppt(null)} 
                        date={actionAppt.date}
                        initialData={actionAppt} 
                        mode="edit" 
                    />
                )}

                <AnimatePresence>
                    {actionMenuAppt && (
                        <div className="fixed inset-0 z-[700] flex items-center justify-center p-4">
                            <motion.div 
                                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                onClick={() => setActionMenuAppt(null)}
                                className="absolute inset-0 bg-indigo-950/40 backdrop-blur-xl"
                            />
                            <motion.div 
                                initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                                className="relative bg-white/90 backdrop-blur-2xl rounded-[3rem] shadow-2xl border border-white overflow-hidden w-full max-w-sm"
                            >
                                {/* Modal Header with Luxury Accent */}
                                <div className="h-2 w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-500" />
                                
                                <div className="p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div className="flex items-center gap-4">
                                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center text-white font-black text-xl shadow-xl shadow-indigo-100">
                                                {actionMenuAppt.customerName.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.2em] block mb-0.5">Müşteri İşlemleri</span>
                                                <h3 className="text-xl font-black text-gray-900 tracking-tight italic">{actionMenuAppt.customerName}</h3>
                                            </div>
                                        </div>
                                        <button onClick={() => setActionMenuAppt(null)} className="p-3 hover:bg-white/50 rounded-2xl transition-colors border border-transparent hover:border-gray-100">
                                            <X size={20} className="text-gray-400" />
                                        </button>
                                    </div>

                                    {/* Action Cards Grid */}
                                    <div className="space-y-4">
                                        <button 
                                            onClick={async () => {
                                                await updateAppointmentStatus(actionMenuAppt.id, 'arrived');
                                                setActionMenuAppt(null);
                                            }}
                                            className="w-full flex items-center gap-4 p-5 bg-white hover:bg-indigo-50/50 rounded-[2rem] transition-all group border border-gray-100 hover:border-indigo-200 shadow-sm"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 transition-transform group-hover:scale-110 shadow-inner">
                                                <CheckCircle2 size={24} />
                                            </div>
                                            <div className="text-left">
                                                <p className="font-black text-indigo-900 text-sm uppercase italic">Giriş Yapıldı</p>
                                                <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Müşteri salona geldi</p>
                                            </div>
                                        </button>

                                        <button 
                                            onClick={() => {
                                                setCheckoutAppt(actionMenuAppt);
                                                setActionMenuAppt(null);
                                            }}
                                            className="w-full flex items-center gap-4 p-5 bg-gradient-to-br from-emerald-600 to-teal-700 hover:shadow-xl hover:shadow-emerald-200/50 rounded-[2rem] transition-all group border border-emerald-500/20"
                                        >
                                            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-transform group-hover:scale-110">
                                                <Banknote size={24} />
                                            </div>
                                            <div className="text-left text-white">
                                                <p className="font-black text-sm uppercase italic">Ödeme Al / Checkout</p>
                                                <p className="text-[10px] text-emerald-100 font-bold uppercase tracking-widest opacity-80">Tahsilat Safhası</p>
                                            </div>
                                        </button>

                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                onClick={async () => {
                                                    await updateAppointmentStatus(actionMenuAppt.id, 'unexcused-cancel');
                                                    setActionMenuAppt(null);
                                                }}
                                                className="flex flex-col items-center gap-2 p-5 bg-orange-50/50 hover:bg-orange-50 rounded-[2rem] transition-all group border border-orange-100/50 shadow-sm"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-orange-600">
                                                    <XCircle size={20} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-black text-orange-950 text-[11px] uppercase italic">Gelmedi</p>
                                                    <p className="text-[8px] text-orange-400 font-black uppercase tracking-tighter">Seansı Yak</p>
                                                </div>
                                            </button>

                                            <button 
                                                onClick={async () => {
                                                    await updateAppointmentStatus(actionMenuAppt.id, 'excused');
                                                    setActionMenuAppt(null);
                                                }}
                                                className="flex flex-col items-center gap-2 p-5 bg-blue-50/50 hover:bg-blue-50 rounded-[2rem] transition-all group border border-blue-100/50 shadow-sm"
                                            >
                                                <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform text-blue-600">
                                                    <RefreshCcw size={20} />
                                                </div>
                                                <div className="text-center">
                                                    <p className="font-black text-blue-950 text-[11px] uppercase italic">İptal</p>
                                                    <p className="text-[8px] text-blue-400 font-black uppercase tracking-tighter">İade Edilsin</p>
                                                </div>
                                            </button>
                                        </div>

                                        <div className="pt-4 grid grid-cols-2 gap-3 border-t border-dashed border-gray-100 mt-4">
                                            <button 
                                                onClick={() => {
                                                    setActionAppt(actionMenuAppt);
                                                    setActionMenuAppt(null);
                                                }}
                                                className="flex items-center justify-center gap-2 py-4 px-4 bg-gray-50/50 hover:bg-white hover:border-gray-200 border border-transparent rounded-2xl transition-all text-[11px] font-black text-gray-500 uppercase tracking-widest"
                                            >
                                                <ExternalLink size={14} /> Detaylar
                                            </button>
                                            <button 
                                                onClick={async () => {
                                                    if (confirm('Bu randevuyu silmek istediğinize emin misiniz?')) {
                                                        await deleteAppointment(actionMenuAppt.id);
                                                        setActionMenuAppt(null);
                                                    }
                                                }}
                                                className="flex items-center justify-center gap-2 py-4 px-4 hover:bg-red-50 rounded-2xl transition-all text-[11px] font-black text-red-400 uppercase tracking-widest"
                                            >
                                                <Trash2 size={14} /> Sil
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DndContext>
    );
}
