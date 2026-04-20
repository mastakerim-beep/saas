"use client";

import { useState } from 'react';
import { useStore, Service, PackageDefinition } from '@/lib/store';
import { 
    Plus, Clock, Package as PackageIcon, ShoppingBag, 
    Trash2, Edit3, Search, Zap, Activity, Layers, Filter, ChevronRight,
    Sparkles, Star, X, Users
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import PinGate from '@/components/security/PinGate';
import { seedCatalogData } from '@/lib/store/seed-data';

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

    const [showArchived, setShowArchived] = useState(false);

    // Filtered data based on external query + internal tab + archive status
    const filteredServices = services.filter(s => 
        (showArchived || s.isActive !== false) && 
        s.name.toLowerCase().includes(query.toLowerCase())
    );
    const filteredPackages = packageDefinitions.filter(p => 
        (showArchived || p.isActive !== false) &&
        p.name.toLowerCase().includes(query.toLowerCase())
    );
    const filteredProducts = inventory.filter(p => 
        p.name.toLowerCase().includes(query.toLowerCase())
    );

    const serviceGroups = Array.from(new Set(services.map(s => s.category || 'Genel')));
    const packageGroups = Array.from(new Set(packageDefinitions.map(p => p.groupName || 'Genel')));
    const productGroups = Array.from(new Set(inventory.map(p => p.category || 'Genel')));

    const currentGroups = activeTab === 'hizmetler' ? serviceGroups : activeTab === 'paketler' ? packageGroups : productGroups;

    const [form, setForm] = useState<any>({ name: '', duration: 60, price: 0, category: 'Masaj Terapileri', totalSessions: 1, requiredStaffCount: 1 });

    const openPanel = (item: any = null) => {
        setShowNewCatInput(false);
        setNewCategoryName('');
        
        if (item) {
            setForm({
                name: item.name || '',
                duration: item.duration || 60,
                price: item.price || 0,
                category: activeTab === 'paketler' ? (item.groupName || 'Genel') : (item.category || 'Genel'),
                totalSessions: item.totalSessions || 1,
                requiredStaffCount: item.requiredStaffCount || 1,
                consumables: Array.isArray(item.consumables) ? item.consumables : []
            });
            setEditingItem(item);
        } else {
            setForm({ 
                name: '', 
                duration: activeTab === 'hizmetler' ? 60 : 1, 
                price: 0, 
                category: currentGroups[0] || 'Genel', 
                totalSessions: 1,
                requiredStaffCount: 1,
                consumables: []
            });
            setEditingItem(null);
        }
        setIsAdding(true);
    };

    const handleSave = async () => {
        if (!form.name || form.price < 0) return;
        
        const finalCategory = showNewCatInput ? newCategoryName : form.category;
        const payload: any = {
            name: form.name,
            price: Number(form.price),
        };
        
        if (activeTab === 'hizmetler') {
            payload.duration = Number(form.duration);
            payload.category = finalCategory || 'Genel';
            payload.requiredStaffCount = Number(form.requiredStaffCount || 1);
            payload.consumables = form.consumables || [];
            
            if (editingItem) await updateService(editingItem.id, payload);
            else await addService(payload);
        } else if (activeTab === 'paketler') {
            payload.groupName = finalCategory || 'Genel';
            payload.totalSessions = Number(form.totalSessions);
            payload.details = '';
            
            if (editingItem) await updatePackageDefinition(editingItem.id, payload);
            else await addPackageDefinition(payload);
        } else if (activeTab === 'urunler') {
            payload.category = finalCategory || 'Genel';
            payload.stock = Number(form.totalSessions);
            
            if (editingItem) await updateProduct(editingItem.id, payload);
            else await addProduct(payload);
        }
        
        setIsAdding(false);
        setEditingItem(null);
        setShowNewCatInput(false);
        setNewCategoryName('');
    };

    const handleDelete = async (item: any) => {
        if (activeTab === 'hizmetler') {
            const ok = await removeService(item.id);
            if (!ok) {
                if (confirm('Bu hizmet geçmiş kayıtlarda kullanıldığı için tamamen silinemez. Arşivlemek ister misiniz? (Randevu listesinden kaldırılır)')) {
                    await updateService(item.id, { isActive: false });
                }
            }
        }
        else if (activeTab === 'paketler') {
            const ok = await removePackageDefinition(item.id);
            if (!ok) {
                if (confirm('Bu paket silinemez. Arşivlemek ister misiniz?')) {
                    await updatePackageDefinition(item.id, { isActive: false });
                }
            }
        }
        else if (activeTab === 'urunler') removeProduct(item.id);
    };

    const handleRestore = async (item: any) => {
        if (activeTab === 'hizmetler') await updateService(item.id, { isActive: true });
        else if (activeTab === 'paketler') await updatePackageDefinition(item.id, { isActive: true });
    };

    return (
        <div className="space-y-12 animate-[fadeIn_0.5s_ease]">
            {/* Premium Header Display */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-[1.8rem] bg-indigo-600 flex items-center justify-center text-white shadow-xl shadow-indigo-200 relative overflow-hidden group">
                        <Layers size={28} className="relative z-10" />
                        <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-gray-900 tracking-tighter uppercase italic leading-none mb-1">KATALOG YÖNETİMİ</h1>
                        <p className="text-[9px] font-black text-indigo-400 uppercase tracking-[0.3em] flex items-center gap-2">
                             <Sparkles className="w-2.5 h-2.5" /> ROYAL SPA PREMİUM ENVANTER
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300 group-focus-within:text-indigo-600 transition-colors" size={16} />
                        <input 
                            placeholder="Katalogda ara..."
                            defaultValue={query}
                            className="pl-12 pr-6 py-4 bg-white border border-indigo-50 rounded-[2rem] text-sm font-bold w-64 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-200 outline-none transition-all shadow-sm"
                        />
                    </div>
                    <button 
                        onClick={async () => {
                            if (confirm('Katalog verileri örnek verilerle doldurulacak. Onaylıyor musunuz?')) {
                                await seedCatalogData({ addService, addPackageDefinition, addProduct });
                                alert('Katalog başarıyla güncellendi!');
                            }
                        }}
                        className="bg-stone-100 text-stone-600 px-6 py-4 rounded-[1.8rem] font-bold text-[9px] uppercase tracking-widest hover:bg-stone-200 transition-all flex items-center gap-2"
                    >
                        <Sparkles size={14} /> ÖRNEK VERİ YÜKLE
                    </button>
                    <button 
                        onClick={() => openPanel()}
                        className="bg-indigo-600 text-white px-8 py-4 rounded-[1.8rem] font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 flex items-center gap-2 hover:bg-indigo-700 active:scale-95 transition-all"
                    >
                        <Plus size={16} /> YENİ EKLE
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

                {/* Archive Toggle */}
                <div className="flex items-center gap-2 mt-4 px-2">
                    <button 
                        onClick={() => setShowArchived(!showArchived)}
                        className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${showArchived ? 'text-indigo-600' : 'text-gray-400 hover:text-indigo-400'}`}
                    >
                        <Activity className={`w-4 h-4 ${showArchived ? 'animate-pulse' : ''}`} />
                        {showArchived ? 'ARŞİVLENMİŞ ÖĞELERİ GİZLE' : 'ARŞİVLENMİŞ ÖĞELERİ GÖSTER'}
                    </button>
                    {showArchived && (
                        <span className="px-2 py-0.5 bg-indigo-100 text-indigo-600 rounded-md text-[8px] font-black">
                            {services.filter(s => s.isActive === false).length + packageDefinitions.filter(p => p.isActive === false).length} ARŞİVDE
                        </span>
                    )}
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
                            className="absolute inset-0 bg-indigo-950/60 backdrop-blur-md"
                        />
                        <motion.div 
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '100%' }}
                            transition={{ type: "spring", damping: 30, stiffness: 200 }}
                            className="relative w-full max-w-xl bg-white h-screen shadow-2xl flex flex-col border-l border-indigo-100"
                        >
                            {/* Panel Header */}
                            <div className="px-10 py-8 border-b border-gray-50 bg-white shrink-0">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl">
                                            <Plus size={20} />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter">
                                                {editingItem ? 'ÖĞE DÜZENLE' : 'YENİ TANIMLAMA'}
                                            </h3>
                                            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">
                                                {editingItem ? 'MEVCUT BİLGİLERİ GÜNCELLE' : 'KATALOGA YENİ ÖĞE EKLE'}
                                            </p>
                                        </div>
                                    </div>
                                    <button onClick={() => setIsAdding(false)} className="p-3 bg-gray-50 rounded-xl text-gray-400 hover:text-red-500 transition-colors">
                                        <X size={20} />
                                    </button>
                                </div>
                            </div>
 
                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto px-10 py-8 no-scrollbar bg-slate-50/20">
                                <div className="space-y-8">
                                    <InputField label="HİZMET / ÜRÜN ADI" value={form.name} onChange={(v: string) => setForm({...form, name: v})} placeholder="Bali Masajı, Aloe Vera Paketi vb." />
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-indigo-400 uppercase tracking-widest ml-1">KATEGORİ</label>
                                            <div className="relative">
                                                {!showNewCatInput ? (
                                                    <select 
                                                        className="w-full bg-white border border-indigo-50 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none focus:border-indigo-200 transition-all appearance-none shadow-sm"
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
                                                        {currentGroups.filter(g => !['Masaj Terapileri', 'Cilt Bakımı', 'Hamam', 'El & Ayak', 'Genel'].includes(g)).map(g => (
                                                            <option key={g} value={g}>{g}</option>
                                                        ))}
                                                        <option value="Genel">Genel</option>
                                                        <option value="ADD_NEW" className="text-indigo-600 font-extrabold">+ YENİ KATEGORİ EKLE</option>
                                                    </select>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <input 
                                                            autoFocus
                                                            className="flex-1 bg-white border-2 border-indigo-100 rounded-2xl px-5 py-4 font-bold text-gray-900 outline-none transition-all shadow-sm"
                                                            placeholder="Kategori Adı..."
                                                            value={newCategoryName}
                                                            onChange={e => setNewCategoryName(e.target.value)}
                                                        />
                                                        <button 
                                                            onClick={() => setShowNewCatInput(false)}
                                                            className="px-4 bg-gray-100 rounded-2xl text-[9px] font-black text-gray-400"
                                                        >
                                                            X
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

                                    {activeTab === 'hizmetler' && (
                                        <div className="p-8 border-2 border-purple-100 rounded-[2.5rem] bg-purple-50/10 space-y-4">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center text-white">
                                                        <Users size={16} />
                                                    </div>
                                                    <span className="text-[10px] font-black text-purple-900 uppercase tracking-widest">Çalışma Modu (Personel)</span>
                                                </div>
                                                <select 
                                                    value={form.requiredStaffCount}
                                                    onChange={e => setForm({...form, requiredStaffCount: Number(e.target.value)})}
                                                    className="bg-white border border-purple-100 rounded-xl px-4 py-2 text-[10px] font-black text-purple-600 outline-none"
                                                >
                                                    <option value={1}>Normal (Tek Terapist)</option>
                                                    <option value={2}>4-El (Çift Terapist)</option>
                                                </select>
                                            </div>
                                            <p className="text-[9px] font-bold text-purple-400 italic">4-El seçilirse takvimde randevu oluştururken sistem otomatik olarak 2. terapisti soracaktır.</p>
                                        </div>
                                    )}
 
                                    <div className="bg-gradient-to-br from-indigo-700 to-indigo-600 rounded-[2.5rem] p-8 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                                        <div className="relative z-10">
                                            <label className="text-[10px] font-black opacity-60 uppercase tracking-widest ml-1 block mb-2">SATIŞ FİYATI (TRY)</label>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-3xl font-black">₺</span>
                                                <input 
                                                    type="number"
                                                    value={form.price}
                                                    onChange={e => setForm({...form, price: Number(e.target.value)})}
                                                    className="bg-transparent border-none text-5xl font-black outline-none w-full tracking-tighter placeholder:text-white/20"
                                                    placeholder="0,00"
                                                />
                                            </div>
                                        </div>
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 blur-[40px] rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                                    </div>
 
                                    {/* Reçete Eşleştirme (Multiple Products) */}
                                    <div className="p-8 border-2 border-indigo-100 rounded-[2.5rem] bg-indigo-50/10 space-y-6">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
                                                    <PackageIcon size={16} />
                                                </div>
                                                <span className="text-[10px] font-black text-indigo-900 uppercase tracking-widest">Sarf Malzemesi / Reçete</span>
                                            </div>
                                            <button 
                                                onClick={() => {
                                                    const recipes = form.consumables || [];
                                                    setForm({...form, consumables: [...recipes, { productId: '', quantity: 1 }]});
                                                }}
                                                className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 transition-all"
                                            >
                                                + ÜRÜN EKLE
                                            </button>
                                        </div>

                                        <div className="space-y-3">
                                            {(form.consumables || []).map((recipe: any, idx: number) => (
                                                <div key={idx} className="flex gap-2 items-center bg-white p-3 rounded-2xl border border-indigo-100 shadow-sm">
                                                    <select 
                                                        className="flex-1 bg-transparent border-none text-[10px] font-black text-gray-900 outline-none"
                                                        value={recipe.productId}
                                                        onChange={e => {
                                                            const newRecipes = [...(form.consumables || [])];
                                                            newRecipes[idx].productId = e.target.value;
                                                            setForm({...form, consumables: newRecipes});
                                                        }}
                                                    >
                                                        <option value="">Ürün Seçin...</option>
                                                        {inventory.map(p => (
                                                            <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock})</option>
                                                        ))}
                                                    </select>
                                                    <input 
                                                        type="number"
                                                        placeholder="Adet"
                                                        className="w-16 bg-indigo-50 border-none rounded-xl px-2 py-1 text-[10px] font-black text-center outline-none"
                                                        value={recipe.quantity}
                                                        onChange={e => {
                                                            const newRecipes = [...(form.consumables || [])];
                                                            newRecipes[idx].quantity = Number(e.target.value);
                                                            setForm({...form, consumables: newRecipes});
                                                        }}
                                                    />
                                                    <button 
                                                        onClick={() => {
                                                            const newRecipes = (form.consumables || []).filter((_: any, i: number) => i !== idx);
                                                            setForm({...form, consumables: newRecipes});
                                                        }}
                                                        className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            ))}
                                            {(form.consumables || []).length === 0 && (
                                                <p className="text-[9px] font-bold text-indigo-400 text-center py-4 italic">Henüz bu hizmete sarf malzemesi atanmadı.</p>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Sticky Footer Area - Always Visible */}
                            <div className="mt-auto px-10 py-8 bg-white border-t border-gray-100 flex flex-col gap-3 shrink-0 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.05)]">
                                <button 
                                    onClick={handleSave} 
                                    disabled={!form.name || (activeTab === 'hizmetler' && form.price <= 0)}
                                    className="w-full py-6 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed group flex items-center justify-center gap-3"
                                >
                                    {editingItem ? 'DEĞİŞİKLİKLERİ KAYDET ✓' : 'KATALOGA EKLE ✓'}
                                </button>
                                <button onClick={() => setIsAdding(false)} className="w-full py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest hover:text-gray-900 transition-colors">
                                    Vazgeç ve Kapat
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
                                        onRestore={() => handleRestore(item)}
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

function PremiumCard({ item, activeTab, onEdit, onDelete, onRestore }: any) {
    const isArchived = item.isActive === false;

    return (
        <div className={`bg-white rounded-[3.5rem] p-10 shadow-sm border border-gray-100 transition-all duration-500 hover:shadow-2xl hover:-translate-y-3 group overflow-hidden relative ${isArchived ? 'opacity-60 saturate-50' : ''}`}>
            {isArchived && (
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20">
                    <span className="px-4 py-1.5 bg-gray-900 text-white text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">
                        ARŞİVLENMİŞ
                    </span>
                </div>
            )}
            
            <div className="flex justify-between items-start mb-8">
                <div className={`w-16 h-16 rounded-[1.8rem] flex items-center justify-center transition-all duration-500 shadow-inner ${isArchived ? 'bg-gray-200 text-gray-500' : 'bg-gray-50 group-hover:bg-gray-900 group-hover:text-white'}`}>
                    {activeTab === 'hizmetler' ? <Clock size={28} /> : activeTab === 'paketler' ? <PackageIcon size={28} /> : <ShoppingBag size={28} />}
                </div>
                <div className="flex gap-4 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 relative z-10">
                    {!isArchived ? (
                        <>
                            <button onClick={onEdit} className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:bg-black hover:text-white transition-all"><Edit3 size={18} /></button>
                            <PinGate onSuccess={onDelete} title="KATALOG ÖĞESİ SİLİNECEK">
                                <button className="w-10 h-10 bg-gray-50 flex items-center justify-center rounded-xl text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                                    <Trash2 size={18} />
                                </button>
                            </PinGate>
                        </>
                    ) : (
                        <button onClick={onRestore} className="px-6 py-2 bg-indigo-600 text-white flex items-center justify-center rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-indigo-700 transition-all">
                            ARŞİVDEN ÇIKAR
                        </button>
                    )}
                </div>
            </div>

            <h3 className={`text-2xl font-black mb-2 uppercase tracking-tight line-clamp-1 ${isArchived ? 'text-gray-400' : 'text-gray-900'}`}>{item.name}</h3>
            
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
                    <p className={`text-5xl font-black tracking-tighter italic ${isArchived ? 'text-gray-300' : 'text-indigo-950'}`}>₺{item.price.toLocaleString('tr-TR')}</p>
                </div>
                {activeTab === 'hizmetler' && !isArchived && (
                    <div className="flex flex-col items-end gap-2">
                         <div className="px-6 py-2 bg-indigo-50 border border-indigo-100/50 rounded-full text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] shadow-sm flex items-center gap-2">
                             <Star className="w-3 h-3 fill-indigo-600" /> %{Math.floor(Math.random() * 20) + 80} POPÜLERLİK
                         </div>
                    </div>
                )}
            </div>

            {/* Subtle Gradient decoration */}
            <div className={`absolute top-0 right-0 w-32 h-32 blur-[60px] rounded-full transition-all duration-500 pointer-events-none ${isArchived ? 'bg-gray-200/5' : 'bg-indigo-500/5 group-hover:bg-indigo-500/10'}`} />
        </div>
    );
}
