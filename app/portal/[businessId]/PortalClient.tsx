'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Phone, ArrowRight, Star, CreditCard, Sparkles, MapPin, Bell, User, Calendar as CalendarIcon, KeyRound, QrCode, ChevronRight, Clock, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PortalClient({ business }: { business: any }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [customerData, setCustomerData] = useState<any>(null);
    const [customerPackages, setCustomerPackages] = useState<any[]>([]);
    const [appointments, setAppointments] = useState<any[]>([]);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginIdentifier) return;
        setIsLoading(true);
        
        try {
            const { data: customer, error: custError } = await (supabase as any)
                .from('customers')
                .select('*')
                .or(`phone.eq.${loginIdentifier},reference_code.eq.${loginIdentifier}`)
                .eq('business_id', business?.id)
                .maybeSingle();

            if (custError) throw custError;

            let targetCustomer = customer;

            if (!targetCustomer) {
                const { data: appt } = await (supabase as any)
                    .from('appointments')
                    .select('*, customers(*)')
                    .eq('appt_ref', loginIdentifier)
                    .eq('business_id', business?.id)
                    .maybeSingle();
                
                if (appt?.customers) targetCustomer = appt.customers;
            }

            if (!targetCustomer) {
                alert('Müşteri kaydı bulunamadı. Lütfen bilgilerinizi kontrol edin.');
                setIsLoading(false);
                return;
            }

            // Fetch Packages
            const { data: packages } = await (supabase as any)
                .from('packages')
                .select('*')
                .eq('customer_id', targetCustomer.id);

            // Fetch All Appointments for this customer
            const { data: appts } = await (supabase as any)
                .from('appointments')
                .select('*')
                .eq('customer_id', targetCustomer.id)
                .order('date', { ascending: false });

            setCustomerData(targetCustomer);
            setCustomerPackages(packages || []);
            setAppointments(appts || []);
            setIsAuthenticated(true);
        } catch (err) {
            console.error('Portal Login Error:', err);
            alert('Giriş yapılırken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancelAppointment = async (apptId: string) => {
        const appt = appointments.find(a => a.id === apptId);
        if (!appt) return;

        // Restriction: can't cancel within 2 hours
        const apptDateTime = new Date(`${appt.date}T${appt.time}`);
        const now = new Date();
        const diffMs = apptDateTime.getTime() - now.getTime();
        const diffHrs = diffMs / (1000 * 60 * 60);

        if (diffHrs < 2) {
            alert('Randevunuza 2 saatten az kaldığı için sistem üzerinden iptal edemezsiniz. Lütfen işletme ile iletişime geçin.');
            return;
        }

        if (!confirm('Randevunuzu iptal etmek istediğinize emin misiniz?')) return;

        const { error } = await (supabase as any)
            .from('appointments')
            .update({ status: 'cancelled' })
            .eq('id', apptId);

        if (error) {
            alert('İşlem başarısız oldu.');
            return;
        }

        setAppointments(prev => prev.map(a => a.id === apptId ? { ...a, status: 'cancelled' } : a));
    };

    const upcomingAppointments = appointments.filter((a: any) => 
        (a.status === 'confirmed' || a.status === 'pending') && 
        new Date(a.date) >= new Date(new Date().setHours(0,0,0,0))
    );
    const pastAppointments = appointments.filter((a: any) => 
        (a.status === 'completed' || a.status === 'cancelled') || 
        new Date(a.date) < new Date(new Date().setHours(0,0,0,0))
    );

    if (!isAuthenticated) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center px-6 relative overflow-hidden">
                {/* Visual Elements */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 blur-[100px] pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-500/10 blur-[100px] pointer-events-none" />

                <motion.div 
                    initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-sm bg-white p-10 rounded-[3rem] shadow-2xl relative z-10 text-center"
                >
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <User className="w-10 h-10 text-indigo-600" />
                    </div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">{business?.name} Portal</h1>
                    <p className="text-gray-400 font-semibold text-xs mb-8">Randevularınızı ve paketlerinizi yönetmek için giriş yapın.</p>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div className="relative text-left">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest pl-4 mb-2 block">Cüzdan veya Telefon No</label>
                            <div className="relative">
                                <KeyRound className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                                <input 
                                    value={loginIdentifier}
                                    onChange={(e) => setLoginIdentifier(e.target.value)}
                                    type="text" 
                                    placeholder="Örn: 05xx veya TK-1234"
                                    className="w-full bg-gray-50 border-2 border-transparent focus:border-indigo-500 rounded-2xl py-4 pl-12 pr-4 font-bold outline-none transition"
                                />
                            </div>
                        </div>
                        <button 
                            disabled={isLoading || !loginIdentifier}
                            type="submit"
                            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50 shadow-xl shadow-indigo-200"
                        >
                            {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Portala Giriş Yap"}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    const isClinic = business?.verticals?.includes('clinic');

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col relative pb-24 font-sans antialiased">
            <header className="bg-black text-white pt-16 pb-20 px-8 rounded-b-[4rem] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 blur-[80px]" />
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Müşteri Portalı</p>
                        <h2 className="text-2xl font-black">{customerData?.name}</h2>
                    </div>
                </div>

                <div className="mt-10 flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-500/20">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-indigo-300 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-indigo-300" /> {customerData?.segment || 'Özel'} Üye
                        </p>
                        <h3 className="text-4xl font-black tracking-tighter">
                            {(customerData?.loyalty_points || 0).toLocaleString('tr-TR')} <span className="text-lg text-white/50 font-bold">Puan</span>
                        </h3>
                    </div>
                </div>
            </header>

            <main className="px-6 -mt-8 relative z-20 space-y-10">
                {/* Appointments Section */}
                <section>
                    <h3 className="text-sm font-black text-gray-900 mb-5 px-2 tracking-tight uppercase">{isClinic ? 'Vizite Takvimim' : 'Randevularım'}</h3>
                    <div className="space-y-5">
                        {upcomingAppointments.length > 0 ? upcomingAppointments.map((appt: any, i: number) => (
                            <div key={i} className="bg-white p-7 rounded-[3rem] shadow-xl shadow-indigo-900/5 group border border-indigo-50/50">
                                <div className="flex justify-between items-center mb-6">
                                    <span className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-2 px-4 py-1.5 rounded-full ${appt.status === 'confirmed' ? 'bg-indigo-50 text-indigo-600' : 'bg-amber-50 text-amber-600'}`}>
                                        <CalendarIcon className="w-3.5 h-3.5" /> 
                                        {appt.status === 'confirmed' ? 'ONAYLANDI' : 'ONAY BEKLİYOR'}
                                    </span>
                                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                        {new Date(appt.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}
                                    </span>
                                </div>
                                <div className="flex items-center gap-5 mb-8 text-left">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-black text-gray-900 leading-tight tracking-tight">{appt.service}</h3>
                                        <p className="text-xs font-bold text-gray-400 mt-2 flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5" /> {appt.time} • {appt.staff_name || 'Uzman Atanıyor'}
                                        </p>
                                    </div>
                                    <div className="w-14 h-14 bg-gray-50 flex items-center justify-center rounded-[1.5rem] border border-gray-100 group-hover:scale-105 transition-transform">
                                        <QrCode className="w-7 h-7 text-gray-900" />
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    <button onClick={() => alert('Referans No: ' + appt.appt_ref)} className="flex-1 bg-gray-900 text-white font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl shadow-lg shadow-gray-200">Ref Kod</button>
                                    <button onClick={() => handleCancelAppointment(appt.id)} className="flex-1 bg-rose-50 text-rose-600 font-black text-[11px] uppercase tracking-widest py-4 rounded-2xl border border-rose-100/50">İptal Et</button>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-white p-12 rounded-[3.5rem] shadow-sm text-center border-2 border-dashed border-gray-100">
                                <div className="w-14 h-14 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <CalendarIcon className="w-6 h-6 text-gray-300" />
                                </div>
                                <p className="text-gray-400 text-[11px] font-black uppercase tracking-widest leading-relaxed">Yaklaşan randevunuz yok.</p>
                                <a href={`/book/${business?.id}`} className="inline-block mt-4 text-indigo-600 font-black text-[10px] uppercase tracking-widest bg-indigo-50 px-6 py-2 rounded-full">Yeni Randevu Al</a>
                            </div>
                        )}
                    </div>
                </section>

                {/* Active Packages */}
                <section>
                    <h3 className="text-sm font-black text-gray-900 mb-5 px-2 tracking-tight uppercase">Aktif {isClinic ? 'Paketler' : 'Seanslar'}</h3>
                    <div className="space-y-5">
                        {customerPackages.filter((p: any) => (p.total_sessions - p.used_sessions) > 0).map((pkg: any, i: number) => (
                            <div key={i} className="bg-gradient-to-br from-indigo-600 to-indigo-800 p-8 rounded-[3.5rem] text-white relative overflow-hidden shadow-2xl">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full blur-[40px] -mr-10 -mt-10" />
                                <div className="relative z-10 flex justify-between items-start mb-8">
                                    <div className="pr-10">
                                        <p className="font-black text-xl leading-tight uppercase tracking-tighter">{pkg.name}</p>
                                        <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mt-2 bg-white/10 inline-block px-3 py-1 rounded-full">Exp: {pkg.expiry || 'Süresiz'}</p>
                                    </div>
                                    <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                        <CreditCard className="w-6 h-6 text-white" />
                                    </div>
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-end mb-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Kullanılabilir / Toplam</p>
                                        <p className="text-4xl font-black">{pkg.total_sessions - pkg.used_sessions}<span className="text-lg text-white/30 font-bold ml-1">/ {pkg.total_sessions}</span></p>
                                    </div>
                                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                                        <motion.div 
                                            initial={{ width: 0 }} 
                                            animate={{ width: `${((pkg.total_sessions - pkg.used_sessions) / pkg.total_sessions) * 100}%` }} 
                                            transition={{ duration: 1.5, type: "spring" }}
                                            className="bg-white h-full rounded-full" 
                                        />
                                    </div>
                                </div>
                            </div>
                        ))}
                        {customerPackages.length === 0 && (
                            <div className="bg-gray-100/50 p-10 rounded-[3rem] text-center border border-gray-200">
                                <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest">Kayıtlı paketiniz bulunmuyor.</p>
                            </div>
                        )}
                    </div>
                </section>

                {/* Record History */}
                {pastAppointments.length > 0 && (
                    <section className="pb-12">
                        <h3 className="text-sm font-black text-gray-900 mb-5 px-2 tracking-tight uppercase">İşlem Geçmişi</h3>
                        <div className="bg-white rounded-[2.5rem] shadow-xl shadow-indigo-900/5 divide-y divide-gray-50 overflow-hidden border border-gray-50">
                            {pastAppointments.slice(0, 5).map((appt: any, i: number) => (
                                <div key={i} className="p-6 flex items-center justify-between hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center gap-5">
                                        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center ${appt.status === 'completed' ? 'bg-emerald-50 text-emerald-500' : 'bg-rose-50 text-rose-500'}`}>
                                            <CalendarIcon size={20} />
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-black text-gray-900 tracking-tight leading-none mb-1.5">{appt.service}</p>
                                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {new Date(appt.date).toLocaleDateString('tr-TR')} • {appt.status === 'completed' ? 'TAMAMLANDI' : 'İPTAL'}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight size={16} className="text-gray-300" />
                                </div>
                            ))}
                        </div>
                    </section>
                )}
            </main>

            {/* Bottom Nav (PWA Native App Feel) */}
            <div className="fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-3xl border-t border-gray-100 pb-safe pt-5 px-10 z-50 rounded-t-[3rem] shadow-[0_-15px_40px_rgba(0,0,0,0.05)] flex justify-between items-center text-gray-400">
                <button className="flex flex-col items-center gap-1.5 text-indigo-600">
                    <User className="w-6 h-6" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Profil</span>
                </button>
                <div className="relative -top-7">
                    <a href={`/book/${business?.id}`} className="w-16 h-16 bg-black text-white rounded-full flex items-center justify-center shadow-2xl shadow-indigo-200 hover:scale-110 active:scale-95 transition-all">
                        <Plus className="w-7 h-7" />
                    </a>
                </div>
                <button className="flex flex-col items-center gap-1.5 hover:text-gray-900 transition">
                    <Sparkles className="w-6 h-6" />
                    <span className="text-[9px] font-black uppercase tracking-widest">Fırsatlar</span>
                </button>
            </div>
        </div>
    );
}
