"use client";

import { useState } from 'react';
import { Sparkles, Info, X, ShieldAlert, RotateCw } from 'lucide-react';

interface BodyRegion {
    id: string;
    name: string;
    path: string;
    view: 'front' | 'back';
}

const REGIONS: BodyRegion[] = [
    // Front View
    { id: 'head_f', name: 'Baş (Ön)', path: 'M 100 20 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0', view: 'front' },
    { id: 'chest', name: 'Göğüs', path: 'M 95 60 L 135 60 L 130 100 L 100 100 Z', view: 'front' },
    { id: 'abs', name: 'Karın', path: 'M 100 105 L 130 105 L 125 145 L 105 145 Z', view: 'front' },
    { id: 'shoulder_l_f', name: 'Sol Omuz (Ön)', path: 'M 80 60 L 95 60 L 95 75 Z', view: 'front' },
    { id: 'shoulder_r_f', name: 'Sağ Omuz (Ön)', path: 'M 135 60 L 150 60 L 135 75 Z', view: 'front' },
    { id: 'arm_l_f', name: 'Sol Kol (Ön)', path: 'M 75 70 L 90 70 L 85 130 L 70 130 Z', view: 'front' },
    { id: 'arm_r_f', name: 'Sağ Kol (Ön)', path: 'M 140 70 L 155 70 L 160 130 L 145 130 Z', view: 'front' },
    { id: 'leg_l_f', name: 'Sol Bacak (Ön)', path: 'M 100 150 L 114 150 L 110 240 L 95 240 Z', view: 'front' },
    { id: 'leg_r_f', name: 'Sağ Bacak (Ön)', path: 'M 116 150 L 130 150 L 135 240 L 120 240 Z', view: 'front' },
    
    // Back View
    { id: 'head_b', name: 'Baş (Arka)', path: 'M 100 20 a 15 15 0 1 0 30 0 a 15 15 0 1 0 -30 0', view: 'back' },
    { id: 'upper_back', name: 'Üst Sırt', path: 'M 95 60 L 135 60 L 133 90 L 97 90 Z', view: 'back' },
    { id: 'lower_back', name: 'Alt Sırt', path: 'M 97 95 L 133 95 L 128 135 L 102 135 Z', view: 'back' },
    { id: 'glutes', name: 'Kalça', path: 'M 98 140 L 132 140 L 140 170 L 90 170 Z', view: 'back' },
    { id: 'shoulder_l_b', name: 'Sol Omuz (Arka)', path: 'M 80 60 L 95 60 L 95 75 Z', view: 'back' },
    { id: 'shoulder_r_b', name: 'Sağ Omuz (Arka)', path: 'M 135 60 L 150 60 L 135 75 Z', view: 'back' },
    { id: 'arm_l_b', name: 'Sol Kol (Arka)', path: 'M 75 70 L 90 70 L 85 130 L 70 130 Z', view: 'back' },
    { id: 'arm_r_b', name: 'Sağ Kol (Arka)', path: 'M 140 70 L 155 70 L 160 130 L 145 130 Z', view: 'back' },
    { id: 'leg_l_b', name: 'Sol Bacak (Arka)', path: 'M 100 150 L 114 150 L 110 240 L 95 240 Z', view: 'back' },
    { id: 'leg_r_b', name: 'Sağ Bacak (Arka)', path: 'M 116 150 L 130 150 L 135 240 L 120 240 Z', view: 'back' },
];

interface BodyMapProps {
    selectedRegions: string[];
    onToggleRegion: (id: string) => void;
    readonly?: boolean;
}

export default function BodyMap({ selectedRegions, onToggleRegion, readonly }: BodyMapProps) {
    const [hovered, setHovered] = useState<string | null>(null);
    const [view, setView] = useState<'front' | 'back'>('front');

    const currentRegions = REGIONS.filter(r => r.view === view);

    return (
        <div className="flex flex-col items-center gap-6 p-8 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity pointer-events-none">
                <Sparkles size={120} className="text-indigo-600" />
            </div>

            <div className="flex items-center justify-between w-full mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                        <Info className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-black text-gray-900 leading-none italic uppercase tracking-tighter">İnteraktif Konsültasyon</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Vücut Odak Haritası</p>
                    </div>
                </div>

                <button 
                  onClick={() => setView(v => v === 'front' ? 'back' : 'front')}
                  className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-lg shadow-indigo-600/20"
                >
                  <RotateCw className="w-3 h-3" /> {view === 'front' ? 'Arka Görünüm' : 'Ön Görünüm'}
                </button>
            </div>

            <div className="relative w-64 h-[320px] bg-gray-50/50 rounded-[2rem] p-4 border border-gray-100/50 flex items-center justify-center">
                <svg viewBox="50 0 130 260" className="w-full h-full drop-shadow-2xl transition-all duration-500">
                    {/* Background Human Outline */}
                    <path 
                        d="M 115 5 a 18 18 0 1 0 0.1 0 Z M 95 55 L 135 55 L 145 140 L 125 145 L 135 250 L 115 250 L 115 150 L 115 250 L 95 250 L 105 145 L 85 140 Z" 
                        fill="white" 
                        stroke="#e5e7eb" 
                        strokeWidth="1.5"
                    />
                    
                    {currentRegions.map(region => (
                        <path
                            key={region.id}
                            d={region.path}
                            className={`cursor-pointer transition-all duration-300 ${
                                selectedRegions.includes(region.id) 
                                    ? 'fill-indigo-600 stroke-indigo-400 stroke-1 translate-y-[-1px] drop-shadow-lg scale-[1.02] origin-center' 
                                    : (hovered === region.id ? 'fill-indigo-100 stroke-indigo-200' : 'fill-gray-100/30 stroke-gray-200')
                            }`}
                            onMouseEnter={() => !readonly && setHovered(region.id)}
                            onMouseLeave={() => setHovered(null)}
                            onClick={() => !readonly && onToggleRegion(region.id)}
                        />
                    ))}
                </svg>
                
                <div className="absolute top-4 left-4">
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-300 italic">{view === 'front' ? 'ÖN' : 'ARKA'}</span>
                </div>

                {hovered && (
                    <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest animate-in fade-in slide-in-from-bottom-2 z-20">
                        {REGIONS.find(r => r.id === hovered)?.name}
                    </div>
                )}
            </div>

            <div className="grid grid-cols-2 gap-3 w-full max-w-sm mt-4">
                {REGIONS.filter(r => selectedRegions.includes(r.id)).map(r => (
                    <div 
                        key={r.id}
                        className="text-[10px] font-black px-4 py-2.5 rounded-xl border bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20 flex items-center justify-between group/item animate-in zoom-in-95"
                        onClick={() => !readonly && onToggleRegion(r.id)}
                    >
                        <span>{r.name}</span>
                        {!readonly && <X className="w-3 h-3 text-white/50 group-hover/item:text-white transition-colors" />}
                    </div>
                ))}
            </div>

            {selectedRegions.length > 0 && !readonly && (
                <div className="mt-4 p-4 bg-orange-50 rounded-2xl border border-orange-100 flex gap-3 animate-in fade-in slide-in-from-top-2">
                    <ShieldAlert className="w-5 h-5 text-orange-600 flex-shrink-0" />
                    <p className="text-[10px] font-black text-orange-700 leading-tight italic uppercase tracking-tighter">
                        Kritik Uyarı: Seçilen bölgeler terapist tabletinde "Odak Noktası" olarak kurgulanacaktır.
                    </p>
                </div>
            )}
        </div>
    );
}
