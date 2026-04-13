"use client";
import { useStore } from "@/lib/store";
import { ShieldAlert, LogOut, RefreshCw } from "lucide-react";
import { motion } from "framer-motion";

export default function LicenseGuard({ children }: { children: React.ReactNode }) {
    const { isLicenseExpired, currentBusiness, logout, currentUser } = useStore();

    const isSuspended = currentBusiness?.status === 'Askıya Alındı';
    const isBlocked = isLicenseExpired || isSuspended;

    if (!isBlocked) return <>{children}</>;

    return (
        <div className="fixed inset-0 z-[9999] bg-background/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center">
            <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring", damping: 20 }}
                className="max-w-md w-full space-y-10"
            >
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="w-28 h-28 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center shadow-2xl shadow-red-500/10">
                        {isSuspended ? (
                             <RefreshCw className="w-14 h-14 text-red-500 animate-[spin_4s_linear_infinite]" />
                        ) : (
                             <ShieldAlert className="w-14 h-14 text-red-500" />
                        )}
                    </div>
                </div>

                {/* Text */}
                <div className="space-y-4">
                    <p className="text-[10px] font-black text-primary uppercase tracking-[0.3em]">
                        {isSuspended ? 'Hizmet Duraklatıldı' : 'Lisans Süresi Doldu'}
                    </p>
                    <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase italic leading-tight">
                        {isSuspended ? 'Erişim\nKısıtlandı' : 'Sistem Erişimi\nKısıtlandı'}
                    </h1>
                    <p className="text-gray-500 text-sm font-bold leading-relaxed max-w-xs mx-auto">
                        <span className="text-primary font-black">{currentBusiness?.name}</span> işletmesinin
                        {isSuspended 
                            ? ' Aura SaaS hesabı yönetim tarafından askıya alınmıştır. Detaylar için merkez ile iletişime geçin.' 
                            : ' Aura SaaS lisansı sona ermiştir. Erişimi yenilemek için aboneliğinizi güncelleyin.'}
                    </p>
                </div>

                {/* Status info */}
                <div className="bg-white/50 border border-gray-100 rounded-3xl p-6 space-y-3 text-left shadow-sm backdrop-blur-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">İşletme</span>
                        <span className="text-xs font-black text-gray-900">{currentBusiness?.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Mevcut Durum</span>
                        <span className={`text-xs font-black ${isSuspended ? 'text-amber-600' : 'text-primary'}`}>{currentBusiness?.status}</span>
                    </div>
                    <div className="flex justify-between items-center border-t border-gray-50 pt-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                            {isSuspended ? 'Sebep' : 'Vade Tarihi'}
                        </span>
                        <span className="text-xs font-black text-gray-400">
                            {isSuspended ? 'Yönetim Kararı' : `${currentBusiness?.expiryDate} (Geçti)`}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <a
                        href="mailto:info@aurasaas.com?subject=Lisans%20Hakkında"
                        className="w-full bg-primary text-white py-5 px-10 rounded-3xl font-black text-xs uppercase tracking-[0.15em] flex items-center justify-center gap-3 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-primary/20"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Platform Destek Merkezi
                    </a>
                    <button
                        onClick={() => logout()}
                        className="w-full py-4 rounded-3xl font-black text-xs uppercase tracking-widest text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all flex items-center justify-center gap-2"
                    >
                        <LogOut className="w-4 h-4" />
                        Çıkış Yap
                    </button>
                </div>

                <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">
                    Aura SaaS Lisans Modülü • Altyapı Güvenliği Aktif
                </p>
            </motion.div>
        </div>
    );
}
