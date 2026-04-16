"use client";

import { useState } from 'react';
import { X, Sparkles, Clock, ShieldCheck, Loader2, Activity } from 'lucide-react';
import { useStore, Customer, Service } from '@/lib/store';
import BodyMap from '@/components/crm/BodyMap';

interface ServiceDropModalProps {
    customer: Customer;
    staffId?: string;
    roomId?: string;
    time: string;
    date: string;
    onClose: () => void;
}

export default function ServiceDropModal({ 
    customer, staffId, roomId, time, date, onClose 
}: ServiceDropModalProps) {
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
            alert("Randevu kaydedilemedi!");
        }
    };

    return (
        <div className="fixed inset-0 bg-indigo-950/40 backdrop-blur-xl z-[900] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-lg overflow-hidden rounded-[2.5rem] shadow-2xl animate-in zoom-in-95 duration-200">
                <div className="p-10 border-b border-indigo-50 flex justify-between items-center">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Sparkles className="w-4 h-4 text-indigo-600" />
                            <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Hızlı Randevu Kaydı</p>
                        </div>
                        <h3 className="text-2xl font-black text-gray-900 leading-none uppercase italic">{customer.name}</h3>
                        <div className="flex items-center gap-2 mt-4">
                             {staff && <span className="text-[10px] font-black bg-indigo-600 text-white px-3 py-1 rounded-full uppercase">{staff.name}</span>}
                             {selectedRoomId && <span className="text-[10px] font-black bg-purple-600 text-white px-3 py-1 rounded-full uppercase">{rooms.find(r => r.id === selectedRoomId)?.name}</span>}
                             <span className="text-[10px] font-black bg-gray-100 px-3 py-1 rounded-full text-gray-600 uppercase">{time}</span>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-3 hover:bg-red-50 rounded-2xl transition group">
                        <X className="w-6 h-6 text-gray-300 group-hover:text-red-500" />
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
                                    className={`group w-full p-5 rounded-[1.5rem] border-2 flex justify-between items-center transition-all ${selectedService === s.name ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-200' : 'bg-white border-gray-100 text-gray-500 hover:border-indigo-200'}`}
                                >
                                    <span className="text-sm font-black uppercase">{s.name}</span>
                                    <span className={`text-[10px] font-black ${selectedService === s.name ? 'text-white' : 'text-indigo-600'}`}>{s.duration} dk • ₺{s.price}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <textarea 
                        value={note}
                        onChange={e => setNote(e.target.value)}
                        placeholder="Randevu notu..."
                        className="w-full bg-gray-50 border-2 border-gray-50 rounded-[1.5rem] px-6 py-4 text-sm font-bold text-gray-900 outline-none focus:border-indigo-600 transition-all resize-none min-h-[80px]"
                    />

                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full py-6 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] bg-indigo-600 text-white hover:bg-indigo-700 transition-all disabled:opacity-50"
                    >
                        {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Takvime İşle ✓'}
                    </button>
                </div>
            </div>

            {showBodyMap && (
                <div className="fixed inset-0 bg-indigo-950/80 backdrop-blur-2xl z-[1000] flex items-center justify-center p-4">
                    <div className="bg-white p-10 max-w-md w-full rounded-[2.5rem] relative">
                         <button onClick={() => setShowBodyMap(false)} className="absolute top-8 right-8 text-gray-400 hover:text-red-500"><X /></button>
                         <h4 className="text-xl font-black mb-8 uppercase italic">Vücut Haritası</h4>
                         <BodyMap 
                            selectedRegions={selectedRegions} 
                            onToggleRegion={(id) => setSelectedRegions(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])} 
                         />
                         <button onClick={() => setShowBodyMap(false)} className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black mt-8 uppercase tracking-widest">Tamam</button>
                    </div>
                </div>
            )}
        </div>
    );
}
