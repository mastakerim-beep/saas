"use client";

import React, { useState, useMemo } from 'react';
import { 
    X, Search, Plus, Sparkles, ChevronRight, 
    ShieldCheck, Loader2, Banknote, ChevronDown, Package, Clock, User
} from 'lucide-react';
import { useStore, Customer } from '@/lib/store';
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
        addAppointment, updateAppointment, addBlock, packages, addBodyMap,
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
    const activeServices = useMemo(() => services.filter((s: any) => s.isActive !== false), [services]);
    const [currentService, setCurrentService] = useState(activeServices.length > 0 ? (initialData.service || activeServices[0]?.name) : '');
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(initialData.roomId || (rooms.length > 0 ? rooms[0]?.id : null));
    const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);
    const [price, setPrice] = useState(services.find((s: any) => s.name === (initialData.service || services[0]?.name))?.price || 0);
    const [isSaving, setIsSaving] = useState(false);
    const [blockReason, setBlockReason] = useState('Toplantı');
    const [note, setNote] = useState('');
    const [overrideDuration, setOverrideDuration] = useState<number | null>(
        (initialData.duration && initialData.duration !== 15) ? initialData.duration : null
    );
    const [referralSource, setReferralSource] = useState(initialData?.communicationSource || 'Direkt');
    const [error, setError] = useState<string | null>(null);

    // Conflict Detection (Staff & Room with Capacity)
    const checkConflict = (staffId: string, roomId: string | null, dt: string, tm: string, dur: number, excludeId?: string) => {
        if (!staffId && !roomId) return false;
        
        const [h, m] = tm.split(':').map(Number);
        const start = h * 60 + m;
        const end = start + dur;

        const isTimeOverlap = (aStart: number, aEnd: number) => (start < aEnd && end > aStart);

        // 1. Staff Check
        if (staffId) {
            const hasAppt = appointments.some(a => {
                if (a.id === excludeId) return false;
                if (a.date !== dt) return false;
                if (['cancelled', 'excused'].includes(a.status)) return false;

                const [ah, am] = a.time.split(':').map(Number);
                const aStart = ah * 60 + am;
                const aEnd = aStart + (a.duration || 60);

                if (!isTimeOverlap(aStart, aEnd)) return false;

                // Primary or Additional Staff check
                const isPrimary = a.staffId === staffId;
                const isAdditional = Array.isArray(a.additionalStaff) && a.additionalStaff.some((s: any) => s.id === staffId);
                return isPrimary || isAdditional;
            });

            if (hasAppt) return true;

            const hasBlock = blocks.some((b: any) => {
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
            const room = rooms.find(r => r.id === roomId);
            const capacity = room?.capacity || 1;

            const occupants = appointments.filter((a: any) => {
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

    const filtered = customers.filter((c: any) => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone.includes(search)
    );
    
    const customer = customers.find((c: any) => c.id === selectedCustId);

    const customerPackages = useMemo(() => {
        if (!selectedCustId) return [];
        return packages.filter((p: any) => 
            p.customerId === selectedCustId && 
            p.usedSessions < p.totalSessions && 
            new Date(p.expiry) >= new Date()
        );
    }, [selectedCustId, packages]);

    const addToBasket = () => {
        const svc = services.find(s => s.name === currentService);
        const staff = staffMembers.find(s => s.id === currentStaffId);
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

    const handleSave = async () => {
        if (isSaving) return;
        
        const duration = overrideDuration || services.find(s => s.name === currentService)?.duration || 60;
        
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
                        staffName: staffMembers.find(s => s.id === currentStaffId)?.name || '',
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
                        // Audit Log
                        const oldDate = initialData.date;
                        const oldTime = initialData.time;
                        const oldStaff = initialData.staffName;
                        const newStaff = updates.staffName;
                        
                        let logMsg = `Randevu Güncellendi: ${initialData.customerName}`;
                        if (oldDate !== selectedDate || oldTime !== selectedTime) {
                            logMsg += ` | Zaman Değişimi: ${oldDate} ${oldTime} -> ${selectedDate} ${selectedTime}`;
                        }
                        if (oldStaff !== newStaff) {
                            logMsg += ` | Personel Değişimi: ${oldStaff} -> ${newStaff}`;
                        }
                        
                        await addLog(logMsg, initialData.id, `${oldDate} ${oldTime}`, `${selectedDate} ${selectedTime}`);
                        onClose();
                    } else {
                        alert("🔴 Hata: Güncelleme kaydedilemedi.");
                    }
                } else {
                    const finalBasket = basket.length > 0 ? basket : [{
                        service: currentService,
                        staffId: currentStaffId,
                        staffName: staffMembers.find(s => s.id === currentStaffId)?.name || '',
                        roomId: currentRoomId,
                        packageId: currentPackageId,
                        price: currentPackageId ? 0 : price,
                        duration: duration,
                        isPackageUsage: !!currentPackageId,
                        note: note,
                        regions: selectedRegions,
                        additionalStaff: secondStaffId ? [{ id: secondStaffId, name: staffMembers.find((s: any) => s.id === secondStaffId)?.name || '' }] : []
                    }];

                    let allSuccess = true;
                    // Group Booking Logic: Repeat for group count if enabled
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
                                alert("🔴 KRİTİK HATA: Veritabanı senkronizasyonu başarısız oldu.");
                                break;
                            }
                        }
                        if (!allSuccess) break;
                    }
                    
                    if (allSuccess) {
                        onClose();
                    }
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
                else setError("🚫 Bloke işlemi kaydedilemedi.");
            }
        } catch (error: any) {
            console.error("Booking save error:", error);
            setError(`⚠️ SİSTEM HATASI: ${error.message}`);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xl z-[900] flex items-center justify-center p-4 antialiased animate-[fadeIn_0.3s_ease]">
            <div className="modal-premium w-full max-w-4xl max-h-[95vh] overflow-hidden animate-[slideUp_0.4s_ease] border-indigo-100 shadow-2xl flex flex-col !bg-white">
                {/* Header */}
                <div className="p-8 border-b border-indigo-50 bg-gradient-to-br from-white to-indigo-50/20 flex justify-between items-center flex-shrink-0">
                    <div className="flex bg-indigo-50/50 p-1.5 rounded-2xl border border-indigo-100/50 shadow-inner">
                        <button 
                            onClick={() => { setMode('appt'); setIsGroupMode(false); }} 
                            className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${mode === 'appt' && !isGroupMode ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-indigo-400 hover:text-primary hover:bg-white'}`}
                        >
                            Randevu
                        </button>
                        <button 
                            onClick={() => { setMode('appt'); setIsGroupMode(true); }} 
                            className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${mode === 'appt' && isGroupMode ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-300 scale-105' : 'text-indigo-400 hover:text-primary hover:bg-white'}`}
                        >
                            Grup/Çift
                        </button>
                        <button 
                            onClick={() => { setMode('block'); setIsGroupMode(false); }} 
                            className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${mode === 'block' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-indigo-400 hover:text-primary hover:bg-white'}`}
                        >
                            Bloke Et
                        </button>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-red-50 rounded-2xl transition-all text-gray-300 hover:text-red-500 hover:rotate-90">
                        <X className="w-6 h-6" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto no-scrollbar bg-white p-10">
                    <div className="max-w-4xl mx-auto">
                        <AnimatePresence>
                            {error && (
                                <motion.div 
                                    initial={{ height: 0, opacity: 0, marginBottom: 0 }}
                                    animate={{ height: 'auto', opacity: 1, marginBottom: 24 }}
                                    exit={{ height: 0, opacity: 0, marginBottom: 0 }}
                                    className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center justify-between group overflow-hidden"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-200">
                                            <X size={20} />
                                        </div>
                                        <p className="text-sm font-black text-red-900 uppercase italic">{error}</p>
                                    </div>
                                    <button onClick={() => setError(null)} className="p-2 hover:bg-red-100 rounded-xl transition-all">
                                        <X size={16} className="text-red-400" />
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                        {mode === 'appt' ? (
                            selectedStep === 'customer' ? (
                                <div className="space-y-6">
                                    <div className="text-center mb-8">
                                        <h3 className="text-xl font-black text-gray-900 tracking-tight italic uppercase">Müşteri Seçimi</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">İşleme başlamak için müşteri belirleyin</p>
                                    </div>
                                    <div className="relative group">
                                        <Search className="w-6 h-6 absolute left-6 top-5 text-gray-300 group-focus-within:text-primary transition-colors duration-300" />
                                        <input 
                                            autoFocus
                                            value={search} 
                                            onChange={e => setSearch(e.target.value)} 
                                            placeholder="İsim veya telefon numarası..." 
                                            className="w-full bg-gray-50 border-2 border-gray-50 focus:border-primary/20 focus:bg-white rounded-[2rem] pl-16 pr-8 py-5 text-gray-900 font-black text-sm outline-none transition-all shadow-sm placeholder:text-gray-300"
                                        />
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {filtered.slice(0, 6).map(c => (
                                            <div key={c.id} onClick={() => { setSelectedCustId(c.id); setSelectedStep('details'); }} className="p-5 bg-white rounded-[1.75rem] cursor-pointer hover:bg-primary/5 transition-all border border-gray-100/50 hover:border-primary/20 flex items-center gap-5 group shadow-sm hover:shadow-lg hover:shadow-primary/5 relative overflow-hidden">
                                                <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 font-black text-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:scale-105 transition-all duration-300 border border-gray-100 group-hover:border-transparent">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="font-black text-base text-gray-900 leading-none mb-1.5">{c.name?.toUpperCase() || 'İSİMSİZ MÜŞTERİ'}</p>
                                                        {packages.some(p => p.customerId === c.id && p.usedSessions < p.totalSessions) && (
                                                            <div className="px-2 py-0.5 bg-amber-50 border border-amber-100 rounded-md text-[8px] font-black text-amber-600 uppercase tracking-tighter mb-1 select-none">Paketli</div>
                                                        )}
                                                    </div>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{c.phone || 'Telefon Yok'}</p>
                                                </div>
                                                <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-primary group-hover:translate-x-1 transition-all" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                    <div className="space-y-8">
                                        {/* Basket Summary */}
                                        {basket.length > 0 && (
                                            <div className="space-y-4 animate-in fade-in slide-in-from-top-4">
                                                <div className="flex items-center justify-between px-1">
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Randevu Sepeti ({basket.length})</p>
                                                    <button onClick={() => setBasket([])} className="text-[9px] font-black text-red-400 uppercase tracking-tighter hover:text-red-600 transition-colors">Sepeti Temizle</button>
                                                </div>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {basket.map((item, idx) => (
                                                        <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 shadow-sm border-l-4 border-l-primary">
                                                            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Sparkles className="w-4 h-4" /></div>
                                                            <div>
                                                                <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{item.service}</p>
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-70">{item.staffName} • {item.regions.length} Bölge</p>
                                                            </div>
                                                            <button onClick={() => setBasket(prev => prev.filter((_, i) => i !== idx))} className="ml-2 text-gray-300 hover:text-red-500 transition-all hover:scale-110">
                                                                <X className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <div className="bg-indigo-50/30 p-10 rounded-[2.5rem] border border-indigo-100/50 shadow-inner space-y-10">
                                            <div className="flex items-center justify-between px-2 bg-white/50 p-6 rounded-3xl border border-indigo-100/50 shadow-sm mb-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-100">
                                                        <User className="w-6 h-6" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-1.5">Müşteri</p>
                                                        <h4 className="text-lg font-black text-gray-900 tracking-tight italic uppercase leading-none">{customer?.name}</h4>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <div className="flex flex-col gap-2">
                                                        <input 
                                                            type="date" 
                                                            value={selectedDate} 
                                                            onChange={e => setSelectedDate(e.target.value)}
                                                            className="text-[11px] font-black text-primary uppercase tracking-widest bg-indigo-50/50 border border-indigo-100 rounded-xl px-4 py-1.5 outline-none focus:border-primary transition-all text-center"
                                                        />
                                                        <div className="relative">
                                                            <select 
                                                                value={selectedTime}
                                                                onChange={e => setSelectedTime(e.target.value)}
                                                                className="w-full text-2xl font-black text-primary/80 tracking-tighter italic leading-none bg-transparent outline-none appearance-none cursor-pointer pr-6 text-right"
                                                            >
                                                                {slots.map(s => {
                                                                    const duration = overrideDuration || services.find(svc => svc.name === currentService)?.duration || 60;
                                                                    const isFull = checkConflict(currentStaffId, currentRoomId, selectedDate, s, duration, initialMode === 'edit' ? initialData.id : undefined);
                                                                    return <option key={s} value={s} className={isFull ? 'text-red-400 font-bold' : ''}>{s} {isFull ? ' (ÇAKIŞMA)' : ''}</option>
                                                                })}
                                                            </select>
                                                            <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-primary/40 pointer-events-none" />
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Package Balance Info */}
                                            {customerPackages.length > 0 && (
                                                <div className="bg-amber-50 rounded-[2rem] p-6 border border-amber-100 animate-in fade-in slide-in-from-right-4 duration-500">
                                                    <div className="flex items-center gap-3 mb-4">
                                                        <div className="p-2 bg-amber-500 text-white rounded-xl shadow-lg shadow-amber-200">
                                                            <Package className="w-4 h-4" />
                                                        </div>
                                                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest">Müşterinin Aktif Paketleri</p>
                                                    </div>
                                                    <div className="space-y-2">
                                                        {customerPackages.map(pkg => (
                                                            <div key={pkg.id} className="flex justify-between items-center bg-white/80 p-3 rounded-xl border border-amber-100/50">
                                                                <span className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{pkg.name}</span>
                                                                <span className="px-3 py-1 bg-amber-500 text-white rounded-lg text-[10px] font-black uppercase tracking-widest">
                                                                    {pkg.totalSessions - pkg.usedSessions} / {pkg.totalSessions} Seans Kaldı
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Uygulanacak Hizmet</label>
                                                    <div className="relative group">
                                                        <select value={currentService} onChange={e => {
                                                            const s = services.find(svc => svc.name === e.target.value);
                                                            setCurrentService(e.target.value);
                                                            if(s) {
                                                                setPrice(s.price);
                                                                setOverrideDuration(s.duration);
                                                            }
                                                        }} className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-black text-gray-900 outline-none focus:border-primary transition-all appearance-none shadow-sm group-hover:shadow-md">
                                                            {activeServices.map(s => <option key={s.id} value={s.name}>{s.name} (₺{s.price})</option>)}
                                                        </select>
                                                        <ChevronDown className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Hizmet Bedeli (₺)</label>
                                                    <div className="relative group">
                                                        <input 
                                                            type="number"
                                                            value={price}
                                                            onChange={e => setPrice(Number(e.target.value))}
                                                            className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-black text-gray-900 outline-none focus:border-primary transition-all shadow-sm group-hover:shadow-md"
                                                        />
                                                        <Banknote className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-emerald-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div className="space-y-4 pt-4 border-t border-gray-50">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center justify-between">
                                                        <span>Uzman / Terapist (1)</span>
                                                        {services.find(s => s.name === currentService)?.requiredStaffCount === 2 && (
                                                            <span className="text-purple-600 animate-pulse">ÇİFT TERAPİST GEREKLİ</span>
                                                        )}
                                                    </label>
                                                    <div className="relative group">
                                                        <select value={currentStaffId} onChange={e => setCurrentStaffId(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-black text-gray-900 outline-none focus:border-primary transition-all appearance-none shadow-sm group-hover:shadow-md">
                                                            {staffMembers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                        </select>
                                                        <ChevronDown className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>

                                                    {(services.find(s => s.name === currentService)?.requiredStaffCount === 2) && (
                                                        <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                                                            <label className="text-[9px] font-black text-purple-600 uppercase tracking-widest ml-1">Uzman / Terapist (2)</label>
                                                            <div className="relative group mt-2">
                                                                <select 
                                                                    value={secondStaffId} 
                                                                    onChange={e => setSecondStaffId(e.target.value)} 
                                                                    className="w-full bg-purple-50/50 border border-purple-100 rounded-2xl px-6 py-5 text-sm font-black text-purple-900 outline-none focus:border-purple-300 transition-all appearance-none shadow-sm group-hover:shadow-md"
                                                                >
                                                                    <option value="">Seçiniz...</option>
                                                                    {staffMembers.filter(s => s.id !== currentStaffId).map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                                </select>
                                                                <ChevronDown className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none" />
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1 italic">Müşteri Tavsiye Kaynağı</label>
                                                    <div className="relative group">
                                                        <select value={referralSource} onChange={e => setReferralSource(e.target.value)} className="w-full bg-indigo-50/50 border border-indigo-100 rounded-2xl px-6 py-5 text-sm font-black text-indigo-900 outline-none focus:border-primary transition-all appearance-none shadow-sm group-hover:shadow-md italic">
                                                            {['Direkt', 'Instagram', 'Google', 'Tavsiye', 'TikTok', 'WhatsApp', 'Dışarıdan Geçerken'].map(s => <option key={s} value={s}>{s}</option>)}
                                                        </select>
                                                        <Sparkles className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-indigo-300 pointer-events-none" />
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">Oda Seçimi (Opsiyonel)</p>
                                                <div className="flex flex-wrap gap-2.5">
                                                    {rooms.map(room => {
                                                        const duration = overrideDuration || services.find(svc => svc.name === currentService)?.duration || 60;
                                                        const isRoomFull = checkConflict('', room.id, selectedDate, selectedTime, duration, initialMode === 'edit' ? initialData.id : undefined);
                                                        
                                                        return (
                                                            <button 
                                                                key={room.id} 
                                                                onClick={() => !isRoomFull && setCurrentRoomId(room.id === currentRoomId ? null : room.id)} 
                                                                className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 relative ${
                                                                    currentRoomId === room.id 
                                                                    ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-200 scale-105' 
                                                                    : isRoomFull 
                                                                        ? 'bg-gray-100 border-gray-200 text-gray-300 cursor-not-allowed grayscale' 
                                                                        : 'bg-white border-gray-100 text-indigo-400 hover:border-purple-200 shadow-sm'
                                                                }`}
                                                                title={isRoomFull ? 'Bu oda seçilen saatte dolu' : ''}
                                                            >
                                                                {room.name}
                                                                {isRoomFull && <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[7px] px-1.5 py-0.5 rounded-full ring-2 ring-white">DOLU</span>}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4 bg-white p-6 rounded-[2rem] border border-indigo-100 shadow-sm">
                                                <div className="flex-1">
                                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 opacity-60">Tanımlı Süre</p>
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="w-4 h-4 text-indigo-600 animate-pulse" />
                                                        <span className="text-sm font-black text-gray-900 uppercase tracking-tight italic">{overrideDuration || services.find(s => s.name === currentService)?.duration || 0} Dakika</span>
                                                    </div>
                                                </div>
                                                <div className="w-px h-10 bg-indigo-50" />
                                                <div className="flex-1 pl-4">
                                                    <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mb-1.5 opacity-60">Yaklaşık Bitiş</p>
                                                    <p className="text-sm font-black text-primary uppercase tracking-tight italic">
                                                        {(() => {
                                                            const start = selectedTime;
                                                            const dur = overrideDuration || services.find(s => s.name === currentService)?.duration || 0;
                                                            const [h, m] = start.split(':').map(Number);
                                                            const endTotal = h * 60 + m + dur;
                                                            const endH = endTotal >= 1440 ? Math.floor((endTotal % 1440) / 60) : Math.floor(endTotal / 60);
                                                            const endM = endTotal % 60;
                                                            return `${endH.toString().padStart(2, '0')}:${endM.toString().padStart(2, '0')}`;
                                                        })()}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="space-y-3">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Randevu Notu</label>
                                                <textarea 
                                                    value={note}
                                                    onChange={e => setNote(e.target.value)}
                                                    placeholder="Randevu notlarınızı veya özel isteklerinizi buraya ekleyebilirsiniz..."
                                                    className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-bold text-gray-900 outline-none focus:border-primary transition-all shadow-inner min-h-[100px] resize-none"
                                                />
                                            </div>

                                            <button 
                                                onClick={addToBasket}
                                                className="w-full py-5 bg-white hover:bg-primary hover:text-white text-primary rounded-[2rem] text-[10px] font-black uppercase tracking-widest border border-primary/20 shadow-sm hover:shadow-xl hover:shadow-primary/20 transition-all duration-300 flex items-center justify-center gap-3 group"
                                            >
                                                <Plus className="w-5 h-5 text-primary group-hover:text-white group-hover:rotate-90 transition-all" /> 
                                                SEPETE EKLE & DEVAM ET
                                            </button>
                                        </div>
                                    </div>

                                    <div className="space-y-6">
                                        <BodyMap selectedRegions={selectedRegions} onToggleRegion={toggleRegion} />
                                    </div>
                                </div>
                            )
                        ) : (
                            <div className="space-y-8 max-w-xl mx-auto py-10">
                                <div className="text-center">
                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">Mesai Bloke Et</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mt-1">Personel çalışma saatini rezerve edin</p>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    {['Toplantı', 'Mola', 'Eğitim', 'Özel'].map(r => (
                                        <button key={r} onClick={() => setBlockReason(r)}
                                            className={`p-6 rounded-[2rem] border-2 font-black text-xs uppercase transition-all duration-300 ${blockReason === r ? 'bg-primary text-white border-primary shadow-xl shadow-primary/20 scale-105' : 'bg-gray-50 border-transparent text-gray-400 hover:bg-white hover:border-gray-100'}`}>
                                            {r}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                <div className="p-10 bg-indigo-50/50 border-t border-indigo-100 flex-shrink-0">
                    <button
                        onClick={handleSave}
                        disabled={isSaving || (mode === 'appt' && !selectedCustId && basket.length === 0)}
                        className="w-full py-6 bg-primary text-white rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl shadow-primary/30 transition-all hover:bg-indigo-700 active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-4"
                    >
                        {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : <ShieldCheck className="w-6 h-6" />}
                        {isSaving ? 'İşlem Yapılıyor...' : (initialMode === 'edit' ? 'Değişiklikleri Kaydet' : 'Takvime İşle')}
                    </button>
                </div>
            </div>
        </div>
    );
}
