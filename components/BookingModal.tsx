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
            isPackageUsage: !!currentPackageId
        }]);
        
        // Reset for next entry
        setCurrentPackageId(null);
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
                isPackageUsage: !!currentPackageId
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
                    isPackageUsage: item.isPackageUsage
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
        <div className="fixed inset-0 bg-background/80 backdrop-blur-lg z-[200] flex items-center justify-center p-4">
            <div className="modal-premium w-full max-w-2xl overflow-hidden animate-[slideUp_0.4s_ease]">
                <div className="p-8 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center">
                    <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200/50">
                        <button onClick={() => setMode('appt')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'appt' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'}`}>Randevu</button>
                        <button onClick={() => setMode('block')} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${mode === 'block' ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-600'}`}>Bloke Et</button>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-xl transition text-gray-400"><X className="w-5 h-5" /></button>
                </div>

                <div className="p-10 space-y-6 max-h-[80vh] overflow-y-auto no-scrollbar">
                    {mode === 'appt' ? (
                        selectedStep === 'customer' ? (
                            <div className="space-y-4">
                                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest px-1">Müşteri Seçin</p>
                                <div className="relative">
                                    <Search className="w-5 h-5 absolute left-6 top-5 text-gray-400" />
                                    <input 
                                        autoFocus
                                        value={search} 
                                        onChange={e => setSearch(e.target.value)} 
                                        placeholder="İsim veya telefon numarası..." 
                                        className="w-full bg-gray-50 border-2 border-transparent focus:border-primary/50 focus:bg-white rounded-[2rem] pl-16 pr-8 py-5 text-gray-900 font-bold outline-none transition-all placeholder:text-gray-300"
                                    />
                                </div>
                                <div className="space-y-2">
                                    {filtered.slice(0, 5).map(c => (
                                        <div key={c.id} onClick={() => { setSelectedCustId(c.id); setSelectedStep('details'); }} className="p-5 bg-gray-50/50 rounded-[1.75rem] cursor-pointer hover:bg-primary/5 transition-all border border-transparent hover:border-primary/20 flex items-center gap-5 group">
                                            <div className="w-12 h-12 rounded-2xl bg-gray-100 text-gray-400 font-black text-base flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all">
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="font-bold text-base text-gray-900 leading-none mb-1.5">{c.name}</p>
                                                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{c.phone}</p>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-gray-300 ml-auto" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : (
                            <div className="space-y-8">
                                {/* Basket Summary */}
                                {basket.length > 0 && (
                                    <div className="space-y-3">
                                        <p className="text-[10px] font-black text-primary uppercase tracking-widest px-1">Randevu Sepeti ({basket.length})</p>
                                        <div className="flex flex-wrap gap-2">
                                            {basket.map((item, idx) => (
                                                <div key={idx} className="bg-gray-50 rounded-2xl p-4 border border-gray-100 flex items-center gap-4 animate-[fadeIn_0.3s_ease]">
                                                    <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary"><Sparkles className="w-4 h-4" /></div>
                                                    <div>
                                                        <p className="text-xs font-black text-gray-900 uppercase">{item.service}</p>
                                                        <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tighter">{item.staffName} • {item.isPackageUsage ? 'PAKET' : `₺${item.price}`}</p>
                                                    </div>
                                                    <button onClick={() => setBasket(prev => prev.filter((_, i) => i !== idx))} className="ml-2 text-gray-300 hover:text-red-500 transition-colors">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-gray-50/50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6">
                                    <div className="flex items-center justify-between">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Hizmet Detayı</p>
                                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{date} / {initialData.time}</span>
                                    </div>

                                    {/* Service & Staff Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Hizmet</label>
                                            <select value={currentService} onChange={e => {
                                                const s = services.find(svc => svc.name === e.target.value);
                                                setCurrentService(e.target.value);
                                                if(s) setPrice(s.price);
                                            }} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-primary/50">
                                                {services.map(s => <option key={s.id} value={s.name}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Uzman</label>
                                            <select value={currentStaffId} onChange={e => setCurrentStaffId(e.target.value)} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-bold text-gray-900 outline-none focus:border-primary/50">
                                                {staffMembers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    {/* Room Selection */}
                                    <div className="space-y-3">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Oda Atama</p>
                                        <div className="flex flex-wrap gap-2">
                                            {rooms.map(room => (
                                                <button key={room.id} onClick={() => setCurrentRoomId(room.id)} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all border-2 ${currentRoomId === room.id ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-100 border-transparent text-gray-400 hover:border-primary/20'}`}>
                                                    {room.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Package vs Payment Selection */}
                                    <div className="space-y-3 pt-4 border-t border-gray-100">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ödeme / Paket Tercihi</p>
                                        <div className="grid grid-cols-2 gap-3">
                                            <button 
                                                onClick={() => setCurrentPackageId(null)}
                                                className={`p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all ${!currentPackageId ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' : 'bg-gray-50 border-transparent text-gray-400 hover:border-primary/20'}`}
                                            >
                                                <Banknote className="w-4 h-4 mb-1" />
                                                <span className="text-[10px] font-black uppercase">Tekil Ödeme</span>
                                                <span className="text-[9px] opacity-70">₺{price.toLocaleString('tr-TR')}</span>
                                            </button>
                                            
                                            {customerPackages.length > 0 ? (
                                                <div className="relative group">
                                                    <select 
                                                        value={currentPackageId || ''} 
                                                        onChange={e => setCurrentPackageId(e.target.value || null)}
                                                        className={`w-full h-full p-4 rounded-2xl border-2 flex flex-col items-center gap-1 transition-all appearance-none text-center font-black uppercase text-[10px] ${currentPackageId ? 'bg-emerald-500 border-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-gray-50 border-transparent text-gray-400 hover:border-emerald-500/20'}`}
                                                    >
                                                        <option value="">Paket Kullanımı</option>
                                                        {customerPackages.map(p => <option key={p.id} value={p.id}>{p.name} ({p.totalSessions - p.usedSessions} Seans)</option>)}
                                                    </select>
                                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none opacity-50"><ChevronDown className="w-3 h-3" /></div>
                                                </div>
                                            ) : (
                                                <div className="p-4 rounded-2xl border-2 border-dashed border-gray-200 flex flex-col items-center justify-center opacity-40">
                                                    <span className="text-[9px] font-black uppercase">Paket Yok</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <button 
                                        onClick={addToBasket}
                                        className="w-full py-4 bg-gray-50 hover:bg-gray-100 text-gray-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-gray-100 transition-all flex items-center justify-center gap-2"
                                    >
                                        <Plus className="w-4 h-4" /> Seçilenleri Sepete Ekle (Arkadaş/Çoklu)
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
