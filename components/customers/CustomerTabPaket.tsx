"use client";

import { motion } from 'framer-motion';
import { Package as PackageIcon, Calendar, Printer } from 'lucide-react';
import { Package } from '@/lib/store';

interface CustomerTabPaketProps {
    pkgs: Package[];
}

export function CustomerTabPaket({ pkgs }: CustomerTabPaketProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden group">
                <div className="flex justify-between items-center mb-10 border-b border-gray-50 pb-8">
                    <div>
                        <h3 className="text-2xl font-black italic tracking-tighter uppercase italic">Satın Alınan Paketler</h3>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">Müşteriye Tanımlı Aktif Seanslar</p>
                    </div>
                    <div className="flex gap-4">
                         <div className="px-6 py-3 bg-indigo-50 text-indigo-600 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-indigo-100">
                            Toplam Paket: {pkgs.length}
                         </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {pkgs.length === 0 ? (
                        <div className="col-span-2 py-32 text-center bg-gray-50/50 rounded-[3rem] border border-dashed border-gray-200">
                            <PackageIcon className="w-16 h-16 text-gray-200 mx-auto mb-4" />
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.3em]">Aktif Paket Bulunmamaktadır</p>
                        </div>
                    ) : (
                        pkgs.map((pkg: Package) => {
                            const remaining = pkg.totalSessions - (pkg.usedSessions || 0);
                            const progress = ((pkg.usedSessions || 0) / pkg.totalSessions) * 100;
                            return (
                                <div key={pkg.id} className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-lg hover:shadow-indigo-600/5 transition-all group relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                        <PackageIcon size={120} className="text-indigo-600" />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="flex justify-between items-start mb-8">
                                            <div>
                                                <h4 className="text-xl font-black italic tracking-tighter uppercase text-gray-900 leading-none mb-2">{pkg.name}</h4>
                                                <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">{pkg.serviceName || 'Genel Hizmet Paketi'}</p>
                                            </div>
                                            <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${remaining > 0 ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                                                {remaining > 0 ? 'AKTİF' : 'TÜKENDİ'}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4 mb-10">
                                            <div className="text-center p-4 bg-gray-50 rounded-2xl">
                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">TOPLAM</p>
                                                <p className="text-xl font-black italic text-gray-900">{pkg.totalSessions}</p>
                                            </div>
                                            <div className="text-center p-4 bg-gray-50 rounded-2xl">
                                                <p className="text-[8px] font-black text-gray-400 uppercase mb-1">KULLANILAN</p>
                                                <p className="text-xl font-black italic text-indigo-600">{pkg.usedSessions || 0}</p>
                                            </div>
                                            <div className="text-center p-4 bg-indigo-600 rounded-2xl shadow-xl shadow-indigo-100">
                                                <p className="text-[8px] font-black text-white/60 uppercase mb-1">KALAN</p>
                                                <p className="text-xl font-black italic text-white">{remaining}</p>
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-end mb-1">
                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Kullanım İlerlemesi</p>
                                                <p className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">%{progress.toFixed(0)}</p>
                                            </div>
                                            <div className="h-4 bg-gray-100 rounded-full overflow-hidden p-1 shadow-inner">
                                                <motion.div 
                                                    initial={{ width: 0 }} 
                                                    animate={{ width: `${progress}%` }}
                                                    className="h-full bg-gradient-to-r from-indigo-500 to-indigo-700 rounded-full shadow-sm"
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center">
                                             <div className="flex items-center gap-2">
                                                 <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                                 <p className="text-[9px] font-bold text-gray-400 uppercase tracking-tight">Kayıt: {pkg.createdAt?.split('T')[0] || '---'}</p>
                                            </div>
                                            <button className="p-3 bg-gray-50 hover:bg-white border border-gray-100 hover:border-indigo-600 rounded-xl text-gray-400 hover:text-indigo-600 transition-all">
                                                <Printer size={16} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </motion.div>
    );
}
