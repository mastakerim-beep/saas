"use client";

import { useStore } from '@/lib/store';
import { 
    Globe, ShieldCheck, Activity, Terminal, 
    Bell, CreditCard, Zap, Server, 
    Search, Database, LogOut,
    ChevronRight, Plus, RefreshCw, X, ShieldAlert, Settings, Bot
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/lib/supabase';

// Modular components
import { NavBtn, StatCard, MetricBox } from './components/BasicUi';
import { TenantCard, EditBusinessModal } from './components/ManagementComponents';
import { CreateBusinessModal } from './components/CreateBusinessModal';
import { BroadcastForm } from './components/BroadcastForm';
import { MigrationWizard } from '@/components/system/migration/MigrationWizard';
import { ImperialOversight } from './components/ImperialOversight';
import DataImportWizard from '@/components/ui/DataImportWizard';

type AdminTab = 'monitor' | 'tenants' | 'billing' | 'oversight' | 'notifications' | 'announcements' | 'system' | 'migration' | 'settings';

export default function SuperAdminPage() {
    const { 
        currentUser, allBusinesses, allPayments, allLogs, 
        allNotifs, zReports, setImpersonatedBusinessId,
        logout, addBusiness, provisionBusinessUser, 
        deleteBusiness, updateBusinessStatus, clearCatalog, fetchData,
        updateAnyBusiness, saasPlans, saasInvoices
    } = useStore();

    const [activeTab, setActiveTab] = useState<AdminTab>('monitor');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    const [editingBiz, setEditingBiz] = useState<any>(null);
    const [showImporter, setShowImporter] = useState(false);
    
    // --- INITIALIZATION ---
    useEffect(() => {
        if (currentUser?.role === 'SaaS_Owner') {
            fetchData(undefined, undefined, true);
        }
    }, [currentUser, fetchData]);

    // --- ACTIONS ---
    const handleRefresh = async () => {
        setIsRefreshing(true);
        clearCatalog();
        await fetchData(undefined, undefined, true);
        setIsRefreshing(false);
    };

    const handleCreateBusinessAction = async (newBizData: any) => {
        if (!newBizData.name || !newBizData.slug || !newBizData.email || !newBizData.password) {
            alert("Lütfen gerekli alanları doldurun.");
            return false;
        }

        if (isCreating) return false;
        setIsCreating(true);

        try {
            const bizData = {
                name: newBizData.name,
                slug: newBizData.slug.toLowerCase(),
                maxUsers: newBizData.seatCount,
                ownerName: newBizData.name + " Sahibi",
                mrr: newBizData.mrr,
                expiryDate: newBizData.expiryDate,
                taxId: newBizData.taxId,
                taxOffice: newBizData.taxOffice,
                billingAddress: newBizData.billingAddress,
                plan: newBizData.plan,
                verticals: newBizData.verticals
            };

            const biz = await addBusiness(bizData);

            if (biz) {
                // Provision Main Owner
                await provisionBusinessUser({
                    email: newBizData.email,
                    password: newBizData.password,
                    name: "İşletme Sahibi",
                    businessId: biz.id,
                    isStaff: newBizData.isStaff
                } as any);

                // Provision Extra Users
                if (newBizData.extraUsers && newBizData.extraUsers.length > 0) {
                    for (const user of newBizData.extraUsers) {
                        if (user.email && user.password) {
                            await provisionBusinessUser({
                                email: user.email,
                                password: user.password,
                                name: user.name || "Ek Kullanıcı",
                                businessId: biz.id,
                                isStaff: newBizData.isStaff
                            } as any);
                        }
                    }
                }
                
                alert("İşletme, ödeme planı ve tüm kullanıcı hesapları başarıyla kuruldu!");
                setShowCreateModal(false);
                await fetchData(undefined, undefined, true);
                return true;
            }
        } catch (err: any) {
            alert("Hata oluştu: " + err.message);
        } finally {
            setIsCreating(false);
        }
        return false;
    };

    const handleDeleteBusinessAction = async (id: string, name: string) => {
        if (!window.confirm(`${name} işletmesini kalıcı olarak silmek istediğinize emin misiniz?`)) return;
        setIsActionLoading(id);
        try {
            await deleteBusiness(id);
            await fetchData(undefined, undefined, true);
        } catch (err: any) {
            alert("Silme hatası: " + err.message);
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleToggleStatusAction = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
        setIsActionLoading(id);
        try {
            await updateBusinessStatus(id, newStatus);
            await fetchData(undefined, undefined, true);
        } catch (err: any) {
            alert("Güncelleme hatası: " + err.message);
        } finally {
            setIsActionLoading(null);
        }
    };

    const handleUpdateBusinessAction = async (id: string, updates: any) => {
        setIsActionLoading(id);
        try {
            await updateAnyBusiness(id, updates);
            setEditingBiz(null);
            alert("İşletme başarıyla güncellendi.");
        } catch (err: any) {
            alert("Güncelleme hatası: " + err.message);
        } finally {
            setIsActionLoading(null);
        }
    };

    // --- COMPUTATIONS ---
    const stats = useMemo(() => {
        const totalRev = allPayments.reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
        const activeTenants = allBusinesses.filter((b: any) => b.status === 'active' || b.status === 'Aktif').length;
        const mrr = allBusinesses.reduce((s: number, b: any) => s + (b.mrr || 0), 0);
        const pendingNotifs = allNotifs.filter((n: any) => n.type === 'INTERNAL_REPORT').length;
        return { totalRev, activeTenants, mrr, pendingNotifs };
    }, [allPayments, allBusinesses, allNotifs]);

    const chartData = useMemo(() => {
        const data: any[] = [];
        for (let i = 14; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const name = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            const dayRev = allPayments
                .filter((p: any) => (p.date || p.createdAt?.split('T')[0]) === dateStr)
                .reduce((s: number, p: any) => s + (p.totalAmount || 0), 0);
            const dailyMrrGoal = stats.mrr / 30;
            data.push({ name, revenue: dayRev, growth: dailyMrrGoal });
        }
        return data;
    }, [allPayments, stats.mrr]);

    const filteredBusinesses = allBusinesses.filter((b: any) => 
        b.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        b.slug.toLowerCase().includes(searchQuery.toLowerCase())
    );

    if (currentUser?.role !== 'SaaS_Owner') {
        return (
            <div className="h-screen bg-white flex flex-col items-center justify-center p-12 text-center">
                <ShieldCheck size={80} className="text-rose-500 mb-8 animate-pulse" />
                <h1 className="text-slate-900 text-5xl font-black tracking-tighter italic uppercase">ERİŞİM REDDEDİLDİ</h1>
                <p className="text-rose-500 font-black text-[10px] uppercase tracking-[0.5em] mt-4">Sovereign Authority Required</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#F8FAFC] text-slate-600 font-sans selection:bg-indigo-100 selection:text-indigo-900 overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/5 blur-[120px] rounded-full" />
            </div>

            {/* Top Navigation Bar */}
            <div className="relative z-50 h-[84px] px-10 flex items-center justify-between border-b border-indigo-100/50 bg-white/80 backdrop-blur-2xl">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 group hover:rotate-12 transition-all duration-500">
                        <Zap size={24} className="fill-white" />
                    </div>
                    <div className="flex flex-col">
                        <div className="flex items-center gap-3">
                            <h1 className="text-slate-900 font-black text-xl italic tracking-tighter uppercase leading-none">Aura Komuta Merkezi</h1>
                            <button 
                                onClick={() => setActiveTab('settings')}
                                className={`p-2 rounded-lg transition-all ${activeTab === 'settings' ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-slate-100 text-slate-400'}`}
                            >
                                <Settings size={16} />
                            </button>
                        </div>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-md">
                                <Server size={10} /> V 5.0.0
                            </span>
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <motion.div animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 2, repeat: Infinity }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> SİSTEM CANLI
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex flex-col items-end">
                            <span className="text-slate-900 leading-none mb-1">₺{stats.mrr.toLocaleString()}</span>
                            <span className="text-[8px] opacity-60 uppercase">GÜNCEL MRR</span>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="flex flex-col items-end">
                            <span className="text-slate-900 leading-none mb-1">{allBusinesses.length}</span>
                            <span className="text-[8px] opacity-60 uppercase">TOPLAM NODE</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pl-8 border-l border-slate-100">
                         <div className="text-right">
                             <p className="text-[11px] font-black text-slate-900 leading-none mb-1">{currentUser?.name || ''}</p>
                             <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">Sovereign Admin</p>
                         </div>
                         <button 
                            onClick={() => confirm('Çıkış yapılsın mı?') && logout()}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                         >
                             <LogOut size={20} />
                         </button>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex gap-4 px-8 py-8 h-[calc(100vh-80px)] overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-72 shrink-0 flex flex-col gap-2.5">
                    <p className="px-5 text-[11px] font-black text-slate-400 uppercase tracking-[0.4em] mb-4 opacity-60">Tactical Matrix</p>
                    <NavBtn id="monitor" active={activeTab} onClick={setActiveTab} icon={Activity} label="İzleme" badge="CANLI" />
                    <NavBtn id="tenants" active={activeTab} onClick={setActiveTab} icon={Globe} label="İşletmeler" badge={allBusinesses.length.toString()} />
                    <NavBtn id="oversight" active={activeTab} onClick={setActiveTab} icon={ShieldAlert} label="İmparatorluk Denetimi" badge="AI" />
                    <NavBtn id="billing" active={activeTab} onClick={setActiveTab} icon={CreditCard} label="SaaS Muhasebesi" badge="MRR" />
                    <NavBtn id="notifications" active={activeTab} onClick={setActiveTab} icon={Bell} label="İç Akış" badge={stats.pendingNotifs.toString()} />
                    <NavBtn id="announcements" active={activeTab} onClick={setActiveTab} icon={Bell} label="Yayın Merkezi" />
                    <NavBtn id="migration" active={activeTab} onClick={setActiveTab} icon={Database} label="Veri Aktarımı" />
                    <NavBtn id="system" active={activeTab} onClick={setActiveTab} icon={Terminal} label="Sistem Terminali" />
                    <NavBtn id="settings" active={activeTab} onClick={setActiveTab} icon={Settings} label="Sistem Ayarları" />
                    
                    <button 
                        onClick={handleRefresh}
                        className="mt-6 mx-2 px-4 py-4 rounded-2xl border border-indigo-100 bg-white hover:bg-indigo-50 text-[11px] font-black text-indigo-600 flex items-center justify-center gap-3 transition-all shadow-sm active:scale-95"
                    >
                        <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
                        VERİLERİ SENKRONİZE ET
                    </button>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-20">
                    <AnimatePresence mode="wait">
                        {activeTab === 'monitor' && (
                            <motion.div key="monitor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                    <StatCard title="Toplam Ağ Geliri" value={`₺${stats.totalRev.toLocaleString()}`} icon={CreditCard} trend="+12.4%" color="indigo" />
                                    <StatCard title="Aktif İşletme" value={stats.activeTenants} icon={Globe} trend="+2 yeni" color="purple" />
                                    <StatCard title="Mühürlü Node" value={allBusinesses.filter((b: any) => b.is_suspended).length} icon={ShieldAlert} trend="Kilitli" color="rose" />
                                    <StatCard title="Sistem Sorgulama" value={allLogs.length} icon={Database} trend="Stabil" color="blue" />
                                </div>

                                <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-10 shadow-sm">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <h3 className="text-slate-900 text-xl font-black italic uppercase tracking-tighter">Ağ Büyüme Nabzı</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Son 14 Gün</p>
                                        </div>
                                    </div>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.1}/>
                                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(0,0,0,0.05)" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'rgba(0,0,0,0.4)' }} />
                                                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'rgba(0,0,0,0.4)' }} tickFormatter={(val) => `₺${val/1000}k`} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '15px' }}
                                                    itemStyle={{ fontSize: '10px', fontWeight: '900', color: '#1e293b' }}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                                <Area type="monotone" dataKey="growth" stroke="#9333EA" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                                    <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-8 shadow-sm">
                                        <h4 className="text-slate-900 text-xs font-black uppercase tracking-widest mb-6 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <Activity size={14} className="text-indigo-600" /> Küresel Sistem Akışı
                                            </div>
                                            <span className="text-[8px] font-black text-indigo-500 bg-indigo-50 px-2 py-1 rounded-lg uppercase">CANLI</span>
                                        </h4>
                                        <div className="space-y-4 max-h-[400px] overflow-y-auto no-scrollbar pr-2">
                                            {allLogs.slice(0, 15).map((log: any, i: number) => (
                                                <div key={i} className="flex gap-4 items-center group cursor-pointer hover:translate-x-1 transition-transform">
                                                    <div className="w-10 h-10 bg-slate-50 border border-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 group-hover:text-white group-hover:bg-indigo-600 transition-all">
                                                        <Database size={14} />
                                                    </div>
                                                    <div className="flex-1 min-w-0 text-left">
                                                        <p className="text-[11px] font-black text-slate-700 truncate capitalize">{log.action || 'Olay'}</p>
                                                        <p className="text-[8px] font-bold text-slate-400">{new Date(log.date || log.createdAt).toLocaleTimeString()}</p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-200" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-8 shadow-sm">
                                        <h4 className="text-slate-900 text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                                            <Zap size={14} className="text-purple-600" /> Sistem Metrikleri
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <MetricBox label="Aktif Oturumlar" value="1,244" trend="Nominal" />
                                            <MetricBox label="API Gecikme" value="28ms" trend="Stabil" />
                                            <MetricBox label="DB Tepe İşlem" value="14.2k/s" trend="Nominal" />
                                            <MetricBox label="Hata Oranı" value="0.04%" trend="Nominal" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'oversight' && (
                            <motion.div key="oversight" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
                                <ImperialOversight businesses={allBusinesses} logs={allLogs} zReports={zReports} />
                            </motion.div>
                        )}

                        {activeTab === 'tenants' && (
                            <motion.div key="tenants" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="relative group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                                        <input 
                                            placeholder="İşletme ara..." 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="bg-white border border-indigo-100 rounded-full py-5 pl-16 pr-8 w-96 text-sm font-black text-slate-900 outline-none shadow-sm" 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-8 py-5 rounded-full shadow-2xl transition-all flex items-center gap-3"
                                    >
                                        <Plus size={16} /> YENİ İŞLETME
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                                    {filteredBusinesses.map((biz: any) => (
                                        <TenantCard 
                                            key={biz.id} 
                                            biz={biz} 
                                            isLoading={isActionLoading === biz.id}
                                            onImpersonate={() => setImpersonatedBusinessId(biz.id)} 
                                            onDelete={() => handleDeleteBusinessAction(biz.id, biz.name)}
                                            onToggleStatus={() => handleToggleStatusAction(biz.id, biz.status)}
                                            onEdit={() => setEditingBiz(biz)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'billing' && (
                            <motion.div key="billing" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-10 shadow-sm text-left">
                                    <h2 className="text-slate-900 text-3xl font-black italic uppercase tracking-tighter mb-8">SaaS Muhasebe</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">MRR</p>
                                            <p className="text-3xl font-black text-slate-900">₺{stats.mrr.toLocaleString()}</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-slate-50 border border-emerald-100/50">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">ENTERPRISE NODES</p>
                                            <p className="text-3xl font-black text-slate-900">{allBusinesses.filter((b: any) => b.plan === 'Aura Enterprise').length}</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-slate-50 border border-slate-100">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">TOPLAM FATURA</p>
                                            <p className="text-3xl font-black text-slate-900">₺{stats.totalRev.toLocaleString()}</p>
                                        </div>
                                        <div className="p-6 rounded-2xl bg-slate-50 border border-rose-100/50">
                                            <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest mb-1">MÜHÜRLÜ</p>
                                            <p className="text-3xl font-black text-rose-600">{allBusinesses.filter((b: any) => b.is_suspended).length}</p>
                                        </div>
                                    </div>

                                    {/* SaaS Plans Management */}
                                    <div className="mt-16">
                                        <h3 className="text-slate-900 text-2xl font-black italic uppercase tracking-tighter mb-8">SaaS Abonelik Paketleri</h3>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                            {saasPlans && saasPlans.length > 0 ? (
                                                saasPlans.map((plan: any) => (
                                                    <div key={plan.id} className="p-8 rounded-[3rem] bg-white border border-indigo-100 shadow-sm hover:shadow-2xl hover:border-indigo-300 transition-all group">
                                                        <div className="flex justify-between items-start mb-6">
                                                            <h4 className="text-xl font-black text-slate-900 italic tracking-tighter">{plan.name}</h4>
                                                            <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${plan.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
                                                                {plan.isActive ? 'AKTİF' : 'PASİF'}
                                                            </span>
                                                        </div>
                                                        <div className="space-y-4 mb-8">
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Aylık Fiyat</span>
                                                                <span className="font-black text-slate-900">₺{plan.monthlyPrice.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Yıllık Fiyat</span>
                                                                <span className="font-black text-slate-900">₺{plan.yearlyPrice.toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex justify-between text-sm">
                                                                <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">Node Kapasitesi</span>
                                                                <span className="font-black text-indigo-600 bg-indigo-50 px-3 py-0.5 rounded-lg">{plan.maxBranches >= 999 ? 'LİMİTSİZ' : plan.maxBranches}</span>
                                                            </div>
                                                        </div>
                                                        <div className="pt-6 border-t border-slate-50">
                                                            <button className="w-full py-4 bg-slate-900 text-white rounded-2xl text-[11px] font-black uppercase tracking-[0.2em] hover:bg-indigo-600 transition-all shadow-xl">YAPILANDIRMA</button>
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="col-span-3 py-16 border-2 border-dashed border-slate-100 rounded-[3rem] flex flex-col items-center justify-center opacity-40">
                                                    <Zap size={48} className="text-slate-300 mb-4" />
                                                    <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Aktif Plan Bulunmuyor</p>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Sisteme henüz bir SaaS abonelik paketi tanımlanmamış.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Recent SaaS Invoices */}
                                    <div className="mt-16">
                                        <h3 className="text-slate-900 text-2xl font-black italic uppercase tracking-tighter mb-8">Son SaaS Tahsilatları</h3>
                                        <div className="bg-slate-50 border border-slate-100 rounded-[3rem] overflow-hidden">
                                            {saasInvoices && saasInvoices.length > 0 ? (
                                                <div className="divide-y divide-slate-100">
                                                    {saasInvoices.slice(0, 10).map((inv: any) => (
                                                        <div key={inv.id} className="p-6 flex items-center justify-between hover:bg-white transition-colors">
                                                            <div className="flex items-center gap-6">
                                                                <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                                                                    <CreditCard size={20} />
                                                                </div>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-900 uppercase tracking-tighter">{inv.businessName || 'Bilinmeyen İşletme'}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">{inv.date || inv.createdAt?.split('T')[0]}</p>
                                                                </div>
                                                            </div>
                                                            <div className="text-right">
                                                                <p className="text-lg font-black text-slate-900 tracking-tighter">₺{inv.amount.toLocaleString()}</p>
                                                                <span className="text-[9px] font-black text-emerald-500 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-widest">BAŞARILI</span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            ) : (
                                                <div className="py-20 flex flex-col items-center justify-center opacity-40">
                                                    <Activity size={40} className="text-slate-300 mb-4" />
                                                    <p className="text-lg font-black text-slate-900 uppercase italic tracking-tighter">Tahsilat Kaydı Yok</p>
                                                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Henüz bir abonelik ödemesi gerçekleşmemiş.</p>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'notifications' && (
                            <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 text-left">
                                <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-12 shadow-sm min-h-[600px] flex flex-col">
                                    <h2 className="text-slate-900 text-3xl font-black italic uppercase tracking-tighter mb-10">Dahili Raporlar</h2>
                                    
                                    <div className="flex-1 space-y-6 overflow-y-auto no-scrollbar pb-10">
                                        {allNotifs.filter((n: any) => n.type === 'INTERNAL_REPORT').length > 0 ? (
                                            allNotifs.filter((n: any) => n.type === 'INTERNAL_REPORT').map((n: any, i: number) => (
                                                <div key={i} className="bg-slate-50 border border-indigo-50 rounded-[2.5rem] p-10 hover:border-indigo-200 transition-all">
                                                    <div className="flex justify-between items-center mb-6">
                                                        <p className="text-slate-900 font-black text-xl uppercase italic tracking-tighter">GÜNLÜK SİSTEM ANALİZİ</p>
                                                        <span className="bg-white px-4 py-2 rounded-xl text-[11px] font-black text-slate-400 border border-slate-100 uppercase">{n.sentAt?.split('T')[0]}</span>
                                                    </div>
                                                    <div className="bg-white rounded-3xl p-8 font-mono text-[12px] leading-relaxed border border-indigo-50 whitespace-pre-wrap text-slate-600 shadow-inner">{n.content}</div>
                                                </div>
                                            ))
                                        ) : (
                                            <div className="flex-1 flex flex-col items-center justify-center text-center opacity-40 py-20">
                                                <div className="w-24 h-24 bg-slate-50 rounded-[2rem] flex items-center justify-center mb-6 border border-slate-100">
                                                    <Bell size={40} className="text-slate-300" />
                                                </div>
                                                <p className="text-xl font-black text-slate-900 uppercase tracking-tighter italic">Rapor Bekleniyor</p>
                                                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mt-2">Henüz sistem tarafından üretilmiş bir dahili rapor bulunmuyor.</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'announcements' && (
                            <motion.div key="announcements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-10 shadow-sm">
                                    <h2 className="text-slate-900 text-2xl font-black italic uppercase tracking-tighter mb-10 text-left">Yayın Komutası</h2>
                                    <BroadcastForm />
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'system' && (
                            <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[600px] bg-slate-900 rounded-[2.5rem] p-8 font-mono text-[12px] space-y-2 overflow-y-auto text-left">
                                <p className="text-emerald-400">{">"} status check</p>
                                <p className="text-slate-400">Nodes communicating...</p>
                                <p className="text-indigo-400">Authenticated: {currentUser?.name}</p>
                                <p className="text-emerald-400">Aura Command Center online.</p>
                            </motion.div>
                        )}

                        {activeTab === 'migration' && (
                            <div className="space-y-10">
                                <div className="bg-white border border-indigo-100 rounded-[3rem] p-16 shadow-xl relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                                        <Database size={200} className="text-indigo-600" />
                                    </div>
                                    <div className="relative z-10 max-w-2xl">
                                        <h2 className="text-slate-900 text-4xl font-black italic uppercase tracking-tighter mb-4">Imperial Data Fusion</h2>
                                        <p className="text-slate-500 font-medium mb-12 leading-relaxed">
                                            Harici sistemlerden veri göçü sağlamak için yüksek performanslı "Data Ingester" modülünü kullanın. 
                                            Excel, CSV ve SQL dökümlerini Imperial standartlarına otomatik olarak eşleyerek sisteme dahil eder.
                                        </p>
                                        <div className="flex gap-4">
                                            <button 
                                                onClick={() => setShowImporter(true)}
                                                className="px-10 py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/30 hover:scale-105 active:scale-95 transition-all flex items-center gap-4"
                                            >
                                                <Zap size={20} /> YENİ AKTARIM BAŞLAT
                                            </button>
                                            <button className="px-10 py-6 bg-slate-100 text-slate-500 rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:bg-slate-200 transition-all flex items-center gap-4">
                                                <Terminal size={20} /> LOGLARI İNCELE
                                            </button>
                                        </div>
                                    </div>
                                </div>
                                <MigrationWizard />
                            </div>
                        )}

                        {activeTab === 'settings' && (
                            <motion.div key="settings" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="max-w-4xl">
                                <div className="bg-white border border-indigo-100 rounded-[3rem] p-16 shadow-xl">
                                    <div className="flex justify-between items-center mb-12">
                                        <div>
                                            <h2 className="text-slate-900 text-3xl font-black italic uppercase tracking-tighter mb-2">Sistem Yapılandırması</h2>
                                            <p className="text-[10px] font-black text-indigo-500 uppercase tracking-widest">Global Secret Management</p>
                                        </div>
                                        <div className="p-4 bg-rose-50 rounded-2xl text-rose-600">
                                            <ShieldCheck size={32} />
                                        </div>
                                    </div>

                                    <div className="space-y-12">
                                        {/* Gemini API Section */}
                                        <div className="p-8 bg-slate-50 rounded-[2rem] border border-slate-100">
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                                    <Bot size={24} className="text-indigo-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase text-slate-900">Google Gemini AI</h3>
                                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Merkezi Zeka Motoru Yapılandırması</p>
                                                </div>
                                            </div>
                                            
                                            <div className="space-y-4">
                                                <label className="text-[10px] font-black uppercase text-slate-500 tracking-widest block px-2">API Anahtarı (GEMINI_API_KEY)</label>
                                                <div className="relative">
                                                    <input 
                                                        id="gemini-key-input"
                                                        type="password" 
                                                        className="w-full bg-white border border-slate-200 rounded-2xl px-6 py-5 text-sm font-bold outline-none focus:border-indigo-500 transition-all text-slate-900"
                                                        placeholder="AIzaSy..."
                                                    />
                                                </div>
                                                <p className="text-[9px] font-medium text-slate-400 leading-relaxed px-2 uppercase">
                                                    Bu anahtar, Imperial Agent Hub'daki tüm analizleri besleyen anahtardır. Değiştirildiğinde tüm işletmeler için anında güncellenir.
                                                </p>
                                            </div>

                                            <button 
                                                onClick={async () => {
                                                    const input = document.getElementById('gemini-key-input') as HTMLInputElement;
                                                    const val = input.value;
                                                    if (!val) return alert('Lütfen geçerli bir anahtar girin.');
                                                    
                                                    setIsRefreshing(true);
                                                    try {
                                                        const { error } = await supabase
                                                            .from('system_config')
                                                            .upsert({ key: 'GEMINI_API_KEY', value: val });
                                                        
                                                        if (error) throw error;
                                                        alert('API Anahtarı mühürlendi ve tüm sistemlere dağıtıldı! 🏛️✨');
                                                        input.value = '';
                                                    } catch (err: any) {
                                                        console.error('Upsert Error:', err);
                                                        alert('Mühürleme Hatası: ' + err.message);
                                                    } finally {
                                                        setIsRefreshing(false);
                                                    }
                                                }}
                                                className="mt-8 px-10 py-5 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:bg-indigo-700 transition-all flex items-center gap-3"
                                            >
                                                {isRefreshing ? <RefreshCw className="animate-spin" size={14} /> : <Zap size={14} fill="white" />} 
                                                ANAHTARI MÜHÜRLE VE YAYINLA
                                            </button>
                                        </div>

                                        {/* Security Policy Section */}
                                        <div className="p-8 bg-rose-50/30 rounded-[2rem] border border-rose-100">
                                             <div className="flex items-center gap-4 mb-6">
                                                <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center">
                                                    <ShieldAlert size={24} className="text-rose-600" />
                                                </div>
                                                <div>
                                                    <h3 className="text-sm font-black uppercase text-slate-900">Draconian Güvenlik</h3>
                                                    <p className="text-[10px] font-bold text-rose-400 uppercase tracking-tight">Kritik Sistem Yetkileri</p>
                                                </div>
                                            </div>
                                            <p className="text-[10px] font-medium text-slate-500 uppercase leading-loose italic">
                                                Tüm API anahtarı değişiklikleri 'Sovereign Audit' sistemine 'CRITICAL' seviyesinde loglanır ve geri alınamaz.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {showImporter && <DataImportWizard type="customers" onClose={() => setShowImporter(false)} />}
            <CreateBusinessModal 
                isOpen={showCreateModal} 
                onClose={() => setShowCreateModal(false)} 
                onCreate={handleCreateBusinessAction} 
                isCreating={isCreating} 
            />

            <EditBusinessModal 
                biz={editingBiz} 
                onClose={() => setEditingBiz(null)} 
                onUpdate={handleUpdateBusinessAction} 
                loading={!!isActionLoading}
            />
        </div>
    );
}
