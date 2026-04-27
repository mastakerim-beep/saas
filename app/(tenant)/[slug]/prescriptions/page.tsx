"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Pill, Plus, Search, User, FileText, 
    X, ShieldCheck, Save, Calendar, 
    Trash2, Printer, ClipboardCheck, AlertCircle, ShieldAlert
} from 'lucide-react';
import { useStore } from '@/lib/store';
import ImperialVetoModal from '@/components/modals/ImperialVetoModal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Medication {
    id: string;
    name: string;
    dosage: string;
    frequency: string;
    duration: string;
    note?: string;
}

export default function PrescriptionsPage() {
    const { appointments, customers, updateAppointment, addLog, currentUser } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedApptId, setSelectedApptId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [vetoRecord, setVetoRecord] = useState<any | null>(null);

    // Prescription Builder State
    const [medications, setMedications] = useState<Medication[]>([]);
    const [newMed, setNewMed] = useState({ name: '', dosage: '', frequency: '', duration: '', note: '' });

    const selectedAppt = useMemo(() => 
        appointments.find(a => a.id === selectedApptId), 
    [appointments, selectedApptId]);

    const filteredAppts = useMemo(() => {
        if (!searchQuery) return [];
        return appointments.filter(a => 
            a.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            a.apptRef?.includes(searchQuery)
        ).slice(0, 5);
    }, [appointments, searchQuery]);

    const handleAddMedication = () => {
        if (!newMed.name) return;
        setMedications([...medications, { ...newMed, id: crypto.randomUUID() }]);
        setNewMed({ name: '', dosage: '', frequency: '', duration: '', note: '' });
    };

    const handleRemoveMedication = (id: string) => {
        setMedications(medications.filter(m => m.id !== id));
    };

    const handleSavePrescription = async () => {
        if (!selectedApptId || medications.length === 0) return;

        const prescription = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            medications,
            isSealed: true
        };

        const currentNotes = selectedAppt?.vertical_notes || {};
        const updatedNotes = {
            ...currentNotes,
            clinic: {
                ...currentNotes.clinic,
                prescription
            }
        };

        await updateAppointment(selectedApptId, { vertical_notes: updatedNotes });
        await addLog("NEW_PRESCRIPTION", selectedAppt?.customerName || "Bilinmeyen", undefined, JSON.stringify(prescription));
        
        setIsAddModalOpen(false);
        setMedications([]);
    };

    const handleVetoConfirm = async (reason: string) => {
        if (!selectedApptId || !selectedAppt?.vertical_notes?.clinic?.prescription) return;
        
        const oldP = selectedAppt.vertical_notes.clinic.prescription;
        await addLog("IMPERIAL_VETO_PRESCRIPTION", selectedAppt.customerName, undefined, `Gerekçe: ${reason}`);
        
        setMedications(oldP.medications || []);
        setVetoRecord(null);
        setIsAddModalOpen(true);
    };

    const hasPrescription = !!selectedAppt?.vertical_notes?.clinic?.prescription;
    const isOwner = currentUser?.role === 'Business_Owner' || currentUser?.role === 'SaaS_Owner';

    return (
        <div className="p-4 lg:p-10 space-y-10 bg-[#fafafa] min-h-screen">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                            <Pill size={20} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Sanctus Klinik Modülü</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Reçete Yönetimi</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Randevu/Hasta Ara..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-100 rounded-[2rem] py-4 pl-12 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 w-64 lg:w-80 shadow-md transition-all"
                        />
                        <AnimatePresence>
                            {searchQuery && filteredAppts.length > 0 && !selectedApptId && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full mt-2 w-full bg-white rounded-3xl shadow-2xl border border-gray-50 overflow-hidden z-50 p-2"
                                >
                                    {filteredAppts.map(a => (
                                        <button 
                                            key={a.id} 
                                            onClick={() => { setSelectedApptId(a.id); setSearchQuery(''); }}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-indigo-50 rounded-2xl transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                                                <Calendar size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-gray-900">{a.customerName}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{a.date} • {a.service}</p>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button 
                        disabled={!selectedApptId}
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-gray-900 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Reçete Yaz
                    </button>
                </div>
            </div>

            {selectedAppt ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Prescription Details */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white border border-gray-50 rounded-[4rem] shadow-2xl shadow-gray-200/50 overflow-hidden relative p-16">
                            <div className="absolute top-10 right-10 opacity-5 pointer-events-none">
                                <FileText size={200} />
                            </div>
                            
                            {/* Prescription Header */}
                            <div className="flex justify-between items-start mb-16 pb-12 border-b-2 border-dashed border-gray-100">
                                <div>
                                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase mb-2">Reçete</h2>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">Imperial Health Systems</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Tarih</p>
                                    <p className="text-sm font-black text-gray-900">{format(new Date(), 'dd MMMM yyyy', { locale: tr })}</p>
                                </div>
                            </div>

                            {/* Patient Info */}
                            <div className="grid grid-cols-2 gap-12 mb-16">
                                <div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hasta Bilgileri</p>
                                    <p className="text-xl font-black text-gray-900 uppercase italic">{selectedAppt.customerName}</p>
                                    <p className="text-xs font-bold text-gray-400 mt-1">Ref: {selectedAppt.apptRef || '--'}</p>
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Hizmet</p>
                                    <p className="text-xl font-black text-gray-900 uppercase italic">{selectedAppt.service}</p>
                                </div>
                            </div>

                            {/* Medications */}
                            <div className="space-y-10 mb-16">
                                <h3 className="text-lg font-black text-gray-900 uppercase tracking-tighter flex items-center gap-3">
                                    <Pill className="text-indigo-600" /> İlaç ve Tedavi Planı
                                </h3>
                                
                                {selectedAppt.vertical_notes?.clinic?.prescription?.medications ? (
                                    <div className="space-y-8">
                                        {selectedAppt.vertical_notes.clinic.prescription.medications.map((m: any, idx: number) => (
                                            <div key={idx} className="flex gap-8 group">
                                                <span className="text-xl font-black text-indigo-200 mt-1 italic">R/</span>
                                                <div className="flex-1">
                                                    <p className="text-lg font-black text-gray-900 uppercase">{m.name}</p>
                                                    <p className="text-sm font-bold text-gray-500 mt-1">{m.dosage} • {m.frequency} • {m.duration}</p>
                                                    {m.note && <p className="text-[11px] text-gray-400 mt-2 italic">Bilgi: {m.note}</p>}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="p-16 border-2 border-dashed border-gray-100 rounded-[3rem] text-center space-y-4">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto text-gray-200">
                                            <ClipboardCheck size={32} />
                                        </div>
                                        <p className="text-sm font-black text-gray-300 uppercase tracking-widest">Henüz mühürlenmiş reçete yok.</p>
                                    </div>
                                )}
                            </div>

                            {/* Signature Area */}
                            <div className="pt-12 border-t-2 border-dashed border-gray-100 flex justify-between items-end">
                                <div>
                                    <div className="w-32 h-32 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-100 mb-4 border border-gray-100">
                                        <Printer size={48} />
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Dijital Mühür</p>
                                </div>
                                <div className="text-right">
                                    <div className="w-48 h-1 bg-gray-900 mb-4" />
                                    <div className="flex flex-col items-end gap-2">
                                        <p className="text-sm font-black text-gray-900 uppercase italic">Dr. {selectedAppt.staffName}</p>
                                        <div className="flex items-center gap-4">
                                            {hasPrescription && isOwner && (
                                                <button 
                                                    onClick={() => setVetoRecord(selectedAppt.vertical_notes.clinic.prescription)}
                                                    className="flex items-center gap-2 px-4 py-2 bg-amber-500 text-white text-[9px] font-black uppercase rounded-xl hover:bg-amber-600 transition-all shadow-lg shadow-amber-200"
                                                >
                                                    <ShieldAlert size={12} /> Müdahale Et (Veto)
                                                </button>
                                            )}
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Onaylandı</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Appt Side Card */}
                    <div className="space-y-8">
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-gray-200/50 border border-gray-50 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-10 -mt-10" />
                            <button onClick={() => setSelectedApptId(null)} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-rose-500 transition-colors"><X size={20} /></button>
                            
                            <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter mb-8">Randevu Özeti</h3>
                            
                            <div className="space-y-4">
                                <div className="p-5 bg-gray-50 rounded-2.5xl flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Tarih</span>
                                    <span className="text-sm font-bold text-gray-900">{selectedAppt.date}</span>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2.5xl flex items-center justify-between">
                                    <span className="text-[10px] font-black text-gray-400 uppercase">Durum</span>
                                    <span className="px-3 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black uppercase rounded-full">{selectedAppt.status}</span>
                                </div>
                            </div>

                            <button className="w-full mt-10 py-5 bg-indigo-50 text-indigo-600 font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-3 transition-all hover:bg-indigo-600 hover:text-white">
                                <Printer size={18} /> PDF Olarak Yazdır
                            </button>
                        </div>

                        <div className="bg-gray-900 p-10 rounded-[3rem] text-white space-y-6">
                            <ShieldCheck className="text-indigo-500" size={32} />
                            <h4 className="text-lg font-black italic uppercase">Drakoniyen Güvenlik</h4>
                            <p className="text-sm text-gray-400 font-bold leading-relaxed uppercase tracking-tight">
                                Mühürlenen reçeteler üzerinde değişiklik yapılamaz. Yanlış kayıt durumunda "İptal Şerhi" düşülmelidir.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[4rem] p-24 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-200">
                        <FileText size={48} />
                    </div>
                    <div className="max-w-md">
                        <h2 className="text-3xl font-black text-gray-900 italic uppercase mb-4">Bir Randevu Seçin</h2>
                        <p className="text-sm text-gray-400 font-bold leading-relaxed">
                            Reçete düzenlemek için sistemdeki aktif veya tamamlanmış randevulardan birini arayın.
                        </p>
                    </div>
                </div>
            )}

            {/* Add Prescription Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-5xl rounded-[4rem] shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-10 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 italic uppercase">Reçete Oluşturucu</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{selectedAppt?.customerName} • {selectedAppt?.apptRef}</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-4 bg-white text-gray-400 hover:text-rose-500 rounded-2xl shadow-sm transition-all"><X size={20} /></button>
                            </div>

                            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6">
                                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                            <Plus size={14} /> İlaç/Tedavi Ekle
                                        </h4>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">İlaç Adı</label>
                                            <input 
                                                value={newMed.name} onChange={(e) => setNewMed({...newMed, name: e.target.value})}
                                                className="w-full bg-white border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 transition" placeholder="Örn: Arveles 25mg" 
                                            />
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Dozaj</label>
                                                <input value={newMed.dosage} onChange={(e) => setNewMed({...newMed, dosage: e.target.value})} className="bg-white border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 transition" placeholder="1 Tablet" />
                                            </div>
                                            <div>
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Sıklık</label>
                                                <input value={newMed.frequency} onChange={(e) => setNewMed({...newMed, frequency: e.target.value})} className="bg-white border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 transition" placeholder="Günde 2 kez" />
                                            </div>
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Süre</label>
                                            <input value={newMed.duration} onChange={(e) => setNewMed({...newMed, duration: e.target.value})} className="bg-white border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 transition" placeholder="7 Gün" />
                                        </div>
                                        <button 
                                            onClick={handleAddMedication}
                                            className="w-full py-4 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-indigo-100 hover:scale-[1.02] transition-all"
                                        >
                                            Reçeteye Ekle
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6 flex flex-col h-full">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-4">
                                        <ClipboardCheck size={14} /> Reçete İçeriği
                                    </h4>
                                    <div className="flex-1 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200 overflow-y-auto max-h-[350px] p-6 space-y-4">
                                        {medications.map((m) => (
                                            <div key={m.id} className="bg-white p-5 rounded-2xl flex items-center justify-between group shadow-sm border border-gray-50">
                                                <div className="flex gap-4">
                                                    <span className="text-indigo-400 font-black italic">R/</span>
                                                    <div>
                                                        <p className="font-black text-gray-900 uppercase italic text-sm">{m.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                                            {m.dosage} • {m.frequency} • {m.duration}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button onClick={() => handleRemoveMedication(m.id)} className="p-2 text-gray-200 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        {medications.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4 py-20">
                                                <Pill size={32} />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Henüz ilaç eklenmedi.</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 flex gap-4">
                                        <AlertCircle className="text-indigo-500 shrink-0" />
                                        <p className="text-[10px] text-indigo-700 font-bold uppercase leading-relaxed">
                                            Reçete mühürlendiğinde sisteme kalıcı olarak işlenecektir.
                                        </p>
                                    </div>

                                    <button 
                                        disabled={medications.length === 0}
                                        onClick={handleSavePrescription}
                                        className="w-full py-5 bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-gray-200 hover:bg-indigo-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Save size={18} /> Reçeteyi Mühürle & Kaydet
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            {/* Veto Modal */}
            <ImperialVetoModal 
                isOpen={!!vetoRecord}
                onClose={() => setVetoRecord(null)}
                onConfirm={handleVetoConfirm}
                description={`Bu reçete mühürlenmiştir. Müdahale etmeniz durumunda mevcut reçete içeriği düzenleyiciye aktarılacak ve log kaydı oluşturulacaktır.`}
            />
        </div>
    );
}
