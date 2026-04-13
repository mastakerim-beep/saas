"use client";

import { useStore, AiInsight, NotificationLog } from '@/lib/store';
import { 
    Zap, Sparkles, MessageSquare, 
    Send, Calendar, Users, 
    TrendingUp, ShieldCheck, 
    Smartphone, Mail, CheckCircle2,
    RefreshCcw, ArrowRight
} from 'lucide-react';
import { useState } from 'react';

export default function MarketingPage() {
    const { aiInsights, customers, allNotifs, sendNotification } = useStore();
    const [isSending, setIsSending] = useState(false);

    const churnCount = customers.filter(c => c.isChurnRisk).length;

    const handleStartCampaign = (insight: AiInsight) => {
        setIsSending(true);
        setTimeout(() => {
            // Simulate sending to relevant customers
            customers.filter(c => insight.category === 'growth' ? c.isChurnRisk : true).slice(0, 5).forEach(c => {
                sendNotification(c.id, 'WHATSAPP', insight.desc);
            });
            setIsSending(false);
            alert(`${insight.title} kampanyası başarıyla başlatıldı ve kuyruğa alındı.`);
        }, 1500);
    };

    return (
        <div className="p-8 max-w-[1200px] mx-auto animate-[fadeIn_0.3s_ease] space-y-10">
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-2 text-gray-900">AI Pazarlama & İletişim</h1>
                    <p className="text-gray-500 text-sm font-semibold flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-500" /> Yapay zeka müşteri kitlenizi analiz edip otomatik kampanyalar önerir.
                    </p>
                </div>
                <div className="flex gap-4">
                    <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100">
                        <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Bot Durumu</p>
                        <p className="text-lg font-black text-emerald-900 flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Aktif & Dinleme Modunda
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* AI Recommendations Column */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                            <Zap className="w-6 h-6 text-indigo-600" /> AI Destekli Kampanya Önerileri
                        </h2>
                        <div className="flex gap-2">
                             <button className="px-5 py-2.5 bg-white border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:border-indigo-200 transition">Şablonları Yönet</button>
                             <button className="px-5 py-2.5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition">Yeni Manuel Kampanya</button>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {aiInsights.map(insight => (
                            <div key={insight.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group hover:border-indigo-200 transition-all">
                                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                                    <Sparkles className="w-20 h-20 text-indigo-600" />
                                </div>
                                <div className="flex items-center gap-3 mb-6">
                                    <div className={`p-2 rounded-xl ${insight.impact === 'high' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-indigo-50 text-indigo-600'}`}>
                                        <MessageSquare className="w-5 h-5" />
                                    </div>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{insight.category} STRATEJİSİ</span>
                                </div>
                                <h3 className="text-lg font-black text-gray-900 mb-2">{insight.title}</h3>
                                <p className="text-xs font-semibold text-gray-500 leading-relaxed mb-8">{insight.desc}</p>
                                
                                <button 
                                    onClick={() => handleStartCampaign(insight)}
                                    disabled={isSending}
                                    className="w-full bg-black text-white py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
                                >
                                    {isSending ? <RefreshCcw className="w-4 h-4 animate-spin" /> : <><Send className="w-4 h-4" /> KAMPANYAYI BAŞLAT</>}
                                </button>
                            </div>
                        ))}
                    </div>

                    {/* Marketing Stats */}
                    <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden group">
                         <div className="relative z-10 grid grid-cols-3 gap-8">
                            <div className="text-center">
                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Müşteri Sadakati</p>
                                <div className="text-3xl font-black mb-1">%85</div>
                                <p className="text-[10px] text-indigo-200 font-bold uppercase">Sektör Ortalaması: %60</p>
                            </div>
                            <div className="text-center border-x border-white/10 px-4">
                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Geri Dönüş Oranı</p>
                                <div className="text-3xl font-black mb-1">%14</div>
                                <p className="text-[10px] text-indigo-200 font-bold uppercase">AI Kampanyaları ile</p>
                            </div>
                            <div className="text-center">
                                <p className="text-[10px] font-black text-indigo-200 uppercase tracking-widest mb-4">Kayıp Riski</p>
                                <div className="text-3xl font-black mb-1">{churnCount}</div>
                                <p className="text-[10px] text-red-300 font-black uppercase tracking-tighter">Acil Aksiyon Gerekli</p>
                            </div>
                         </div>
                         <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-white/10 to-transparent pointer-events-none group-hover:scale-110 transition duration-700" />
                    </div>

                    {/* WhatsApp Bot Simulation */}
                    <div className="bg-emerald-50 border border-emerald-100 rounded-[2.5rem] p-10 overflow-hidden relative">
                        <div className="flex flex-col lg:flex-row items-center gap-10 relative z-10">
                            <div className="flex-1 space-y-6">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Smartphone className="w-4 h-4 text-emerald-600" />
                                        <h3 className="text-sm font-black text-emerald-900 uppercase tracking-widest">Akıllı WhatsApp Botu</h3>
                                    </div>
                                    <h2 className="text-3xl font-black text-emerald-950 tracking-tighter leading-tight">Otomatik Rezervasyon & İptal Yönetimi</h2>
                                    <p className="text-sm text-emerald-800/70 font-bold mt-4 leading-relaxed italic">
                                        Aura AI, gece yarısı bile gelen mesajları anlar, takvimdeki boşlukları kontrol eder ve randevuları onaylar. İşletme sahibi sadece raporları izler.
                                    </p>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-[10px] font-black text-emerald-700 shadow-sm border border-emerald-100">
                                        <CheckCircle2 className="w-3.5 h-3.5" /> %100 OTONOM
                                    </div>
                                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-xl text-[10px] font-black text-emerald-700 shadow-sm border border-emerald-100">
                                        <RefreshCcw className="w-3.5 h-3.5" /> 7/24 AKTİF
                                    </div>
                                </div>
                            </div>
                            
                            <div className="w-[300px] h-[450px] bg-white rounded-[3rem] shadow-2xl border-8 border-gray-900 overflow-hidden relative rotate-3 hover:rotate-0 transition-transform duration-500 scale-90 sm:scale-100">
                                <div className="bg-[#075e54] p-4 flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center font-black text-[10px] text-emerald-700">A</div>
                                    <div>
                                        <p className="text-[10px] font-black text-white leading-none">Aura Spa Bot</p>
                                        <p className="text-[8px] text-white/70 font-bold">çevrimiçi</p>
                                    </div>
                                </div>
                                <div className="p-4 bg-[url('https://i.pinimg.com/originals/85/6f/30/856f30a5fcf653fd30e16cdbd96a40a2.png')] bg-cover h-full space-y-4">
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none text-[10px] font-bold shadow-sm max-w-[80%] animate-[slideUp_0.3s_ease]">
                                        Merhaba! Ben Aura yapay zeka asistanı. Bali Masajı için yarın 14:00 uygun. Onaylıyor musunuz?
                                    </div>
                                    <div className="bg-[#dcf8c6] p-3 rounded-2xl rounded-tr-none text-[10px] font-bold shadow-sm self-end ml-auto max-w-[80%] animate-[slideUp_0.4s_ease]">
                                        Evet lütfen, onayla.
                                    </div>
                                    <div className="bg-white p-3 rounded-2xl rounded-tl-none text-[10px] font-bold shadow-sm max-w-[80%] animate-[slideUp_0.5s_ease]">
                                        Harika! Randevunuz oluşturuldu. Yarın saat 14:00'te sizi bekliyoruz. Görsel vücut notu oluşturmak ister misiniz? 📝
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column: Communication Log */}
                <div className="space-y-8">
                    <h2 className="text-xl font-black text-gray-900 flex items-center gap-3">
                        <Smartphone className="w-6 h-6 text-gray-400" /> İletişim Günlüğü
                    </h2>

                    <div className="bg-white border border-gray-100 rounded-[2.5rem] p-8 shadow-sm h-[600px] flex flex-col">
                        <div className="flex-1 overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                            {allNotifs.map(notif => (
                                <div key={notif.id} className="relative pl-6 border-l-2 border-gray-50 group hover:border-indigo-200 transition-colors">
                                    <div className="absolute -left-[9px] top-0 w-4 h-4 bg-white border-2 border-gray-100 rounded-full group-hover:border-indigo-600 transition-all shadow-sm" />
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[9px] font-black text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded uppercase tracking-tighter">{notif.type}</p>
                                        <span className="text-[9px] font-black text-gray-300">{notif.sentAt.split('T')[1].slice(0,5)}</span>
                                    </div>
                                    <p className="text-xs font-black text-gray-800 mb-1 leading-none">{customers.find(c => c.id === notif.customerId)?.name || 'Müşteri'}</p>
                                    <p className="text-[11px] text-gray-400 font-bold leading-relaxed italic line-clamp-2">“{notif.content}”</p>
                                    <div className="mt-3 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5 font-black text-emerald-500 text-[8px] uppercase tracking-widest">
                                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> İLETİLDİ
                                        </div>
                                        <p className="text-[8px] font-black text-gray-300 uppercase">AURA-BOT ID: B{notif.id.slice(0,4).toUpperCase()}</p>
                                    </div>
                                </div>
                            ))}
                            {allNotifs.length === 0 && (
                                <div className="text-center py-20 flex flex-col items-center">
                                    <div className="p-5 bg-gray-50 rounded-3xl mb-4">
                                        <Smartphone className="w-10 h-10 text-gray-200" />
                                    </div>
                                    <p className="text-gray-400 font-black uppercase tracking-widest text-[10px]">Henüz bir bildirim yok.</p>
                                </div>
                            )}
                        </div>
                        <button className="w-full mt-6 py-5 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-gray-900 transition-all flex items-center justify-center gap-3 shadow-xl">
                            İletişim API Ayarları <ArrowRight className="w-3 h-3 text-indigo-400" />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
