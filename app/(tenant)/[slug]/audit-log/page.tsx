"use client";

import { useStore } from '@/lib/store';
import { ShieldCheck, Download, Clock, User as UserIcon } from 'lucide-react';

export default function AuditLogPage() {
    const { allLogs } = useStore();

    return (
        <div className="p-8 max-w-[1400px] mx-auto animate-[fadeIn_0.3s_ease]">
            <div className="flex justify-between items-end mb-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-1 text-gray-900">Güvenlik Logları</h1>
                    <p className="text-gray-500 text-sm font-semibold">Randevu ve kurgulardaki tüm değişiklikleri anlık izleyin (Anti-Fraud Aracı)</p>
                </div>
                <button className="border border-gray-200 bg-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-gray-50 transition">
                    <Download className="w-4 h-4"/> Rapor İndir
                </button>
            </div>
            
            <div className="card-apple overflow-hidden border border-gray-200 rounded-3xl shadow-sm bg-white">
                <div className="bg-gray-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
                    <h3 className="font-bold flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-indigo-500"/> İşlem Geçmişi Dökümü ({allLogs.length})
                    </h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead className="bg-gray-50/80 text-gray-500 text-[11px] font-bold uppercase tracking-wider border-b border-gray-100">
                            <tr>
                                <th className="p-4">Tarih</th>
                                <th className="p-4">Danışan / Konu</th>
                                <th className="p-4">İşlem</th>
                                <th className="p-4">Eski Değer</th>
                                <th className="p-4 font-bold text-gray-900 bg-gray-50">Yeni Değer</th>
                                <th className="p-4">Düzenleyen</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {allLogs.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="p-20 text-center text-gray-400 font-bold">Henüz log kaydı yok</td>
                                </tr>
                            ) : (
                                allLogs.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="p-4 text-gray-500 font-medium">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5" />
                                                {log.date}
                                            </div>
                                        </td>
                                        <td className="p-4 font-bold text-gray-900">{log.customerName}</td>
                                        <td className="p-4">
                                            <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                                                log.action.includes('İptal') ? 'bg-red-100 text-red-700' : 
                                                log.action.includes('Ödeme') ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                                            }`}>
                                                {log.action}
                                            </span>
                                        </td>
                                        <td className="p-4 text-gray-400 font-semibold">{log.oldValue || '-'}</td>
                                        <td className={`p-4 font-black ${
                                            log.newValue?.includes('İptal') ? 'bg-red-50 text-red-600' : 
                                            log.newValue?.includes('Tamamlandı') ? 'bg-green-50 text-green-600' : 'bg-yellow-50 text-gray-900'
                                        }`}>
                                            {log.newValue}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                                                <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center">
                                                    <UserIcon className="w-3 h-3" />
                                                </div>
                                                {log.user}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
