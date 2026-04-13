"use client";

import { useState, useMemo } from 'react';
import { useStore, Customer, Appointment, Package, Payment } from '@/lib/store';
import { 
    User, CheckCircle, ArrowLeft, MessageCircle, Download, Clock, Tag, 
    MessageSquare, Search, X, Phone, Mail, Calendar, ChevronRight, 
    Package as PackageIcon, Star, Banknote, CreditCard, Building2, Trash2,
    Zap, Activity, Heart, Shield, RefreshCw, BarChart3, TrendingUp, Sparkles, MapPin,
    ArrowUpRight, Info, Plus, FileText, Gift, Settings, AlertCircle, Edit2, Globe, Languages, Users, ArrowDownRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingModal from '@/components/BookingModal';

// ---- COMPONENTS ----

function AuraHealthScore({ customer, appointments, payments }: { customer: Customer, appointments: Appointment[], payments: Payment[] }) {
    const score = useMemo(() => {
        let s = 5;
        if (customer.segment === 'VIP') s += 2;
        if (payments.length > 5) s += 1;
        const totalSpent = payments.reduce((acc, p) => acc + (p.totalAmount || 0), 0);
        if (totalSpent > 10000) s += 1;
        const lastAppt = appointments[0];
        if (lastAppt) {
            const daysSince = (new Date().getTime() - new Date(lastAppt.date).getTime()) / (1000 * 3600 * 24);
            if (daysSince < 30) s += 1;
            if (daysSince > 90) s -= 2;
        }
        return Math.max(1, Math.min(10, s));
    }, [customer, appointments, payments]);

    const color = score > 7 ? 'text-green-500' : score > 4 ? 'text-indigo-500' : 'text-orange-500';

    return (
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
            <Activity className={`w-3.5 h-3.5 ${color}`} />
            <span className={`text-[10px] font-black uppercase tracking-tighter ${color}`}>Aura Score: {score}/10</span>
        </div>
    );
}

function SmartStack({ icon: Icon, label, count, color, active, onClick }: any) {
    return (
        <motion.button
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`flex-none w-48 p-5 rounded-[2rem] transition-all flex flex-col gap-4 relative overflow-hidden group
                ${active ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-white border border-gray-100 text-gray-900 hover:shadow-lg'}
            `}
        >
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-colors
                ${active ? 'bg-white/20 text-white' : `${color} bg-opacity-10 ${color.replace('text-', 'text-')}`}
            `}>
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className={`text-[10px] font-black uppercase tracking-widest ${active ? 'text-white/60' : 'text-gray-400'}`}>{label}</p>
                <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black italic">{count}</span>
                    <span className={`text-[10px] font-bold ${active ? 'text-white/60' : 'text-gray-400'}`}>Kayıt</span>
                </div>
            </div>
            {!active && <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                <ArrowUpRight className="w-4 h-4 text-gray-300" />
            </div>}
        </motion.button>
    );
}

// ---- ADD CUSTOMER MODAL ----
function AddCustomerModal({ onClose, onSave }: { onClose: () => void; onSave: (c: Customer) => void }) {
    const { addCustomer } = useStore();
    const [form, setForm] = useState({ name: '', phone: '', email: '', birthdate: '', segment: 'Normal' as Customer['segment'], note: '' });
    const h = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/40 backdrop-blur-xl z-[1000] flex items-center justify-center p-4">
            <motion.div initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-xl overflow-hidden border border-white/20">
                <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-gray-50">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Yeni Danışan</h2>
                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mt-1 italic">Premium Kayıt Formu</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
                </div>
                <div className="p-10 space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                        <div className="group">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block group-focus-within:text-indigo-600 transition-colors">Ad Soyad</label>
                            <div className="relative">
                                <User className="w-5 h-5 absolute left-4 top-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                <input value={form.name} onChange={e => h('name', e.target.value)} placeholder="Müşteri Adı"
                                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold transition-all outline-none" />
                            </div>
                        </div>
                        <div className="group">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block group-focus-within:text-indigo-600 transition-colors">Telefon</label>
                            <div className="relative">
                                <Phone className="w-5 h-5 absolute left-4 top-4 text-gray-300 group-focus-within:text-indigo-600 transition-colors" />
                                <input value={form.phone} onChange={e => h('phone', e.target.value)} placeholder="05XX"
                                    className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-600 rounded-2xl pl-12 pr-6 py-4 text-sm font-bold transition-all outline-none" />
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Segment Seçimi</label>
                        <div className="flex gap-2">
                            {(['Normal', 'VIP', 'Kurumsal'] as Customer['segment'][]).map(s => (
                                <button key={s} onClick={() => h('segment', s)}
                                    className={`flex-1 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${form.segment === s ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg shadow-indigo-600/20' : 'bg-gray-50 text-gray-500 border-transparent hover:bg-gray-100'}`}>
                                    {s === 'VIP' && '⭐ '} {s}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Özel Notlar</label>
                        <textarea value={form.note} onChange={e => h('note', e.target.value)} rows={3}
                            placeholder="Müşteri hakkında önemli detaylar..." className="w-full bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-600 rounded-[2rem] px-6 py-5 text-sm font-bold transition-all outline-none resize-none" />
                    </div>
                </div>
                <div className="px-10 pb-10 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-500 font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">İptal</button>
                    <button
                        disabled={!form.name || !form.phone}
                        onClick={() => { const c = addCustomer(form); onSave(c); }}
                        className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-40">
                        Kaydı Tamamla ✓
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ---- CUSTOMER DETAIL: THE PROFESSIONAL SMART PORTRAIT ----
function CustomerDetail({ customer, onClose }: { customer: Customer; onClose: () => void }) {
    const { 
        getCustomerPackages, 
        getCustomerAppointments, 
        getCustomerPayments, 
        updateAppointmentStatus, 
        updateCustomer,
        staffMembers 
    } = useStore();
    const [activeMenu, setActiveMenu] = useState('Detaylar');
    const [quickNote, setQuickNote] = useState('');
    const [selectedSlot, setSelectedSlot] = useState<{staffId: string, time: string, customerId?: string} | null>(null);

    const pkgs = getCustomerPackages(customer.id);
    const appts = getCustomerAppointments(customer.id).sort((a, b) => b.date.localeCompare(a.date));
    const payments = getCustomerPayments(customer.id);
    const totalSpent = payments.reduce((s, p) => s + (p.totalAmount || 0), 0);

    const statusLabels: Record<string, { label: string; cls: string; icon: any }> = {
        completed: { label: 'Tamamlandı', cls: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
        pending:   { label: 'Beklemede',  cls: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Clock },
        excused:   { label: 'Mazeretli',  cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Info },
        cancelled: { label: 'İptal',      cls: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: X },
        'no-show': { label: 'Gelmedi',    cls: 'bg-red-500/10 text-red-600 border-red-500/20', icon: User },
    };

    const menuItems = [
        { id: 'Detaylar', label: 'Detaylar', icon: Info },
        { id: 'Düzenle', label: 'Düzenle', icon: Edit2 },
        { id: 'Formlar', label: 'Formlar', icon: FileText },
        { id: 'Teklif', label: 'Teklif', icon: Zap },
        { id: 'Randevu', label: 'Randevu', icon: Calendar },
        { id: 'Notlar', label: 'Notlar', icon: MessageSquare },
        { id: 'Dosya & Fotoğraf', label: 'Dosya & Fotoğraf', icon: Sparkles },
        { id: 'Satış & Tahsilat', label: 'Satış & Tahsilat', icon: Banknote },
        { id: 'Faturalar', label: 'Faturalar', icon: FileText },
        { id: 'Puan', label: 'Puan', icon: Star },
        { id: 'Paket Takibi', label: 'Paket Takibi', icon: PackageIcon },
        { id: 'Yolculuk', label: 'Müşteri Yolculuğu', icon: TrendingUp },
    ];

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-screen bg-[#F8F9FC]">
            {/* Sidebar (Inner) */}
            <div className="w-[280px] bg-white border-r border-gray-100 flex flex-col p-6 sticky top-0 h-screen">
                <button onClick={onClose} className="mb-10 flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors">
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Geri Dön</span>
                </button>
                
                <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveMenu(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm
                                ${activeMenu === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:bg-gray-50'}
                            `}
                        >
                            <item.icon className={`w-4 h-4 ${activeMenu === item.id ? 'text-white' : 'text-gray-400'}`} />
                            {item.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col">
                {/* Top Banner Profile */}
                <div className="bg-white border-b border-gray-100 p-8 flex justify-between items-center">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center font-black text-2xl text-indigo-600 shadow-sm">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-2xl font-black italic tracking-tighter uppercase">{customer.name}</h1>
                                <CheckCircle className="w-5 h-5 text-green-500" />
                            </div>
                            <div className="flex gap-4 mt-1 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                                <span># {customer.id.split('-')[0]}</span>
                                <span>[ {customer.referenceCode || 'REF-YOK'} ]</span>
                                <span>[ {customer.phone} ]</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <AuraHealthScore customer={customer} appointments={appts} payments={payments} />
                        <button 
                            onClick={() => setSelectedSlot({ staffId: staffMembers[0]?.id || '', time: '09:00', customerId: customer.id })}
                            className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl flex items-center gap-2 font-black text-[10px] uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/20"
                        >
                            <Plus className="w-4 h-4" /> Randevu +
                        </button>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="p-8 pb-32 max-w-[1400px] mx-auto w-full">
                    <AnimatePresence mode="wait">
                        {activeMenu === 'Detaylar' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 xl:grid-cols-4 gap-8">
                                {/* Col 1: Actions & Profile Summary */}
                                <div className="xl:col-span-1 space-y-6">
                                    <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm text-center">
                                        <div className="w-24 h-24 bg-gray-50 rounded-[2rem] mx-auto mb-6 flex items-center justify-center relative group">
                                            <User className="w-12 h-12 text-gray-200" />
                                            <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
                                            <button className="absolute inset-0 bg-black/40 text-white rounded-[2rem] opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Edit2 className="w-6 h-6" /></button>
                                        </div>
                                        <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-6">Aktif</p>
                                        
                                        <div className="space-y-3">
                                            <button 
                                                onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\D/g,'')}`, '_blank')}
                                                className="w-full py-3 bg-green-50 hover:bg-green-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center justify-center gap-2 transition-all"
                                            >
                                                <MessageCircle className="w-4 h-4" /> WhatsApp sohbeti başlat
                                            </button>
                                            <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center justify-center gap-2 transition-all">
                                                <RefreshCw className="w-4 h-4" /> Düzenleme geçmişi
                                            </button>
                                            <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center justify-center gap-2 transition-all">
                                                <Download className="w-4 h-4" /> Medikal kayıtları indir
                                            </button>
                                            <button className="w-full py-3 border border-red-100 text-red-500 hover:bg-red-50 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all">
                                                <X className="w-4 h-4" /> Sil
                                            </button>
                                        </div>
                                    </div>

                                    {/* Small Quick Stats */}
                                    <div className="grid grid-cols-3 gap-4">
                                        {[
                                            { label: 'Randevu', count: appts.length, color: 'text-indigo-600', bg: 'bg-indigo-50' },
                                            { label: 'Satış', count: payments.length, color: 'text-green-600', bg: 'bg-green-50' },
                                            { label: 'Teklif', count: 0, color: 'text-amber-600', bg: 'bg-amber-50' },
                                        ].map(stat => (
                                            <div key={stat.label} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">
                                                <p className="text-xl font-black italic text-gray-900">{stat.count}</p>
                                                <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                                                <button className={`w-full py-1.5 ${stat.bg} ${stat.color} rounded-lg text-[8px] font-black uppercase tracking-tighter`}>+ Yeni</button>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Col 2 & 3: Info Blocks */}
                                <div className="xl:col-span-2 space-y-6">
                                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                        <div className="p-8 grid grid-cols-2 gap-x-12 gap-y-8">
                                            {/* Personel Bilgi */}
                                            <div className="col-span-2 flex items-center gap-3 border-b border-gray-50 pb-4 mb-2">
                                                <User className="w-4 h-4 text-gray-400" />
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 italic">Kişisel Bilgi</h4>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Kayıt Tarihi</span>
                                                <span className="text-sm font-bold text-gray-600">{customer.createdAt.split('T')[0]}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Doğum Tarihi</span>
                                                <span className="text-sm font-bold text-gray-600">{customer.birthdate || 'Girilmedi'}</span>
                                            </div>

                                            {/* Adres Bilgileri */}
                                            <div className="col-span-2 flex items-center gap-3 border-b border-gray-50 pb-4 mt-4 mb-2">
                                                <MapPin className="w-4 h-4 text-gray-400" />
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 italic">Adres Bilgileri</h4>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Ülke</span>
                                                <div className="flex items-center gap-2">
                                                    <Globe className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-sm font-bold text-gray-600">{customer.country || 'Türkiye'}</span>
                                                </div>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Dil</span>
                                                <div className="flex items-center gap-2">
                                                    <Languages className="w-3.5 h-3.5 text-gray-400" />
                                                    <span className="text-sm font-bold text-gray-600">{customer.language || 'Türkçe'}</span>
                                                </div>
                                            </div>

                                            {/* Diğer Bilgiler */}
                                            <div className="col-span-2 flex items-center gap-3 border-b border-gray-50 pb-4 mt-4 mb-2">
                                                <Shield className="w-4 h-4 text-gray-400" />
                                                <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 italic">Diğer Bilgiler</h4>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Kayıt Açan</span>
                                                <span className="text-sm font-bold text-gray-600">RAMADA BURSA</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Segment</span>
                                                <span className="text-sm font-bold text-indigo-600">{customer.segment}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Referans Kaynağı</span>
                                                <span className="text-sm font-bold text-gray-400 italic">{customer.referenceCode || 'Belirtilmedi'}</span>
                                            </div>
                                            <div className="flex flex-col gap-1">
                                                <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Değişiklik Tarihi</span>
                                                <span className="text-sm font-bold text-gray-400 italic">{customer.createdAt.split('T')[0]} 21:22</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* Tags Section */}
                                    <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                                        <div className="flex justify-between items-center mb-6">
                                            <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><Tag className="w-4 h-4" /> Etiketler</h4>
                                            <ChevronRight className="w-4 h-4 text-gray-300" />
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {['Sadık Müşteri', 'Masaj Müptelası', 'VIP'].map(tag => (
                                                <span key={tag} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-tighter">#{tag}</span>
                                            ))}
                                            <button className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-tighter hover:bg-indigo-100 transition-colors">+ Ekle</button>
                                        </div>
                                    </div>
                                </div>

                                {/* Col 4: Notes */}
                                <div className="xl:col-span-1 space-y-6">
                                    <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-lg p-8 h-full flex flex-col">
                                        <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 italic"><MessageSquare className="w-4 h-4" /> Notlar</h4>
                                        
                                        <div className="flex flex-col gap-4">
                                            <div className="space-y-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hızlı Not</label>
                                                <textarea 
                                                    value={quickNote}
                                                    onChange={e => setQuickNote(e.target.value)}
                                                    placeholder="Notunuzu giriniz..."
                                                    className="w-full bg-[#FAF9F6] border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-medium outline-none transition-all resize-none min-h-[120px]" 
                                                />
                                                <button className="w-full py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-[1.02] transition-all">Kaydet</button>
                                            </div>
                                            
                                            <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                                                {customer.note ? (
                                                     <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                                         <p className="text-xs font-medium text-amber-700 leading-relaxed italic">"{customer.note}"</p>
                                                     </div>
                                                ) : (
                                                    <div className="py-20 text-center flex flex-col items-center gap-4">
                                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-200"><MessageCircle className="w-6 h-6" /></div>
                                                        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-tight px-10">Danışana ait kayıtlı not bulunmamaktadır</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeMenu === 'Randevu' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase italic">Randevular</h3>
                                        <button className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 flex items-center gap-2">
                                            İşlemler <ChevronRight className="w-4 h-4 rotate-90" />
                                        </button>
                                    </div>
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-[#FBFCFF] text-[10px] font-black uppercase text-gray-400 tracking-widest">
                                                <tr>
                                                    <th className="px-8 py-5">Tarih</th>
                                                    <th className="px-8 py-5">Saat</th>
                                                    <th className="px-8 py-5">Personel</th>
                                                    <th className="px-8 py-5">Oda</th>
                                                    <th className="px-8 py-5">Hizmetler</th>
                                                    <th className="px-8 py-5">Durum</th>
                                                    <th className="px-8 py-5 text-center">İşlem Kartı</th>
                                                    <th className="px-8 py-5 text-right">İşlemler</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {appts.map(a => {
                                                    const s = statusLabels[a.status] ?? { label: a.status, cls: 'bg-gray-50 text-gray-400', icon: Info };
                                                    return (
                                                        <tr key={a.id} className="hover:bg-gray-50/50 transition-all group">
                                                            <td className="px-8 py-5">
                                                                <p className="text-sm font-bold text-gray-600">{new Date(a.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</p>
                                                            </td>
                                                            <td className="px-8 py-5 font-black text-gray-900">{a.time}</td>
                                                            <td className="px-8 py-5 text-sm font-bold text-gray-500 uppercase">{a.staffName}</td>
                                                            <td className="px-8 py-5 text-sm font-bold text-indigo-600 italic">1. Masaj Odası</td>
                                                            <td className="px-8 py-5 font-black text-gray-700 italic">(P) {a.service}</td>
                                                            <td className="px-8 py-5">
                                                                <select 
                                                                    value={a.status}
                                                                    onChange={(e) => updateAppointmentStatus(a.id, e.target.value as any)}
                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 outline-none appearance-none cursor-pointer tracking-widest ${s.cls}`}
                                                                >
                                                                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="px-8 py-5 text-center">
                                                                <div className="flex justify-center gap-2">
                                                                    <div className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white"><X className="w-4 h-4" /></div>
                                                                    <div className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white"><FileText className="w-4 h-4" /></div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100">
                                                                    <button className="p-2 bg-white border border-gray-100 rounded-lg hover:border-indigo-600 transition-all"><Edit2 className="w-4 h-4 text-gray-400" /></button>
                                                                    <button className="p-2 bg-white border border-gray-100 rounded-lg"><ChevronRight className="w-4 h-4 text-gray-300 rotate-90" /></button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeMenu === 'Satış & Tahsilat' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase italic">Satışlar</h3>
                                        <button className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-500 hover:bg-gray-100 flex items-center gap-2">
                                            İşlemler <ChevronRight className="w-4 h-4 rotate-90" />
                                        </button>
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
                                                {payments.map(p => (
                                                    <tr key={p.id} className="hover:bg-gray-50/50 transition-all font-bold text-gray-600 group">
                                                        <td className="px-8 py-5 text-sm">{p.date}</td>
                                                        <td className="px-8 py-5 text-sm text-gray-400">#P{p.id.split('-')[0].toUpperCase()}</td>
                                                        <td className="px-8 py-5 max-w-[200px]">
                                                            <p className="text-[10px] font-black uppercase text-gray-900">RAMADA BURSA</p>
                                                            <div className="flex flex-col gap-1 mt-1">
                                                                <span className="text-[9px] bg-gray-50 text-gray-400 px-2 py-0.5 rounded italic">1x {p.service}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-8 py-5">
                                                            <span className="inline-block bg-cyan-400 text-white px-3 py-1 rounded-md text-[10px] font-black tracking-widest shadow-sm">₺{p.totalAmount.toLocaleString('tr-TR')} TRY</span>
                                                        </td>
                                                        <td className="px-8 py-5 text-sm">{p.methods.some(m => m.method === 'nakit') ? `₺${p.totalAmount.toLocaleString('tr-TR')} TRY` : ''}</td>
                                                        <td className="px-8 py-5 text-sm">{p.methods.some(m => m.method === 'kredi-karti') ? `₺${p.totalAmount.toLocaleString('tr-TR')} TRY` : ''}</td>
                                                        <td className="px-8 py-5 text-sm">{p.methods.some(m => m.method === 'havale' || m.method === 'banka') ? `₺${p.totalAmount.toLocaleString('tr-TR')} TRY` : ''}</td>
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
                        )}
                        {activeMenu === 'Yolculuk' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="max-w-4xl">
                                <div className="bg-white rounded-[3rem] p-10 border border-gray-100 shadow-sm relative overflow-hidden">
                                     <div className="absolute top-0 right-0 p-10 opacity-5">
                                        <TrendingUp className="w-64 h-64" />
                                     </div>
                                     <div className="flex items-center gap-6 mb-12 border-b border-gray-50 pb-8">
                                        <div className="w-20 h-20 bg-indigo-600 rounded-[2.5rem] flex items-center justify-center text-white">
                                            <Activity className="w-10 h-10" />
                                        </div>
                                        <div>
                                            <h3 className="text-3xl font-black italic tracking-tighter uppercase italic">Müşteri Yolculuğu</h3>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Aura Intelligence Otomatik Zaman Çizelgesi</p>
                                        </div>
                                     </div>

                                     <div className="space-y-12 relative before:absolute before:inset-0 before:left-[2.25rem] before:w-0.5 before:bg-gray-50 pb-10">
                                        {/* Journey Items: Combined Appointments and Payments */}
                                        {[...appts.map(a => ({ type: 'appt', date: a.date, data: a })), 
                                          ...payments.map(p => ({ type: 'payment', date: p.date, data: p }))]
                                          .sort((a,b) => b.date.localeCompare(a.date))
                                          .map((item, idx) => (
                                            <div key={idx} className="flex gap-10 relative">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center z-10 shadow-sm 
                                                    ${item.type === 'appt' ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'}`}>
                                                    {item.type === 'appt' ? <Calendar className="w-5 h-5" /> : <Banknote className="w-5 h-5" />}
                                                </div>
                                                <div className="flex-1 pt-1">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-300 italic">{item.date}</span>
                                                        <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                                            item.type === 'appt' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-green-50 text-green-600 border-green-100'
                                                        }`}>
                                                            {item.type === 'appt' ? 'Randevu' : 'Tahsilat'}
                                                        </span>
                                                    </div>
                                                    <h4 className="text-xl font-black italic tracking-tighter uppercase italic">
                                                        {item.type === 'appt' ? (item.data as any).service : `₺${(item.data as any).totalAmount.toLocaleString('tr-TR')} Ödeme`}
                                                    </h4>
                                                    <p className="text-gray-500 text-sm font-bold mt-1">
                                                        {item.type === 'appt' ? `${(item.data as any).staffName} ile seans` : (item.data as any).service}
                                                    </p>
                                                </div>
                                            </div>
                                          ))
                                        }
                                     </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
            {selectedSlot && (
                <BookingModal 
                    initialData={selectedSlot} 
                    date={new Date().toISOString().split('T')[0]} 
                    onClose={() => setSelectedSlot(null)} 
                />
            )}
        </motion.div>
    );
}

// ---- MAIN LIST PAGE ----
export default function CustomersPage() {
    const { 
        customers, 
        deleteCustomer, 
        getCustomerAppointments, 
        getCustomerPayments,
        getChurnRiskCustomers,
        getUpsellPotentialCustomers,
        getBirthdaysToday
    } = useStore();
    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [search, setSearch] = useState('');
    const [activeStack, setActiveStack] = useState('Hepsi');

    const insights = useMemo(() => ({
        churn: getChurnRiskCustomers(),
        upsell: getUpsellPotentialCustomers(),
        birthdays: getBirthdaysToday()
    }), [getChurnRiskCustomers, getUpsellPotentialCustomers, getBirthdaysToday]);

    const filtered = useMemo(() => {
        let list = customers.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
        
        if (activeStack === 'VIP') list = list.filter(c => c.segment === 'VIP');
        if (activeStack === 'Risk') list = list.filter(c => insights.churn.some(churnC => churnC.id === c.id));
        if (activeStack === 'Upsell') list = list.filter(c => insights.upsell.some(u => u.customer.id === c.id));
        if (activeStack === 'Dogum') list = list.filter(c => insights.birthdays.some(b => b.id === c.id));
        if (activeStack === 'Bugün') {
             const today = new Date().toISOString().split('T')[0];
             list = list.filter(c => getCustomerAppointments(c.id).some(a => a.date === today));
        }
        
        return list;
    }, [customers, search, activeStack, insights, getCustomerAppointments]);

    if (selectedCustomer) return <CustomerDetail customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />;

    return (
        <div className="p-8 pb-32 max-w-[1600px] mx-auto min-h-screen">
            {showModal && <AddCustomerModal onClose={() => setShowModal(false)} onSave={() => setShowModal(false)} />}

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 px-4">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black tracking-tight mb-2 text-gray-900 leading-none uppercase italic text-shadow-sm">Danışan Portalı</h1>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] italic">Aura Intelligence CRM</p>
                </div>
                
                <div className="relative w-full md:w-[400px]">
                    <div className="absolute inset-0 bg-gray-50 rounded-[2rem] -z-10 bg-opacity-50 blur-xl" />
                    <Search className="w-6 h-6 absolute left-6 top-5 text-gray-300" />
                    <input 
                        type="text" 
                        value={search} 
                        onChange={e => setSearch(e.target.value)} 
                        placeholder="İsim veya telefon ara..."
                        className="w-full bg-white border border-gray-100 rounded-[2.5rem] pl-16 pr-8 py-5 font-black text-sm tracking-tight shadow-xl shadow-indigo-600/5 transition-all outline-none focus:ring-2 focus:ring-indigo-100" 
                    />
                </div>

                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(true)} 
                    className="bg-black text-white px-8 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.1em] flex items-center gap-3 shadow-2xl shadow-black/20 hover:bg-gray-900 transition-all"
                >
                    <Plus className="w-5 h-5" /> Danışan Kaydet
                </motion.button>
            </div>

            {/* Smart Intelligence Stacks */}
            <div className="flex gap-6 mb-12 overflow-x-auto no-scrollbar pb-6 px-4">
                <SmartStack 
                    icon={Activity} label="Tüm Kayıtlar" count={customers.length} color="text-indigo-600"
                    active={activeStack === 'Hepsi'} onClick={() => setActiveStack('Hepsi')} 
                />
                <SmartStack 
                    icon={Star} label="VIP Danışanlar" count={customers.filter(c => c.segment === 'VIP').length} color="text-amber-500"
                    active={activeStack === 'VIP'} onClick={() => setActiveStack('VIP')} 
                />
                <SmartStack 
                    icon={Zap} label="Risk Grubu" count={insights.churn.length} color="text-red-500"
                    active={activeStack === 'Risk'} onClick={() => setActiveStack('Risk')} 
                />
                <SmartStack 
                    icon={PackageIcon} label="Yenileme Bekleyen" count={insights.upsell.length} color="text-emerald-500"
                    active={activeStack === 'Upsell'} onClick={() => setActiveStack('Upsell')} 
                />
                <SmartStack 
                    icon={Gift} label="Doğum Günü" count={insights.birthdays.length} color="text-pink-500"
                    active={activeStack === 'Dogum'} onClick={() => setActiveStack('Dogum')} 
                />
                 <SmartStack 
                    icon={Calendar} label="Bugün Aktif" count={customers.filter(c => getCustomerAppointments(c.id).some(a => a.date === new Date().toISOString().split('T')[0])).length} color="text-indigo-400"
                    active={activeStack === 'Bugün'} onClick={() => setActiveStack('Bugün')} 
                />
            </div>

            {/* Modern Card-Like List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                <AnimatePresence>
                    {filtered.length === 0 ? (
                        <div className="col-span-full py-40 text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto mb-6 text-gray-200"><User className="w-12 h-12" /></div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Sonuç Bulunamadı</p>
                        </div>
                    ) : (
                        filtered.map(c => {
                            const stats = {
                                appt: getCustomerAppointments(c.id).length,
                                spent: getCustomerPayments(c.id).reduce((s, p) => s + (p.totalAmount || 0), 0)
                            };
                            return (
                                <motion.div 
                                    layout
                                    key={c.id} 
                                    initial={{ opacity: 0, scale: 0.95 }} 
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    onClick={() => setSelectedCustomer(c)}
                                    className="group relative bg-white rounded-[4rem] p-10 shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-indigo-600/10 transition-all cursor-pointer flex flex-col gap-8 overflow-hidden"
                                >
                                    {/* Card Header */}
                                    <div className="flex justify-between items-start">
                                        <div className="flex gap-5 items-center">
                                            <div className={`w-16 h-16 rounded-[2.5rem] flex items-center justify-center font-black text-2xl transition-all shadow-md border-4 ${
                                                c.segment === 'VIP' ? 'bg-amber-50 border-amber-200 text-amber-600' :
                                                insights.churn.some(risk => risk.id === c.id) ? 'bg-red-50 border-red-100 text-red-600' :
                                                'bg-indigo-50 border-white text-indigo-600 group-hover:bg-indigo-600 group-hover:text-white'
                                            }`}>
                                                {c.name.charAt(0)}
                                            </div>
                                            <div>
                                                <h3 className="text-2xl font-black italic tracking-tighter uppercase leading-none group-hover:text-indigo-600 transition-colors">{c.name}</h3>
                                                <p className="text-[10px] font-black uppercase text-gray-400 mt-2 tracking-widest">{c.phone}</p>
                                            </div>
                                        </div>
                                        <div className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${c.segment === 'VIP' ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-gray-50 text-gray-400 border-gray-100'}`}>
                                            {c.segment}
                                        </div>
                                    </div>

                                    {/* Brief Summary with Icons */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 bg-gray-50 rounded-3xl flex flex-col items-center justify-center text-center">
                                            <p className="text-xl font-black italic text-gray-900 leading-none">{stats.appt}</p>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Randevu</p>
                                        </div>
                                        <div className="p-4 bg-gray-50 rounded-3xl flex flex-col items-center justify-center text-center">
                                            <p className="text-xl font-black italic text-indigo-600 leading-none">₺{stats.spent.toLocaleString('tr-TR')}</p>
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mt-1">Harcama</p>
                                        </div>
                                    </div>

                                    {/* Footer Button */}
                                    <button className="w-full py-4 bg-gray-50 text-gray-500 rounded-3xl text-[10px] font-black uppercase tracking-widest group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-sm">Danışan Detayı</button>
                                    
                                    {/* Decoration */}
                                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-[0.03] transition-all -z-10 bg-indigo-600 w-full h-full blur-3xl rounded-full" />
                                </motion.div>
                            );
                        })
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
