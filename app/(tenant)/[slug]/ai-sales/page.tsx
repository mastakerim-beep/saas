"use client";

import { useStore, Customer } from "@/lib/store";
import { Bot, Send, User, Star, Calendar, MessageSquare, Sparkles } from "lucide-react";
import { useState } from "react";

export default function AiSalesPage() {
  const { customers, appointments } = useStore();
  const [selectedKitle, setSelectedKitle] = useState(false);

  // 1. Identify "Lost" or "Inactive" VIP/Normal customers
  // Heuristic: No appointment in the last 30 days
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

  const inactiveCustomers = customers.filter(c => {
      const lastAppt = appointments
        .filter(a => a.customerId === c.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (!lastAppt) return true; // Never visited
      return new Date(lastAppt.date) < thirtyDaysAgo;
  });

  const vipInactives = inactiveCustomers.filter(c => c.segment === 'VIP');

  return (
    <div className="p-8 max-w-7xl mx-auto animate-[fadeIn_0.5s_ease] space-y-8">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black tracking-tight mb-2 flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-green-600" /> AI WhatsApp Asistanı
          </h1>
          <p className="text-gray-500 text-sm font-semibold">İnaktif danışanlarınızla yapay zeka destekli akıllı mesajlarla yeniden bağ kurun.</p>
        </div>
        <div className="text-right">
            <span className="bg-green-100 text-green-700 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-widest">WhatsApp API Bağlı ✓</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-[calc(100vh-16rem)]">
        {/* Left: Audience Analysis */}
        <div className="card-apple bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col overflow-hidden">
          <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-black text-xl text-gray-900">Hedef Kitle Analizi</h3>
                <p className="text-xs text-gray-400 font-bold mt-1">Son 30 gündür işlem yapmayan danışanlar</p>
              </div>
              <span className="bg-red-50 text-red-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase">{inactiveCustomers.length} POTANSİYEL KAYIP</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-2 mb-6">
            {inactiveCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-30">
                    <Star className="w-12 h-12 mb-4" />
                    <p className="font-bold">Tüm danışanlar aktif!</p>
                </div>
            ) : (
                inactiveCustomers.map((c) => {
                    const lastAppt = appointments.filter(a => a.customerId === c.id).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())[0];
                    return (
                        <div key={c.id} className="p-4 bg-gray-50/50 border border-gray-100 rounded-2xl flex justify-between items-center group hover:border-green-200 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black ${c.segment === 'VIP' ? 'bg-yellow-400 text-white' : 'bg-gray-200 text-gray-500'}`}>
                                    {c.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-bold text-sm text-gray-900">{c.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1">
                                        <Calendar className="w-2.5 h-2.5" /> Son Ziyaret: {lastAppt?.date || 'Kayıt Yok'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${c.segment === 'VIP' ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                                    {c.segment}
                                </span>
                            </div>
                        </div>
                    );
                })
            )}
          </div>
          
          <button 
            onClick={() => setSelectedKitle(true)}
            className={`w-full py-4 rounded-[1.5rem] font-black text-sm transition-all shadow-sm flex items-center justify-center gap-2
                ${selectedKitle ? 'bg-green-600 text-white' : 'bg-black text-white hover:scale-[1.02]'}
            `}
          >
            {selectedKitle ? 'Kitle Seçildi ✓' : 'Bu Kitlenin Satış Kurgusunu Hazırla'}
          </button>
        </div>

        {/* Right: AI Creative */}
        <div className="flex flex-col gap-6">
            <div className={`card-apple bg-[#efeae2] flex-1 rounded-[2.5rem] border-4 border-white shadow-2xl flex flex-col overflow-hidden transition-all duration-700 ${selectedKitle ? 'opacity-100 translate-y-0' : 'opacity-40 translate-y-4 pointer-events-none'}`}>
                {/* WhatsApp Header */}
                <div className="bg-[#075e54] p-5 flex items-center gap-4 text-white">
                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center border border-white/10">
                        <Bot className="w-6 h-6" />
                    </div>
                    <div>
                        <h4 className="font-black text-sm">Aura Spa AI Asistanı</h4>
                        <div className="flex items-center gap-1">
                            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                            <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">Kampanya Oluşturuyor...</p>
                        </div>
                    </div>
                </div>

                {/* Chat Area */}
                <div className="p-8 flex-1 flex flex-col justify-end space-y-4 bg-opacity-20 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat">
                    <div className="bg-white p-5 rounded-3xl rounded-tl-none shadow-sm max-w-[90%] self-start relative border-b-2 border-gray-100">
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-3 h-3 text-indigo-500" />
                            <span className="text-[10px] font-black text-indigo-500 uppercase">Yapay Zeka Metni</span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed font-medium">
                            Sayın <b>Danışanımız</b> 👋 <br/><br/>
                            Sizi özledik! Size özel tasarladığımız <b>Yenilenme Haftasın'da</b> bu Cumartesi'ye kadar alacağınız tüm hizmetlerde %15 sürpriz indirim tanımladık.<br/><br/>
                            Yeriniz şimdiden hazır. Hemen randevu almak için bu mesaja tıklayın! 💆‍♀️✨
                        </p>
                        <span className="text-[10px] text-gray-400 absolute bottom-2 right-4 font-bold">{new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                    </div>

                    <button className="w-full bg-[#25D366] text-white py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-[#20bd5c] transition-colors flex items-center justify-center gap-3">
                        <Send className="w-5 h-5" /> {inactiveCustomers.length} Kişiye WhatsApp Gönder
                    </button>
                </div>
            </div>

            <div className="card-apple bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-4">
                <div className="bg-emerald-50 p-4 rounded-2xl">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h4 className="font-black text-sm text-gray-900">Dönüşüm Tahmini</h4>
                    <p className="text-xs text-gray-400 font-bold mt-1">Bu kampanya ile beklenen ciro geri dönüşü: <span className="text-emerald-600">₺12.500 - ₺18.000</span></p>
                </div>
            </div>
        </div>
      </div>
    </div>
  )
}
