"use client";

import { useState, useMemo } from 'react';
import { useStore, Quote } from '@/lib/store';
import { 
    Zap, Search, Plus, Filter, FileText, Download, 
    CheckCircle, X, Clock, ChevronRight, ArrowUpRight,
    TrendingUp, BarChart3, Users, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function QuotesPage() {
    const { quotes, customers, addQuote, updateQuote, deleteQuote, currentBranch } = useStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Hepsi');
    const [showAddModal, setShowAddModal] = useState(false);

    const filteredQuotes = useMemo(() => {
        return quotes.filter(q => {
            const matchesSearch = q.customerName.toLowerCase().includes(search.toLowerCase()) || 
                                q.serviceName?.toString().toLowerCase().includes(search.toLowerCase());
            const matchesStatus = statusFilter === 'Hepsi' || q.status === statusFilter;
            return matchesSearch && matchesStatus;
        }).sort((a,b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());
    }, [quotes, search, statusFilter]);

    const stats = useMemo(() => {
        const total = quotes.length;
        const approved = quotes.filter(q => q.status === 'Onaylandı').length;
        const pending = quotes.filter(q => q.status === 'Gönderildi' || q.status === 'Taslak').length;
        const totalValue = quotes.reduce((acc, q) => acc + (q.amount || 0), 0);
        return { total, approved, pending, totalValue, rate: total > 0 ? (approved/total * 100).toFixed(0) : 0 };
    }, [quotes]);

    const downloadPDF = (quote: Quote) => {
        const doc = new jsPDF() as any;
        
        // Premium Header
        doc.setFillColor(79, 70, 229); // Indigo-600
        doc.rect(0, 0, 210, 40, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.setFont('helvetica', 'bolditalic');
        doc.text('AURA SPA PRO', 20, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('HIZMET TEKLIF FORMU', 160, 25);
        
        // Quote Details
        doc.setTextColor(50, 50, 50);
        doc.setFontSize(12);
        doc.text(`Teklif No: #Q-${quote.id.split('-')[0].toUpperCase()}`, 20, 60);
        doc.text(`Tarih: ${new Date(quote.createdAt || '').toLocaleDateString('tr-TR')}`, 20, 68);
        doc.text(`Gecerlilik: ${quote.validUntil || '---'}`, 20, 76);
        
        // Customer Info
        doc.setFillColor(248, 249, 252);
        doc.rect(20, 85, 170, 30, 'F');
        doc.setTextColor(79, 70, 229);
        doc.setFontSize(10);
        doc.text('MUSTERI BILGILERI', 25, 92);
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.text(quote.customerName, 25, 105);
        
        // Table
        (doc as any).autoTable({
            startY: 125,
            head: [['Aciklama', 'Birim', 'Tutar']],
            body: [
                [quote.serviceName || 'Belirtilmedi', '1 Adet', `TL ${quote.amount?.toLocaleString('tr-TR')}`]
            ],
            theme: 'striped',
            headStyles: { fillColor: [79, 70, 229] },
            styles: { font: 'helvetica', fontSize: 10 }
        });
        
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        
        // Totals
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOPLAM TUTAR: TL ${quote.amount?.toLocaleString('tr-TR')}`, 130, finalY);
        
        // Terms
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text('NOTLAR VE SARTLAR:', 20, finalY + 40);
        doc.text('* Bu teklif belirtilen tarihe kadar gecerlidir.', 20, finalY + 46);
        doc.text('* Onaylanan teklifler randevu garantisi saglar.', 20, finalY + 52);
        
        doc.save(`Aura_Teklif_${quote.customerName.replace(/\s/g, '_')}.pdf`);
    };

    return (
        <div className="p-8 pb-32 max-w-[1600px] mx-auto min-h-screen">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12 px-4">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black tracking-tight mb-2 text-gray-900 leading-none uppercase italic">Teklif Yönetimi</h1>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] italic">Satış ve Teklif Takip Merkezi</p>
                </div>
                
                <div className="flex gap-4">
                     <div className="relative w-full md:w-[300px]">
                        <Search className="w-5 h-5 absolute left-5 top-4.5 text-gray-300" />
                        <input 
                            type="text" 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Müşteri veya hizmet ara..."
                            className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm shadow-sm transition-all outline-none focus:ring-2 focus:ring-indigo-100" 
                        />
                    </div>
                </div>
            </div>

            {/* Metrics Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12 px-4">
                {[
                    { label: 'Toplam Teklif', val: stats.total, sub: 'Son 30 gün', icon: FileText, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                    { label: 'Onay Oranı', val: `%${stats.rate}`, sub: 'Başarı yüzdesi', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
                    { label: 'Bekleyen', val: stats.pending, sub: 'Aksiyon bekleniyor', icon: Clock, color: 'text-amber-500', bg: 'bg-amber-50' },
                    { label: 'Teklif Hacmi', val: `₺${stats.totalValue.toLocaleString('tr-TR')}`, sub: 'Brüt potansiyel', icon: BarChart3, color: 'text-purple-600', bg: 'bg-purple-50' },
                ].map((m, i) => (
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                        key={m.label} className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm flex flex-col gap-4 relative overflow-hidden group hover:shadow-xl transition-all"
                    >
                        <div className={`w-12 h-12 ${m.bg} ${m.color} rounded-2xl flex items-center justify-center`}>
                            <m.icon className="w-6 h-6" />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{m.label}</p>
                            <h3 className="text-3xl font-black italic tracking-tighter uppercase mt-1">{m.val}</h3>
                            <p className="text-[10px] font-bold text-gray-400 mt-2">{m.sub}</p>
                        </div>
                        <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
                            <m.icon className="w-24 h-24" />
                        </div>
                    </motion.div>
                ))}
            </div>

            {/* Tabs / Filters */}
            <div className="flex gap-4 mb-8 px-4">
                {['Hepsi', 'Taslak', 'Gönderildi', 'Onaylandı', 'Reddedildi'].map(s => (
                    <button 
                        key={s} onClick={() => setStatusFilter(s)}
                        className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${statusFilter === s ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'bg-white text-gray-400 border border-gray-100 hover:bg-gray-50'}
                        `}
                    >
                        {s}
                    </button>
                ))}
            </div>

            {/* Quotes List Table */}
            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden mx-4">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-[#FBFCFF] text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-50">
                            <tr>
                                <th className="px-8 py-6">Müşteri</th>
                                <th className="px-8 py-6">Hizmet / Açıklama</th>
                                <th className="px-8 py-6">Teklif Tutarı</th>
                                <th className="px-8 py-6">Tarih</th>
                                <th className="px-8 py-6">Durum</th>
                                <th className="px-8 py-6 text-right">Aksiyonlar</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            <AnimatePresence>
                                {filteredQuotes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="py-32 text-center text-gray-300 font-black uppercase tracking-widest text-xs italic">Sonuç Bulunamadı</td>
                                    </tr>
                                ) : (
                                    filteredQuotes.map(q => (
                                        <motion.tr 
                                            layout key={q.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                                            className="hover:bg-gray-50/50 transition-all group"
                                        >
                                            <td className="px-8 py-6">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600 text-xs">
                                                        {q.customerName.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900 leading-tight uppercase italic">{q.customerName}</p>
                                                        <p className="text-[10px] font-bold text-gray-400">#Q-{q.id.split('-')[0].toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-sm font-bold text-gray-600">{q.serviceName || '---'}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className="inline-block bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest">₺{q.amount?.toLocaleString('tr-TR')}</span>
                                            </td>
                                            <td className="px-8 py-6">
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(q.createdAt || '').toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</p>
                                            </td>
                                            <td className="px-8 py-6">
                                                <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border ${
                                                    q.status === 'Onaylandı' ? 'bg-green-50 text-green-600 border-green-100' :
                                                    q.status === 'Reddedildi' ? 'bg-red-50 text-red-600 border-red-100' :
                                                    q.status === 'Gönderildi' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                                                    'bg-gray-50 text-gray-400 border-gray-100'
                                                }`}>
                                                    {q.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-right">
                                                <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                    <button 
                                                        onClick={() => downloadPDF(q)}
                                                        className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-110 transition-all"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    <button className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-indigo-600 transition-all">
                                                        <CheckCircle className="w-4 h-4" />
                                                    </button>
                                                    <button 
                                                        onClick={() => deleteQuote(q.id)}
                                                        className="p-2.5 bg-white border border-gray-100 rounded-xl text-gray-400 hover:text-red-500 transition-all"
                                                    >
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </motion.tr>
                                    ))
                                )}
                            </AnimatePresence>
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
