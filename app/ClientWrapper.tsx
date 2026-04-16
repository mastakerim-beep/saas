"use client";

import { useStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/layout/Sidebar";
import Header from "@/components/layout/Header";
import LicenseGuard from "@/components/layout/LicenseGuard";
import { Inter } from "next/font/google";
import { Megaphone } from "lucide-react";

const inter = Inter({ subsets: ["latin"] });

const ImpersonationBanner = ({ 
    bizName, 
    onExit 
}: { 
    bizName?: string; 
    onExit: () => void 
}) => (
    <div className="bg-red-600 text-white px-6 py-2 flex justify-between items-center sticky top-0 z-[9999] shadow-2xl animate-pulse">
        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
            <span className="bg-white/20 p-1 rounded-md">TAKLİT MODU AKTİF</span>
            <span>Şu an <span className="underline">{bizName}</span> işletmesi olarak işlem yapıyorsunuz.</span>
        </div>
        <button 
            onClick={onExit}
            className="bg-white text-red-600 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase hover:bg-black hover:text-white transition-all shadow-lg"
        >
            MODDAN ÇIK VE KONSOLA DÖN
        </button>
    </div>
);

const AnnouncementBanner = ({ announcement }: { announcement: any }) => {
    const bgColor = 
        announcement.type === 'warning' ? 'bg-amber-500' : 
        announcement.type === 'danger' ? 'bg-rose-600' : 
        announcement.type === 'success' ? 'bg-emerald-600' : 'bg-indigo-600';
    
    return (
        <div className={`${bgColor} text-white px-8 py-3 flex items-center justify-between sticky top-0 z-[9998] shadow-lg`}>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                <div className="bg-white/20 p-1.5 rounded-lg"><Megaphone size={14} /></div>
                <span>{announcement.title}: <span className="opacity-80 ml-2">{announcement.content}</span></span>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-[8px] opacity-60 font-black">SİSTEM DUYURUSU</span>
            </div>
        </div>
    );
};

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const { 
        currentUser, 
        isImpersonating, 
        impersonatedBusinessId, 
        allBusinesses, 
        allNotifs,
        currentBusiness,
        isInitialized,
        setImpersonatedBusinessId 
    } = useStore();
    
    const router = useRouter();
    const pathname = usePathname();
    const [isChecking, setIsChecking] = useState(true);
    const [isMounted, setIsMounted] = useState(false);

    const isLoginPath = pathname === "/login";
    const isRootPath = pathname === "/";
    const isSuperAdminPath = pathname.startsWith("/admin");
    const isSaaSOwner = currentUser?.role === 'SaaS_Owner';

    const impersonatedBiz = useMemo(() => allBusinesses.find(b => b.id === impersonatedBusinessId), [allBusinesses, impersonatedBusinessId]);
    const userBiz = useMemo(() => allBusinesses.find(b => b.id === currentUser?.businessId), [allBusinesses, currentUser]);

    // 1. Initial Mount Check
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // 2. Routing Logic
    useEffect(() => {
        if (!isMounted) return;

        const timer = setTimeout(() => {
            if (!isInitialized) return;

            if (!currentUser) {
                if (!isLoginPath) {
                    router.push("/login");
                }
                setIsChecking(false);
                return;
            }

            if (currentUser) {
                if (isSaaSOwner) {
                    if (isLoginPath || isRootPath) {
                        router.push("/admin");
                    } else if (pathname === "/dashboard" || pathname === "/settings" || (isSuperAdminPath && pathname !== "/admin")) {
                        router.push("/admin");
                    }
                    setIsChecking(false);
                } else if (userBiz) {
                    const tenantPath = `/${userBiz.slug}`;
                    if (isRootPath || isLoginPath) {
                        router.push(`${tenantPath}/dashboard`);
                    } else if (isSuperAdminPath || (!pathname.startsWith(tenantPath) && !pathname.includes("/api/"))) {
                        // Intelligent subpath redirect (e.g. /calendar -> /slug/calendar)
                        const subPath = pathname.replace(/^\//, '');
                        const targetPath = subPath ? `${tenantPath}/${subPath}` : `${tenantPath}/dashboard`;
                        router.push(targetPath);
                    }
                    setIsChecking(false);
                } else {
                    // Veri henüz yüklenmemişse veya businesses listesinde eşleşme bulunamadıysa (Loop Rescue)
                    console.log("Business data pending or mismatch, waiting...");
                }
            }
        }, 100);

        // EXTRA PROTECT: 5 Saniyelik 'Safety Timeout'
        // Veriler veya doğrulamalar ne kadar gecikirse geciksin, 5 saniye sonra ekranı açar.
        const safetyTimer = setTimeout(() => {
            if (isChecking) {
                console.warn("SAFETY TIMEOUT: Forced UI unlock after 5 seconds.");
                setIsChecking(false);
            }
        }, 5000);

        return () => {
            clearTimeout(timer);
            clearTimeout(safetyTimer);
        };
    }, [isMounted, currentUser, isLoginPath, isRootPath, isSuperAdminPath, isSaaSOwner, router, userBiz, pathname, isInitialized, isChecking]);

    // ---- RENDER BODY ----
    
    // We strictly use a single return branch after hooks to avoid Error #310
    // The conditional rendering happens INSIDE the return.

    if (!isMounted) return null;

    const onExitImpersonation = () => {
        setImpersonatedBusinessId(null);
        router.push('/admin');
    };

    // If still checking, show loader
    if (isChecking && !isLoginPath) {
        return (
            <div className={`${inter.className} flex h-screen w-full items-center justify-center bg-[#050505] text-white font-black animate-pulse uppercase tracking-[0.3em] text-xs`}>
                Siber Güvenlik Katmanı Doğrulanıyor...
            </div>
        );
    }

    // If login path, show children
    if (isLoginPath) {
        return (
            <div className={inter.className}>
                {currentUser ? (
                    <div className="flex h-screen w-full items-center justify-center bg-[#050505] text-white font-black animate-pulse uppercase tracking-[0.3em] text-xs">
                        Oturum Yönlendiriliyor...
                    </div>
                ) : children}
            </div>
        );
    }

    // Default: Regular business user panel OR Impersonation View OR Super Admin View
    return (
        <LicenseGuard>
            <div className={`${inter.className} bg-[#F8F9FC] text-gray-900 flex flex-col h-screen overflow-hidden selection:bg-indigo-100 selection:text-indigo-900`}>
                {isImpersonating && (
                    <ImpersonationBanner 
                        bizName={impersonatedBiz?.name} 
                        onExit={onExitImpersonation} 
                    />
                )}
                
                {/* Global Announcements */}
                {allNotifs?.filter((n: any) => n.isActive && (!n.businessId || n.businessId === currentBusiness?.id)).map((n: any, i: number) => (
                    <AnnouncementBanner key={i} announcement={n} />
                ))}
                
                <div className="flex flex-1 overflow-hidden relative">
                    <Sidebar />
                    <div className="flex-1 flex flex-col min-w-0 bg-white/50 backdrop-blur-sm relative">
                        <Header />
                        <main className="flex-1 overflow-y-auto w-full relative custom-scrollbar">
                            <div className="h-full w-full">
                                {children}
                            </div>
                        </main>
                    </div>
                </div>
            </div>
        </LicenseGuard>
    );
}
