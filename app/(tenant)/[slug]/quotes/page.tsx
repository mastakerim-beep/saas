"use client";

import { useState, useMemo, useEffect, useRef } from 'react';
import { useStore, Quote } from '@/lib/store';
import { 
    Zap, Search, Plus, Filter, FileText, Download, 
    CheckCircle, X, Clock, ChevronRight, ArrowUpRight,
    TrendingUp, BarChart3, Users, Calendar, Hash, Percent, Tag, Store
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function QuotesPage() {
    const { 
        quotes, customers, services, packageDefinitions, branches,
        addQuote, updateQuote, deleteQuote, currentBranch,
        processCheckout, addCustomer, addAppointment, addPackage 
    } = useStore();
    const [search, setSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState('Hepsi');
    const [showAddModal, setShowAddModal] = useState(false);
    
    // Add Quote Modal State
    const [selectedCustomerId, setSelectedCustomerId] = useState('');
    const [selectedItemId, setSelectedItemId] = useState('');
    const [itemType, setItemType] = useState<'service' | 'package'>('service');
    const [discountRate, setDiscountRate] = useState(0);
    const [note, setNote] = useState('');
    const [followUpDate, setFollowUpDate] = useState('');
    const [followUpTime, setFollowUpTime] = useState('');
    const [customerSearch, setCustomerSearch] = useState('');
    const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);
    const [showQuickAdd, setShowQuickAdd] = useState(false);
    const [quickName, setQuickName] = useState('');
    const [quickPhone, setQuickPhone] = useState('');
    const [itemSearch, setItemSearch] = useState('');
    const [isSearchingItem, setIsSearchingItem] = useState(false);
    
    // Refs for click-away
    const customerSearchRef = useRef<HTMLDivElement>(null);
    const itemSearchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (customerSearchRef.current && !customerSearchRef.current.contains(event.target as Node)) {
                setIsSearchingCustomer(false);
            }
            if (itemSearchRef.current && !itemSearchRef.current.contains(event.target as Node)) {
                setIsSearchingItem(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const filteredQuotes = useMemo(() => {
        return quotes.filter(q => {
            const customerName = q.customerName?.toLowerCase() || '';
            const serviceName = q.serviceName?.toString().toLowerCase() || '';
            const searchTerm = search.toLowerCase();
            
            const matchesSearch = customerName.includes(searchTerm) || serviceName.includes(searchTerm);
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
        const doc = new jsPDF();
        
        // Premium Header with Aura Branding
        doc.setFillColor(79, 70, 229); // Indigo-600
        doc.rect(0, 0, 210, 45, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(28);
        doc.setFont('helvetica', 'bold');
        doc.text('AURA SPA', 20, 25);
        
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('PREMIUM WELLNESS & ERP SOLUTIONS', 20, 33);
        
        doc.setFontSize(16);
        doc.setFont('helvetica', 'bold');
        doc.text('HIZMET TEKLIF FORMU', 140, 25);
        doc.setFontSize(9);
        doc.text(`No: #Q-${quote.referenceCode || quote.id.split('-')[0].toUpperCase()}`, 140, 33);
        
        // Metadata Bar
        doc.setFillColor(249, 250, 251);
        doc.rect(0, 45, 210, 15, 'F');
        doc.setTextColor(100, 116, 139);
        doc.setFontSize(8);
        doc.text(`Tarih: ${new Date(quote.createdAt || '').toLocaleDateString('tr-TR')}`, 20, 54);
        doc.text(`Gecerlilik: ${quote.validUntil || '30 Gun'}`, 80, 54);
        doc.text(`Sube: ${currentBranch?.name || 'Merkez Sube'}`, 140, 54);

        // Customer & Summary Section
        doc.setTextColor(30, 41, 59);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('SAYIN', 20, 75);
        doc.setFontSize(18);
        doc.text(quote.customerName.toUpperCase(), 20, 85);
        
        // Info Box
        doc.setDrawColor(226, 232, 240);
        doc.line(20, 95, 190, 95);
        
        // Details Table
        const basePrice = quote.amount / (1 - (quote.discountRate || 0) / 100);
        
        (doc as any).autoTable({
            startY: 105,
            head: [['ACIKLAMA', 'BIRIM FIYAT', 'INDIRIM', 'TOPLAM']],
            body: [
                [
                    quote.serviceName || 'Belirtilmedi', 
                    `TL ${basePrice.toLocaleString('tr-TR')}`,
                    `% ${quote.discountRate || 0}`,
                    `TL ${quote.amount?.toLocaleString('tr-TR')}`
                ]
            ],
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229], fontSize: 10, cellPadding: 5 },
            bodyStyles: { fontSize: 11, cellPadding: 8 },
            columnStyles: {
                3: { halign: 'right', fontStyle: 'bold' }
            }
        });
        
        const finalY = (doc as any).lastAutoTable.finalY + 20;
        
        // Final Totals
        doc.setFillColor(79, 70, 229);
        doc.rect(130, finalY - 10, 60, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text(`TOPLAM: TL ${quote.amount?.toLocaleString('tr-TR')}`, 135, finalY);
        
        // Terms & Notes
        doc.setTextColor(51, 65, 85);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('TEKLIF NOTLARI:', 20, finalY + 20);
        doc.setFontSize(9);
        doc.setFont('helvetica', 'normal');
        doc.text(quote.note || 'Ozel bir not bulunmamaktadir.', 20, finalY + 28);
        
        doc.setTextColor(148, 163, 184);
        doc.setFontSize(8);
        doc.text('SARTLAR VE KOSULLAR:', 20, finalY + 50);
        doc.text('* Bu teklif belirtilen tarihe kadar gecerlidir.', 20, finalY + 56);
        doc.text('* Odeme sonrasi hizmet tanimlamasi aninda yapilir.', 20, finalY + 62);
        doc.text('* Aura Spa Pro uzerinden olusturulmustur.', 20, 285);
        
        doc.save(`Aura_Teklif_${quote.customerName.replace(/\s/g, '_')}.pdf`);
    };

    const handleAddQuote = () => {
        if (!selectedCustomerId || !selectedItemId) return;

        const customer = customers.find(c => c.id === selectedCustomerId);
        const item = itemType === 'service' 
            ? services.find(s => s.id === selectedItemId)
            : packageDefinitions.find(p => p.id === selectedItemId);

        if (!customer || !item) return;

        const basePrice = item.price || 0;
        const finalAmount = basePrice * (1 - discountRate / 100);

        addQuote({
            customerId: selectedCustomerId,
            customerName: customer.name,
            serviceName: item.name,
            serviceId: itemType === 'service' ? item.id : undefined,
            packageDefinitionId: itemType === 'package' ? item.id : undefined,
            amount: finalAmount,
            discountRate: discountRate,
            status: 'Taslak',
            note: note,
            validUntil: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
            followUpDate: followUpDate || undefined,
            followUpTime: followUpTime || undefined,
            branchId: currentBranch?.id
        });

        setShowAddModal(false);
        // Reset
        setSelectedCustomerId('');
        setSelectedItemId('');
        setDiscountRate(0);
        setNote('');
        setFollowUpDate('');
        setCustomerSearch('');
    };

    const handleQuickAddCustomer = async () => {
        if (!quickName) return;
        const newCustomer = await addCustomer({
            name: quickName,
            phone: quickPhone,
            segment: 'STANDARD'
        });
        if (newCustomer) {
            setSelectedCustomerId(newCustomer.id);
            setCustomerSearch(newCustomer.name);
            setShowQuickAdd(false);
            setQuickName('');
            setQuickPhone('');
        }
    };

    const handleApproveAndPay = async (quote: Quote) => {
        const ok = confirm(`${quote.customerName} için ₺${quote.amount.toLocaleString('tr-TR')} ödeme alınarak teklif onaylansın mı?`);
        if (!ok) return;

        let appointmentId: string | undefined = undefined;
        let packageId: string | undefined = undefined;

        try {
            // 1. Determine if it's a Service or Package
            if (quote.serviceId) {
                // Hizmet Teklifi ise: Tamamlandı durumunda bir randevu kaydı oluştur
                appointmentId = crypto.randomUUID();
                await addAppointment({
                    id: appointmentId,
                    customerId: quote.customerId,
                    customerName: quote.customerName,
                    service: quote.serviceName,
                    price: quote.amount,
                    status: 'completed',
                    date: new Date().toISOString().split('T')[0],
                    time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
                    isPaid: true,
                    branchId: quote.branchId || currentBranch?.id
                });
            } else if (quote.packageDefinitionId) {
                // Paket Teklifi ise: Müşteriye yeni paket tanımla
                packageId = crypto.randomUUID();
                const pkgDef = packageDefinitions.find(p => p.id === quote.packageDefinitionId);
                await addPackage({
                    id: packageId,
                    customerId: quote.customerId,
                    name: quote.serviceName,
                    serviceName: quote.serviceName,
                    totalSessions: pkgDef?.totalSessions || 1,
                    price: quote.amount,
                    branchId: quote.branchId || currentBranch?.id
                });
            }

            // 2. Process Checkout
            const success = await processCheckout({
                appointmentId: appointmentId,
                customerId: quote.customerId,
                customerName: quote.customerName,
                totalAmount: quote.amount,
                service: quote.serviceName,
                methods: [{ method: 'nakit', amount: quote.amount, currency: 'TRY', rate: 1, isDeposit: false }],
                date: new Date().toISOString().split('T')[0],
                note: `Tekliften Dönüştürüldü (#Q-${quote.id.split('-')[0].toUpperCase()})`,
                branchId: quote.branchId || currentBranch?.id
            }, {
                packageId: packageId // If it was a package purchase
            });

            if (success) {
                // 3. Update Quote Status
                updateQuote(quote.id, { status: 'Onaylandı' });
                alert("Teklif onaylandı! Müşteri kaydı, satış ve (varsa) paket tanımı başarıyla yapıldı.");
            }
        } catch (error) {
            console.error("Conversion Error:", error);
            alert("İşlem sırasında bir hata oluştu. Lütfen tekrar deneyin.");
        }
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
                        <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                            type="text" 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="Müşteri veya hizmet ara..."
                            className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm shadow-sm transition-all outline-none focus:ring-2 focus:ring-indigo-100" 
                        />
                    </div>
                    <button 
                        onClick={() => setShowAddModal(true)}
                        className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                    >
                        <Plus className="w-4 h-4" />
                        Yeni Teklif
                    </button>
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
                                <th className="px-8 py-6">İletişim Tarihi</th>
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
                                                        <p className="text-[10px] font-bold text-gray-400">#Q-{q.referenceCode || q.id.split('-')[0].toUpperCase()}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col">
                                                    <p className="text-sm font-bold text-gray-600">{q.serviceName || '---'}</p>
                                                    {q.branchId && (
                                                        <div className="flex items-center gap-1 text-[8px] text-gray-400 font-black uppercase mt-1">
                                                            <Store className="w-2.5 h-2.5" />
                                                            {branches.find((b: any) => b.id === q.branchId)?.name || 'Şube'}
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                <div className="flex flex-col gap-1">
                                                    <span className="inline-block bg-indigo-50 text-indigo-600 px-3 py-1 rounded-lg text-[10px] font-black tracking-widest w-fit">₺{q.amount?.toLocaleString('tr-TR')}</span>
                                                    {(q.discountRate || 0) > 0 && <p className="text-[9px] font-bold text-green-500">%{q.discountRate} İndirim Uygulandı</p>}
                                                </div>
                                            </td>
                                            <td className="px-8 py-6">
                                                {q.followUpDate ? (
                                                    <div className="flex flex-col">
                                                        <p className="text-[10px] font-bold text-gray-600 uppercase tracking-widest">{new Date(q.followUpDate).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' })}</p>
                                                        <p className="text-[9px] font-bold text-gray-400">{q.followUpTime || '--:--'}</p>
                                                    </div>
                                                ) : (
                                                    <p className="text-[10px] font-bold text-gray-300 italic">Planlanmadı</p>
                                                )}
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
                                                        onClick={() => downloadPDF(q)} title="PDF İndir"
                                                        className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-600/20 hover:scale-110 transition-all"
                                                    >
                                                        <Download className="w-4 h-4" />
                                                    </button>
                                                    {q.status !== 'Onaylandı' && (
                                                        <button 
                                                            onClick={() => handleApproveAndPay(q)} title="Onayla & Tahsil Et"
                                                            className="p-2.5 bg-green-600 text-white rounded-xl shadow-lg shadow-green-600/20 hover:scale-110 transition-all"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                        </button>
                                                    )}
                                                    <button 
                                                        onClick={() => deleteQuote(q.id)} title="Sil"
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

            {/* Add Quote Modal */}
            <AnimatePresence>
                {showAddModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowAddModal(false)} className="absolute inset-0 bg-gray-900/40 backdrop-blur-sm" />
                        <motion.div initial={{ opacity: 0, scale: 0.9, y: 20 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 20 }} className="bg-white w-full max-w-4xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
                            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/50">
                                <div>
                                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Yeni Teklif Hazırla</h2>
                                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1">Müşteriye özel premium teklif formu</p>
                                </div>
                                <button onClick={() => setShowAddModal(false)} className="p-4 hover:bg-white rounded-2xl text-gray-400 transition-all"><X className="w-6 h-6" /></button>
                            </div>
                            
                            <div className="p-10 overflow-y-auto grid grid-cols-1 md:grid-cols-2 gap-10">
                                {/* Left: Customer & Service */}
                                <div className="space-y-8">
                                    <section className="relative" ref={customerSearchRef}>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">MÜŞTERİ SEÇİMİ</label>
                                        <div className="relative">
                                            <Users className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                            <input 
                                                type="text"
                                                value={customerSearch}
                                                onChange={e => {
                                                    setCustomerSearch(e.target.value);
                                                    setIsSearchingCustomer(true);
                                                    if (!e.target.value) setSelectedCustomerId('');
                                                }}
                                                onFocus={() => setIsSearchingCustomer(true)}
                                                placeholder={selectedCustomerId ? customers.find(c => c.id === selectedCustomerId)?.name : "Müşteri Ara veya Yeni Ekle..."}
                                                className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                            />
                                            
                                            <AnimatePresence>
                                                {isSearchingCustomer && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 z-[110] bg-white border border-gray-100 rounded-2xl mt-2 shadow-2xl max-h-[300px] overflow-y-auto overflow-x-hidden no-scrollbar"
                                                    >
                                                        {customers.filter(c => 
                                                            c.name.toLowerCase().includes(customerSearch.toLowerCase()) || 
                                                            c.phone?.includes(customerSearch)
                                                        ).map(c => (
                                                            <button 
                                                                key={c.id}
                                                                onClick={() => {
                                                                    setSelectedCustomerId(c.id);
                                                                    setCustomerSearch(c.name);
                                                                    setIsSearchingCustomer(false);
                                                                }}
                                                                className="w-full text-left px-6 py-4 hover:bg-indigo-50 transition-colors flex items-center justify-between group"
                                                            >
                                                                <div>
                                                                    <p className="font-black text-xs uppercase tracking-tight text-gray-900">{c.name}</p>
                                                                    <p className="text-[10px] font-bold text-gray-400">{c.phone}</p>
                                                                </div>
                                                                {selectedCustomerId === c.id && <Zap className="w-4 h-4 text-indigo-600" />}
                                                            </button>
                                                        ))}
                                                        
                                                        {customerSearch.length > 0 && (
                                                            <button 
                                                                onClick={() => setShowQuickAdd(true)}
                                                                className="w-full px-6 py-5 bg-indigo-600 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all sticky bottom-0"
                                                            >
                                                                <Plus className="w-4 h-4" />
                                                                Yeni Müşteri Oluştur: "{customerSearch}"
                                                            </button>
                                                        )}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>

                                        {/* Quick Add Overlay inside Section */}
                                        <AnimatePresence>
                                            {showQuickAdd && (
                                                <motion.div 
                                                    initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                    className="absolute inset-0 bg-white/95 backdrop-blur-md z-[120] rounded-2xl flex flex-col p-6 shadow-2xl border border-indigo-50"
                                                >
                                                    <div className="flex justify-between items-center mb-6">
                                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Hızlı Müşteri Kaydı</p>
                                                        <button onClick={() => setShowQuickAdd(false)} className="text-gray-400"><X size={18} /></button>
                                                    </div>
                                                    <div className="space-y-4 flex-1">
                                                        <input 
                                                            autoFocus placeholder="Müşteri Ad Soyad" value={quickName || customerSearch}
                                                            onChange={e => setQuickName(e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-5 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-100"
                                                        />
                                                        <input 
                                                            placeholder="Telefon Numarası" value={quickPhone}
                                                            onChange={e => setQuickPhone(e.target.value)}
                                                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-5 py-3 text-xs font-black outline-none focus:ring-2 focus:ring-indigo-100"
                                                        />
                                                    </div>
                                                    <button 
                                                        onClick={handleQuickAddCustomer}
                                                        className="w-full bg-indigo-600 text-white py-4 rounded-xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-indigo-100 mt-6"
                                                    >
                                                        Kaydet ve Seç
                                                    </button>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>
                                    </section>

                                    <section>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">TEKLİF TÜRÜ</label>
                                        <div className="flex gap-2 p-1 bg-gray-50 rounded-2xl">
                                            <button onClick={() => { setItemType('service'); setSelectedItemId(''); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${itemType === 'service' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Hizmet</button>
                                            <button onClick={() => { setItemType('package'); setSelectedItemId(''); }} className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase transition-all ${itemType === 'package' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}>Paket</button>
                                        </div>
                                    </section>

                                    <section className="relative" ref={itemSearchRef}>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">{itemType === 'service' ? 'HİZMET' : 'PAKET ŞABLONU'}</label>
                                        <div className="relative">
                                            <Tag className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300 pointer-events-none" />
                                            <input 
                                                type="text"
                                                value={itemSearch}
                                                onChange={e => {
                                                    setItemSearch(e.target.value);
                                                    setIsSearchingItem(true);
                                                    if (!e.target.value) setSelectedItemId('');
                                                }}
                                                onFocus={() => setIsSearchingItem(true)}
                                                placeholder={selectedItemId 
                                                    ? (itemType === 'service' ? services : packageDefinitions).find(i => i.id === selectedItemId)?.name 
                                                    : (itemType === 'service' ? 'Hizmet Ara...' : 'Paket Ara...')
                                                }
                                                className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                            />
                                            
                                            <AnimatePresence>
                                                {isSearchingItem && (
                                                    <motion.div 
                                                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
                                                        className="absolute top-full left-0 right-0 z-[110] bg-white border border-gray-100 rounded-2xl mt-2 shadow-2xl max-h-[300px] overflow-y-auto no-scrollbar"
                                                    >
                                                        {(itemType === 'service' ? services : packageDefinitions)
                                                            .filter(i => i.name.toLowerCase().includes(itemSearch.toLowerCase()))
                                                            .map(i => (
                                                                <button 
                                                                    key={i.id}
                                                                    onClick={() => {
                                                                        setSelectedItemId(i.id);
                                                                        setItemSearch(i.name);
                                                                        setIsSearchingItem(false);
                                                                    }}
                                                                    className="w-full text-left px-6 py-4 hover:bg-indigo-50 transition-colors flex items-center justify-between group"
                                                                >
                                                                    <div>
                                                                        <p className="font-black text-xs uppercase tracking-tight text-gray-900">{i.name}</p>
                                                                        <p className="text-[10px] font-bold text-indigo-600">₺{i.price?.toLocaleString('tr-TR')}</p>
                                                                    </div>
                                                                    {selectedItemId === i.id && <Zap className="w-4 h-4 text-indigo-600" />}
                                                                </button>
                                                            ))}
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </section>
                                </div>

                                {/* Right: Financials & Scheduling */}
                                <div className="space-y-8">
                                    <div className="grid grid-cols-2 gap-6">
                                        <section>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">İNDİRİM ORANI (%)</label>
                                            <div className="relative">
                                                <Percent className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                                                <input 
                                                    type="number" value={discountRate} onChange={e => setDiscountRate(Number(e.target.value))}
                                                    className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-100"
                                                />
                                            </div>
                                        </section>
                                        <section>
                                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">TAHMİNİ TUTAR</label>
                                            <div className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-4 font-black text-indigo-600 text-lg">
                                                ₺{(() => {
                                                    const item = itemType === 'service' ? services.find(s => s.id === selectedItemId) : packageDefinitions.find(p => p.id === selectedItemId);
                                                    return ((item?.price || 0) * (1 - discountRate / 100)).toLocaleString('tr-TR');
                                                })()}
                                            </div>
                                        </section>
                                    </div>

                                    <section>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">TAKİP / GÖRÜŞME TARİHİ</label>
                                        <div className="grid grid-cols-2 gap-4">
                                            <div className="relative">
                                                <Calendar className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                                                <input type="date" value={followUpDate} onChange={e => setFollowUpDate(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                                            </div>
                                            <div className="relative">
                                                <Clock className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                                                <input type="time" value={followUpTime} onChange={e => setFollowUpTime(e.target.value)} className="w-full bg-white border border-gray-100 rounded-2xl pl-14 pr-6 py-4 font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-100" />
                                            </div>
                                        </div>
                                    </section>

                                    <section>
                                        <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block">ÖZEL NOTLAR</label>
                                        <textarea 
                                            value={note} onChange={e => setNote(e.target.value)}
                                            placeholder="Teklif şartları veya müşteri beklentileri..."
                                            className="w-full bg-white border border-gray-100 rounded-2xl p-6 font-bold text-sm shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 min-h-[120px]"
                                        />
                                    </section>
                                </div>
                            </div>

                            <div className="p-10 bg-gray-50 flex gap-4 border-t border-gray-100">
                                <button 
                                    onClick={() => setShowAddModal(false)}
                                    className="flex-1 bg-white border border-gray-100 text-gray-400 py-5 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Vazgeç
                                </button>
                                <button 
                                    onClick={handleAddQuote}
                                    className="flex-[2] bg-indigo-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                                >
                                    Teklifi Kaydet
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
