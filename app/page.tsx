"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { currentUser, currentBusiness, isInitialized } = useStore();
  const [showFallback, setShowFallback] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (isInitialized && currentUser && !currentBusiness?.slug) {
        setShowFallback(true);
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [isInitialized, currentUser, currentBusiness]);

  useEffect(() => {
    // 1. If no user, definitely go to login
    if (isInitialized && !currentUser) {
      router.push("/login");
      return;
    }

    if (!isInitialized) return;

    // 2. Superadmin Redirection
    if (currentUser?.role === 'SaaS_Owner' || currentUser?.email === 'kerim@mail.com') {
      router.push("/admin");
      return;
    }

    // 3. Business User Redirection (Sub-agents)
    if (currentBusiness?.slug) {
      router.push(`/${currentBusiness.slug}/calendar`);
    } 
  }, [router, currentUser, currentBusiness, isInitialized]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6 text-center">
       {!showFallback ? (
         <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
       ) : (
         <div className="max-w-md animate-in fade-in slide-in-from-bottom-4 duration-700">
           <h2 className="text-2xl font-black text-gray-900 mb-2">Oturum Açıldı</h2>
           <p className="text-gray-500 text-sm mb-8">İşletme bilgileriniz yükleniyor. Eğer yönlendirme gerçekleşmezse aşağıdaki butona tıklayabilirsiniz.</p>
           <button 
             onClick={() => router.push('/login')} 
             className="bg-primary text-white px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-primary/20 transition-all"
           >
             Panele Devam Et
           </button>
         </div>
       )}
    </div>
  );
}
