"use client";

import { useStore, MembershipPlan, Customer, CustomerMembership, Package, PackageDefinition } from '@/lib/store';
import { 
    Zap, Star, Award, ShieldCheck,
    Plus, CreditCard, Users, 
    ChevronRight, CheckCircle2, 
    Settings, Crown, Calendar, X,
    ArrowRight, Trash2, History, ChevronDown, Info
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MembershipsPage() {
    const { 
        membershipPlans, customerMemberships, customers, 
        assignMembership, addMembershipPlan,
        packageDefinitions, packages, addPackageDefinition, addPackage, updatePackage, packageUsageHistory, addPackageUsageHistory,
        staffMembers, processCheckout, getTodayDate
    } = useStore();
    const [selectedTab, setSelectedTab] = useState<'plans' | 'members' | 'bundles' | 'customer_bundles'>('plans');

    // Modals
    const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
    const [isNewBundleOpen, setIsNewBundleOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);
    const [isSellBundleOpen, setIsSellBundleOpen] = useState(false);
    const [expandedPackageId, setExpandedPackageId] = useState<string | null>(null);

    // New Plan Form State
    const [newPlan, setNewPlan] = useState({ name: '', price: '', sessions: '', benefits: '' });
    
    // New Bundle Form State
    const [newBundle, setNewBundle] = useState({ name: '', price: '', sessions: '', validityDays: '365' });

    // Assign Form State
    const [assignCustomer, setAssignCustomer] = useState('');
    const [assignPlan, setAssignPlan] = useState('');
    
    // Sell Bundle Form State
    const [sellCustomer, setSellCustomer] = useState('');
    const [sellBundleDef, setSellBundleDef] = useState('');
    const [sellSellerId, setSellSellerId] = useState('');
    const [assignSellerId, setAssignSellerId] = useState('');

    const handleCreatePlan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlan.name || !newPlan.price || !newPlan.sessions) return;
        addMembershipPlan({
            name: newPlan.name,
            price: Number(newPlan.price),
            sessionsPerMonth: Number(newPlan.sessions),
            periodDays: 30, // Default 1 month
            benefits: newPlan.benefits.split(',').map(b => b.trim()).filter(b => b),
            allowedServices: ['all']
        });
        setIsNewPlanOpen(false);
        setNewPlan({ name: '', price: '', sessions: '', benefits: '' });
    };

    const handleCreateBundle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newBundle.name || !newBundle.price || !newBundle.sessions) return;
        addPackageDefinition({
            name: newBundle.name,
            price: Number(newBundle.price),
            totalSessions: Number(newBundle.sessions),
            validityDays: Number(newBundle.validityDays),
            isActive: true
        });
        setIsNewBundleOpen(false);
        setNewBundle({ name: '', price: '', sessions: '', validityDays: '365' });
    };

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignCustomer || !assignPlan || !assignSellerId) return;
        
        const plan = membershipPlans.find((p: MembershipPlan) => p.id === assignPlan);
        const customer = customers.find((c: Customer) => c.id === assignCustomer);
        
        assignMembership(assignCustomer, assignPlan);

        // Finansal kaydı oluştur (Prim için)
        processCheckout({
            customerId: assignCustomer,
            customerName: customer?.name || 'Müşteri',
            staffId: assignSellerId,
            totalAmount: plan?.price || 0,
            service: `${plan?.name} Üyelik Satışı`,
            date: getTodayDate(),
            methods: [{ id: crypto.randomUUID(), method: 'nakit', amount: plan?.price || 0, currency: 'TRY', rate: 1, isDeposit: false }]
        }, { isBundleOrMembershipSale: true });

        setIsAssignOpen(false);
        setAssignCustomer('');
        setAssignPlan('');
        setAssignSellerId('');
        setSelectedTab('members');
    };

    const handleSellBundle = (e: React.FormEvent) => {
        e.preventDefault();
        if (!sellCustomer || !sellBundleDef || !sellSellerId) return;
        const def = packageDefinitions.find((d: PackageDefinition) => d.id === sellBundleDef);
        const customer = customers.find((c: Customer) => c.id === sellCustomer);
        if (!def) return;

        // Check for rollover
        const existingExpired = packages.find((p: Package) => p.customerId === sellCustomer && p.definitionId === sellBundleDef && p.status === 'expired');
        let rolloverSessions = 0;
        if (existingExpired && confirm(`${existingExpired.totalSessions - existingExpired.usedSessions} adet devreden seans bulunmaktadır. Yeni pakete eklemek ister misiniz?`)) {
            const sessionsToRoll = existingExpired.totalSessions - existingExpired.usedSessions;
            rolloverSessions = sessionsToRoll;
            updatePackage(existingExpired.id, { status: 'finished', usedSessions: existingExpired.totalSessions }, {
                customerId: sellCustomer,
                action: 'rollover',
                sessionsImpact: sessionsToRoll,
                note: 'Yeni pakete devredildi'
            });
        }

        addPackage({
            customerId: sellCustomer,
            definitionId: sellBundleDef,
            name: def.name,
            totalSessions: def.totalSessions + rolloverSessions,
            usedSessions: 0,
            price: def.price,
            validityDays: def.validityDays || 365,
            status: 'active'
        });

        // Finansal kaydı oluştur (Prim için)
        processCheckout({
            customerId: sellCustomer,
            customerName: customer?.name || 'Müşteri',
            staffId: sellSellerId,
            totalAmount: def.price,
            service: `${def.name} Paket Satışı`,
            date: getTodayDate(),
            methods: [{ id: crypto.randomUUID(), method: 'nakit', amount: def.price, currency: 'TRY', rate: 1, isDeposit: false }]
        }, { isBundleOrMembershipSale: true });

        setIsSellBundleOpen(false);
        setSellCustomer('');
        setSellBundleDef('');
        setSellSellerId('');
        setSelectedTab('customer_bundles');
    };

    const handleExtendPackage = (id: string, days: number = 30) => {
        const pkg = packages.find((p: Package) => p.id === id);
        if (!pkg) return;
        const currentExpiry = pkg.expiry ? new Date(pkg.expiry) : new Date();
        const oldExpiry = pkg.expiry;
        currentExpiry.setDate(currentExpiry.getDate() + days);
        const newExpiry = currentExpiry.toISOString().split('T')[0];
        updatePackage(id, { expiry: newExpiry, status: 'active' }, {
            customerId: pkg.customerId,
            action: 'extend',
            sessionsImpact: 0,
            note: `${oldExpiry || 'Süresiz'} olan tarih ${newExpiry} olarak uzatıldı (+${days} gün)`
        });
    };

    const handleSettlePackage = (id: string) => {
        if (confirm('Kalan seansları silmek ve paketi kapatmak istediğinize emin misiniz?')) {
            const pkg = packages.find((p: any) => p.id === id);
            if (pkg) {
                const remaining = pkg.totalSessions - pkg.usedSessions;
                updatePackage(id, { status: 'finished', usedSessions: pkg.totalSessions }, {
                    customerId: pkg.customerId,
                    action: 'settle',
                    sessionsImpact: remaining,
                    note: 'Kalan haklar işletme tarafından sıfırlandı / silindi'
                });
            }
        }
    };

    return (
        <div className="p-4 md:p-8 max-w-[1200px] mx-auto animate-[fadeIn_0.3s_ease] space-y-10 font-sans">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-gray-900">Abonelik & Sadakat Sistemi</h1>
                    <p className="text-gray-500 text-xs md:text-sm font-semibold flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" /> İşletmeniz için aylık düzenli gelir (MRR) paketleri oluşturun.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsAssignOpen(true)} className="bg-white border border-gray-200 text-gray-900 px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition hover:border-indigo-300 hover:text-indigo-600 shadow-sm">
                        <Users className="w-4 h-4"/> Üyelik Sat
                    </button>
                    <button onClick={() => setIsNewPlanOpen(true)} className="bg-black text-white px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition hover:bg-gray-800 shadow-xl">
                        <Plus className="w-4 h-4"/> Yeni Plan
                    </button>
                </div>
            </div>

            <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-[1.5rem] w-fit overflow-x-auto max-w-full">
                <button 
                    onClick={() => setSelectedTab('plans')}
                    className={`px-6 py-2.5 rounded-2xl text-[10px] sm:text-xs font-black whitespace-nowrap transition-all ${selectedTab === 'plans' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    ABONELİK PLANLARI
                </button>
                <button 
                    onClick={() => setSelectedTab('bundles')}
                    className={`px-6 py-2.5 rounded-2xl text-[10px] sm:text-xs font-black whitespace-nowrap transition-all ${selectedTab === 'bundles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    PAKET TANIMLARI
                </button>
                <button 
                    onClick={() => setSelectedTab('members')}
                    className={`px-6 py-2.5 rounded-2xl text-[10px] sm:text-xs font-black whitespace-nowrap transition-all ${selectedTab === 'members' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    AKTİF ÜYELER ({customerMemberships.length})
                </button>
                <button 
                    onClick={() => setSelectedTab('customer_bundles')}
                    className={`px-6 py-2.5 rounded-2xl text-[10px] sm:text-xs font-black whitespace-nowrap transition-all ${selectedTab === 'customer_bundles' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    MÜŞTERİ PAKETLERİ ({packages.length})
                </button>
            </div>

            {selectedTab === 'plans' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {membershipPlans.map((plan: MembershipPlan) => (
                        <div key={plan.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase">Aylık Abonelik</span>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-gray-50">
                                <span className="text-3xl font-black text-indigo-600">₺{plan.price}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">/ AY</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3 text-xs font-bold text-gray-900">
                                    <Zap className="w-4 h-4 text-amber-500" /> {plan.sessionsPerMonth} Seans / Ay
                                </li>
                                {plan.benefits.map((b: string, i: number) => (
                                    <li key={i} className="flex items-center gap-3 text-xs font-medium text-gray-500">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {b}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    <div onClick={() => setIsNewPlanOpen(true)} className="border-2 border-dashed border-gray-200 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-all">
                        <Plus className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-xs font-black text-gray-400 uppercase">Yeni Abonelik Planı</p>
                    </div>
                </motion.div>
            )}

            {selectedTab === 'bundles' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {packageDefinitions.map((def: PackageDefinition) => (
                        <div key={def.id} className="bg-white border border-gray-100 rounded-[2.5rem] p-6 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <span className="bg-indigo-100 text-indigo-600 text-[9px] font-black px-3 py-1 rounded-full uppercase">Seanslık Paket</span>
                            </div>
                            <h3 className="text-xl font-black text-gray-900 mb-2">{def.name}</h3>
                            <div className="flex items-baseline gap-2 mb-6 pb-6 border-b border-gray-50">
                                <span className="text-3xl font-black text-indigo-600">₺{def.price}</span>
                                <span className="text-[10px] font-bold text-gray-400 uppercase">/ TOPLU</span>
                            </div>
                            <ul className="space-y-3 mb-8">
                                <li className="flex items-center gap-3 text-xs font-bold text-gray-900">
                                    <Zap className="w-4 h-4 text-indigo-500" /> Toplam {def.totalSessions} Seans
                                </li>
                                <li className="flex items-center gap-3 text-xs font-bold text-gray-500">
                                    <Calendar className="w-4 h-4 text-gray-400" /> {def.validityDays} Gün Geçerli
                                </li>
                            </ul>
                        </div>
                    ))}
                    <div onClick={() => setIsNewBundleOpen(true)} className="border-2 border-dashed border-gray-200 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center cursor-pointer hover:bg-gray-50 transition-all">
                        <Plus className="w-8 h-8 text-gray-300 mb-2" />
                        <p className="text-xs font-black text-gray-400 uppercase">Yeni Toplu Paket</p>
                    </div>
                </motion.div>
            )}

            {selectedTab === 'members' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-8 py-5">Müşteri</th>
                                <th className="px-6 py-5">Üyelik</th>
                                <th className="px-6 py-5 text-center">Kalan Seans</th>
                                <th className="px-6 py-5 text-center">Durum</th>
                                <th className="px-8 py-5 text-right">Bitiş</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {customerMemberships.map((mem: CustomerMembership) => {
                                const customer = customers.find((c: Customer) => c.id === mem.customerId);
                                const plan = membershipPlans.find((p: MembershipPlan) => p.id === mem.planId);
                                return (
                                    <tr key={mem.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-8 py-5">
                                            <p className="font-black text-gray-900 text-sm">{customer?.name}</p>
                                            <p className="text-[10px] font-bold text-gray-400">{customer?.phone}</p>
                                        </td>
                                        <td className="px-6 py-5 text-[10px] font-black text-indigo-600">{plan?.name}</td>
                                        <td className="px-6 py-5 text-center font-black text-xs">{mem.remainingSessions}</td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-[9px] font-black px-2 py-1 rounded bg-emerald-50 text-emerald-600 uppercase">AKTİF</span>
                                        </td>
                                        <td className="px-8 py-5 text-right text-xs font-bold text-gray-500">{mem.expiryDate.split('T')[0]}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </motion.div>
            )}

            {selectedTab === 'customer_bundles' && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-[2rem] overflow-hidden shadow-sm">
                    <div className="p-6 border-b border-gray-50 flex justify-between items-center bg-gray-50/10">
                        <h2 className="text-sm font-black text-gray-900 uppercase">Müşteri Paket Takibi</h2>
                        <div className="flex gap-2">
                            {packages.some((p: Package) => p.expiry && new Date(p.expiry) < new Date() && p.status === 'active') && (
                                <button 
                                    onClick={() => {
                                        if (confirm('Süresi dolmuş tüm paketlerdeki kalan hakları silmek istediğinize emin misiniz?')) {
                                            packages.filter((p: any) => p.expiry && new Date(p.expiry) < new Date() && p.status === 'active').forEach((p: any) => {
                                                const remaining = p.totalSessions - p.usedSessions;
                                                updatePackage(p.id, { status: 'finished', usedSessions: p.totalSessions }, {
                                                    customerId: p.customerId,
                                                    action: 'settle',
                                                    sessionsImpact: remaining,
                                                    note: 'Süresi dolduğu için sistem tarafından toplu silindi'
                                                });
                                            });
                                        }
                                    }}
                                    className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-red-100 transition-colors"
                                >
                                    <Trash2 className="w-3 h-3" /> Süresi Dolanları Temizle
                                </button>
                            )}
                            <button onClick={() => setIsSellBundleOpen(true)} className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 hover:bg-indigo-700 transition-shadow shadow-lg shadow-indigo-100">
                                <Plus className="w-3 h-3" /> Paket Sat
                            </button>
                        </div>
                    </div>
                    <table className="w-full text-left">
                        <thead className="bg-gray-50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-8 py-5">Müşteri</th>
                                <th className="px-6 py-5">Paket Detayı</th>
                                <th className="px-6 py-5 text-center">Kullanım</th>
                                <th className="px-6 py-5 text-center">Durum</th>
                                <th className="px-6 py-5 text-right">Geçerlilik</th>
                                <th className="px-8 py-5 text-right">Eylem</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {packages.map((pkg: Package) => {
                                const customer = customers.find((c: Customer) => c.id === pkg.customerId);
                                const isExpired = pkg.expiry && new Date(pkg.expiry) < new Date();
                                const status = isExpired ? 'expired' : pkg.status;
                                
                                return (
                                    <>
                                        <tr key={pkg.id} className="hover:bg-gray-50 transition-colors group cursor-pointer" onClick={() => setExpandedPackageId(expandedPackageId === pkg.id ? null : pkg.id)}>
                                            <td className="px-8 py-5">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg transition-colors ${expandedPackageId === pkg.id ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
                                                        <ChevronDown className={`w-3 h-3 transition-transform ${expandedPackageId === pkg.id ? 'rotate-180' : ''}`} />
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900 text-sm">{customer?.name}</p>
                                                        <p className="text-[10px] font-bold text-gray-400">{customer?.phone}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-5">
                                                <p className="text-[10px] font-black text-indigo-600 uppercase">{pkg.name}</p>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                <div className="inline-block px-3 py-1 bg-gray-100 rounded-lg text-xs font-black">
                                                    {pkg.usedSessions} / {pkg.totalSessions}
                                                </div>
                                            </td>
                                            <td className="px-6 py-5 text-center">
                                                {status === 'expired' ? (
                                                    <span className="text-[9px] font-black px-2 py-1 rounded bg-red-50 text-red-600 uppercase">SÜRESİ DOLDU</span>
                                                ) : status === 'finished' ? (
                                                    <span className="text-[9px] font-black px-2 py-1 rounded bg-gray-100 text-gray-400 uppercase">TAMAMLANDI</span>
                                                ) : (
                                                    <span className="text-[9px] font-black px-2 py-1 rounded bg-emerald-50 text-emerald-600 uppercase">AKTİF</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-5 text-right text-xs font-bold text-gray-500">
                                                {pkg.expiry || 'Süresiz'}
                                            </td>
                                            <td className="px-8 py-5 text-right">
                                                <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                    <button onClick={() => handleExtendPackage(pkg.id)} className="p-2 hover:bg-indigo-50 text-indigo-600 rounded-lg transition" title="Süreyi Uzat">
                                                        <Calendar className="w-4 h-4" />
                                                    </button>
                                                    <button onClick={() => handleSettlePackage(pkg.id)} className="p-2 hover:bg-red-50 text-red-600 rounded-lg transition" title="Hakları Sil">
                                                        <X className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedPackageId === pkg.id && (
                                            <tr className="bg-gray-50/50">
                                                <td colSpan={6} className="px-8 py-0">
                                                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                                                        <div className="py-6 border-l-2 border-indigo-200 ml-4 pl-10 space-y-4">
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <History className="w-4 h-4 text-indigo-600" />
                                                                <h4 className="text-[10px] font-black text-gray-900 uppercase tracking-widest">Kullanım ve İşlem Geçmişi</h4>
                                                            </div>
                                                            <div className="space-y-4 relative">
                                                                {packageUsageHistory.filter((h: any) => h.packageId === pkg.id).map((h: any, idx: number) => (
                                                                    <div key={h.id} className="flex gap-4 items-start relative">
                                                                        <div className="absolute -left-[45px] top-1.5 w-2 h-2 bg-indigo-600 rounded-full border-4 border-white ring-2 ring-indigo-50 shadow-sm" />
                                                                        <div className="flex-1 bg-white p-4 rounded-2xl border border-gray-100 shadow-sm group/item hover:border-indigo-200 transition-colors">
                                                                            <div className="flex justify-between items-start mb-1">
                                                                                <span className={`text-[8px] font-black px-2 py-0.5 rounded uppercase ${h.action === 'use' ? 'bg-indigo-50 text-indigo-600' : h.action === 'settle' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>
                                                                                    {h.action === 'use' ? 'Kullanım' : h.action === 'settle' ? 'Paket Settle' : h.action === 'extend' ? 'Süre Uzatma' : 'Rollover'}
                                                                                </span>
                                                                                <span className="text-[8px] font-bold text-gray-400 capitalize">{new Date(h.createdAt).toLocaleString('tr-TR')}</span>
                                                                            </div>
                                                                            <p className="text-xs font-bold text-gray-900">{h.note}</p>
                                                                            {h.sessionsImpact > 0 && (
                                                                                <p className="text-[10px] font-black text-indigo-600 mt-1 uppercase tracking-tighter">
                                                                                    {h.action === 'use' ? '-1 Seans' : h.action === 'settle' ? `-${h.sessionsImpact} Seans Silindi` : `+${h.sessionsImpact} Seans Eklendi`}
                                                                                </p>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                                {packageUsageHistory.filter((h: any) => h.packageId === pkg.id).length === 0 && (
                                                                    <div className="flex items-center gap-3 text-gray-400 py-4 italic text-[10px] font-medium">
                                                                        <Info className="w-4 h-4" /> Henüz bir işlem kaydı bulunmuyor.
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                );
                            })}
                            {packages.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-20 text-center text-gray-400 text-xs font-bold uppercase tracking-widest">Henüz paket satışı bulunmuyor.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </motion.div>
            )}

            {/* MODALS */}
            <AnimatePresence>
                {isNewBundleOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase flex items-center gap-2"><Zap className="w-5 h-5 text-indigo-500"/> Yeni Toplu Paket Tanımla</h2>
                                <button onClick={() => setIsNewBundleOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition"><X className="w-5 h-5 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleCreateBundle} className="p-8 space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Paket Adı</label>
                                    <input type="text" required value={newBundle.name} onChange={e=>setNewBundle({...newBundle, name: e.target.value})} placeholder="Örn: 10'lu Klasik Masaj Paketi" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Paket Fiyatı (₺)</label>
                                        <input type="number" required value={newBundle.price} onChange={e=>setNewBundle({...newBundle, price: e.target.value})} placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400" />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Toplam Seans</label>
                                        <input type="number" required value={newBundle.sessions} onChange={e=>setNewBundle({...newBundle, sessions: e.target.value})} placeholder="10" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Geçerlilik Süresi (Gün)</label>
                                    <div className="flex items-center gap-3">
                                        <input type="number" required value={newBundle.validityDays} onChange={e=>setNewBundle({...newBundle, validityDays: e.target.value})} className="w-32 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400" />
                                        <span className="text-[11px] font-bold text-gray-400 uppercase">GÜN BOYUNCA GEÇERLİ</span>
                                    </div>
                                    <p className="text-[10px] text-gray-400 mt-2 ml-1 italic">* 1 yıl için 365, 6 ay için 180 yazabilirsiniz.</p>
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-colors shadow-lg">
                                        Paket Modelini Kaydet
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isSellBundleOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-500"/> Müşteriye Paket Sat</h2>
                                <button onClick={() => setIsSellBundleOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition"><X className="w-5 h-5 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleSellBundle} className="p-8 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Müşteri Seçin</label>
                                    <select required value={sellCustomer} onChange={e=>setSellCustomer(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 appearance-none">
                                        <option value="">Arama / Seçme</option>
                                        {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Toplu Paket Seçin</label>
                                    <select required value={sellBundleDef} onChange={e=>setSellBundleDef(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 appearance-none">
                                        <option value="">Paket Seçiniz</option>
                                        {packageDefinitions.map((p: PackageDefinition) => <option key={p.id} value={p.id}>{p.name} ({p.totalSessions} Seans)</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Satan Personel</label>
                                    <select required value={sellSellerId} onChange={e=>setSellSellerId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 appearance-none">
                                        <option value="">Seçiniz...</option>
                                        {staffMembers.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name} {s.isVisibleOnCalendar ? '(Terapist)' : '(Satış)'}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {sellBundleDef && (
                                    <div className="bg-amber-50 border border-amber-100 rounded-xl p-4 flex gap-3 items-center">
                                        <ShieldCheck className="w-5 h-5 text-amber-500" />
                                        <p className="text-[11px] font-bold text-amber-700 uppercase leading-tight">SATIŞ ONAYI VERİLDİĞİNDE MÜŞTERİNİN HESABINA SEANSLAR VE GEÇERLİLİK TARİHİ ANINDA EKLENECEKTİR.</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-800 transition-colors shadow-xl">
                                        Satışı Tamamla
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isAssignOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-500"/> Müşteriye Üyelik Sat</h2>
                                <button onClick={() => setIsAssignOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition"><X className="w-5 h-5 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleAssign} className="p-8 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Müşteri Seçin</label>
                                    <select required value={assignCustomer} onChange={e=>setAssignCustomer(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 appearance-none">
                                        <option value="">Arama / Seçme</option>
                                        {customers.map((c: Customer) => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Abonelik Paketi Seçin</label>
                                    <select required value={assignPlan} onChange={e=>setAssignPlan(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 appearance-none">
                                        <option value="">Paket Seçiniz</option>
                                        {membershipPlans.map((p: MembershipPlan) => <option key={p.id} value={p.id}>{p.name} - ₺{p.price}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Satan Personel</label>
                                    <select required value={assignSellerId} onChange={e=>setAssignSellerId(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 appearance-none">
                                        <option value="">Seçiniz...</option>
                                        {staffMembers.map((s: any) => (
                                            <option key={s.id} value={s.id}>{s.name} {s.isVisibleOnCalendar ? '(Terapist)' : '(Satış)'}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {assignPlan && (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 items-center">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        <p className="text-xs font-bold text-emerald-700">Bu işlem sonucunda müşterinin hesabına anında seans hakkı tanımlanacaktır. Tahsilatı "Kasa" menüsünden almayı unutmayın.</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-800 transition-colors shadow-xl">
                                        Üyeliği Başlat
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
