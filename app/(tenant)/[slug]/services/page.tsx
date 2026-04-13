"use client";

import { useState } from 'react';
import { useStore, Service, PackageDefinition, Product } from '@/lib/store';
import { 
    Plus, Sparkles, Clock, Banknote, 
    Trash2, Edit3, Save, X, 
    Settings2, Zap, LayoutGrid, RefreshCcw, AlertCircle,
    Package as PackageIcon, ShoppingBag, Coffee, Star,
    ChevronRight, Search, Activity, Filter, Layers
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'hizmetler' | 'paketler' | 'urunler';

export default function ServicesPage() {
    const { 
        services, addService, updateService, removeService,
        packageDefinitions, addPackageDefinition, updatePackageDefinition, removePackageDefinition,
        inventory, updateProduct, can 
    } = useStore();

    const [activeTab, setActiveTab] = useState<TabType>('hizmetler');
    const [searchTerm, setSearchTerm] = useState('');
    const [isAdding, setIsAdding] = useState(false);
    
    // Price management permissions
    const canManagePrices = can('manage_prices') || can('Business_Owner');

    // Filtered data
    const filteredServices = services.filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredPackages = packageDefinitions.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    const filteredProducts = inventory.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

    // Grouping logic for Services
    const serviceGroups = Array.from(new Set(services.map(s => s.category || 'Genel')));
    const packageGroups = Array.from(new Set(packageDefinitions.map(p => p.groupName || 'Genel')));
    const productGroups = Array.from(new Set(inventory.map(p => p.category || 'Genel')));

    const [form, setForm] = useState<any>({ name: '', duration: 60, price: 0, category: 'Masaj Terapileri', totalSessions: 1 });

    const handleSave = () => {
        if (!form.name || form.price <= 0) return;
        
        if (activeTab === 'hizmetler') {
            addService({ name: form.name, duration: form.duration || 60, price: form.price, category: form.category || 'Genel' });
        } else if (activeTab === 'paketler') {
            addPackageDefinition({ name: form.name, groupName: form.category || 'Genel', totalSessions: form.totalSessions || 10, price: form.price, details: '' });
        }
        
        setForm({ name: '', duration: 60, price: 0, category: 'Masaj Terapileri', totalSessions: 1 });
        setIsAdding(false);
    };

    return (
        <div className="p-10 max-w-[1400px] mx-auto animate-[fadeIn_0.5s_ease]">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
                <div>
                    <div className="flex items-center gap-4 mb-3">
                        <div className="bg-indigo-600 p-3 rounded-2xl text-white shadow-lg shadow-indigo-100">
                            <Layers size={28} />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter text-gray-900 uppercase italic">Katalog Yönetimi</h1>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Aura Premium İşletme Envanteri ve Hizmetleri</p>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-3 w-full md:w-auto">
                    <div className="relative flex-1 md:w-64">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input 
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            placeholder="Katalogda ara..."
                            className="w-full bg-white border border-gray-100 rounded-2xl pl-11 pr-4 py-3 text-sm font-bold shadow-sm focus:ring-2 focus:ring-indigo-500/20 transition-all outline-none"
                        />
                    </div>
                    {canManagePrices && (
                        <button 
                            onClick={() => setIsAdding(true)}
                            className="bg-black text-white px-6 py-3 rounded-2xl font-black text-xs hover:scale-105 transition-all shadow-xl flex items-center gap-2 uppercase tracking-widest"
                        >
                            <Plus size={16} /> Yeni Ekle
                        </button>
                    )}
                </div>
            </div>

            {/* Premium Tabs */}
            <div className="flex gap-2 p-1.5 bg-gray-100/50 rounded-[2rem] w-fit mb-12">
                {[
                    { id: 'hizmetler', label: 'Hizmetler', icon: Zap },
                    { id: 'paketler', label: 'Paket Tanımları', icon: PackageIcon },
                    { id: 'urunler', label: 'Ürünler & İçecekler', icon: ShoppingBag },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-8 py-3.5 rounded-[1.5rem] font-black text-[10px] uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-indigo-600 shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <tab.icon className="w-4 h-4" /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Quick Add Form Section */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mb-12 overflow-hidden"
                    >
                        <div className="bg-white border-2 border-indigo-100 rounded-[3rem] p-10 shadow-2xl shadow-indigo-100/30">
                            <div className="flex items-center gap-3 mb-8">
                                <Activity className="w-6 h-6 text-indigo-500" />
                                <h3 className="text-xl font-black text-gray-900 uppercase italic">Yeni {activeTab === 'hizmetler' ? 'Hizmet' : 'Paket'} Tanımla</h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Tanım / Ad</label>
                                    <input 
                                        value={form.name}
                                        onChange={e => setForm({...form, name: e.target.value})}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        placeholder="Örn: Bali Masajı"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Grup / Kategori</label>
                                    <select 
                                        value={form.category}
                                        onChange={e => setForm({...form, category: e.target.value})}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none"
                                    >
                                        <option value="Masaj Terapileri">Masaj Terapileri</option>
                                        <option value="Türk Hamam Ritüelleri">Türk Hamam Ritüelleri</option>
                                        <option value="Tesis Kullanım Paketi">Tesis Kullanım Paketi</option>
                                        <option value="Salgı Ürünleri">Salgı Ürünleri</option>
                                        <option value="İçecekler">İçecekler</option>
                                    </select>
                                </div>
                                {activeTab === 'hizmetler' ? (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Süre (Dk)</label>
                                        <input 
                                            type="number"
                                            value={form.duration}
                                            onChange={e => setForm({...form, duration: Number(e.target.value)})}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                ) : (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Seans Sayısı</label>
                                        <input 
                                            type="number"
                                            value={form.totalSessions}
                                            onChange={e => setForm({...form, totalSessions: Number(e.target.value)})}
                                            className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                )}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fiyat (₺)</label>
                                    <input 
                                        type="number"
                                        value={form.price}
                                        onChange={e => setForm({...form, price: Number(e.target.value)})}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-4 font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/20"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 mt-10 pt-8 border-t border-gray-50">
                                <button onClick={() => setIsAdding(false)} className="px-8 py-3 font-black text-[10px] uppercase tracking-widest text-gray-400 hover:text-gray-600 transition-all">Vazgeç</button>
                                <button onClick={handleSave} className="bg-indigo-600 text-white px-10 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-100 transition-all">Tanımı Oluştur</button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List Section */}
            <div className="space-y-16">
                {(activeTab === 'hizmetler' ? serviceGroups : activeTab === 'paketler' ? packageGroups : productGroups).map(group => {
                    const items = activeTab === 'hizmetler' 
                        ? filteredServices.filter(s => (s.category || 'Genel') === group)
                        : activeTab === 'paketler'
                        ? filteredPackages.filter(p => (p.groupName || 'Genel') === group)
                        : filteredProducts.filter(p => (p.category || 'Genel') === group);

                    if (items.length === 0) return null;

                    return (
                        <div key={group} className="animate-[slideUp_0.4s_ease]">
                            <div className="flex items-center gap-4 mb-8">
                                <h2 className="text-2xl font-black tracking-tight uppercase italic text-gray-900">{group}</h2>
                                <div className="h-px flex-1 bg-gradient-to-r from-gray-200 to-transparent" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{items.length} Öğe</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {items.map((item: any) => (
                                    <div key={item.id} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group overflow-hidden relative">
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="w-12 h-12 bg-gray-50 group-hover:bg-indigo-600 rounded-2xl flex items-center justify-center transition-all group-hover:text-white">
                                                {activeTab === 'hizmetler' ? <Clock className="w-6 h-6" /> : activeTab === 'paketler' ? <PackageIcon className="w-6 h-6" /> : <ShoppingBag className="w-6 h-6" />}
                                            </div>
                                            <div className="flex gap-1">
                                                {canManagePrices && (
                                                    <button onClick={() => {}} className="p-2 text-gray-300 hover:text-indigo-600 transition-all"><Edit3 size={18} /></button>
                                                )}
                                                {canManagePrices && (
                                                    <button 
                                                        onClick={() => activeTab === 'hizmetler' ? removeService(item.id) : activeTab === 'paketler' ? removePackageDefinition(item.id) : null} 
                                                        className="p-2 text-gray-300 hover:text-red-500 transition-all"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black text-gray-900 mb-2 uppercase tracking-tight">{item.name}</h3>
                                        
                                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-8">
                                            {activeTab === 'hizmetler' && (
                                                <div className="flex items-center gap-1.5"><Clock size={12} className="text-indigo-400" /> {item.duration} Dakika</div>
                                            )}
                                            {activeTab === 'paketler' && (
                                                <div className="flex items-center gap-1.5"><Layers size={12} className="text-indigo-400" /> {item.totalSessions} Seans</div>
                                            )}
                                            {activeTab === 'urunler' && (
                                                <div className="flex items-center gap-1.5"><Activity size={12} className="text-green-400" /> {item.stock || 0} Stok</div>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-end pt-6 border-t border-gray-50">
                                            <div>
                                                <p className="text-[8px] font-black text-gray-300 uppercase tracking-widest mb-1.5">Satış Fiyatı</p>
                                                <p className="text-3xl font-black text-gray-900 tracking-tighter italic lg:text-3xl xl:text-4xl">₺{item.price.toLocaleString('tr-TR')}</p>
                                            </div>
                                            {activeTab === 'hizmetler' && (
                                                <div className="px-4 py-1.5 bg-indigo-50 rounded-full text-[8px] font-black text-indigo-600 uppercase tracking-widest">Premium</div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredServices.length === 0 && filteredPackages.length === 0 && filteredProducts.length === 0 && (
                <div className="py-32 bg-gray-50/50 border-2 border-dashed border-gray-100 rounded-[4rem] text-center">
                    <LayoutGrid className="w-16 h-16 text-gray-200 mx-auto mb-6" />
                    <h3 className="text-xl font-black text-gray-300 uppercase italic tracking-tighter">İçerik Bulunamadı</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-2">Arama kriterlerinizi değiştirin veya yeni bir öğe ekleyin</p>
                </div>
            )}
        </div>
    );
}
