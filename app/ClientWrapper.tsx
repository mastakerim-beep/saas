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
    const isGlobal = announcement.isGlobal;
    const bgColor = isGlobal ? 'bg-indigo-800' :
        announcement.type === 'warning' ? 'bg-amber-500' : 
        announcement.type === 'danger' ? 'bg-rose-600' : 
        announcement.type === 'success' ? 'bg-emerald-600' : 'bg-indigo-600';
    
    return (
        <div className={`${bgColor} text-white px-8 py-3 flex items-center justify-between sticky top-0 z-[9998] shadow-lg border-b border-white/10`}>
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest">
                <div className="bg-white/20 p-1.5 rounded-lg"><Megaphone size={14} /></div>
                <div className="flex flex-col">
                    <span className="opacity-60 text-[8px] tracking-[0.2em]">{isGlobal ? 'SİSTEM GENELİ' : 'İŞLETME DUYURUSU'}</span>
                    <span>{announcement.title}: <span className="opacity-80 ml-2">{announcement.content}</span></span>
                </div>
            </div>
            <div className="flex items-center gap-4">
                <span className="text-[8px] opacity-40 font-black tracking-widest uppercase">AURA OS</span>
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
        isInitialized,
        currentBusiness,
        syncStatus,
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
                    if (syncStatus === 'idle' || syncStatus === 'error') {
                        setIsChecking(false);
                    }
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
                    if (syncStatus === 'idle' || syncStatus === 'error') {
                        setIsChecking(false);
                    }
                } else if (allBusinesses.length > 0) {
                    // Veri yüklendi ama hala eşleşme yoksa (yeni üyelik veya veri hatası)
                    // Kullanıcıyı içeri sok ama dashboard'a zorlama, isChecking'i kapat
                    setIsChecking(false);
                }
            }
        }, 100);

        // EXTRA PROTECT: 3 Saniyelik 'Safety Timeout'
        // Veriler veya doğrulamalar ne kadar gecikirse geciksin, 3 saniye sonra ekranı açar.
        const safetyTimer = setTimeout(() => {
            if (isChecking) {
                console.warn("SAFETY TIMEOUT: Forced UI unlock after 3 seconds.");
                setIsChecking(false);
            }
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearTimeout(safetyTimer);
        };
    }, [isMounted, currentUser, isLoginPath, isRootPath, isSuperAdminPath, isSaaSOwner, router, userBiz, pathname, isInitialized, isChecking, syncStatus]);

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
                
                {/* Duyuru Hiyerarşisi */}
                <div className="flex flex-col">
                    {/* 1. Global (SuperAdmin) Duyuruları */}
                    {allNotifs?.filter((n: any) => n.isActive && !n.businessId).map((n: any, i: number) => (
                        <AnnouncementBanner key={`global-${i}`} announcement={{ ...n, isGlobal: true }} />
                    ))}
                    
                    {/* 2. Yerel (İşletme/Şube) Duyuruları */}
                    {allNotifs?.filter((n: any) => n.isActive && n.businessId === currentBusiness?.id).map((n: any, i: number) => (
                        <AnnouncementBanner key={`local-${i}`} announcement={n} />
                    ))}
                </div>
                
                <div className="flex flex-1 overflow-hidden relative">
                    {/* SOVEREIGN MODE: Under Command Center view, we bypass global sidebar and header */}
                    {isSuperAdminPath && !isImpersonating ? (
                        <div className="flex-1 flex flex-col min-w-0 relative h-full">
                            <main className="flex-1 overflow-y-auto w-full relative">
                                {children}
                            </main>
                        </div>
                    ) : (
                        <>
                            <Sidebar />
                            <div className="flex-1 flex flex-col min-w-0 bg-white/50 backdrop-blur-sm relative">
                                <Header />
                                <main className="flex-1 overflow-y-auto w-full relative custom-scrollbar">
                                    <div className="h-full w-full">
                                        {children}
                                    </div>
                                </main>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </LicenseGuard>
    );
}
