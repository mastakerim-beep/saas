"use client";

import { useStore } from "@/lib/store";
import { useRouter, usePathname } from "next/navigation";
import { useEffect, useState, useMemo } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import LicenseGuard from "@/components/LicenseGuard";
import { Inter } from "next/font/google";

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

export default function ClientWrapper({ children }: { children: React.ReactNode }) {
    const { 
        currentUser, 
        isImpersonating, 
        impersonatedBusinessId, 
        allBusinesses, 
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
            if (!currentUser) {
                setIsChecking(false);
                if (!isLoginPath) {
                    router.push("/login");
                }
                return;
            }

            if (currentUser) {
                if (isSaaSOwner) {
                    if (isLoginPath || isRootPath) {
                        router.push("/admin");
                    } else if (pathname === "/dashboard" || pathname === "/settings" || (isSuperAdminPath && pathname !== "/admin")) {
                        router.push("/admin");
                    }
                } else if (userBiz) {
                    const tenantPath = `/${userBiz.slug}`;
                    if (isRootPath || isLoginPath) {
                        router.push(`${tenantPath}/dashboard`);
                    } else if (isSuperAdminPath || (!pathname.startsWith(tenantPath) && !pathname.includes("/api/"))) {
                        router.push(`${tenantPath}/dashboard`);
                    }
                } else {
                    // Veri henüz yüklenmemişse veya businesses listesinde eşleşme bulunamadıysa (Loop Rescue)
                    console.log("Business data pending or mismatch, waiting...");
                }
                setIsChecking(false);
            }
        }, 100);

        // EXTRA PROTECT: 3 Saniyelik 'Loop Rescue' Zamanlayıcısı
        const rescueTimer = setTimeout(() => {
            if (currentUser && !userBiz && !isSaaSOwner && !isChecking) {
                console.warn("RESCUE: Data fetch taking too long, forcing internal initialization check.");
                // Burada kullanıcıya bir 'Tekrar Dene' butonu da gösterebiliriz veya 
                // işletme slug'ı biliniyorsa doğrudan oraya itebiliriz.
            }
        }, 3000);

        return () => {
            clearTimeout(timer);
            clearTimeout(rescueTimer);
        };
    }, [isMounted, currentUser, isLoginPath, isRootPath, isSuperAdminPath, isSaaSOwner, router, userBiz, pathname]);

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

    // Super admin dashboard view
    if (isSuperAdminPath && isSaaSOwner && !isImpersonating) {
        return (
            <div className={`${inter.className} bg-[#0a0a0a] min-h-screen overflow-y-auto`}>
                {children}
            </div>
        );
    }

    // Default: Regular business user panel OR Impersonation View
    return (
        <LicenseGuard>
            <div className={`${inter.className} bg-[#F5F5F7] text-gray-900 flex flex-col h-screen overflow-hidden`}>
                {isImpersonating && (
                    <ImpersonationBanner 
                        bizName={impersonatedBiz?.name} 
                        onExit={onExitImpersonation} 
                    />
                )}
                <div className="flex flex-1 h-screen overflow-hidden">
                    <Sidebar />
                    <div className="flex-1 flex flex-col h-screen overflow-hidden min-w-0">
                        <Header />
                        <main className="flex-1 overflow-y-auto w-full relative">
                            {children}
                        </main>
                    </div>
                </div>
            </div>
        </LicenseGuard>
    );
}
