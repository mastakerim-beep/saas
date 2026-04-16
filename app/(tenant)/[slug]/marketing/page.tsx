"use client";

import { useStore, AiInsight, NotificationLog } from '@/lib/store';
import { 
    Zap, Sparkles, MessageSquare, 
    Send, Calendar, Users, 
    TrendingUp, ShieldCheck, 
    Smartphone, Mail, CheckCircle2,
    RefreshCcw, ArrowRight, Dna,
    Clock, DollarSign, Gift,
    Plus, Trash2, Edit3, X
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketingPage() {
    const { 
        aiInsights, customers, allNotifs, sendNotification,
        marketingRules, addMarketingRule, updateMarketingRule, deleteMarketingRule,
        pricingRules, addPricingRule, deletePricingRule,
        services, inventory, rooms
    } = useStore();
    const [isSending, setIsSending] = useState(false);
    const [showRuleForm, setShowRuleForm] = useState(false);
    const [showPricingForm, setShowPricingForm] = useState(false);
    const [newRule, setNewRule] = useState({ name: '', triggerType: 'low_package_balance', threshold: 3, messageTemplate: '', targetCategory: '' });
    const [newPricingRule, setNewPricingRule] = useState({ name: '', modifierPercent: 20, isActive: true });
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    const allCategories = Array.from(new Set([
        ...services.map(s => s.category),
        ...inventory.map(p => p.category),
        ...rooms.map(r => r.category)
    ].filter(Boolean)));

    const churnCount = customers.filter(c => c.isChurnRisk).length;

    const handleStartCampaign = (insight: AiInsight) => {
        setIsSending(true);
        setTimeout(() => {
            customers.filter(c => insight.category === 'growth' ? c.isChurnRisk : true).slice(0, 5).forEach(c => {
                sendNotification(c.id, 'WHATSAPP', insight.desc);
            });
            setIsSending(false);
            alert(`${insight.title} kampanyası başarıyla başlatıldı ve kuyruğa alındı.`);
        }, 1500);
    };

    const handleAddRule = async () => {
        if (!newRule.name || !newRule.messageTemplate) return;
        const finalCategory = showNewCategory ? newCategoryName : newRule.targetCategory;
        await addMarketingRule({ ...newRule, targetCategory: finalCategory } as any);
        setShowRuleForm(false);
        setNewRule({ name: '', triggerType: 'low_package_balance', threshold: 3, messageTemplate: '', targetCategory: '' });
        setShowNewCategory(false);
        setNewCategoryName("");
    };

    const handleAddPricing = async () => {
        if (!newPricingRule.name) return;
        await addPricingRule(newPricingRule as any);
        setShowPricingForm(false);
        setNewPricingRule({ name: '', modifierPercent: 20, isActive: true });
    };

    return (
        <div className="p-10 max-w-7xl mx-auto space-y-16 animate-[fadeIn_0.5s_ease]">
            {/* Header section with Stats */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8">
                <div>
                     <div className="flex items-center gap-3 mb-2">
                        <div className="w-12 h-12 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-white shadow-xl shadow-indigo-600/20">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h1 className="text-4xl font-black tracking-tighter italic uppercase text-gray-900">Aura Intelligence</h1>
                    </div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Akıllı Pazarlama & Dinamik İşletme Yönetimi</p>
                </div>

                <div className="flex gap-4">
                     <div className="bg-white px-8 py-5 rounded-[2rem] border border-gray-100 shadow-sm flex items-center gap-6">
                        <div className="text-center">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Dönüş Oranı</p>
                            <p className="text-xl font-black text-indigo-600 italic tracking-tighter">%14.2</p>
                        </div>
                        <div className="w-[1px] h-8 bg-gray-100" />
                        <div className="text-center">
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Kayıp Riski</p>
                            <p className="text-xl font-black text-red-500 italic tracking-tighter">{churnCount}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-12">
                    
                    {/* Marketing Automation Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic tracking-tighter uppercase text-gray-900 flex items-center gap-3">
                                <ShieldCheck className="w-6 h-6 text-indigo-600" /> Otomatik Pazarlama Kılavuzları
                            </h2>
                            <button 
                                onClick={() => setShowRuleForm(true)}
                                className="px-6 py-3 bg-indigo-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-lg shadow-indigo-600/20"
                            >
                                Yeni Kural Ekle
                            </button>
                        </div>

                        <AnimatePresence>
                            {showRuleForm && (
                                <motion.div 
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="bg-white border-2 border-indigo-100 rounded-[3rem] p-10 shadow-2xl relative z-20"
                                >
                                    <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter">İletişim Otomasyonu</h3>
                                        <button onClick={() => setShowRuleForm(false)} className="p-2 hover:bg-gray-100 rounded-full transition-all text-gray-400">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-6 mb-8">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 pl-1 italic">Kural Başlığı</label>
                                            <input 
                                                value={newRule.name}
                                                onChange={e => setNewRule({...newRule, name: e.target.value})}
                                                className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-black italic outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                                placeholder="Örn: Royal Doğum Günü"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 pl-1 italic">Tetikleyici</label>
                                            <select 
                                                value={newRule.triggerType}
                                                onChange={e => setNewRule({...newRule, triggerType: e.target.value})}
                                                className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-black italic outline-none appearance-none cursor-pointer"
                                            >
                                                <option value="low_package_balance">Düşük Paket Bakiyesi</option>
                                                <option value="birthday">Doğum Günü Kutlaması</option>
                                                <option value="churn_risk">Müşteri Geri Kazanım</option>
                                                <option value="category_purchase">Kategori Bazlı Satın Alım</option>
                                            </select>
                                        </div>
                                    </div>

                                    {(newRule.triggerType === 'category_purchase' || newRule.triggerType === 'low_package_balance') && (
                                        <div className="mb-8 space-y-2">
                                            <label className="text-[10px] font-black uppercase text-gray-400 pl-1 italic">Hedef Kategori</label>
                                            {!showNewCategory ? (
                                                <select 
                                                    value={newRule.targetCategory}
                                                    onChange={e => {
                                                        if (e.target.value === 'ADD_NEW') setShowNewCategory(true);
                                                        else setNewRule({...newRule, targetCategory: e.target.value});
                                                    }}
                                                    className="w-full bg-gray-50 border-none rounded-2xl p-5 text-sm font-black italic outline-none appearance-none cursor-pointer"
                                                >
                                                    <option value="">Tüm Kategoriler</option>
                                                    {allCategories.map(cat => (
                                                        <option key={cat} value={cat}>{cat}</option>
                                                    ))}
                                                    <option value="ADD_NEW" className="text-indigo-600 font-black">+ Yeni Kategori Ekle</option>
                                                </select>
                                            ) : (
                                                <div className="flex gap-2">
                                                    <input 
                                                        autoFocus
                                                        className="flex-1 bg-gray-50 border-none rounded-2xl p-5 text-sm font-black italic outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                                        placeholder="Kategori Adı..."
                                                        value={newCategoryName}
                                                        onChange={e => setNewCategoryName(e.target.value)}
                                                    />
                                                    <button 
                                                        onClick={() => setShowNewCategory(false)}
                                                        className="px-6 bg-gray-100 rounded-2xl text-[10px] font-black"
                                                    >
                                                        VAZGEÇ
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    <div className="space-y-2 mb-8">
                                        <label className="text-[10px] font-black uppercase text-gray-400 pl-1 italic">Mesaj Taslağı</label>
                                        <textarea 
                                            value={newRule.messageTemplate}
                                            onChange={e => setNewRule({...newRule, messageTemplate: e.target.value})}
                                            className="w-full bg-gray-50 border-none rounded-[2rem] p-6 text-sm font-black italic min-h-[140px] outline-none"
                                            placeholder="Sayın {customer_name}, doğum gününüz kutlu olsun! Size özel %20 indirim tanımladık..."
                                        />
                                    </div>
                                    <button 
                                        onClick={handleAddRule}
                                        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/20 active:scale-95 transition-all"
                                    >
                                        Kuralı Sisteme İşle
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {marketingRules.map(rule => (
                                <div key={rule.id} className="bg-white border border-gray-100 rounded-[3rem] p-8 shadow-sm group hover:border-indigo-200 transition-all relative overflow-hidden">
                                    <div className="flex justify-between items-start mb-6">
                                        <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                            <MessageSquare className="w-6 h-6" />
                                        </div>
                                        <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => deleteMarketingRule(rule.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                                        </div>
                                    </div>
                                    <h4 className="text-lg font-black italic tracking-tighter uppercase text-gray-900 mb-1">{rule.name}</h4>
                                    <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">• AKTİF ÇALIŞIYOR</p>
                                    <p className="text-xs font-bold text-gray-400 mt-4 leading-relaxed italic line-clamp-2">“{rule.messageTemplate}”</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Dynamic Pricing AI Section */}
                    <section className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-black italic tracking-tighter uppercase text-gray-900 flex items-center gap-3">
                                <DollarSign className="w-6 h-6 text-indigo-600" /> Dinamik Fiyatlandırma Motoru
                            </h2>
                            <button 
                                onClick={() => setShowPricingForm(true)}
                                className="px-6 py-3 bg-black text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-800 transition"
                            >
                                Kural Tanımla
                            </button>
                        </div>

                        <AnimatePresence>
                             {showPricingForm && (
                                <motion.div 
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: 20 }}
                                    className="bg-[#121212] border-2 border-indigo-900 rounded-[3rem] p-10 shadow-2xl text-white"
                                >
                                     <div className="flex justify-between items-center mb-8">
                                        <h3 className="text-xl font-black italic uppercase tracking-tighter">Fiyatlandırma Zekası</h3>
                                        <button onClick={() => setShowPricingForm(false)} className="p-2 hover:bg-white/10 rounded-full transition-all text-white/40">
                                            <X className="w-6 h-6" />
                                        </button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-8 mb-8">
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black uppercase text-white/40 pl-1 tracking-[0.2em]">Kural Adı</label>
                                            <input 
                                                value={newPricingRule.name}
                                                onChange={e => setNewPricingRule({...newPricingRule, name: e.target.value})}
                                                className="w-full bg-white/5 border-none rounded-2xl p-5 text-sm font-black italic outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
                                                placeholder="Örn: Hafta Sonu Premium"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-[9px] font-black uppercase text-white/40 pl-1 tracking-[0.2em]">Fiyat Değiştirici (%)</label>
                                            <div className="flex items-center gap-4">
                                                <input 
                                                    type="range"
                                                    min="-50" max="100"
                                                    value={newPricingRule.modifierPercent}
                                                    onChange={e => setNewPricingRule({...newPricingRule, modifierPercent: parseInt(e.target.value)})}
                                                    className="flex-1 accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                                />
                                                <span className="text-xl font-black italic min-w-[3rem] text-indigo-400">%{newPricingRule.modifierPercent}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <button 
                                        onClick={handleAddPricing}
                                        className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-600/30 active:scale-95 transition-all"
                                    >
                                        Zekayı Aktifleştir
                                    </button>
                                </motion.div>
                             )}
                        </AnimatePresence>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {pricingRules.map(rule => (
                                <div key={rule.id} className="bg-[#FBFCFF] border border-gray-100 rounded-[3rem] p-8 shadow-sm relative group overflow-hidden">
                                     <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform">
                                        <Clock size={80} className="text-indigo-600 uppercase" />
                                    </div>
                                    <div className="flex justify-between items-center mb-6">
                                        <div className={`px-4 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border ${
                                            rule.modifierPercent > 0 ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                        }`}>
                                            {rule.modifierPercent > 0 ? 'Artış Uygulanıyor' : 'İndirim Uygulanıyor'}
                                        </div>
                                        <button onClick={() => deletePricingRule(rule.id)} className="p-2 text-gray-200 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4" /></button>
                                    </div>
                                    <h4 className="text-xl font-black italic tracking-tighter uppercase text-indigo-950 mb-1">{rule.name}</h4>
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Global Fiyat Motoru: %{rule.modifierPercent}</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>

                {/* Loyalty & Communication Log */}
                <div className="space-y-12">
                    
                    {/* Loyalty Configuration */}
                    <section className="bg-white border-2 border-indigo-100 rounded-[3.5rem] p-10 shadow-xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-8 opacity-5">
                            <Gift size={120} className="text-indigo-600" />
                        </div>
                        <div className="relative z-10">
                            <h3 className="text-xl font-black italic tracking-tighter uppercase italic text-gray-900 mb-8 flex items-center gap-3">
                                <Gift className="w-6 h-6 text-indigo-600" /> Loyalty Ayarları
                            </h3>
                            <div className="space-y-8">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Kazanılan Puan Oranı</p>
                                        <span className="text-xl font-black italic text-indigo-600">%5</span>
                                    </div>
                                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600 w-[20%]" />
                                    </div>
                                    <p className="text-[9px] font-bold text-gray-400 italic">Harcanan her ₺100 için 5 puan kazanılır.</p>
                                </div>

                                <div className="space-y-4">
                                     <div className="flex justify-between items-end">
                                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Harcanabilir Minimum Puan</p>
                                        <span className="text-xl font-black italic text-indigo-600">500</span>
                                    </div>
                                    <div className="h-2 bg-gray-50 rounded-full overflow-hidden">
                                        <div className="h-full bg-indigo-600 w-[50%]" />
                                    </div>
                                </div>

                                <button className="w-full py-5 bg-black text-white rounded-[2rem] font-black text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all">
                                    Loyalty Motorunu Güncelle
                                </button>
                            </div>
                        </div>
                    </section>

                    {/* Communication Log */}
                    <section className="space-y-6">
                        <h2 className="text-xl font-black italic tracking-tighter uppercase text-gray-900 flex items-center gap-3">
                            <Smartphone className="w-6 h-6 text-gray-400" /> İletişim Akışı
                        </h2>
                        <div className="bg-[#FBFCFF] border border-gray-100 rounded-[3rem] p-8 shadow-sm h-[500px] overflow-y-auto no-scrollbar space-y-8">
                            {allNotifs.map(notif => (
                                <div key={notif.id} className="relative pl-8 border-l-2 border-indigo-100 group transition-all">
                                    <div className="absolute -left-[7px] top-0 w-3 h-3 bg-white border-2 border-indigo-600 rounded-full group-hover:bg-indigo-600 transition-all" />
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="text-[9px] font-black text-indigo-600 uppercase tracking-widest">{notif.type}</span>
                                        <span className="text-[8px] font-black text-gray-300 uppercase italic">AURA-BOT ID: BK{notif.id.slice(0,3).toUpperCase()}</span>
                                    </div>
                                    <p className="text-xs font-black italic text-gray-900 uppercase italic leading-tight">
                                        {customers.find(c => c.id === notif.customerId)?.name || 'Gizli Müşteri'}
                                    </p>
                                    <p className="text-[11px] text-gray-400 font-bold leading-relaxed italic mt-2 line-clamp-2">“{notif.content}”</p>
                                </div>
                            ))}
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}
