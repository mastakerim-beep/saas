"use client";

import { useState } from 'react';
import { Sparkles, Info, Save, X, Undo, ShieldAlert } from 'lucide-react';

interface BodyRegion {
    id: string;
    name: string;
    path: string;
}

const REGIONS: BodyRegion[] = [
    // Front View
    { id: 'head', name: 'Baş/Boyun', path: 'M 100 20 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0' },
    { id: 'chest', name: 'Göğüs', path: 'M 95 60 L 135 60 L 130 100 L 100 100 Z' },
    { id: 'abs', name: 'Karın', path: 'M 100 105 L 130 105 L 125 145 L 105 145 Z' },
    { id: 'shoulder_l', name: 'Sol Omuz', path: 'M 80 60 L 95 60 L 95 75 Z' },
    { id: 'shoulder_r', name: 'Sağ Omuz', path: 'M 135 60 L 150 60 L 135 75 Z' },
    { id: 'arm_l', name: 'Sol Kol', path: 'M 75 70 L 90 70 L 85 130 L 70 130 Z' },
    { id: 'arm_r', name: 'Sağ Kol', path: 'M 140 70 L 155 70 L 160 130 L 145 130 Z' },
    { id: 'leg_l', name: 'Sol Bacak', path: 'M 100 150 L 114 150 L 110 240 L 95 240 Z' },
    { id: 'leg_r', name: 'Sağ Bacak', path: 'M 116 150 L 130 150 L 135 240 L 120 240 Z' },
];

interface BodyMapProps {
    selectedRegions: string[];
    onToggleRegion: (id: string) => void;
    readonly?: boolean;
}

export default function BodyMap({ selectedRegions, onToggleRegion, readonly }: BodyMapProps) {
    const [hovered, setHovered] = useState<string | null>(null);

    return (
        <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Sparkles size={120} className="text-primary" />
            </div>

            <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                    <Info className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-black text-gray-900 leading-none">Vücut Haritası</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Terapist Odak Noktaları</p>
                </div>
            </div>

            <div className="relative w-64 h-[320px] bg-gray-50/50 rounded-[2rem] p-4 border border-gray-100/50">
                <svg viewBox="50 0 130 260" className="w-full h-full drop-shadow-2xl">
                    {/* Simplified Human Outlines */}
                    <path 
                        d="M 115 5 a 18 18 0 1 0 0.1 0 Z M 95 55 L 135 55 L 145 140 L 125 145 L 135 250 L 115 250 L 115 150 L 115 250 L 95 250 L 105 145 L 85 140 Z" 
                        fill="white" 
                        stroke="#e5e7eb" 
                        strokeWidth="2"
                    />
                    
                    {REGIONS.map(region => (
                        <path
                            key={region.id}
                            d={region.path}
                            className={`cursor-pointer transition-all duration-300 ${
                                selectedRegions.includes(region.id) 
                                    ? 'fill-primary stroke-primary/50 stroke-2 translate-y-[-2px] drop-shadow-lg' 
                                    : (hovered === region.id ? 'fill-primary/20 stroke-primary/30' : 'fill-gray-100/50 stroke-gray-200')
                            }`}
                            onMouseEnter={() => !readonly && setHovered(region.id)}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => !readonly && onToggleRegion(region.id)}
                        />
                    ))}
                </svg>
                
                {hovered && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2">
                        {REGIONS.find(r => r.id === hovered)?.name}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
                {REGIONS.map(r => (
                    <div 
                        key={r.id}
                        className={`text-[10px] font-black px-4 py-2.5 rounded-xl border transition-all flex items-center justify-between group/item ${
                            selectedRegions.includes(r.id) 
                                ? 'bg-primary border-primary text-white shadow-lg shadow-primary/20' 
                                : 'bg-gray-50 border-transparent text-gray-500 hover:border-primary/20'
                        }`}
                        onClick={() => !readonly && onToggleRegion(r.id)}
                    >
                        <span>{r.name}</span>
                        {selectedRegions.includes(r.id) && <X className="w-3 h-3 text-white/50 group-hover/item:text-white transition-colors" />}
                    </div>
                ))}
            </div>

            {selectedRegions.length > 0 && !readonly && (
                <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex gap-3 animate-in zoom-in-95">
                    <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0" />
                    <p className="text-[10px] font-bold text-amber-700 leading-tight italic">
                        Seçilen bölgeler bu randevu için "Kritik Odak Noktası" olarak terapiste bildirilecektir.
                    </p>
                </div>
            )}
        </div>
    );
}
