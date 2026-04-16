"use client";

import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Target, Search, MoreHorizontal, User, MapPin } from 'lucide-react';
import { Branch } from '@/lib/store';

interface CalendarHeaderProps {
    selectedDate: string;
    onPrevDay: () => void;
    onNextDay: () => void;
    onToday: () => void;
    onDatePickerToggle: () => void;
    currentBranch: Branch | null;
    viewMode: 'staff' | 'room';
    setViewMode: (v: 'staff' | 'room') => void;
    syncStatus: 'idle' | 'syncing' | 'error';
    onPanelToggle: () => void;
}

export default function CalendarHeader({ 
    selectedDate, onPrevDay, onNextDay, onToday, onDatePickerToggle, 
    currentBranch, viewMode, setViewMode, syncStatus, onPanelToggle 
}: CalendarHeaderProps) {
    const displayDate = new Date(selectedDate).toLocaleDateString('tr-TR', { 
        day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' 
    });

    return (
        <header className="h-[100px] border-b border-gray-100 bg-white px-10 flex items-center justify-between z-40 bg-white">
            <div className="flex items-center gap-10">
                <div className="flex flex-col">
                    <div className="flex items-center gap-2 mb-1">
                        <MapPin className="w-3 h-3 text-indigo-600" />
                        <h1 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] leading-none">
                            {currentBranch?.name || 'Aura Spa ERP'} Command Center
                        </h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={onDatePickerToggle}
                            className="flex items-center gap-3 px-5 py-2.5 bg-gray-50 hover:bg-indigo-50 border border-gray-100 rounded-2xl group transition-all"
                        >
                            <CalendarIcon className="w-5 h-5 text-indigo-600 group-hover:scale-110 transition-transform" />
                            <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase italic">{displayDate}</h2>
                        </button>
                        <div className="flex p-1 bg-gray-50 rounded-2xl border border-gray-100 items-center justify-center">
                            <button onClick={onPrevDay} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400 hover:text-indigo-600"><ChevronLeft size={16} /></button>
                            <button onClick={onToday} className="px-4 py-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-[10px] font-black uppercase text-gray-500 hover:text-indigo-600">BUGÜN</button>
                            <button onClick={onNextDay} className="p-2 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400 hover:text-indigo-600"><ChevronRight size={16} /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="flex items-center gap-6">
                <div className="flex p-2 bg-gray-50 border border-gray-100 rounded-[2.5rem] shadow-inner">
                    <button 
                        onClick={() => setViewMode('staff')}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${viewMode === 'staff' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' : 'text-gray-400 hover:text-indigo-600'}`}
                    >
                        <User size={14} className={viewMode === 'staff' ? 'animate-pulse' : ''} />
                        Personel Görünümü
                    </button>
                    <button 
                        onClick={() => setViewMode('room')}
                        className={`flex items-center gap-3 px-8 py-3.5 rounded-[2rem] text-[11px] font-black uppercase tracking-widest transition-all duration-500 ${viewMode === 'room' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100 scale-105' : 'text-gray-400 hover:text-indigo-600'}`}
                    >
                        <MapPin size={14} className={viewMode === 'room' ? 'animate-pulse' : ''} />
                        Oda Görünümü
                    </button>
                </div>

                <div className="h-10 w-px bg-gray-100 mx-2" />

                <button 
                    onClick={onPanelToggle}
                    className="flex items-center gap-3 px-10 h-[60px] bg-indigo-600 hover:bg-indigo-700 text-white rounded-[2rem] shadow-2xl shadow-indigo-200 transition-all active:scale-95 group relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
                    <Search className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                    <span className="text-[11px] font-black uppercase tracking-[0.2em]">Müşteri Rehberi</span>
                </button>
            </div>
        </header>
    );
}
