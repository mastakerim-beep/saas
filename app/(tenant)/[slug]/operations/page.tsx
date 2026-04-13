"use client";

import { useStore, Room } from '@/lib/store';
import { LayoutGrid, Activity, LogIn, Trash2, Plus } from 'lucide-react';

export default function OperationsPage() {
    const { rooms, updateRoomStatus } = useStore();

    const getStatusColor = (status: Room['status']) => {
        switch (status) {
            case 'Boş': return 'bg-green-100 text-green-700';
            case 'Dolu': return 'bg-red-100 text-red-700';
            case 'Bakımda': return 'bg-amber-100 text-amber-700';
            default: return 'bg-gray-100 text-gray-700';
        }
    };

    return (
        <div className="p-8 max-w-[1200px] mx-auto animate-[fadeIn_0.3s_ease]">
            <div className="flex justify-between items-end mb-8">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1 text-gray-900">Oda ve Operasyon Merkezi</h1>
                    <p className="text-gray-500 text-sm font-semibold">Odaların boş/dolu durumlarını ve cihazları yönetin</p>
                </div>
            </div>

            <div className="flex gap-2 mb-8 bg-white p-1.5 rounded-2xl w-full max-w-4xl border border-gray-200 shadow-sm">
                <button className="flex-1 bg-gray-100 shadow-sm text-gray-900 py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition">
                    <LayoutGrid className="w-4 h-4"/> Odalar
                </button>
                <button className="flex-1 text-gray-500 hover:bg-gray-50 hover:text-black py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition">
                    <Activity className="w-4 h-4"/> Donanım
                </button>
                <button className="flex-1 text-gray-500 hover:bg-gray-50 hover:text-black py-2.5 rounded-xl text-[13px] font-bold flex items-center justify-center gap-2 transition">
                    <LogIn className="w-4 h-4"/> Resepsiyon
                </button>
            </div>

            <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold">Oda Yönetimi ({rooms.length})</h3>
                <button className="bg-black text-white px-5 py-2 rounded-xl font-bold flex items-center gap-2 text-[13px] shadow-sm hover:scale-105 transition-transform">
                    <Plus className="w-4 h-4" /> Oda Ekle
                </button>
            </div>

            <div className="grid grid-cols-4 gap-6">
                {rooms.map(room => (
                    <div key={room.id} className="card-apple p-5 relative bg-white border border-gray-200 shadow-sm rounded-3xl hover:border-indigo-300 transition-colors group">
                        <div className="flex justify-between items-start mb-6">
                            <h4 className="font-bold text-sm tracking-wide text-gray-900">{room.name}</h4>
                            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-tighter ${getStatusColor(room.status)}`}>
                                {room.status}
                            </span>
                        </div>
                        <div className="flex gap-2 items-center">
                            <select 
                                value={room.status}
                                onChange={(e) => updateRoomStatus(room.id, e.target.value as Room['status'])}
                                className="flex-1 border border-gray-200 bg-gray-50 rounded-xl px-3 py-2 text-xs focus:outline-none appearance-none font-bold text-gray-700 cursor-pointer hover:bg-gray-100 transition"
                            >
                                <option value="Boş">Durum: Boş</option>
                                <option value="Dolu">Durum: Dolu</option>
                                <option value="Bakımda">Durum: Bakımda</option>
                            </select>
                            <button className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-colors">
                                <Trash2 className="w-4 h-4"/>
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
