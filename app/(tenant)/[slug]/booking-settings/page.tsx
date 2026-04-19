"use client";

import { useStore, BookingSettings } from '@/lib/store';
import { 
    Settings2, Globe, CreditCard, 
    CheckCircle2, AlertCircle, Share2, 
    Copy, ExternalLink, Sparkles, Zap, 
    Palette, MessageSquare, ShieldCheck
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';

export default function BookingSettingsPage() {
    const { slug } = useParams();
    const { currentBusiness, bookingSettings, fetchData, updateBookingSettings } = useStore();
    const [settings, setSettings] = useState<Partial<BookingSettings>>({
        isEnabled: true,
        requireDeposit: false,
        depositPercentage: 20,
        bookingMessage: 'Bizi tercih ettiğiniz için teşekkürler.',
        allowStaffSelect: true,
        accentColor: '#4F46E5'
    });

    const [isSaving, setIsSaving] = useState(false);
    const [showCopied, setShowCopied] = useState(false);

    useEffect(() => {
        if (bookingSettings) {
            setSettings(bookingSettings);
        }
    }, [bookingSettings]);

    const handleSave = async () => {
        if (!settings) return;
        setIsSaving(true);
        try {
            await updateBookingSettings(settings);
            alert("Ayarlar başarıyla kaydedildi.");
        } catch (error) {
            console.error(error);
            alert("Kaydetme sırasında bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const bookingUrl = typeof window !== 'undefined' ? `${window.location.origin}/${slug}/book` : '';

    const copyToClipboard = () => {
        navigator.clipboard.writeText(bookingUrl);
        setShowCopied(true);
        setTimeout(() => setShowCopied(false), 2000);
    };

    return (
        <div className="p-6 md:p-10 max-w-[1200px] mx-auto space-y-10 pb-32 font-sans">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900 leading-tight">Randevu Portalı Ayarları</h1>
                    <p className="text-gray-400 font-bold text-sm mt-2 uppercase tracking-widest flex items-center gap-2">
                        <Globe className="w-4 h-4 text-indigo-500" /> Müşterilerinize Dijital Deneyim Sunun
                    </p>
                </motion.div>

                <div className="flex gap-3">
                    <button 
                        onClick={handleSave}
                        className={`px-8 py-4 rounded-2xl font-black text-sm flex items-center gap-3 transition shadow-xl ${isSaving ? 'bg-gray-100 text-gray-400' : 'bg-black text-white hover:bg-gray-800'}`}
                    >
                        {isSaving ? 'Kaydediliyor...' : <><CheckCircle2 size={18}/> Değişiklikleri Kaydet</>}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Status Card */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="lg:col-span-2 space-y-8"
                >
                    <div className="bg-white border border-gray-100 p-8 md:p-10 rounded-[3rem] shadow-sm space-y-8 relative overflow-hidden">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black ${settings.isEnabled ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-400'}`}>
                                    <Globe size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Portal Durumu</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Online randevu alımını kontrol edin</p>
                                </div>
                            </div>
                            <button 
                                onClick={() => setSettings({...settings, isEnabled: !settings.isEnabled})}
                                className={`w-16 h-8 rounded-full transition-all relative ${settings.isEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${settings.isEnabled ? 'left-9' : 'left-1'}`} />
                            </button>
                        </div>

                        {settings.isEnabled && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                                className="p-8 bg-indigo-50/50 rounded-[2rem] border border-indigo-100/50 space-y-4"
                            >
                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Paylaşılabilir Link</p>
                                <div className="flex items-center gap-3">
                                    <div className="flex-1 bg-white border border-indigo-100 p-4 rounded-2xl font-bold text-sm text-indigo-600 truncate">
                                        {bookingUrl}
                                    </div>
                                    <button onClick={copyToClipboard} className="p-4 bg-white border border-indigo-100 rounded-2xl hover:bg-indigo-50 transition-colors text-indigo-600 relative">
                                        {showCopied ? <CheckCircle2 size={20} /> : <Copy size={20} />}
                                        <AnimatePresence>
                                            {showCopied && (
                                                <motion.span 
                                                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                                                    className="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1 bg-black text-white text-[10px] rounded-lg font-black"
                                                >
                                                    KOPYALANDI
                                                </motion.span>
                                            )}
                                        </AnimatePresence>
                                    </button>
                                    <a href={bookingUrl} target="_blank" className="p-4 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">
                                        <ExternalLink size={20} />
                                    </a>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Payment Settings */}
                    <div className="bg-white border border-gray-100 p-8 md:p-10 rounded-[3rem] shadow-sm space-y-10">
                        <div className="flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-indigo-600 ${settings.paymentMode !== 'none' ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                                    <CreditCard size={24} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black tracking-tight">Ödeme Seçenekleri</h3>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Tahsilat ve Kapora Modelleri</p>
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {[
                                { id: 'none', title: 'Ödeme Alınmasın', desc: 'Müşteri randevuyu ücretsiz oluşturur.' },
                                { id: 'deposit', title: 'Sadece Kapora', desc: 'Belirlediğiniz oranda ön ödeme alınır.' },
                                { id: 'full', title: 'Tam Ödeme', desc: 'Hizmet bedelinin tamamı tahsil edilir.' },
                                { id: 'both', title: 'Müşteri Seçsin', desc: 'Müşteri kapora veya tam ödeme seçebilir.' },
                            ].map((mode) => (
                                <button
                                    key={mode.id}
                                    onClick={() => setSettings({...settings, paymentMode: mode.id as any})}
                                    className={`p-6 rounded-[2rem] border-2 text-left transition-all ${settings.paymentMode === mode.id ? 'border-indigo-600 bg-indigo-50/50 shadow-lg' : 'border-gray-50 hover:border-indigo-100 bg-white'}`}
                                >
                                    <h4 className="font-black text-sm mb-1">{mode.title}</h4>
                                    <p className="text-[10px] font-bold text-gray-500 leading-tight">{mode.desc}</p>
                                </button>
                            ))}
                        </div>

                        {settings.paymentMode === 'deposit' || settings.paymentMode === 'both' ? (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 pt-6 border-t border-gray-50">
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kapora Oranı (%)</label>
                                        <span className="text-indigo-600 font-black text-sm">%{settings.depositPercentage}</span>
                                    </div>
                                    <input 
                                        type="range" min="5" max="100" step="5"
                                        value={settings.depositPercentage}
                                        onChange={e => setSettings({...settings, depositPercentage: parseInt(e.target.value)})}
                                        className="w-full h-2 bg-gray-100 rounded-full appearance-none accent-indigo-600 cursor-pointer"
                                    />
                                </div>

                                <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-4">
                                    <AlertCircle className="text-amber-500 shrink-0" size={20} />
                                    <p className="text-[11px] font-bold text-amber-700 leading-relaxed">
                                        Ödeme sistemi aktifken iyzico veya Stripe hesabınızın bağlı olduğundan emin olun.
                                    </p>
                                </div>
                            </motion.div>
                        ) : null}
                    </div>
                </motion.div>

                {/* Customization Column */}
                <motion.div 
                    initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}
                    className="space-y-8"
                >
                    <div className="bg-white border border-gray-100 p-8 rounded-[3rem] shadow-sm space-y-8">
                        <h3 className="text-xl font-black tracking-tight flex items-center gap-3">
                            <Palette size={20} className="text-indigo-600" /> Görünüm
                        </h3>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Kişiselleştirilmiş Mesaj</label>
                            <textarea 
                                rows={3}
                                value={settings.bookingMessage}
                                onChange={e => setSettings({...settings, bookingMessage: e.target.value})}
                                placeholder="Örn: En iyi bakım deneyimi için hazır mısınız?"
                                className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                            />
                        </div>

                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Marka Rengi</label>
                            <div className="flex gap-2">
                                {['#4F46E5', '#E11D48', '#059669', '#D97706', '#2563EB'].map(color => (
                                    <button 
                                        key={color} 
                                        onClick={() => setSettings({...settings, accentColor: color})}
                                        style={{ backgroundColor: color }}
                                        className={`w-10 h-10 rounded-xl transition-all ${settings.accentColor === color ? 'ring-4 ring-offset-2 ring-gray-200 scale-110 shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                             <div className="flex items-center gap-3">
                                <Zap className="w-4 h-4 text-gray-400" />
                                <span className="text-xs font-black text-gray-700">Uzman Seçimi</span>
                             </div>
                             <button 
                                onClick={() => setSettings({...settings, allowStaffSelect: !settings.allowStaffSelect})}
                                className={`w-10 h-5 rounded-full transition-all relative ${settings.allowStaffSelect ? 'bg-indigo-600' : 'bg-gray-200'}`}
                             >
                                <div className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${settings.allowStaffSelect ? 'left-5.5' : 'left-0.5'}`} />
                             </button>
                        </div>
                    </div>

                    <div className="bg-[#0A0A0B] text-white p-8 rounded-[3rem] shadow-2xl relative overflow-hidden group">
                        <Sparkles className="absolute -top-10 -right-10 w-40 h-40 opacity-10 group-hover:rotate-45 transition-transform duration-700" />
                        <div className="relative z-10 space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Premium Özellik</p>
                            </div>
                            <h4 className="text-lg font-black leading-tight">AI Doluluk Optimizasyonu</h4>
                            <p className="text-[11px] font-bold text-gray-400 leading-relaxed">
                                Yapay zeka, randevu saatlerini şubelerinizin en yoğun olduğu zamanları analiz ederek otomatik olarak kaydırır ve maksimum verimlilik sağlar.
                            </p>
                            <button className="w-full py-4 bg-white/10 border border-white/20 rounded-2xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all">
                                ŞİMDİ AKTİF ET
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
