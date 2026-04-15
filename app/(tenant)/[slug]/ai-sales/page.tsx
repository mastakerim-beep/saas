"use client";

import { useStore, Customer } from "@/lib/store";
import { Bot, Send, User, Star, Calendar, MessageSquare, Sparkles, Settings, Zap, ShieldCheck, CheckCircle2 } from "lucide-react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function AiSalesPage() {
  const { customers, appointments, settings, updateBusinessSettings, addLog } = useStore();
  const [selectedKitle, setSelectedKitle] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // 1. Identify "Lost" or "Inactive" VIP/Normal customers
  const now = new Date();
  const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

  const inactiveCustomers = customers.filter(c => {
      const lastAppt = appointments
        .filter(a => a.customerId === c.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      if (!lastAppt) return true;
      return new Date(lastAppt.date) < thirtyDaysAgo;
  });

  const handleModeToggle = () => {
    const newMode = settings.aiApprovalMode === 'manual' ? 'auto' : 'manual';
    updateBusinessSettings({ ...settings, aiApprovalMode: newMode });
    addLog('AI Pilot Mod Değiştirildi', 'Sistem', settings.aiApprovalMode, newMode);
  };

  const handleSend = () => {
    setIsSending(true);
    setTimeout(() => {
        setIsSending(false);
        addLog('Toplu WhatsApp Kampanyası', 'AI Pilot', 'Beklemede', `${inactiveCustomers.length} Mesaj Gönderildi`);
        alert('Kampanya başarıyla başlatıldı!');
    }, 2000);
  };

  return (
    <div className="p-6 md:p-10 max-w-[1400px] mx-auto animate-[fadeIn_0.5s_ease] space-y-10 font-sans">
      {/* Header with Mode Toggle */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-3">
             <div className="bg-primary/10 text-primary p-2 rounded-2xl">
                <Bot className="w-5 h-5" />
             </div>
             <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900 leading-tight">
                AI Sales <span className="text-gradient">Pilot</span>
             </h1>
          </div>
          <p className="text-gray-400 font-bold text-sm tracking-tight">
            Verilerinizi analiz edip uyuyan danışanları canlandıran akıllı satış motoru.
          </p>
        </div>

        <div className="flex items-center gap-4 bg-white/50 backdrop-blur-xl p-2 rounded-[2rem] border border-gray-100 shadow-sm">
            <div className="flex flex-col px-4">
                <span className="text-[10px] font-black uppercase text-gray-400">Pilot Modu</span>
                <span className="text-xs font-bold text-gray-900">{settings.aiApprovalMode === 'auto' ? 'Tam Otomatik' : 'Yarı Otomatik (Onaylı)'}</span>
            </div>
            <button 
                onClick={handleModeToggle}
                className={`flex items-center gap-3 px-6 py-3 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${
                    settings.aiApprovalMode === 'auto' 
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                    : 'bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                }`}
            >
                {settings.aiApprovalMode === 'auto' ? <Zap className="w-4 h-4" /> : <ShieldCheck className="w-4 h-4" />}
                {settings.aiApprovalMode === 'auto' ? 'Otopilot Açık' : 'Onay Bekle'}
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Left: Audience Analysis */}
        <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="card-apple bg-white/40 backdrop-blur-xl border-white/60 p-8 flex flex-col h-[650px]"
        >
          <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="font-black text-xl text-gray-900 tracking-tight">Kitle Zekası</h3>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Geri Kazanılması Gereken {inactiveCustomers.length} Danışan</p>
              </div>
              <div className="px-4 py-1 bg-red-50 text-red-600 rounded-xl text-[10px] font-black uppercase tracking-tighter shadow-sm border border-red-100">
                Risk Altında
              </div>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto no-scrollbar pr-2 mb-8">
            {inactiveCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full opacity-20">
                    <CheckCircle2 className="w-16 h-16 mb-4 text-emerald-500" />
                    <p className="font-black uppercase tracking-widest text-xs">Tüm danışanlar aktif!</p>
                </div>
            ) : (
                inactiveCustomers.map((c) => {
                    const lastAppt = appointments.filter(a => a.customerId === c.id).sort((a,b)=>new Date(b.date).getTime()-new Date(a.date).getTime())[0];
                    return (
                        <div key={c.id} className="p-5 bg-white border border-gray-50 rounded-3xl flex justify-between items-center group hover:scale-[1.02] transition-all cursor-pointer shadow-sm">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${c.segment === 'VIP' ? 'bg-amber-400 text-white' : 'bg-indigo-50 text-indigo-400'}`}>
                                    {c.name.charAt(0)}
                                </div>
                                <div>
                                    <p className="font-black text-sm text-gray-900">{c.name}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase flex items-center gap-1 mt-1">
                                        <Calendar className="w-2.5 h-2.5" /> {lastAppt?.date || 'Son işlem yok'}
                                    </p>
                                </div>
                            </div>
                            <div className={`px-3 py-1 rounded-xl text-[9px] font-black uppercase ${c.segment === 'VIP' ? 'bg-amber-50 text-amber-600' : 'bg-gray-100 text-gray-500'}`}>
                                {c.segment}
                            </div>
                        </div>
                    );
                })
            )}
          </div>
          
          <button 
            onClick={() => setSelectedKitle(true)}
            className={`w-full py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest transition-all shadow-xl
                ${selectedKitle ? 'bg-emerald-500 text-white scale-105' : 'bg-gray-900 text-white hover:scale-[1.02] shadow-gray-200'}
            `}
          >
            {selectedKitle ? 'Kampanya Kurgusu Hazır ✓' : 'Satış Hikayesi Oluştur'}
          </button>
        </motion.div>

        {/* Right: AI Creative */}
        <div className="flex flex-col gap-8">
            <motion.div 
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`flex-1 rounded-[3rem] border-8 border-white shadow-2xl flex flex-col overflow-hidden transition-all duration-700 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')] bg-repeat bg-opacity-5 ${selectedKitle ? 'opacity-100' : 'opacity-40 grayscale pointer-events-none scale-95'}`}
            >
                {/* WhatsApp Header */}
                <div className="bg-[#075e54] p-6 flex justify-between items-center text-white">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center border border-white/10 backdrop-blur-md">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h4 className="font-black text-sm">Aura Imperial AI</h4>
                            <div className="flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                                <p className="text-[10px] font-black opacity-80 uppercase tracking-widest">Kampanya Yayında</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-2 bg-white/10 rounded-xl"><Sparkles className="w-4 h-4" /></div>
                </div>

                {/* Chat Area */}
                <div className="p-8 flex-1 flex flex-col justify-end space-y-6">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.9, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="bg-white p-6 rounded-[2rem] rounded-tl-none shadow-xl max-w-[90%] self-start relative border-b-4 border-gray-100"
                    >
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles className="w-3 h-3 text-indigo-600" />
                            <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Kişiselleştirilmiş Senaryo</span>
                        </div>
                        <p className="text-sm text-gray-800 leading-relaxed font-semibold">
                            Sayın <b>Gökhan Bey</b> 👋 <br/><br/>
                            Aura Spa'daki son <b>Gül Maskesi</b> bakımınızın üzerinden 42 gün geçmiş. Cildinizin o ışıltısını korumak için bugün size özel bir <b>'Imperial Refresh'</b> seansı ayırdık.<br/><br/>
                            Cumartesi gününe kadar geçerli <b>%25 VIP indiriminiz</b> tanımlandı. Hemen randevu butonuna tıklamanız yeterli! 💆‍♂️✨
                        </p>
                        <span className="text-[10px] text-gray-400 absolute bottom-4 right-6 font-bold uppercase">{new Date().toLocaleTimeString('tr-TR', {hour:'2-digit', minute:'2-digit'})}</span>
                    </motion.div>

                    {settings.aiApprovalMode === 'manual' ? (
                        <button 
                            onClick={handleSend}
                            disabled={isSending}
                            className={`w-full py-5 rounded-3xl font-black text-[11px] uppercase tracking-widest transition-all shadow-[0_20px_40px_rgba(37,211,102,0.3)] flex items-center justify-center gap-3
                                ${isSending ? 'bg-gray-200 text-gray-400' : 'bg-[#25D366] text-white hover:scale-105 active:scale-95'}
                            `}
                        >
                            {isSending ? <Zap className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                            {isSending ? 'İşleniyor...' : `${inactiveCustomers.length} Kişiye WhatsApp Gönder`}
                        </button>
                    ) : (
                        <div className="w-full bg-indigo-50 border border-indigo-100 p-6 rounded-[2rem] flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-2xl flex items-center justify-center mb-4">
                                <Zap className="w-6 h-6 animate-pulse" />
                            </div>
                            <h4 className="font-black text-sm text-indigo-900 uppercase tracking-tight mb-2">Otopilot Devrede</h4>
                            <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest leading-relaxed">Yeni danışanlar için senaryolar otomatik oluşturulup onayınız gerekmeden gönderilecek.</p>
                        </div>
                    )}
                </div>
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-apple bg-white/40 backdrop-blur-xl border-white/60 p-6 flex items-center gap-5 shadow-lg"
            >
                <div className="bg-emerald-50 p-4 rounded-2xl">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                </div>
                <div>
                    <h4 className="font-black text-sm text-gray-900 tracking-tight">AI Dönüşüm Projeksiyonu</h4>
                    <p className="text-[10px] text-gray-400 font-bold mt-1 uppercase tracking-widest">Beklenen Ciro Geri Dönüşü: <span className="text-emerald-600">₺{ (inactiveCustomers.length * 1500).toLocaleString('tr-TR') } - ₺{ (inactiveCustomers.length * 2800).toLocaleString('tr-TR') }</span></p>
                </div>
            </motion.div>
        </div>
      </div>
    </div>
  )
}
