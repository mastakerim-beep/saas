'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Phone, ArrowRight, Star, CreditCard, Sparkles, MapPin, Bell, User, Calendar as CalendarIcon, KeyRound, QrCode } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function PortalClient({ business }: { business: any }) {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [loginIdentifier, setLoginIdentifier] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const [customerData, setCustomerData] = useState<any>(null);
    const [customerPackages, setCustomerPackages] = useState<any[]>([]);
    const [upcomingAppointment, setUpcomingAppointment] = useState<any>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!loginIdentifier) return;
        setIsLoading(true);
        
        try {
            // Search by Phone or Ticket ID (reference_code or appt_ref)
            const { data: customer, error: custError } = await (supabase as any)
                .from('customers')
                .select('*')
                .or(`phone.eq.${loginIdentifier},reference_code.eq.${loginIdentifier}`)
                .eq('business_id', business?.id)
                .maybeSingle();

            if (custError) throw custError;

            let targetCustomer = customer;

            // If not found by direct customer field, try searching via appointment ref
            if (!targetCustomer) {
                const { data: appt, error: apptError } = await (supabase as any)
                    .from('appointments')
                    .select('*, customers(*)')
                    .eq('appt_ref', loginIdentifier)
                    .eq('business_id', business?.id)
                    .maybeSingle();
                
                if (appt?.customers) {
                    targetCustomer = appt.customers;
                }
            }

            if (!targetCustomer) {
                alert('Müşteri kaydı bulunamadı. Lütfen telefon numaranızı veya bilet numaranızı kontrol edin.');
                setIsLoading(false);
                return;
            }

            // Fetch Packages
            const { data: packages } = await (supabase as any)
                .from('packages')
                .select('*')
                .eq('customer_id', targetCustomer.id)
                .eq('status', 'active');

            // Fetch Upcoming Appointment
            const { data: upcomings } = await (supabase as any)
                .from('appointments')
                .select('*')
                .eq('customer_id', targetCustomer.id)
                .gte('date', new Date().toISOString().split('T')[0])
                .order('date', { ascending: true })
                .order('time', { ascending: true })
                .limit(1);

            setCustomerData(targetCustomer);
            setCustomerPackages(packages || []);
            setUpcomingAppointment(upcomings?.[0] || null);
            setIsAuthenticated(true);
        } catch (err) {
            console.error('Portal Login Error:', err);
            alert('Giriş yapılırken bir hata oluştu.');
        } finally {
            setIsLoading(false);
        }
    };

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
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight mb-2">{business?.name} VIP</h1>
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
                            className="w-full bg-indigo-600 text-white font-black py-4 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-700 transition disabled:opacity-50"
                        >
                            {isLoading ? <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : "Portala Giriş Yap"}
                        </button>
                    </form>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#fafafa] flex flex-col relative pb-24">
            {/* Dynamic Header */}
            <header className="bg-black text-white pt-16 pb-20 px-8 rounded-b-[3rem] relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/20 blur-[80px]" />
                <div className="flex justify-between items-start relative z-10">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-white/50 mb-1">Hoş Geldiniz</p>
                        <h2 className="text-2xl font-black">{customerData?.name}</h2>
                    </div>
                    <button className="w-10 h-10 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center relative">
                        <Bell className="w-5 h-5" />
                        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-black" />
                    </button>
                </div>

                {/* Aura Points Display */}
                <div className="mt-10 flex items-center gap-4 relative z-10">
                    <div className="w-14 h-14 bg-gradient-to-br from-amber-300 to-amber-500 rounded-2xl flex items-center justify-center shadow-[0_0_20px_rgba(251,191,36,0.3)]">
                        <Sparkles className="w-7 h-7 text-white" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-amber-300 flex items-center gap-1">
                            <Star className="w-3 h-3 fill-amber-300" /> {customerData?.segment || 'Normal'}
                        </p>
                        <h3 className="text-4xl font-black tracking-tighter">
                            {(customerData?.loyalty_points || 0).toLocaleString('tr-TR')} <span className="text-lg text-white/50 font-bold">Puan</span>
                        </h3>
                    </div>
                </div>
            </header>

            <main className="px-6 -mt-8 relative z-20 space-y-6">
                
                {/* Upcoming Appointment */}
                {upcomingAppointment ? (
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-indigo-900/5 group">
                        <div className="flex justify-between items-center mb-6">
                            <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500 flex items-center gap-1 bg-indigo-50 px-3 py-1 rounded-full"><CalendarIcon className="w-3 h-3" /> Yaklaşan Randevu</span>
                            <span className="text-[10px] font-black text-gray-400">{upcomingAppointment.date}</span>
                        </div>
                        <div className="flex items-center gap-4 mb-6">
                            <div className="flex-1">
                                <h3 className="text-lg font-black text-gray-900">{upcomingAppointment.service}</h3>
                                <p className="text-xs font-semibold text-gray-500">{upcomingAppointment.time} • {upcomingAppointment.staff_name || 'Terapist Seçilmedi'}</p>
                            </div>
                            <div className="w-12 h-12 bg-gray-50 flex items-center justify-center rounded-2xl border border-gray-100 group-hover:scale-110 transition-transform cursor-pointer">
                                <QrCode className="w-6 h-6 text-gray-900" />
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button className="flex-1 bg-indigo-600 text-white font-black text-[11px] uppercase tracking-widest py-3 rounded-2xl hover:bg-indigo-700 transition">Detay</button>
                            <button className="flex-1 bg-gray-50 text-gray-600 font-black text-[11px] uppercase tracking-widest py-3 rounded-2xl hover:bg-gray-100 transition">Yardım</button>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white p-10 rounded-[2.5rem] shadow-xl text-center">
                        <p className="text-gray-400 font-bold text-sm">Aktif randevunuz bulunmamaktadır.</p>
                        <a href={`/book/${business?.id}`} className="inline-block mt-4 text-indigo-600 font-black text-xs uppercase tracking-widest">Hemen Randevu Al</a>
                    </div>
                )}

                {/* Active Packages */}
                <div>
                    <h3 className="text-sm font-black text-gray-900 mb-4 px-2">Kullanılabilir Paketlerim</h3>
                    <div className="space-y-4">
                        {customerPackages.length > 0 ? customerPackages.map((pkg: any, i: number) => (
                            <div key={i} className={`bg-gradient-to-r from-indigo-500 to-indigo-700 p-6 rounded-[2.5rem] text-white relative overflow-hidden shadow-lg`}>
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[30px]" />
                                <div className="relative z-10 flex justify-between items-start mb-6">
                                    <div className="pr-10">
                                        <p className="font-black text-lg leading-tight">{pkg.name}</p>
                                        <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">Son K.: {pkg.expiry || 'Süresiz'}</p>
                                    </div>
                                    <CreditCard className="w-6 h-6 text-white/50" />
                                </div>
                                <div className="relative z-10">
                                    <div className="flex justify-between items-end mb-2">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-white/70">Kalan Seans</p>
                                        <p className="text-3xl font-black">{pkg.total_sessions - pkg.used_sessions}<span className="text-base text-white/50">/{pkg.total_sessions}</span></p>
                                    </div>
                                    <div className="w-full bg-black/20 h-2 rounded-full overflow-hidden">
                                        <div className="bg-white h-full rounded-full" style={{ width: `${((pkg.total_sessions - pkg.used_sessions) / pkg.total_sessions) * 100}%` }} />
                                    </div>
                                </div>
                            </div>
                        )) : (
                            <div className="bg-gray-100/50 border-2 border-dashed border-gray-200 p-8 rounded-[2.5rem] text-center">
                                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Henüz bir paketiniz yok</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>

            {/* Bottom Nav (PWA Native App Feel) */}
            <div className="fixed bottom-0 left-0 w-full bg-white/90 backdrop-blur-xl border-t border-gray-100 pb-safe pt-4 px-8 z-50 rounded-t-[2.5rem] shadow-[0_-10px_40px_rgba(0,0,0,0.03)] flex justify-between items-center text-gray-400">
                <button className="flex flex-col items-center gap-1 text-indigo-600">
                    <User className="w-6 h-6" />
                    <span className="text-[9px] font-black uppercase">Portal</span>
                </button>
                <div className="relative -top-5">
                    <a href={`/book/${business?.id}`} className="w-14 h-14 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:scale-110 active:scale-95 transition-all">
                        <CalendarIcon className="w-6 h-6" />
                    </a>
                </div>
                <button className="flex flex-col items-center gap-1 hover:text-gray-900 transition">
                    <Star className="w-6 h-6" />
                    <span className="text-[9px] font-black uppercase">Puanlar</span>
                </button>
            </div>
        </div>
    );
}
