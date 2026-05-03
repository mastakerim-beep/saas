"use client";

import { motion } from 'framer-motion';
import { Plus, Download, Trash2 } from 'lucide-react';
import { Quote } from '@/lib/store';

interface CustomerTabTeklifProps {
    customerQuotes: Quote[];
    onAddQuote: () => void;
    onDeleteQuote: (id: string) => void;
    onDownloadPDF: (quote: Quote) => void;
}

export function CustomerTabTeklif({
    customerQuotes,
    onAddQuote,
    onDeleteQuote,
    onDownloadPDF
}: CustomerTabTeklifProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                    <h3 className="text-xl font-black italic tracking-tighter uppercase italic">Teklifler</h3>
                    <button 
                        onClick={onAddQuote}
                        className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 flex items-center gap-2"
                    >
                        <Plus className="w-4 h-4" /> Yeni Teklif
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#FBFCFF] text-[10px] font-black uppercase text-gray-400 tracking-widest">
                            <tr>
                                <th className="px-8 py-5">Hizmet</th>
                                <th className="px-8 py-5">Tutar</th>
                                <th className="px-8 py-5">Durum</th>
                                <th className="px-8 py-5">Oluşturma</th>
                                <th className="px-8 py-5 text-right">İşlemler</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {customerQuotes.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-gray-300 font-black uppercase tracking-widest text-xs italic">Henüz teklif verilmedi</td>
                                </tr>
                            ) : (
                                customerQuotes.map((q: Quote) => (
                                    <tr key={q.id} className="hover:bg-gray-50/50 transition-all group">
                                        <td className="px-8 py-5 font-bold text-gray-900">{q.serviceName}</td>
                                        <td className="px-8 py-5 text-indigo-600 font-black tracking-widest text-sm">₺{q.amount?.toLocaleString('tr-TR')}</td>
                                        <td className="px-8 py-5">
                                            <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                q.status === 'Onaylandı' ? 'bg-green-50 text-green-600 border-green-100' :
                                                q.status === 'Reddedildi' ? 'bg-red-50 text-red-600 border-red-100' :
                                                'bg-gray-50 text-gray-400 border-gray-100'
                                            }`}>
                                                {q.status}
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                            {new Date(q.createdAt || '').toLocaleDateString('tr-TR')}
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <div className="flex justify-end gap-2 group-hover:opacity-100 transition-opacity">
                                                <button 
                                                    onClick={() => onDownloadPDF(q)}
                                                    className="p-2 bg-indigo-600 text-white rounded-lg shadow-md hover:scale-110 transition-all"
                                                >
                                                    <Download className="w-4 h-4" />
                                                </button>
                                                <button onClick={() => onDeleteQuote(q.id)} className="p-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </motion.div>
    );
}
