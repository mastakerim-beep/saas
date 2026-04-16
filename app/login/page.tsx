"use client";

import { useState } from 'react';
import { useStore } from '@/lib/store';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { 
    ShieldCheck, Lock, Mail, 
    ArrowRight, Sparkles, AlertCircle, 
    Loader2, Globe, CheckCircle2 
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const { login } = useStore();
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const user = await login(email, password);
            if (user) {
                if (user.role === 'SaaS_Owner') {
                    router.push('/admin');
                    return;
                }

                if (user.businessId) {
                    // Fetch slug directly for immediate redirect
                    const { data: business } = await supabase
                        .from('businesses')
                        .select('slug')
                        .eq('id', user.businessId)
                        .single();

                    if (business?.slug) {
                        router.push(`/${business.slug}/dashboard`);
                        return;
                    }
                }
                
                // Fallback
                router.push('/');
            } else {
                setError('Geçersiz e-posta veya şifre. Lütfen tekrar deneyin.');
                setIsLoading(false);
            }
        } catch (err) {
            console.error('Login error:', err);
            setError('Bir hata oluştu. Lütfen tekrar deneyin.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6 relative overflow-hidden font-sans selection:bg-primary/30">
            {/* Background Decorative Elements */}
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[130px] rounded-full animate-pulse" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[130px] rounded-full animate-pulse" style={{ animationDelay: '2s' }} />

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="w-full max-w-[440px] relative z-10"
            >
                <div className="text-center mb-12">
                    <motion.div 
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="inline-flex p-5 rounded-[2rem] bg-primary/10 border border-primary/20 mb-8 cursor-pointer shadow-2xl shadow-primary/5"
                    >
                        <ShieldCheck className="w-12 h-12 text-primary" />
                    </motion.div>
                    <h1 className="text-4xl font-black text-gray-900 tracking-tighter mb-4 antialiased leading-tight">Aura Spa ERP</h1>
                    <p className="text-gray-400 font-bold uppercase tracking-[0.2em] text-[10px]">Premium Business Operations</p>
                </div>

                <div className="bg-white border border-gray-100 rounded-[3rem] p-12 shadow-2xl shadow-gray-200/50">
                    <form onSubmit={handleSubmit} className="space-y-8">
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3 text-red-500 text-xs font-black uppercase tracking-tight"
                            >
                                <AlertCircle className="w-5 h-5 flex-none" />
                                <span>{error}</span>
                            </motion.div>
                        )}

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 opacity-50">E-Posta Adresi</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors duration-300">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input 
                                    type="email" 
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="ornek@aura.com" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-16 pr-8 text-gray-900 text-sm font-black outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder:text-gray-300" 
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-2 opacity-50">Şifre</label>
                            <div className="relative group">
                                <div className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-600 group-focus-within:text-primary transition-colors duration-300">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input 
                                    type="password" 
                                    required
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="••••••••" 
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-5 pl-16 pr-8 text-gray-900 text-sm font-black outline-none focus:border-primary/50 focus:ring-4 focus:ring-primary/10 transition-all duration-300 placeholder:text-gray-300" 
                                />
                            </div>
                        </div>

                        <button 
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-white py-5 rounded-[1.5rem] font-black text-[13px] uppercase tracking-[0.2em] hover:bg-primary/90 transition-all duration-300 shadow-2xl shadow-primary/20 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed group relative overflow-hidden"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin mx-auto text-white" />
                            ) : (
                                <span className="flex items-center justify-center gap-3">
                                    Sisteme Eriş <ArrowRight className="w-5 h-5 group-hover:translate-x-1.5 transition-transform duration-300" />
                                </span>
                            )}
                        </button>
                    </form>

                    <div className="mt-10 pt-10 border-t border-gray-100 flex justify-between items-center text-[9px] font-black uppercase tracking-[0.3em] text-gray-400">
                        <div className="flex items-center gap-2.5">
                            <Globe className="w-3.5 h-3.5" />
                            <span>Global Network</span>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                            <span>SSL Security</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 flex justify-center gap-10 opacity-40">
                    <div className="flex flex-col items-center">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">v2.5 Enterprise</span>
                         <span className="text-[10px] font-bold text-gray-600">Standard Edition</span>
                    </div>
                    <div className="w-[1px] h-10 bg-white/10" />
                    <div className="flex flex-col items-center">
                         <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">Siber Güvenlik</span>
                         <span className="text-[10px] font-bold text-gray-600">Aktif & Korunaklı</span>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
