"use client";

import { motion } from 'framer-motion';
import { Gift, Sparkles, Trash2, CheckCircle, Clock } from 'lucide-react';

interface CustomerTabKuponlarProps {
    coupons: any[];
    onAddCoupon: (code: string, value: number) => void;
}

export function CustomerTabKuponlar({ coupons, onAddCoupon }: CustomerTabKuponlarProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
            <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm relative overflow-hidden">
                 <div className="flex justify-between items-center mb-10 border-b border-gray-50 pb-8">
                     <div>
                         <h3 className="text-2xl font-black italic tracking-tighter uppercase italic text-shadow-sm">İmparatorluk Kuponları</h3>
                         <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">Özel Müşteri Sadakat Ödülleri</p>
                     </div>
                     <button 
                        onClick={async () => {
                            const code = prompt('Kupon Kodunu girin (örn: HEDIYE20):');
                            if (!code) return;
                            const value = prompt('İndirim Oranını girin (yüzde):');
                            if (!value) return;
                            onAddCoupon(code, Number(value));
                        }}
                        className="px-6 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-amber-200 flex items-center gap-2"
                    >
                        <Sparkles className="w-4 h-4" /> KUPON TANIMLA
                    </button>
                 </div>

                 <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {coupons.map((c: any) => (
                        <div key={c.id} className="p-6 bg-amber-50/50 border-2 border-dashed border-amber-200 rounded-[2rem] relative group hover:bg-amber-50 transition-all">
                            <div className="absolute top-4 right-4">
                                <Gift className="text-amber-300 w-10 h-10 opacity-20 group-hover:scale-110 transition-transform" />
                            </div>
                            <h4 className="text-xl font-black text-amber-700 italic tracking-tighter mb-1 uppercase">{c.code}</h4>
                            <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-4">%{c.value} İNDİRİM</p>
                            <div className="flex items-center gap-2 text-[8px] font-black text-gray-400 uppercase tracking-widest">
                                <Clock className="w-3 h-3" /> SKT: {c.expiryDate || '---'}
                            </div>
                            <div className="mt-4 pt-4 border-t border-amber-100 flex justify-between items-center">
                                <span className="text-[9px] font-black text-green-600 bg-green-50 px-2 py-0.5 rounded uppercase">AKTİF</span>
                                <button className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                            </div>
                        </div>
                    ))}
                    {coupons.length === 0 && (
                        <div className="col-span-3 py-20 text-center bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                             <Gift className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                             <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest italic">Henüz bu danışana özel kupon tanımlanmadı</p>
                        </div>
                    )}
                 </div>
            </div>
        </motion.div>
    );
}
