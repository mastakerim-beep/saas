'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare, ArrowRight, User, Crown } from 'lucide-react';

export default function SmartTriage({ onSelectService, services, tributeScore = 50 }: { onSelectService: any, services: any[], tributeScore?: number }) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [isTyping, setIsTyping] = useState(false);

    const isVip = tributeScore > 80;
    const isLowTribute = tributeScore < 30;

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
                className={`w-full mb-8 ${isVip ? 'bg-gradient-to-r from-amber-900 to-amber-700 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-gradient-to-r from-indigo-900 to-indigo-700 border-indigo-500'} text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between group transition-all border`}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner group-hover:rotate-12 transition-all">
                        {isVip ? <Crown className="w-6 h-6 text-amber-200" /> : <Sparkles className="w-6 h-6 text-indigo-100" />}
                    </div>
                    <div className="text-left">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isVip ? 'text-amber-300' : 'text-indigo-200'} mb-0.5`}>Aura AI Asistan</p>
                        <p className="font-bold">{isVip ? 'Majesteleri, sizin için özel bir tavsiyemiz var.' : 'Emin değil misin? Yapay zeka ile ihtiyacını bul.'}</p>
                    </div>
                </div>
                <ArrowRight className={`w-5 h-5 ${isVip ? 'text-amber-200' : 'text-indigo-200'} group-hover:translate-x-1 transition-transform`} />
            </button>
        );
    }

    return (
        <div className={`w-full mb-8 ${isVip ? 'bg-amber-50 border-amber-200' : 'bg-indigo-50 border-indigo-100'} rounded-[2.5rem] p-6 border-2 animate-[fadeIn_0.3s_ease]`}>
            <div className="flex items-center gap-3 mb-6">
                <div className={`p-2 ${isVip ? 'bg-amber-600' : 'bg-indigo-600'} rounded-xl`}>
                    {isVip ? <Crown className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                </div>
                <h3 className={`font-black ${isVip ? 'text-amber-900' : 'text-indigo-900'}`}>{isVip ? 'VIP Konsültasyon' : 'Konsültasyon Asistanı'}</h3>
            </div>

            <div className="space-y-4 mb-6">
                <div className="flex gap-3">
                    <div className={`w-8 h-8 rounded-full ${isVip ? 'bg-amber-200' : 'bg-indigo-200'} flex-shrink-0`} />
                    <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm font-semibold text-gray-700 max-w-[80%]">
                        {isVip ? 'Sizi tekrar görmek ne güzel! Bugün hangi bölgenizde bir rahatlamaya ihtiyacınız var?' : 'Merhaba, hoş geldiniz! Hangi bölgenizde yorgunluk veya gerginlik hissediyorsunuz?'}
                    </div>
                </div>

                {step === 0 && (
                    <div className="flex flex-wrap gap-2 justify-end">
                        <button onClick={() => askAI('Bel ve Sırt')} className={`${isVip ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded-xl text-xs font-bold`}>Bel ve Sırt Bölgem</button>
                        <button onClick={() => askAI('Omuz ve Boyun')} className={`${isVip ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded-xl text-xs font-bold`}>Omuz ve Boyun</button>
                        <button onClick={() => askAI('Tüm Vücut')} className={`${isVip ? 'bg-amber-600 hover:bg-amber-700' : 'bg-indigo-600 hover:bg-indigo-700'} text-white px-4 py-2 rounded-xl text-xs font-bold`}>Genel Günün Yorgunluğu</button>
                    </div>
                )}

                {isTyping && (
                    <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full ${isVip ? 'bg-amber-200' : 'bg-indigo-200'} flex-shrink-0`} />
                        <div className="bg-white px-4 py-4 rounded-2xl rounded-tl-sm shadow-sm flex items-center gap-1">
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                            <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></span>
                        </div>
                    </div>
                )}

                {step === 1 && !isTyping && (
                    <div className="flex gap-3">
                        <div className={`w-8 h-8 rounded-full ${isVip ? 'bg-amber-200' : 'bg-indigo-200'} flex-shrink-0`} />
                        <div className="bg-white p-4 rounded-2xl rounded-tl-sm shadow-sm text-sm font-semibold text-gray-700 w-full">
                            {isVip ? (
                                <span>Size özel olarak öncelikli randevu açıyoruz. Bu rahatsızlığınız için <strong className="text-amber-600 block mt-2">✨ En iyi terapistlerimiz eşliğinde Signature Masajı öneriyorum. İstediğiniz saati seçebilirsiniz.</strong></span>
                            ) : isLowTribute ? (
                                <span>Rahatlamanız için standart listemizi hazırladım. <strong className="text-indigo-600 block mt-2">✨ Lütfen sistemdeki uygun/boş saatleri takip ederek rezervasyon yapın.</strong></span>
                            ) : (
                                <span>Sırt ve doku gerginlikleriniz için kan dolaşımınızı hızlandıracak orta sertlikte bir masaj harika olur. <strong className="text-indigo-600 block mt-2">✨ "Bali Masajı" veya "İsveç Masajı" öneriyorum.</strong></span>
                            )}
                            
                            <div className="mt-4 flex gap-2 flex-col">
                                {services.slice(0, 2).map((s: any) => (
                                    <button 
                                        key={s.name}
                                        onClick={() => onSelectService(s)}
                                        className={`w-full flex items-center justify-between p-3 rounded-xl text-left transition-colors border ${isVip ? 'bg-amber-50 hover:bg-amber-100 border-amber-100' : 'bg-indigo-50 hover:bg-indigo-100 border-indigo-100'}`}
                                    >
                                        <div>
                                            <p className={`font-bold text-xs ${isVip ? 'text-amber-900' : 'text-indigo-900'}`}>{s.name} {isVip && <span className="ml-1 text-[10px] bg-amber-500 text-white px-1.5 py-0.5 rounded-full inline-block">VIP</span>}</p>
                                            <p className={`text-[10px] font-bold ${isVip ? 'text-amber-500' : 'text-indigo-500'}`}>{s.duration} Dk</p>
                                        </div>
                                        <ArrowRight className={`w-4 h-4 ${isVip ? 'text-amber-600' : 'text-indigo-600'}`} />
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
