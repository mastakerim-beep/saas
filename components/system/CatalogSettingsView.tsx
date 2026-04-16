"use client";

import { useState } from 'react';
import { useStore, Service, PackageDefinition } from '@/lib/store';
import { 
    Plus, Clock, Package as PackageIcon, ShoppingBag, 
    Trash2, Edit3, Search, Zap, Activity, Layers, Filter, ChevronRight,
    Sparkles, Star, X
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

type TabType = 'hizmetler' | 'paketler' | 'urunler';

export default function CatalogSettingsView({ query }: { query: string }) {
    const { 
        services, addService, updateService, removeService,
        packageDefinitions, addPackageDefinition, updatePackageDefinition, removePackageDefinition,
        inventory, addProduct, updateProduct, removeProduct, can 
    } = useStore();

    const [activeTab, setActiveTab] = useState<TabType>('hizmetler');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [isAdding, setIsAdding] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [showNewCatInput, setShowNewCatInput] = useState(false);
    
    // price management permissions
    const canManagePrices = can('manage_prices') || true;

    // Filtered data based on external query + internal tab
    const filteredServices = services.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));
    const filteredPackages = packageDefinitions.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));
    const filteredProducts = inventory.filter(p => p.name.toLowerCase().includes(query.toLowerCase()));

    const serviceGroups = Array.from(new Set(services.map(s => s.category || 'Genel')));
    const packageGroups = Array.from(new Set(packageDefinitions.map(p => p.groupName || 'Genel')));
    const productGroups = Array.from(new Set(inventory.map(p => p.category || 'Genel')));

    const currentGroups = activeTab === 'hizmetler' ? serviceGroups : activeTab === 'paketler' ? packageGroups : productGroups;

    const [form, setForm] = useState<any>({ name: '', duration: 60, price: 0, category: 'Masaj Terapileri', totalSessions: 1 });

    const openPanel = (item: any = null) => {
        if (item) {
            setForm({
                name: item.name,
                duration: item.duration || 60,
                price: item.price || 0,
                category: activeTab === 'paketler' ? (item.groupName || 'Genel') : (item.category || 'Genel'),
                totalSessions: item.totalSessions || 1
            });
            setEditingItem(item);
        } else {
            setForm({ name: '', duration: 60, price: 0, category: 'Masaj Terapileri', totalSessions: 1 });
            setEditingItem(null);
        }
        setIsAdding(true);
    };

    const handleSave = async () => {
        if (!form.name || form.price < 0) return;
        
        const finalCategory = showNewCatInput ? newCategoryName : form.category;
        
        if (activeTab === 'hizmetler') {
            const data = { name: form.name, duration: Number(form.duration), price: Number(form.price), category: finalCategory || 'Genel' };
            if (editingItem) await updateService(editingItem.id, data);
            else await addService(data);
        } else if (activeTab === 'paketler') {
            const data = { name: form.name, groupName: finalCategory || 'Genel', totalSessions: Number(form.totalSessions), price: Number(form.price), details: '' };
            if (editingItem) await updatePackageDefinition(editingItem.id, data);
            else await addPackageDefinition(data);
        } else if (activeTab === 'urunler') {
            const data = { name: form.name, category: finalCategory || 'Genel', price: Number(form.price), stock: Number(form.totalSessions) };
            if (editingItem) await updateProduct(editingItem.id, data);
            else await addProduct(data);
        }
        
        setIsAdding(false);
        setEditingItem(null);
        setShowNewCatInput(false);
        setNewCategoryName('');
    };

    const handleDelete = async (item: any) => {
        if (!window.confirm(`${item.name} silinecek. Emin misiniz?`)) return;
        if (activeTab === 'hizmetler') removeService(item.id);
        else if (activeTab === 'paketler') removePackageDefinition(item.id);
        else if (activeTab === 'urunler') removeProduct(item.id);
    };

    return (
        <div className="space-y-12 animate-[fadeIn_0.5s_ease]">
            {/* Premium Header Display */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 mb-12">
                <div className="flex items-center gap-6">
                    <div className="w-20 h-20 rounded-[2.2rem] bg-indigo-600 flex items-center justify-center text-white shadow-2xl shadow-indigo-200 relative overflow-hidden group">
                        <Layers size={36} className="relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <h1 className="text-4xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-2">KATALOG YÖNETİMİ</h1>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                             <Sparkles className="w-3 h-3" /> ROYAL SPA PREMİUM ENVANTER SİSTEMİ
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="relative group">
                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" size={18} />
                        <input 
                            placeholder="Katalogda ara..."
                            defaultValue={query}
                            className="pl-14 pr-8 py-5 bg-white border border-indigo-50 rounded-[2.5rem] text-sm font-bold w-72 focus:ring-8 focus:ring-indigo-500/5 focus:border-indigo-200 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={() => openPanel()}
                        className="bg-indigo-600 text-white px-10 py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-2xl shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        <Plus size={18} /> YENİ EKLE
                    </button>
                </div>
            </div>

            {/* Premium Tab Selection & Category Filter */}
            <div className="flex flex-col gap-6 mb-16">
                <div className="flex gap-2 p-2 bg-indigo-50/50 rounded-[2.5rem] w-fit">
                    {[
                        { id: 'hizmetler', label: 'HİZMETLER', icon: Zap },
                        { id: 'paketler', label: 'PAKETLER', icon: PackageIcon },
                        { id: 'urunler', label: 'ÜRÜNLER', icon: ShoppingBag },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => {
                                setActiveTab(tab.id as TabType);
                                setSelectedCategory(null);
                            }}
                            className={`flex items-center gap-3 px-10 py-4 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all ${
                                activeTab === tab.id 
                                ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-100/30' 
                                : 'text-indigo-400 hover:text-indigo-600'
                            }`}
                        >
                            <tab.icon size={16} /> {tab.label}
                        </button>
                    ))}
                </div>

                {/* Category Chips */}
                <div className="flex gap-3 overflow-x-auto no-scrollbar pb-2">
                    <button 
                        onClick={() => setSelectedCategory(null)}
                        className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${!selectedCategory ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-indigo-50 text-indigo-400 hover:border-indigo-200'}`}
                    >
                        TÜMÜ
                    </button>
                    {currentGroups.map(group => (
                        <button 
                            key={group}
                            onClick={() => setSelectedCategory(group)}
                            className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all whitespace-nowrap shadow-sm border ${selectedCategory === group ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-indigo-50 text-indigo-400 hover:border-indigo-200'}`}
                        >
                            {group}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence>
                {isAdding && (
                    <div className="fixed inset-0 z-[1000] flex justify-end">
                        <motion.div 
                            initial={{ opacity: 0 }} 
                            animate={{ opacity: 1 }} 
                            exit={{ opacity: 0 }}
                            onClick={() => setIsAdding(false)}
                            className="absolute inset-0 bg-indigo-950/40 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                            className="relative w-full max-w-xl bg-white h-full shadow-2xl flex flex-col pt-12"
                        >
                            <div className="px-12 pb-12 border-b border-gray-50">
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="p-4 bg-indigo-50 text-indigo-600 rounded-[1.5rem]">
                                            <Plus size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">
                                                {editingItem ? 'ÖĞE DÜZENLE' : 'YENİ TANIMLAMA'}
                                            </h3>
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
                                                {editingItem ? 'MEVCUT BİLGİLERİ GÜNCELLE' : 'KATALOGA YENİ ÖĞE EKLE'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsAdding(false)} className="p-4 bg-gray-50 rounded-2xl text-gray-400 hover:text-red-500 transition-colors">
                                        <X size={24} />
                                    </button>
                                </div>

                                <div className="space-y-8">
                                    <InputField label="HİZMET / ÜRÜN ADI" value={form.name} onChange={(v: string) => setForm({...form, name: v})} placeholder="Bali Masajı, Aloe Vera Paketi vb." />
                                    
                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-3">
                                            <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-1">KATEGORİ</label>
                                            <div className="relative">
                                                {!showNewCatInput ? (
                                                    <select 
                                                        className="w-full bg-indigo-50/50 border-2 border-transparent rounded-[1.5rem] px-6 py-5 font-bold text-gray-900 outline-none focus:border-indigo-100 transition-all appearance-none"
                                                        value={form.category}
                                                        onChange={e => {
                                                            if (e.target.value === 'ADD_NEW') setShowNewCatInput(true);
                                                            else setForm({...form, category: e.target.value});
                                                        }}
                                                    >
                                                        <option value="Masaj Terapileri">Masaj Terapileri</option>
                                                        <option value="Cilt Bakımı">Cilt Bakımı</option>
                                                        <option value="Hamam">Hamam Rituals</option>
                                                        <option value="El & Ayak">El & Ayak</option>
                                                        {currentGroups.filter(g => !['Masaj Terapileri', 'Cilt Bakımı', 'Hamam', 'El & Ayak'].includes(g)).map(g => (
                                                            <option key={g} value={g}>{g}</option>
                                                        ))}
                                                        <option value="ADD_NEW" className="text-indigo-600 font-black">+ YENİ KATEGORİ EKLE</option>
                                                    </select>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <input 
                                                            autoFocus
                                                            className="flex-1 bg-indigo-50/50 border-2 border-indigo-200 rounded-[1.5rem] px-6 py-5 font-bold text-gray-900 outline-none transition-all"
                                                            placeholder="Kategori Adı..."
                                                            value={newCategoryName}
                                                            onChange={e => setNewCategoryName(e.target.value)}
                                                        />
                                                        <button 
                                                            onClick={() => setShowNewCatInput(false)}
                                                            className="px-6 bg-gray-100 rounded-[1.5rem] text-[10px] font-black"
                                                        >
                                                            VAZGEÇ
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <InputField 
                                            label={activeTab === 'hizmetler' ? "SÜRE (DAKİKA)" : activeTab === 'paketler' ? "TOPLAM SEANS" : "MEVCUT STOK"} 
                                            value={activeTab === 'hizmetler' ? form.duration : form.totalSessions} 
                                            onChange={(v: string) => setForm({...form, [activeTab === 'hizmetler' ? 'duration' : 'totalSessions']: Number(v)})} 
                                            type="number"
                                        />
                                    </div>

                                    <div className="bg-indigo-600 rounded-[2.5rem] p-8 text-white shadow-xl shadow-indigo-100">
                                        <label className="text-[10px] font-black opacity-60 uppercase tracking-widest ml-1 block mb-3">SATIŞ FİYATI (TRY)</label>
                                        <input 
                                            type="number"
                                            value={form.price}
                                            onChange={e => setForm({...form, price: Number(e.target.value)})}
                                            className="bg-transparent border-none text-5xl font-black outline-none w-full tracking-tighter placeholder:text-white/20"
                                            placeholder="0,00"
                                        />
                                    </div>
                                </div>
                            </div>
                            
                            <div className="mt-auto px-12 py-12 bg-gray-50/50 flex flex-col gap-4">
                                <button onClick={handleSave} className="w-full py-6 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-2xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all">
                                    KATALOGA İŞLE ✓
                                </button>
                                <button onClick={() => setIsAdding(false)} className="w-full py-4 text-[11px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-600 transition-colors">
                                    VAZGEÇ VE KAPAT
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* List Sections */}
            <div className="space-y-24 pb-20">
                {(activeTab === 'hizmetler' ? serviceGroups : activeTab === 'paketler' ? packageGroups : productGroups)
                    .filter(group => !selectedCategory || group === selectedCategory)
                    .map(group => {
                    const items = activeTab === 'hizmetler' 
                        ? filteredServices.filter(s => (s.category || 'Genel') === group)
                        : activeTab === 'paketler'
                        ? filteredPackages.filter(p => (p.groupName || 'Genel') === group)
                        : filteredProducts.filter(p => (p.category || 'Genel') === group);

                    if (items.length === 0) return null;

                    return (
                        <div key={group} className="space-y-12 group/section">
                            <div className="flex items-center gap-6">
                                <h2 className="text-4xl font-black text-indigo-950 uppercase italic tracking-tighter shrink-0">{group}</h2>
                                <div className="h-0.5 w-full bg-gradient-to-r from-indigo-100 to-transparent flex-1" />
                                <div className="px-6 py-2 bg-white border border-indigo-50 rounded-full text-[10px] font-black text-indigo-400 uppercase tracking-widest whitespace-nowrap shadow-sm">
                                    {items.length} ÖĞE TANIMLI
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                                {items.map((item: any) => (
                                    <PremiumCard 
                                        key={item.id} 
                                        item={item} 
                                        activeTab={activeTab} 
                                        onEdit={() => openPanel(item)}
                                        onDelete={() => handleDelete(item)}
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

function PremiumCard({ item, activeTab, onEdit, onDelete }: any) {
    return (
        <div className="bg-white rounded-[3.5rem] p-10 shadow-sm border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 group overflow-hidden relative">
            <div className="flex justify-between items-start mb-8">
                <div className="w-16 h-16 bg-gray-50 group-hover:bg-gray-900 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 group-hover:text-white shadow-inner">
                    {activeTab === 'hizmetler' ? <Clock size={28} /> : activeTab === 'paketler' ? <PackageIcon size={28} /> : <ShoppingBag size={28} />}
                </div>
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                    <button onClick={onEdit} className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:bg-black hover:text-white transition-all"><Edit3 size={18} /></button>
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

            <div className="flex justify-between items-end pt-8 border-t border-gray-50 group-hover:border-indigo-100/50 transition-colors">
                <div>
                    <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest mb-1.5">SATIŞ FİYATI</p>
                    <p className="text-5xl font-black text-indigo-950 tracking-tighter italic">₺{item.price.toLocaleString('tr-TR')}</p>
                </div>
                {activeTab === 'hizmetler' && (
                    <div className="flex flex-col items-end gap-2">
                         <div className="px-6 py-2 bg-indigo-50 border border-indigo-100/50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] shadow-sm flex items-center gap-2">
                             <Star className="w-3 h-3 fill-indigo-600" /> %{Math.floor(Math.random() * 20) + 80} POPÜLERLİK
                         </div>
                    </div>
                )}
            </div>

            {/* Subtle Gradient decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[60px] rounded-full group-hover:bg-indigo-500/10 transition-all duration-500" />
        </div>
    );
}
