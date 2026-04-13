"use client";

import { useStore, Business, AuditLog } from "@/lib/store";
import { 
    Building2, CreditCard, ShieldCheck, 
    TrendingUp, Users, Search, 
    Filter, MoreVertical, Globe, 
    Lock, CheckCircle2, AlertTriangle, Plus, Minus,
    BarChart3, Activity, Zap, ShieldAlert, X,
    Calendar, Sparkles, LayoutGrid, Trash2,
    LogIn, Pause, Play, Terminal, UserPlus, LogOut
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
    currentUser, allBusinesses, allPayments, allLogs,
    updateBusinessLicense, updateBusinessStatus, updateBusinessBranches, deleteBusiness, addBusiness,
    setImpersonatedBusinessId, logout, fetchData, syncStatus, isInitialized
  } = useStore();

  useEffect(() => {
    if (currentUser?.role === 'SaaS_Owner') {
        fetchData();
    }
  }, [currentUser]);
  
  const router = useRouter();

  const [isAddBizModalOpen, setIsAddBizModalOpen] = useState(false);
  const [isProvisionModalOpen, setIsProvisionModalOpen] = useState(false);
  const [selectedBizForUser, setSelectedBizForUser] = useState<Business | null>(null);
  const [provisionData, setProvisionData] = useState({ email: '', password: '', name: '' });
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newBiz, setNewBiz] = useState({ name: '', slug: '', ownerName: '', plan: 'Basic' as Business['plan'], expiryDate: '', maxUsers: 5 });

  // 1. Authorization Guard
  if (currentUser?.role !== 'SaaS_Owner') {
    return (
        <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50 text-gray-900 p-8 space-y-8 text-center">
             <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 shadow-2xl shadow-red-100 border border-red-100">
                 <ShieldAlert size={48} />
             </motion.div>
             <div className="space-y-2">
                <h1 className="text-4xl font-black tracking-tight uppercase italic">ERİŞİM ENGELLENDİ</h1>
                <p className="text-gray-500 max-w-md font-bold text-xs uppercase tracking-[0.2em] leading-relaxed">
                    Bu konsola sadece global sistem distribütörü erişebilir. <br/> Yetkisiz giriş denemeleri loglanmaktadır.
                </p>
             </div>
             <button onClick={() => window.location.href = '/'} className="px-10 py-4 bg-white text-black font-black rounded-2xl text-xs hover:scale-105 transition-all shadow-xl">GÜVENLİ ALANA DÖN</button>
        </div>
    );
  }

  const [isAddingBiz, setIsAddingBiz] = useState(false);

  if (!isInitialized) {
      return (
          <div className="h-screen w-full flex flex-col items-center justify-center bg-gray-50">
              <div className="w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mb-4" />
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Platform Kernel Yükleniyor...</p>
          </div>
      );
  }

  const handleAddBusiness = async () => {
    if (!newBiz.name || !newBiz.ownerName) return;
    setIsAddingBiz(true);
    try {
        // Akıllı Slug Oluşturma: Çakışmaları önlemek için timestamp ekliyoruz (veya kullanıcıya uyarı verebiliriz)
        let slug = newBiz.slug || newBiz.name.toLowerCase().trim().replace(/ /g, '-').replace(/[^\w-]/g, '');
        
        // Eğer slug çok kısaysa veya boşsa fallback yap
        if (slug.length < 2) slug = `biz-${crypto.randomUUID().slice(0, 4)}`;

        const mrr = newBiz.plan === 'Premium' ? 2490 : newBiz.plan === 'Pro' ? 1490 : 490;
        
        // Expiry date management
        let expiry = newBiz.expiryDate;
        if (!expiry) {
            const d = new Date();
            d.setDate(d.getDate() + 30);
            expiry = d.toISOString().split('T')[0];
        }
        
        const result = await addBusiness({ 
            ...newBiz, 
            slug, // Burada ilk deneme yapılıyor, DB hatası catch bloğunda yakalanacak
            mrr,
            expiryDate: expiry
        });
        
        if (result) {
            setIsAddBizModalOpen(false);
            setSearchTerm('');
            setNewBiz({ name: '', slug: '', ownerName: '', plan: 'Basic', expiryDate: '', maxUsers: 5 });
        }
    } catch (error: any) {
        console.error("Hata detayları:", error);
        alert(`Lisans Dağıtım Hatası: ${error.message || 'Sistem yetkilendirme katmanında bir kısıtlama oluştu. Lütfen RLS ayarlarını kontrol edin.'}`);
    } finally {
        setIsAddingBiz(false);
    }
  };

  const handleImpersonate = (bizId: string) => {
    setImpersonatedBusinessId(bizId);
    router.push('/');
  };

  const { provisionBusinessUser } = useStore();
  
  const handleProvisionUser = async () => {
    if (!selectedBizForUser || !provisionData.email || !provisionData.password) return;
    setIsProvisioning(true);
    const result = await provisionBusinessUser({
        ...provisionData,
        businessId: selectedBizForUser.id
    });
    setIsProvisioning(false);
    if (result.success) {
        alert('Kullanıcı başarıyla oluşturuldu.');
        setIsProvisionModalOpen(false);
        setProvisionData({ email: '', password: '', name: '' });
    } else {
        alert('Hata: ' + result.error);
    }
  };

  const totalMRR = allBusinesses.reduce((sum, b) => sum + (b.mrr || 0), 0);
  const totalPlatformCiro = allPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  
  const filteredBusinesses = allBusinesses.filter(b => 
    b.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    b.ownerName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const revenueByPlan = useMemo(() => {
    const plans = { Basic: 0, Pro: 0, Premium: 0 };
    allBusinesses.forEach(b => {
        plans[b.plan] += b.mrr || 0;
    });
    return Object.entries(plans).map(([name, value]) => ({ name, value }));
  }, [allBusinesses]);

  const chartData = useMemo(() => {
    const daily: Record<string, number> = {};
    allPayments.forEach((p) => {
        const d = p.date;
        daily[d] = (daily[d] || 0) + p.totalAmount;
    });

    // Pad with last 14 days to ensure the chart isn't empty
    const result = [];
    for (let i = 13; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        result.push({
            date: dateStr,
            amount: daily[dateStr] || 0
        });
    }
    return result;
  }, [allPayments]);

  const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe'];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-10 w-full animate-[fadeIn_0.5s_ease] overflow-y-auto font-sans">
      <div className="max-w-[1700px] mx-auto pb-32">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-16 border-b border-gray-200 pb-10">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
            <div className="flex items-center gap-4 mb-3">
                <div className="bg-indigo-600 p-2.5 rounded-2xl shadow-xl shadow-indigo-600/20"><Globe size={24} className="text-white" /></div>
                <h1 className="text-4xl font-black tracking-tighter uppercase italic text-gray-900">Aura Global Command Center</h1>
            </div>
            <p className="text-gray-400 font-bold text-xs uppercase tracking-widest flex items-center gap-2">
                <Zap size={14} className="text-amber-500" /> Versiyon 3.4.2 Enterprise Distribution
            </p>
          </motion.div>
          <div className="flex gap-4 w-full md:w-auto items-center">
             <button 
                onClick={() => fetchData()}
                disabled={syncStatus === 'syncing'}
                className="hidden lg:flex px-8 py-4 bg-white border border-gray-200 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 transition-all items-center gap-2 group disabled:opacity-50"
             >
                <Activity size={16} className={syncStatus === 'syncing' ? 'animate-spin text-indigo-500' : 'text-emerald-500'}/> 
                {syncStatus === 'syncing' ? 'SENKRONİZE EDİLİYOR...' : 'SİSTEMİ TAZELE'}
             </button>
             <button 
                onClick={() => setIsAddBizModalOpen(true)}
                className="flex-1 md:flex-none px-8 py-4 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3"
             >
                <Plus size={16} /> Yeni Tenant Dağıtımı
             </button>
              <button 
                onClick={logout}
                className="p-4 bg-red-500/10 text-red-500 border border-red-500/20 rounded-2xl hover:bg-red-500 hover:text-white transition-all shadow-xl shadow-red-500/10"
                title="Güvenli Çıkış"
             >
                <LogOut size={20} />
             </button>
          </div>
        </div>

        {/* Global Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {[
            { label: 'TOPLAM PLATFORM HACMİ', val: `₺${totalPlatformCiro.toLocaleString('tr-TR')}`, icon: TrendingUp, color: 'text-gray-900', trend: '+12.5%' },
            { label: 'AYLIK TEKRARLAYAN GELİR (MRR)', val: `₺${totalMRR.toLocaleString('tr-TR')}`, icon: CreditCard, color: 'text-indigo-600', trend: '+8.2%' },
            { label: 'AKTİF TENANT SAYISI', val: allBusinesses.length, icon: Building2, color: 'text-gray-900', trend: '+2' },
            { label: 'ORTALAMA ARPU', val: `₺${(totalMRR / (allBusinesses.length || 1)).toFixed(0)}`, icon: Activity, color: 'text-emerald-600', trend: 'Stabil' }
          ].map((stat, i) => (
            <motion.div 
                initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}
                key={i} className="bg-white border border-gray-200/50 rounded-[2rem] p-8 relative overflow-hidden group hover:shadow-xl hover:shadow-gray-200/50 transition-all"
            >
                <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl text-gray-400 group-hover:text-indigo-600 transition-colors">
                        <stat.icon size={20} />
                    </div>
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-50 px-2 py-1 rounded-lg italic">{stat.trend}</span>
                </div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
                <div className={`text-3xl font-black tracking-tighter ${stat.color}`}>{stat.val}</div>
            </motion.div>
          ))}
        </div>

        {/* Main Analytics Section */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
            
            {/* Main Area Chart */}
            <div className="lg:col-span-2 bg-white border border-gray-200/50 rounded-[2.5rem] p-10 h-[500px] shadow-sm flex flex-col group">
                <div className="flex justify-between items-center mb-8">
                    <div>
                        <h3 className="text-2xl font-black tracking-tighter uppercase italic text-gray-900">Trafik & Nakit Akışı</h3>
                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Platform genelindeki 14 günlük hareketlilik</p>
                    </div>
                    <div className="flex gap-2">
                        <button className="px-4 py-2 bg-gray-50 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all">GÜNLÜK</button>
                        <button className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest">HAFTALIK</button>
                    </div>
                </div>
                <div className="flex-1">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={chartData}>
                            <defs>
                                <linearGradient id="colorCiro" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2}/>
                                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f1f1" vertical={false} />
                            <XAxis dataKey="date" stroke="#999" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tickFormatter={(str) => str.split('-').slice(2).join('/')} />
                            <YAxis stroke="#999" fontSize={10} fontWeight={900} tickLine={false} axisLine={false} tickFormatter={(val) => `₺${val/1000}k`} />
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '16px', fontSize: '10px', fontWeight: '900', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} itemStyle={{ color: '#000' }} />
                            <Area type="monotone" dataKey="amount" stroke="#6366f1" strokeWidth={4} fillOpacity={1} fill="url(#colorCiro)" />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* Revenue Distribution (PieChart) */}
            <div className="bg-white border border-gray-200/50 rounded-[2.5rem] p-10 flex flex-col shadow-sm">
                <h3 className="text-xl font-black tracking-tight uppercase italic mb-8 flex items-center gap-3 text-gray-900">
                    <BarChart3 className="text-indigo-500" /> Plan Dağılımı (MRR)
                </h3>
                <div className="flex-1 relative min-h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={revenueByPlan}
                                innerRadius={70}
                                outerRadius={100}
                                paddingAngle={8}
                                dataKey="value"
                            >
                                {revenueByPlan.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', fontSize: '10px', fontWeight: '900', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center flex-col pointer-events-none">
                        <span className="text-gray-400 text-[10px] font-black uppercase">Toplam MRR</span>
                        <span className="text-2xl font-black italic tabular-nums text-gray-900">₺{totalMRR / 1000}K</span>
                    </div>
                </div>
                <div className="space-y-4 mt-8">
                    {revenueByPlan.map((p, i) => (
                        <div key={i} className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest">
                            <div className="flex items-center gap-2">
                                <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                                <span className="text-gray-400">{p.name}</span>
                            </div>
                            <span className="text-gray-900">₺{p.value.toLocaleString('tr-TR')}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Business Management Table */}
        <div className="bg-white border border-gray-200/50 rounded-[3rem] overflow-hidden shadow-sm mb-12">
          <div className="p-10 border-b border-gray-100 flex flex-col lg:flex-row justify-between lg:items-center gap-6">
            <div>
                <h3 className="text-2xl font-black tracking-tighter uppercase italic text-gray-900">Global Müşteri Portföyü</h3>
                <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Sisteme kayıtlı tüm tenantların yönetimi</p>
            </div>
            <div className="flex items-center gap-4">
                <div className="relative flex-1 lg:w-96">
                  <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input 
                    placeholder="Şirket adı veya sahip ara..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-14 py-4 text-xs font-bold outline-none focus:border-indigo-500 transition-all text-gray-900" 
                  />
                </div>
                <button className="p-4 bg-gray-50 border border-gray-100 rounded-2xl hover:bg-gray-100 text-gray-400 transition-all">
                    <Filter size={20} />
                </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left min-w-[1100px]">
              <thead className="bg-gray-50 text-[10px] font-black uppercase text-gray-400 tracking-[0.2em]">
                <tr>
                  <th className="px-10 py-8">Tenant & Lead</th>
                  <th className="px-10 py-8">Abonelik Paketi</th>
                  <th className="px-10 py-8 text-center">Lisans / Kota</th>
                  <th className="px-10 py-8 text-center">Şube Limiti</th>
                  <th className="px-10 py-8">Durum & Vade</th>
                  <th className="px-10 py-8 text-right">Aksiyonlar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredBusinesses.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50/50 transition-colors group">
                    <td className="px-10 py-8">
                      <div className="flex items-center gap-6">
                        <div className="w-16 h-16 bg-gray-50 rounded-[1.8rem] flex items-center justify-center font-black text-gray-400 group-hover:text-white group-hover:bg-indigo-600 transition-all border border-gray-100 shadow-inner">
                            {b.name.charAt(0)}
                        </div>
                        <div>
                            <p className="font-black text-gray-900 text-lg leading-tight uppercase italic tracking-tight">{b.name}</p>
                            <p className="text-[10px] text-gray-400 font-black mt-1 uppercase tracking-widest">{b.ownerName}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-3">
                        <span className={`px-4 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-[0.12em] ${
                            b.plan === 'Premium' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 
                            b.plan === 'Pro' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 
                            'bg-gray-800 text-gray-400'
                        }`}>
                            {b.plan} EDITION
                        </span>
                        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest ml-1">₺{(b.mrr || 0).toLocaleString('tr-TR')} MRR</p>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                        <div className="inline-flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                            <button 
                                onClick={() => updateBusinessLicense(b.id, Math.max(1, b.maxUsers - 1))}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all"
                            >
                                <Minus size={14}/>
                            </button>
                            <span className="text-xl font-black w-8 tabular-nums text-gray-900">{b.maxUsers}</span>
                            <button 
                                onClick={() => updateBusinessLicense(b.id, b.maxUsers + 1)}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all"
                            >
                                <Plus size={14}/>
                            </button>
                        </div>
                    </td>
                    <td className="px-10 py-8 text-center">
                        <div className="inline-flex items-center gap-4 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                            <button 
                                onClick={() => updateBusinessBranches(b.id, Math.max(1, b.maxBranches - 1))}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all"
                            >
                                <Minus size={14}/>
                            </button>
                            <span className="text-xl font-black w-8 tabular-nums text-gray-900">{b.maxBranches}</span>
                            <button 
                                onClick={() => updateBusinessBranches(b.id, b.maxBranches + 1)}
                                className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-900 hover:bg-white rounded-xl transition-all"
                            >
                                <Plus size={14}/>
                            </button>
                        </div>
                    </td>
                    <td className="px-10 py-8">
                      <div className="space-y-3">
                        <span className={`flex items-center gap-2.5 font-black text-[10px] uppercase tracking-widest ${
                            b.status === 'Aktif' ? 'text-emerald-500' : 
                            b.status === 'Askıya Alındı' ? 'text-red-500' : 'text-amber-500'
                        }`}>
                          <div className={`w-2 h-2 rounded-full animate-pulse ${
                            b.status === 'Aktif' ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 
                            b.status === 'Askıya Alındı' ? 'bg-red-500' : 'bg-amber-500'
                          }`} />
                          {b.status}
                        </span>
                        <p className="text-[9px] text-gray-500 font-black uppercase tracking-[0.15em] ml-1">Vade: {b.expiryDate}</p>
                      </div>
                    </td>
                    <td className="px-10 py-8 text-right">
                       <div className="flex md:justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
                            <button 
                                onClick={() => handleImpersonate(b.id)}
                                title="İşletmeye Giriş Yap"
                                className="p-3.5 bg-indigo-600 text-white rounded-2xl hover:bg-indigo-500 transition-all shadow-lg shadow-indigo-600/10"
                            >
                                <LogIn size={18} />
                            </button>
                            <button 
                                onClick={() => { setSelectedBizForUser(b); setIsProvisionModalOpen(true); }}
                                title="İşletme Sahibi Oluştur"
                                className="p-3.5 bg-emerald-500/10 text-emerald-500 rounded-2xl hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10"
                            >
                                <UserPlus size={18} />
                            </button>
                            <button 
                                onClick={() => updateBusinessStatus(b.id, b.status === 'Aktif' ? 'Askıya Alındı' : 'Aktif')}
                                title={b.status === 'Aktif' ? "Lisansı Durdur" : "Lisansı Başlat"}
                                className="p-3.5 bg-gray-100 text-gray-400 hover:text-gray-900 hover:bg-gray-200 rounded-2xl transition-all"
                            >
                                {b.status === 'Aktif' ? <Pause size={18} /> : <Play size={18} />}
                            </button>
                            <button 
                                onClick={() => { if(confirm(`${b.name} tamamen silinecek. Emin misiniz?`)) deleteBusiness(b.id); }}
                                title="İşletmeyi Sil"
                                className="p-3.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-2xl transition-all"
                            >
                                <Trash2 size={18} />
                            </button>
                       </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit Log / System Terminal */}
        <div className="bg-white border border-gray-200/50 rounded-[3rem] p-10 shadow-sm">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h3 className="text-2xl font-black tracking-tighter uppercase italic flex items-center gap-4 text-gray-900">
                        <Terminal className="text-indigo-500" /> Platform Kernel Logs
                    </h3>
                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">Sistem genelindeki tüm atomik işlemlerin gerçek zamanlı dökümü</p>
                </div>
                <button className="px-6 py-3 bg-gray-50 border border-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-indigo-500 transition-all text-gray-400">TERMINALI TEMIZLE</button>
            </div>
            
            <div className="bg-gray-950 rounded-[2rem] p-8 font-mono text-xs border border-gray-800 max-h-[400px] overflow-y-auto custom-scrollbar">
                <div className="space-y-4">
                    {allLogs.slice(-20).reverse().map((log: AuditLog, i: number) => (
                        <div key={i} className="flex gap-6 group hover:bg-white/5 p-2 rounded-xl transition-all">
                             <span className="text-gray-700 whitespace-nowrap">[{log.date.split(' ')[1] || '00:00'}]</span>
                             <span className="text-indigo-500 whitespace-nowrap font-black uppercase tracking-tighter w-24">SYSTEM_ADMIN</span>
                             <span className="text-gray-400 flex-1 italic">{log.action}: <span className="text-white not-italic font-bold">{log.customerName}</span></span>
                             <span className="text-[10px] text-emerald-500 opacity-50 font-black tracking-widest">SUCCESS_OK</span>
                        </div>
                    ))}
                    {allLogs.length === 0 && <div className="text-gray-700 italic">Kayıt bekleniyor...</div>}
                </div>
            </div>
        </div>

      </div>

      {/* MODALS */}
      <AnimatePresence>
        {isAddBizModalOpen && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
                 <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
                    className="bg-white border border-gray-100 rounded-[3.5rem] p-14 max-w-2xl w-full shadow-2xl relative overflow-hidden"
                 >
                    <div className="absolute top-[-20%] right-[-20%] w-[60%] h-[60%] bg-indigo-600/10 blur-[100px] rounded-full" />
                    
                    <div className="flex justify-between items-center mb-12 relative z-10">
                        <div>
                            <h3 className="text-4xl font-black tracking-tighter uppercase italic text-gray-900">Lisans Dağıtımı</h3>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2 italic">Yeni bir işletme için kernel seviyesinde lisans tahsis et.</p>
                        </div>
                        <button onClick={() => setIsAddBizModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[1.2rem] transition-all"><X size={28}/></button>
                    </div>

                    <div className="space-y-8 relative z-10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Kiralayan Şirket Adı</label>
                                <input 
                                    type="text" placeholder="SPA XYZ Ltd. Şti." 
                                    value={newBiz.name} onChange={e => setNewBiz({...newBiz, name: e.target.value, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')})}
                                    className="w-full bg-black/50 border border-white/5 rounded-2xl px-8 py-5 font-bold text-sm outline-none focus:border-indigo-500 focus:bg-black transition-all text-white" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Alt Alan Adı (Subdomain)</label>
                                <div className="relative">
                                    <input 
                                        type="text" placeholder="aura-spa" 
                                        value={newBiz.slug} onChange={e => setNewBiz({...newBiz, slug: e.target.value.toLowerCase().replace(/ /g, '-').replace(/[^\w-]/g, '')})}
                                        className={`w-full bg-gray-50 border rounded-2xl px-8 py-5 font-bold text-sm outline-none transition-all text-gray-900 pr-24 ${
                                            allBusinesses.some(b => b.slug === newBiz.slug) ? 'border-amber-500/50 focus:border-amber-500' : 'border-gray-100 focus:border-indigo-500'
                                        }`} 
                                    />
                                    <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-gray-400">.auraspa.net</span>
                                </div>
                                {allBusinesses.some(b => b.slug === newBiz.slug) && (
                                    <p className="text-[9px] text-amber-500 font-black uppercase tracking-widest ml-1 animate-pulse flex items-center gap-1">
                                        <AlertTriangle size={10} /> Bu isim kullanımda, otomatik olarak (-1) eklenecek.
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">SaaS Tenant Lead (Sahibi)</label>
                                <input 
                                    type="text" placeholder="İshak Doğan" 
                                    value={newBiz.ownerName} onChange={e => setNewBiz({...newBiz, ownerName: e.target.value})}
                                    className="w-full bg-black/50 border border-white/5 rounded-2xl px-8 py-5 font-bold text-sm outline-none focus:border-indigo-500 focus:bg-black transition-all text-white" 
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Personel Kotası</label>
                                <input 
                                    type="number" value={newBiz.maxUsers} onChange={e => setNewBiz({...newBiz, maxUsers: parseInt(e.target.value)})}
                                    className="w-full bg-black/50 border border-white/5 rounded-2xl px-8 py-5 font-bold text-sm outline-none focus:border-indigo-500 focus:bg-black transition-all text-white" 
                                />
                            </div>
                        </div>

                        <div className="space-y-3">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-600 ml-1">Lisans Geçerlilik Süresi (Bitiş)</label>
                                <div className="relative">
                                    <input 
                                        type="date" value={newBiz.expiryDate} onChange={e => setNewBiz({...newBiz, expiryDate: e.target.value})}
                                        className="w-full bg-black/50 border border-white/5 rounded-2xl px-8 py-5 font-bold text-sm outline-none focus:border-indigo-500 focus:bg-black transition-all text-white appearance-none" 
                                    />
                                    <Calendar className="absolute right-6 top-1/2 -translate-y-1/2 text-gray-600 pointer-events-none" size={18} />
                                </div>
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4 relative z-10">
                        <button 
                            onClick={() => setIsAddBizModalOpen(false)}
                            className="flex-1 bg-gray-50 text-gray-400 py-6 rounded-3xl font-black text-xs uppercase tracking-widest hover:bg-gray-100 transition-all"
                        >
                            İptal
                        </button>
                        <button 
                            onClick={handleAddBusiness}
                            className="flex-[2] bg-indigo-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-600/20 hover:bg-indigo-500 transition-all flex items-center justify-center gap-4 group"
                        >
                            <ShieldCheck size={20} className="group-hover:scale-110 transition-transform" /> Platform Lisansını Aktifleştir
                        </button>
                    </div>
                 </motion.div>
            </div>
        )}
        {isProvisionModalOpen && (
            <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
                 <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }}
                    className="bg-white border border-gray-100 rounded-[3.5rem] p-14 max-w-xl w-full shadow-2xl relative overflow-hidden"
                 >
                    <div className="flex justify-between items-center mb-10 relative z-10">
                        <div>
                            <h3 className="text-3xl font-black tracking-tighter uppercase italic text-gray-900">Kullanıcı Tanımla</h3>
                            <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-2">{selectedBizForUser?.name} için Yönetici Hesabı</p>
                        </div>
                        <button onClick={() => setIsProvisionModalOpen(false)} className="w-12 h-12 flex items-center justify-center bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-[1.2rem] transition-all"><X size={28}/></button>
                    </div>

                    <div className="space-y-6 relative z-10">
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Tam Ad</label>
                            <input 
                                type="text" placeholder="Ad Soyad" 
                                value={provisionData.name} onChange={e => setProvisionData({...provisionData, name: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-8 py-5 font-bold text-sm outline-none focus:border-emerald-500 transition-all text-gray-900" 
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">E-Posta (Giriş ID)</label>
                            <input 
                                type="email" placeholder="example@mail.com" 
                                value={provisionData.email} onChange={e => setProvisionData({...provisionData, email: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-8 py-5 font-bold text-sm outline-none focus:border-emerald-500 transition-all text-gray-900" 
                            />
                        </div>
                        <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400">Geçici Şifre</label>
                            <input 
                                type="text" placeholder="••••••••" 
                                value={provisionData.password} onChange={e => setProvisionData({...provisionData, password: e.target.value})}
                                className="w-full bg-gray-50 border border-gray-100 rounded-2xl px-8 py-5 font-bold text-sm outline-none focus:border-emerald-500 transition-all text-gray-900" 
                            />
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4 relative z-10">
                        <button 
                            disabled={isProvisioning}
                            onClick={handleProvisionUser}
                            className="w-full bg-emerald-600 text-white py-6 rounded-3xl font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-emerald-600/20 hover:bg-emerald-500 disabled:opacity-50 transition-all flex items-center justify-center gap-4"
                        >
                            {isProvisioning ? 'OLUŞTURULUYOR...' : 'HESABI AKTİFLEŞTİR'}
                        </button>
                    </div>
                 </motion.div>
            </div>
        )}
      </AnimatePresence>
    </div>
  )
}
