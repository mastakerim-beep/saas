"use client";

import { motion } from 'framer-motion';
import { ChevronRight, Plus, ArrowDownRight, FileText, Edit2, Clock, TrendingUp } from 'lucide-react';
import { Payment, Branch } from '@/lib/store';

interface CustomerTabSatisProps {
    payments: Payment[];
    currentBranch: Branch | null;
    totalSpent: number;
}

export function CustomerTabSatis({ payments, currentBranch, totalSpent }: CustomerTabSatisProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase">Satışlar</h3>
                    <div className="relative group/menu">
                        <button className="px-5 py-2.5 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 shadow-sm focus:outline-none">
                            İşlemler <ChevronRight className="w-4 h-4 rotate-90 group-focus-within/menu:-rotate-90 transition-transform" />
                        </button>
                        <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-focus-within/menu:opacity-100 group-focus-within/menu:visible transition-all z-[100] overflow-hidden transform origin-top-right scale-95 group-focus-within/menu:scale-100 p-2">
                            <button className="w-full px-4 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center gap-3"><Plus className="w-4 h-4" /> Yeni Satış / Paket</button>
                            <button className="w-full px-4 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-green-50 hover:text-green-600 rounded-xl transition-colors flex items-center gap-3"><ArrowDownRight className="w-4 h-4 text-green-500" /> Tahsilat Gir</button>
                            <div className="my-1 border-t border-gray-50"></div>
                            <button className="w-full px-4 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><FileText className="w-4 h-4" /> Excel'e Aktar</button>
                        </div>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#FBFCFF] text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                            <tr>
                                <th className="px-8 py-5">Tarih</th>
                                <th className="px-8 py-5">Referans Kodu</th>
                                <th className="px-8 py-5">Detaylar</th>
                                <th className="px-8 py-5">Satış Toplamı</th>
                                <th className="px-8 py-5">Nakit</th>
                                <th className="px-8 py-5">Kredi Kartı</th>
                                <th className="px-8 py-5">Banka Hesabı</th>
                                <th className="px-8 py-5">Bakiye</th>
                                <th className="px-8 py-5">Toplam Tahsilat</th>
                                <th className="px-8 py-5 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {payments.map((p: Payment) => (
                                <tr key={p.id} className="hover:bg-gray-50/50 transition-all font-bold text-gray-600 group">
                                    <td className="px-8 py-5 text-sm">
                                        {p.date}
                                        {p.createdAt && (
                                            <p className="text-[9px] text-gray-400 font-bold uppercase mt-1">
                                                <Clock className="w-2 h-2 inline mr-1" /> {new Date(p.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                            </p>
                                        )}
                                    </td>
                                    <td className="px-8 py-5 text-sm text-gray-400">#P{p.id.split('-')[0].toUpperCase()}</td>
                                    <td className="px-8 py-5 max-w-[200px]">
                                        <p className="text-[10px] font-black uppercase text-gray-900">{currentBranch?.name || 'Aura İşletme'}</p>
                                        <div className="flex flex-col gap-1 mt-1">
                                            <span className="text-[9px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded italic">1x {p.service}</span>
                                        </div>
                                    </td>
                                    <td className="px-8 py-5">
                                        <span className="inline-block bg-cyan-400 text-white px-3 py-1 rounded-md text-[10px] font-black tracking-widest shadow-sm">₺{p.totalAmount.toLocaleString('tr-TR')} TRY</span>
                                    </td>
                                    <td className="px-8 py-5 text-sm">{p.methods.some((m: any) => m.method === 'nakit') ? `₺${p.totalAmount.toLocaleString('tr-TR')} TRY` : ''}</td>
                                    <td className="px-8 py-5 text-sm">{p.methods.some((m: any) => m.method === 'kredi-karti') ? `₺${p.totalAmount.toLocaleString('tr-TR')} TRY` : ''}</td>
                                    <td className="px-8 py-5 text-sm">{p.methods.some((m: any) => m.method === 'havale' || m.method === 'banka') ? `₺${p.totalAmount.toLocaleString('tr-TR')} TRY` : ''}</td>
                                    <td className="px-8 py-5"></td>
                                    <td className="px-8 py-5">
                                        <span className="inline-block bg-green-600 text-white px-3 py-1 rounded-md text-[10px] font-black tracking-widest shadow-sm">₺{p.totalAmount.toLocaleString('tr-TR')} TRY</span>
                                    </td>
                                    <td className="px-8 py-5 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100">
                                            <button className="p-2 bg-green-600 text-white rounded-lg"><FileText className="w-4 h-4" /></button>
                                            <button className="p-2 bg-white border border-gray-100 rounded-lg"><Edit2 className="w-4 h-4 text-gray-400" /></button>
                                            <button className="p-2 bg-white border border-gray-100 rounded-lg"><ChevronRight className="w-4 h-4 text-gray-300" /></button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="bg-[#FBFCFF] p-8 grid grid-cols-2 gap-8 border-t border-gray-100">
                     <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><ArrowDownRight className="w-4 h-4 text-red-500" /> Toplam Tahsilat</p>
                         <p className="text-3xl font-black italic italic tracking-tighter text-indigo-700">₺{totalSpent.toLocaleString('tr-TR')}</p>
                     </div>
                     <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm">
                         <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-green-500" /> Toplam Satış</p>
                         <p className="text-3xl font-black italic tracking-tighter text-indigo-700">₺{totalSpent.toLocaleString('tr-TR')}</p>
                     </div>
                </div>
            </div>
        </motion.div>
    );
}
