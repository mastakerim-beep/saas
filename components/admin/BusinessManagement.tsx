"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Shield, Lock, Unlock, AlertCircle, CheckCircle, Search, MoreVertical, Globe, Calendar } from 'lucide-react';
import { useStore, Business } from '@/lib/store';
import { BillingService } from '@/lib/services/billing-service';

export function BusinessManagement() {
    const { allBusinesses, fetchAllBusinesses, addLog } = useStore();
    const [search, setSearch] = useState('');
    const [isUpdating, setIsUpdating] = useState<string | null>(null);

    const filtered = allBusinesses.filter((b: Business) => 
        b.name.toLowerCase().includes(search.toLowerCase()) || 
        b.slug?.toLowerCase().includes(search.toLowerCase())
    );

    const handleToggleLock = async (business: Business) => {
        setIsUpdating(business.id);
        try {
            if ((business as any).isSuspended) {
                await BillingService.reactivateBusiness(business.id);
                addLog('İşletme Kilidi Açıldı', business.name, 'Kilitli', 'Aktif');
            } else {
                await BillingService.suspendBusiness(business.id, 'Yönetici tarafından manuel askıya alma.');
                addLog('İşletme Askıya Alındı', business.name, 'Aktif', 'Askıda');
            }
            // Refresh data
            if (fetchAllBusinesses) await fetchAllBusinesses();
        } catch (error) {
            console.error("Lock toggle failed:", error);
            alert("İşlem başarısız oldu.");
        } finally {
            setIsUpdating(null);
        }
    };

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end gap-8">
                <div>
                    <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">İşletme Yönetimi</h2>
                    <p className="text-[10px] font-black text-rose-500 uppercase tracking-widest mt-1">SaaS Global Kontrol Paneli</p>
                </div>
                <div className="relative w-64">
                    <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input 
                        type="text" 
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="İşletme ara..."
                        className="w-full bg-white border border-gray-100 rounded-2xl pl-12 pr-4 py-3 text-sm font-bold outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                    />
                </div>
            </div>

            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="bg-gray-50/50 border-b border-gray-50">
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">İşletme</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Plan & Durum</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Son Ödeme</th>
                            <th className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filtered.map((biz: any) => (
                            <tr key={biz.id} className="hover:bg-gray-50/30 transition-colors group">
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${biz.isSuspended ? 'bg-rose-50 text-rose-500' : 'bg-indigo-50 text-indigo-600'}`}>
                                            {biz.name.charAt(0)}
                                        </div>
                                        <div>
                                            <p className="font-black text-gray-900 tracking-tight uppercase italic">{biz.name}</p>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Globe size={10} className="text-gray-400" />
                                                <span className="text-[10px] font-bold text-gray-400">/{biz.slug}</span>
                                            </div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-3">
                                        <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                            biz.plan === 'Aura Enterprise' ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                        }`}>
                                            {biz.plan}
                                        </span>
                                        <span className={`flex items-center gap-1 text-[9px] font-black uppercase tracking-widest ${
                                            biz.isSuspended ? 'text-rose-500' : 'text-emerald-500'
                                        }`}>
                                            {biz.isSuspended ? <AlertCircle size={10} /> : <CheckCircle size={10} />}
                                            {biz.isSuspended ? 'KİLİTLİ' : 'AKTİF'}
                                        </span>
                                    </div>
                                </td>
                                <td className="px-8 py-6">
                                    <div className="flex items-center gap-2 text-gray-500">
                                        <Calendar size={14} />
                                        <span className="text-xs font-bold">{biz.expiryDate || 'Belirtilmedi'}</span>
                                    </div>
                                </td>
                                <td className="px-8 py-6 text-right">
                                    <button 
                                        onClick={() => handleToggleLock(biz)}
                                        disabled={isUpdating === biz.id}
                                        className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                                            biz.isSuspended 
                                                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600' 
                                                : 'bg-rose-500 text-white shadow-lg shadow-rose-500/20 hover:bg-rose-600'
                                        } disabled:opacity-50`}
                                    >
                                        {isUpdating === biz.id ? 'İŞLENİYOR...' : biz.isSuspended ? (
                                            <div className="flex items-center gap-2"><Unlock size={12} /> KİLİDİ AÇ</div>
                                        ) : (
                                            <div className="flex items-center gap-2"><Lock size={12} /> ASKIYA AL</div>
                                        )}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
