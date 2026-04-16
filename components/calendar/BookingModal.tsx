"use client";

import React, { useState, useMemo } from 'react';
import { 
    X, Search, Plus, Sparkles, ChevronRight, 
    ShieldCheck, Loader2, Banknote, ChevronDown, Package, Clock
} from 'lucide-react';
import { useStore, Customer } from '@/lib/store';
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
        addAppointment, addBlock, packages, addBodyMap,
        currentBusiness
    } = useStore();
    
    const [mode, setMode] = useState<'appt' | 'block'>(initialData?.reason ? 'block' : 'appt');
    const [search, setSearch] = useState('');
    const [selectedCustId, setSelectedCustId] = useState(initialData.customerId || '');
    const [selectedStep, setSelectedStep] = useState<'customer' | 'details'>(initialData.customerId ? 'details' : 'customer');
    const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
    
    // Basket for multi-booking
    const [basket, setBasket] = useState<any[]>([]);
    
    // Current entry state
    const [currentService, setCurrentService] = useState(services[0]?.name || '');
    const [currentStaffId, setCurrentStaffId] = useState(initialData.staffId || staffMembers[0]?.id || '');
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(initialData.roomId || rooms[0]?.id || null);
    const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);
    const [price, setPrice] = useState(services[0]?.price || 0);
    const [isSaving, setIsSaving] = useState(false);
    const [blockReason, setBlockReason] = useState('Toplantı');
    const [note, setNote] = useState('');
    const [overrideDuration, setOverrideDuration] = useState<number | null>(initialData.duration || null);
    const [referralSource, setReferralSource] = useState('Direkt');

    const toggleRegion = (id: string) => {
        setSelectedRegions(prev => prev.includes(id) ? prev.filter(r => r !== id) : [...prev, id]);
    };

    const filtered = customers.filter(c => 
        c.name.toLowerCase().includes(search.toLowerCase()) || 
        c.phone.includes(search)
    );
    
    const customer = customers.find(c => c.id === selectedCustId);

    const customerPackages = useMemo(() => {
        if (!selectedCustId) return [];
        return packages.filter(p => 
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
        setIsSaving(true);

        if (mode === 'appt') {
            const finalBasket = basket.length > 0 ? basket : [{
                service: currentService,
                staffId: currentStaffId,
                staffName: staffMembers.find(s => s.id === currentStaffId)?.name || '',
                roomId: currentRoomId,
                packageId: currentPackageId,
                price: currentPackageId ? 0 : price,
                duration: overrideDuration || services.find(s => s.name === currentService)?.duration || 60,
                isPackageUsage: !!currentPackageId,
                note: note,
                regions: selectedRegions
            }];

            let allSuccess = true;
            for (const item of finalBasket) {
                // 1. Add Appointment (Body Map and Referral handled inside Store for atomicity)
                const success = await addAppointment({
                    businessId: currentBusiness?.id,
                    customerId: selectedCustId,
                    customerName: customer?.name || '',
                    service: item.service,
                    staffId: item.staffId,
                    staffName: item.staffName,
                    roomId: item.roomId,
                    date,
                    time: initialData.time,
                    duration: item.duration,
                    status: 'pending',
                    price: item.price,
                    depositPaid: 0,
                    isOnline: false,
                    packageId: item.packageId || undefined,
                    isPackageUsage: item.isPackageUsage,
                    note: item.note,
                    communicationSource: referralSource,
                    bodyMapData: item.regions
                });

                if (!success) {
                    allSuccess = false;
                    alert("Randevu kaydedilemedi! Lütfen veritabanı bağlantasını kontrol edin.");
                    break;
                }
            }
            if (allSuccess) {
                setIsSaving(false);
                onClose();
            } else {
                setIsSaving(false);
            }
        } else {
            if (isSaving) return;
            setIsSaving(true);
            await addBlock({
                businessId: currentBusiness?.id,
                staffId: currentStaffId,
                date,
                time: initialData.time,
                duration: overrideDuration || 60,
                reason: blockReason
            });
            setIsSaving(false);
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xl z-[900] flex items-center justify-center p-4 antialiased animate-[fadeIn_0.3s_ease]">
            <div className="modal-premium w-full max-w-4xl max-h-[95vh] overflow-hidden animate-[slideUp_0.4s_ease] border-indigo-100 shadow-2xl flex flex-col !bg-white">
                {/* Header */}
                <div className="p-8 border-b border-indigo-50 bg-gradient-to-br from-white to-indigo-50/20 flex justify-between items-center flex-shrink-0">
                    <div className="flex bg-indigo-50/50 p-1.5 rounded-2xl border border-indigo-100/50 shadow-inner">
                        <button 
                            onClick={() => setMode('appt')} 
                            className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 ${mode === 'appt' ? 'bg-primary text-white shadow-xl shadow-primary/20 scale-105' : 'text-indigo-400 hover:text-primary hover:bg-white'}`}
                        >
                            Randevu
                        </button>
                        <button 
                            onClick={() => setMode('block')} 
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
                                            <div key={c.id} onClick={() => { setSelectedCustId(c.id); setSelectedStep('details'); }} className="p-5 bg-white rounded-[1.75rem] cursor-pointer hover:bg-primary/5 transition-all border border-gray-100/50 hover:border-primary/20 flex items-center gap-5 group shadow-sm hover:shadow-lg hover:shadow-primary/5">
                                                <div className="w-14 h-14 rounded-2xl bg-gray-50 text-gray-400 font-black text-lg flex items-center justify-center group-hover:bg-primary group-hover:text-white group-hover:scale-105 transition-all duration-300 border border-gray-100 group-hover:border-transparent">
                                                    {c.name.charAt(0)}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="font-black text-base text-gray-900 leading-none mb-1.5">{c.name}</p>
                                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest">{c.phone}</p>
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
                                            <div className="flex items-center justify-between px-2">
                                                <div>
                                                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] leading-none mb-2">Müşteri</p>
                                                    <h3 className="text-2xl font-black text-gray-900 tracking-tight italic uppercase">{customer?.name}</h3>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mb-1">{date}</p>
                                                    <p className="text-3xl font-black text-primary/80 tracking-tighter italic leading-none">{initialData.time}</p>
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-1 gap-6">
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
                                                            {services.map(s => <option key={s.id} value={s.name}>{s.name} (₺{s.price})</option>)}
                                                        </select>
                                                        <ChevronDown className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Uzman / Terapist</label>
                                                    <div className="relative group">
                                                        <select value={currentStaffId} onChange={e => setCurrentStaffId(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl px-6 py-5 text-sm font-black text-gray-900 outline-none focus:border-primary transition-all appearance-none shadow-sm group-hover:shadow-md">
                                                            {staffMembers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                        </select>
                                                        <ChevronDown className="w-4 h-4 absolute right-6 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                                                    </div>
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
                                                    {rooms.map(room => (
                                                        <button 
                                                            key={room.id} 
                                                            onClick={() => setCurrentRoomId(room.id === currentRoomId ? null : room.id)} 
                                                            className={`px-6 py-3.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 border-2 ${
                                                                currentRoomId === room.id 
                                                                ? 'bg-purple-600 border-purple-600 text-white shadow-xl shadow-purple-200 scale-105' 
                                                                : 'bg-white border-gray-100 text-indigo-400 hover:border-purple-200 shadow-sm'
                                                            }`}
                                                        >
                                                            {room.name}
                                                        </button>
                                                    ))}
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
                                                            const start = initialData.time;
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
                        {isSaving ? 'Rezervasyon İşleniyor...' : 'Takvime İşle'}
                    </button>
                </div>
            </div>
        </div>
    );
}
