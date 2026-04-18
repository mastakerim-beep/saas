'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare, ArrowRight, User } from 'lucide-react';

export default function SmartTriage({ onSelectService, services }: { onSelectService: any, services: any[] }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [isTyping, setIsTyping] = useState(false);

    const askAI = (answer: string) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setStep(prev => prev + 1);
        }, 1200);
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className="w-full mb-8 bg-gradient-to-r from-indigo-900 to-indigo-700 text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between group hover:shadow-indigo-500/20 transition-all border border-indigo-500"
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner group-hover:rotate-12 transition-all">
                        <Sparkles className="w-6 h-6 text-indigo-100" />
                    </div>
                    <div className="text-left">
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-0.5">Aura AI Asistan</p>
                        <p className="font-bold">Emin değil misin? Yapay zeka ile ihtiyacını bul.</p>
                    </div>
                </div>
                <ArrowRight className="w-5 h-5 text-indigo-200 group-hover:translate-x-1 transition-transform" />
            </button>
        );
    }

    return (
        <div className="w-full mb-8 bg-indigo-50 rounded-[2.5rem] p-6 border-2 border-indigo-100 animate-[fadeIn_0.3s_ease]">
            <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-600 rounded-xl"><Sparkles className="w-4 h-4 text-white" /></div>
                <h3 className="font-black text-indigo-900">Konsültasyon Asistanı</h3>
            </div>

            <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-200 flex-shrink-0" />
                    <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm font-semibold text-gray-700 max-w-[80%]">
                        Merhaba, hoş geldiniz! Hangi bölgenizde yorgunluk veya gerginlik hissediyorsunuz?
                    </div>
                </div>

                {step === 0 && (
                    <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={() => askAI('Bel ve Sırt')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700">Bel ve Sırt Bölgem</button>
                        <button onClick={() => askAI('Omuz ve Boyun')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700">Omuz ve Boyun</button>
                        <button onClick={() => askAI('Tüm Vücut')} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700">Genel Günün Yorgunluğu</button>
                    </div>
                )}

                {isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-200 flex-shrink-0" />
                        <div className="bg-white px-4 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}

                {step === 1 && !isTyping && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-200 flex-shrink-0" />
                        <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm font-semibold text-gray-700 w-full">
                            Sırt ve doku gerginlikleriniz için kan dolaşımınızı hızlandıracak orta sertlikte bir masaj harika olur. <strong className="text-indigo-600 block mt-2">✨ "Bali Masajı" veya "İsveç Masajı" öneriyorum.</strong>
                            <div className="mt-4 flex gap-2 flex-col">
                                {services.slice(0, 2).map((s: any) => (
                                    <button 
                                        key={s.name}
                                        onClick={() => onSelectService(s)}
                                        className="w-full flex items-center justify-between p-3 bg-indigo-50 hover:bg-indigo-100 rounded-xl text-left transition-colors border border-indigo-100"
                                    >
                                        <div>
                                            <p className="font-bold text-indigo-900 text-xs">{s.name}</p>
                                            <p className="text-[10px] text-indigo-500 font-bold">{s.duration} Dk</p>
                                        </div>
                                        <ArrowRight className="w-4 h-4 text-indigo-600" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
