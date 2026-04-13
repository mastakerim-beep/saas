"use client";

import { useStore, Branch, Service, Staff } from '@/lib/store';
import { 
    Calendar, Clock, MapPin, User, 
    ChevronRight, ChevronLeft, CheckCircle2, 
    Sparkles, ShieldCheck, CreditCard, 
    ArrowRight, Star, Heart, Zap
} from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams, useRouter } from 'next/navigation';

export default function PublicBookingPortal() {
    const { slug } = useParams();
    const router = useRouter();
    const { 
        fetchPublicData, branches, services, staffMembers, 
        bookingSettings, currentBusiness, addAppointment, 
        processCheckout, bookingSettings: settings 
    } = useStore();

    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(true);

    // Selections
    const [selectedBranch, setSelectedBranch] = useState<Branch | null>(null);
    const [selectedService, setSelectedService] = useState<Service | null>(null);
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedTime, setSelectedTime] = useState<string>('');
    const [customerInfo, setCustomerInfo] = useState({ name: '', phone: '', email: '' });

    useEffect(() => {
        const load = async () => {
            if (slug) {
                await fetchPublicData(slug as string);
                setIsLoading(false);
            }
        };
        load();
    }, [slug]);

    // Derived Data
    const availableStaff = useMemo(() => {
        if (!selectedBranch) return [];
        return staffMembers.filter(s => s.branchId === selectedBranch.id);
    }, [selectedBranch, staffMembers]);

    const depositAmount = useMemo(() => {
        if (!selectedService || !settings?.requireDeposit) return 0;
        return (selectedService.price * (settings.depositPercentage || 20)) / 100;
    }, [selectedService, settings]);

    const handleConfirm = async () => {
        const apptData = {
            customerName: customerInfo.name,
            service: selectedService?.name,
            staffId: selectedStaff?.id,
            staffName: selectedStaff?.name,
            date: selectedDate,
            time: selectedTime,
            price: selectedService?.price,
            depositPaid: depositAmount,
            isOnline: true,
            branchId: selectedBranch?.id
        };
        
        const success = await addAppointment(apptData);
        if (success && depositAmount > 0) {
            // Log the deposit payment in the system
            await processCheckout({
                customerId: 'online-customer', 
                customerName: customerInfo.name,
                totalAmount: depositAmount,
                method: 'kredi-karti',
                currency: 'TRY',
                rate: 1,
                isDeposit: true
            });
        }
        if (success) setStep(7); // Success Step
    };

    if (isLoading) {
        return (
            <div className="h-screen bg-white flex items-center justify-center">
                <motion.div 
                    animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full"
                />
            </div>
        );
    }

    if (!settings?.isEnabled) {
        return (
            <div className="h-screen bg-gray-50 flex items-center justify-center p-8 text-center">
                <div className="max-w-md space-y-6">
                    <div className="w-20 h-20 bg-gray-100 rounded-3xl flex items-center justify-center mx-auto text-gray-400">
                        <Calendar size={40} />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900">Online Randevu Kapalı</h1>
                    <p className="text-gray-500 font-medium">Bu işletme şu anda online randevu kabul etmemektedir. Lütfen telefon ile iletişime geçin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#FDFDFF] font-sans text-gray-900">
            {/* Background Accents */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none overflow-hidden transform-gpu">
                <div className="absolute top-[-10%] right-[-5%] w-[40%] h-[40%] bg-indigo-50/50 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-5%] left-[-5%] w-[30%] h-[30%] bg-rose-50/30 rounded-full blur-[100px]" />
            </div>

            <div className="relative z-10 max-w-2xl mx-auto px-6 py-12 md:py-20">
                {/* Header */}
                <div className="text-center mb-16 space-y-4">
                    <motion.div 
                        initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
                        className="w-20 h-20 bg-black text-white rounded-[2rem] flex items-center justify-center mx-auto shadow-2xl shadow-indigo-200 mb-8"
                    >
                        <Sparkles size={32} />
                    </motion.div>
                    <motion.h1 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                        className="text-4xl font-black tracking-tighter"
                    >
                        {currentBusiness?.name}
                    </motion.h1>
                    <p className="text-gray-400 font-bold text-xs uppercase tracking-[0.2em]">{settings.bookingMessage}</p>
                </div>

                {/* Progress Bar */}
                <div className="flex justify-between items-center mb-12 px-2">
                    {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div key={i} className="flex items-center">
                            <div className={`w-2.5 h-2.5 rounded-full transition-all duration-500 ${step >= i ? 'bg-indigo-600 scale-125 shadow-[0_0_10px_rgba(79,70,229,0.4)]' : 'bg-gray-200'}`} />
                            {i < 6 && <div className={`w-8 md:w-16 h-[2px] mx-1 rounded-full transition-all duration-500 ${step > i ? 'bg-indigo-600' : 'bg-gray-100'}`} />}
                        </div>
                    ))}
                </div>

                <AnimatePresence mode="wait">
                    {/* Step 1: Branch Selection */}
                    {step === 1 && (
                        <motion.div 
                            key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="mb-8">
                                <h2 className="text-2xl font-black tracking-tight mb-2">Hangi şubemizden hizmet almak istersiniz?</h2>
                                <p className="text-gray-400 text-sm font-bold uppercase tracking-widest">SİZE EN YAKIN KONUMU SEÇİN</p>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {branches.map((branch) => (
                                    <button 
                                        key={branch.id} onClick={() => { setSelectedBranch(branch); setStep(2); }}
                                        className="group p-8 bg-white border border-gray-100 rounded-[2.5rem] flex items-center justify-between hover:border-indigo-500 hover:shadow-xl hover:shadow-indigo-500/5 transition-all outline-none"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                                <MapPin size={24} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-xl font-black tracking-tight">{branch.name}</h3>
                                                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">{branch.location}</p>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-gray-300 group-hover:text-indigo-600 transition-colors" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 2: Service Selection */}
                    {step === 2 && (
                        <motion.div 
                            key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <button onClick={() => setStep(1)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-gray-900"><ChevronLeft size={14}/> Geri</button>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{selectedBranch?.name}</p>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight mb-8">Nasıl bir deneyim istersiniz?</h2>
                            <div className="grid grid-cols-1 gap-4">
                                {services.map((service) => (
                                    <button 
                                        key={service.id} onClick={() => { setSelectedService(service); setStep(settings.allowStaffSelect ? 3 : 4); }}
                                        className="group p-8 bg-white border border-gray-100 rounded-[2.5rem] flex items-center justify-between hover:border-indigo-500 hover:shadow-xl transition-all outline-none"
                                    >
                                        <div className="flex items-center gap-6">
                                            <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:scale-110 transition-transform">
                                                <Zap size={24} />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="text-xl font-black tracking-tight">{service.name}</h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Clock size={12}/> {service.duration} DK</span>
                                                    <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                    <span className="text-indigo-600 text-sm font-black">₺{service.price}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <ChevronRight className="text-gray-300 group-hover:text-indigo-600" />
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 3: Staff Selection */}
                    {step === 3 && (
                        <motion.div 
                            key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <button onClick={() => setStep(2)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-gray-900"><ChevronLeft size={14}/> Geri</button>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{selectedService?.name}</p>
                            </div>
                            <h2 className="text-2xl font-black tracking-tight mb-8">Uzmanınızı seçin</h2>
                            <div className="grid grid-cols-2 gap-4">
                                <button 
                                    onClick={() => { setSelectedStaff(null); setStep(4); }}
                                    className="p-8 bg-gray-50 border border-transparent rounded-[2.5rem] flex flex-col items-center justify-center hover:bg-white hover:border-indigo-500 hover:shadow-xl transition-all outline-none group text-center"
                                >
                                    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center text-indigo-600 mb-4 shadow-sm group-hover:bg-indigo-600 group-hover:text-white transition-all">
                                        <User size={24} />
                                    </div>
                                    <h3 className="font-black text-gray-900 text-sm tracking-tight">Herhangi Biri</h3>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">HIZLI RANDEVU</p>
                                </button>
                                {availableStaff.map((s) => (
                                    <button 
                                        key={s.id} onClick={() => { setSelectedStaff(s); setStep(4); }}
                                        className="p-8 bg-white border border-gray-100 rounded-[2.5rem] flex flex-col items-center justify-center hover:border-indigo-500 hover:shadow-xl transition-all outline-none text-center"
                                    >
                                        <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center font-black text-xl mb-4">
                                            {s.name.charAt(0)}
                                        </div>
                                        <h3 className="font-black text-gray-900 text-sm tracking-tight">{s.name}</h3>
                                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mt-1">{s.role}</p>
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    )}

                    {/* Step 4: Date & Time Selection */}
                    {step === 4 && (
                        <motion.div 
                            key="step4" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="flex items-center justify-between">
                                <button onClick={() => setStep(settings.allowStaffSelect ? 3 : 2)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-gray-900"><ChevronLeft size={14}/> Geri</button>
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">{selectedStaff?.name || 'Hızılı Randevu'}</p>
                            </div>
                            
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Randevu Tarihi</label>
                                <input 
                                    type="date" 
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    min={new Date().toISOString().split('T')[0]}
                                    className="w-full p-6 bg-white border border-gray-100 rounded-[1.8rem] font-black outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-xl"
                                />
                            </div>

                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Uygun Saatler</label>
                                <div className="grid grid-cols-3 gap-3">
                                    {['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00'].map(t => (
                                        <button 
                                            key={t} onClick={() => setSelectedTime(t)}
                                            className={`py-4 rounded-2xl font-black text-sm transition-all ${selectedTime === t ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-white border border-gray-100 hover:border-indigo-500'}`}
                                        >
                                            {t}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <button 
                                disabled={!selectedDate || !selectedTime}
                                onClick={() => setStep(5)}
                                className={`w-full py-5 rounded-[1.8rem] font-black flex items-center justify-center gap-3 transition-all ${(!selectedDate || !selectedTime) ? 'bg-gray-100 text-gray-400 grayscale pointer-events-none' : 'bg-black text-white hover:bg-gray-900 active:scale-95 shadow-xl shadow-gray-200'}`}
                            >
                                Devam Et <ArrowRight size={20}/>
                            </button>
                        </motion.div>
                    )}

                    {/* Step 5: Customer Info & Deposit Header */}
                    {step === 5 && (
                        <motion.div 
                            key="step5" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                             <div className="flex items-center justify-between">
                                <button onClick={() => setStep(4)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-gray-900"><ChevronLeft size={14}/> Geri</button>
                                <p className="text-emerald-500 text-[10px] font-black uppercase tracking-widest">{selectedDate} @ {selectedTime}</p>
                            </div>

                            <div className="space-y-6">
                                <h2 className="text-2xl font-black tracking-tight mb-2">İletişim Bilgileriniz</h2>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">AD SOYAD</label>
                                        <input 
                                            placeholder="Ayşe Kaya" 
                                            onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                                            className="w-full p-5 bg-white border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">TELEFON</label>
                                        <input 
                                            placeholder="05..." 
                                            onChange={e => setCustomerInfo({...customerInfo, phone: e.target.value})}
                                            className="w-full p-5 bg-white border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">E-POSTA (OPSİYONEL)</label>
                                        <input 
                                            placeholder="ayse@örnek.com" 
                                            onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                                            className="w-full p-5 bg-white border border-gray-100 rounded-2xl font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                                        />
                                    </div>
                                </div>
                            </div>

                            {settings.requireDeposit ? (
                                <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-indigo-600 rounded-[2.5rem] p-8 text-white space-y-6 shadow-2xl shadow-indigo-600/30">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200">Gerekli Kapora</p>
                                            <p className="text-4xl font-black">₺{depositAmount}</p>
                                        </div>
                                        <CreditCard size={32} className="text-indigo-300 opacity-50" />
                                    </div>
                                    <p className="text-xs font-bold leading-relaxed opacity-80">
                                        Randevunuzun kesinleşmesi için hizmet bedelinin %{settings.depositPercentage}'i tutarında kapora ödemesi gerekmektedir. Kalan tutar işlem sonrası şubede tahsil edilecektir.
                                    </p>
                                    <button 
                                        disabled={!customerInfo.name || !customerInfo.phone}
                                        onClick={() => setStep(6)}
                                        className="w-full py-5 bg-white text-indigo-600 rounded-2xl font-black text-sm hover:bg-gray-50 transition-all shadow-xl disabled:opacity-50"
                                    >
                                        ÖDEME ADIMINA GEÇ
                                    </button>
                                </motion.div>
                            ) : (
                                <button 
                                    disabled={!customerInfo.name || !customerInfo.phone}
                                    onClick={handleConfirm}
                                    className="w-full py-5 bg-black text-white rounded-[1.8rem] font-black flex items-center justify-center gap-3 transition-all hover:bg-gray-900 active:scale-95 shadow-xl disabled:opacity-50"
                                >
                                    RANDEVUYU ONAYLA
                                </button>
                            )}
                        </motion.div>
                    )}

                    {/* Step 6: Mock Payment Step */}
                    {step === 6 && (
                        <motion.div 
                            key="step6" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
                            className="space-y-10"
                        >
                            <div className="flex items-center justify-between">
                                <button onClick={() => setStep(5)} className="text-gray-400 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:text-gray-900"><ChevronLeft size={14}/> Geri</button>
                                <p className="text-indigo-600 text-[10px] font-black uppercase tracking-widest">GÜVENLİ ÖDEME</p>
                            </div>

                            <div className="bg-white border-2 border-indigo-600 rounded-[2.5rem] p-10 space-y-8 shadow-xl">
                                <div className="flex items-center gap-4">
                                     <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 font-black text-xl">
                                        <CreditCard size={24} />
                                     </div>
                                     <h3 className="text-xl font-black tracking-tight">Kart Bilgileri</h3>
                                </div>
                                
                                <div className="space-y-4">
                                    <input placeholder="Kart Sahibi" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" />
                                    <input placeholder="0000 0000 0000 0000" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" />
                                    <div className="grid grid-cols-2 gap-4">
                                        <input placeholder="AA/YY" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" />
                                        <input placeholder="CVC" className="w-full p-5 bg-gray-50 border border-gray-100 rounded-2xl font-bold outline-none" />
                                    </div>
                                </div>

                                <div className="pt-4 space-y-4">
                                    <div className="flex justify-between items-center text-sm font-black uppercase tracking-widest text-gray-400">
                                        <span>ÖDENECEK TUTAR</span>
                                        <span className="text-gray-900">₺{depositAmount}</span>
                                    </div>
                                    <button 
                                        onClick={handleConfirm}
                                        className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100"
                                    >
                                        ÖDEMEYİ TAMAMLA
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center justify-center gap-4 text-gray-400">
                                <ShieldCheck size={16} />
                                <span className="text-[10px] font-black uppercase tracking-widest">256-BIT SSL GÜVENLİĞİ İLE KORUNUYOR</span>
                            </div>
                        </motion.div>
                    )}

                    {/* Step 7: Success! */}
                    {step === 7 && (
                        <motion.div 
                            key="step7" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                            className="bg-white border border-gray-100 rounded-[3.5rem] p-12 text-center space-y-8 shadow-2xl shadow-indigo-500/5 overflow-hidden relative"
                        >
                            <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
                            <div className="w-24 h-24 bg-emerald-50 text-emerald-600 rounded-[2rem] flex items-center justify-center mx-auto mb-4 animate-bounce">
                                <CheckCircle2 size={40} />
                            </div>
                            <div className="space-y-4">
                                <h1 className="text-3xl font-black tracking-tighter">İşlem Başarılı!</h1>
                                <p className="text-gray-500 font-medium leading-relaxed">
                                    Randevu kaydınız oluşturuldu. {settings.requireDeposit ? 'Kaporonuz onaylandı.' : ''} Bilgiler e-posta ve SMS ile tarafınıza ulaştırılacaktır.
                                </p>
                            </div>

                            <div className="p-8 bg-gray-50 rounded-[2rem] space-y-4 text-left">
                                <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
                                    <span>RANDEVU DETAYI</span>
                                    <span className="text-indigo-600">AKTİF</span>
                                </div>
                                <div className="space-y-1">
                                    <p className="font-black text-gray-900">{selectedService?.name}</p>
                                    <p className="text-sm font-bold text-gray-500">{selectedBranch?.name} - {selectedDate} @ {selectedTime}</p>
                                </div>
                            </div>

                            <button 
                                onClick={() => router.push(`/${slug}`)}
                                className="w-full py-5 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-800 transition-all"
                            >
                                ANA SAYFAYA DÖN
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Footer Badges */}
                <div className="mt-16 pt-12 border-t border-gray-100 flex flex-col md:flex-row items-center justify-between gap-8">
                     <div className="flex items-center gap-3">
                         <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-400">
                            <ShieldCheck size={20} />
                         </div>
                         <div>
                            <p className="text-[10px] font-black uppercase tracking-widest leading-none">GÜVENLİ REZERVASYON</p>
                            <p className="text-[9px] text-gray-400 font-bold mt-1 uppercase">CLOUD ERP v2.5 ALTYAPISI</p>
                         </div>
                     </div>

                     <div className="flex gap-4">
                        <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Sistemler Online</span>
                     </div>
                </div>
            </div>
        </div>
    );
}
