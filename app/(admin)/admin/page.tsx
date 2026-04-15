"use client";

import { useStore, Business, AuditLog, SystemAnnouncement } from "@/lib/store";
import { 
    Building2, CreditCard, ShieldCheck, 
    TrendingUp, Users, Search, 
    Filter, MoreVertical, Globe, 
    Lock, CheckCircle2, AlertTriangle, Plus, Minus,
    BarChart3, Activity, Zap, ShieldAlert, X,
    Calendar, Sparkles, LayoutGrid, Trash2,
    LogIn, Pause, Play, Terminal as TerminalIcon, UserPlus, LogOut,
    Megaphone, Settings2, Layers
} from "lucide-react";
import { useState, useMemo, useEffect } from "react";
import { 
    BarChart, Bar, XAxis, YAxis, CartesianGrid, 
    Tooltip, ResponsiveContainer, AreaChart, Area,
    PieChart, Pie, Cell
} from 'recharts';
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";

export default function SuperAdminPage() {
  const { 
    currentUser, allBusinesses, allPayments, allLogs, allNotifs, tenantModules,
    updateBusinessLicense, updateBusinessStatus, updateBusinessBranches, deleteBusiness, addBusiness,
    setImpersonatedBusinessId, logout, fetchData, syncStatus, isInitialized,
    addAnnouncement, updateModuleStatus, updateBusinessPricing, provisionBusinessUser
  } = useStore();

  const [activeTab, setActiveTab] = useState<'monitor' | 'tenants' | 'announcements' | 'pricing' | 'terminal'>('monitor');
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddBizModalOpen, setIsAddBizModalOpen] = useState(false);
  const [newBiz, setNewBiz] = useState({ 
    name: '', 
    slug: '', 
    ownerName: '', 
    plan: 'Basic' as Business['plan'], 
    expiryDate: '', 
    maxUsers: 5,
    mrr: 0,
    overrideMrr: 0,
    signupPrice: 0
  });

  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '', type: 'info' as any });
  const [isPublishing, setIsPublishing] = useState(false);
  
  // Provisioning State
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [selectedBizForUser, setSelectedBizForUser] = useState<string | null>(null);
  const [provisionForm, setProvisionForm] = useState({ name: '', email: '', password: '' });
  const [isProvisioning, setIsProvisioning] = useState(false);

  useEffect(() => {
    if (currentUser?.role === 'SaaS_Owner') {
        fetchData();
    }
  }, [currentUser]);

  const handleProvisionUser = async () => {
    if (!selectedBizForUser) return;
    setIsProvisioning(true);
    try {
        const res = await provisionBusinessUser({
            ...provisionForm,
            businessId: selectedBizForUser
        });
        if (res.success) {
            alert('Kullanıcı başarıyla oluşturuldu ve işletmeye bağlandı.');
            setIsProvisionModalOpen(false);
            setProvisionForm({ name: '', email: '', password: '' });
        } else {
            alert('Hata: ' + res.error);
        }
    } catch (e) {
        alert('İşlem başarısız oldu.');
    } finally {
        setIsProvisioning(false);
    }
  };

  const router = useRouter();

  // Guard
  if (currentUser?.role !== 'SaaS_Owner') {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-gray-900 p-8 space-y-8 text-center">
             <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 shadow-2xl shadow-red-100 border border-red-100">
                 <ShieldAlert size={48} />
             </motion.div>
             <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight uppercase italic text-gray-900">ERİŞİM ENGELLENDİ</h1>
                <p className="text-gray-500 max-w-md font-bold text-xs uppercase tracking-[0.2em] leading-relaxed">
                    Bu konsola sadece global sistem distribütörü erişebilir.
                </p>
             </div>
             <button onClick={() => router.push('/')} className="px-10 py-4 bg-white text-black font-black rounded-2xl text-xs hover:scale-105 transition-all shadow-xl">GÜVENLİ ALANA DÖN</button>
        </div>
    );
  }

  if (!isInitialized) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Platform Kernel Yükleniyor...</p>
          </div>
      );
  }

  const totalMRR = allBusinesses.reduce((sum, b) => sum + (b.overrideMrr || b.mrr || 0), 0);
  const totalPlatformCiro = allPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);

  const filteredBusinesses = allBusinesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.ownerName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab, label: string, icon: any }) => (
    <button 
        onClick={() => setActiveTab(id)}
        className={`
            flex items-center gap-3 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all
            ${activeTab === id ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/20' : 'bg-gray-50 text-gray-400 hover:bg-gray-100'}
        `}
    >
        <Icon size={16} />
        {label}
    </button>
  );

  return (
    <div className="min-h-full w-full animate-[fadeIn_0.5s_ease] font-sans pb-32">
        <div className="p-6 md:p-10">
            
            {/* SaaS Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 border-b border-gray-100 pb-10">
                <div>
                    <div className="flex items-center gap-4 mb-2">
                        <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-xl shadow-indigo-600/20"><Globe size={24} className="text-white" /></div>
                        <h1 className="text-4xl font-black tracking-tighter uppercase italic text-gray-900">Command Center</h1>
                    </div>
                    <p className="text-gray-400 font-bold text-[10px] uppercase tracking-widest flex items-center gap-2">
                        <ShieldCheck size={14} className="text-emerald-500" /> Versiyon 3.5.0 SaaS Distribution
                    </p>
                </div>
                
                <div className="flex items-center gap-4">
                    <button 
                        onClick={() => fetchData(undefined, undefined, true)}
                        className="p-4 bg-gray-50 border border-gray-100 rounded-2xl text-gray-400 hover:text-indigo-600 transition-all"
                        title="Yenile"
                    >
                        <Activity size={20} className={syncStatus === 'syncing' ? 'animate-spin' : ''}/>
                    </button>
                    <button 
                        onClick={() => setIsAddBizModalOpen(true)}
                        className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 shadow-xl shadow-indigo-600/20 flex items-center gap-2"
                    >
                        <Plus size={16} /> Yeni Tenant Dağıtımı
                    </button>
                </div>
            </div>

            {/* Global Tabs */}
            <div className="flex flex-wrap gap-3 mb-12">
                <TabButton id="monitor" label="Monitör" icon={TrendingUp} />
                <TabButton id="tenants" label="İşletmeler" icon={Building2} />
                <TabButton id="announcements" label="Duyurular" icon={Megaphone} />
                <TabButton id="pricing" label="Paket & Fiyat" icon={CreditCard} />
                <TabButton id="terminal" label="Kernel Logs" icon={TerminalIcon} />
            </div>

            <AnimatePresence mode="wait">
                {activeTab === 'monitor' && (
                    <motion.div key="monitor" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                            {[
                                { label: 'TOPLAM PLATFORM HACMİ', val: `₺${totalPlatformCiro.toLocaleString('tr-TR')}`, icon: TrendingUp, color: 'text-gray-900' },
                                { label: 'AYLIK GELİR (MRR)', val: `₺${totalMRR.toLocaleString('tr-TR')}`, icon: CreditCard, color: 'text-indigo-600' },
                                { label: 'AKTİF TENANT SAYISI', val: allBusinesses.length, icon: Building2, color: 'text-gray-900' },
                                { label: 'ORTALAMA ARPU', val: `₺${(totalMRR / (allBusinesses.length || 1)).toFixed(0)}`, icon: Activity, color: 'text-emerald-600' }
                            ].map((stat, i) => (
                                <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-8 shadow-sm group hover:shadow-xl hover:shadow-indigo-100/50 transition-all">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-indigo-600 transition-colors">
                                            <stat.icon size={20} />
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                                    <div className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.val}</div>
                                </div>
                            ))}
                        </div>

                        <div className="bg-indigo-600 rounded-[3rem] p-12 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/30">
                            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 blur-[100px] rounded-full -mr-20 -mt-20" />
                            <div className="relative z-10">
                                <h2 className="text-4xl font-black tracking-tighter uppercase italic mb-4">Sistem Durumu: Nominal</h2>
                                <p className="text-indigo-100 max-w-xl font-medium leading-relaxed opacity-80 uppercase text-[11px] tracking-widest">
                                    Tüm kernel servisleri aktif. Supabase bağlantısı stabil. Veri senkronizasyonu milisaniye hassasiyetinde devam ediyor.
                                </p>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'tenants' && (
                    <motion.div key="tenants" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="bg-white border border-gray-100 rounded-[3rem] overflow-hidden shadow-sm">
                            <div className="p-10 border-b border-gray-50 flex justify-between items-center bg-gray-50/30">
                                <div className="relative w-96">
                                    <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input 
                                        placeholder="Tenant ara..." 
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                        className="w-full bg-white border border-gray-100 rounded-2xl px-14 py-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all"
                                    />
                                </div>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left">
                                    <thead className="bg-gray-50/50 text-[10px] font-black uppercase text-gray-400 tracking-widest border-b border-gray-100">
                                        <tr>
                                            <th className="px-10 py-8">İşletme</th>
                                            <th className="px-10 py-8">Abonelik & Fiyat</th>
                                            <th className="px-10 py-8 text-center">Modüller</th>
                                            <th className="px-10 py-8 text-center">Limitler</th>
                                            <th className="px-10 py-8 text-right">Aksiyonlar</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filteredBusinesses.map(b => (
                                            <tr key={b.id} className="hover:bg-gray-50/30 transition-colors">
                                                <td className="px-10 py-8">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 font-black">{b.name.charAt(0)}</div>
                                                        <div>
                                                            <p className="font-black text-gray-900 uppercase italic leading-tight">{b.name}</p>
                                                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{b.ownerName}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8">
                                                    <div className="flex flex-col gap-2">
                                                        <span className="text-xs font-black text-gray-900 uppercase">₺{(b.overrideMrr || b.mrr || 0).toLocaleString('tr-TR')} / Ay</span>
                                                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-full w-fit uppercase ${b.plan === 'Premium' ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-500'}`}>{b.plan} Plan</span>
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                    <div className="flex justify-center gap-2">
                                                        {['marketing', 'inventory', 'quotes'].map(modName => {
                                                            const isEnabled = tenantModules.find(tm => tm.businessId === b.id && tm.moduleName === modName)?.isEnabled;
                                                            return (
                                                                <button 
                                                                    key={modName}
                                                                    onClick={() => updateModuleStatus(b.id, modName as any, !isEnabled)}
                                                                    className={`px-3 py-1 text-[9px] font-black rounded-lg uppercase transition-all border ${
                                                                        isEnabled ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-gray-50 text-gray-300 border-gray-100'
                                                                    }`}
                                                                >
                                                                    {modName}
                                                                </button>
                                                            );
                                                        })}
                                                    </div>
                                                </td>
                                                <td className="px-10 py-8 text-center">
                                                     <div className="flex flex-col gap-2 items-center">
                                                         <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                                                            <button onClick={() => updateBusinessLicense(b.id, Math.max(1, (b.maxUsers || 5) - 1))} className="p-1 hover:text-indigo-600 transition-colors"><Minus size={12}/></button>
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-900 min-w-[60px] justify-center">
                                                                <Users size={12} className="text-gray-400" /> {b.maxUsers || 5}
                                                            </div>
                                                            <button onClick={() => updateBusinessLicense(b.id, (b.maxUsers || 5) + 1)} className="p-1 hover:text-indigo-600 transition-colors"><Plus size={12}/></button>
                                                         </div>
                                                         
                                                         <div className="flex items-center gap-3 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xl">
                                                            <button onClick={() => updateBusinessBranches(b.id, Math.max(1, (b.maxBranches || 1) - 1))} className="p-1 hover:text-indigo-600 transition-colors"><Minus size={12}/></button>
                                                            <div className="flex items-center gap-2 text-[10px] font-black text-gray-900 min-w-[60px] justify-center">
                                                                <Building2 size={12} className="text-gray-400" /> {b.maxBranches || 1}
                                                            </div>
                                                            <button onClick={() => updateBusinessBranches(b.id, (b.maxBranches || 1) + 1)} className="p-1 hover:text-indigo-600 transition-colors"><Plus size={12}/></button>
                                                         </div>
                                                     </div>
                                                </td>
                                                <td className="px-10 py-8 text-right">
                                                    <div className="flex justify-end gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setSelectedBizForUser(b.id);
                                                                setProvisionForm({ ...provisionForm, name: b.ownerName || '' });
                                                                setIsProvisionModalOpen(true);
                                                            }}
                                                            className="p-3 bg-emerald-50 text-emerald-600 rounded-xl hover:bg-emerald-600 hover:text-white transition-all"
                                                            title="Kullanıcı Tanımla / Şifre Ver"
                                                        >
                                                            <UserPlus size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setImpersonatedBusinessId(b.id)}
                                                            className="p-3 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all"
                                                            title="İşletmeye Giriş Yap"
                                                        >
                                                            <LogIn size={16} />
                                                        </button>
                                                        <button 
                                                            onClick={() => { if(confirm('Silmek istediğine emin misin?')) deleteBusiness(b.id); }}
                                                            className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'announcements' && (
                    <motion.div key="announcements" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            <div className="bg-white border border-gray-100 rounded-[3rem] p-10 shadow-sm">
                                <h3 className="text-2xl font-black tracking-tighter uppercase italic text-gray-900 mb-8 flex items-center gap-3">
                                    <Megaphone className="text-indigo-600" /> Duyuru Yayınla
                                </h3>
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Başlık</label>
                                        <input 
                                            value={announcementForm.title}
                                            onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-indigo-500" 
                                            placeholder="Yeni Özellik: AI Raporlama" 
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Mesaj İçeriği</label>
                                        <textarea 
                                            value={announcementForm.content}
                                            onChange={e => setAnnouncementForm({...announcementForm, content: e.target.value})}
                                            className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 text-xs font-bold outline-none focus:border-indigo-500 h-32" 
                                            placeholder="Tüm kullanıcılarımız artık yeni raporlama modülünü kullanabilir..." 
                                        />
                                    </div>
                                    <button 
                                        disabled={isPublishing || !announcementForm.title}
                                        onClick={async () => {
                                            setIsPublishing(true);
                                            await addAnnouncement({ ...announcementForm, isActive: true });
                                            setAnnouncementForm({ title: '', content: '', type: 'info' });
                                            setIsPublishing(false);
                                        }}
                                        className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50"
                                    >
                                        {isPublishing ? 'YAYINLANIYOR...' : 'SİSTEM GENELİNDE YAYINLA'}
                                    </button>
                                </div>
                            </div>
                            
                            <div className="space-y-4">
                                <h3 className="text-xl font-black text-gray-400 uppercase tracking-widest mb-6">Aktif Duyurular</h3>
                                {allNotifs.slice(0, 5).map((n: any, i) => (
                                    <div key={i} className="bg-white border border-gray-100 rounded-[2rem] p-6 shadow-sm flex justify-between items-center group">
                                        <div className="flex gap-4 items-center">
                                            <div className="p-3 bg-amber-50 text-amber-500 rounded-xl"><Megaphone size={18}/></div>
                                            <div>
                                                <p className="font-black text-gray-900 uppercase italic leading-tight">{n.title || 'Sistemsel Güncelleme'}</p>
                                                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">{new Date().toLocaleDateString('tr-TR')}</p>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}

                {activeTab === 'pricing' && (
                    <motion.div key="pricing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                        <div className="max-w-4xl mx-auto space-y-8 text-center text-gray-400 font-black uppercase tracking-[0.2em]">
                             Abonelik sistemleri için Stripe entegrasyonu bekleniyor...
                        </div>
                    </motion.div>
                )}

                {activeTab === 'terminal' && (
                    <motion.div key="terminal" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                         <div id="logs" className="bg-[#050505] rounded-[3rem] p-10 shadow-2xl shadow-black/50 border border-white/5 scroll-mt-24 min-h-[600px] flex flex-col">
                            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-8">
                                <h3 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-4 text-white">
                                    <TerminalIcon className="text-indigo-500" /> Platform Kernel Logs
                                </h3>
                            </div>
                            
                            <div className="flex-1 font-mono text-[11px] space-y-2 overflow-y-auto custom-scrollbar pr-4 text-white/50">
                                {allLogs.slice(-50).reverse().map((log: AuditLog, i: number) => (
                                    <div key={i} className="flex gap-4 border-b border-white/5 pb-1">
                                        <span className="opacity-30">[{new Date(log.date).toLocaleTimeString()}]</span>
                                        <span className="text-indigo-400">{log.action}</span>
                                        <span>{log.customerName}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

        </div>

        {/* MODALS */}
        <AnimatePresence>
            {isProvisionModalOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-[3rem] p-12 max-w-xl w-full shadow-2xl relative"
                    >
                        <button onClick={() => setIsProvisionModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"><X size={24}/></button>
                        
                        <div className="mb-10">
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic">Kullanıcı Kurulumu</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">İşletme sahibi için giriş yetkisi tanımla</p>
                        </div>
                        
                        <div className="space-y-6 mb-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Kullanıcı Adı / Ad Soyad</label>
                                <input 
                                    value={provisionForm.name}
                                    onChange={e => setProvisionForm({...provisionForm, name: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-xs outline-none focus:border-indigo-500" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Email (Giriş Adresi)</label>
                                <input 
                                    value={provisionForm.email}
                                    onChange={e => setProvisionForm({...provisionForm, email: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-xs outline-none focus:border-indigo-500" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Geçici Şifre</label>
                                <input 
                                    type="password"
                                    value={provisionForm.password}
                                    onChange={e => setProvisionForm({...provisionForm, password: e.target.value})}
                                    placeholder="Belirlemek istediğiniz şifre"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-xs outline-none focus:border-indigo-500" 
                                />
                            </div>
                        </div>
                        
                        <button 
                            onClick={handleProvisionUser}
                            disabled={isProvisioning || !provisionForm.email || !provisionForm.password}
                            className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all disabled:opacity-50"
                        >
                            {isProvisioning ? 'KURULUM YAPILIYOR...' : 'YETKİLERİ ONAYLA VE OLUŞTUR'}
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>

        <AnimatePresence>
            {isAddBizModalOpen && (
                <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/60 backdrop-blur-xl">
                    <motion.div 
                        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                        className="bg-white rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl relative"
                    >
                        <button onClick={() => setIsAddBizModalOpen(false)} className="absolute top-8 right-8 text-gray-400 hover:text-gray-900"><X size={24}/></button>
                        
                        <div className="mb-10">
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic">Yeni Lisans Dağıtımı</h3>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-2">Yeni bir tenant altyapısı oluştur</p>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-6 mb-10">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Şirket Adı</label>
                                <input 
                                    value={newBiz.name}
                                    onChange={e => setNewBiz({...newBiz, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-')})}
                                    placeholder="Örn: Aura Beauty Spa"
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-xs outline-none focus:border-indigo-500" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px) font-black uppercase text-gray-400 ml-1">Panel Slug (URL)</label>
                                <input 
                                    value={newBiz.slug}
                                    onChange={e => setNewBiz({...newBiz, slug: e.target.value})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-xs" 
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Üyelik Planı</label>
                                <select 
                                    value={newBiz.plan}
                                    onChange={e => setNewBiz({...newBiz, plan: e.target.value as any})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-xs outline-none focus:border-indigo-500"
                                >
                                    <option value="Basic">Basic</option>
                                    <option value="Pro">Pro</option>
                                    <option value="Premium">Premium</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-gray-400 ml-1">Kullanıcı Limiti</label>
                                <input 
                                    type="number"
                                    value={newBiz.maxUsers}
                                    onChange={e => setNewBiz({...newBiz, maxUsers: parseInt(e.target.value)})}
                                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-6 py-4 font-bold text-xs" 
                                />
                            </div>
                        </div>
                        <button 
                            onClick={async () => {
                                await addBusiness(newBiz);
                                setIsAddBizModalOpen(false);
                            }}
                            className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all"
                        >
                            LİSANSI ONAYLA VE DAĞIT
                        </button>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    </div>
  );
}
