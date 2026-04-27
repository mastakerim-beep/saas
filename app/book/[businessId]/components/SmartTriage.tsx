'use client';

import { useState } from 'react';
import { Sparkles, MessageSquare, ArrowRight, User, Crown } from 'lucide-react';

export default function SmartTriage({ 
    onSelectService, 
    services, 
    tributeScore = 50, 
    verticals = [] 
}: { 
    onSelectService: any, 
    services: any[], 
    tributeScore?: number,
    verticals?: string[]
}) {
    const [isOpen, setIsOpen] = useState(false);
    const [step, setStep] = useState(0);
    const [isTyping, setIsTyping] = useState(false);

    const isVip = tributeScore > 80;
    const isClinic = verticals.includes('clinic');
    const isFitness = verticals.includes('fitness');

    const askAI = (answer: string) => {
        setIsTyping(true);
        setTimeout(() => {
            setIsTyping(false);
            setStep(prev => prev + 1);
        }, 1200);
    };

    const getQuestions = () => {
        if (isClinic) return ['Genel Muayene', 'Fizik Tedavi', 'Estetik Danışmanlık'];
        if (isFitness) return ['Kilo Vermek', 'Kas Kazanımı', 'Esneklik/Mobilite'];
        return ['Bel ve Sırt', 'Omuz ve Boyun', 'Tüm Vücut'];
    };

    const getAiResponse = () => {
        if (isVip) return 'Majesteleri, sizin için özel olarak "İmparatorluk Bakımı" seansını önceliklendirdik. En kıdemli uzmanımız sizi bekliyor olacak.';
        
        if (isClinic) return 'Şikayetlerinizi anlıyorum. Uzman doktorumuzla bir ön görüşme ve detaylı analiz içeren seansı sizin için uygun buldum.';
        if (isFitness) return 'Hedefleriniz doğrultusunda, vücut analizini de kapsayan kişisel antrenman (PT) seansımız başlamanız için en doğrusu olacaktır.';
        
        return 'Gerginliğinizi anlıyorum. Dolaşımı rahatlatacak ve kas düğümlerini çözecek okyanus esintili bir terapi size çok iyi gelecektir.';
    };

    if (!isOpen) {
        return (
            <button 
                onClick={() => setIsOpen(true)}
                className={`w-full mb-8 ${isVip ? 'bg-gradient-to-r from-amber-900 to-amber-700 border-amber-500 shadow-[0_0_20px_rgba(245,158,11,0.2)]' : 'bg-gradient-to-r from-gray-900 to-black border-gray-800'} text-white p-6 rounded-[2.5rem] shadow-2xl flex items-center justify-between group transition-all border`}
            >
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-full flex items-center justify-center shadow-inner group-hover:rotate-12 transition-all">
                        {isVip ? <Crown className="w-6 h-6 text-amber-200" /> : <Sparkles className="w-6 h-6 text-indigo-400" />}
                    </div>
                    <div className="text-left">
                        <p className={`text-[10px] font-black uppercase tracking-widest ${isVip ? 'text-amber-300' : 'text-gray-500'} mb-0.5`}>Aura AI Asistan</p>
                        <p className="font-bold text-sm">{isVip ? 'Majesteleri, sizin için özel bir tavsiyemiz var.' : 'İhtiyacınızı birlikte belirleyelim.'}</p>
                    </div>
                </div>
                <ArrowRight className={`w-5 h-5 ${isVip ? 'text-amber-200' : 'text-gray-400'} group-hover:translate-x-1 transition-transform`} />
            </button>
        );
    }

    return (
        <div className={`w-full mb-8 ${isVip ? 'bg-amber-50 border-amber-200 shadow-amber-200/20' : 'bg-white border-gray-100 shadow-xl shadow-gray-200/50'} rounded-[2.5rem] p-7 border-2 animate-[fadeIn_0.3s_ease] relative overflow-hidden`}>
            {isVip && <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-200/30 rounded-full blur-3xl" />}
            
            <div className="flex items-center gap-3 mb-6 relative z-10">
                <div className={`p-2 ${isVip ? 'bg-amber-600' : 'bg-black'} rounded-xl`}>
                    {isVip ? <Crown className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-white" />}
                </div>
                <h3 className={`font-black ${isVip ? 'text-amber-900' : 'text-gray-900'} uppercase text-xs tracking-widest`}>{isVip ? 'VIP Konsültasyon' : 'Konsültasyon Asistanı'}</h3>
            </div>

            <div className="space-y-5 mb-6 relative z-10">
                <div className="flex gap-3">
                    <div className={`w-9 h-9 rounded-2xl ${isVip ? 'bg-amber-100' : 'bg-gray-100'} flex items-center justify-center flex-shrink-0`}>
                        <MessageSquare className={`w-5 h-5 ${isVip ? 'text-amber-600' : 'text-gray-400'}`} />
                    </div>
                    <div className={`${isVip ? 'bg-amber-100/50 text-amber-900' : 'bg-gray-50 text-gray-700'} p-5 rounded-3xl rounded-tl-sm text-xs font-bold leading-relaxed max-w-[85%]`}>
                        {isVip ? (
                            'Sizi tekrar görmek bir onur. Bugün sistemimizde size en uygun ve konforlu opsiyonu bulmamıza izin verin.'
                        ) : (
                            'Hoş geldiniz. Size en iyi deneyimi sunabilmemiz için bugün odaklanmamız gereken temel konuyu seçer misiniz?'
                        )}
                    </div>
                </div>

                {step === 0 && (
                    <div className="flex flex-col gap-2 pl-12">
                        {getQuestions().map((q, i) => (
                            <button 
                                key={i}
                                onClick={() => askAI(q)} 
                                className={`w-full text-left p-4 rounded-2xl text-[11px] font-black uppercase tracking-tight transition-all border ${isVip ? 'bg-amber-600 text-white border-amber-500 hover:bg-amber-700' : 'bg-white text-gray-900 border-gray-100 hover:border-gray-300 shadow-sm'}`}
                            >
                                {q}
                            </button>
                        ))}
                    </div>
                )}

                {isTyping && (
                    <div className="flex gap-3">
                        <div className={`w-9 h-9 rounded-2xl ${isVip ? 'bg-amber-100' : 'bg-gray-100'} flex-shrink-0 animate-pulse`} />
                        <div className="bg-gray-50 px-5 py-4 rounded-2xl rounded-tl-sm flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce"></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-100"></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 rounded-full animate-bounce delay-200"></span>
                        </div>
                    </div>
                )}

                {step === 1 && !isTyping && (
                    <div className="flex gap-3">
                        <div className={`w-9 h-9 rounded-2xl ${isVip ? 'bg-amber-200' : 'bg-black'} flex items-center justify-center flex-shrink-0`}>
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div className={`${isVip ? 'bg-amber-100/50' : 'bg-gray-50'} p-5 rounded-3xl rounded-tl-sm text-xs font-bold text-gray-800 w-full leading-relaxed`}>
                            <p className="mb-4 whitespace-pre-line">{getAiResponse()}</p>
                            
                            <div className="mt-4 flex gap-2 flex-col">
                                {services.slice(0, 3).map((s: any) => (
                                    <button 
                                        key={s.name}
                                        onClick={() => onSelectService(s)}
                                        className={`w-full flex items-center justify-between p-4 rounded-2xl text-left transition-all border ${isVip ? 'bg-white hover:bg-amber-50 border-amber-200' : 'bg-white hover:border-black border-gray-100 shadow-sm'}`}
                                    >
                                        <div>
                                            <p className={`font-black text-[11px] uppercase tracking-tight ${isVip ? 'text-amber-900' : 'text-gray-900'}`}>{s.name} {isVip && '✨'}</p>
                                            <p className="text-[9px] font-bold text-gray-400 uppercase mt-0.5">{s.duration} Dakika / ₺{s.price}</p>
                                        </div>
                                        <ArrowRight className={`w-4 h-4 ${isVip ? 'text-amber-600' : 'text-gray-400'}`} />
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
