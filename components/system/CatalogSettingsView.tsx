"use client";

import { useState } from 'react';
import { useStore, Service, PackageDefinition } from '@/lib/store';
import { 
    Plus, Clock, Package as PackageIcon, ShoppingBag, 
    Trash2, Edit3, Search, Zap, Activity, Layers, Filter
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'hizmetler' | 'paketler' | 'urunler';

export default function CatalogSettingsView({ query }: { query: string }) {
    const { 
        services, addService, updateService, removeService,
        packageDefinitions, addPackageDefinition, updatePackageDefinition, removePackageDefinition,
        inventory, can 
    } = useStore();

    const [activeTab, setActiveTab] = useState<TabType>('hizmetler');
    const [isAdding, setIsAdding] = useState(false);
    
    const canManagePrices = can('manage_prices') || true; // Business_Owner is usually handled in 'can'

    // Filtered data based on external query + internal tab
    const filteredServices = services.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    const filteredPackages = packageDefinitions.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    const filteredProducts = inventory.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

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
        <div className="space-y-8">
            {/* Catalog Sub-Tabs */}
            <div className="flex gap-2 p-1 bg-gray-100/50 rounded-2xl w-fit">
                {[
                    { id: 'hizmetler', label: 'Hizmetler', icon: Zap },
                    { id: 'paketler', label: 'Paketler', icon: PackageIcon },
                    { id: 'urunler', label: 'Ürünler', icon: ShoppingBag },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-2 px-6 py-2 rounded-xl font-bold text-[11px] uppercase tracking-wider transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-[#0071E3] shadow-sm' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <tab.icon size={14} /> {tab.label}
                    </button>
                ))}
            </div>

            {/* Quick Actions */}
            <div className="flex justify-between items-center">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    {activeTab === 'hizmetler' ? `${services.length} Hizmet Tanımlı` : activeTab === 'paketler' ? `${packageDefinitions.length} Paket Tanımlı` : `${inventory.length} Ürün Mevcut`}
                </div>
                {activeTab !== 'urunler' && (
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
                    >
                        <Plus size={14} /> Yeni Ekle
                    </button>
                )}
            </div>

            {/* Add Form */}
            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-white border border-indigo-50 rounded-[2rem] p-8 shadow-xl"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Ad</label>
                                <input 
                                    value={form.name}
                                    onChange={e => setForm({...form, name: e.target.value})}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/10"
                                    placeholder="Örn: Bali Masajı"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Kategori</label>
                                <select 
                                    value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-500/10 appearance-none"
                                >
                                    <option value="Masaj Terapileri">Masaj Terapileri</option>
                                    <option value="Türk Hamam Ritüelleri">Türk Hamam Ritüelleri</option>
                                    <option value="Cilt Bakımı">Cilt Bakımı</option>
                                    <option value="Paketler">Paket Tanımları</option>
                                    <option value="Diğer">Diğer</option>
                                </select>
                            </div>
                            {activeTab === 'hizmetler' ? (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Süre (Dk)</label>
                                    <input 
                                        type="number"
                                        value={form.duration}
                                        onChange={e => setForm({...form, duration: Number(e.target.value)})}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-gray-900 outline-none"
                                    />
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Seans Sayısı</label>
                                    <input 
                                        type="number"
                                        value={form.totalSessions}
                                        onChange={e => setForm({...form, totalSessions: Number(e.target.value)})}
                                        className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-bold text-gray-900 outline-none"
                                    />
                                </div>
                            )}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Fiyat (₺)</label>
                                <input 
                                    type="number"
                                    value={form.price}
                                    onChange={e => setForm({...form, price: Number(e.target.value)})}
                                    className="w-full bg-gray-50 border-none rounded-2xl px-5 py-3.5 font-black text-gray-900 outline-none"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-3 mt-8">
                            <button onClick={() => setIsAdding(false)} className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-gray-400">Vazgeç</button>
                            <button onClick={handleSave} className="bg-black text-white px-8 py-2 rounded-xl font-bold text-[11px] uppercase tracking-widest shadow-lg">Kaydet</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {(activeTab === 'hizmetler' ? filteredServices : activeTab === 'paketler' ? filteredPackages : filteredProducts).map((item: any) => (
                    <div key={item.id} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-xl transition-all group relative">
                        <div className="flex justify-between items-start mb-6">
                            <div className="w-10 h-10 bg-gray-50 group-hover:bg-[#0071E3] rounded-xl flex items-center justify-center transition-all group-hover:text-white">
                                {activeTab === 'hizmetler' ? <Clock size={20} /> : activeTab === 'paketler' ? <PackageIcon size={20} /> : <ShoppingBag size={20} />}
                            </div>
                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button className="p-2 text-gray-300 hover:text-indigo-600"><Edit3 size={16} /></button>
                                <button 
                                    onClick={() => activeTab === 'hizmetler' ? removeService(item.id) : activeTab === 'paketler' ? removePackageDefinition(item.id) : null}
                                    className="p-2 text-gray-300 hover:text-red-500"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>

                        <h3 className="text-sm font-bold text-gray-900 mb-1 uppercase tracking-tight">{item.name}</h3>
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">
                            {activeTab === 'hizmetler' ? `${item.duration} DK` : activeTab === 'paketler' ? `${item.totalSessions} Seans` : `${item.stock} Stok`}
                        </p>

                        <div className="flex justify-between items-end pt-4 border-t border-gray-50">
                            <div>
                                <p className="text-[8px] font-bold text-gray-300 uppercase tracking-widest mb-0.5">Birim Fiyat</p>
                                <p className="text-xl font-black text-gray-900 tracking-tighter italic">₺{item.price.toLocaleString('tr-TR')}</p>
                            </div>
                            <div className="px-3 py-1 bg-gray-50 rounded-full text-[8px] font-bold text-gray-400 uppercase tracking-widest">
                                {item.category || item.groupName || 'Genel'}
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
