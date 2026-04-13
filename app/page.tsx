"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    // Client-side fallback if ClientWrapper redirection didn't fire
    router.push("/login");
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
       <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin" />
    </div>
  );
}
