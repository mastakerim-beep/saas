"use client";

import { useStore, Room, Appointment } from "@/lib/store";
import { 
    LayoutGrid, Timer, User, ShieldCheck, AlertCircle, 
    Sparkles, Info, Users, Clock, Box, Maximize2, RefreshCw,
    GripVertical, Calendar, CheckCircle2, Bot
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
    DndContext, 
    useDraggable, 
    useDroppable, 
    DragOverlay,
    DragEndEvent,
    defaultDropAnimationSideEffects
} from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

// --- Draggable Appointment Item ---
function DraggableAppointment({ appointment }: { appointment: Appointment }) {
    const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
        id: appointment.id,
        data: { appointment }
    });

    const style = {
        transform: CSS.Translate.toString(transform),
        opacity: isDragging ? 0.3 : 1,
        zIndex: isDragging ? 100 : 1
    };

    return (
        <div 
            ref={setNodeRef} 
            style={style} 
            {...listeners} 
            {...attributes}
            className="flex items-center gap-3 p-3 bg-white rounded-2xl border border-gray-100 shadow-sm cursor-grab active:cursor-grabbing hover:border-primary/30 transition-colors group"
        >
            <GripVertical className="w-4 h-4 text-gray-300 group-hover:text-primary transition-colors" />
            <div className="flex-1 min-w-0">
                <p className="text-[11px] font-black text-gray-900 truncate">{appointment.customerName}</p>
                <p className="text-[9px] text-gray-400 font-bold uppercase truncate">{appointment.service}</p>
            </div>
            <div className="text-[9px] font-black text-primary px-2 py-1 bg-primary/5 rounded-lg">
                {appointment.time}
            </div>
        </div>
    );
}

// --- Droppable Room Card ---
function DroppableRoom({ 
    room, 
    occupancy, 
    selectedRoom, 
    onSelect 
}: { 
    room: Room, 
    occupancy?: Appointment, 
    selectedRoom: string | null,
    onSelect: (id: string) => void
}) {
    const { isOver, setNodeRef } = useDroppable({
        id: room.id,
        data: { room }
    });

    const statusConfig: Record<string, { label: string, color: string, bg: string }> = {
        available: { label: 'Müsait', color: 'text-emerald-600', bg: 'bg-emerald-50' },
        occupied: { label: 'Dolu', color: 'text-red-600', bg: 'bg-red-50' },
        cleaning: { label: 'Temizlikte', color: 'text-amber-600', bg: 'bg-amber-50' },
        maintenance: { label: 'Bakımda', color: 'text-gray-600', bg: 'bg-gray-50' }
    };

    const currentStatus = statusConfig[room.status] || statusConfig.available;

    return (
        <motion.div
            ref={setNodeRef}
            whileHover={{ scale: 1.02, rotateY: 2 }}
            onClick={() => onSelect(room.id)}
            className={`relative card-apple cursor-pointer group flex flex-col min-h-[220px] transition-all duration-500 overflow-hidden
                ${room.status === 'occupied' ? 'bg-white/60' : 'bg-white'} 
                ${selectedRoom === room.id ? 'ring-2 ring-primary border-transparent' : 'border-white/60'}
                ${isOver ? 'ring-4 ring-primary ring-offset-4 scale-105 z-50 shadow-2xl shadow-primary/20' : ''}
            `}
            style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
        >
            {isOver && (
                <div className="absolute inset-0 bg-primary/10 backdrop-blur-[2px] z-50 flex items-center justify-center animate-pulse">
                    <div className="bg-primary text-white p-3 rounded-full shadow-xl">
                        <CheckCircle2 className="w-6 h-6" />
                    </div>
                </div>
            )}

            <div className="p-6 flex-1 relative z-10">
                <div className="flex justify-between items-start mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-black text-sm shadow-lg" style={{ backgroundColor: room.color || '#primary' }}>
                            {room.name.substring(0, 1)}
                        </div>
                        <div>
                            <h3 className="font-black text-gray-900 group-hover:text-primary transition-colors">{room.name}</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{room.category}</p>
                        </div>
                    </div>
                    <div className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${currentStatus.color} ${currentStatus.bg} border-current/10`}>
                        {currentStatus.label}
                    </div>
                </div>

                {occupancy ? (
                    <div className="space-y-4 animate-[fadeIn_0.5s]">
                        <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-2xl border border-gray-100">
                            <User className="w-4 h-4 text-gray-400" />
                            <div className="flex-1 min-w-0">
                                <p className="text-[11px] font-black text-gray-900 truncate">{occupancy.customerName}</p>
                                <p className="text-[9px] text-gray-400 font-bold uppercase">{occupancy.service}</p>
                            </div>
                        </div>
                        <div className="flex items-center justify-between text-[10px] font-black">
                            <span className="text-gray-400 flex items-center gap-2"><Timer className="w-3 h-3" /> Durum</span>
                            <span className="text-primary uppercase tracking-tighter">İşlemde</span>
                        </div>
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden text-primary">
                            <motion.div 
                                initial={{ width: 0 }} 
                                animate={{ width: '60%' }} 
                                className="h-full bg-current shadow-[0_0_10px_rgba(var(--primary-rgb),0.5)]" 
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-24 opacity-30 group-hover:opacity-50 transition-opacity">
                        <Sparkles className="w-8 h-8 mb-2" />
                        <p className="text-[9px] font-black uppercase tracking-widest text-center leading-tight">Müsait<br/>Randevu Sürükle</p>
                    </div>
                )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </motion.div>
    );
}

export default function OperationsPage() {
    const { rooms, appointments, assignRoomToAppointment, updateRoomStatus } = useStore();
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
    const [activeDragId, setActiveDragId] = useState<string | null>(null);

    // Filter pending appointments for dragging
    const pendingAppointments = useMemo(() => {
        return appointments.filter(a => a.status === 'pending');
    }, [appointments]);

    // Mock rooms if store is empty
    const displayRooms = useMemo(() => {
        if (rooms.length > 0) return rooms;
        return [
            { id: 'r1', name: 'Bali Room 1', status: 'available', category: 'VIP', color: '#fbbf24' },
            { id: 'r2', name: 'Bali Room 2', status: 'occupied', category: 'VIP', color: '#fbbf24' },
            { id: 'r3', name: 'Hamam VIP', status: 'available', category: 'Hamam', color: '#818cf8' },
            { id: 'r4', name: 'Masaj 1', status: 'cleaning', category: 'Massage', color: '#34d399' },
            { id: 'r5', name: 'Masaj 2', status: 'available', category: 'Massage', color: '#34d399' },
            { id: 'r6', name: 'Cilt Bakımı', status: 'occupied', category: 'Skincare', color: '#f472b6' },
        ] as Room[];
    }, [rooms]);

    const getOccupancyInfo = (roomId: string) => {
        return appointments.find(a => (a as any).roomId === roomId && a.status === 'arrived');
    };

    const handleDragStart = (event: any) => {
        setActiveDragId(event.active.id);
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;
        setActiveDragId(null);

        if (over && active.id !== over.id) {
            const apptId = active.id as string;
            const roomId = over.id as string;
            await assignRoomToAppointment(apptId, roomId);
        }
    };

    const activeAppointment = useMemo(() => 
        pendingAppointments.find(a => a.id === activeDragId),
    [activeDragId, pendingAppointments]);

    const selectedRoom = displayRooms.find(r => r.id === selectedRoomId);

    return (
        <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
            <div className="p-6 md:p-10 max-w-[1700px] mx-auto space-y-10 font-sans min-h-screen">
                {/* Header Area */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-gray-100 pb-8">
                    <div>
                        <div className="flex items-center gap-3 mb-3">
                            <div className="bg-primary/10 text-primary p-2.5 rounded-2xl shadow-inner">
                                <Box className="w-6 h-6" />
                            </div>
                            <h1 className="text-3xl md:text-5xl font-black tracking-tight text-gray-900 leading-tight">
                                Aura <span className="text-gradient">Vision</span>
                            </h1>
                        </div>
                        <p className="text-gray-400 font-bold text-sm tracking-tight flex items-center gap-2">
                            <span className="relative flex h-2.5 w-2.5">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-indigo-500"></span>
                            </span>
                            Canlı Kapasite Yönetimi | <span className="text-gray-950 font-black">Supabase Bağlantısı Aktif</span>
                        </p>
                    </div>

                    <div className="flex bg-white/70 backdrop-blur-xl p-1.5 rounded-[20px] border border-white shadow-xl">
                        <button 
                            onClick={() => setViewMode('grid')}
                            className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-[11px] font-black uppercase tracking-wider transition-all ${viewMode === 'grid' ? 'bg-primary text-white shadow-lg' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            <LayoutGrid className="w-4 h-4" /> 3D Grid
                        </button>
                        <button 
                            className={`px-6 py-3 rounded-2xl flex items-center gap-2 text-[11px] font-black uppercase tracking-wider text-gray-400 opacity-50 cursor-not-allowed`}
                        >
                            <Maximize2 className="w-4 h-4" /> Liste
                        </button>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                    {/* Left Panel: Draggable Queue */}
                    <div className="lg:col-span-3 space-y-6">
                        <div className="card-apple p-6 bg-white/40 border-white/60 min-h-[400px]">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-primary" />
                                    <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Giriş Bekleyenler</h2>
                                </div>
                                <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full">{pendingAppointments.length}</span>
                            </div>

                            <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                                {pendingAppointments.length > 0 ? (
                                    pendingAppointments.map(appt => (
                                        <DraggableAppointment key={appt.id} appointment={appt} />
                                    ))
                                ) : (
                                    <div className="text-center py-20 opacity-30 border-2 border-dashed border-gray-200 rounded-[2.5rem]">
                                        <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin-slow" />
                                        <p className="text-[10px] font-black uppercase tracking-widest">Bekleyen Randevu Yok</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Efficiency Card */}
                        <div className="bg-indigo-600 text-white p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-600/20 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 bg-white/10 rounded-bl-3xl">
                                <Bot className="w-5 h-5 text-indigo-200" />
                            </div>
                            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60 mb-4 text-white">Vision Insight</h4>
                            <p className="font-bold text-sm leading-relaxed mb-6 italic text-white/90">"Vip odalarda yoğunluk var. Bekleyen randevuları standart odalara kaydırarak %12 daha fazla operasyonel hız kazanabilirsiniz."</p>
                        </div>
                    </div>

                    {/* Room Grid */}
                    <div className="lg:col-span-9">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-8"
                        >
                            {displayRooms.map(room => (
                                <DroppableRoom 
                                    key={room.id} 
                                    room={room} 
                                    selectedRoom={selectedRoomId} 
                                    onSelect={setSelectedRoomId}
                                    occupancy={getOccupancyInfo(room.id)}
                                />
                            ))}
                        </motion.div>
                    </div>
                </div>

                {/* Drag Overlay for Ghosting Effect */}
                <DragOverlay dropAnimation={{
                    sideEffects: defaultDropAnimationSideEffects({
                        styles: {
                            active: {
                                opacity: '0.4',
                            },
                        },
                    }),
                }}>
                    {activeDragId && activeAppointment ? (
                        <div className="flex items-center gap-3 p-4 bg-white/90 backdrop-blur-3xl rounded-3xl border-2 border-primary shadow-[0_30px_60px_-15px_rgba(var(--primary-rgb),0.3)] scale-110 pointer-events-none">
                            <div className="flex-1">
                                <p className="text-[12px] font-black text-gray-900">{activeAppointment.customerName}</p>
                                <p className="text-[10px] text-gray-500 font-bold uppercase">{activeAppointment.service}</p>
                            </div>
                            <Sparkles className="w-5 h-5 text-primary animate-pulse" />
                        </div>
                    ) : null}
                </DragOverlay>

                {/* Side Modal for Room Details */}
                <AnimatePresence>
                    {selectedRoomId && selectedRoom && (
                        <div className="fixed inset-0 z-[100] flex items-center justify-end p-4 lg:p-10 pointer-events-none">
                            <motion.div
                                initial={{ x: 600, opacity: 0 }}
                                animate={{ x: 0, opacity: 1 }}
                                exit={{ x: 600, opacity: 0 }}
                                className="w-full max-w-lg bg-white/95 backdrop-blur-2xl border border-white shadow-[0_0_150px_rgba(0,0,0,0.15)] h-full rounded-[4rem] p-12 pointer-events-auto overflow-y-auto"
                            >
                                <div className="flex justify-between items-center mb-12">
                                    <div className="bg-gray-50 p-4 rounded-3xl shadow-inner">
                                        <Box className="w-8 h-8 text-gray-900" />
                                    </div>
                                    <button 
                                        onClick={() => setSelectedRoomId(null)}
                                        className="p-4 hover:bg-gray-100 rounded-full text-gray-400 transition-all hover:rotate-90"
                                    >
                                        <Maximize2 className="w-6 h-6 rotate-45" />
                                    </button>
                                </div>

                                <div className="mb-12">
                                    <h2 className="text-4xl font-black text-gray-900 mb-3 tracking-tighter">
                                        {selectedRoom.name}
                                    </h2>
                                    <div className="flex items-center gap-3">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${selectedRoom.status === 'available' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {selectedRoom.status === 'available' ? 'Oda Boş' : 'Kullanımda'}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-gray-400 font-bold text-[10px] uppercase tracking-widest">{selectedRoom.category}</span>
                                    </div>
                                </div>
                                
                                <div className="space-y-10">
                                    <div className="grid grid-cols-2 gap-6">
                                        <button 
                                            onClick={() => updateRoomStatus(selectedRoomId, 'available')}
                                            className="flex flex-col items-center justify-center p-8 bg-emerald-50 text-emerald-600 rounded-[2.5rem] border border-emerald-100 hover:bg-emerald-100 hover:shadow-lg transition-all group overflow-hidden relative"
                                        >
                                            <CheckCircle2 className="w-8 h-8 mb-3 group-hover:scale-110 transition-transform relative z-10" />
                                            <span className="text-[10px] font-black uppercase relative z-10">Müsait Yap</span>
                                        </button>
                                        <button 
                                            onClick={() => updateRoomStatus(selectedRoomId, 'cleaning')}
                                            className="flex flex-col items-center justify-center p-8 bg-amber-50 text-amber-600 rounded-[2.5rem] border border-amber-100 hover:bg-amber-100 hover:shadow-lg transition-all group overflow-hidden relative"
                                        >
                                            <RefreshCw className="w-8 h-8 mb-3 group-hover:rotate-180 transition-transform duration-700 relative z-10" />
                                            <span className="text-[10px] font-black uppercase relative z-10">Temizliğe Al</span>
                                        </button>
                                    </div>

                                    <div className="p-10 bg-gray-50/50 rounded-[3rem] border border-gray-100 backdrop-blur-sm">
                                        <h3 className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-400 mb-8">Oda Detay Analizi</h3>
                                        <div className="space-y-8">
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span className="text-gray-500">Bugünkü Seanslar</span>
                                                <span className="text-gray-900">12</span>
                                            </div>
                                            <div className="flex justify-between items-center text-sm font-bold">
                                                <span className="text-gray-500">Toplam Verimlilik</span>
                                                <span className="text-indigo-600 font-black">%94</span>
                                            </div>
                                            <div className="pt-6 border-t border-gray-100">
                                                <p className="text-[10px] font-black uppercase text-gray-400 mb-2">Popüler Hizmet</p>
                                                <p className="text-gray-900 font-black">Bali Geleneksel Masajı</p>
                                            </div>
                                        </div>
                                    </div>

                                    <button className="w-full py-6 bg-gray-950 text-white rounded-[2.5rem] font-black text-xs uppercase tracking-widest shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3 active:scale-95">
                                        Manuel Rezervasyon <Calendar className="w-4 h-4 text-primary" />
                                    </button>
                                </div>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>
            </div>
        </DndContext>
    );
}
