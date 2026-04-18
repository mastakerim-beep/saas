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
                    <div className="flex items-center bg-white border-2 border-gray-100/80 rounded-[2rem] shadow-sm overflow-hidden p-1.5 transition-all hover:shadow-md hover:border-gray-200">
                        <button 
                            onClick={onPrevDay} 
                            className="p-3 hover:bg-gray-50 rounded-full transition-all text-gray-400 hover:text-indigo-600 active:scale-95 group"
                            title="Önceki Gün"
                        >
                            <ChevronLeft size={20} className="group-hover:-translate-x-0.5 transition-transform" />
                        </button>
                        
                        <button 
                            onClick={onDatePickerToggle}
                            className="flex items-center gap-3 px-6 py-2 hover:bg-indigo-50/50 rounded-2xl group transition-all mx-1"
                        >
                            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl group-hover:scale-110 group-hover:bg-indigo-100 transition-all">
                                <CalendarIcon className="w-4 h-4" />
                            </div>
                            <div className="flex flex-col items-start leading-none group-hover:text-indigo-900">
                                <span className="text-[10px] font-black tracking-[0.2em] uppercase text-gray-400 mb-1.5">
                                    {new Date(selectedDate).toLocaleDateString('tr-TR', { weekday: 'long' })}
                                </span>
                                <span className="text-base font-black tracking-tight text-gray-800">
                                    {new Date(selectedDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' })}
                                </span>
                            </div>
                        </button>

                        <button 
                            onClick={onNextDay} 
                            className="p-3 hover:bg-gray-50 rounded-full transition-all text-gray-400 hover:text-indigo-600 active:scale-95 group"
                            title="Sonraki Gün"
                        >
                            <ChevronRight size={20} className="group-hover:translate-x-0.5 transition-transform" />
                        </button>
                        
                        <div className="w-px h-8 bg-gray-100 mx-2" />
                        
                        <button 
                            onClick={onToday} 
                            className="px-6 py-2.5 bg-gray-50/80 hover:bg-indigo-600 hover:text-white rounded-[1.5rem] transition-all text-[11px] font-black uppercase text-gray-600 tracking-[0.15em] active:scale-95 shadow-sm"
                            title="Bugüne Dön"
                        >
                            Bugün
                        </button>
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
