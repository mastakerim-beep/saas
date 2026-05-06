"use client";

import { useStore } from "@/lib/store";
import { 
    Link as LinkIcon, Search, Calendar, Filter, ArrowUpRight, 
    Copy, ExternalLink, Trash2, CheckCircle2, Clock, AlertCircle,
    RefreshCcw, Wallet, Mail, MessageSquare, Plus
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function PaymentLinksPage() {
    const { 
        allPaymentLinks, currentBusiness, locale, fetchData, createPaymentLink 
    } = useStore();

    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState('all');
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newLink, setNewLink] = useState({ customerName: '', amount: '', description: '' });
    const [isGenerating, setIsGenerating] = useState(false);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        try {
            await fetchData();
        } catch (err) {
            console.error(err);
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleCreateLink = async () => {
        if (!newLink.amount || Number(newLink.amount) <= 0) {
            alert("Geçerli bir tutar girin");
            return;
        }
        setIsGenerating(true);
        try {
            const success = await createPaymentLink({
                amount: Number(newLink.amount),
                customerName: newLink.customerName || 'İsimsiz Müşteri',
                description: newLink.description || 'Hizmet Ödemesi'
            });
            if (success) {
                setIsCreateModalOpen(false);
                setNewLink({ customerName: '', amount: '', description: '' });
                await fetchData();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        alert(locale === 'tr' ? "Link kopyalandı" : "Link copied");
    };

    const filteredLinks = useMemo(() => {
        return allPaymentLinks
            .filter((link: any) => {
                const matchesSearch = link.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                                     link.description?.toLowerCase().includes(searchQuery.toLowerCase());
                const matchesStatus = statusFilter === 'all' || link.status === statusFilter;
                return matchesSearch && matchesStatus;
            })
            .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    }, [allPaymentLinks, searchQuery, statusFilter]);

    const stats = useMemo(() => {
        const paid = allPaymentLinks.filter((l: any) => l.status === 'paid');
        const pending = allPaymentLinks.filter((l: any) => l.status === 'pending');
        const totalPaid = paid.reduce((s: number, l: any) => s + (l.amount || 0), 0);
        return {
            paidCount: paid.length,
            pendingCount: pending.length,
            totalPaid
        };
    }, [allPaymentLinks]);

    return (
        <div className="flex-1 flex flex-col bg-[#FBFBFD] min-h-screen p-10 space-y-10">
            {/* Header */}
            <header className="flex justify-between items-end">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <div className="flex items-center gap-3 text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] mb-2">
                        <LinkIcon className="w-4 h-4" />
                        <span>Uzaktan Tahsilat</span>
                    </div>
                    <h1 className="text-5xl font-black tracking-tight text-indigo-950 uppercase italic italic-indigo">
                        Ödeme <span className="text-indigo-600">Linkleri</span>
                    </h1>
                </motion.div>
                
                <div className="flex gap-4">
                    <button 
                        onClick={handleRefresh}
                        className="p-4 bg-white border border-indigo-100 text-indigo-600 rounded-2xl hover:shadow-lg transition-all"
                    >
                        <RefreshCcw size={20} className={isRefreshing ? 'animate-spin' : ''} />
                    </button>
                    <button 
                        onClick={() => setIsCreateModalOpen(true)}
                        className="flex items-center gap-2 px-8 py-4 bg-indigo-950 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-indigo-200"
                    >
                        <Plus size={16} /> Yeni Link Oluştur
                    </button>
                </div>
            </header>

            {/* Modal */}
            <AnimatePresence>
                {isCreateModalOpen && (
                    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setIsCreateModalOpen(false)} className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white rounded-[3rem] p-10 w-full max-w-md relative z-10 shadow-2xl">
                            <h3 className="text-2xl font-black text-gray-900 tracking-tighter uppercase mb-6">Yeni Ödeme Linki</h3>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Müşteri Adı</label>
                                    <input type="text" value={newLink.customerName} onChange={(e) => setNewLink(prev => ({ ...prev, customerName: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold" placeholder="Örn: Ahmet Yılmaz" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Tutar (₺)</label>
                                    <input type="number" value={newLink.amount} onChange={(e) => setNewLink(prev => ({ ...prev, amount: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold" placeholder="0.00" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Açıklama</label>
                                    <input type="text" value={newLink.description} onChange={(e) => setNewLink(prev => ({ ...prev, description: e.target.value }))} className="w-full bg-gray-50 border-none rounded-xl px-4 py-3 text-sm font-bold" placeholder="Örn: Paket Ödemesi" />
                                </div>
                            </div>
                            <div className="flex gap-3 mt-10">
                                <button onClick={() => setIsCreateModalOpen(false)} className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl font-black text-[10px] uppercase">İptal</button>
                                <button onClick={handleCreateLink} disabled={isGenerating} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase shadow-lg disabled:opacity-50">
                                    {isGenerating ? 'Oluşturuluyor...' : 'Link Oluştur'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Başarılı Tahsilat</p>
                    <h3 className="text-3xl font-black text-emerald-600">₺{stats.totalPaid.toLocaleString('tr-TR')}</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">{stats.paidCount} İşlem</p>
                </div>
                <div className="bg-white p-8 rounded-[3rem] shadow-sm border border-indigo-50">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Bekleyen Ödemeler</p>
                    <h3 className="text-3xl font-black text-amber-500">{stats.pendingCount}</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1">Aktif Linkler</p>
                </div>
                <div className="bg-indigo-600 p-8 rounded-[3rem] shadow-xl text-white">
                    <p className="text-[10px] font-black text-white/60 uppercase tracking-widest mb-2">Gateway Durumu</p>
                    <h3 className="text-2xl font-black">
                        {currentBusiness?.iyzico_api_key ? 'Iyzico Live' : 'Simülasyon Modu'}
                    </h3>
                    <p className="text-[10px] font-bold text-white/60 mt-1">Ödemeler doğrudan banka hesabınıza geçer.</p>
                </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-indigo-50 flex flex-col md:flex-row gap-6 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" size={18} />
                    <input 
                        type="text" 
                        placeholder="Müşteri veya açıklama ara..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-14 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold outline-none"
                    />
                </div>
                <div className="flex gap-2">
                    {['all', 'pending', 'paid', 'expired'].map((s) => (
                        <button
                            key={s}
                            onClick={() => setStatusFilter(s)}
                            className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                                statusFilter === s ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-50 text-gray-400 hover:text-indigo-600'
                            }`}
                        >
                            {s === 'all' ? 'Tümü' : s === 'pending' ? 'Bekleyen' : s === 'paid' ? 'Ödendi' : 'Süresi Doldu'}
                        </button>
                    ))}
                </div>
            </div>

            {/* Links Table */}
            <div className="bg-white rounded-[3.5rem] shadow-sm border border-indigo-50 overflow-hidden">
                <table className="w-full text-left">
                    <thead>
                        <tr className="bg-gray-50/50">
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Müşteri</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Tutar</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Durum</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">Oluşturma</th>
                            <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">Aksiyon</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                        {filteredLinks.map((link: any) => (
                            <tr key={link.id} className="hover:bg-gray-50/50 transition-all group">
                                <td className="px-10 py-6">
                                    <div>
                                        <p className="text-sm font-black text-gray-900">{link.customerName || 'İsimsiz Müşteri'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{link.description || 'Hizmet Ödemesi'}</p>
                                    </div>
                                </td>
                                <td className="px-10 py-6">
                                    <span className="text-lg font-black tracking-tighter text-indigo-950">₺{link.amount?.toLocaleString('tr-TR')}</span>
                                </td>
                                <td className="px-10 py-6">
                                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase ${
                                        link.status === 'paid' ? 'bg-emerald-50 text-emerald-600' :
                                        link.status === 'pending' ? 'bg-amber-50 text-amber-600' :
                                        'bg-gray-100 text-gray-400'
                                    }`}>
                                        {link.status === 'paid' ? <CheckCircle2 size={12} /> : link.status === 'pending' ? <Clock size={12} /> : <AlertCircle size={12} />}
                                        {link.status === 'paid' ? 'ÖDENDİ' : link.status === 'pending' ? 'BEKLEYEN' : 'GEÇERSİZ'}
                                    </div>
                                </td>
                                <td className="px-10 py-6 text-[10px] font-bold text-gray-400">
                                    {new Date(link.createdAt).toLocaleDateString('tr-TR')} <br/>
                                    {new Date(link.createdAt).toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-10 py-6 text-right space-x-2">
                                    <button 
                                        onClick={() => copyToClipboard(`${window.location.origin}/portal/pay/${link.token}`)}
                                        className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all"
                                        title="Linki Kopyala"
                                    >
                                        <Copy size={16} />
                                    </button>
                                    <a 
                                        href={`/portal/pay/${link.token}`} 
                                        target="_blank"
                                        className="p-2.5 bg-gray-50 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 inline-block rounded-xl transition-all"
                                        title="Linki Aç"
                                    >
                                        <ExternalLink size={16} />
                                    </a>
                                    {link.status === 'pending' && (
                                        <button className="p-2.5 bg-gray-50 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {filteredLinks.length === 0 && (
                    <div className="py-20 text-center opacity-30">
                        <LinkIcon className="w-12 h-12 mx-auto mb-4" />
                        <p className="text-[10px] font-black uppercase tracking-widest">Ödeme linki bulunamadı</p>
                    </div>
                )}
            </div>
        </div>
    );
}
