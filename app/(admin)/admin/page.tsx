"use client";

import { useStore } from '@/lib/store';
import { 
    Globe, ShieldCheck, Activity, Terminal, 
    Bell, Users, CreditCard, Sparkles, 
    ArrowUpRight, TrendingUp, Zap, Server, 
    Search, LayoutGrid, Database, LogOut,
    ChevronRight, Info, AlertCircle, Heart,
    PieChart as PieChartIcon, Power
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
        isImpersonating, logout 
    } = useStore();

    const [activeTab, setActiveTab] = useState<AdminTab>('monitor');
    const [searchQuery, setSearchQuery] = useState('');

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
            <div className="h-screen bg-black flex flex-col items-center justify-center p-12 text-center">
                <ShieldCheck size={80} className="text-rose-500 mb-8 animate-pulse" />
                <h1 className="text-white text-5xl font-black tracking-tighter italic">ERİŞİM REDDEDİLDİ</h1>
                <p className="text-rose-500 font-black text-[10px] uppercase tracking-[0.5em] mt-4">Sovereign Authority Required</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050505] text-gray-400 font-sans selection:bg-indigo-500/30 overflow-x-hidden">
            {/* Ambient Background */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[60%] bg-indigo-600/5 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-600/5 blur-[150px] rounded-full" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50 contrast-150" />
            </div>

            {/* Top Navigation Bar */}
            <div className="relative z-50 h-[80px] px-8 flex items-center justify-between border-b border-white/5 bg-black/40 backdrop-blur-3xl">
                <div className="flex items-center gap-6">
                    <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-xl shadow-indigo-600/20 group cursor-pointer hover:scale-110 transition-all">
                        <Zap size={20} className="fill-white" />
                    </div>
                    <div className="flex flex-col">
                        <h1 className="text-white font-black text-lg tracking-tighter uppercase italic leading-none">Aura Command Center</h1>
                        <p className="text-[9px] font-black text-indigo-500 uppercase tracking-[0.3em] mt-1 flex items-center gap-2">
                            <Server size={10} /> SYSTEM VERSION 4.0.2 - SOVEREIGN
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="hidden md:flex items-center gap-8 text-[10px] font-black uppercase tracking-widest mr-8">
                        <div className="flex items-center gap-2 text-emerald-500">
                            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> GRID STATUS: OPTIMAL
                        </div>
                        <div className="flex items-center gap-2 text-indigo-400">
                            MRR: ₺{stats.mrr.toLocaleString()}
                        </div>
                    </div>
                    <div className="p-1 px-4 bg-white/5 rounded-full border border-white/10 flex items-center gap-4">
                         <div className="text-right">
                             <p className="text-[10px] font-black text-white">{currentUser.name}</p>
                             <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-widest">Sovereign Admin</p>
                         </div>
                         <button onClick={logout} className="p-2 hover:text-rose-500 transition-colors">
                             <Power size={18} />
                         </button>
                    </div>
                </div>
            </div>

            <div className="relative z-10 flex gap-1 px-8 py-8 h-[calc(100vh-80px)] overflow-hidden">
                {/* Sidebar Navigation */}
                <div className="w-64 shrink-0 flex flex-col gap-2">
                    <p className="px-4 text-[9px] font-black text-white/20 uppercase tracking-[0.3em] mb-4">Tactical Matrix</p>
                    <NavBtn id="monitor" active={activeTab} onClick={setActiveTab} icon={Activity} label="Monitoring" badge="LIVE" />
                    <NavBtn id="tenants" active={activeTab} onClick={setActiveTab} icon={Globe} label="Tenants" badge={allBusinesses.length.toString()} />
                    <NavBtn id="notifications" active={activeTab} onClick={setActiveTab} icon={Bell} label="Pocket Feed" badge={stats.pendingNotifs.toString()} />
                    <NavBtn id="announcements" active={activeTab} onClick={setActiveTab} icon={Bell} label="Broadcast" />
                    <NavBtn id="system" active={activeTab} onClick={setActiveTab} icon={Terminal} label="Kernel Terminal" />
                    
                    <div className="mt-auto p-6 bg-indigo-600/5 border border-indigo-500/10 rounded-3xl">
                        <div className="flex items-center gap-3 mb-3">
                            <ShieldCheck className="text-indigo-500" size={16} />
                            <span className="text-[9px] font-black text-white uppercase tracking-widest">System Health</span>
                        </div>
                        <div className="space-y-2">
                             <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                                 <motion.div initial={{ width: 0 }} animate={{ width: '92%' }} className="h-full bg-indigo-500" />
                             </div>
                             <p className="text-[8px] font-bold text-white/40">CPU: 12% | RAM: 4.2GB / 32GB</p>
                        </div>
                    </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 overflow-y-auto no-scrollbar px-6 pb-20">
                    <AnimatePresence mode="wait">
                        {activeTab === 'monitor' && (
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="space-y-8">
                                {/* Global Insights */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <StatCard title="Total Network Revenue" value={`₺${stats.totalRev.toLocaleString()}`} icon={CreditCard} trend="+12.4%" color="indigo" />
                                    <StatCard title="Active Fleet Count" value={stats.activeTenants} icon={Globe} trend="+2 new" color="purple" />
                                    <StatCard title="Strategic Inquiries" value={allLogs.length} icon={Database} trend="Stable" color="blue" />
                                </div>

                                {/* Global Chart */}
                                <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-xl">
                                    <div className="flex justify-between items-start mb-10">
                                        <div>
                                            <h3 className="text-white text-xl font-black italic uppercase tracking-tighter">Network Growth Pulse</h3>
                                            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">Global Revenue Flux - Last 14 Days</p>
                                        </div>
                                        <div className="flex gap-4">
                                             <div className="flex items-center gap-2 text-[9px] font-black text-indigo-400">
                                                 <div className="w-2 h-2 bg-indigo-500 rounded-full" /> REVENUE
                                             </div>
                                             <div className="flex items-center gap-2 text-[9px] font-black text-purple-400">
                                                 <div className="w-2 h-2 bg-purple-500 rounded-full" /> PROJECTED
                                             </div>
                                        </div>
                                    </div>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <AreaChart data={chartData}>
                                                <defs>
                                                    <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                                                        <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                                                        <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                                                    </linearGradient>
                                                </defs>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.03)" />
                                                <XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'rgba(255,255,255,0.3)' }} />
                                                <YAxis axisLine={false} tickLine={false} fontSize={10} tick={{ fill: 'rgba(255,255,255,0.3)' }} tickFormatter={(val) => `₺${val/1000}k`} />
                                                <Tooltip 
                                                    contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '15px', backdropFilter: 'blur(20px)' }}
                                                    itemStyle={{ fontSize: '10px', fontWeight: '900', color: '#fff' }}
                                                />
                                                <Area type="monotone" dataKey="revenue" stroke="#4F46E5" strokeWidth={4} fillOpacity={1} fill="url(#colorRev)" />
                                                <Area type="monotone" dataKey="growth" stroke="#9333EA" strokeWidth={2} strokeDasharray="5 5" fillOpacity={0} />
                                            </AreaChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Recent Pulse Stream */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8">
                                        <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                                            <Activity size={14} className="text-indigo-500" /> Sentinel Stream
                                        </h4>
                                        <div className="space-y-4">
                                            {allLogs.slice(0, 8).map((log, i) => (
                                                <div key={i} className="flex gap-4 items-center group cursor-pointer hover:translate-x-1 transition-transform">
                                                    <div className="w-8 h-8 bg-white/5 rounded-lg flex items-center justify-center text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 transition-all font-mono text-[10px]">
                                                        {i+1}
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-black text-gray-300 truncate">{log.action}</p>
                                                        <p className="text-[8px] font-bold text-gray-600 uppercase tracking-tighter">{log.user} @ {new Date(log.date).toLocaleTimeString()}</p>
                                                    </div>
                                                    <ChevronRight size={14} className="text-white/10" />
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8">
                                        <h4 className="text-white text-xs font-black uppercase tracking-widest mb-6 flex items-center gap-3">
                                            <Database size={14} className="text-purple-500" /> System Metrics
                                        </h4>
                                        <div className="grid grid-cols-2 gap-4">
                                            <MetricBox label="Active Sessions" value="1,244" trend="+4%" />
                                            <MetricBox label="API Latency" value="28ms" trend="Stable" />
                                            <MetricBox label="DB Peak Ops" value="14.2k/s" trend="-2%" />
                                            <MetricBox label="Error Rate" value="0.04%" trend="Nominal" />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'tenants' && (
                            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="space-y-6">
                                <div className="flex justify-between items-center mb-8">
                                    <div className="relative group">
                                        <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-white transition-colors" size={18} />
                                        <input 
                                            placeholder="Search businesses, slugs, IDs..." 
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            className="bg-white/5 border border-white/10 rounded-full py-5 pl-16 pr-8 w-96 text-sm font-black text-white outline-none focus:border-indigo-500/50 transition-all" 
                                        />
                                    </div>
                                    <button className="bg-indigo-600 hover:bg-indigo-700 text-white font-black text-[10px] uppercase tracking-widest px-8 py-5 rounded-full shadow-2xl shadow-indigo-600/20 transition-all">
                                        PROVISION NEW TENANT
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredBusinesses.map((biz) => (
                                        <TenantCard 
                                            key={biz.id} 
                                            biz={biz} 
                                            onImpersonate={() => setImpersonatedBusinessId(biz.id)} 
                                        />
                                    ))}
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'notifications' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-10">
                                    <h2 className="text-white text-2xl font-black italic uppercase tracking-tighter mb-2">Internal Pocket Feed</h2>
                                    <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mb-10">AI Generated End-of-Day Insights from the Fleet</p>
                                    
                                    <div className="space-y-6">
                                        {allNotifs.filter(n => n.type === 'INTERNAL_REPORT').map((n, i) => (
                                            <div key={i} className="bg-white/5 border border-white/10 rounded-[2rem] p-8 group hover:border-indigo-500/30 transition-all">
                                                <div className="flex justify-between items-start mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-indigo-600/20 text-indigo-500 rounded-2xl flex items-center justify-center">
                                                            <Activity size={24} />
                                                        </div>
                                                        <div>
                                                            <p className="text-white font-black text-lg">DAILY REPORT - {n.sentAt?.split('T')[0]}</p>
                                                            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">Business ID: {n.customerId || 'GLOBAL'}</p>
                                                        </div>
                                                    </div>
                                                    <button className="text-[10px] font-black text-indigo-400 p-2 px-4 rounded-xl border border-indigo-400/20 hover:bg-indigo-400 hover:text-white transition-all">
                                                        OPEN POCKET
                                                    </button>
                                                </div>
                                                <div className="bg-black/50 rounded-2xl p-6 font-mono text-[11px] text-gray-300 whitespace-pre-wrap leading-relaxed border border-white/5">
                                                    {n.content}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'announcements' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                                <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-3xl">
                                    <div className="flex items-center gap-4 mb-10">
                                        <div className="w-14 h-14 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-2xl shadow-indigo-600/20">
                                            <Bell size={28} />
                                        </div>
                                        <div>
                                            <h2 className="text-white text-3xl font-black italic uppercase tracking-tighter">Global Broadcast Command</h2>
                                            <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em]">Transmit messages to all network nodes</p>
                                        </div>
                                    </div>

                                    <BroadcastForm />
                                </div>
                            </motion.div>
                        )}

                        {activeTab === 'system' && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-[600px] bg-black rounded-[2.5rem] border border-white/10 overflow-hidden flex flex-col p-1 shadow-2xl">
                                <div className="h-10 bg-white/5 rounded-t-[2.4rem] flex items-center px-6 gap-2 border-b border-white/5">
                                    <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                    <span className="ml-4 text-[9px] font-black text-white/30 uppercase tracking-widest">Aura Sovereign Terminal - tty1</span>
                                </div>
                                <div className="flex-1 overflow-y-auto p-8 font-mono text-[12px] space-y-2 no-scrollbar">
                                    <p className="text-emerald-500">{">"} aura build --production --elite</p>
                                    <p className="text-gray-500">Compiling modules...</p>
                                    <p className="text-gray-500">Checking sovereign key...</p>
                                    <p className="text-indigo-400 font-bold">Authenticated: KERIM (SOVEREIGN_ADMIN)</p>
                                    <p className="text-gray-500">Deploying tactical overlays to 14 nodes...</p>
                                    <p className="text-emerald-500">SUCCESS: Aura Command Center is online.</p>
                                    <div className="mt-8 flex gap-2 items-center">
                                        <span className="text-emerald-500">root@sov-v4:~#</span>
                                        <input className="bg-transparent border-none outline-none text-white w-full caret-indigo-500" autoFocus />
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
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
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Announcement Title</label>
                <input 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="e.g. System Maintenance, New Feature Update"
                    className="w-full bg-white/5 border border-white/10 rounded-2xl py-5 px-8 text-white font-black outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Broadcast Type</label>
                <div className="flex gap-3">
                    {['info', 'warning', 'success', 'danger'].map((t: any) => (
                        <button 
                            key={t}
                            onClick={() => setType(t)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                type === t 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                : 'bg-white/5 border-white/10 text-gray-500'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Message Payload</label>
                <textarea 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={4}
                    placeholder="Brief description of the announcement..."
                    className="w-full bg-white/5 border border-white/10 rounded-[2rem] py-5 px-8 text-white font-medium outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
            </div>

            <button 
                onClick={handleBroadcast}
                disabled={loading}
                className="w-full py-6 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/40 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {loading ? 'TRANSMITTING...' : 'EXECUTE GLOBAL BROADCAST ✓'}
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
                ${isActive ? 'bg-white/5 text-white' : 'text-gray-500 hover:text-white hover:bg-white/5'}
            `}
        >
            <div className="flex items-center gap-4">
                <Icon size={18} className={isActive ? 'text-indigo-500' : 'group-hover:text-indigo-400 transition-colors'} />
                <span className="text-[11px] font-black uppercase tracking-widest">{label}</span>
            </div>
            {badge && (
                <span className={`text-[9px] font-black px-2 py-0.5 rounded-md ${isActive ? 'bg-indigo-500 text-white' : 'bg-white/10 text-gray-500 transition-all'}`}>
                    {badge}
                </span>
            )}
            {isActive && <motion.div layoutId="nav-active" className="absolute left-1 w-1 h-8 bg-indigo-500 rounded-full" />}
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
        <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 relative overflow-hidden group hover:border-white/10 transition-all">
            <div className="relative z-10 flex justify-between items-start">
                <div className="space-y-2">
                    <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{title}</p>
                    <p className="text-3xl font-black text-white italic tracking-tighter">{value}</p>
                    <div className="flex items-center gap-2">
                         <span className="text-emerald-500 text-[10px] font-black">{trend}</span>
                         <span className="text-[9px] font-bold text-gray-600 uppercase">This Period</span>
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
        <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between h-24">
            <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
            <div className="flex justify-between items-end">
                <p className="text-xl font-bold text-white tracking-tight">{value}</p>
                <span className={`text-[9px] font-black ${trend.includes('+') ? 'text-emerald-500' : trend === 'Stable' || trend === 'Nominal' ? 'text-indigo-400' : 'text-rose-500'}`}>
                    {trend}
                </span>
            </div>
        </div>
    );
}

function TenantCard({ biz, onImpersonate }: any) {
    return (
        <div className="bg-black/40 border border-white/5 rounded-[2.5rem] p-8 group hover:border-indigo-500/30 transition-all flex flex-col justify-between h-[300px]">
            <div>
                <div className="flex justify-between items-start mb-6">
                    <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center text-white text-xl font-black italic">
                        {biz.name.charAt(0)}
                    </div>
                    <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest ${biz.status === 'active' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {biz.status}
                    </div>
                </div>
                <h4 className="text-white text-xl font-black italic tracking-tighter line-clamp-1">{biz.name}</h4>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-[0.2em] mb-4">/{biz.slug}</p>
                <div className="flex gap-4">
                     <div className="flex flex-col">
                         <span className="text-[8px] font-black text-gray-600 uppercase">Plan</span>
                         <span className="text-[10px] font-black text-indigo-400 uppercase">Enterprise</span>
                     </div>
                     <div className="flex flex-col">
                         <span className="text-[8px] font-black text-gray-600 uppercase">Staff</span>
                         <span className="text-[10px] font-black text-white uppercase">12 Nodes</span>
                     </div>
                </div>
            </div>
            
            <button 
                onClick={onImpersonate}
                className="w-full mt-6 py-4 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-indigo-500 hover:text-white transition-all shadow-xl shadow-black/20"
            >
                <Zap size={14} className="fill-current" /> EXECUTE GOD MODE
            </button>
        </div>
    );
}
