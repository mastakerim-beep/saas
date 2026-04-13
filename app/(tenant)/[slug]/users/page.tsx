"use client";

import { useStore, AppUser, Branch } from '@/lib/store';
import { 
    ShieldCheck, UserCog, Users, 
    Lock, Unlock, ChevronRight, 
    Building2, Trash2, Edit3, 
    CheckCircle2, AlertCircle, Banknote, Crown, Sparkles,
    Plus, MapPin, Phone, Mail, ArrowRight,
    Search, LayoutGrid, Settings2, ShieldAlert, Calendar
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function UsersPage() {
    const { 
        currentUser, allUsers, branches, currentBusiness,
        updateStaffPermissions, addBranch, updateBranch, deleteBranch,
        can 
    } = useStore();

    const [selectedTab, setSelectedTab] = useState<'users' | 'branches' | 'permissions'>('users');
    const [searchQuery, setSearchQuery] = useState('');
    const [isAddBranchModalOpen, setIsAddBranchModalOpen] = useState(false);
    const [newBranchData, setNewBranchData] = useState({ name: '', address: '', phone: '' });

    // Filtered Data
    const filteredUsers = useMemo(() => {
        return allUsers.filter(u => 
            u.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            u.email.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [allUsers, searchQuery]);

    if (!can('manage_staff')) {
        return (
            <div className="h-[80vh] flex flex-col items-center justify-center text-center p-8 space-y-6">
                 <motion.div initial={{ scale: 0.8 }} animate={{ scale: 1 }} className="w-24 h-24 bg-red-50 rounded-[2rem] flex items-center justify-center text-red-500 shadow-xl shadow-red-100">
                     <ShieldAlert size={48} />
                 </motion.div>
                 <h1 className="text-3xl font-black text-gray-900 tracking-tight">YETKİSİZ ERİŞİM</h1>
                 <p className="text-gray-400 font-bold max-w-md uppercase text-[10px] tracking-widest leading-relaxed">
                     Bu sayfa sadece İşletme Sahibi ve Yönetici yetkisine sahip kullanıcılar içindir.
                 </p>
            </div>
        );
    }

    const handleAddBranch = () => {
        if (!newBranchData.name) return;
        addBranch(newBranchData);
        setNewBranchData({ name: '', address: '', phone: '' });
        setIsAddBranchModalOpen(false);
    };

    return (
        <div className="p-6 md:p-10 max-w-[1400px] mx-auto space-y-10 pb-32 font-sans">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter text-gray-900">Kurumsal Yönetim</h1>
                    <p className="text-gray-400 font-bold text-sm mt-2 uppercase tracking-widest flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-indigo-500" /> Şube Ağı ve Yetki Kontrol Merkezi
                    </p>
                </motion.div>

                <div className="flex gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            type="text" 
                            placeholder="Personel veya e-posta ara..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-11 pr-4 py-3.5 bg-white border border-gray-100 rounded-2xl text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all shadow-sm"
                        />
                    </div>
                    {selectedTab === 'branches' && (
                        <button 
                            disabled={branches.length >= (currentBusiness?.maxBranches || 1)}
                            onClick={() => setIsAddBranchModalOpen(true)}
                            className={`bg-black text-white px-6 py-3.5 rounded-2xl font-black text-sm flex items-center gap-3 transition shadow-xl ${branches.length >= (currentBusiness?.maxBranches || 1) ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-800'}`}
                        >
                            <Plus className="w-5 h-5"/> Şube Ekle
                        </button>
                    )}
                </div>
            </div>

            {/* Premium Tab Selection */}
            <div className="flex gap-2 p-1.5 bg-gray-100/50 backdrop-blur-md rounded-[2rem] w-fit border border-gray-200/50">
                {[
                    { id: 'users', label: 'Kullanıcılar', icon: Users },
                    { id: 'branches', label: 'Şubeler', icon: MapPin },
                    { id: 'permissions', label: 'Yetki Matrisi', icon: ShieldCheck }
                ].map((tab) => (
                    <button 
                        key={tab.id}
                        onClick={() => setSelectedTab(tab.id as any)}
                        className={`px-8 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest flex items-center gap-3 transition-all ${selectedTab === tab.id ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10' : 'text-gray-400 hover:text-gray-600'}`}
                    >
                        <tab.icon className={`w-4 h-4 ${selectedTab === tab.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                        {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence mode="wait">
                {selectedTab === 'users' && (
                    <motion.div 
                        key="users-tab" 
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                    >
                        {filteredUsers.map((user, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={user.id} 
                                className="bg-white border border-gray-100 p-8 rounded-[3rem] shadow-sm hover:shadow-2xl hover:border-indigo-100 transition-all group relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 p-8 opacity-0 group-hover:opacity-5 transition-opacity pointer-events-none">
                                    <UserCog size={120} />
                                </div>
                                <div className="flex items-center gap-5 mb-8">
                                    <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-2xl shadow-inner ${user.role === 'Business_Owner' ? 'bg-indigo-600 text-white shadow-indigo-100' : 'bg-gray-50 text-gray-900 border border-gray-100'}`}>
                                        {user.name.charAt(0)}
                                    </div>
                                    <div className="min-w-0">
                                        <h3 className="font-black text-gray-900 text-xl tracking-tight truncate leading-tight">{user.name}</h3>
                                        <p className="text-[10px] font-black uppercase text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded tracking-widest inline-block mt-1">{user.role}</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <Mail className="w-4 h-4" />
                                        <span className="text-xs font-bold truncate">{user.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3 text-gray-400">
                                        <Building2 className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase tracking-tight">
                                            {branches.find(b => b.id === user.branchId)?.name || 'Tüm Şubeler'}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8 pt-8 border-t border-gray-50 flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-gray-300">
                                    <span>Yetki Skor: {user.permissions.includes('all') ? 'Tam' : user.permissions.length}</span>
                                    <button className="text-indigo-600 flex items-center gap-1.5 hover:gap-2.5 transition-all">PROFİLİ YÖNET <ArrowRight size={14}/></button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {selectedTab === 'branches' && (
                    <motion.div 
                        key="branches-tab"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
                    >
                        <div className="col-span-full mb-4 flex justify-between items-center">
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Kayıtlı Şube Ağı</p>
                            <div className="flex items-center gap-3">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest bg-gray-100 px-4 py-1.5 rounded-full">
                                    Limit: {branches.length} / {currentBusiness?.maxBranches || 1}
                                </span>
                                {branches.length >= (currentBusiness?.maxBranches || 1) && (
                                    <span className="text-[9px] font-black text-rose-500 bg-rose-50 px-4 py-1.5 rounded-full border border-rose-100 animate-pulse">
                                        LİMİTE ULAŞILDI - EK ŞUBE İÇİN DESTEKLE GÖRÜŞÜN
                                    </span>
                                )}
                            </div>
                        </div>
                        {branches.map((branch, idx) => (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: idx * 0.05 }}
                                key={branch.id} 
                                className="bg-white border border-gray-100 p-8 rounded-[3rem] shadow-sm hover:shadow-2xl transition-all group"
                            >
                                <div className="w-14 h-14 bg-gray-50 text-gray-900 rounded-2xl flex items-center justify-center font-black mb-6 border border-gray-100 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                                    <MapPin size={24} />
                                </div>
                                <h3 className="text-xl font-black text-gray-900 tracking-tight mb-2 uppercase">{branch.name}</h3>
                                <p className="text-xs font-bold text-gray-400 leading-relaxed mb-8">{branch.address || branch.location || 'Adres tanımlanmamış'}</p>
                                
                                <div className="space-y-6">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kapasite</p>
                                        <p className="text-xl font-black text-gray-900">%{Math.floor(Math.random() * 40) + 60}</p>
                                    </div>
                                    <div className="w-full h-1.5 bg-gray-50 rounded-full overflow-hidden">
                                        <motion.div initial={{ width: 0 }} animate={{ width: '82%' }} className="h-full bg-emerald-500" />
                                    </div>
                                </div>

                                <div className="mt-8 flex gap-2">
                                    <button className="flex-1 bg-gray-50 text-gray-400 p-3 rounded-2xl hover:bg-gray-100 transition-colors flex items-center justify-center"><Edit3 size={18}/></button>
                                    <button onClick={() => deleteBranch(branch.id)} className="flex-1 bg-red-50 text-red-400 p-3 rounded-2xl hover:bg-red-500 hover:text-white transition-all flex items-center justify-center"><Trash2 size={18}/></button>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                )}

                {selectedTab === 'permissions' && (
                    <motion.div 
                        key="permissions-tab"
                        initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                        className="bg-white border border-gray-100 rounded-[3.5rem] shadow-sm overflow-hidden"
                    >
                        <div className="overflow-x-auto">
                            <table className="w-full text-left min-w-[1000px]">
                                <thead className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] bg-gray-50/50">
                                    <tr>
                                        <th className="px-10 py-8">Yetkili (Personel)</th>
                                        <th className="px-6 py-8 text-center">Randevu Yönetimi</th>
                                        <th className="px-6 py-8 text-center">Kasa & Finans</th>
                                        <th className="px-6 py-8 text-center">Müşteri Data</th>
                                        <th className="px-6 py-8 text-center">AI & Pazarlama</th>
                                        <th className="px-6 py-8 text-center">Sistem Ayar</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-50">
                                    {allUsers.filter(u => u.role !== 'Business_Owner').map(user => (
                                        <tr key={user.id} className="group hover:bg-[#F8F9FF] transition-colors">
                                            <td className="px-10 py-8">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-gray-50 rounded-[1rem] flex items-center justify-center font-black text-gray-900 border border-gray-100 shadow-sm">
                                                        {user.name.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <p className="font-black text-gray-900 text-base">{user.name}</p>
                                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{user.email}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {[
                                                { id: 'manage_appointments', label: 'Randevu', icon: Calendar },
                                                { id: 'view_executive_summary', label: 'Finans', icon: Banknote },
                                                { id: 'manage_customers', label: 'Müşteri', icon: Users },
                                                { id: 'view_marketing', label: 'Pazarlama', icon: Sparkles },
                                                { id: 'manage_staff', label: 'Sistem', icon: Settings2 },
                                            ].map(perm => {
                                                const has = user.permissions.includes(perm.id) || user.permissions.includes('all');
                                                return (
                                                    <td key={perm.id} className="px-6 py-8 text-center">
                                                        <button 
                                                            onClick={() => {
                                                                const newPerms = has 
                                                                    ? user.permissions.filter(p => p !== perm.id)
                                                                    : [...user.permissions, perm.id];
                                                                updateStaffPermissions(user.id, newPerms);
                                                            }}
                                                            className={`w-12 h-12 rounded-[1.2rem] transition-all flex items-center justify-center mx-auto ${has ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-50 text-gray-300 hover:text-gray-400'}`}
                                                        >
                                                            {has ? <Unlock size={20} /> : <Lock size={20} />}
                                                        </button>
                                                        <p className={`text-[8px] font-black mt-2 uppercase tracking-tighter ${has ? 'text-indigo-600' : 'text-gray-300'}`}>
                                                            {perm.label} {has ? 'AÇIK' : 'KAPALI'}
                                                        </p>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="p-8 bg-gray-50 border-t border-gray-50 flex items-center gap-4 italic">
                            <ShieldCheck className="w-5 h-5 text-indigo-500" />
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                Yetki değişiklikleri anlık olarak tüm cihazlarda senkronize edilir. Güvenlik protokolü gereği kritik yetki değişimleri denetim günlüğüne kaydedilir.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add Branch Modal (Action Sheet Style) */}
            <AnimatePresence>
                {isAddBranchModalOpen && (
                    <div className="fixed inset-0 z-[1000] flex items-center justify-center p-6 bg-black/40 backdrop-blur-md">
                        <motion.div 
                            initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
                            className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl space-y-8"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-2xl font-black text-gray-900 tracking-tight">Yeni Şube Tanımla</h3>
                                <button onClick={() => setIsAddBranchModalOpen(false)} className="p-2 hover:bg-gray-50 rounded-xl transition-colors"><Plus className="w-6 h-6 rotate-45 text-gray-400"/></button>
                            </div>

                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Şube Adı</label>
                                    <input 
                                        type="text" 
                                        placeholder="Örn: Nişantaşı Premium" 
                                        value={newBranchData.name} 
                                        onChange={e => setNewBranchData({...newBranchData, name: e.target.value})}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Adres Detayı</label>
                                    <textarea 
                                        rows={3}
                                        placeholder="Açık adres..." 
                                        value={newBranchData.address} 
                                        onChange={e => setNewBranchData({...newBranchData, address: e.target.value})}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-1">Şube Telefon</label>
                                    <input 
                                        type="tel" 
                                        placeholder="0212..." 
                                        value={newBranchData.phone} 
                                        onChange={e => setNewBranchData({...newBranchData, phone: e.target.value})}
                                        className="w-full px-6 py-4 bg-gray-50 border border-gray-100 rounded-2xl font-bold text-sm outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500"
                                    />
                                </div>
                            </div>

                            <button 
                                onClick={handleAddBranch}
                                className="w-full bg-black text-white py-5 rounded-[1.5rem] font-black text-sm shadow-xl hover:bg-gray-800 transition active:scale-95 flex items-center justify-center gap-3"
                            >
                                <CheckCircle2 size={20}/> Şubeyi Oluştur ve Aktif Et
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
