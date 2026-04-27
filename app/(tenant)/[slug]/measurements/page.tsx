"use client";

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    TrendingUp, Ruler, Plus, Calendar, ChevronRight, 
    Search, User, Weight, Activity, 
    Target, ShieldCheck, X, Clock, AlertCircle, ShieldAlert
} from 'lucide-react';
import { useStore } from '@/lib/store';
import ImperialVetoModal from '@/components/modals/ImperialVetoModal';
import { 
    LineChart, Line, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function MeasurementsPage() {
    const { customers, updateCustomer, addLog, currentUser } = useStore();
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [vetoRecord, setVetoRecord] = useState<any | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        weight: '',
        bodyFat: '',
        muscleMass: '',
        chest: '',
        waist: '',
        hips: '',
        note: ''
    });

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

    const measurementHistory = useMemo(() => {
        if (!selectedCustomer?.vertical_data?.fitness?.measurements) return [];
        return [...selectedCustomer.vertical_data.fitness.measurements].sort((a: any, b: any) => 
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    }, [selectedCustomer]);

    const chartData = useMemo(() => {
        return [...measurementHistory].reverse().map((m: any) => ({
            date: format(new Date(m.date), 'dd MMM', { locale: tr }),
            kilo: parseFloat(m.weight),
            yag: parseFloat(m.bodyFat)
        }));
    }, [measurementHistory]);

    const handleSave = async () => {
        if (!selectedCustomerId || !formData.weight) return;

        const newMeasurement = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            ...formData,
            isSealed: false // 15 dk sonra mühürlenecek
        };

        const currentVerticalData = selectedCustomer?.vertical_data || {};
        const fitnessData = currentVerticalData.fitness || {};
        const measurements = fitnessData.measurements || [];

        const updatedVerticalData = {
            ...currentVerticalData,
            fitness: {
                ...fitnessData,
                measurements: [...measurements, newMeasurement]
            }
        };

        await updateCustomer(selectedCustomerId, { vertical_data: updatedVerticalData });
        // @ts-ignore
        if (addLog) await addLog("NEW_MEASUREMENT", selectedCustomer?.name || "Bilinmeyen", undefined, JSON.stringify(newMeasurement));
        
        setIsAddModalOpen(false);
        setFormData({ weight: '', bodyFat: '', muscleMass: '', chest: '', waist: '', hips: '', note: '' });
    };

    const isRecordEditable = (date: string) => {
        // Imperial Override Check
        const isOwner = currentUser?.role === 'Business_Owner' || currentUser?.role === 'SaaS_Owner';
        if (isOwner) return true; 

        const diff = Date.now() - new Date(date).getTime();
        return diff < 15 * 60 * 1000; // 15 Dakika (Drakoniyen Kural)
    };

    const handleVetoConfirm = async (reason: string) => {
        if (!vetoRecord || !selectedCustomerId) return;
        
        // Log the intervention
        await addLog("IMPERIAL_VETO", selectedCustomer?.name || "Bilinmeyen", undefined, `Gerekçe: ${reason} | Veri ID: ${vetoRecord.id}`);
        
        // Open edit state (In this UI, we just alert or we can set the form with this data)
        setFormData({
            weight: vetoRecord.weight,
            bodyFat: vetoRecord.bodyFat,
            muscleMass: vetoRecord.muscleMass,
            chest: vetoRecord.chest,
            waist: vetoRecord.waist,
            hips: vetoRecord.hips,
            note: vetoRecord.note || ''
        });
        
        // Remove the old one before adding the "corrected" one
        const currentData = selectedCustomer?.vertical_data || {};
        const fitness = currentData.fitness || {};
        const filtered = (fitness.measurements || []).filter((m: any) => m.id !== vetoRecord.id);
        
        await updateCustomer(selectedCustomerId, {
            vertical_data: {
                ...currentData,
                fitness: { ...fitness, measurements: filtered }
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
                        <div className="w-10 h-10 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 shadow-sm border border-orange-100">
                            <TrendingUp size={20} />
                        </div>
                        <span className="text-[10px] font-black text-orange-600 uppercase tracking-[0.3em]">Titan Fitness Modülü</span>
                    </div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter italic uppercase">Vücut Ölçüm Paneli</h1>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-orange-500 transition-colors" size={18} />
                        <input 
                            type="text" 
                            placeholder="Müşteri Ara..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-white border border-gray-100 rounded-[2rem] py-4 pl-12 pr-6 text-sm font-bold focus:outline-none focus:ring-4 focus:ring-orange-500/5 focus:border-orange-200 w-64 lg:w-80 shadow-md transition-all"
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
                                            className="w-full flex items-center gap-4 p-4 hover:bg-orange-50 rounded-2xl transition-colors group"
                                        >
                                            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-orange-100 group-hover:text-orange-600">
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
                        className="flex items-center gap-3 px-8 py-4 bg-gray-900 text-white rounded-[2rem] font-black text-[11px] uppercase tracking-widest shadow-xl shadow-gray-200 hover:bg-orange-600 disabled:opacity-50 disabled:hover:bg-gray-900 transition-all active:scale-95"
                    >
                        <Plus size={18} /> Yeni Ölçüm
                    </button>
                </div>
            </div>

            {selectedCustomer ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Summary Cards */}
                        <div className="grid grid-cols-3 gap-6">
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-50">
                                <Weight className="text-orange-500 mb-4" size={24} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Güncel Kilo</p>
                                <p className="text-3xl font-black text-gray-900 italic">{measurementHistory[0]?.weight || '--'} <span className="text-sm text-gray-300">kg</span></p>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-50">
                                <Activity className="text-emerald-500 mb-4" size={24} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Yağ Oranı</p>
                                <p className="text-3xl font-black text-gray-900 italic">%{measurementHistory[0]?.bodyFat || '--'}</p>
                            </div>
                            <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-gray-200/50 border border-gray-50">
                                <Target className="text-indigo-500 mb-4" size={24} />
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Hedef Farkı</p>
                                <p className="text-3xl font-black text-gray-900 italic">--</p>
                            </div>
                        </div>

                        {/* Chart */}
                        <div className="bg-white p-10 rounded-[3rem] shadow-xl shadow-gray-200/50 border border-gray-50 aspect-[21/9]">
                            <div className="flex items-center justify-between mb-8">
                                <h3 className="font-black text-gray-900 uppercase tracking-widest italic">Gelişim Analizi</h3>
                                <div className="flex items-center gap-6">
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-orange-500" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Ağırlık</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full bg-indigo-500" />
                                        <span className="text-[10px] font-black text-gray-400 uppercase">Yağ %</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-full h-full min-h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={chartData}>
                                        <defs>
                                            <linearGradient id="colorKilo" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#f97316" stopOpacity={0.1}/>
                                                <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} dy={10} />
                                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                                        <Tooltip 
                                            contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '1rem' }}
                                            itemStyle={{ fontSize: '12px', fontWeight: 900 }}
                                        />
                                        <Area type="monotone" dataKey="kilo" stroke="#f97316" strokeWidth={4} fillOpacity={1} fill="url(#colorKilo)" />
                                        <Line type="monotone" dataKey="yag" stroke="#6366f1" strokeWidth={4} dot={{ r: 6, fill: '#fff', stroke: '#6366f1', strokeWidth: 3 }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* History Table */}
                        <div className="bg-white border border-gray-50 rounded-[3rem] shadow-xl shadow-gray-200/50 overflow-hidden">
                            <div className="p-8 border-b border-gray-50 bg-gray-50/30 flex items-center justify-between">
                                <h3 className="font-black text-gray-900 uppercase tracking-widest italic">Tüm Ölçümler</h3>
                                <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full">
                                    <ShieldCheck size={14} />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Drakoniyen Denetimi Aktif</span>
                                </div>
                            </div>
                            <div className="divide-y divide-gray-50">
                                {measurementHistory.map((m: any) => {
                                    const editable = isRecordEditable(m.date);
                                    return (
                                        <div key={m.id} className="p-8 flex items-center justify-between group hover:bg-gray-50 transition-colors">
                                            <div className="flex items-center gap-6">
                                                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-orange-50 group-hover:text-orange-500 transition-all">
                                                    <Clock size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-sm font-black text-gray-900 italic uppercase">Periyodik Kontrol</p>
                                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest flex items-center gap-2 mt-1">
                                                        {format(new Date(m.date), 'dd MMMM yyyy HH:mm', { locale: tr })}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="flex gap-12 text-center">
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Kilo</p>
                                                    <p className="text-xl font-black text-gray-900 italic">{m.weight} kg</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Yağ %</p>
                                                    <p className="text-xl font-black text-gray-900 italic">%{m.bodyFat}</p>
                                                </div>
                                                <div>
                                                    <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mb-1">Bel</p>
                                                    <p className="text-xl font-black text-gray-900 italic">{m.waist || '--'} cm</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-4">
                                                {!isRecordEditable(m.date) && (currentUser?.role === 'Business_Owner' || currentUser?.role === 'SaaS_Owner') && (
                                                    <button 
                                                        onClick={() => setVetoRecord(m)}
                                                        className="p-3 text-white bg-amber-500 hover:bg-amber-600 rounded-xl transition-all shadow-lg shadow-amber-200 flex items-center gap-2 group/veto"
                                                    >
                                                        <ShieldAlert size={14} />
                                                        <span className="text-[10px] font-black uppercase hidden group-hover/veto:inline">VETO ET</span>
                                                    </button>
                                                )}

                                                {!isRecordEditable(m.date) ? (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 text-amber-500 rounded-full border border-amber-100" title="Mühürlenmiş Kayıt">
                                                        <ShieldCheck size={12} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Mühürlü</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-500 rounded-full border border-emerald-100" title="Düzenlenebilir">
                                                        <ShieldCheck size={12} />
                                                        <span className="text-[10px] font-black uppercase tracking-widest">GÜVENLİ</span>
                                                    </div>
                                                )}

                                                <button className="p-3 text-gray-300 hover:text-orange-500 hover:bg-orange-50 rounded-xl transition-all">
                                                    <ChevronRight size={20} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Sidebar / Profile Card */}
                    <div className="space-y-8">
                        <div className="bg-white p-10 rounded-[3.5rem] shadow-xl shadow-gray-200/50 border border-gray-50 text-center relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/5 blur-3xl -mr-10 -mt-10" />
                            <button 
                                onClick={() => setSelectedCustomerId(null)}
                                className="absolute top-6 right-6 p-2 text-gray-300 hover:text-rose-500 transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <div className="w-24 h-24 bg-gray-100 rounded-3xl mx-auto mb-6 flex items-center justify-center text-gray-300 shadow-inner">
                                <User size={48} />
                            </div>
                            <h2 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">{selectedCustomer.name}</h2>
                            <p className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-8 bg-orange-50 inline-block px-4 py-1.5 rounded-full border border-orange-100">
                                {selectedCustomer.segment || 'Özel'} Üye
                            </p>
                            
                            <div className="space-y-4 text-left">
                                <div className="p-5 bg-gray-50 rounded-2.5xl flex items-center justify-between group hover:bg-orange-50 transition-colors">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Telefon</span>
                                    <span className="text-sm font-bold text-gray-900">{selectedCustomer.phone}</span>
                                </div>
                                <div className="p-5 bg-gray-50 rounded-2.5xl flex items-center justify-between group hover:bg-orange-50 transition-colors">
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Son Ölçüm</span>
                                    <span className="text-sm font-bold text-gray-900">{measurementHistory[0] ? format(new Date(measurementHistory[0].date), 'dd.MM.yyyy') : '--'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-gray-900 p-10 rounded-[3rem] text-white space-y-6">
                            <ShieldCheck className="text-orange-500" size={32} />
                            <h4 className="text-lg font-black italic uppercase">İmparatorluk Notu</h4>
                            <p className="text-sm text-gray-400 font-bold leading-relaxed">
                                Bu müşterinin son ölçümlerinde yağ oranında %0.8 düşüş gözlemlendi. İmparatorluk, istikrarın ödüllendirilmesini önerir.
                            </p>
                            <button className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl transition-all">
                                AI Öneri Raporu Al
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
                        <h2 className="text-3xl font-black text-gray-900 italic uppercase mb-4">Bir Müşteri Seçin</h2>
                        <p className="text-sm text-gray-400 font-bold leading-relaxed">
                            Ölçüm girmek veya gelişim analizini görüntülemek için sağ üstteki arama çubuğundan bir müşteri seçin.
                        </p>
                    </div>
                </div>
            )}

            {/* Add Measurement Modal */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsAddModalOpen(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-md" />
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0, y: 20 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="bg-white w-full max-w-2xl rounded-[3.5rem] shadow-2xl relative overflow-hidden"
                        >
                            <div className="p-10 bg-gray-50 border-b border-gray-100 flex justify-between items-center">
                                <div>
                                    <h3 className="text-2xl font-black text-gray-900 italic uppercase">Yeni Ölçüm Girişi</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">{selectedCustomer?.name}</p>
                                </div>
                                <button onClick={() => setIsAddModalOpen(false)} className="p-3 bg-white text-gray-400 hover:text-rose-500 rounded-2xl shadow-sm transition-all"><X size={20} /></button>
                            </div>

                            <div className="p-10 grid grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-orange-500 uppercase tracking-widest flex items-center gap-2">
                                        <Weight size={14} /> Temel Metrikler
                                    </h4>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Kilo (kg)</label>
                                        <input type="number" value={formData.weight} onChange={(e) => setFormData({...formData, weight: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-black outline-none focus:border-orange-500 transition" placeholder="75.0" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Yağ Oranı (%)</label>
                                        <input type="number" value={formData.bodyFat} onChange={(e) => setFormData({...formData, bodyFat: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-black outline-none focus:border-orange-500 transition" placeholder="15.5" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Kas Kütlesi (kg)</label>
                                        <input type="number" value={formData.muscleMass} onChange={(e) => setFormData({...formData, muscleMass: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-black outline-none focus:border-orange-500 transition" placeholder="38.2" />
                                    </div>
                                </div>
                                <div className="space-y-6">
                                    <h4 className="text-[10px] font-black text-indigo-500 uppercase tracking-widest flex items-center gap-2">
                                        <Ruler size={14} /> Çevre Ölçümleri (cm)
                                    </h4>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Göğüs</label>
                                        <input type="number" value={formData.chest} onChange={(e) => setFormData({...formData, chest: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-black outline-none focus:border-orange-500 transition" placeholder="102" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Bel</label>
                                        <input type="number" value={formData.waist} onChange={(e) => setFormData({...formData, waist: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-black outline-none focus:border-orange-500 transition" placeholder="84" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-4 mb-2 block">Kalça</label>
                                        <input type="number" value={formData.hips} onChange={(e) => setFormData({...formData, hips: e.target.value})} className="w-full bg-gray-50 border border-gray-100 rounded-2xl p-4 font-black outline-none focus:border-orange-500 transition" placeholder="98" />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="p-10 pt-0">
                                <div className="bg-rose-50 p-6 rounded-3xl border border-rose-100 flex gap-4 mb-8">
                                    <AlertCircle className="text-rose-500 shrink-0" />
                                    <p className="text-[11px] text-rose-700 font-bold leading-relaxed uppercase">
                                        <span className="font-black">Drakoniyen Kuralı:</span> Bu kayıt 15 dakika sonra "Mühürlenecek" ve sistem üzerinden silinemeyecek veya düzenlenemeyecektir.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <button onClick={() => setIsAddModalOpen(false)} className="flex-1 py-5 bg-gray-100 text-gray-400 font-black text-[11px] uppercase tracking-widest rounded-3xl transition-all">Vazgeç</button>
                                    <button onClick={handleSave} className="flex-[2] py-5 bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest rounded-3xl shadow-xl shadow-gray-200 hover:bg-orange-600 transition-all">Ölçümü Mühürle & Kaydet</button>
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
                description={`Mühürlenen [${vetoRecord?.date ? format(new Date(vetoRecord.date), 'dd MMM') : ''}] tarihli ölçüme müdahale ediyorsunuz. Bu işlem mevcut kaydı silip yerine yeni (düzeltilmiş) bir kayıt açmanıza olanak tanır.`}
            />
        </div>
    );
}
