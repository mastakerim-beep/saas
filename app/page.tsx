"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { currentUser, currentBusiness, isInitialized } = useStore();

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
    // 4. Critical: If user exists but slug is missing, WAIT. 
    // Do NOT redirect back to /login as that creates an infinite loop.
    // The StoreProvider/ClientWrapper will eventually resolve the business or show an error.
  }, [router, currentUser, currentBusiness, isInitialized]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
