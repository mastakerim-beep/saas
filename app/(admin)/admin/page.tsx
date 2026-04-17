"use client";

import { useStore } from '@/lib/store';
import { 
    Globe, ShieldCheck, Activity, Terminal, 
    Bell, Users, CreditCard, Sparkles, 
    ArrowUpRight, TrendingUp, Zap, Server, 
    Search, LayoutGrid, Database, LogOut,
    ChevronRight, Info, AlertCircle, Heart,
    PieChart as PieChartIcon, Power, Plus, RefreshCw, X
} from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { 
    AreaChart, Area, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, BarChart, Bar,
    PieChart, Pie, Cell 
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';

type AdminTab = 'monitor' | 'tenants' | 'notifications' | 'announcements' | 'system';

export default function SuperAdminPage() {
    const { 
        currentUser, allBusinesses, allPayments, allLogs, 
        allNotifs, tenantModules, setImpersonatedBusinessId,
        isImpersonating, logout, addBusiness, provisionBusinessUser, 
        deleteBusiness, updateBusinessStatus, clearCatalog, fetchData 
    } = useStore();

    const [activeTab, setActiveTab] = useState<AdminTab>('monitor');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isActionLoading, setIsActionLoading] = useState<string | null>(null);
    
    // Form State for new business
    const [newBiz, setNewBiz] = useState({
        name: '',
        slug: '',
        email: '',
        password: '',
        seatCount: 5
    });

    const handleRefresh = async () => {
        setIsRefreshing(true);
        clearCatalog();
        await fetchData(undefined, undefined, true);
        setIsRefreshing(false);
    };

    const handleCreateBusiness = async () => {
        if (!newBiz.name || !newBiz.slug || !newBiz.email || !newBiz.password) {
            return alert("Lütfen tüm alanları doldurun.");
        }

        if (isCreating) return;
        setIsCreating(true);

        try {
            const biz = await addBusiness({
                name: newBiz.name,
                slug: newBiz.slug.toLowerCase(),
                maxUsers: newBiz.seatCount,
                ownerName: "İşletme Sahibi"
            });

            if (biz) {
                await provisionBusinessUser({
                    email: newBiz.email,
                    password: newBiz.password,
                    name: "İşletme Sahibi",
                    businessId: biz.id
                });
                alert("İşletme ve yönetici hesabı başarıyla oluşturuldu!");
                setShowCreateModal(false);
                setNewBiz({ name: '', slug: '', email: '', password: '', seatCount: 5 });
                await fetchData(undefined, undefined, true);
            }
        } catch (err: any) {
            alert("Hata oluştu: " + err.message);
        } finally {
            setIsCreating(false);
        }
    };

    const handleDeleteBusiness = async (id: string, name: string) => {
        if (!window.confirm(`${name} işletmesini kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.`)) {
            return;
        }

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

    const handleToggleStatus = async (id: string, currentStatus: string) => {
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

    // GLOBAL STATS CALCULATIONS
    const stats = useMemo(() => {
        const totalRev = allPayments.reduce((s, p) => s + p.totalAmount, 0);
        const activeTenants = allBusinesses.filter(b => b.status === 'active').length;
        const mrr = totalRev * 0.1; // Simulated MRR logic
        const pendingNotifs = allNotifs.filter(n => n.type === 'INTERNAL_REPORT').length;

        return { totalRev, activeTenants, mrr, pendingNotifs };
    }, [allPayments, allBusinesses, allNotifs]);

    // CHART DATA: Global Revenue
    const chartData = useMemo(() => {
        const data: any[] = [];
        for (let i = 14; i >= 0; i--) {
            const date = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
            const dateStr = date.toISOString().split('T')[0];
            const name = `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}`;
            
            const dayRev = allPayments.filter(p => p.date === dateStr).reduce((s, p) => s + p.totalAmount, 0);
            data.push({ name, revenue: dayRev, growth: Math.floor(dayRev * 0.8) });
        }
        return data;
    }, [allPayments]);

    const filteredBusinesses = allBusinesses.filter(b => 
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

            {/* Top Navigation Bar: Clean & Sovereign */}
            <div className="relative z-50 h-[84px] px-10 flex items-center justify-between border-b border-indigo-100/50 bg-white/80 backdrop-blur-2xl">
                <div className="flex items-center gap-6">
                    <div className="w-12 h-12 bg-indigo-600 rounded-[1.25rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20 group hover:rotate-12 transition-all duration-500">
                        <Zap size={24} className="fill-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-slate-900 font-black text-xl italic tracking-tighter uppercase leading-none">Aura Komuta Merkezi</h1>
                        <div className="flex items-center gap-3 mt-1.5">
                            <span className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.2em] flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-md">
                                <Server size={10} /> V 4.0.2
                            </span>
                            <span className="w-1 h-1 bg-slate-200 rounded-full" />
                            <span className="text-[9px] font-black text-emerald-600 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> SİSTEM OPTİMAL
                            </span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="hidden lg:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
                        <div className="flex flex-col items-end">
                            <span className="text-slate-900 leading-none mb-1">₺{stats.mrr.toLocaleString()}</span>
                            <span className="text-[8px] opacity-60">GÜNCEL MRR</span>
                        </div>
                        <div className="w-px h-8 bg-slate-100" />
                        <div className="flex flex-col items-end">
                            <span className="text-slate-900 leading-none mb-1">{allBusinesses.length}</span>
                            <span className="text-[8px] opacity-60">TOPLAM NODE</span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3 pl-8 border-l border-slate-100">
                         <div className="text-right">
                             <p className="text-[11px] font-black text-slate-900 leading-none mb-1">{currentUser.name}</p>
                             <p className="text-[8px] font-bold text-indigo-500 uppercase tracking-widest">Sovereign Admin</p>
                         </div>
                         <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                if(confirm('Oturumu kapatmak istediğinize emin misiniz?')) logout();
                            }}
                            className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all"
                            title="Güvenli Çıkış"
                         >
                             <LogOut size={20} />
                         </button>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex gap-4 px-8 py-8 h-[calc(100vh-80px)] overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 shrink-0 flex flex-col gap-2">
                    <p className="px-4 text-[9px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Tactical Matrix</p>
                    <NavBtn id="monitor" active={activeTab} onClick={setActiveTab} icon={Activity} label="İzleme" badge="CANLI" />
                    <NavBtn id="tenants" active={activeTab} onClick={setActiveTab} icon={Globe} label="İşletmeler" badge={allBusinesses.length.toString()} />
                    <NavBtn id="notifications" active={activeTab} onClick={setActiveTab} icon={Bell} label="İç Akış" badge={stats.pendingNotifs.toString()} />
                    <NavBtn id="announcements" active={activeTab} onClick={setActiveTab} icon={Bell} label="Yayın Merkezi" />
                    <NavBtn id="system" active={activeTab} onClick={setActiveTab} icon={Terminal} label="Sistem Terminali" />
                    
                    <button 
                        onClick={handleRefresh}
                        className="mt-4 mx-2 px-4 py-3 rounded-xl border border-indigo-100 bg-white hover:bg-indigo-50 text-[10px] font-bold text-indigo-600 flex items-center justify-center gap-2 transition-all group"
                    >
                        <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : 'group-hover:rotate-180 transition-transform duration-500'} />
                        VERİLERİ YENİLE
                    </button>
                    
                    <div className="mt-auto p-6 bg-indigo-50 border border-indigo-100 rounded-3xl transition-all hover:shadow-lg hover:shadow-indigo-500/5">
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldCheck className="text-indigo-600" size={16} />
                            <span className="text-[9px] font-black text-slate-900 uppercase tracking-widest">Sistem Sağlığı</span>
                        </div>
                        <div className="space-y-2">
                             <div className="h-1 bg-indigo-200 rounded-full overflow-hidden">
                                 <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-indigo-600" />
                             </div>
                             <p className="text-[8px] font-bold text-slate-500">CPU: 12% | RAM: 4.2GB / 32GB</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-2 pb-20">
                    <AnimatePresence mode="wait">
                        {activeTab === 'monitor' && (
                            <motion.div key="monitor" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                {/* Global Insights */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard title="Toplam Ağ Geliri" value={`₺${stats.totalRev.toLocaleString()}`} icon={CreditCard} trend="+12.4%" color="indigo" />
                                    <StatCard title="Aktif İşletme Sayısı" value={stats.activeTenants} icon={Globe} trend="+2 yeni" color="purple" />
                                    <StatCard title="Sistem Sorgulama" value={allLogs.length} icon={Database} trend="Stabil" color="blue" />
                                </div>

                                {/* Global Chart */}
                                <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-10 shadow-sm transition-all hover:shadow-xl hover:shadow-indigo-500/5">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <h3 className="text-slate-900 text-xl font-black italic uppercase tracking-tighter">Ağ Büyüme Nabzı</h3>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Küresel Gelir Akışı - Son 14 Gün</p>
                                        </div>
                                        <div className="flex gap-4">
                                             <div className="flex items-center gap-2 text-[9px] font-black text-indigo-600">
                                                 <div className="w-2 h-2 bg-indigo-600 rounded-full" /> GELİR
                                             </div>
                                             <div className="flex items-center gap-2 text-[9px] font-black text-purple-600">
                                                 <div className="w-2 h-2 bg-purple-600 rounded-full" /> PROJEKSİYON
                                             </div>
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
                                                    contentStyle={{ backgroundColor: 'rgba(255,255,255,0.95)', border: '1px solid #e2e8f0', borderRadius: '15px', backdropFilter: 'blur(10px)', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                    itemStyle={{ fontSize: '10px', fontWeight: '900', color: '#1e293b' }}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                                <Area type="monotone" dataKey="growth" stroke="#9333EA" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Recent Pulse Stream */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pb-10">
                                    <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-8 shadow-sm">
                                        <h4 className="text-slate-900 text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                                            <Activity size={14} className="text-indigo-600" /> Sistem Akışı
                                        </h4>
                                        <div className="space-y-4">
                                            {allLogs.slice(0, 8).map((log, i) => (
                                                <div key={i} className="flex gap-4 items-center group cursor-pointer hover:translate-x-1 transition-transform">
                                                    <div className="w-8 h-8 bg-slate-50 border border-indigo-50 rounded-lg flex items-center justify-center text-indigo-600 group-hover:text-white group-hover:bg-indigo-600 transition-all font-mono text-[10px]">
                                                        {i+1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-black text-slate-700 truncate">{log.action}</p>
                                                        <p className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">{log.user} @ {new Date(log.date).toLocaleTimeString()}</p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-slate-200" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-8 shadow-sm">
                                        <h4 className="text-slate-900 text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                                            <Database size={14} className="text-purple-600" /> Sistem Metrikleri
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <MetricBox label="Aktif Oturumlar" value="1,244" trend="+4%" />
                                            <MetricBox label="API Gecikme" value="28ms" trend="Stabil" />
                                            <MetricBox label="DB Tepe İşlem" value="14.2k/s" trend="-2%" />
                                            <MetricBox label="Hata Oranı" value="0.04%" trend="Nominal" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'tenants' && (
                            <motion.div key="tenants" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="relative group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors" size={18} />
                                        <input 
                                            placeholder="İşletme adı, slug veya ID ara..." 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="bg-white border border-indigo-100 rounded-full py-5 pl-16 pr-8 w-96 text-sm font-black text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm" 
                                        />
                                    </div>
                                    <button 
                                        onClick={() => setShowCreateModal(true)}
                                        className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-8 py-5 rounded-full shadow-2xl shadow-indigo-600/20 transition-all flex items-center gap-3"
                                    >
                                        <Plus size={16} /> YENİ İŞLETME TANIMLA
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-10">
                                    {filteredBusinesses.map((biz) => (
                                        <TenantCard 
                                            key={biz.id} 
                                            biz={biz} 
                                            isLoading={isActionLoading === biz.id}
                                            onImpersonate={() => setImpersonatedBusinessId(biz.id)} 
                                            onDelete={() => handleDeleteBusiness(biz.id, biz.name)}
                                            onToggleStatus={() => handleToggleStatus(biz.id, biz.status)}
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'notifications' && (
                            <motion.div key="notifications" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-10 shadow-sm">
                                    <h2 className="text-slate-900 text-2xl font-black italic uppercase tracking-tighter mb-2">Dahili Sistem Akışı</h2>
                                    <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.3em] mb-10">AI Tarafından Üretilen Gün Sonu Özetleri</p>
                                    
                                    <div className="space-y-6 pb-10">
                                        {allNotifs.filter(n => n.type === 'INTERNAL_REPORT').map((n, i) => (
                                            <div key={i} className="bg-slate-50 border border-indigo-50 rounded-[2rem] p-8 group hover:border-indigo-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white text-indigo-600 border border-indigo-100 rounded-2xl flex items-center justify-center">
                                                            <Activity size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-slate-900 font-black text-lg">GÜNLÜK RAPOR - {n.sentAt?.split('T')[0]}</p>
                                                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">İşletme ID: {n.customerId || 'GLOBAL'}</p>
                                                        </div>
                                                    </div>
                                                    <button className="text-[10px] font-black text-indigo-600 p-2 px-4 rounded-xl border border-indigo-100 hover:bg-indigo-600 hover:text-white transition-all">
                                                        DETAYLAR
                                                    </button>
                                                </div>
                                                <div className="bg-white rounded-2xl p-6 font-mono text-[11px] text-slate-700 whitespace-pre-wrap leading-relaxed border border-indigo-50 shadow-inner">
                                                    {n.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'announcements' && (
                            <motion.div key="announcements" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-10 shadow-sm">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20">
                                            <Bell size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-slate-900 text-3xl font-black italic uppercase tracking-tighter">Küresel Yayın Komutası</h2>
                                            <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-[0.3em]">Tüm ağ düğümlerine mesaj ilet</p>
                                        </div>
                                    </div>

                                    <BroadcastForm />
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'system' && (
                            <motion.div key="system" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[600px] bg-slate-900 rounded-[2.5rem] border border-indigo-100 overflow-hidden flex flex-col p-1 shadow-2xl">
                                <div className="h-10 bg-white/5 rounded-t-[2.4rem] flex items-center px-6 gap-2 border-b border-white/5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span className="ml-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Aura Sovereign Terminal - tty1</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 font-mono text-[12px] space-y-2 no-scrollbar">
                                    <p className="text-emerald-400">{">"} aura build --production --elite</p>
                                    <p className="text-slate-400">Compiling modules...</p>
                                    <p className="text-slate-400">Checking sovereign key...</p>
                                    <p className="text-indigo-400 font-bold">Authenticated: KERIM (SOVEREIGN_ADMIN)</p>
                                    <p className="text-slate-400">Deploying tactical overlays to 14 nodes...</p>
                                    <p className="text-emerald-400">SUCCESS: Aura Command Center is online.</p>
                                    <div className="mt-8 flex gap-2 items-center">
                                        <span className="text-emerald-400">root@sov-v4:~#</span>
                                        <input className="bg-transparent border-none outline-none text-white w-full caret-indigo-500" autoFocus />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Create Business Modal */}
            <AnimatePresence>
                {showCreateModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-slate-900/40 text-left">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white border border-indigo-100 rounded-[2.5rem] w-full max-w-lg overflow-hidden shadow-2xl"
                        >
                            <div className="p-10">
                                <div className="flex justify-between items-center mb-10">
                                    <div>
                                        <h2 className="text-slate-900 text-2xl font-black italic uppercase tracking-tighter">Yeni İşletme</h2>
                                        <p className="text-[10px] font-bold text-indigo-600 uppercase tracking-widest mt-1">Sistem üzerinde yeni bir node oluştur</p>
                                    </div>
                                    <button onClick={() => setShowCreateModal(false)} className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-slate-100 transition-all">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">İşletme Adı</label>
                                        <input 
                                            value={newBiz.name}
                                            onChange={e => setNewBiz({...newBiz, name: e.target.value})}
                                            placeholder="Örn: Aura Spa Merkezi"
                                            className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Slug (URL)</label>
                                            <input 
                                                value={newBiz.slug}
                                                onChange={e => setNewBiz({...newBiz, slug: e.target.value})}
                                                placeholder="aura-spa"
                                                className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Koltuk (Kullanıcı)</label>
                                            <input 
                                                type="number"
                                                value={newBiz.seatCount}
                                                onChange={e => setNewBiz({...newBiz, seatCount: parseInt(e.target.value)})}
                                                className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Sahip E-posta</label>
                                        <input 
                                            value={newBiz.email}
                                            onChange={e => setNewBiz({...newBiz, email: e.target.value})}
                                            placeholder="admin@isletme.com"
                                            className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Geçici Şifre</label>
                                        <input 
                                            type="password"
                                            value={newBiz.password}
                                            onChange={e => setNewBiz({...newBiz, password: e.target.value})}
                                            placeholder="••••••••"
                                            className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-4 px-6 text-slate-900 font-bold outline-none focus:border-indigo-500 transition-all shadow-inner"
                                        />
                                    </div>
                                </div>

                                <button 
                                    onClick={handleCreateBusiness}
                                    disabled={isCreating}
                                    className="w-full mt-10 py-5 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/40 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isCreating ? 'İŞLENİYOR...' : 'İŞLETMEYİ OLUŞTUR ✓'}
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function BroadcastForm() {
    const { broadcastAnnouncement } = useStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'success' | 'danger'>('info');
    const [loading, setLoading] = useState(false);

    const handleBroadcast = async () => {
        if (!title || !content) return alert("All fields are required.");
        setLoading(true);
        try {
            await broadcastAnnouncement(title, content, type);
            alert("BROADCAST TRANSMITTED SUCCESSFULLY");
            setTitle('');
            setContent('');
        } catch (err) {
            alert("TRANSMISSION FAILED");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl space-y-8">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Anons Başlığı</label>
                <input 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Örn: Sistem Bakımı, Yeni Özellik Güncellemesi"
                    className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-5 px-8 text-slate-900 font-black outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Yayın Tipi</label>
                <div className="flex gap-3">
                    {['info', 'warning', 'success', 'danger'].map((t: any) => (
                        <button 
                            key={t}
                            onClick={() => setType(t)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                type === t 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                : 'bg-white border-slate-100 text-gray-500'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mesaj İçeriği</label>
                <textarea 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={4}
                    placeholder="Anonsun kısa açıklaması..."
                    className="w-full bg-slate-50 border border-indigo-50 rounded-[2rem] py-5 px-8 text-slate-800 font-medium outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
            </div>

            <button 
                onClick={handleBroadcast}
                disabled={loading}
                className="w-full py-6 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/40 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {loading ? 'YAYINLANIYOR...' : 'KÜRESEL YAYINI BAŞLAT ✓'}
            </button>
        </div>
    );
}

function NavBtn({ id, active, onClick, icon: Icon, label, badge }: any) {
    const isActive = active === id;
    return (
        <button 
            onClick={() => onClick(id)}
            className={`
                relative px-6 py-4 rounded-2xl flex items-center justify-between group transition-all duration-300
                ${isActive ? 'bg-indigo-50 text-indigo-600' : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-50'}
            `}
        >
            <div className="flex items-center gap-4">
                <Icon size={18} className={isActive ? 'text-indigo-600' : 'group-hover:text-indigo-600 transition-colors'} />
                <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
            </div>
            {badge && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${isActive ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {badge}
                </span>
            )}
            {isActive && <motion.div layoutId="nav-active" className="absolute left-1 w-1 h-8 bg-indigo-600 rounded-full" />}
        </button>
    );
}

function StatCard({ title, value, icon: Icon, trend, color }: any) {
    const bgMap: any = {
        indigo: 'bg-indigo-600',
        purple: 'bg-purple-600',
        blue: 'bg-blue-600'
    };
    return (
        <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-indigo-500/20 transition-all shadow-sm">
            <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{title}</p>
                    <p className="text-3xl font-black text-slate-900 italic tracking-tighter">{value}</p>
                    <div className="flex items-center gap-2">
                         <span className="text-emerald-600 text-[10px] font-black">{trend}</span>
                         <span className="text-[9px] font-bold text-slate-400 uppercase">Bu Dönem</span>
                    </div>
                </div>
                <div className={`${bgMap[color]} p-3 rounded-2xl text-white shadow-2xl shadow-indigo-600/20 group-hover:scale-110 transition-transform`}>
                    <Icon size={20} />
                </div>
            </div>
            <div className={`absolute -right-8 -bottom-8 w-24 h-24 ${bgMap[color]} opacity-5 rounded-full group-hover:scale-150 transition-transform duration-700`} />
        </div>
    );
}

function MetricBox({ label, value, trend }: any) {
    return (
        <div className="bg-slate-50 border border-indigo-50 rounded-2xl p-4 flex flex-col justify-between h-24 shadow-inner">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{label}</p>
            <div className="flex justify-between items-end">
                <p className="text-xl font-bold text-slate-900 tracking-tight">{value}</p>
                <span className={`text-[9px] font-black ${trend.includes('+') ? 'text-emerald-600' : trend === 'Stabil' || trend === 'Nominal' ? 'text-indigo-600' : 'text-rose-600'}`}>
                    {trend}
                </span>
            </div>
        </div>
    );
}

function TenantCard({ biz, onImpersonate, onDelete, onToggleStatus, isLoading }: any) {
    const isActive = biz.status === 'active';
    return (
        <div className="bg-white border border-indigo-100 rounded-[2.5rem] p-8 group hover:border-indigo-500/50 transition-all flex flex-col justify-between h-[360px] shadow-sm hover:shadow-xl relative overflow-hidden">
            {isLoading && (
                <div className="absolute inset-0 bg-white/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
                    <RefreshCw className="animate-spin text-indigo-600" size={24} />
                </div>
            )}
            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 text-xl font-black italic">
                        {biz.name.charAt(0)}
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={onToggleStatus}
                            className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all ${isActive ? 'bg-emerald-100 text-emerald-600 hover:bg-amber-100 hover:text-amber-600' : 'bg-amber-100 text-amber-600 hover:bg-emerald-100 hover:text-emerald-600'}`}
                        >
                            {isActive ? 'AKTİF' : 'PASİF'}
                        </button>
                        <button 
                            onClick={onDelete}
                            className="p-1.5 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                            title="İşletmeyi Sil"
                        >
                            <X size={14} />
                        </button>
                    </div>
                </div>
                <h4 className="text-slate-900 text-xl font-black italic tracking-tighter line-clamp-1">{biz.name}</h4>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">/{biz.slug}</p>
                <div className="flex gap-4">
                     <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-300 uppercase">PLAN</span>
                         <span className="text-[10px] font-black text-indigo-600 uppercase">{biz.plan || 'Enterprise'}</span>
                     </div>
                     <div className="flex flex-col">
                         <span className="text-[8px] font-black text-slate-300 uppercase">ÜYELER</span>
                         <span className="text-[10px] font-black text-slate-900 uppercase">{biz.maxUsers || 5} Koltuk</span>
                     </div>
                </div>
            </div>
            
            <div className="space-y-2 mt-6">
                <button 
                    onClick={onImpersonate}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all shadow-xl shadow-slate-900/20"
                >
                    <Zap size={14} className="fill-current" /> YÖNETİCİ OLARAK GİR
                </button>
            </div>
        </div>
    );
}
