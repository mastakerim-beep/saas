"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    Dumbbell, Plus, Search, User, Play, Clock, 
    ChevronRight, X, Trash2, ClipboardList, Activity,
    ShieldCheck, Sparkles, AlertCircle, Save, Calendar
} from 'lucide-react';
import { useData } from '@/lib/store/DataContext';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Exercise {
    id: string;
    name: string;
    sets: string;
    reps: string;
    weight: string;
    note?: string;
}

export default function WorkoutsPage() {
    const { customers, updateCustomer, addLog } = useData();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    // Routine Builder State
    const [routineName, setRoutineName] = useState('');
    const [exercises, setExercises] = useState<Exercise[]>([]);
    const [newExercise, setNewExercise] = useState({ name: '', sets: '', reps: '', weight: '', note: '' });

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

    const workoutHistory = useMemo(() => {
        if (!selectedCustomer?.vertical_data?.fitness?.workouts) return [];
        return [...selectedCustomer.vertical_data.fitness.workouts].sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [selectedCustomer]);

    const handleAddExercise = () => {
        if (!newExercise.name) return;
        setExercises([...exercises, { ...newExercise, id: crypto.randomUUID() }]);
        setNewExercise({ name: '', sets: '', reps: '', weight: '', note: '' });
    };

    const handleRemoveExercise = (id: string) => {
        setExercises(exercises.filter(ex => ex.id !== id));
    };

    const handleSaveRoutine = async () => {
        if (!selectedCustomerId || !routineName || exercises.length === 0) return;

        const newWorkout = {
            id: crypto.randomUUID(),
            name: routineName,
            date: new Date().toISOString(),
            exercises,
            isSealed: false
        };

        const currentVerticalData = selectedCustomer?.vertical_data || {};
        const fitnessData = currentVerticalData.fitness || {};
        const workouts = fitnessData.workouts || [];

        const updatedVerticalData = {
            ...currentVerticalData,
            fitness: {
                ...fitnessData,
                workouts: [...workouts, newWorkout]
            }
        };

        await updateCustomer(selectedCustomerId, { vertical_data: updatedVerticalData });
        // @ts-ignore
        if (addLog) await addLog("NEW_WORKOUT_PLAN", selectedCustomer?.name || "Bilinmeyen", undefined, JSON.stringify(newWorkout));
        
        setIsAddModalOpen(false);
        setRoutineName('');
        setExercises([]);
    };

    return (
        <div className="p-4 lg:p-10 space-y-10 bg-[#fafafa] min-h-screen">
            {/* Header */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                <div>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shadow-sm border border-amber-100">
                            <Dumbbell size={20} />
                        </div>
                        <span className="text-[10px] font-black text-amber-600 uppercase tracking-[0.3em]">Titan Fitness Modülü</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Antrenman Programları</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-amber-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Müşteri Ara..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-100 rounded-[2rem] py-4 pl-12 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-amber-500/5 focus:border-amber-200 w-64 lg:w-80 shadow-md transition-all"
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
                                            className="w-full flex items-center gap-4 p-4 hover:bg-amber-50 rounded-2xl transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-amber-100 group-hover:text-amber-600">
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
                        className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-amber-600 disabled:opacity-50 disabled:hover:bg-gray-900 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Yeni Program
                    </button>
                </div>
            </div>

            {selectedCustomer ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Routine History */}
                    <div className="lg:col-span-2 space-y-8">
                        <div className="bg-white border border-gray-50 rounded-[3rem] shadow-xl shadow-gray-200/50 overflow-hidden">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                <h3 className="font-black text-gray-900 uppercase tracking-widest italic">Aktif Programlar</h3>
                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
                                    <ShieldCheck size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">İmparatorluk Kalkanı Aktif</span>
                                </div>
                            </div>
                            
                            {workoutHistory.length > 0 ? (
                                <div className="divide-y divide-gray-50">
                                    {workoutHistory.map((w: any) => (
                                        <motion.div 
                                            key={w.id} 
                                            whileHover={{ backgroundColor: '#fffcf5' }}
                                            className="p-10 flex items-center justify-between group cursor-pointer transition-colors"
                                        >
                                            <div className="flex items-center gap-8">
                                                <div className="w-16 h-16 rounded-3xl bg-amber-50 flex items-center justify-center text-amber-500 group-hover:scale-110 transition-transform shadow-sm">
                                                    <ClipboardList size={28} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xl font-black text-gray-900 italic uppercase tracking-tighter">{w.name}</h4>
                                                    <div className="flex items-center gap-4 mt-2">
                                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest flex items-center gap-2">
                                                            <Calendar size={12} /> {format(new Date(w.date), 'dd MMMM yyyy', { locale: tr })}
                                                        </p>
                                                        <p className="text-[10px] text-amber-600 font-black uppercase tracking-widest flex items-center gap-2">
                                                            <Activity size={12} /> {w.exercises.length} Egzersiz
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                <div className="sr-only md:not-sr-only flex -space-x-3">
                                                    {w.exercises.slice(0, 3).map((ex: any, idx: number) => (
                                                        <div key={idx} className="w-10 h-10 rounded-full bg-white border-2 border-gray-50 flex items-center justify-center text-[10px] font-black text-gray-400 shadow-sm" title={ex.name}>
                                                            {ex.name.charAt(0)}
                                                        </div>
                                                    ))}
                                                    {w.exercises.length > 3 && (
                                                        <div className="w-10 h-10 rounded-full bg-amber-500 border-2 border-white flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                                                            +{w.exercises.length - 3}
                                                        </div>
                                                    )}
                                                </div>
                                                <button className="p-4 bg-gray-50 text-gray-300 rounded-2xl group-hover:bg-amber-500 group-hover:text-white transition-all">
                                                    <Play size={20} fill="currentColor" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </div>
                            ) : (
                                <div className="p-20 text-center space-y-6">
                                    <div className="w-20 h-20 bg-gray-50 rounded-[2.5rem] flex items-center justify-center text-gray-200 mx-auto">
                                        <ClipboardList size={40} />
                                    </div>
                                    <p className="text-sm text-gray-400 font-bold uppercase tracking-widest">Henüz bir program tanımlanmamış.</p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Customer Profile Side */}
                    <div className="space-y-8">
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-gray-200/50 border border-gray-50 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-10 -mt-10" />
                            <button onClick={() => setSelectedCustomerId(null)} className="absolute top-6 right-6 p-2 text-gray-300 hover:text-rose-500 transition-colors"><X size={20} /></button>
                            <div className="w-24 h-24 bg-gray-100 rounded-3xl mx-auto mb-6 flex items-center justify-center text-gray-300 shadow-inner">
                                <User size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">{selectedCustomer.name}</h2>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-8 bg-amber-50 inline-block px-4 py-1.5 rounded-full border border-amber-100">
                                {selectedCustomer.segment || 'Özel'} Üye
                            </p>
                            
                            <div className="space-y-4 text-left">
                                <div className="p-5 bg-gray-50 rounded-2.5xl flex items-center justify-between group hover:bg-amber-50 transition-colors">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kilo Trendi</span>
                                    <span className="text-sm font-bold text-emerald-500 flex items-center gap-2">
                                        <Sparkles size={14} /> Düşüşte
                                    </span>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2.5xl flex items-center justify-between group hover:bg-amber-50 transition-colors">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Disiplin Skoru</span>
                                    <span className="text-sm font-black text-gray-900 inline-flex items-center gap-1">
                                        94 <span className="text-[10px] text-gray-400">/ 100</span>
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-amber-600 p-10 rounded-[3rem] text-white space-y-6 shadow-2xl shadow-amber-200 relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 blur-2xl -mr-8 -mt-8" />
                            <Sparkles size={32} />
                            <h4 className="text-lg font-black italic uppercase">AI Akıllı Tavsiye</h4>
                            <p className="text-sm text-white/80 font-bold leading-relaxed">
                                Müşterinin HIIT antrenmanlarına olan ilgisi yüksek. Bir sonraki programda "Titan-X" protokolünü denemesi önerilir.
                            </p>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white rounded-[4rem] p-24 border border-dashed border-gray-200 flex flex-col items-center justify-center text-center space-y-8">
                    <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center text-gray-200">
                        <User size={48} />
                    </div>
                    <div className="max-w-md">
                        <h2 className="text-3xl font-black text-gray-900 italic uppercase mb-4">Bir Sporcu Seçin</h2>
                        <p className="text-sm text-gray-400 font-bold leading-relaxed">
                            Program oluşturmak veya geçmiş antrenmanları yönetmek için sağ üstteki arama çubuğundan bir müşteri seçin.
                        </p>
                    </div>
                </div>
            )}

            {/* Add Routine Modal */}
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
                                    <h3 className="text-2xl font-black text-gray-900 italic uppercase">Yeni Program İnşası</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Titan Fitness Protokolü</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-4 bg-white text-gray-400 hover:text-rose-500 rounded-2xl shadow-sm transition-all"><X size={20} /></button>
                            </div>

                            <div className="p-10 grid grid-cols-1 lg:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-3 block">Program Adı</label>
                                        <input 
                                            value={routineName} onChange={(e) => setRoutineName(e.target.value)}
                                            className="w-full bg-gray-50 border-2 border-transparent focus:border-amber-500 rounded-2.5xl py-5 px-6 font-black text-lg outline-none transition uppercase italic" 
                                            placeholder="Örn: Hipertrofi Haftası" 
                                        />
                                    </div>

                                    <div className="bg-gray-50 p-8 rounded-[2.5rem] border border-gray-100 space-y-6">
                                        <h4 className="text-[10px] font-black text-amber-600 uppercase tracking-widest flex items-center gap-2 mb-2">
                                            <Plus size={14} /> Egzersiz Ekle
                                        </h4>
                                        <input 
                                            value={newExercise.name} onChange={(e) => setNewExercise({...newExercise, name: e.target.value})}
                                            className="w-full bg-white border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-amber-500 transition" placeholder="Egzersiz Adı" 
                                        />
                                        <div className="grid grid-cols-3 gap-4">
                                            <input value={newExercise.sets} onChange={(e) => setNewExercise({...newExercise, sets: e.target.value})} className="bg-white border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-amber-500 transition" placeholder="Set" />
                                            <input value={newExercise.reps} onChange={(e) => setNewExercise({...newExercise, reps: e.target.value})} className="bg-white border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-amber-500 transition" placeholder="Tekrar" />
                                            <input value={newExercise.weight} onChange={(e) => setNewExercise({...newExercise, weight: e.target.value})} className="bg-white border border-gray-100 rounded-2xl p-4 font-bold outline-none focus:border-amber-500 transition" placeholder="Kilo" />
                                        </div>
                                        <button 
                                            onClick={handleAddExercise}
                                            className="w-full py-4 bg-amber-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl shadow-lg shadow-amber-100 hover:scale-[1.02] transition-all"
                                        >
                                            Listeye Ekle
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-6 flex flex-col h-full">
                                    <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 ml-4">
                                        <ClipboardList size={14} /> Program Akışı
                                    </h4>
                                    <div className="flex-1 bg-gray-50/50 rounded-[2.5rem] border border-dashed border-gray-200 overflow-y-auto max-h-[400px] p-6 space-y-4">
                                        {exercises.map((ex) => (
                                            <div key={ex.id} className="bg-white p-5 rounded-2xl flex items-center justify-between group shadow-sm border border-gray-50">
                                                <div>
                                                    <p className="font-black text-gray-900 uppercase italic text-sm">{ex.name}</p>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase mt-1">
                                                        {ex.sets} Set × {ex.reps} Tekrar • {ex.weight} kg
                                                    </p>
                                                </div>
                                                <button onClick={() => handleRemoveExercise(ex.id)} className="p-2 text-gray-200 hover:text-rose-500 transition-colors"><Trash2 size={16} /></button>
                                            </div>
                                        ))}
                                        {exercises.length === 0 && (
                                            <div className="h-full flex flex-col items-center justify-center text-gray-300 space-y-4 py-20">
                                                <Activity size={32} />
                                                <p className="text-[10px] font-black uppercase tracking-widest">Henüz egzersiz eklenmedi.</p>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex gap-4">
                                        <AlertCircle className="text-rose-500 shrink-0" />
                                        <p className="text-[10px] text-rose-700 font-bold uppercase leading-relaxed">
                                            Mühürlenen programlar sadece yönetici yetkisiyle silinebilir.
                                        </p>
                                    </div>

                                    <button 
                                        disabled={!routineName || exercises.length === 0}
                                        onClick={handleSaveRoutine}
                                        className="w-full py-5 bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest rounded-3xl shadow-2xl shadow-gray-200 hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
                                    >
                                        <Save size={18} /> Programı Mühürle & Yayınla
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
