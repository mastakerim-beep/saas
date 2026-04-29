"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStore, Customer, Appointment, Package, Payment, Quote, Room } from '@/lib/store';
import { 
    User, CheckCircle, ArrowLeft, MessageCircle, Download, Clock, Tag, 
    MessageSquare, Search, X, Phone, Mail, Calendar, ChevronRight, ChevronLeft,
    Package as PackageIcon, Star, Banknote, CreditCard, Building2, Trash2, Crown,
    Zap, Activity, Heart, Shield, RefreshCw, BarChart3, TrendingUp, Sparkles, MapPin, Gauge,
    ArrowUpRight, Info, Plus, FileText, Gift, Settings, AlertCircle, Edit2, Globe, Languages, Users, ArrowDownRight, Printer,
    Calendar as CalendarIcon, Bot, Target
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BookingModal from '@/components/calendar/BookingModal';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import ExportDropdown from '@/components/ui/ExportDropdown';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import DataImportWizard from '@/components/ui/DataImportWizard';

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
                        onClick={async () => { 
                            const c = await addCustomer(form); 
                            onSave(c); 
                        }}
                        className="flex-[2] py-4 bg-indigo-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-700 shadow-xl shadow-indigo-600/20 transition-all disabled:opacity-40">
                        Kaydı Tamamla ✓
                    </button>
                </div>
            </motion.div>
        </motion.div>
    );
}

// ---- ADD BIOMETRIC MODAL ----
function AddBiometricModal({ customerId, onClose, onSave }: { customerId: string; onClose: () => void; onSave: () => void }) {
    const { addBiometric } = useStore();
    const [form, setForm] = useState({ 
        weight: 0, 
        bodyFatPercent: 0, 
        muscleFatPercent: 0, 
        visceralFatLevel: 0,
        basalMetabolism: 0,
        wellnessAge: 0,
        mobilityScore: 0,
        balanceScore: 0,
        strengthScore: 0,
        source: 'Manuel'
    });
    const h = (k: string, v: number) => setForm(f => ({ ...f, [k]: v }));

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-black/60 backdrop-blur-md z-[2000] flex items-center justify-center p-4">
            <motion.div initial={{ y: 20, scale: 0.95 }} animate={{ y: 0, scale: 1 }} className="bg-white rounded-[3rem] shadow-2xl w-full max-w-2xl overflow-hidden border border-white/20">
                <div className="flex items-center justify-between px-10 pt-10 pb-6 border-b border-gray-50">
                    <div>
                        <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">Ölçüm Kaydı</h2>
                        <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1 italic">Manuel Biyometrik Veri Girişi</p>
                    </div>
                    <button onClick={onClose} className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="p-10 grid grid-cols-2 gap-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Vücut Bileşimi</label>
                        <div className="space-y-4 p-6 bg-gray-50 rounded-[2rem] border border-gray-100">
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase mb-2">Ağırlık (kg)</p>
                                <input type="number" step="0.1" value={form.weight || ''} onChange={e => h('weight', Number(e.target.value))} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase mb-2">Yağ Oranı (%)</p>
                                <input type="number" step="0.1" value={form.bodyFatPercent || ''} onChange={e => h('bodyFatPercent', Number(e.target.value))} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-500 uppercase mb-2">Kas Kütlesi (kg)</p>
                                <input type="number" step="0.1" value={form.muscleFatPercent || ''} onChange={e => h('muscleFatPercent', Number(e.target.value))} className="w-full bg-white border border-gray-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Metabolik Veriler</label>
                        <div className="space-y-4 p-6 bg-amber-50/30 rounded-[2rem] border border-amber-50">
                            <div>
                                <p className="text-[9px] font-black text-amber-600 uppercase mb-2">İç Yağlanma (Level)</p>
                                <input type="number" value={form.visceralFatLevel || ''} onChange={e => h('visceralFatLevel', Number(e.target.value))} className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-amber-600 uppercase mb-2">Bazal Meta. (kcal)</p>
                                <input type="number" value={form.basalMetabolism || ''} onChange={e => h('basalMetabolism', Number(e.target.value))} className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-amber-600 uppercase mb-2">Metabolik Yaş</p>
                                <input type="number" value={form.wellnessAge || ''} onChange={e => h('wellnessAge', Number(e.target.value))} className="w-full bg-white border border-amber-100 rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" />
                            </div>
                        </div>
                    </div>

                    <div className="col-span-2 space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Fonksiyonel Skorlar (0-100)</label>
                        <div className="grid grid-cols-3 gap-6 p-6 bg-black rounded-[2rem]">
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Mobilite</p>
                                <input type="number" max="100" value={form.mobilityScore || ''} onChange={e => h('mobilityScore', Number(e.target.value))} className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Denge</p>
                                <input type="number" max="100" value={form.balanceScore || ''} onChange={e => h('balanceScore', Number(e.target.value))} className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" />
                            </div>
                            <div>
                                <p className="text-[9px] font-black text-gray-400 uppercase mb-2">Güç</p>
                                <input type="number" max="100" value={form.strengthScore || ''} onChange={e => h('strengthScore', Number(e.target.value))} className="w-full bg-white/10 border border-white/10 text-white rounded-xl px-4 py-3 text-sm font-black outline-none focus:border-amber-400 transition-all" />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="px-10 pb-10 pt-4 flex gap-4">
                    <button onClick={onClose} className="flex-1 py-4 bg-gray-50 text-gray-500 font-black uppercase tracking-widest rounded-2xl hover:bg-gray-100 transition-all">İptal</button>
                    <button
                        onClick={async () => { 
                            await addBiometric({ ...form, customerId }); 
                            onSave(); 
                        }}
                        className="flex-[2] py-4 bg-black text-white font-black uppercase tracking-widest rounded-2xl hover:bg-gray-800 shadow-xl shadow-black/20 transition-all">
                        VERİLERİ KAYDET ✓
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
        deleteCustomer,
        addLog,
        staffMembers,
        rooms,
        can,
        currentBranch,
        quotes,
        addQuote,
        deleteQuote,
        getWallet,
        loadWallet,
        walletTransactions,
        debts,
        customerBiometrics,
        addCoupon,
        coupons
    } = useStore();
    const [activeMenu, setActiveMenu] = useState('Detaylar');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(true);
    const [quickNote, setQuickNote] = useState('');
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Customer>>({ ...customer });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<{staffId: string, time: string, customerId?: string} | null>(null);
    const [showBioModal, setShowBioModal] = useState(false);

    const customerQuotes = quotes.filter((q: Quote) => q.customerId === customer.id);

    const handleSave = async () => {
        setIsSaving(true);
        try {
            updateCustomer(customer.id, editForm);
            setSaveSuccess(true);
            setTimeout(() => setSaveSuccess(false), 3000);
            addLog('Müşteri Bilgileri Güncellendi', customer.name, 'Form ile güncelleme', JSON.stringify(editForm));
        } catch (e) {
            console.error(e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDelete = async () => {
        const success = await deleteCustomer(customer.id);
        if (success) {
            addLog('Müşteri Silindi', customer.name, 'Kalıcı silme', 'Silinen Danışan: ' + customer.name);
            onClose();
        }
    };

    const downloadPDF = (quote: Quote) => {
        const doc = new jsPDF() as any;
        doc.setFillColor(79, 70, 229);
        doc.rect(0, 0, 210, 40, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(24);
        doc.text('AURA SPA PRO', 20, 25);
        doc.setTextColor(50, 50, 50);
        doc.text(`Teklif: ${quote.customerName}`, 20, 60);
        doc.autoTable({
            startY: 80,
            head: [['Hizmet', 'Tutar', 'Tarih']],
            body: [[quote.serviceName, `₺${quote.amount}`, new Date(quote.createdAt || '').toLocaleDateString('tr-TR')]],
            headStyles: { fillColor: [79, 70, 229] }
        });
        doc.save(`Teklif_${quote.customerName}.pdf`);
    };

    const pkgs = getCustomerPackages(customer.id);
    const appts = getCustomerAppointments(customer.id).sort((a: Appointment, b: Appointment) => (b.date || '').localeCompare(a.date || ''));
    const payments = getCustomerPayments(customer.id);
    const totalSpent = payments.reduce((s: number, p: Payment) => s + (p.totalAmount || 0), 0);
    const latestBio = (customerBiometrics || [])
        .filter((b: any) => b.customerId === customer.id)
        .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''))[0];

    const statusLabels: Record<string, { label: string; cls: string; icon: any }> = {
        completed: { label: 'Tamamlandı', cls: 'bg-green-500/10 text-green-600 border-green-500/20', icon: CheckCircle },
        pending:   { label: 'Beklemede',  cls: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20', icon: Clock },
        excused:   { label: 'Mazeretli',  cls: 'bg-blue-500/10 text-blue-600 border-blue-500/20', icon: Info },
        cancelled: { label: 'İptal',      cls: 'bg-orange-500/10 text-orange-600 border-orange-500/20', icon: X },
        'no-show': { label: 'Gelmedi',    cls: 'bg-red-500/10 text-red-600 border-red-500/20', icon: User },
    };

    const menuItems = [
        { id: 'Detaylar', label: 'Detaylar', icon: Info },
        { id: 'AI Analiz', label: 'AI Analiz', icon: Bot },
        { id: 'Düzenle', label: 'Düzenle', icon: Edit2 },
        { id: 'Formlar', label: 'Formlar', icon: FileText },
        { id: 'Teklif', label: 'Teklif', icon: Zap },
        { id: 'Randevu', label: 'Randevu', icon: Calendar },
        { id: 'Notlar', label: 'Notlar', icon: MessageSquare },
        { id: 'Dosya & Fotoğraf', label: 'Dosya & Fotoğraf', icon: Sparkles },
        { id: 'wellness', label: 'Biyometrik & Wellness', icon: Activity },
        { id: 'Satış & Tahsilat', label: 'Satış & Tahsilat', icon: Banknote },
        { id: 'Faturalar', label: 'Faturalar', icon: FileText },
        { id: 'Puan', label: 'Cüzdan & Sadakat', icon: Star },
        { id: 'Paket Takibi', label: 'Paket Takibi', icon: PackageIcon },
        { id: 'Kuponlar', label: 'Imperial Kuponlar', icon: Gift },
        { id: 'Yolculuk', label: 'Müşteri Yolculuğu', icon: TrendingUp },
    ];

    const getAiInsights = () => {
        const history = appts;
        const customerDebts = (debts || []).filter((d: any) => d.customerId === customer.id && d.status === 'açık');
        const overdueTotal = customerDebts.filter((d: any) => new Date(d.dueDate) < new Date()).reduce((s: number, d: any) => s + d.amount, 0);

        let logic = [];
        if (overdueTotal > 0) {
            logic.push({ title: 'Kritik Tahsilat Uyarısı', desc: `₺${overdueTotal.toLocaleString('tr-TR')} tutarında gecikmiş borç var.`, impact: 'high', category: 'risk' });
        }
        if (history.length > 5 && !pkgs.length) {
            logic.push({ title: 'Paket Satış Fırsatı', desc: 'Müşteri sadık ancak aktif paket sahibi değil. %20 tasarruf teklif edilebilir.', impact: 'medium', category: 'sales' });
        }
        if (history.length > 0) {
            const lastAppt = history[0];
            const daysSince = (new Date().getTime() - new Date(lastAppt.date).getTime()) / (1000 * 3600 * 24);
            if (daysSince > 60) {
                logic.push({ title: 'Müşteri Kayıp Riski', desc: 'Son işlemden bu yana 60 günden fazla geçti. Bir hatırlatma ile iletişime geçin.', impact: 'high', category: 'churn' });
            }
        }
        return logic;
    };

    const insights = getAiInsights();

    return (
        <motion.div 
            initial={{ opacity: 0, x: 20 }} 
            animate={{ opacity: 1, x: 0 }} 
            className="fixed inset-0 top-[84px] bg-[#F8F9FD] z-40 flex overflow-hidden"
        >
            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {showDeleteConfirm && (
                    <motion.div 
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                    >
                        <motion.div 
                            initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                            className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center"
                        >
                            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-8">
                                <Trash2 className="w-10 h-10 text-red-500 animate-pulse" />
                            </div>
                            <h2 className="text-2xl font-black uppercase italic tracking-tighter mb-4">Müşteriyi Sil?</h2>
                            <p className="text-gray-500 text-sm font-medium mb-10 leading-relaxed">
                                <span className="font-black text-gray-900">{customer.name}</span> isimli danışanı kalıcı olarak silmek istediğinizden emin misiniz? Bu işlem geri alınamaz.
                            </p>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setShowDeleteConfirm(false)}
                                    className="flex-1 py-4 bg-gray-50 text-gray-400 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all"
                                >
                                    Vazgeç
                                </button>
                                <button 
                                    onClick={handleDelete}
                                    className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-red-600/20 hover:scale-[1.02] active:scale-95 transition-all"
                                >
                                    Evet, Kalıcı Sil
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
            {/* Sidebar (Inner) */}
            <motion.div 
                animate={{ width: isSidebarCollapsed ? 88 : 280 }}
                transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                onMouseEnter={() => setIsSidebarCollapsed(false)}
                onMouseLeave={() => setIsSidebarCollapsed(true)}
                className="bg-white border-r border-gray-100 flex flex-col p-6 sticky top-0 h-full overflow-hidden group/sbar z-[60]"
            >
                <div className="flex items-center justify-between mb-10">
                    {!isSidebarCollapsed && (
                        <button onClick={onClose} className="flex items-center gap-2 text-gray-400 hover:text-indigo-600 transition-colors">
                            <ArrowLeft className="w-5 h-5" />
                            <span className="text-[10px] font-black uppercase tracking-widest">Geri Dön</span>
                        </button>
                    )}
                    {isSidebarCollapsed && (
                        <button onClick={onClose} className="mx-auto text-gray-400 hover:text-indigo-600 transition-colors">
                            <ArrowLeft className="w-5 h-5 shadow-sm" />
                        </button>
                    )}
                </div>

                <div 
                    className={`absolute top-24 -right-1 w-2 h-16 bg-indigo-500/10 rounded-full flex items-center justify-center transition-all ${isSidebarCollapsed ? 'opacity-100' : 'opacity-0'}`}
                >
                    <div className="w-1 h-8 bg-indigo-600/30 rounded-full" />
                </div>
                
                <div className="space-y-1 flex-1 overflow-y-auto no-scrollbar">
                    {menuItems.map(item => (
                        <button
                            key={item.id}
                            onClick={() => setActiveMenu(item.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-bold text-sm
                                ${activeMenu === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-gray-500 hover:bg-gray-50'}
                                ${isSidebarCollapsed ? 'justify-center border-none shadow-none' : ''}
                            `}
                        >
                            <item.icon className={`w-4 h-4 shrink-0 ${activeMenu === item.id ? 'text-white' : 'text-gray-400'}`} />
                            {!isSidebarCollapsed && <span className="truncate">{item.label}</span>}
                        </button>
                    ))}
                </div>
            </motion.div>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto bg-[#F8F9FD] scroll-smooth">
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
                                            { label: 'Teklif', count: customerQuotes.length, color: 'text-amber-600', bg: 'bg-amber-50' },
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
                                                <span className="text-sm font-bold text-gray-600">{customer.createdAt?.split('T')[0] || '---'}</span>
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
                                                <span className="text-sm font-bold text-gray-600">{currentBranch?.name || 'Aura İşletme'}</span>
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
                                                <span className="text-sm font-bold text-gray-400 italic">{customer.createdAt?.split('T')[0] || '---'} 21:22</span>
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

                        {activeMenu === 'Teklif' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                    <div className="p-8 border-b border-gray-50 flex justify-between items-center">
                                        <h3 className="text-xl font-black italic tracking-tighter uppercase italic">Teklifler</h3>
                                        <button 
                                            onClick={() => addQuote({ customerId: customer.id, customerName: customer.name, status: 'Taslak', amount: 0, serviceName: 'Yeni Hizmet Paketi', validUntil: new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0] })}
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
                                                                        onClick={() => downloadPDF(q)}
                                                                        className="p-2 bg-indigo-600 text-white rounded-lg shadow-md hover:scale-110 transition-all"
                                                                    >
                                                                        <Download className="w-4 h-4" />
                                                                    </button>
                                                                    <button onClick={() => deleteQuote(q.id)} className="p-2 bg-white border border-gray-100 rounded-lg text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
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
                        )}

                        {activeMenu === 'Randevu' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                                     <div className="p-8 border-b border-gray-50 flex justify-between items-center bg-white sticky top-0 z-10">
                                         <h3 className="text-xl font-black italic tracking-tighter uppercase">Randevular</h3>
                                         <div className="relative group">
                                             <button className="px-5 py-2.5 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-2 shadow-sm">
                                                 İşlemler <ChevronRight className="w-4 h-4 rotate-90 group-focus-within:-rotate-90 transition-transform" />
                                             </button>
                                             <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-100 opacity-0 invisible group-focus-within:opacity-100 group-focus-within:visible transition-all z-[100] overflow-hidden transform origin-top-right scale-95 group-focus-within:scale-100 p-2">
                                                 <button 
                                                    onClick={() => setSelectedSlot({ staffId: staffMembers[0]?.id || '', time: '09:00', customerId: customer.id })}
                                                    className="w-full px-4 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-indigo-50 hover:text-indigo-600 rounded-xl transition-colors flex items-center gap-3"><Plus className="w-4 h-4" /> Yeni Randevu</button>
                                                 <div className="my-1 border-t border-gray-50"></div>
                                                 <button className="w-full px-4 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><Download className="w-4 h-4" /> Çıktı Al</button>
                                             </div>
                                         </div>
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
                                                {appts.map((a: Appointment) => {
                                                    const s = statusLabels[a.status] ?? { label: a.status, cls: 'bg-gray-50 text-gray-400', icon: Info };
                                                    return (
                                                        <tr key={a.id} className="hover:bg-gray-50/50 transition-all group">
                                                            <td className="px-8 py-5">
                                                                <p className="text-sm font-bold text-gray-600">{new Date(a.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', weekday: 'long' })}</p>
                                                            </td>
                                                            <td className="px-8 py-5 font-black text-gray-900">{a.time}</td>
                                                            <td className="px-8 py-5 text-sm font-bold text-gray-500 uppercase">{a.staffName}</td>
                                                            <td className="px-8 py-5 text-sm font-bold text-indigo-600 italic">
                                                                {rooms.find((r: Room) => r.id === a.roomId)?.name || 'Atanmamış'}
                                                            </td>
                                                            <td className="px-8 py-5 font-black text-gray-700 italic">{a.service}</td>
                                                            <td className="px-8 py-5">
                                                                <select 
                                                                    disabled={!can('update_appointment_status')}
                                                                    value={a.status}
                                                                    onChange={(e) => updateAppointmentStatus(a.id, e.target.value as any)}
                                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border-2 outline-none appearance-none cursor-pointer tracking-widest disabled:opacity-50 transition-all ${s.cls}`}
                                                                >
                                                                    {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                                                                </select>
                                                            </td>
                                                            <td className="px-8 py-5 text-center">
                                                                <div className="flex justify-center gap-2">
                                                                    <button 
                                                                        disabled={!can('delete_appointment')}
                                                                        onClick={() => updateAppointmentStatus(a.id, 'cancelled')}
                                                                        title="Randevuyu İptal Et"
                                                                        className="w-7 h-7 bg-red-500 rounded-full flex items-center justify-center text-white hover:bg-red-600 transition-colors shadow-lg shadow-red-200 disabled:opacity-30 disabled:grayscale"
                                                                    >
                                                                        <X className="w-4 h-4" />
                                                                    </button>
                                                                    <div 
                                                                        title={a.note ? `Randevu Notu: ${a.note}` : 'Not eklenmemiş'}
                                                                        className="w-7 h-7 bg-green-600 rounded-lg flex items-center justify-center text-white cursor-help hover:bg-green-700 transition-colors shadow-lg shadow-green-100"
                                                                    >
                                                                        <FileText className="w-4 h-4" />
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="px-8 py-5 text-right">
                                                                <div className="flex justify-end gap-2 opacity-50 group-hover:opacity-100">
                                                                    <button 
                                                                        disabled={!can('update_appointment')}
                                                                        className="p-2 bg-white border border-gray-100 rounded-lg hover:border-indigo-600 transition-all disabled:opacity-30"
                                                                    >
                                                                        <Edit2 className="w-4 h-4 text-gray-400" />
                                                                    </button>
                                                                    <button 
                                                                        disabled={!can('manage_appointments')}
                                                                        className="p-2 bg-white border border-gray-100 rounded-lg disabled:opacity-30"
                                                                    >
                                                                        <ChevronRight className="w-4 h-4 text-gray-300 rotate-90" />
                                                                    </button>
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

                        {activeMenu === 'Düzenle' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 pb-32">
                                <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                                    <div>
                                        <h3 className="text-2xl font-black italic tracking-tighter uppercase italic">Müşteri Düzenle</h3>
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Sistem Kayıt ID: #{customer.id.substring(0,8)}</p>
                                    </div>
                                    <div className="flex gap-4">
                                        {saveSuccess && (
                                            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest animate-bounce">
                                                <CheckCircle className="w-4 h-4" /> Başarıyla Güncellendi
                                            </div>
                                        )}
                                        <button 
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                                        >
                                            {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                                            BİLGİLERİ GÜNCELLE
                                        </button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    {/* Kişisel Bilgiler */}
                                    <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm flex flex-col gap-8">
                                        <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><User className="w-5 h-5" /></div>
                                            <h4 className="text-[11px] font-black uppercase tracking-widest italic">Kişisel Bilgiler</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ad Soyad</label>
                                                <input 
                                                    type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">TC Kimlik / Pasaport</label>
                                                <input 
                                                    type="text" value={editForm.citizenshipNumber || ''} onChange={e => setEditForm({...editForm, citizenshipNumber: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefon</label>
                                                <input 
                                                    type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">E-Posta</label>
                                                <input 
                                                    type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cinsiyet</label>
                                                <select 
                                                    value={editForm.gender || ''} onChange={e => setEditForm({...editForm, gender: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                                                >
                                                    <option value="">Seçiniz</option>
                                                    <option value="Kadın">Kadın</option>
                                                    <option value="Erkek">Erkek</option>
                                                    <option value="Diğer">Diğer</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Doğum Tarihi</label>
                                                <input 
                                                    type="date" value={editForm.birthdate || ''} onChange={e => setEditForm({...editForm, birthdate: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Segment</label>
                                                <select 
                                                    value={editForm.segment} onChange={e => setEditForm({...editForm, segment: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                                                >
                                                    <option value="Normal">Normal</option>
                                                    <option value="VIP">VIP</option>
                                                    <option value="Vurgun">Vurgun</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Satış Temsilcisi</label>
                                                <select 
                                                    value={editForm.salesRepId || ''} onChange={e => setEditForm({...editForm, salesRepId: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                                                >
                                                    <option value="">Seçiniz</option>
                                                    {staffMembers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                                                </select>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Adres Bilgileri */}
                                    <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm flex flex-col gap-8">
                                        <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><MapPin className="w-5 h-5" /></div>
                                            <h4 className="text-[11px] font-black uppercase tracking-widest italic">Adres Bilgileri</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ülke</label>
                                                <input 
                                                    type="text" value={editForm.country || 'Türkiye'} onChange={e => setEditForm({...editForm, country: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Şehir</label>
                                                <input 
                                                    type="text" value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">İlçe</label>
                                                <input 
                                                    type="text" value={editForm.district || ''} onChange={e => setEditForm({...editForm, district: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Zaman Dilimi</label>
                                                <select 
                                                    value={editForm.timezone || 'Europe/Istanbul'} onChange={e => setEditForm({...editForm, timezone: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                                                >
                                                    <option value="Europe/Istanbul">GMT+3 (Istanbul)</option>
                                                    <option value="Europe/London">GMT+0 (London)</option>
                                                    <option value="America/New_York">GMT-5 (NYC)</option>
                                                </select>
                                            </div>
                                            <div className="col-span-2 flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tam Adres</label>
                                                <textarea 
                                                    value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-3xl p-6 text-sm font-bold outline-none transition-all resize-none min-h-[120px]"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Diğer Bilgiler */}
                                    <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm flex flex-col gap-8 md:col-span-2">
                                        <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                                            <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Settings className="w-5 h-5" /></div>
                                            <h4 className="text-[11px] font-black uppercase tracking-widest italic">İletişim & Pazarlama İzinleri</h4>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">SMS İzni</label>
                                                <select 
                                                    value={editForm.smsPermission || 'Hayır'} onChange={e => setEditForm({...editForm, smsPermission: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                                                >
                                                    <option value="Evet">Evet, İzin Ver</option>
                                                    <option value="Hayır">Hayır, İzin Verme</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">E-Posta İzni</label>
                                                <select 
                                                    value={editForm.emailPermission || 'Evet'} onChange={e => setEditForm({...editForm, emailPermission: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                                                >
                                                    <option value="Evet">Evet, İzin Ver</option>
                                                    <option value="Hayır">Hayır, İzin Verme</option>
                                                </select>
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">İletişim Kaynağı</label>
                                                <input 
                                                    type="text" value={editForm.communicationSource || ''} onChange={e => setEditForm({...editForm, communicationSource: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                                                />
                                            </div>
                                            <div className="flex flex-col gap-2">
                                                <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">İletişim Tercihi</label>
                                                <select 
                                                    value={editForm.communicationChoice || ''} onChange={e => setEditForm({...editForm, communicationChoice: e.target.value})}
                                                    className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                                                >
                                                    <option value="">Seçiniz</option>
                                                    <option value="Telefon">Telefon</option>
                                                    <option value="WhatsApp">WhatsApp</option>
                                                    <option value="Email">Email</option>
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                        {activeMenu === 'wellness' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 pb-20">
                                {/* Header / Sync Status */}
                                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm p-8 flex flex-col md:flex-row justify-between items-center gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-200">
                                            <Activity className="w-8 h-8 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black italic tracking-tighter uppercase italic">Wellness & Biyometrik</h3>
                                            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mt-1">
                                                {latestBio?.source === 'Manuel' ? 'Manuel Ölçüm Verileri' : 'Technogym Mywellness Entegrasyonu'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4">
                                        <div className="px-6 py-3 bg-gray-50 rounded-xl border border-gray-100 flex flex-col items-center justify-center">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Son Veri</p>
                                            <p className="text-xs font-black text-gray-900">{latestBio ? new Date(latestBio.createdAt).toLocaleDateString('tr-TR') : 'Kayıt Yok'}</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowBioModal(true)}
                                            className="px-8 py-3 bg-amber-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-amber-500/20 flex items-center gap-3">
                                            <Plus className="w-4 h-4" /> ÖLÇÜM EKLE
                                        </button>
                                        <button className="px-8 py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-black/10 flex items-center gap-3">
                                            <RefreshCw className="w-4 h-4" /> SYNC
                                        </button>
                                    </div>
                                </div>

                                {!latestBio ? (
                                    <div className="bg-white border-2 border-dashed border-gray-100 rounded-[3rem] py-32 text-center flex flex-col items-center gap-6">
                                        <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300">
                                            <Activity size={40} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-black text-gray-400 uppercase tracking-[0.2em]">Henüz Biyometrik Veri Girişi Yapılmamış</p>
                                            <p className="text-[10px] font-bold text-gray-300 mt-2">Müşterinin vücut kompozisyonu ve fitness seviyesini takip etmek için ilk ölçümü ekleyin.</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowBioModal(true)}
                                            className="px-10 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 transition-all"
                                        >
                                            İLK ÖLÇÜMÜ KAYDET
                                        </button>
                                    </div>
                                ) : (
                                    <>
                                        {/* Main Stats Grid */}
                                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                            {[
                                                { label: 'Ağırlık', value: latestBio.weight || '---', unit: 'kg', icon: Target, color: 'indigo', status: 'normal' },
                                                { label: 'Yağ %', value: latestBio.bodyFatPercent || '---', unit: '%', icon: Activity, color: 'amber', status: (latestBio.bodyFatPercent || 0) > 25 ? 'warning' : 'normal' },
                                                { label: 'Kas Kütlesi', value: latestBio.muscleFatPercent || '---', unit: 'kg', icon: Zap, color: 'blue', status: 'good' },
                                                { label: 'Meta. Yaş', value: latestBio.wellnessAge || '---', unit: 'yaş', icon: Heart, color: 'green', status: 'normal' },
                                            ].map((stat, i) => (
                                                <div key={i} className="bg-white rounded-[2rem] p-8 border border-gray-50 shadow-sm hover:shadow-md transition-all group">
                                                    <div className="flex justify-between items-start mb-6">
                                                        <div className={`p-3 rounded-xl bg-${stat.color}-50 text-${stat.color}-600 group-hover:scale-110 transition-transform`}>
                                                            <stat.icon className="w-5 h-5" />
                                                        </div>
                                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase ${
                                                            stat.status === 'good' ? 'bg-green-100 text-green-600' : 
                                                            stat.status === 'warning' ? 'bg-amber-100 text-amber-600' : 'bg-gray-100 text-gray-400'
                                                        }`}>{stat.status}</span>
                                                    </div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                                    <div className="flex items-baseline gap-1">
                                                        <span className="text-4xl font-black italic tracking-tighter text-gray-900">{stat.value}</span>
                                                        <span className="text-sm font-black text-gray-400 uppercase italic">{stat.unit}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                            {/* Advanced Biometrics Panel */}
                                            <div className="lg:col-span-2 bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm space-y-10">
                                                <div className="flex justify-between items-center border-b border-gray-50 pb-6">
                                                    <h4 className="text-xl font-black italic tracking-tighter uppercase italic">Detaylı Analiz</h4>
                                                    <button className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">GEÇMİŞİ GÖR <ChevronRight className="w-4 h-4" /></button>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-10">
                                                    <div className="space-y-6">
                                                        <div className="p-6 bg-gray-50/50 rounded-2xl flex justify-between items-center border border-gray-100">
                                                            <div>
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">İç Yağlanma</p>
                                                                <p className="text-xl font-black italic tracking-tighter">Seviye {latestBio.visceralFatLevel || '---'}</p>
                                                            </div>
                                                            <div className="w-12 h-2 bg-gray-200 rounded-full overflow-hidden">
                                                                <div className="h-full bg-green-500 w-3/5" style={{ width: `${(latestBio.visceralFatLevel || 0) * 10}%` }} />
                                                            </div>
                                                        </div>
                                                        <div className="p-6 bg-gray-50/50 rounded-2xl flex justify-between items-center border border-gray-100">
                                                            <div>
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Bazal Metabolizma</p>
                                                                <p className="text-xl font-black italic tracking-tighter">{latestBio.basalMetabolism || '---'} kcal</p>
                                                            </div>
                                                        </div>
                                                        <div className="p-6 bg-gray-50/50 rounded-2xl flex justify-between items-center border border-gray-100">
                                                            <div>
                                                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Veri Kaynağı</p>
                                                                <p className="text-xl font-black italic tracking-tighter">{latestBio.source}</p>
                                                            </div>
                                                            <span className="text-[10px] font-black px-3 py-1 bg-indigo-100 text-indigo-600 rounded-lg">Doğrulanmış</span>
                                                        </div>
                                                    </div>

                                                    <div className="flex flex-col justify-center items-center p-8 bg-indigo-50/30 rounded-[2.5rem] border border-indigo-50 relative overflow-hidden">
                                                        <Bot className="w-24 h-24 text-indigo-100 absolute -bottom-4 -right-10 rotate-12" />
                                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-4">Wellness Advisor</p>
                                                        <div className="text-center space-y-4 relative z-10">
                                                            <p className="text-sm font-bold text-gray-700 italic leading-snug">
                                                                {(latestBio.bodyFatPercent || 0) > 20 
                                                                    ? "Yağ oranı düşüşü için kardiyo ve diyet planı güncellenmelidir." 
                                                                    : "Vücut analizi ideal seviyelerde. Mevcut rutini korumanız önerilir."}
                                                            </p>
                                                            <div className="h-[1px] bg-indigo-100 w-1/2 mx-auto" />
                                                            <p className="text-[10px] font-black text-indigo-400 italic">YZ Önerilen Hizmet: Aura Detoks</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Wellness Scores */}
                                            <div className="bg-black rounded-[3rem] p-10 text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
                                                <div className="absolute top-0 right-0 p-10 opacity-10">
                                                    <Shield size={160} />
                                                </div>
                                                <div className="relative z-10">
                                                    <h4 className="text-xl font-black italic tracking-tighter uppercase italic mb-10">Fonksiyonel Skor</h4>
                                                    <div className="space-y-8">
                                                        {[
                                                            { name: 'Mobilite', score: latestBio.mobilityScore || 0, color: 'yellow-400' },
                                                            { name: 'Denge', score: latestBio.balanceScore || 0, color: 'cyan-400' },
                                                            { name: 'Güç', score: latestBio.strengthScore || 0, color: 'rose-400' }
                                                        ].map((s, i) => (
                                                            <div key={i} className="space-y-2">
                                                                <div className="flex justify-between items-center">
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">{s.name}</span>
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-white">{s.score}/100</span>
                                                                </div>
                                                                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                                                    <motion.div 
                                                                        initial={{ width: 0 }}
                                                                        animate={{ width: `${s.score}%` }}
                                                                        className={`h-full bg-${s.color} rounded-full`}
                                                                    />
                                                                </div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="mt-12 bg-white/5 border border-white/10 p-6 rounded-2xl flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center text-white">
                                                        <Zap className="w-5 h-5" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">Wellness Seviyesi</p>
                                                        <p className="text-lg font-black italic text-white uppercase italic tracking-tighter">İmparatorluk Standardı</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </>
                                )}
                            </motion.div>
                        )}
                        {activeMenu === 'Satış & Tahsilat' && (
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
                                                <button className="w-full px-4 py-3 text-left text-[10px] font-black text-gray-600 uppercase tracking-widest hover:bg-gray-50 rounded-xl transition-colors flex items-center gap-3"><Download className="w-4 h-4" /> Excel'e Aktar</button>
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
                        )}
                        {activeMenu === 'Puan' && (
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
                                                ₺{getWallet(customer.id)?.balance?.toLocaleString('tr-TR') || '0,00'}
                                            </h3>
                                            <div className="flex gap-4">
                                                <button 
                                                    onClick={() => {
                                                        const amt = prompt('Yüklenecek tutarı giriniz (TL):');
                                                        if (amt && !isNaN(Number(amt))) {
                                                            loadWallet(customer.id, Number(amt), 'Manuel Bakiye Yükleme');
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
                                                {getWallet(customer.id)?.loyaltyPoints || 0} <span className="text-xl text-gray-400 not-italic ml-2">PUAN</span>
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
                                                {walletTransactions
                                                    .filter((tx: any) => tx.walletId === getWallet(customer.id)?.id)
                                                    .sort((a: any, b: any) => (b.createdAt || '').localeCompare(a.createdAt || ''))
                                                    .map((tx: any) => (
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
                                                {walletTransactions.filter((tx: any) => tx.walletId === getWallet(customer.id)?.id).length === 0 && (
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
                        )}

                        {activeMenu === 'Paket Takibi' && (
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
                        )}
                        {activeMenu === 'AI Analiz' && (
                            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8">
                                <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm overflow-hidden relative group">
                                    <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:rotate-12 transition-transform">
                                        <Bot size={200} />
                                    </div>
                                    <div className="relative z-10">
                                        <div className="mb-10">
                                            <h2 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic">YZ Strateji Danışmanı</h2>
                                            <p className="text-xs text-indigo-600 font-black mt-2 uppercase tracking-widest italic">Danışan verileri üzerinden anlık analiz sonuçları</p>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                            <div className={`card-apple p-7 rounded-[2.5rem] border flex items-center gap-6 ${insights.some(i => i.impact === 'high') ? 'border-red-100 bg-red-50/50' : 'border-indigo-100 bg-indigo-50/50'}`}>
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${insights.some(i => i.impact === 'high') ? 'bg-red-600 text-white shadow-xl shadow-red-200' : 'bg-indigo-600 text-white shadow-xl shadow-indigo-200'}`}>
                                                    <Bot size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">YZ Durum Notu</p>
                                                    <p className="text-sm font-black text-gray-900 italic">
                                                        {insights.length > 0 ? 
                                                            `${insights.length} adet stratejik öneri bulundu.` : 
                                                            "Danışan profili stabil."}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="card-apple p-7 rounded-[2.5rem] border border-gray-100 bg-white shadow-sm flex items-center gap-6">
                                                <div className="w-14 h-14 rounded-2xl bg-amber-50 flex items-center justify-center text-amber-500">
                                                    <Activity size={24} />
                                                </div>
                                                <div>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Ciro Potansiyeli</p>
                                                    <p className="text-sm font-black text-gray-900 italic">Bu danışan sistemde aktif bir portföye sahip.</p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-4">
                                            {insights.map((s: any, idx) => (
                                                <div key={idx} className={`p-8 border-2 rounded-[2.5rem] flex items-center gap-6 group transition-all ${s.impact === 'high' ? 'border-red-50 bg-red-50/20' : 'border-indigo-50 bg-indigo-50/10 hover:border-indigo-100'}`}>
                                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform ${s.impact === 'high' ? 'bg-red-600 text-white shadow-red-100' : 'bg-white text-indigo-600'}`}>
                                                        {s.impact === 'high' ? <AlertCircle className="w-8 h-8" /> : <Target className="w-8 h-8" />}
                                                    </div>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-3 mb-1">
                                                            <h4 className="font-black text-xl text-gray-900 italic uppercase tracking-tighter">{s.title}</h4>
                                                            <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${s.impact === 'high' ? 'bg-red-600 text-white' : 'bg-indigo-100 text-indigo-600'}`}>
                                                                {s.impact === 'high' ? 'KRİTİK' : 'FIRSAT'}
                                                            </span>
                                                        </div>
                                                        <p className="text-sm text-gray-500 font-bold">{s.desc}</p>
                                                    </div>
                                                    <button className="p-4 rounded-full bg-gray-50 text-gray-400 hover:bg-black hover:text-white transition-all transform hover:rotate-12">
                                                        <ChevronRight className="w-6 h-6" />
                                                    </button>
                                                </div>
                                            ))}
                                            {insights.length === 0 && (
                                                <div className="text-center py-20 bg-gray-50/50 rounded-[2.5rem] border-2 border-dashed border-gray-100">
                                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mx-auto mb-4 text-green-500 shadow-sm">
                                                        <CheckCircle className="w-10 h-10" />
                                                    </div>
                                                    <p className="text-sm font-black text-gray-400 uppercase tracking-widest italic leading-tight">Müşteri durumu mükemmel.<br/>Ekstra bir YZ uyarısı bulunmamaktadır.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeMenu === 'Kuponlar' && (
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
                                                if (!value || isNaN(Number(value))) return;
                                                
                                                await addCoupon({
                                                    customerId: customer.id,
                                                    code: code.toUpperCase(),
                                                    discountType: 'percentage',
                                                    discountValue: Number(value),
                                                    expiryDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
                                                });
                                            }}
                                            className="px-8 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl shadow-indigo-100"
                                         >
                                             YENİ KUPON ÜRET
                                         </button>
                                     </div>
                                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                         {coupons.filter((c: any) => c.customerId === customer.id).length === 0 && (
                                             <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 border-dashed flex flex-col items-center justify-center text-center">
                                                 <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-slate-300 mb-4 shadow-sm">
                                                     <Gift size={32} />
                                                 </div>
                                                 <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Henüz bu müşteri için aktif kupon bulunmamaktadır.</p>
                                             </div>
                                         )}
                                         
                                         {coupons.filter((c: any) => c.customerId === customer.id).map((c: any) => (
                                             <div key={c.id} className={`bg-gradient-to-br ${c.isUsed ? 'from-slate-400 to-slate-500' : 'from-indigo-600 to-purple-700'} p-8 rounded-[2.5rem] text-white relative overflow-hidden group`}>
                                                 <div className="absolute top-0 right-0 p-8 opacity-20 group-hover:scale-110 transition-transform">
                                                     <Crown size={80} />
                                                 </div>
                                                 <div className="relative z-10">
                                                     <p className="text-[10px] font-black uppercase tracking-widest text-indigo-200 mb-2 italic">{c.isUsed ? 'KULLANILDI' : 'AKTİF KUPON'}</p>
                                                     <h4 className="text-3xl font-black italic tracking-tight italic">{c.code}</h4>
                                                     <div className="mt-8 flex justify-between items-end">
                                                         <div>
                                                             <p className="text-[8px] font-black text-indigo-200 uppercase mb-1">SON KULLANIM</p>
                                                             <p className="text-xs font-bold font-mono lowercase tracking-tighter">
                                                                 {c.expiryDate ? new Date(c.expiryDate).toLocaleDateString('tr-TR') : 'Sınırsız'}
                                                             </p>
                                                         </div>
                                                         <div className="text-right">
                                                             <p className="text-[8px] font-black text-indigo-200 uppercase mb-1">İNDİRİM</p>
                                                             <p className="text-3xl font-black tracking-tighter">%{c.discountValue}</p>
                                                         </div>
                                                     </div>
                                                 </div>
                                                 {c.isUsed && (
                                                     <div className="absolute inset-0 bg-black/20 backdrop-blur-[2px] flex items-center justify-center">
                                                        <span className="rotate-[-12deg] border-4 border-white px-6 py-2 text-2xl font-black uppercase tracking-widest">GEÇERSİZ</span>
                                                     </div>
                                                 )}
                                             </div>
                                         ))}
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
                                        {[...appts.map((a: Appointment) => ({ type: 'appt', date: a.date, data: a })), 
                                          ...payments.map((p: Payment) => ({ type: 'payment', date: p.date, data: p }))]
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
            {showBioModal && (
                <AddBiometricModal 
                    customerId={customer.id} 
                    onClose={() => setShowBioModal(false)} 
                    onSave={() => {
                        setShowBioModal(false);
                        addLog('Yeni Biyometrik Veri Eklendi', customer.name, 'Manuel ölçüm kaydı', 'Sistem üzerinden manuel veri girişi yapıldı.');
                    }} 
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
    const [showImport, setShowImport] = useState(false);
    const [search, setSearch] = useState('');
    const [activeStack, setActiveStack] = useState('Hepsi');
    const [dateRange, setDateRange] = useState({ 
        start: '', 
        end: '' 
    });

    const searchParams = useSearchParams();
    const customerIdParam = searchParams.get('id');
    const searchTermParam = searchParams.get('search');

    useEffect(() => {
        if (customerIdParam && customers.length > 0) {
            const customer = customers.find((c: Customer) => c.id === customerIdParam);
            if (customer) {
                setSelectedCustomer(customer);
            }
        }
        if (searchTermParam) {
            setSearch(searchTermParam);
        }
    }, [customerIdParam, searchTermParam, customers]);

    const insights = useMemo(() => ({
        churn: getChurnRiskCustomers(),
        upsell: getUpsellPotentialCustomers(),
        birthdays: getBirthdaysToday()
    }), [getChurnRiskCustomers, getUpsellPotentialCustomers, getBirthdaysToday]);

    const filtered = useMemo(() => {
        let list = customers.filter((c: Customer) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
        
        if (activeStack === 'VIP') list = list.filter((c: Customer) => c.segment === 'VIP');
        if (activeStack === 'Risk') list = list.filter((c: Customer) => insights.churn.some((churnC: Customer) => churnC.id === c.id));
        if (activeStack === 'Upsell') list = list.filter((c: Customer) => insights.upsell.some((u: any) => u.customer.id === c.id));
        if (activeStack === 'Dogum') list = list.filter((c: Customer) => insights.birthdays.some((b: Customer) => b.id === c.id));
        if (activeStack === 'Bugün') {
             const today = new Date().toISOString().split('T')[0];
             list = list.filter((c: Customer) => getCustomerAppointments(c.id).some((a: Appointment) => a.date === today));
        }

        if (dateRange.start && dateRange.end) {
            list = list.filter((c: Customer) => {
                const customerDate = c.createdAt?.split('T')[0];
                return customerDate && customerDate >= dateRange.start && customerDate <= dateRange.end;
            });
        }
        
        return list;
    }, [customers, search, activeStack, insights, getCustomerAppointments, dateRange]);

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
                
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-[300px]">
                        <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                            type="text" 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="İsim veya telefon ara..."
                            className="w-full bg-white border border-gray-100 rounded-[2rem] pl-14 pr-6 py-4 font-black text-sm tracking-tight shadow-sm transition-all focus:ring-2 focus:ring-indigo-100 outline-none" 
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-[2rem] px-4 py-2 shadow-sm">
                        <CalendarIcon size={16} className="text-gray-300" />
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                            className="bg-transparent text-[10px] font-black uppercase outline-none"
                        />
                        <div className="w-2 h-[1px] bg-gray-200" />
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                            className="bg-transparent text-[10px] font-black uppercase outline-none"
                        />
                        {(dateRange.start || dateRange.end) && (
                            <button onClick={() => setDateRange({start: '', end: ''})} className="ml-2 text-rose-500"><X size={14}/></button>
                        )}
                    </div>

                    <button 
                        onClick={() => setShowImport(true)}
                        className="px-6 py-4 bg-white border border-gray-100 text-gray-500 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4 rotate-180" /> İÇE AKTAR
                    </button>
                    <ExportDropdown 
                        data={filtered}
                        filename="Aura_Musteri_Listesi"
                        title="Danışan Portalı Veri Raporu"
                        headers={["ID", "İsim Soyad", "Telefon", "Segment", "Harcama", "Randevu", "Kayıt Tarihi"]}
                        excelMapping={(c) => ({
                            "Referans": c.referenceCode || c.id.substring(0,8),
                            "Müşteri Adı": c.name,
                            "Telefon": c.phone,
                            "Segment": c.segment,
                            "Toplam Harcama": getCustomerPayments(c.id).reduce((s: number, p: Payment) => s + (p.totalAmount || 0), 0),
                            "Randevu Sayısı": getCustomerAppointments(c.id).length,
                            "Kayıt Tarihi": c.createdAt?.split('T')[0] || '---'
                        })}
                        pdfMapping={(c) => [
                            c.referenceCode || c.id.substring(0,5),
                            c.name,
                            c.phone,
                            c.segment,
                            `₺${getCustomerPayments(c.id).reduce((s: number, p: Payment) => s + (p.totalAmount || 0), 0).toLocaleString('tr-TR')}`,
                            getCustomerAppointments(c.id).length,
                            c.createdAt?.split('T')[0] || '---'
                        ]}
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
                    icon={Star} label="VIP Danışanlar" count={customers.filter((c: Customer) => c.segment === 'VIP').length} color="text-amber-500"
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
                    icon={Calendar} label="Bugün Aktif" count={customers.filter((c: Customer) => getCustomerAppointments(c.id).some((a: any) => a.date === new Date().toISOString().split('T')[0])).length} color="text-indigo-400"
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
                        filtered.map((c: Customer) => {
                            const stats = {
                                appt: getCustomerAppointments(c.id).length,
                                spent: getCustomerPayments(c.id).reduce((s: number, p: Payment) => s + (p.totalAmount || 0), 0)
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
                                                insights.churn.some((risk: Customer) => risk.id === c.id) ? 'bg-red-50 border-red-100 text-red-600' :
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

                                    {/* Freshness Bar */}
                                    <div className="space-y-1.5">
                                        <div className="flex justify-between items-end">
                                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest">Sadakat Tazeliği</p>
                                            <p className={`text-[8px] font-black uppercase tracking-widest ${
                                                insights.churn.some((risk: Customer) => risk.id === c.id) ? 'text-red-500' : 'text-green-500'
                                            }`}>
                                                {insights.churn.some((risk: Customer) => risk.id === c.id) ? 'RİSKLİ' : 'TAZE'}
                                            </p>
                                        </div>
                                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div 
                                                className={`h-full rounded-full ${
                                                    insights.churn.some((risk: Customer) => risk.id === c.id) ? 'bg-red-500' : 'bg-green-500'
                                                }`}
                                                style={{ width: insights.churn.some((risk: Customer) => risk.id === c.id) ? '30%' : '100%' }}
                                            />
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

            <AnimatePresence>
                {showImport && (
                    <DataImportWizard 
                        type="customers" 
                        onClose={() => setShowImport(false)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
