"use client";

import React, { useState, useMemo } from 'react';
import { 
    X, Search, Plus, Sparkles, ChevronRight, 
    ShieldCheck, Loader2, Banknote, ChevronDown, Package as PackageIcon, Clock, User
} from 'lucide-react';
import { useStore, Customer, Service, Staff, Room, Package, Appointment, CalendarBlock } from '@/lib/store';
import { motion, AnimatePresence } from 'framer-motion';
import BodyMap from '../crm/BodyMap';

interface BookingModalProps {
    initialData: any;
    date: string;
    onClose: () => void;
    mode?: 'add' | 'edit';
    isOpen?: boolean;
}

export default function BookingModal({ initialData, onClose, date, mode: initialMode = 'add' }: BookingModalProps) {
    const { 
        customers, staffMembers, services, rooms, 
        addCustomer, addAppointment, updateAppointment, addBlock, packages, addBodyMap,
        currentBusiness, appointments, blocks, settings, addLog,
        currentUser
    } = useStore();
    
    // Rescheduling states
    const [selectedDate, setSelectedDate] = useState(date || initialData?.date);
    const [selectedTime, setSelectedTime] = useState(initialData?.time || '09:00');
    const [currentStaffId, setCurrentStaffId] = useState(initialData?.staffId || staffMembers[0]?.id || '');

    const [mode, setMode] = useState<'appt' | 'block'>(initialData?.reason ? 'block' : 'appt');
    const [search, setSearch] = useState('');
    const [selectedCustId, setSelectedCustId] = useState(initialData.customerId || '');
    const [selectedStep, setSelectedStep] = useState<'customer' | 'details'>(initialData.customerId ? 'details' : 'customer');
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    const [secondStaffId, setSecondStaffId] = useState<string>('');
    const [isGroupMode, setIsGroupMode] = useState(false);
    const [groupCount, setGroupCount] = useState(2);
    const [currentGroupId] = useState(initialData.groupId || crypto.randomUUID());
    
    // Basket for multi-booking
    const [basket, setBasket] = useState<any[]>([]);
    
    // Current entry state
    const activeServices = useMemo(() => services.filter((s: Service) => s.isActive !== false), [services]);
    const [currentService, setCurrentService] = useState(activeServices.length > 0 ? (initialData.service || activeServices[0]?.name) : '');
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(initialData.roomId || (rooms.length > 0 ? rooms[0]?.id : null));
    const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);
    const [price, setPrice] = useState(services.find((s: Service) => s.name === (initialData.service || services[0]?.name))?.price || 0);
    const [isSaving, setIsSaving] = useState(false);
    const [blockReason, setBlockReason] = useState('Toplantı');
    const [note, setNote] = useState('');
    const [overrideDuration, setOverrideDuration] = useState<number | null>(
        (initialData.duration && initialData.duration !== 15) ? initialData.duration : null
    );
    const [referralSource, setReferralSource] = useState(initialData?.communicationSource || 'Direkt');
    const [error, setError] = useState<string | null>(null);

    // Quick Add States
    const [isQuickAdding, setIsQuickAdding] = useState(false);
    const [quickName, setQuickName] = useState('');
    const [quickPhone, setQuickPhone] = useState('');

    // Conflict Detection (Staff & Room with Capacity)
    const checkConflict = (staffId: string, roomId: string | null, dt: string, tm: string, dur: number, excludeId?: string) => {
        if (!staffId && !roomId) return false;
        
        const [h, m] = tm.split(':').map(Number);
        const start = h * 60 + m;
        const end = start + dur;

        const isTimeOverlap = (aStart: number, aEnd: number) => (start < aEnd && end > aStart);

        // 1. Staff Check
        if (staffId) {
            const hasAppt = appointments.some((a: Appointment) => {
                if (a.id === excludeId) return false;
                if (a.date !== dt) return false;
                if (['cancelled', 'excused'].includes(a.status)) return false;

                const [ah, am] = a.time.split(':').map(Number);
                const aStart = ah * 60 + am;
                const aEnd = aStart + (a.duration || 60);

                if (!isTimeOverlap(aStart, aEnd)) return false;

                // Primary or Additional Staff check
                const isPrimary = a.staffId === staffId;
                const isAdditional = Array.isArray(a.additionalStaff) && (a.additionalStaff as any[]).some((s: any) => s.id === staffId);
                return isPrimary || isAdditional;
            });

            if (hasAppt) return true;

            const hasBlock = blocks.some((b: CalendarBlock) => {
                if (b.date !== dt || b.staffId !== staffId) return false;
                const [bh, bm] = b.time.split(':').map(Number);
                const bStart = bh * 60 + bm;
                const bEnd = bStart + (b.duration || 60);
                return isTimeOverlap(bStart, bEnd);
            });

            if (hasBlock) return true;
        }

        // 2. Room Check (Capacity Aware)
        if (roomId) {
            const room = rooms.find((r: Room) => r.id === roomId);
            const capacity = room?.capacity || 1;

            const occupants = appointments.filter((a: Appointment) => {
                if (a.id === excludeId) return false;
                if (a.date !== dt || a.roomId !== roomId) return false;
                if (['cancelled', 'excused'].includes(a.status)) return false;

                const [ah, am] = a.time.split(':').map(Number);
                const aStart = ah * 60 + am;
                const aEnd = aStart + (a.duration || 60);
                return isTimeOverlap(aStart, aEnd);
            }).length;

            if (occupants >= capacity) return true;
        }

        return false;
    };

    const slots = useMemo(() => {
        const s = [];
        const start = settings?.startHour || 9;
        const end = settings?.endHour || 22;
        for (let h = start; h < end; h++) {
            for (let m = 0; m < 60; m += 15) {
                s.push(`${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
            }
        }
        return s;
    }, [settings]);

    const toggleRegion = (id: string) => {
        setSelectedRegions(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const filtered = customers.filter((c: Customer) => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone.includes(search)
    );
    
    const customer = customers.find((c: Customer) => c.id === selectedCustId);

    const customerPackages = useMemo(() => {
        if (!selectedCustId) return [];
        return packages.filter((p: Package) => 
            p.customerId === selectedCustId && 
            p.usedSessions < p.totalSessions && 
            new Date(p.expiry) >= new Date()
        );
    }, [selectedCustId, packages]);

    const addToBasket = () => {
        const svc = services.find((s: Service) => s.name === currentService);
        const staff = staffMembers.find((s: Staff) => s.id === currentStaffId);
        if (!svc || !staff) return;

        setBasket(prev => [...prev, {
            service: currentService,
            staffId: currentStaffId,
            staffName: staff.name,
            payments: [],
            roomId: currentRoomId,
            packageId: currentPackageId,
            price: currentPackageId ? 0 : price,
            duration: svc.duration,
            isPackageUsage: !!currentPackageId,
            note: note,
            regions: selectedRegions
        }]);
        
        // Reset for next entry
        setCurrentPackageId(null);
        setNote('');
        setSelectedRegions([]);
    };

    const handleQuickAdd = async () => {
        if (!quickName || !quickPhone) {
            setError("⚠️ Lütfen isim ve telefon numarasını eksiksiz giriniz.");
            return;
        }
        setIsSaving(true);
        setError(null);
        try {
            const newCust = await addCustomer({
                name: quickName,
                phone: quickPhone,
                segment: 'Standard',
                note: 'Takvim modalından hızlı eklendi'
            });
            if (newCust && newCust.id) {
                setSelectedCustId(newCust.id);
                setSelectedStep('details');
                setIsQuickAdding(false);
                setQuickName('');
                setQuickPhone('');
            }
        } catch (err: any) {
            setError("Müşteri oluşturulamadı: " + err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleSave = async () => {
        if (isSaving) return;
        
        const duration = overrideDuration || services.find((s: Service) => s.name === currentService)?.duration || 60;
        
        // Final Conflict Check (Staff & Room)
        if (checkConflict(currentStaffId, currentRoomId, selectedDate, selectedTime, duration, initialMode === 'edit' ? initialData?.id : undefined)) {
            setError("❌ Seçilen personel veya oda o saatte dolu. Lütfen farklı bir seçim yapın.");
            return;
        }

        setError(null);
        setIsSaving(true);

        try {
            if (mode === 'appt') {
                if (initialMode === 'edit') {
                    const updates = {
                        service: currentService,
                        staffId: currentStaffId,
                        staffName: staffMembers.find((s: Staff) => s.id === currentStaffId)?.name || '',
                        roomId: currentRoomId,
                        date: selectedDate,
                        time: selectedTime,
                        duration: duration,
                        price: price,
                        note: note,
                        packageId: currentPackageId || undefined,
                        isPackageUsage: !!currentPackageId
                    };
                    
                    const success = await updateAppointment(initialData.id, updates);
                    if (success) {
                        onClose();
                    } else {
                        alert("🔴 Hata: Güncelleme kaydedilemedi.");
                    }
                } else {
                    const finalBasket = basket.length > 0 ? basket : [{
                        service: currentService,
                        staffId: currentStaffId,
                        staffName: staffMembers.find((s: Staff) => s.id === currentStaffId)?.name || '',
                        roomId: currentRoomId,
                        packageId: currentPackageId,
                        price: currentPackageId ? 0 : price,
                        duration: duration,
                        isPackageUsage: !!currentPackageId,
                        note: note,
                        regions: selectedRegions,
                        additionalStaff: secondStaffId ? [{ id: secondStaffId, name: staffMembers.find((s: Staff) => s.id === secondStaffId)?.name || '' }] : []
                    }];

                    let allSuccess = true;
                    const repeats = isGroupMode ? groupCount : 1;
                    const gid = isGroupMode ? currentGroupId : undefined;

                    for (let r = 0; r < repeats; r++) {
                        for (const item of finalBasket) {
                            const success = await addAppointment({
                                businessId: currentBusiness?.id,
                                customerId: selectedCustId,
                                customerName: r === 0 ? (customer?.name || '') : `${customer?.name || ''} (+${r})`,
                                service: item.service,
                                staffId: item.staffId,
                                staffName: item.staffName,
                                roomId: item.roomId,
                                date: selectedDate,
                                time: selectedTime,
                                duration: item.duration,
                                status: 'pending',
                                price: item.price,
                                depositPaid: 0,
                                isOnline: false,
                                packageId: item.packageId || undefined,
                                isPackageUsage: item.isPackageUsage,
                                note: item.note,
                                communicationSource: referralSource,
                                selectedRegions: item.regions,
                                additionalStaff: item.additionalStaff || [],
                                groupId: gid
                            });
                            if (!success) {
                                allSuccess = false;
                                break;
                            }
                        }
                    }
                    if (allSuccess) onClose();
                }
            } else {
                const res = await addBlock({
                    businessId: currentBusiness?.id,
                    staffId: currentStaffId,
                    date: selectedDate,
                    time: selectedTime,
                    duration: overrideDuration || 60,
                    reason: blockReason
                });
                if (res !== false) onClose();
            }
        } catch (error: any) {
            console.error("Booking save error:", error);
            setError(`⚠️ SİSTEM HATASI: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xl z-[900] flex items-center justify-center p-4 antialiased">
            <div className="modal-premium w-full max-w-4xl max-h-[95vh] overflow-hidden border-indigo-100 shadow-2xl flex flex-col !bg-white">
                {/* Header */}
                <div className="p-8 border-b border-indigo-50 bg-gradient-to-br from-white to-indigo-50/20 flex justify-between items-center flex-shrink-0">
                    <div className="flex bg-indigo-50/50 p-1.5 rounded-2xl border border-indigo-100/50 shadow-inner">
                        <button onClick={() => { setMode('appt'); setIsGroupMode(false); }} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${mode === 'appt' && !isGroupMode ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-indigo-400 hover:text-primary hover:bg-white'}`}>Randevu</button>
                        <button onClick={() => { setMode('appt'); setIsGroupMode(true); }} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${mode === 'appt' && isGroupMode ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-300 scale-105' : 'text-indigo-400 hover:text-primary hover:bg-white'}`}>Grup/Çift</button>
                        <button onClick={() => { setMode('block'); setIsGroupMode(false); }} className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${mode === 'block' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-indigo-400 hover:text-primary hover:bg-white'}`}>Bloke Et</button>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-red-50 rounded-2xl transition-all text-gray-300 hover:text-red-500 hover:rotate-90">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar bg-white p-10">
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence>
                            {error && (
                                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="bg-red-50 border border-red-100 rounded-2xl p-5 mb-6 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200"><X size={20} /></div>
                                        <p className="text-sm font-black text-red-900 uppercase italic">{error}</p>
                                    </div>
                                    <button onClick={() => setError(null)} className="p-2 hover:bg-red-100 rounded-xl transition-all"><X size={16} className="text-red-400" /></button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {mode === 'appt' ? (
                            selectedStep === 'customer' ? (
                                <div className="space-y-8">
                                    <div className="text-center mb-4">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Müşteri Seçimi</h3>
                                        <p className="text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">İşleme başlamak için müşteri belirleyin</p>
                                    </div>
                                    <div className="relative group max-w-2xl mx-auto">
                                        <div className="absolute inset-y-0 left-0 pl-6 flex items-center pointer-events-none"><Search className="w-6 h-6 text-indigo-300" /></div>
                                        <input autoFocus value={search} onChange={e => setSearch(e.target.value)} placeholder="İsim veya telefon numarası ile ara..." className="w-full bg-indigo-50/30 border-2 border-indigo-50/50 focus:border-indigo-200 focus:bg-white rounded-[2.5rem] pl-16 pr-8 py-6 text-gray-900 font-black text-base outline-none transition-all shadow-sm" />
                                    </div>
                                    
                                    <AnimatePresence mode="wait">
                                        {isQuickAdding ? (
                                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 rounded-[3rem] text-white">
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                                                    <input value={quickName} onChange={e => setQuickName(e.target.value)} placeholder="İsim Soyisim" className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-white/40 outline-none" />
                                                    <input value={quickPhone} onChange={e => setQuickPhone(e.target.value)} placeholder="Telefon" className="bg-white/10 border border-white/20 rounded-2xl px-6 py-4 text-white placeholder:text-white/40 outline-none" />
                                                </div>
                                                <button onClick={handleQuickAdd} className="w-full py-5 bg-white text-indigo-700 rounded-2xl font-black uppercase tracking-widest">KAYDET VE DEVAM ET</button>
                                            </motion.div>
                                        ) : (
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                {filtered.slice(0, 8).map((c: Customer) => (
                                                    <div key={c.id} onClick={() => { setSelectedCustId(c.id); setSelectedStep('details'); }} className="p-6 bg-white rounded-[2rem] cursor-pointer hover:bg-indigo-50/50 transition-all border border-indigo-100/40 flex items-center gap-5">
                                                        <div className="w-16 h-16 rounded-2xl bg-indigo-50 text-indigo-600 font-black text-xl flex items-center justify-center">{c.name.charAt(0).toUpperCase()}</div>
                                                        <div className="flex-1">
                                                            <p className="font-black text-lg text-gray-900 leading-none">{c.name.toUpperCase()}</p>
                                                            <p className="text-[11px] text-indigo-300 font-black uppercase mt-1">{c.phone}</p>
                                                        </div>
                                                        <ChevronRight className="text-indigo-200" />
                                                    </div>
                                                ))}
                                                <button onClick={() => setIsQuickAdding(true)} className="p-6 border-2 border-dashed border-indigo-100 rounded-[2rem] flex flex-col items-center justify-center gap-2 text-indigo-300 hover:border-indigo-300 hover:text-indigo-500 transition-all">
                                                    <Plus /> <span className="text-[10px] font-black uppercase tracking-widest">Yeni Ekle</span>
                                                </button>
                                            </div>
                                        )}
                                    </AnimatePresence>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                        {/* Sol Sütun */}
                                        <div className="space-y-8">
                                            <div className="bg-indigo-50/30 p-10 rounded-[2.5rem] border border-indigo-100/50 space-y-8">
                                                <div className="flex items-center justify-between bg-white/80 p-6 rounded-3xl border border-indigo-100/50 shadow-sm">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg"><User size={24} /></div>
                                                        <div>
                                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Müşteri</p>
                                                            <h4 className="text-lg font-black text-gray-900 tracking-tight italic uppercase">{customer?.name}</h4>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <input type="date" value={selectedDate} onChange={e => setSelectedDate(e.target.value)} className="text-[11px] font-black text-primary uppercase bg-white border border-indigo-100 rounded-xl px-4 py-1.5 outline-none mb-2 block w-full" />
                                                        <select value={selectedTime} onChange={e => setSelectedTime(e.target.value)} className="text-2xl font-black text-primary/80 tracking-tighter italic bg-transparent outline-none appearance-none pr-6 text-right">
                                                            {slots.map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                    </div>
                                                </div>

                                                <div className="space-y-3">
                                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Randevu Notu</label>
                                                    <textarea value={note} onChange={e => setNote(e.target.value)} placeholder="Özel istekler..." className="w-full bg-white border border-indigo-50 rounded-[2rem] px-8 py-6 text-sm font-bold text-gray-900 outline-none focus:border-indigo-500 transition-all min-h-[120px] resize-none" />
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Uygulanacak Hizmet</label>
                                                    <select value={currentService} onChange={e => {
                                                        const s = services.find((svc: Service) => svc.name === e.target.value);
                                                        setCurrentService(e.target.value);
                                                        if(s) setPrice(s.price);
                                                    }} className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-black text-gray-900 outline-none focus:border-primary transition-all shadow-sm">
                                                        {activeServices.map((s: Service) => <option key={s.id} value={s.name}>{s.name} (₺{s.price})</option>)}
                                                    </select>
                                                    <input type="number" value={price} onChange={e => setPrice(Number(e.target.value))} className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-black text-gray-900 outline-none focus:border-primary transition-all shadow-sm" placeholder="Fiyat" />
                                                </div>
                                            </div>
                                        </div>

                                        {/* Sağ Sütun */}
                                        <div className="space-y-8">
                                            <div className="bg-indigo-50/20 p-8 rounded-[2.5rem] border border-indigo-100/30 space-y-8">
                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Uzman Seçimi</label>
                                                    <select value={currentStaffId} onChange={e => setCurrentStaffId(e.target.value)} className="w-full bg-white border border-indigo-100 rounded-2xl px-6 py-5 text-sm font-black text-gray-900 outline-none shadow-sm">
                                                        {staffMembers.map((s: Staff) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                    </select>
                                                </div>

                                                <div className="space-y-4">
                                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Oda Seçimi</label>
                                                    <div className="flex flex-wrap gap-2.5">
                                                        {rooms.map(room => (
                                                            <button key={room.id} onClick={() => setCurrentRoomId(room.id)} className={`px-6 py-3 rounded-2xl text-[10px] font-black uppercase transition-all ${currentRoomId === room.id ? 'bg-primary text-white shadow-xl' : 'bg-white border border-gray-100 text-indigo-400'}`}>{room.name}</button>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4 bg-white/80 p-6 rounded-[2rem] border border-indigo-100/50 shadow-sm">
                                                    <div className="flex-1">
                                                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1">Final Süre</p>
                                                        <div className="flex items-center gap-2"><Clock size={16} className="text-primary" /><span className="text-sm font-black text-gray-900 italic">{overrideDuration || services.find((s: Service) => s.name === currentService)?.duration || 0} DK</span></div>
                                                    </div>
                                                </div>
                                            </div>

                                            <button onClick={addToBasket} className="w-full py-8 bg-slate-900 text-white rounded-[2.5rem] text-[11px] font-black uppercase tracking-[0.3em] shadow-xl hover:bg-slate-800 transition-all flex items-center justify-center gap-4 group">
                                                <Plus className="group-hover:rotate-90 transition-all" /> YENİ KALEM EKLE
                                            </button>
                                        </div>
                                    </div>

                                    {/* Full Width Section */}
                                    <div className="mt-12 pt-12 border-t border-dashed border-gray-100">
                                        <div className="text-center mb-10">
                                            <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Aura Atlas İndeksi</h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Masaj Odak Noktaları</p>
                                        </div>
                                        <div className="bg-indigo-50/30 rounded-[4rem] p-12 border border-indigo-100/40">
                                            <div className="max-w-3xl mx-auto">
                                                <BodyMap selectedRegions={selectedRegions} onToggleRegion={toggleRegion} />
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )
                        ) : (
                            <div className="space-y-8 max-w-xl mx-auto py-10">
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Mesai Bloke Et</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Personel çalışma saatini rezerve edin</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Toplantı', 'Mola', 'Eğitim', 'Özel'].map(r => (
                                        <button key={r} onClick={() => setBlockReason(r)} className={`p-8 rounded-[2.5rem] border-2 font-black uppercase transition-all ${blockReason === r ? 'bg-primary text-white border-primary shadow-xl' : 'bg-gray-50 border-transparent text-gray-300 hover:bg-white'}`}>{r}</button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-10 bg-indigo-50/50 border-t border-indigo-100 flex-shrink-0">
                    <button onClick={handleSave} disabled={isSaving || (mode === 'appt' && !selectedCustId && basket.length === 0)} className="w-full py-6 bg-primary text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl transition-all hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-4">
                        {isSaving ? <Loader2 className="animate-spin" /> : <ShieldCheck />}
                        {isSaving ? 'İşlem Yapılıyor...' : 'Takvime İşle'}
                    </button>
                </div>
            </div>
        </div>
    );
}
