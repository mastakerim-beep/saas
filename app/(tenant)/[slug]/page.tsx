"use client";

import { useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';

export default function TenantIndexPage() {
    const router = useRouter();
    const params = useParams();
    const slug = params?.slug as string;

    useEffect(() => {
        if (slug) {
            router.replace(`/${slug}/dashboard`);
        }
    }, [slug, router]);

    return (
        <div className="min-h-screen bg-[#020210] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        </div>
    );
}
