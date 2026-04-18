"use client";

import { useStore, Staff, PaymentDefinition, BankAccount, ExpenseCategory, ReferralSource, ConsentFormTemplate, Branch } from "@/lib/store";
import { 
    Users, CreditCard, Landmark, ListTree, 
    MapPin, FileText, Share2, Settings as SettingsIcon,
    Plus, Search, Edit2, Trash2, Check, X,
    ChevronRight, ChevronUp, ChevronDown, Shield, Smartphone, Calendar, Star,
    ExternalLink, Info, AlertCircle, Save, Layers, Zap, Clock, Building2, Megaphone
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import CatalogSettingsView from "@/components/system/CatalogSettingsView";
import AnnouncementsSettingsView from "@/components/system/AnnouncementsSettingsView";
import PinGate from "@/components/security/PinGate";

const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];

type SettingsTab = 
    | 'catalog'
    | 'staff' 
    | 'payment_methods' 
    | 'bank_accounts' 
    | 'expense_categories' 
    | 'branches' 
    | 'consent_forms' 
    | 'referral_sources'
    | 'rooms'
    | 'security'
    | 'announcements'
    | 'channels'
    | 'business';

export default function SystemSettingsPage() {
    const { 
        staffMembers, paymentDefinitions, bankAccounts, expenseCategories, 
        branches, consentFormTemplates, referralSources,
        addPaymentDefinition, updatePaymentDefinition, removePaymentDefinition,
        addBankAccount, updateBankAccount, removeBankAccount,
        addExpenseCategory, updateExpenseCategory, removeExpenseCategory,
        addReferralSource, updateReferralSource, removeReferralSource,
        addConsentFormTemplate, updateConsentFormTemplate, removeConsentFormTemplate,
        updateStaff, can, addRoom, updateRoom, deleteRoom,
        currentBusiness, updateBusiness
    } = useStore();

    const [activeTab, setActiveTab] = useState<SettingsTab>('catalog');
    const [searchQuery, setSearchQuery] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);
    const [showNewRoomCategory, setShowNewRoomCategory] = useState(false);
    const [newRoomCategoryName, setNewRoomCategoryName] = useState("");

    // Sidebar Items
    const menuItems = [
        { group: "ENVANTER & KATALOG", items: [
            { id: 'catalog', label: 'Hizmet Kataloğu', icon: Zap },
            { id: 'channels', label: 'Vitrin & Kanallar', icon: Share2 },
        ]},
        { group: "SİSTEM", items: [
            { id: 'business', label: 'İşletme Ayarları', icon: Building2 },
            { id: 'staff', label: 'Personeller', icon: Users },
            { id: 'rooms', label: 'Odalar / Kabinler', icon: Layers },
            { id: 'branches', label: 'Şubeler', icon: MapPin },
            { id: 'security', label: 'Güvenlik & PIN', icon: Shield },
        ]},
        { group: "FİNANSAL TANIMLAMALAR", items: [
            { id: 'payment_methods', label: 'Ödeme Araçları', icon: CreditCard },
            { id: 'bank_accounts', label: 'Banka Hesapları', icon: Landmark },
            { id: 'expense_categories', label: 'Gider Kategorileri', icon: ListTree },
        ]},
        { group: "DİĞER", items: [
            { id: 'announcements', label: 'Duyurular', icon: Megaphone },
            { id: 'consent_forms', label: 'Onam Formları', icon: FileText },
            { id: 'referral_sources', label: 'Referans Kaynakları', icon: Share2 },
        ]}
    ];

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget as HTMLFormElement);
        const data = Object.fromEntries(formData.entries());

        if (activeTab === 'payment_methods') {
            if (editingItem) updatePaymentDefinition(editingItem.id, data as any);
            else addPaymentDefinition(data);
        } else if (activeTab === 'bank_accounts') {
            if (editingItem) updateBankAccount(editingItem.id, data as any);
            else addBankAccount(data);
        } else if (activeTab === 'expense_categories') {
            if (editingItem) updateExpenseCategory(editingItem.id, data as any);
            else addExpenseCategory(data);
        } else if (activeTab === 'referral_sources') {
            if (editingItem) updateReferralSource(editingItem.id, data as any);
            else addReferralSource(data);
        } else if (activeTab === 'consent_forms') {
            if (editingItem) updateConsentFormTemplate(editingItem.id, data as any);
            else addConsentFormTemplate(data);
        } else if (activeTab === 'rooms') {
            const finalCategory = showNewRoomCategory ? newRoomCategoryName : (data.category as string);
            if (editingItem) updateRoom(editingItem.id, { ...data, category: finalCategory } as any);
            else addRoom({ ...data, category: finalCategory, status: 'active' } as any);
        }

        setIsEditModalOpen(false);
        setEditingItem(null);
        setShowNewRoomCategory(false);
        setNewRoomCategoryName("");
    };

    return (
        <div className="flex h-screen bg-[#FBFBFD] overflow-hidden">
            {/* Sidebar */}
            <div className="w-72 bg-white/70 backdrop-blur-xl border-r border-gray-100 flex flex-col pt-8">
                <div className="px-6 mb-8 flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-indigo-800 flex items-center justify-center text-white shadow-xl shadow-indigo-100">
                        <SettingsIcon size={24} />
                    </div>
                    <div>
                        <h1 className="text-lg font-black text-gray-900 leading-none tracking-tight">CONTROL HUB</h1>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mt-1">Sistem Yönetimi</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
                    {menuItems.map((group, idx) => (
                        <div key={idx} className="mb-6">
                            <h3 className="px-4 text-[10px] font-black text-gray-300 uppercase tracking-widest mb-3">{group.group}</h3>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id as SettingsTab)}
                                        className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-300 ${
                                            activeTab === item.id 
                                            ? "bg-indigo-600 text-white shadow-xl shadow-indigo-100" 
                                            : "text-gray-500 hover:bg-indigo-50/50 hover:text-indigo-600"
                                        }`}
                                    >
                                        <item.icon size={18} className={activeTab === item.id ? "text-white" : "text-gray-400"} />
                                        <span className="text-xs font-bold uppercase tracking-tight">{item.label}</span>
                                        {activeTab === item.id && (
                                            <motion.div layoutId="activeDot" className="ml-auto w-1.5 h-1.5 rounded-full bg-white" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 flex flex-col min-w-0 bg-[#FBFBFD]">
                <header className="h-24 bg-white/50 backdrop-blur-md border-b border-gray-100 px-10 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <div className="flex items-center gap-2 text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] mb-1">
                            <span>Sistem</span>
                            <ChevronRight size={10} />
                            <span className="text-gray-400">Tanımlamalar</span>
                        </div>
                        <h2 className="text-2xl font-black text-gray-900 tracking-tighter uppercase italic">
                            {menuItems.flatMap(g => g.items).find(i => i.id === activeTab)?.label}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 transition-colors group-focus-within:text-indigo-600" size={16} />
                            <input 
                                type="text"
                                placeholder="Arama yapın..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-11 pr-5 py-3 bg-white border border-gray-100 rounded-2xl text-xs font-bold w-64 focus:ring-4 focus:ring-indigo-500/5 focus:border-indigo-500/20 outline-none transition-all shadow-sm"
                            />
                        </div>
                        {activeTab !== 'staff' && activeTab !== 'catalog' && (
                            <button 
                                onClick={() => { setEditingItem(null); setIsEditModalOpen(true); }}
                                className="flex items-center gap-2 px-6 py-3 bg-black text-white rounded-2xl text-[11px] font-black uppercase tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-gray-200"
                            >
                                <Plus size={16} />
                                <span>Yeni Kayıt</span>
                            </button>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                        >
                            {activeTab === 'catalog' && (
                                <CatalogSettingsView query={searchQuery} />
                            )}
                            {activeTab === 'announcements' && (
                                <AnnouncementsSettingsView />
                            )}
                            {activeTab === 'channels' && (
                                <ChannelsSettingsView business={currentBusiness} />
                            )}
                            {activeTab === 'staff' && (
                                <StaffSettingsView staff={staffMembers} onUpdate={updateStaff} query={searchQuery} />
                            )}
                            {activeTab === 'payment_methods' && (
                                <GenericListView 
                                    items={paymentDefinitions} 
                                    onEdit={(item: PaymentDefinition) => { setEditingItem(item); setIsEditModalOpen(true); }}
                                    onDelete={removePaymentDefinition}
                                    query={searchQuery}
                                    columns={[
                                        { key: 'name', label: 'Ad' },
                                        { key: 'type', label: 'Tür' },
                                        { key: 'isActive', label: 'Durum', render: (val: boolean) => val ? (
                                            <span className="px-2 py-1 rounded-full bg-green-50 text-green-600 text-xs font-medium">Aktif</span>
                                        ) : (
                                            <span className="px-2 py-1 rounded-full bg-red-50 text-red-600 text-xs font-medium">Pasif</span>
                                        )}
                                    ]}
                                />
                            )}
                            {activeTab === 'bank_accounts' && (
                                <GenericListView 
                                    items={bankAccounts} 
                                    onEdit={(item: BankAccount) => { setEditingItem(item); setIsEditModalOpen(true); }}
                                    onDelete={removeBankAccount}
                                    query={searchQuery}
                                    columns={[
                                        { key: 'bankName', label: 'Banka' },
                                        { key: 'iban', label: 'IBAN' },
                                        { key: 'currency', label: 'Döviz' },
                                    ]}
                                />
                            )}
                            {activeTab === 'expense_categories' && (
                                <GenericListView 
                                    items={expenseCategories} 
                                    onEdit={(item: ExpenseCategory) => { setEditingItem(item); setIsEditModalOpen(true); }}
                                    onDelete={removeExpenseCategory}
                                    query={searchQuery}
                                    columns={[
                                        { key: 'name', label: 'Ad' },
                                        { key: 'description', label: 'Açıklama' },
                                    ]}
                                />
                            )}
                            {activeTab === 'branches' && (
                                <GenericListView 
                                    items={branches} 
                                    onEdit={(item: Branch) => { setEditingItem(item); setIsEditModalOpen(true); }}
                                    onDelete={() => {}}
                                    query={searchQuery}
                                    columns={[
                                        { key: 'name', label: 'Şube Adı' },
                                        { key: 'address', label: 'Adres' },
                                        { key: 'phone', label: 'Telefon' },
                                    ]}
                                />
                            )}
                            {activeTab === 'consent_forms' && (
                                <GenericListView 
                                    items={consentFormTemplates} 
                                    onEdit={(item: ConsentFormTemplate) => { setEditingItem(item); setIsEditModalOpen(true); }}
                                    onDelete={removeConsentFormTemplate}
                                    query={searchQuery}
                                    columns={[
                                        { key: 'name', label: 'Form Adı' },
                                        { key: 'createdAt', label: 'Oluşturulma', render: (val: string) => new Date(val).toLocaleDateString('tr-TR') },
                                    ]}
                                />
                            )}
                            {activeTab === 'referral_sources' && (
                                <GenericListView 
                                    items={referralSources} 
                                    onEdit={(item: ReferralSource) => { setEditingItem(item); setIsEditModalOpen(true); }}
                                    onDelete={removeReferralSource}
                                    query={searchQuery}
                                    columns={[
                                        { key: 'name', label: 'Kaynak Adı' },
                                    ]}
                                />
                            )}
                            { activeTab === 'rooms' && (
                                <RoomsSettingsView query={searchQuery} />
                            )}
                            { activeTab === 'business' && (
                                <BusinessSettingsView />
                            )}
                            { activeTab === 'security' && (
                                <SecuritySettingsView />
                            )}
                        </motion.div>
                    </AnimatePresence>
                </main>
            </div>

            {/* Edit Modal */}
            <AnimatePresence>
                {isEditModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsEditModalOpen(false)}
                            className="absolute inset-0 bg-black/20 backdrop-blur-sm"
                        />
                        <motion.div 
                            initial={{ scale: 0.95, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: 20 }}
                            className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg relative z-10 overflow-hidden"
                        >
                            <form onSubmit={handleSave}>
                                <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900">
                                            {editingItem ? 'Düzenle' : 'Yeni Tanımlama'}
                                        </h3>
                                        <p className="text-sm text-gray-500 mt-1">Gerekli bilgileri aşağıya giriniz.</p>
                                    </div>
                                    <button type="button" onClick={() => {
                                        setIsEditModalOpen(false);
                                        setEditingItem(null);
                                        setShowNewRoomCategory(false);
                                    }} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-colors shadow-sm">
                                        <X size={20} />
                                    </button>
                                </div>

                                <div className="p-8 space-y-6">
                                    {activeTab === 'payment_methods' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ödeme Aracı Adı</label>
                                                <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all placeholder:text-gray-300" placeholder="Örn: Akbank KK" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Ödeme Türü</label>
                                                <select name="type" defaultValue={editingItem?.type || 'Kredi Kartı'} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none">
                                                    <option>Kredi Kartı</option>
                                                    <option>Nakit</option>
                                                    <option>Havale/EFT</option>
                                                    <option>Diğer</option>
                                                </select>
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'bank_accounts' && (
                                        <>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Banka Adı</label>
                                                    <input name="bankName" defaultValue={editingItem?.bankName} required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                                </div>
                                                <div>
                                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Döviz</label>
                                                    <select name="currency" defaultValue={editingItem?.currency || 'TRY'} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all">
                                                        <option>TRY</option>
                                                        <option>USD</option>
                                                        <option>EUR</option>
                                                    </select>
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">IBAN</label>
                                                <input name="iban" defaultValue={editingItem?.iban} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all font-mono text-sm" placeholder="TR00 ..." />
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'expense_categories' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kategori Adı</label>
                                                <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="Örn: Kira, Mutfak Gideri" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Açıklama</label>
                                                <textarea name="description" defaultValue={editingItem?.description} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all h-32" />
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'referral_sources' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Referans Kaynak Adı</label>
                                            <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="Örn: Instagram, Tavsiye" />
                                        </div>
                                    )}

                                    {activeTab === 'consent_forms' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Form Başlığı</label>
                                                <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Form İçeriği (Markdown/HTML)</label>
                                                <textarea name="content" defaultValue={editingItem?.content} required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all h-64 font-mono text-sm" />
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'branches' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Şube Adı</label>
                                                <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Adres</label>
                                                <input name="address" defaultValue={editingItem?.address} className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all" />
                                            </div>
                                        </>
                                    )}

                                    {activeTab === 'rooms' && (
                                        <>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Oda / Kabin Adı</label>
                                                <input name="name" defaultValue={editingItem?.name} required className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all" placeholder="Örn: VIP Masaj Odası" />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Kategori</label>
                                                {!showNewRoomCategory ? (
                                                    <select 
                                                        name="category" 
                                                        defaultValue={editingItem?.category || 'Masaj'} 
                                                        onChange={(e) => {
                                                            if (e.target.value === 'ADD_NEW') setShowNewRoomCategory(true);
                                                        }}
                                                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all appearance-none"
                                                    >
                                                        <option>Masaj</option>
                                                        <option>Cilt Bakımı</option>
                                                        <option>VIP</option>
                                                        <option>Hamam</option>
                                                        <option>Mola</option>
                                                        <option value="ADD_NEW">+ Yeni Kategori Ekle</option>
                                                    </select>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <input 
                                                            autoFocus
                                                            className="flex-1 px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                                                            placeholder="Kategori Adı..."
                                                            value={newRoomCategoryName}
                                                            onChange={e => setNewRoomCategoryName(e.target.value)}
                                                        />
                                                        <button 
                                                            type="button"
                                                            onClick={() => setShowNewRoomCategory(false)}
                                                            className="px-4 bg-gray-100 rounded-2xl text-[10px] font-black"
                                                        >
                                                            İPTAL
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Tema Rengi</label>
                                                <input type="color" name="color" defaultValue={editingItem?.color || '#0071E3'} className="w-full h-12 bg-gray-50 border-none rounded-2xl cursor-pointer" />
                                            </div>
                                        </>
                                    )}
                                </div>

                                <div className="p-8 bg-gray-50/50 border-t border-gray-100 flex gap-4">
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="flex-1 py-3 text-sm font-medium text-gray-600 hover:bg-white rounded-2xl transition-all border border-transparent hover:border-gray-200">
                                        Vazgeç
                                    </button>
                                    <button type="submit" className="flex-1 py-3 bg-black text-white text-sm font-medium rounded-2xl hover:bg-gray-800 transition-all shadow-lg shadow-gray-200 flex items-center justify-center gap-2">
                                        <Save size={18} />
                                        Kaydet
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

function StaffSettingsView({ staff, onUpdate, query }: { staff: Staff[], onUpdate: any, query: string }) {
    const filtered = [...staff]
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

    const toggle = (id: string, field: keyof Staff, value: boolean) => {
        onUpdate(id, { [field]: value });
    };

    const moveStaff = (index: number, direction: 'up' | 'down') => {
        if (query) {
            alert("Lütfen sıralama yapmak için aramayı temizleyin.");
            return;
        }
        const newIndex = direction === 'up' ? index - 1 : index + 1;
        if (newIndex < 0 || newIndex >= filtered.length) return;
        
        const newFiltered = [...filtered];
        const temp = newFiltered[index];
        newFiltered[index] = newFiltered[newIndex];
        newFiltered[newIndex] = temp;
        
        newFiltered.forEach((s, idx) => {
            if (s.sortOrder !== idx) {
                onUpdate(s.id, { sortOrder: idx });
            }
        });
    };

    return (
        <div className="bg-white rounded-[3.5rem] overflow-hidden shadow-sm border border-gray-100">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/30 border-b border-gray-50">
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest w-20 text-center">SIRA</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">AD SOYAD</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">YETKİ</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">GRUP</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">SİSTEM</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">MOBİL</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">TAKVİM</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center whitespace-nowrap">İNDİRİM YETKİSİ (%)</th>
                        <th className="px-10 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center whitespace-nowrap">İZİN GÜNÜ</th>
                        <th className="px-10 py-6 text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filtered.map((s, index) => (
                        <tr key={s.id} className="hover:bg-gray-50/50 transition-colors group">
                            <td className="px-10 py-6">
                                <div className="flex flex-col gap-1 items-center justify-center">
                                    <button onClick={() => moveStaff(index, 'up')} disabled={index === 0 || !!query} className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-300 transition-colors">
                                        <ChevronUp size={16} />
                                    </button>
                                    <span className="text-[11px] font-black text-indigo-900 bg-indigo-50 px-3 py-1 rounded-full">{index + 1}</span>
                                    <button onClick={() => moveStaff(index, 'down')} disabled={index === filtered.length - 1 || !!query} className="p-1 text-gray-300 hover:text-indigo-600 disabled:opacity-30 disabled:hover:text-gray-300 transition-colors">
                                        <ChevronDown size={16} />
                                    </button>
                                </div>
                            </td>
                            <td className="px-10 py-6">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-xs border border-indigo-100 uppercase">
                                        {s.name.slice(0, 2)}
                                    </div>
                                    <span className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{s.name}</span>
                                </div>
                            </td>
                            <td className="px-10 py-6">
                                <span className="text-[10px] font-black px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg uppercase tracking-widest">{s.role}</span>
                            </td>
                            <td className="px-10 py-6">
                                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{s.staffGroup || 'Terapist'}</span>
                            </td>
                            <td className="px-10 py-6 text-center">
                                <Toggle checked={s.canLoginSystem} onChange={(v) => toggle(s.id, 'canLoginSystem', v)} />
                            </td>
                            <td className="px-10 py-6 text-center">
                                <Toggle checked={s.canLoginMobile} onChange={(v) => toggle(s.id, 'canLoginMobile', v)} />
                            </td>
                            <td className="px-10 py-6 text-center">
                                <Toggle checked={s.isVisibleOnCalendar} onChange={(v) => toggle(s.id, 'isVisibleOnCalendar', v)} />
                            </td>
                            <td className="px-10 py-6 text-center">
                                <input 
                                    type="number" 
                                    min={0} max={100}
                                    value={s.maxDiscount ?? 0}
                                    onChange={(e) => onUpdate(s.id, { maxDiscount: Number(e.target.value) })}
                                    className="w-16 bg-gray-50 border border-gray-100 rounded-lg px-2 py-1.5 text-center text-[10px] font-black text-indigo-600 outline-none focus:border-indigo-500 transition-all"
                                />
                            </td>
                            <td className="px-10 py-6 text-center">
                                <select 
                                    value={s.weeklyOffDay ?? 0}
                                    onChange={(e) => onUpdate(s.id, { weeklyOffDay: Number(e.target.value) })}
                                    className="bg-gray-50 border border-gray-100 rounded-lg px-3 py-1.5 text-[10px] font-black uppercase tracking-widest outline-none focus:border-indigo-500 transition-all"
                                >
                                    {DAYS.map((day, i) => (
                                        <option key={i} value={i}>{day}</option>
                                    ))}
                                </select>
                            </td>
                            <td className="px-10 py-6 text-right">
                                <button className="p-3 text-gray-300 hover:text-black transition-colors">
                                    <Edit2 size={18} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

function RoomsSettingsView({ query }: { query: string }) {
    const { rooms, addRoom, deleteRoom, updateRoom } = useStore();
    const filtered = rooms.filter(r => r.name.toLowerCase().includes(query.toLowerCase()));

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((room) => (
                <div key={room.id} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group overflow-hidden relative">
                    <div className="flex justify-between items-start mb-8">
                        <div 
                            className="w-16 h-16 rounded-[1.8rem] flex items-center justify-center text-white shadow-xl shadow-indigo-100"
                            style={{ backgroundColor: room.color || '#6366f1' }}
                        >
                            <Layers size={28} />
                        </div>
                        <div className="flex gap-2">
                             <PinGate onSuccess={() => deleteRoom(room.id)} title="ODA SİLİNECEK">
                                <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                                    <Trash2 size={18} />
                                </button>
                             </PinGate>
                        </div>
                    </div>
                    <div className="space-y-6">
                        <div>
                            <label className="block text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1.5">ODA ADI</label>
                            <div className="text-xl font-black text-gray-900 uppercase tracking-tight">{room.name}</div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1.5">KATEGORİ</label>
                            <div className="text-sm font-bold text-indigo-600 uppercase tracking-widest">{room.category || 'Genel'}</div>
                        </div>
                        <div className="flex items-center justify-between pt-6 border-t border-gray-50">
                             <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">AKTİF DURUM</span>
                             <Toggle checked={room.status === 'active'} onChange={(v) => updateRoom(room.id, { status: v ? 'active' : 'passive' })} />
                        </div>
                    </div>
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                </div>
            ))}
            
            {filtered.length === 0 && (
                <div className="col-span-full py-32 bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center text-gray-200 mb-8 shadow-sm">
                        <Plus size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Henüz Oda Eklenmemiş</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3">Personellere atama yapabilmek için önce oda tanımlayın.</p>
                </div>
            )}
        </div>
    );
}

function GenericListView({ items, columns, onEdit, onDelete, query }: { items: any[], columns: any[], onEdit: any, onDelete: any, query: string }) {
    const filtered = items.filter(item => 
        Object.values(item).some(val => 
            String(val).toLowerCase().includes(query.toLowerCase())
        )
    );

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {filtered.map((item) => (
                <div key={item.id} className="bg-white p-10 rounded-[3.5rem] shadow-sm border border-gray-100 hover:shadow-2xl hover:shadow-indigo-100 transition-all duration-500 hover:-translate-y-2 group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-10">
                        <div className="w-16 h-16 rounded-[1.8rem] bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 shadow-inner">
                            {item.bankName ? <Landmark size={28} /> : <CreditCard size={28} />}
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => onEdit(item)} className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all">
                                <Edit2 size={16} />
                            </button>
                            <PinGate onSuccess={() => onDelete(item.id)} title="KAYIT SİLİNECEK">
                                <button className="w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </PinGate>
                        </div>
                    </div>

                    <div className="space-y-6">
                        {columns.map(col => (
                            <div key={col.key}>
                                <label className="block text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] mb-1.5">{col.label}</label>
                                <div className="text-lg font-black text-gray-900 uppercase tracking-tight truncate">
                                    {col.render ? col.render(item[col.key]) : item[col.key]}
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                </div>
            ))}
            
            {filtered.length === 0 && (
                <div className="col-span-full py-32 bg-gray-50/50 rounded-[4rem] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-24 h-24 rounded-[2rem] bg-white flex items-center justify-center text-gray-300 mb-8 shadow-sm">
                        <Info size={48} />
                    </div>
                    <h3 className="text-2xl font-black text-gray-900 uppercase italic tracking-tighter">Sonuç Bulunamadı</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-3 max-w-xs">Aramanıza uygun kayıt bulunamadı veya henüz eklenmemiş.</p>
                </div>
            )}
        </div>
    );
}

function SecuritySettingsView() {
    const { currentBusiness, updateBusiness } = useStore();
    const [pin, setPin] = useState(currentBusiness?.managerPin || "");
    const [isSaving, setIsSaving] = useState(false);

    const handlePinSave = async () => {
        setIsSaving(true);
        const success = await updateBusiness({ managerPin: pin });
        setIsSaving(false);
        if (success) alert("Yönetici PIN başarıyla güncellendi.");
    };

    return (
        <div className="max-w-2xl mx-auto space-y-10 py-10">
            <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100 text-center relative overflow-hidden">
                <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner">
                    <Shield size={48} />
                </div>
                <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter mb-4">Müdür Onay PIN</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-12 max-w-sm mx-auto leading-relaxed">
                    Hediye/İkram gibi özel yetki gerektiren işlemler için kullanılacak 4 haneli PIN kodunu belirleyin.
                </p>

                <div className="space-y-8">
                    <div className="relative max-w-[280px] mx-auto">
                        <input 
                            type="password" 
                            maxLength={4}
                            value={pin}
                            onChange={(e) => setPin(e.target.value)}
                            placeholder="••••"
                            className="w-full bg-gray-50 border-none rounded-[2rem] px-8 py-6 text-center text-4xl font-black tracking-[1em] outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all placeholder:text-gray-200"
                        />
                    </div>
                    
                    <button 
                        onClick={handlePinSave}
                        disabled={isSaving || pin.length !== 4}
                        className="w-full max-w-[280px] py-6 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3 disabled:opacity-30 disabled:hover:scale-100 shadow-2xl shadow-gray-200"
                    >
                        {isSaving ? "KAYDEDİLİYOR..." : <><Save size={18} /> PIN KODUNU KAYDET</>}
                    </button>
                </div>

                <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-indigo-50 opacity-20 rounded-full" />
            </div>

            <div className="bg-amber-50 rounded-[3rem] p-10 border border-amber-100 flex items-start gap-6">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                    <Info size={24} />
                </div>
                <div>
                    <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight mb-2">GÜVENLİK TAVSİYESİ</h4>
                    <p className="text-xs font-bold text-amber-700 leading-relaxed">
                        PIN kodunu sadece şube müdürü ve yetkili personelle paylaşın. Bu kod, finansal verileri etkileyen "Hediye" süreçlerini doğrulamak için kullanılır.
                    </p>
                </div>
            </div>
        </div>
    );
}

function BusinessSettingsView() {
    const { currentBusiness, updateBusiness } = useStore();
    const [startHour, setStartHour] = useState(currentBusiness?.calendarStartHour || 8);
    const [endHour, setEndHour] = useState(currentBusiness?.calendarEndHour || 22);
    const [isSaving, setIsSaving] = useState(false);

    const handleSave = async () => {
        setIsSaving(true);
        await updateBusiness({ 
            calendarStartHour: Number(startHour), 
            calendarEndHour: Number(endHour) 
        });
        setIsSaving(false);
        alert("Çalışma saatleri başarıyla güncellendi.");
    };

    return (
        <div className="max-w-4xl mx-auto py-10 space-y-12">
            <div className="bg-white p-12 rounded-[4rem] shadow-sm border border-gray-100 relative overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-10">
                    <div className="flex items-center gap-8">
                        <div className="w-24 h-24 bg-indigo-50 text-indigo-600 rounded-[2.5rem] flex items-center justify-center shadow-inner group">
                            <Clock size={48} className="group-hover:rotate-12 transition-transform" />
                        </div>
                        <div>
                            <h3 className="text-3xl font-black text-gray-900 uppercase italic tracking-tighter mb-2">Çalışma Saatleri</h3>
                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-relaxed">
                                Takvim görünümünün başlangıç ve bitiş saatlerini belirleyin.
                            </p>
                        </div>
                    </div>
                    
                    <div className="flex gap-4 items-center bg-gray-50 p-4 rounded-[2.5rem] border border-gray-100">
                        <div className="flex flex-col items-center">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">BAŞLANGIÇ</label>
                            <input 
                                type="number" 
                                min={0} 
                                max={23} 
                                value={startHour}
                                onChange={(e) => setStartHour(Number(e.target.value))}
                                className="w-16 h-16 bg-white border-none rounded-2xl text-center text-2xl font-black text-indigo-600 shadow-sm outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                            />
                        </div>
                        <div className="w-4 h-0.5 bg-gray-200 mt-6" />
                        <div className="flex flex-col items-center">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2">BİTİŞ</label>
                            <input 
                                type="number" 
                                min={0} 
                                max={23} 
                                value={endHour}
                                onChange={(e) => setEndHour(Number(e.target.value))}
                                className="w-16 h-16 bg-white border-none rounded-2xl text-center text-2xl font-black text-rose-600 shadow-sm outline-none focus:ring-2 focus:ring-rose-100 transition-all"
                            />
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-12 border-t border-gray-50 flex justify-end">
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-12 py-5 bg-black text-white rounded-[2rem] font-black text-xs uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl flex items-center gap-3 disabled:opacity-30"
                    >
                        {isSaving ? "Kaydediliyor..." : <><Save size={18} /> AYARLARI KAYDET</>}
                    </button>
                </div>

                <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-indigo-50 opacity-10 rounded-full" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-amber-50 p-10 rounded-[3rem] border border-amber-100 flex gap-6">
                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                        <Info size={24} />
                    </div>
                    <div>
                        <h4 className="text-sm font-black text-amber-900 uppercase tracking-tight mb-2">NOT</h4>
                        <p className="text-xs font-bold text-amber-700 leading-relaxed">
                            Bu saatler sadece takvim ızgarasının görünümünü etkiler. Personel mesai saatleri ayrıca personel düzenleme ekranından ayarlanmalıdır.
                        </p>
                    </div>
                </div>

                <div className="bg-indigo-900 p-10 rounded-[3rem] text-white flex gap-6 relative overflow-hidden">
                    <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-white shadow-xl shrink-0 backdrop-blur-md">
                        <Building2 size={24} />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-sm font-black uppercase tracking-tight mb-2">İŞLETME KİMLİĞİ</h4>
                        <p className="text-xs font-bold opacity-60 leading-relaxed">
                            Şu an {currentBusiness?.name} işletmesi için global ayarları düzenliyorsunuz.
                        </p>
                    </div>
                    <Calendar className="absolute -right-4 -bottom-4 w-24 h-24 opacity-10 rotate-12" />
                </div>
            </div>
        </div>
    );
}

function ChannelsSettingsView({ business }: { business: any }) {
    const [copiedId, setCopiedId] = useState<string | null>(null);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const channels = [
        {
            id: 'kiosk',
            label: 'Resepsiyon Kiosk (Check-in)',
            icon: Smartphone,
            description: 'Resepsiyon masasına koyacağınız tablet için bilet okuma/kayıt ekranı.',
            url: `${origin}/${business?.slug}/kiosk`
        },
        {
            id: 'booking',
            label: 'Müşteri Rezervasyon Sayfası',
            icon: Calendar,
            description: 'Instagram veya web sitenize koyacağınız online randevu linki.',
            url: `${origin}/book/${business?.id}`
        },
        {
            id: 'portal',
            label: 'Müşteri VIP Portalı',
            icon: Star,
            description: 'Müşterilerinizin paketlerini ve puanlarını takip edebileceği PWA ekranı.',
            url: `${origin}/portal/${business?.id}`
        }
    ];

    const copyToClipboard = (url: string, id: string) => {
        navigator.clipboard.writeText(url);
        setCopiedId(id);
        setTimeout(() => setCopiedId(null), 2000);
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {channels.map((channel) => (
                    <motion.div 
                        key={channel.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm relative overflow-hidden group hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 opacity-0 group-hover:opacity-30 rounded-full -mr-16 -mt-16 transition-all duration-700" />
                        
                        <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-indigo-600 mb-6 group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500">
                            <channel.icon size={28} />
                        </div>

                        <h3 className="text-lg font-black text-gray-900 mb-2 uppercase tracking-tight">{channel.label}</h3>
                        <p className="text-xs font-bold text-gray-400 mb-8 leading-relaxed h-10">
                            {channel.description}
                        </p>

                        <div className="space-y-3 relative z-10">
                            <div className="bg-gray-50 p-4 rounded-2xl border border-gray-100 flex items-center justify-between gap-4 overflow-hidden">
                                <span className="text-[10px] font-black text-gray-500 truncate lowercase opacity-60">
                                    {channel.url}
                                </span>
                            </div>
                            
                            <div className="flex gap-2">
                                <button
                                    onClick={() => copyToClipboard(channel.url, channel.id)}
                                    className={`flex-1 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
                                        copiedId === channel.id 
                                        ? "bg-green-500 text-white" 
                                        : "bg-black text-white hover:bg-gray-800"
                                    }`}
                                >
                                    {copiedId === channel.id ? <><Check size={14} /> KOPYALANDI</> : <><Plus size={14} /> LİNKİ KOPYALA</>}
                                </button>
                                <a 
                                    href={channel.url} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="p-4 bg-gray-50 text-gray-500 hover:text-indigo-600 rounded-2xl transition-all border border-gray-100"
                                >
                                    <ExternalLink size={18} />
                                </a>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>

            <div className="bg-indigo-50 p-10 rounded-[3.5rem] border border-indigo-100 flex flex-col md:flex-row items-center gap-8 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-100 opacity-20 rounded-full blur-3xl -mr-32 -mt-32" />
                <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-indigo-600 shadow-xl shrink-0 relative z-10">
                    <Smartphone size={40} />
                </div>
                <div className="relative z-10 text-center md:text-left">
                    <h4 className="text-xl font-black text-indigo-900 uppercase tracking-tighter mb-2">QR KOD & TABLET KURULUMU</h4>
                    <p className="text-xs font-bold text-indigo-700 leading-relaxed max-w-xl">
                        Kiosk ekranını resepsiyonunuzdaki bir tabletten açıp "Tam Ekran" (F11) yapmanız yeterlidir. Müşterileriniz biletlerini okuttuğunda sistem otomatik olarak randevuyu onaylar.
                    </p>
                </div>
                <div className="md:ml-auto relative z-10">
                    <button className="px-8 py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-200 hover:scale-105 transition-all">
                        KURULUM REHBERİ
                    </button>
                </div>
            </div>
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <button 
            onClick={() => onChange(!checked)}
            className={`w-12 h-7 rounded-full transition-all duration-300 relative px-1 flex items-center ${
                checked ? 'bg-indigo-600' : 'bg-gray-200'
            }`}
        >
            <motion.div 
                animate={{ x: checked ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-5 h-5 bg-white rounded-full shadow-lg"
            />
        </button>
    );
}
