"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Stethoscope, Plus, Search, User, FileText, 
    ChevronRight, X, Activity, ShieldCheck, 
    AlertCircle, Save, Thermometer, Heart, Beaker, ShieldAlert
} from 'lucide-react';
import { useStore } from '@/lib/store';
import ImperialVetoModal from '@/components/modals/ImperialVetoModal';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function MedicalRecordsPage() {
    const { customers, updateCustomer, addLog, currentUser } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [vetoRecord, setVetoRecord] = useState<any | null>(null);

    // Record State
    const [noteType, setNoteType] = useState('Anamnez');
    const [clinicalNote, setClinicalNote] = useState('');
    const [vitals, setVitals] = useState({ bp: '', hr: '', temp: '', weight: '' });

    const selectedCustomer = useMemo(() => 
        customers.find(c => c.id === selectedCustomerId), 
    [customers, selectedCustomerId]);

    const filteredCustomers = useMemo(() => {
        if (!searchQuery) return [];
        return customers.filter(c => 
            c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.phone?.includes(searchQuery)
        ).slice(0, 5);
    }, [customers, searchQuery]);

    const recordHistory = useMemo(() => {
        if (!selectedCustomer?.vertical_data?.clinic?.history) return [];
        return [...selectedCustomer.vertical_data.clinic.history].sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [selectedCustomer]);

    const handleSaveRecord = async () => {
        if (!selectedCustomerId || !clinicalNote) return;

        const newRecord = {
            id: crypto.randomUUID(),
            type: noteType,
            date: new Date().toISOString(),
            content: clinicalNote,
            vitals,
            isSealed: false
        };

        const currentVerticalData = selectedCustomer?.vertical_data || {};
        const clinicData = currentVerticalData.clinic || {};
        const history = clinicData.history || [];

        const updatedVerticalData = {
            ...currentVerticalData,
            clinic: {
                ...clinicData,
                history: [...history, newRecord]
            }
        };

        await updateCustomer(selectedCustomerId, { vertical_data: updatedVerticalData });
        await addLog("NEW_MEDICAL_RECORD", selectedCustomer?.name || "Bilinmeyen", undefined, JSON.stringify(newRecord));
        
        setIsAddModalOpen(false);
        setClinicalNote('');
        setVitals({ bp: '', hr: '', temp: '', weight: '' });
    };

    const isRecordEditable = (date: string) => {
        const isOwner = currentUser?.role === 'Business_Owner' || currentUser?.role === 'SaaS_Owner';
        if (isOwner) return true;
        const diff = Date.now() - new Date(date).getTime();
        return diff < 15 * 60 * 1000;
    };

    const handleVetoConfirm = async (reason: string) => {
        if (!vetoRecord || !selectedCustomerId) return;
        
        await addLog("IMPERIAL_VETO_MEDICAL", selectedCustomer?.name || "Bilinmeyen", undefined, `Gerekçe: ${reason}`);
        
        setNoteType(vetoRecord.type);
        setClinicalNote(vetoRecord.content);
        setVitals(vetoRecord.vitals || { bp: '', hr: '', temp: '', weight: '' });
        
        const currentData = selectedCustomer?.vertical_data || {};
        const clinic = currentData.clinic || {};
        const filtered = (clinic.history || []).filter((h: any) => h.id !== vetoRecord.id);
        
        await updateCustomer(selectedCustomerId, {
            vertical_data: {
                ...currentData,
                clinic: { ...clinic, history: filtered }
            }
        });

        setVetoRecord(null);
        setIsAddModalOpen(true);
    };

    return (
        <div className="p-4 lg:p-10 space-y-10 bg-[#fafafa] min-h-screen">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500 shadow-sm border border-indigo-100">
                            <Stethoscope size={20} />
                        </div>
                        <span className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">Sanctus Klinik Modülü</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Hasta Dosyaları</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-indigo-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Hasta Ara..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-100 rounded-[2rem] py-4 pl-12 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 w-64 lg:w-80 shadow-md transition-all"
                        />
                        <AnimatePresence>
                            {searchQuery && filteredCustomers.length > 0 && !selectedCustomerId && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                    className="absolute top-full mt-2 w-full bg-white rounded-3xl shadow-2xl border border-gray-50 overflow-hidden z-50 p-2"
                                >
                                    {filteredCustomers.map(c => (
                                        <button 
                                            key={c.id} 
                                            onClick={() => { setSelectedCustomerId(c.id); setSearchQuery(''); }}
                                            className="w-full flex items-center gap-4 p-4 hover:bg-indigo-50 rounded-2xl transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-indigo-100 group-hover:text-indigo-600">
                                                <User size={18} />
                                            </div>
                                            <div className="text-left">
                                                <p className="text-sm font-black text-gray-900">{c.name}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase">{c.phone || 'Telefon Yok'}</p>
                                            </div>
                                        </button>
                                    ))}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                    <button 
                        disabled={!selectedCustomerId}
                        onClick={() => setIsAddModalOpen(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-indigo-600 disabled:opacity-50 disabled:hover:bg-gray-900 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Yeni Dosya Notu
                    </button>
                </div>
            </div>

            {selectedCustomer ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Record History */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Vitals Summary */}
                        {recordHistory[0]?.vitals && (
                            <div className="grid grid-cols-4 gap-6">
                                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-50 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-500 flex items-center justify-center"><Heart size={20} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Nabız</p>
                                        <p className="text-lg font-black text-gray-900">{recordHistory[0].vitals.hr} <span className="text-[10px]">bpm</span></p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-50 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-500 flex items-center justify-center"><Activity size={20} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Tansiyon</p>
                                        <p className="text-lg font-black text-gray-900">{recordHistory[0].vitals.bp}</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-50 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-500 flex items-center justify-center"><Thermometer size={20} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Ateş</p>
                                        <p className="text-lg font-black text-gray-900">{recordHistory[0].vitals.temp} °C</p>
                                    </div>
                                </div>
                                <div className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-50 flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-500 flex items-center justify-center"><Activity size={20} /></div>
                                    <div>
                                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest">Kilo</p>
                                        <p className="text-lg font-black text-gray-900">{recordHistory[0].vitals.weight} kg</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="bg-white border border-gray-50 rounded-[3rem] shadow-xl shadow-gray-200/50 overflow-hidden">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                <h3 className="font-black text-gray-900 uppercase tracking-widest italic">Klinik Geçmiş</h3>
                                <div className="flex items-center gap-2 text-indigo-600 bg-indigo-50 px-4 py-2 rounded-full">
                                    <ShieldCheck size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Tibbi Mahremiyet Korunuyor</span>
                                </div>
                            </div>
                            
                            {recordHistory.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {recordHistory.map((r: any) => (
                                        <div key={r.id} className="p-10 hover:bg-gray-50 transition-colors group relative">
                                            <div className="flex items-start justify-between gap-8">
                                                <div className="flex gap-6">
                                                    <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center shrink-0">
                                                        <FileText size={24} />
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-4 mb-3">
                                                            <span className="px-3 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase rounded-full tracking-widest">{r.type}</span>
                                                            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{format(new Date(r.date), 'dd MMMM yyyy HH:mm', { locale: tr })}</span>
                                                        </div>
                                                        <p className="text-sm text-gray-700 font-bold leading-relaxed">{r.content}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    {!isRecordEditable(r.date) && (currentUser?.role === 'Business_Owner' || currentUser?.role === 'SaaS_Owner') && (
                                                        <button 
                                                            onClick={() => setVetoRecord(r)}
                                                            className="p-3 text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-lg shadow-amber-200 flex items-center gap-2 group/veto"
                                                        >
                                                            <ShieldAlert size={14} />
                                                            <span className="text-[10px] font-black uppercase hidden group-hover/veto:inline">VETO ET</span>
                                                        </button>
                                                    )}
                                                    
                                                    {isRecordEditable(r.date) ? (
                                                        <div className="flex items-center gap-2 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full">
                                                            <ShieldCheck size={14} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Güvenli</span>
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2 text-amber-500 bg-amber-50 px-3 py-1 rounded-full">
                                                            <ShieldCheck size={14} />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Mühürlü</span>
                                                        </div>
                                                    )}
                                                    <button className="p-3 text-gray-200 hover:text-indigo-500 transition-colors"><ChevronRight size={20} /></button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 text-center space-y-6">
                                    <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 mx-auto">
                                        <FileText size={40} />
                                    </div>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Henüz bir kayıt bulunmamaktadır.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Patient Card Side */}
                    <div className="space-y-8">
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-gray-200/50 border border-gray-50 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl -mr-10 -mt-10" />
                            <button onClick={() => setSelectedCustomerId(null)} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-rose-500 transition-colors"><X size={20} /></button>
                            <div className="w-24 h-24 bg-gray-100 rounded-3xl mx-auto mb-6 flex items-center justify-center text-gray-300 shadow-inner">
                                <User size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">{selectedCustomer.name}</h2>
                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-8 bg-indigo-50 inline-block px-4 py-1.5 rounded-full border border-indigo-100">
                                {selectedCustomer.segment || 'Özel'} Hasta
                            </p>
                            
                            <div className="space-y-4 text-left">
                                <div className="p-5 bg-gray-50 rounded-2.5xl group hover:bg-indigo-50 transition-colors">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Alerjiler</p>
                                    <p className="text-xs font-black text-rose-500 italic">Penisilin, Çilek</p>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2.5xl group hover:bg-indigo-50 transition-colors">
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">Kan Grubu</p>
                                    <p className="text-sm font-black text-gray-900">A Rh (+)</p>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 p-10 rounded-[3rem] text-white space-y-6 relative overflow-hidden">
                            <div className="absolute bottom-0 right-0 w-32 h-32 bg-indigo-500/10 blur-3xl -mr-10 -mb-10" />
                            <Beaker className="text-indigo-500" size={32} />
                            <h4 className="text-lg font-black italic uppercase">Imperial Klinik Analizi</h4>
                            <p className="text-sm text-gray-400 font-bold leading-relaxed">
                                Son 3 viziteye göre iyileşme oranı %24 artış gösterdi. Tedavi protokolü aynı dozda devam edebilir.
                            </p>
                            <button className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all">
                                Detaylı Tıbbi Rapor
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[4rem] p-24 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-200">
                        <User size={48} />
                    </div>
                    <div className="max-w-md">
                        <h2 className="text-3xl font-black text-gray-900 italic uppercase mb-4">Bir Hasta Seçin</h2>
                        <p className="text-sm text-gray-400 font-bold leading-relaxed">
                            Dosya notu girmek veya tıbbi geçmişi incelemek için sağ üstteki arama çubuğundan bir hasta seçin.
                        </p>
                    </div>
                </div>
            )}

            {/* Add Record Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-4xl rounded-[4rem] shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-10 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 italic uppercase">Yeni Dosya Kaydı</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Sanctus Klinik Arşivi</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-4 bg-white text-gray-400 hover:text-rose-500 rounded-2xl shadow-sm transition-all"><X size={20} /></button>
                            </div>

                            <div className="p-10 grid grid-cols-1 lg:grid-cols-3 gap-12">
                                <div className="space-y-8">
                                    <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                                        <Activity size={14} /> Vital Bulgular
                                    </h4>
                                    <div className="grid grid-cols-2 gap-6">
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Tansiyon</label>
                                            <input value={vitals.bp} onChange={(e) => setVitals({...vitals, bp: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 transition" placeholder="120/80" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Nabız</label>
                                            <input value={vitals.hr} onChange={(e) => setVitals({...vitals, hr: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 transition" placeholder="72" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Ateş</label>
                                            <input value={vitals.temp} onChange={(e) => setVitals({...vitals, temp: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 transition" placeholder="36.5" />
                                        </div>
                                        <div>
                                            <label className="text-[100px] hidden font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Kilo</label>
                                            <input value={vitals.weight} onChange={(e) => setVitals({...vitals, weight: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 transition" placeholder="70" />
                                        </div>
                                    </div>
                                </div>

                                <div className="lg:col-span-2 space-y-8">
                                    <div className="flex gap-4">
                                        {['Anamnez', 'Muayene', 'Laboratuvar', 'Epikriz'].map(type => (
                                            <button 
                                                key={type} onClick={() => setNoteType(type)}
                                                className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${noteType === type ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-gray-100 text-gray-400 hover:border-indigo-200'}`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                    
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-3 block">Klinik Notlar</label>
                                        <textarea 
                                            value={clinicalNote} onChange={(e) => setClinicalNote(e.target.value)}
                                            rows={8}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-[2.5rem] p-8 font-bold text-sm outline-none transition resize-none"
                                            placeholder="Hasta şikayetleri, bulgular ve öneriler..."
                                        />
                                    </div>

                                    <div className="flex gap-4">
                                        <div className="flex-1 bg-amber-50 p-6 rounded-3xl border border-amber-100 flex gap-4">
                                            <AlertCircle className="text-amber-500 shrink-0" />
                                            <p className="text-[10px] text-amber-700 font-bold uppercase leading-relaxed">
                                                Mühürlenen kayıtlar üzerinde silme işlemi yapılamaz.
                                            </p>
                                        </div>
                                        <button 
                                            onClick={handleSaveRecord}
                                            className="flex-[2] py-5 bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-gray-200 hover:bg-indigo-600 transition-all flex items-center justify-center gap-3"
                                        >
                                            <Save size={18} /> Kaydı Arşive Mühürle
                                        </button>
                                    </div>
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
                description={`Klinik kaydı mühürlenmiş durumdadır. Bu müdahale sonucunda mevcut kayıt düzenleme moduna alınacak ve yeni halinin kaydedilmesi sonrasında mühür yeniden devreye girecektir.`}
            />
        </div>
    );
}
