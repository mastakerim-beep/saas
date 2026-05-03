"use client";

import { motion } from 'framer-motion';
import { CreditCard, Sparkles, Star } from 'lucide-react';
import { Customer } from '@/lib/store';

interface CustomerTabPuanProps {
    customer: Customer;
    wallet: any;
    walletTransactions: any[];
    onLoadWallet: (amt: number) => void;
}

export function CustomerTabPuan({
    customer,
    wallet,
    walletTransactions,
    onLoadWallet
}: CustomerTabPuanProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Wallet Balance Card */}
                <div className="bg-indigo-600 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-600/30 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:scale-110 transition-transform">
                        <CreditCard size={160} />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-md">
                                <CreditCard className="w-6 h-6" />
                            </div>
                            <div className="px-4 py-1.5 bg-white/20 rounded-full border border-white/30 backdrop-blur-md text-[10px] font-black uppercase tracking-widest">
                                Müşteri Cüzdanı
                            </div>
                        </div>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-1">Cüzdan Bakiyesi</p>
                        <h3 className="text-5xl font-black italic tracking-tighter mb-10">
                            ₺{wallet?.balance?.toLocaleString('tr-TR') || '0,00'}
                        </h3>
                        <div className="flex gap-4">
                            <button 
                                onClick={() => {
                                    const amt = prompt('Yüklenecek tutarı giriniz (TL):');
                                    if (amt && !isNaN(Number(amt))) {
                                        onLoadWallet(Number(amt));
                                    }
                                }}
                                className="px-6 py-3 bg-white text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-50 transition-all"
                            >
                                Bakiye Yükle
                            </button>
                            <button className="px-6 py-3 bg-indigo-500 text-white border border-white/20 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-400 transition-all">
                                İşlem Geçmişi
                            </button>
                        </div>
                    </div>
                </div>

                {/* Loyalty Points Card */}
                <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform">
                        <Sparkles size={160} className="text-indigo-600" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex justify-between items-center mb-10">
                            <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-amber-500">
                                <Star className="w-6 h-6 fill-amber-500" />
                            </div>
                            <div className="px-4 py-1.5 bg-amber-50 rounded-full border border-amber-100 text-[10px] font-black uppercase tracking-widest text-amber-600">
                                Aura Sadakat
                            </div>
                        </div>
                        <p className="text-gray-400 text-[10px] font-black uppercase tracking-widest mb-1">Biriken Puan</p>
                        <h3 className="text-5xl font-black italic tracking-tighter mb-10 text-gray-900">
                            {wallet?.loyaltyPoints || 0} <span className="text-xl text-gray-400 not-italic ml-2">PUAN</span>
                        </h3>
                        <div className="flex gap-4">
                            <div className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Statü</p>
                                <p className="text-sm font-black text-indigo-600 uppercase tracking-tight">Gümüş Üye</p>
                            </div>
                            <div className="flex-1 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Gelecek Ödül</p>
                                <p className="text-sm font-black text-gray-900 uppercase tracking-tight italic">500 Puan Kaldı</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Transactions Table */}
            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-10 border-b border-gray-50">
                    <h4 className="text-xl font-black italic tracking-tighter uppercase mb-1">İşlem Hareketleri</h4>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cüzdan ve Puan Geçmişi</p>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#FBFCFF] text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-10 py-6 text-left font-black">Tarih</th>
                                <th className="px-10 py-6 text-left font-black">İşlem Tipi</th>
                                <th className="px-10 py-6 text-left font-black">Açıklama</th>
                                <th className="px-10 py-6 text-right font-black">Tutar / Puan</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {walletTransactions.map((tx: any) => (
                                <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-10 py-6 text-sm font-bold text-gray-600">
                                        {new Date(tx.createdAt || '').toLocaleDateString('tr-TR')}
                                    </td>
                                    <td className="px-10 py-6">
                                        <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${
                                            tx.type === 'LOAD' ? 'bg-green-50 text-green-600 border-green-100' :
                                            tx.type === 'SPEND' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                            'bg-amber-50 text-amber-600 border-amber-100'
                                        }`}>
                                            {tx.type}
                                        </span>
                                    </td>
                                    <td className="px-10 py-6 text-sm font-bold text-gray-900 italic">
                                        {tx.description}
                                    </td>
                                    <td className="px-10 py-6 text-right font-black text-lg italic tracking-tight">
                                        {tx.type === 'LOAD' ? '+' : '-'} ₺{tx.amount?.toLocaleString('tr-TR')}
                                    </td>
                                </tr>
                            ))}
                            {walletTransactions.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs italic">
                                        Henüz bir işlem hareketi bulunmamakta
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
