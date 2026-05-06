"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";

export default function Home() {
  const router = useRouter();
  const { currentUser, currentBusiness } = useStore();

  useEffect(() => {
    // Smart Redirection Logic
    if (!currentUser) {
      router.push("/login");
      return;
    }

    // 1. Superadmin Redirection
    if (currentUser.role === 'SaaS_Owner' || currentUser.email === 'kerim@mail.com') {
      router.push("/admin");
      return;
    }

    // 2. Business User Redirection (Sub-agents)
    if (currentBusiness?.slug) {
      router.push(`/${currentBusiness.slug}/calendar`);
    } else {
      // Fallback if no slug found
      router.push("/login");
    }
  }, [router, currentUser, currentBusiness]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
