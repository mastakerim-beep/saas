"use client";

import { useState } from 'react';
import { useStore, Room } from '@/lib/store';
import { 
    Plus, Trash2, Edit2, Check, X, 
    MoreHorizontal, Circle, Layers, Activity 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function RoomManagement() {
    const { rooms, addRoom, updateRoom, deleteRoom } = useStore();
    const [isAdding, setIsAdding] = useState(false);
    const [editingRoom, setEditingRoom] = useState<string | null>(null);

    // Form State
    const [name, setName] = useState('');
    const [category, setCategory] = useState('Masaj');
    const [color, setColor] = useState('#6366f1');

    const handleAdd = () => {
        if (!name) return;
        addRoom({ name, category, color, status: 'active' });
        setName('');
        setIsAdding(false);
    };

    const handleUpdate = (id: string, updates: Partial<Room>) => {
        updateRoom(id, updates);
        setEditingRoom(null);
    };

    const categories = ['Masaj', 'Cilt Bakımı', 'VIP', 'Hamam', 'Mola Odası', 'Diğer'];
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

    return (
        <div className="p-6 md:p-10 space-y-10 animate-[fadeIn_0.5s_ease-out]">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black text-gray-900 tracking-tight">Oda Yönetimi</h1>
                    <p className="text-gray-400 font-bold text-sm uppercase tracking-widest italic">Spa odalarını ve kabinleri buradan düzenleyin</p>
                </div>
                {!isAdding && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-3 px-8 py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-xl shadow-primary/20 hover:scale-[1.05] active:scale-[0.95] transition-all"
                    >
                        <Plus className="w-5 h-5" /> Yeni Oda Ekle
                    </button>
                )}
            </div>

            {/* Quick Add Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }} 
                        animate={{ height: 'auto', opacity: 1 }} 
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-2xl space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Oda İsmi</label>
                                    <input 
                                        autoFocus
                                        value={name} onChange={e => setName(e.target.value)}
                                        placeholder="Örn: Masaj Odası 1"
                                        className="w-full bg-gray-50 border-2 border-gray-50 focus:border-primary/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none transition-all"
                                    />
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kategori</label>
                                    <select 
                                        value={category} onChange={e => setCategory(e.target.value)}
                                        className="w-full bg-gray-50 border-2 border-gray-50 focus:border-primary/20 focus:bg-white rounded-2xl px-5 py-4 text-sm font-black text-gray-900 outline-none transition-all appearance-none"
                                    >
                                        {categories.map(c => <option key={c} value={c}>{c}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-3">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Renk Seçimi</label>
                                    <div className="flex gap-3">
                                        {colors.map(c => (
                                            <button 
                                                key={c} onClick={() => setColor(c)}
                                                className={`w-10 h-10 rounded-xl transition-all ${color === c ? 'scale-125 ring-4 ring-offset-2' : 'hover:scale-110'}`}
                                                style={{ backgroundColor: c, borderColor: c, ringColor: c + '40' }}
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="flex justify-end gap-4">
                                <button onClick={() => setIsAdding(false)} className="px-6 py-3 text-gray-400 font-black text-sm hover:text-gray-600 transition-colors">Vazgeç</button>
                                <button onClick={handleAdd} className="px-10 py-3 bg-primary text-white rounded-xl font-black text-sm shadow-lg shadow-primary/20">Kaydet</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Room List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {rooms.map(room => (
                    <motion.div 
                        key={room.id}
                        layout
                        className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all duration-500 group relative"
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div 
                                    className="w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-lg"
                                    style={{ backgroundColor: room.color || '#6366f1' }}
                                >
                                    <Layers className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-tight">{room.name}</h3>
                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">{room.category || 'GENEL'}</p>
                                </div>
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => deleteRoom(room.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>

                        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${room.status === 'active' ? 'bg-emerald-500' : 'bg-gray-300'}`} />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                    {room.status === 'active' ? 'Aktif' : 'Pasif'}
                                </span>
                            </div>
                            <button 
                                onClick={() => updateRoom(room.id, { status: room.status === 'active' ? 'passive' : 'active' })}
                                className="text-[10px] font-bold text-gray-400 underline underline-offset-4 hover:text-primary transition-colors"
                            >
                                Durumu Değiştir
                            </button>
                        </div>
                    </motion.div>
                ))}
            </div>

            {rooms.length === 0 && !isAdding && (
                <div className="flex flex-col items-center justify-center p-20 bg-gray-50/50 rounded-[3rem] border-2 border-dashed border-gray-200 text-center">
                    <div className="w-20 h-20 bg-white rounded-3xl shadow-sm flex items-center justify-center mb-6 text-gray-300">
                        <Plus className="w-10 h-10" />
                    </div>
                    <h2 className="text-xl font-black text-gray-900 uppercase">Henüz Oda Eklenmemiş</h2>
                    <p className="text-gray-400 font-bold text-sm max-w-xs mt-2">İşlemleri ve randevuları odalara atamak için yukarıdan yeni bir oda tanımlayın.</p>
                </div>
            )}
        </div>
    );
}
