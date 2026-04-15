"use client";

import { useState } from 'react';
import { useStore, Service, PackageDefinition } from '@/lib/store';
import { 
    Plus, Clock, Package as PackageIcon, ShoppingBag, 
    Trash2, Edit3, Search, Zap, Activity, Layers, Filter, ChevronRight
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
    
    // price management permissions
    const canManagePrices = can('manage_prices') || true;

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
        <div className="space-y-12 animate-[fadeIn_0.5s_ease]">
            {/* Premium Header Display */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-16">
                <div className="flex items-center gap-6">
                    <div className="w-16 h-16 rounded-[1.5rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200">
                        <Layers size={32} />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-2">KATALOG YÖNETİMİ</h1>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.3em]">AURA PREMIUM İŞLETME ENVANTERİ VE HİZMETLERİ</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300" size={16} />
                        <input 
                            placeholder="Katalogda ara..."
                            defaultValue={query}
                            className="pl-12 pr-6 py-4 bg-white border border-gray-100 rounded-[1.5rem] text-sm font-bold w-64 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => setIsAdding(true)}
                        className="bg-black text-white px-8 py-4 rounded-[1.2rem] font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
                    >
                        <Plus size={16} /> YENİ EKLE
                    </button>
                </div>
            </div>

            {/* Premium Tab Selection */}
            <div className="flex gap-2 p-2 bg-gray-100/50 rounded-[2.5rem] w-fit mb-16">
                {[
                    { id: 'hizmetler', label: 'HİZMETLER', icon: Zap },
                    { id: 'paketler', label: 'PAKET TANIMLARI', icon: PackageIcon },
                    { id: 'urunler', label: 'ÜRÜNLER & İÇECEKLER', icon: ShoppingBag },
                ].map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TabType)}
                        className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${
                            activeTab === tab.id 
                            ? 'bg-white text-indigo-600 shadow-xl' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        <tab.icon size={16} /> {tab.label}
                    </button>
                ))}
            </div>

            <AnimatePresence>
                {isAdding && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="mb-16 bg-white border-2 border-indigo-50 rounded-[3rem] p-12 shadow-2xl"
                    >
                        <div className="flex items-center gap-4 mb-10">
                            <Activity className="text-indigo-600" size={24} />
                            <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Yeni Tanımlama Ekle</h3>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                            <InputField label="HİZMET ADI" value={form.name} onChange={(v: string) => setForm({...form, name: v})} placeholder="Bali Masajı vb." />
                            <div className="space-y-3">
                                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">KATEGORİ</label>
                                <select 
                                    className="w-full bg-gray-50 border-none rounded-[1.5rem] px-6 py-4 font-bold text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
                                    value={form.category}
                                    onChange={e => setForm({...form, category: e.target.value})}
                                >
                                    <option value="Masaj Terapileri">Masaj Terapileri</option>
                                    <option value="Cilt Bakımı">Cilt Bakımı</option>
                                    <option value="Hamam">Hamam Rituals</option>
                                </select>
                            </div>
                            <InputField 
                                label={activeTab === 'hizmetler' ? "SÜRE (DK)" : "SEANS"} 
                                value={activeTab === 'hizmetler' ? form.duration : form.totalSessions} 
                                onChange={(v: string) => setForm({...form, [activeTab === 'hizmetler' ? 'duration' : 'totalSessions']: Number(v)})} 
                                type="number"
                            />
                            <InputField label="FİYAT (₺)" value={form.price} onChange={(v: string) => setForm({...form, price: Number(v)})} type="number" />
                        </div>
                        <div className="flex justify-end gap-4 mt-12 pt-8 border-t border-gray-50">
                            <button onClick={() => setIsAdding(false)} className="px-8 py-3 text-xs font-black text-gray-400 uppercase tracking-widest">VAZGEÇ</button>
                            <button onClick={handleSave} className="bg-indigo-600 text-white px-12 py-3 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">KAYDET</button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* List Sections */}
            <div className="space-y-24 pb-20">
                {(activeTab === 'hizmetler' ? serviceGroups : activeTab === 'paketler' ? packageGroups : productGroups).map(group => {
                    const items = activeTab === 'hizmetler' 
                        ? filteredServices.filter(s => (s.category || 'Genel') === group)
                        : activeTab === 'paketler'
                        ? filteredPackages.filter(p => (p.groupName || 'Genel') === group)
                        : filteredProducts.filter(p => (p.category || 'Genel') === group);

                    if (items.length === 0) return null;

                    return (
                        <div key={group} className="space-y-10 group/section">
                            <div className="flex items-center gap-6">
                                <h2 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter shrink-0">{group}</h2>
                                <div className="h-px w-full bg-gradient-to-r from-gray-200 to-transparent flex-1" />
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest whitespace-nowrap">{items.length} ÖĞE</span>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {items.map((item: any) => (
                                    <PremiumCard 
                                        key={item.id} 
                                        item={item} 
                                        activeTab={activeTab} 
                                        onDelete={() => activeTab === 'hizmetler' ? removeService(item.id) : removePackageDefinition(item.id)}
                                    />
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

function InputField({ label, value, onChange, placeholder = "", type = "text" }: any) {
    return (
        <div className="space-y-3">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">{label}</label>
            <input 
                type={type}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder}
                className="w-full bg-gray-50 border-none rounded-[1.5rem] px-6 py-4 font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100"
            />
        </div>
    );
}

function PremiumCard({ item, activeTab, onDelete }: any) {
    return (
        <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 group overflow-hidden relative">
            <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-gray-50 group-hover:bg-gray-900 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 group-hover:text-white shadow-inner">
                    {activeTab === 'hizmetler' ? <Clock size={28} /> : activeTab === 'paketler' ? <PackageIcon size={28} /> : <ShoppingBag size={28} />}
                </div>
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:bg-black hover:text-white transition-all"><Edit3 size={18} /></button>
                    <button onClick={onDelete} className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-500 hover:text-white transition-all"><Trash2 size={18} /></button>
                </div>
            </div>

            <h3 className="text-2xl font-black text-gray-900 mb-2 uppercase tracking-tight line-clamp-1">{item.name}</h3>
            
            <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-12">
                {activeTab === 'hizmetler' && (
                    <div className="flex items-center gap-1.5 underline decoration-indigo-200 underline-offset-4 decoration-2">{item.duration} DAKİKA</div>
                )}
                {activeTab === 'paketler' && (
                    <div className="flex items-center gap-1.5 underline decoration-indigo-200 underline-offset-4 decoration-2">{item.totalSessions} SEANS</div>
                )}
                {activeTab === 'urunler' && (
                    <div className="flex items-center gap-1.5 underline decoration-green-200 underline-offset-4 decoration-2">{item.stock || 0} STOKTA</div>
                )}
            </div>

            <div className="flex justify-between items-end pt-8 border-t border-gray-50">
                <div>
                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1.5">SATIŞ fiyati</p>
                    <p className="text-4xl font-black text-gray-900 tracking-tighter italic">₺{item.price.toLocaleString('tr-TR')}</p>
                </div>
                {activeTab === 'hizmetler' && (
                    <div className="px-6 py-2 bg-indigo-50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-widest shadow-sm">PREMİUM</div>
                )}
            </div>

            {/* Subtle Gradient decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-500" />
        </div>
    );
}
