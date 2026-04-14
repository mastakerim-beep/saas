"use client";

import React, { useState, useMemo } from 'react';
import { 
    X, Search, Plus, Sparkles, ChevronRight, 
    ShieldCheck, Loader2, Banknote, ChevronDown, Package 
} from 'lucide-react';
import { useStore, Customer } from '@/lib/store';

interface BookingModalProps {
    initialData: { staffId: string, time: string, customerId?: string };
    date: string;
    onClose: () => void;
}

export default function BookingModal({ initialData, onClose, date }: BookingModalProps) {
    const { 
        customers, staffMembers, services, rooms, 
        addAppointment, addBlock, packages 
    } = useStore();
    
    const [mode, setMode] = useState<'appt' | 'block'>('appt');
    const [search, setSearch] = useState('');
    const [selectedCustId, setSelectedCustId] = useState(initialData.customerId || '');
    const [selectedStep, setSelectedStep] = useState<'customer' | 'details'>(initialData.customerId ? 'details' : 'customer');
    
    // Basket for multi-booking
    const [basket, setBasket] = useState<any[]>([]);
    
    // Current entry state
    const [currentService, setCurrentService] = useState(services[0]?.name || '');
    const [currentStaffId, setCurrentStaffId] = useState(initialData.staffId);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(rooms[0]?.id || null);
    const [currentPackageId, setCurrentPackageId] = useState<string | null>(null);
    const [price, setPrice] = useState(services[0]?.price || 0);
    const [isSaving, setIsSaving] = useState(false);
    const [blockReason, setBlockReason] = useState('Toplantı');
    const [note, setNote] = useState('');

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
            note: note
        }]);
        
        // Reset for next entry
        setCurrentPackageId(null);
        setNote('');
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
                duration: services.find(s => s.name === currentService)?.duration || 60,
                isPackageUsage: !!currentPackageId,
                note: note
            }];

            for (const item of finalBasket) {
                await addAppointment({
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
                    note: item.note
                });
            }
        } else {
            addBlock({ 
                staffId: initialData.staffId, 
                date, 
                time: initialData.time, 
                duration: 60, 
                reason: blockReason 
            });
        }
        setIsSaving(false);
        onClose();
    };

    return (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-xl z-[200] flex items-center justify-center p-4 antialiased">
            <div className="modal-premium w-full max-w-2xl overflow-hidden animate-[slideUp_0.4s_ease] border-gray-100 shadow-2xl">
                {/* Header with improved Tab Design */}
                <div className="p-8 border-b border-gray-100/50 bg-white/50 flex justify-between items-center">
                    <div className="flex bg-gray-50 p-1.5 rounded-2xl border border-gray-100/50 shadow-inner">
                        <button 
                            onClick={() => setMode('appt')} 
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'appt' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}
                        >
                            Randevu
                        </button>
                        <button 
                            onClick={() => setMode('block')} 
                            className={`px-8 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${mode === 'block' ? 'bg-primary text-white shadow-xl shadow-primary/20' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}
                        >
                            Bloke Et
                        </button>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-gray-100 rounded-2xl transition-all text-gray-400 hover:text-red-500 hover:rotate-90">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-10 space-y-8 max-h-[85vh] overflow-y-auto no-scrollbar bg-white">
                    {mode === 'appt' ? (
                        selectedStep === 'customer' ? (
                            <div className="space-y-6">
                                <div className="text-center mb-8">
                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Müşteri Seçimi</h3>
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
                                <div className="grid grid-cols-1 gap-3">
                                    {filtered.slice(0, 5).map(c => (
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
                                    {filtered.length === 0 && search && (
                                        <div className="flex flex-col items-center justify-center p-12 bg-gray-50/50 rounded-[2rem] border-2 border-dashed border-gray-200">
                                            <p className="text-gray-400 font-black text-xs uppercase tracking-widest">Müşteri Bulunamadı</p>
                                            <button className="mt-4 text-primary font-black text-xs underline underline-offset-4">Yeni Müşteri Ekle</button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-10">
                                {/* Basket Summary with Indigo accent */}
                                {basket.length > 0 && (
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">Randevu Sepeti ({basket.length})</p>
                                            <button onClick={() => setBasket([])} className="text-[9px] font-black text-red-400 uppercase tracking-tighter hover:text-red-600 transition-colors">Sepeti Temizle</button>
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {basket.map((item, idx) => (
                                                <div key={idx} className="bg-white rounded-2xl p-4 border border-gray-100 flex items-center gap-4 animate-[fadeIn_0.3s_ease] shadow-sm">
                                                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary"><Sparkles className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-[11px] font-black text-gray-900 uppercase tracking-tight">{item.service}</p>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest opacity-70">{item.staffName} • {item.isPackageUsage ? 'PAKET' : `₺${item.price}`}</p>
                                                    </div>
                                                    <button onClick={() => setBasket(prev => prev.filter((_, i) => i !== idx))} className="ml-2 text-gray-300 hover:text-red-500 transition-all hover:scale-110">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50/30 p-8 rounded-[2.5rem] border border-gray-100/50 shadow-inner space-y-8">
                                    <div className="flex items-center justify-between px-1">
                                        <div>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none mb-1">Randevu Detayları</p>
                                            <h3 className="text-base font-black text-gray-900 tracking-tight">{customer?.name}</h3>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-primary uppercase tracking-widest">{date}</p>
                                            <p className="text-xl font-black text-primary/80 tracking-tighter">{initialData.time}</p>
                                        </div>
                                    </div>

                                    {/* Service & Staff Grid - Premium Selects */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 opacity-70">Uygulanacak Hizmet</label>
                                            <div className="relative group">
                                                <select value={currentService} onChange={e => {
                                                    const s = services.find(svc => svc.name === e.target.value);
                                                    setCurrentService(e.target.value);
                                                    if(s) setPrice(s.price);
                                                }} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:border-primary/30 transition-all appearance-none shadow-sm group-hover:shadow-md">
                                                    {services.map(s => <option key={s.id} value={s.name}>{s.name} (₺{s.price})</option>)}
                                                </select>
                                                <ChevronDown className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform group-hover:scale-110" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 opacity-70">Uzman / Terapist</label>
                                            <div className="relative group">
                                                <select value={currentStaffId} onChange={e => setCurrentStaffId(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none focus:border-primary/30 transition-all appearance-none shadow-sm group-hover:shadow-md">
                                                    {staffMembers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                                <ChevronDown className="w-4 h-4 absolute right-5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none transition-transform group-hover:scale-110" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Room Selection with Categories */}
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between px-1">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 opacity-70">Oda / Kabin Atama</p>
                                            {rooms.length === 0 && <span className="text-[9px] font-black text-amber-500 uppercase">Sistemde Oda Tanımlı Değil</span>}
                                        </div>
                                        <div className="flex flex-wrap gap-2.5">
                                            {rooms.map(room => (
                                                <button 
                                                    key={room.id} 
                                                    onClick={() => setCurrentRoomId(room.id)} 
                                                    className={`px-5 py-3 rounded-2xl text-[10px] font-black uppercase tracking-tight transition-all duration-300 border-2 flex flex-col items-start gap-1 ${
                                                        currentRoomId === room.id 
                                                        ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' 
                                                        : 'bg-white border-gray-50 text-gray-400 hover:border-primary/20 hover:text-gray-600 shadow-sm'
                                                    }`}
                                                >
                                                    <span className="flex items-center gap-1.5 font-black">
                                                        <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: room.color || '#6366f1' }}></div>
                                                        {room.name}
                                                    </span>
                                                    <span className={`text-[8px] opacity-60 font-black tracking-widest ${currentRoomId === room.id ? 'text-white' : 'text-primary'}`}>
                                                        {room.category || 'GENEL'}
                                                    </span>
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Package vs Payment Selection */}
                                    <div className="space-y-4 pt-6 border-t border-gray-100/50">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 opacity-70">Ödeme Modeli</p>
                                        <div className="grid grid-cols-2 gap-4">
                                            <button 
                                                onClick={() => setCurrentPackageId(null)}
                                                className={`p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 ${!currentPackageId ? 'bg-primary border-primary text-white shadow-xl shadow-primary/20 scale-105' : 'bg-white border-gray-50 text-gray-400 hover:border-primary/20 shadow-sm'}`}
                                            >
                                                <Banknote className="w-5 h-5 mb-1" />
                                                <span className="text-[11px] font-black uppercase tracking-tighter">Normal Tahsilat</span>
                                                <span className={`text-[10px] font-black tracking-tight ${!currentPackageId ? 'text-white/80' : 'text-primary'}`}>₺{price.toLocaleString('tr-TR')}</span>
                                            </button>
                                            
                                            {customerPackages.length > 0 ? (
                                                <div className="relative group h-full">
                                                    <select 
                                                        value={currentPackageId || ''} 
                                                        onChange={e => setCurrentPackageId(e.target.value || null)}
                                                        className={`w-full h-full p-6 rounded-[2rem] border-2 flex flex-col items-center justify-center gap-2 transition-all duration-300 appearance-none text-center font-black uppercase text-[11px] outline-none shadow-sm ${currentPackageId ? 'bg-emerald-500 border-emerald-500 text-white shadow-xl shadow-emerald-500/20 scale-105' : 'bg-white border-gray-50 text-gray-400 hover:border-emerald-500/20'}`}
                                                    >
                                                        <option value="">Paketten Düş</option>
                                                        {customerPackages.map(p => <option key={p.id} value={p.id}>{p.name} ({p.totalSessions - p.usedSessions} / {p.totalSessions})</option>)}
                                                    </select>
                                                    {!currentPackageId && <ChevronDown className="w-4 h-4 absolute bottom-4 left-1/2 -translate-x-1/2 text-emerald-500 animate-bounce pointer-events-none" />}
                                                </div>
                                            ) : (
                                                <div className="p-6 rounded-[2rem] border-2 border-dashed border-gray-200 flex flex-col items-center justify-center gap-1 opacity-50 bg-gray-50/50">
                                                    <Package className="w-5 h-5 mb-1 text-gray-300" />
                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Paketi Yok</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Additional Notes */}
                                    <div className="space-y-3 pt-6 border-t border-gray-100/50">
                                        <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 opacity-70">Randevu Notu / Açıklama</label>
                                        <textarea 
                                            value={note}
                                            onChange={e => setNote(e.target.value)}
                                            placeholder="Örn: mb MİRA (Terapist değişikliği istiyor)"
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-5 py-4 text-sm font-bold text-gray-900 outline-none focus:border-primary/30 transition-all shadow-inner min-h-[100px] resize-none"
                                        />
                                    </div>

                                    <button 
                                        onClick={addToBasket}
                                        className="w-full py-5 bg-white hover:bg-gray-50 text-gray-900 rounded-[1.75rem] text-[10px] font-black uppercase tracking-widest border border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 flex items-center justify-center gap-3 group"
                                    >
                                        <Plus className="w-5 h-5 text-primary group-hover:scale-125 transition-transform" /> 
                                        <span>Sepete Ekle & Yeni Hizmet Seç</span>
                                    </button>
                                </div>
                            </div>
                        )
                    ) : (
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Bloke Nedeni</p>
                            <div className="grid grid-cols-2 gap-3">
                                {['Toplantı', 'Mola', 'Eğitim', 'Özel'].map(r => (
                                    <button key={r} onClick={() => setBlockReason(r)}
                                        className={`p-5 rounded-2.5xl border-2 font-black text-xs uppercase transition-all ${blockReason === r ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'bg-gray-50 border-transparent text-gray-400'}`}>
                                        {r}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="pt-6">
                        <button
                            onClick={handleSave}
                            disabled={isSaving || (mode === 'appt' && !selectedCustId && basket.length === 0)}
                            className="w-full py-6 rounded-[2rem] font-black text-base shadow-xl flex items-center justify-center gap-4 bg-primary text-white hover:bg-primary/90 active:scale-[0.98] transition-all disabled:opacity-30 disabled:cursor-not-allowed group shadow-primary/20"
                        >
                            {isSaving ? <Loader2 className="w-6 h-6 animate-spin text-white" /> : <ShieldCheck className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />}
                            {isSaving ? 'Kaydediliyor...' : basket.length > 1 ? `${basket.length} Randevuyu Toplu Onayla` : 'Randevuyu Onayla ve Bitir'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
