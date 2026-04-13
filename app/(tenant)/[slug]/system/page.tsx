"use client";

import { useStore, Staff, PaymentDefinition, BankAccount, ExpenseCategory, ReferralSource, ConsentFormTemplate, Branch } from "@/lib/store";
import { 
    Users, CreditCard, Landmark, ListTree, 
    MapPin, FileText, Share2, Settings as SettingsIcon,
    Plus, Search, Edit2, Trash2, Check, X,
    ChevronRight, Shield, Smartphone, Calendar,
    ExternalLink, Info, AlertCircle, Save
} from "lucide-react";
import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";

type SettingsTab = 
    | 'staff' 
    | 'payment_methods' 
    | 'bank_accounts' 
    | 'expense_categories' 
    | 'branches' 
    | 'consent_forms' 
    | 'referral_sources';

export default function SystemSettingsPage() {
    const { 
        staffMembers, paymentDefinitions, bankAccounts, expenseCategories, 
        branches, consentFormTemplates, referralSources,
        addPaymentDefinition, updatePaymentDefinition, removePaymentDefinition,
        addBankAccount, updateBankAccount, removeBankAccount,
        addExpenseCategory, updateExpenseCategory, removeExpenseCategory,
        addReferralSource, updateReferralSource, removeReferralSource,
        addConsentFormTemplate, updateConsentFormTemplate, removeConsentFormTemplate,
        updateStaff, can
    } = useStore();

    const [activeTab, setActiveTab] = useState<SettingsTab>('staff');
    const [searchQuery, setSearchQuery] = useState("");
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<any>(null);

    // Sidebar Items
    const menuItems = [
        { group: "SİSTEM", items: [
            { id: 'staff', label: 'Personeller', icon: Users },
        ]},
        { group: "FİNANSAL TANIMLAMALAR", items: [
            { id: 'payment_methods', label: 'Ödeme Araçları', icon: CreditCard },
            { id: 'bank_accounts', label: 'Banka Hesapları', icon: Landmark },
            { id: 'expense_categories', label: 'Gider Kategorileri', icon: ListTree },
        ]},
        { group: "OPERASYONEL TANIMLAMALAR", items: [
            { id: 'branches', label: 'Şubeler', icon: MapPin },
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
        }

        setIsEditModalOpen(false);
        setEditingItem(null);
    };

    return (
        <div className="flex h-screen bg-[#FBFBFD] overflow-hidden">
            {/* Sidebar */}
            <div className="w-72 bg-white border-r border-gray-100 flex flex-col pt-8">
                <div className="px-6 mb-8 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#0071E3] to-[#00C7FF] flex items-center justify-center text-white shadow-lg shadow-blue-200">
                        <SettingsIcon size={22} />
                    </div>
                    <div>
                        <h1 className="text-lg font-semibold text-gray-900 leading-none">Sistem</h1>
                        <p className="text-xs text-gray-500 mt-1">Ayarlar & Tanımlamalar</p>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-4 pb-8 custom-scrollbar">
                    {menuItems.map((group, idx) => (
                        <div key={idx} className="mb-6">
                            <h3 className="px-4 text-[11px] font-bold text-gray-400 tracking-wider mb-2">{group.group}</h3>
                            <div className="space-y-1">
                                {group.items.map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => setActiveTab(item.id as SettingsTab)}
                                        className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 ${
                                            activeTab === item.id 
                                            ? "bg-[#0071E3] text-white shadow-md shadow-blue-100" 
                                            : "text-gray-600 hover:bg-gray-50"
                                        }`}
                                    >
                                        <item.icon size={18} className={activeTab === item.id ? "text-white" : "text-gray-400"} />
                                        <span className="text-sm font-medium">{item.label}</span>
                                        {activeTab === item.id && (
                                            <motion.div layoutId="activeDot" className="ml-auto w-1.5 h-1.5 rounded-full bg-white opacity-80" />
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
                <header className="h-20 bg-white/80 backdrop-blur-md border-b border-gray-100 px-8 flex items-center justify-between sticky top-0 z-10">
                    <div>
                        <h2 className="text-xl font-semibold text-gray-900 capitalize">
                            {menuItems.flatMap(g => g.items).find(i => i.id === activeTab)?.label}
                        </h2>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-[#0071E3]" size={16} />
                            <input 
                                type="text"
                                placeholder="Ara..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 pr-4 py-2 bg-gray-50 border-none rounded-2xl text-sm w-64 focus:ring-2 focus:ring-blue-100 outline-none transition-all"
                            />
                        </div>
                        {activeTab !== 'staff' && (
                            <button 
                                onClick={() => { setEditingItem(null); setIsEditModalOpen(true); }}
                                className="flex items-center gap-2 px-5 py-2 bg-black text-white rounded-2xl text-sm font-medium hover:bg-gray-800 transition-all shadow-sm"
                            >
                                <Plus size={16} />
                                <span>Yeni Ekle</span>
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
                                    <button type="button" onClick={() => setIsEditModalOpen(false)} className="w-10 h-10 rounded-full hover:bg-white flex items-center justify-center text-gray-400 transition-colors shadow-sm">
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
    const filtered = staff.filter(s => s.name.toLowerCase().includes(query.toLowerCase()));

    const toggle = (id: string, field: keyof Staff, value: boolean) => {
        onUpdate(id, { [field]: value });
    };

    return (
        <div className="bg-white rounded-[32px] overflow-hidden shadow-sm border border-gray-100">
            <table className="w-full text-left border-collapse">
                <thead>
                    <tr className="bg-gray-50/50 border-b border-gray-50">
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Ad Soyad</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Yetki Grubu</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Personel Grubu</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Sisteme Giriş</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Mobil</th>
                        <th className="px-6 py-4 text-[11px] font-bold text-gray-400 uppercase tracking-wider">Takvim</th>
                        <th className="px-6 py-4 text-right"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                    {filtered.map((s) => (
                        <tr key={s.id} className="hover:bg-gray-50/30 transition-colors group">
                            <td className="px-6 py-5">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 text-[#0071E3] flex items-center justify-center font-semibold text-xs border border-blue-100 uppercase">
                                        {s.name.slice(0, 2)}
                                    </div>
                                    <span className="text-sm font-semibold text-gray-900 group-hover:text-[#0071E3] transition-colors">{s.name}</span>
                                </div>
                            </td>
                            <td className="px-6 py-5">
                                <span className="text-xs font-medium px-2 py-1 bg-gray-100 text-gray-600 rounded-lg">{s.role}</span>
                            </td>
                            <td className="px-6 py-5">
                                <span className="text-xs font-medium text-gray-500">{s.staff_group || 'Terapist'}</span>
                            </td>
                            <td className="px-6 py-5">
                                <Toggle checked={s.can_login_system} onChange={(v) => toggle(s.id, 'can_login_system', v)} />
                            </td>
                            <td className="px-6 py-5">
                                <Toggle checked={s.can_login_mobile} onChange={(v) => toggle(s.id, 'can_login_mobile', v)} />
                            </td>
                            <td className="px-6 py-5">
                                <Toggle checked={s.isVisibleOnCalendar} onChange={(v) => toggle(s.id, 'isVisibleOnCalendar', v)} />
                            </td>
                            <td className="px-6 py-5 text-right">
                                <button className="p-2 text-gray-400 hover:text-black transition-colors">
                                    <Edit2 size={16} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
                <div key={item.id} className="bg-white p-6 rounded-[32px] shadow-sm border border-gray-100 hover:shadow-xl hover:shadow-gray-200/40 transition-all duration-300 group relative overflow-hidden">
                    <div className="flex justify-between items-start mb-6">
                        <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-[#0071E3] group-hover:text-white transition-all duration-300">
                            {item.bankName ? <Landmark size={24} /> : <CreditCard size={24} />}
                        </div>
                        <div className="flex gap-2">
                            <button onClick={() => onEdit(item)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-black hover:text-white transition-all">
                                <Edit2 size={14} />
                            </button>
                            <button onClick={() => onDelete(item.id)} className="w-9 h-9 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:bg-red-500 hover:text-white transition-all">
                                <Trash2 size={14} />
                            </button>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {columns.map(col => (
                            <div key={col.key}>
                                <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">{col.label}</label>
                                <div className="text-sm font-semibold text-gray-900 truncate">
                                    {col.render ? col.render(item[col.key]) : item[col.key]}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Subtle decoration */}
                    <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-gray-50 rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700" />
                </div>
            ))}
            
            {filtered.length === 0 && (
                <div className="col-span-full py-20 bg-gray-50/50 rounded-[40px] border-2 border-dashed border-gray-100 flex flex-col items-center justify-center text-center">
                    <div className="w-20 h-20 rounded-full bg-white flex items-center justify-center text-gray-300 mb-6 shadow-sm">
                        <Info size={40} />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900">Sonuç Bulunamadı</h3>
                    <p className="text-sm text-gray-500 mt-2 max-w-xs">Aramanıza uygun kayıt bulunamadı veya henüz eklenmemiş.</p>
                </div>
            )}
        </div>
    );
}

function Toggle({ checked, onChange }: { checked: boolean, onChange: (v: boolean) => void }) {
    return (
        <button 
            onClick={() => onChange(!checked)}
            className={`w-11 h-6 rounded-full transition-all duration-300 relative px-1 ${
                checked ? 'bg-[#0071E3]' : 'bg-gray-200'
            }`}
        >
            <motion.div 
                animate={{ x: checked ? 20 : 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 30 }}
                className="w-4 h-4 bg-white rounded-full shadow-lg absolute top-1"
            />
        </button>
    );
}
