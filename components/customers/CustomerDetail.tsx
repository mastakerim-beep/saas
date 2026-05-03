"use client";

import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    User, ArrowLeft, MessageSquare, Calendar, Package as PackageIcon, 
    Star, Banknote, CreditCard, Activity, TrendingUp, Sparkles, Gift, Bot, 
    Edit2, Shield, Info, Plus
} from 'lucide-react';
import { useStore, Customer, Appointment, Payment, Quote, Room, StaffMember, Package } from '@/lib/store';
import BookingModal from '@/components/calendar/BookingModal';

// Extracted Components
import { AuraHealthScore } from './AuraHealthScore';
import { CustomerProfileSidebar } from './CustomerProfileSidebar';
import { CustomerTabDetaylar } from './CustomerTabDetaylar';
import { CustomerTabTeklif } from './CustomerTabTeklif';
import { CustomerTabRandevu } from './CustomerTabRandevu';
import { CustomerTabDuzenle } from './CustomerTabDuzenle';
import { CustomerTabWellness } from './CustomerTabWellness';
import { CustomerTabSatis } from './CustomerTabSatis';
import { CustomerTabPuan } from './CustomerTabPuan';
import { CustomerTabPaket } from './CustomerTabPaket';
import { CustomerTabAI } from './CustomerTabAI';
import { CustomerTabKuponlar } from './CustomerTabKuponlar';
import { CustomerTabYolculuk } from './CustomerTabYolculuk';
import { AddBiometricModal } from './AddBiometricModal';

interface CustomerDetailProps {
    customer: Customer;
    onClose: () => void;
}

export function CustomerDetail({ customer, onClose }: CustomerDetailProps) {
    const { 
        appointments, payments, packages, staffMembers, rooms, quotes, wallets, walletTransactions, 
        customerBiometrics, aiInsights, coupons,
        updateCustomer, deleteCustomer, updateAppointmentStatus, addLog, 
        addQuote, updateQuote, deleteQuote, loadWallet, addCoupon, addBiometric,
        can, currentBranch
    } = useStore();

    const [activeMenu, setActiveMenu] = useState('Detaylar');
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const [editForm, setEditForm] = useState<Partial<Customer>>({ ...customer });
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [quickNote, setQuickNote] = useState('');
    const [showBioModal, setShowBioModal] = useState(false);
    const [selectedSlot, setSelectedSlot] = useState<any>(null);

    const appts = useMemo(() => (appointments || []).filter(a => a.customerId === customer.id).sort((a,b) => b.date.localeCompare(a.date)), [appointments, customer.id]);
    const pays = useMemo(() => (payments || []).filter(p => p.customerId === customer.id).sort((a,b) => b.date.localeCompare(a.date)), [payments, customer.id]);
    const pkgs = useMemo(() => (packages || []).filter(p => p.customerId === customer.id), [packages, customer.id]);
    const customerQuotes = useMemo(() => (quotes || []).filter(q => q.customerId === customer.id), [quotes, customer.id]);
    const wallet = useMemo(() => (wallets || []).find(w => w.customerId === customer.id), [wallets, customer.id]);
    const walletTxs = useMemo(() => (walletTransactions || []).filter(tx => tx.walletId === wallet?.id), [walletTransactions, wallet?.id]);
    const biometrics = useMemo(() => (customerBiometrics || []).filter(b => b.customerId === customer.id).sort((a,b) => b.createdAt.localeCompare(a.createdAt)), [customerBiometrics, customer.id]);
    const insights = useMemo(() => (aiInsights || []).filter(i => i.customerId === customer.id), [aiInsights, customer.id]);
    const totalSpent = useMemo(() => pays.reduce((s, p) => s + (p.totalAmount || 0), 0), [pays]);

    const menuItems = [
        { id: 'Detaylar', label: 'Müşteri Özeti', icon: User },
        { id: 'Wellness', label: 'Wellness & Biyo', icon: Activity },
        { id: 'Teklif', label: 'Teklifler', icon: MessageSquare },
        { id: 'Randevu', label: 'Randevular', icon: Calendar },
        { id: 'Satış', label: 'Satış & Tahsilat', icon: Banknote },
        { id: 'Paket', label: 'Paket Takibi', icon: PackageIcon },
        { id: 'Puan', label: 'Cüzdan & Sadakat', icon: CreditCard },
        { id: 'AI', label: 'AI Analiz', icon: Bot },
        { id: 'Yolculuk', label: 'Müşteri Yolculuğu', icon: TrendingUp },
        { id: 'Kuponlar', label: 'Kuponlar', icon: Gift },
        { id: 'Düzenle', label: 'Profil Düzenle', icon: Edit2 },
    ];

    const statusLabels: any = {
        'beklemede': { label: 'Beklemede', cls: 'bg-amber-50 text-amber-600 border-amber-100', icon: Clock },
        'onaylandi': { label: 'Onaylandı', cls: 'bg-green-50 text-green-600 border-green-100', icon: CheckCircle },
        'tamamlandi': { label: 'Tamamlandı', cls: 'bg-indigo-50 text-indigo-600 border-indigo-100', icon: Shield },
        'gelmedi': { label: 'Gelmedi', cls: 'bg-red-50 text-red-600 border-red-100', icon: X },
        'cancelled': { label: 'İptal', cls: 'bg-gray-100 text-gray-400 border-gray-200', icon: Info }
    };

    const handleSave = async () => {
        setIsSaving(true);
        await updateCustomer(customer.id, editForm);
        setIsSaving(false);
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
    };

    return (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="fixed inset-0 bg-[#F8F9FD] z-[50] flex overflow-hidden">
            <CustomerProfileSidebar 
                menuItems={menuItems} activeMenu={activeMenu} setActiveMenu={setActiveMenu}
                isSidebarCollapsed={isSidebarCollapsed} setIsSidebarCollapsed={setIsSidebarCollapsed}
                onClose={onClose}
            />

            <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar">
                <header className="bg-white border-b border-gray-100 px-12 py-10 flex justify-between items-center sticky top-0 z-40 backdrop-blur-md bg-white/80">
                    <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-indigo-600 rounded-[2rem] flex items-center justify-center text-white font-black text-2xl shadow-xl shadow-indigo-100">
                            {customer.name.charAt(0)}
                        </div>
                        <div>
                            <div className="flex items-center gap-3">
                                <h1 className="text-4xl font-black italic tracking-tighter uppercase italic">{customer.name}</h1>
                                <AuraHealthScore customer={customer} appointments={appts} payments={pays} />
                            </div>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 italic">{customer.phone} • {customer.email || 'E-posta girilmedi'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right mr-4 hidden md:block">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Toplam Harcama</p>
                            <p className="text-2xl font-black italic text-indigo-600">₺{totalSpent.toLocaleString('tr-TR')}</p>
                        </div>
                        <button className="p-4 bg-gray-50 hover:bg-gray-100 text-gray-400 hover:text-indigo-600 rounded-2xl transition-all"><MessageSquare className="w-6 h-6" /></button>
                        <button onClick={onClose} className="p-4 bg-gray-50 hover:bg-red-50 text-gray-400 hover:text-red-500 rounded-2xl transition-all"><X className="w-6 h-6" /></button>
                    </div>
                </header>

                <div className="p-12">
                    <AnimatePresence mode="wait">
                        {activeMenu === 'Detaylar' && (
                            <CustomerTabDetaylar 
                                customer={customer} appts={appts} payments={pays} customerQuotes={customerQuotes}
                                currentBranch={currentBranch} staffMembers={staffMembers} quickNote={quickNote} setQuickNote={setQuickNote}
                                onAddAppointment={() => setSelectedSlot({ customerId: customer.id, customerName: customer.name })}
                                onAddQuote={() => {}} onDelete={() => deleteCustomer(customer.id).then(onClose)}
                            />
                        )}
                        {activeMenu === 'Wellness' && (
                            <CustomerTabWellness 
                                customer={customer} latestBio={biometrics[0]} onAddMeasure={() => setShowBioModal(true)}
                            />
                        )}
                        {activeMenu === 'Randevu' && (
                            <CustomerTabRandevu 
                                appts={appts} rooms={rooms} staffMembers={staffMembers} statusLabels={statusLabels}
                                can={can} updateAppointmentStatus={updateAppointmentStatus} onAddAppointment={() => setSelectedSlot({ customerId: customer.id, customerName: customer.name })}
                            />
                        )}
                        {activeMenu === 'Teklif' && (
                            <CustomerTabTeklif 
                                customerQuotes={customerQuotes} onAddQuote={() => {}} onDeleteQuote={deleteQuote} onDownloadPDF={() => {}}
                            />
                        )}
                        {activeMenu === 'Satış' && (
                            <CustomerTabSatis payments={pays} currentBranch={currentBranch} totalSpent={totalSpent} />
                        )}
                        {activeMenu === 'Paket' && (
                            <CustomerTabPaket pkgs={pkgs} />
                        )}
                        {activeMenu === 'Puan' && (
                            <CustomerTabPuan 
                                customer={customer} wallet={wallet} walletTransactions={walletTxs}
                                onLoadWallet={(amt) => loadWallet(customer.id, amt)}
                            />
                        )}
                        {activeMenu === 'AI' && (
                            <CustomerTabAI insights={insights} />
                        )}
                        {activeMenu === 'Yolculuk' && (
                            <CustomerTabYolculuk appts={appts} payments={pays} />
                        )}
                        {activeMenu === 'Kuponlar' && (
                            <CustomerTabKuponlar 
                                coupons={coupons.filter(c => c.customerId === customer.id)}
                                onAddCoupon={(code, value) => addCoupon({ customerId: customer.id, code, discountValue: value, discountType: 'percentage' })}
                            />
                        )}
                        {activeMenu === 'Düzenle' && (
                            <CustomerTabDuzenle 
                                customer={customer} editForm={editForm} setEditForm={setEditForm}
                                handleSave={handleSave} isSaving={isSaving} saveSuccess={saveSuccess} staffMembers={staffMembers}
                            />
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
