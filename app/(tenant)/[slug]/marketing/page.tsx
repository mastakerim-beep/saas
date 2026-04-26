"use client";

import { useStore, AiInsight, NotificationLog, LoyaltySettings, Webhook } from '@/lib/store';
import { 
    Zap, Sparkles, MessageSquare, 
    Send, Calendar, Users, 
    TrendingUp, ShieldCheck, 
    Smartphone, Mail, CheckCircle2,
    RefreshCcw, ArrowRight, Dna,
    Clock, DollarSign, Gift,
    Plus, Trash2, Edit3, X,
    Globe, Link, Bot, Activity,
    ChevronRight, Terminal, Lock
} from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MarketingPage() {
    const { 
        aiInsights, customers, allNotifs, sendNotification,
        marketingRules, addMarketingRule, updateMarketingRule, deleteMarketingRule,
        pricingRules, addPricingRule, deletePricingRule,
        services, inventory, rooms,
        loyaltySettings, updateLoyaltySettings,
        webhooks, addWebhook, deleteWebhook
    } = useStore();

    const [activeTab, setActiveTab] = useState<'automation' | 'loyalty' | 'integrations'>('automation');
    const [isSavingLoyalty, setIsSavingLoyalty] = useState(false);
    
    // Forms
    const [showRuleForm, setShowRuleForm] = useState(false);
    const [showPricingForm, setShowPricingForm] = useState(false);
    const [showWebhookForm, setShowWebhookForm] = useState(false);
    
    const [newRule, setNewRule] = useState({ name: '', triggerType: 'low_package_balance', threshold: 3, messageTemplate: '', targetCategory: '' });
    const [newPricingRule, setNewPricingRule] = useState({ name: '', modifierPercent: 20, isActive: true });
    const [newWebhook, setNewWebhook] = useState({ name: '', url: '', events: ['appointment.created'] });
    
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState("");

    // Statistics Calculation
    const stats = useMemo(() => {
        const churn = customers.filter((c: any) => c.isChurnRisk).length;
        const total = customers.length;
        const conversion = total > 0 ? ((total - churn) / total * 100).toFixed(1) : '0';
        return { churn, total, conversion };
    }, [customers]);

    const allCategories = useMemo(() => Array.from(new Set([
        ...services.map((s: any) => s.category),
        ...inventory.map((p: any) => p.category),
        ...rooms.map((r: any) => r.category)
    ].filter(Boolean))), [services, inventory, rooms]);

    const handleAddRule = async () => {
        if (!newRule.name || !newRule.messageTemplate) return;
        const finalCategory = showNewCategory ? newCategoryName : newRule.targetCategory;
        await addMarketingRule({ ...newRule, targetCategory: finalCategory } as any);
        setShowRuleForm(false);
        setNewRule({ name: '', triggerType: 'low_package_balance', threshold: 3, messageTemplate: '', targetCategory: '' });
        setShowNewCategory(false);
        setNewCategoryName("");
    };

    const handleAddWebhook = async () => {
        if (!newWebhook.name || !newWebhook.url) return;
        await addWebhook({ ...newWebhook, isActive: true });
        setShowWebhookForm(false);
        setNewWebhook({ name: '', url: '', events: ['appointment.created'] });
    };

    const handleUpdateLoyalty = async (val: Partial<LoyaltySettings>) => {
        setIsSavingLoyalty(true);
        await updateLoyaltySettings(val);
        setTimeout(() => setIsSavingLoyalty(false), 500);
    };

    return (
        <div className="p-8 lg:p-12 max-w-[1600px] mx-auto space-y-12 animate-[fadeIn_0.5s_ease] pb-20">
            {/* Header section with Stats */}
            <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 bg-white/40 backdrop-blur-xl p-10 rounded-[3rem] border border-white/60 shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-12 opacity-5 pointer-events-none">
                    <Dna className="w-64 h-64 text-indigo-600 animate-pulse" />
                </div>
                <div className="relative z-10">
                    <div className="flex items-center gap-4 mb-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-indigo-600 to-violet-600 rounded-[2rem] flex items-center justify-center text-white shadow-2xl shadow-indigo-600/30">
                            <Zap className="w-8 h-8" />
                        </div>
                        <div>
                            <h1 className="text-5xl font-black tracking-tighter italic uppercase text-gray-900 leading-tight">Aura Intelligence</h1>
                            <p className="text-[11px] font-black text-indigo-600 uppercase tracking-[0.3em] ml-1">Akıllı Pazarlama & Dinamik İşletme Yönetimi</p>
                        </div>
                    </div>
                </div>

                <div className="flex flex-wrap gap-4 relative z-10">
                    <div className="bg-white/80 px-10 py-6 rounded-[2.5rem] border border-white shadow-xl flex items-center gap-8">
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Dönüş Oranı</p>
                            <p className="text-3xl font-black text-indigo-600 italic tracking-tighter">%{stats.conversion}</p>
                        </div>
                        <div className="w-[1px] h-10 bg-gray-100" />
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Kayıp Riski</p>
                            <p className="text-3xl font-black text-rose-500 italic tracking-tighter">{stats.churn}</p>
                        </div>
                        <div className="w-[1px] h-10 bg-gray-100" />
                        <div className="text-center">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 italic">Aktif Kurallar</p>
                            <p className="text-3xl font-black text-gray-900 italic tracking-tighter">{marketingRules.length + pricingRules.length}</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation Tabs */}
            <nav className="flex gap-2 p-2 bg-gray-100/50 backdrop-blur rounded-[2rem] w-fit">
                {(['automation', 'loyalty', 'integrations'] as const).map(tab => (
                    <button
                        key={tab}
                        onClick={() => setActiveTab(tab)}
                        className={`px-8 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all ${
                            activeTab === tab 
                            ? 'bg-white text-indigo-600 shadow-xl shadow-indigo-500/10' 
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                    >
                        {tab === 'automation' && <span className="flex items-center gap-2"><Send size={14} /> Otomasyonlar</span>}
                        {tab === 'loyalty' && <span className="flex items-center gap-2"><Gift size={14} /> Sadakat (Loyalty)</span>}
                        {tab === 'integrations' && <span className="flex items-center gap-2"><Globe size={14} /> Entegrasyonlar</span>}
                    </button>
                ))}
            </nav>

            <main className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-12">
                    <AnimatePresence mode="wait">
                        {/* Tab Content: Automation */}
                        {activeTab === 'automation' && (
                            <motion.div 
                                key="automation" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className="space-y-12"
                            >
                                {/* Marketing Rules section */}
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900 flex items-center gap-3">
                                                <ShieldCheck className="w-8 h-8 text-indigo-600" /> Otomatik Pazarlama Kılavuzları
                                            </h2>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">MÜŞTERİ DAVRANIŞLARINA GÖRE TETİKLENEN AKSİYONLAR</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowRuleForm(true)}
                                            className="px-8 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-indigo-700 transition shadow-2xl shadow-indigo-600/20 active:scale-95 flex items-center gap-2"
                                        >
                                            <Plus size={16} /> Yeni Kural
                                        </button>
                                    </div>

                                    {/* Rule Form Modal */}
                                    <AnimatePresence>
                                        {showRuleForm && (
                                            <motion.div 
                                                initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
                                                className="bg-white border-2 border-indigo-100 rounded-[3.5rem] p-10 shadow-2xl relative z-20"
                                            >
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black uppercase text-gray-400 pl-1">Kural Adı</label>
                                                        <input 
                                                            value={newRule.name}
                                                            onChange={e => setNewRule({...newRule, name: e.target.value})}
                                                            className="w-full bg-gray-50 border-none rounded-2xl p-6 text-sm font-black italic outline-none focus:ring-4 focus:ring-indigo-100 transition-all"
                                                            placeholder="Örn: VIP Doğum Günü"
                                                        />
                                                    </div>
                                                    <div className="space-y-3">
                                                        <label className="text-[10px] font-black uppercase text-gray-400 pl-1">Tetikleyici</label>
                                                        <select 
                                                            value={newRule.triggerType}
                                                            onChange={e => setNewRule({...newRule, triggerType: e.target.value})}
                                                            className="w-full bg-gray-50 border-none rounded-2xl p-6 text-sm font-black italic outline-none cursor-pointer"
                                                        >
                                                            <option value="low_package_balance">Düşük Paket Bakiyesi</option>
                                                            <option value="birthday">Doğum Günü Kutlaması</option>
                                                            <option value="churn_risk">Müşteri Geri Kazanım</option>
                                                            <option value="category_purchase">Kategori Bazlı Satın Alım</option>
                                                        </select>
                                                    </div>
                                                </div>
                                                <div className="mb-8">
                                                    <label className="text-[10px] font-black uppercase text-gray-400 pl-1 block mb-3">Mesaj Şablonu (WhatsApp)</label>
                                                    <textarea 
                                                        value={newRule.messageTemplate}
                                                        onChange={e => setNewRule({...newRule, messageTemplate: e.target.value})}
                                                        className="w-full bg-gray-50 border-none rounded-[2.5rem] p-8 text-sm font-black italic min-h-[160px] outline-none"
                                                        placeholder="Merhaba {customer_name}, size özel bir teklifimiz var..."
                                                    />
                                                </div>
                                                <div className="flex gap-4">
                                                    <button onClick={handleAddRule} className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl">KAYDET VE AKTİFLEŞTİR</button>
                                                    <button onClick={() => setShowRuleForm(false)} className="px-10 py-5 bg-gray-100 text-gray-400 rounded-[2rem] font-black text-xs uppercase tracking-widest">VAZGEÇ</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                        {/* AI Sales Pilot Card */}
                                        <Link href="ai-sales" className="bg-gradient-to-br from-indigo-700 to-indigo-900 border border-indigo-400/20 rounded-[3.5rem] p-10 shadow-2xl group hover:scale-[1.02] transition-all relative overflow-hidden">
                                            <div className="absolute top-0 right-0 p-10 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <Bot size={100} />
                                            </div>
                                            <div className="flex justify-between items-start mb-8 relative z-10">
                                                <div className="w-14 h-14 bg-white/10 backdrop-blur-md text-white rounded-2xl flex items-center justify-center border border-white/10">
                                                    <Zap className="w-8 h-8" />
                                                </div>
                                                <div className="px-4 py-1.5 bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-tighter shadow-lg shadow-emerald-500/20">
                                                    PREMIUM AI
                                                </div>
                                            </div>
                                            <h4 className="text-2xl font-black italic tracking-tighter uppercase text-white mb-2 relative z-10">AI Sales Pilot</h4>
                                            <div className="flex items-center gap-3 relative z-10">
                                                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                                                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">OTOPİLOT HAZIR</p>
                                            </div>
                                            <p className="text-sm font-bold text-indigo-100/60 mt-6 leading-relaxed italic relative z-10">Kayıp (churn) riski taşıyan VIP'leri tespit eder ve WhatsApp üzerinden geri kazanım kampanyaları başlatır.</p>
                                            
                                            <div className="mt-10 pt-8 border-t border-white/5 flex justify-between items-center relative z-10">
                                                <span className="text-[10px] font-black text-indigo-200 uppercase tracking-[0.2em] italic">Yönetmek için tıklayın</span>
                                                <ChevronRight className="text-white opacity-40 group-hover:opacity-100 group-hover:translate-x-2 transition-all" size={20} />
                                            </div>
                                        </Link>

                                        {marketingRules.map((rule: any) => (
                                            <div key={rule.id} className="bg-white border border-gray-100 rounded-[3.5rem] p-10 shadow-sm group hover:border-indigo-200 transition-all relative overflow-hidden">
                                                <div className="flex justify-between items-start mb-8">
                                                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                                                        <Bot className="w-8 h-8" />
                                                    </div>
                                                    <button onClick={() => deleteMarketingRule(rule.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                                </div>
                                                <h4 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900 mb-2">{rule.name}</h4>
                                                <div className="flex items-center gap-3">
                                                    <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                                                    <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">OTOMATİK ÇALIŞIYOR</p>
                                                </div>
                                                <p className="text-sm font-bold text-gray-400 mt-6 leading-relaxed italic line-clamp-3">“{rule.messageTemplate}”</p>
                                                
                                                <div className="mt-10 pt-8 border-t border-gray-50 flex justify-between items-center">
                                                    <div className="flex -space-x-3">
                                                        {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full bg-gray-100 border-2 border-white" />)}
                                                        <div className="w-8 h-8 rounded-full bg-indigo-50 border-2 border-white flex items-center justify-center text-[10px] font-black text-indigo-600">+12</div>
                                                    </div>
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">BU AY 84 KİŞİYE ULAŞTI</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* Tab Content: Loyalty */}
                        {activeTab === 'loyalty' && (
                            <motion.div 
                                key="loyalty" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className="space-y-12"
                            >
                                <section className="bg-white border border-gray-100 shadow-2xl shadow-indigo-500/5 rounded-[4rem] p-14 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-20 opacity-[0.03] pointer-events-none">
                                        <Gift className="w-96 h-96 text-indigo-600" />
                                    </div>
                                    <div className="relative z-10 max-w-2xl">
                                        <div className="flex items-center gap-4 mb-10">
                                            <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-[2rem] flex items-center justify-center shadow-lg shadow-rose-100">
                                                <Gift size={32} />
                                            </div>
                                            <div>
                                                <h2 className="text-3xl font-black italic tracking-tighter uppercase text-gray-900">Loyalty (Sadakat) Motoru</h2>
                                                <div className="flex items-center gap-2">
                                                    <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">MÜŞTERİLERİNİZE HARCADIKÇA KAZANDIRIN</p>
                                                    {isSavingLoyalty && (
                                                        <span className="flex items-center gap-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 rounded-md text-[8px] font-black animate-pulse">
                                                            <RefreshCcw size={8} className="animate-spin" /> KAYDEDİLİYOR
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-12 mb-12">
                                            <div className="space-y-6">
                                                <div className="flex justify-between items-end">
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Kazanılan Puan Oranı</p>
                                                        <p className="text-[10px] font-bold text-gray-400">Harcanan her ₺100 için kazanılacak puan miktarı.</p>
                                                    </div>
                                                    <span className="text-4xl font-black italic text-indigo-600">%{loyaltySettings?.pointsPerCurrency || 5}</span>
                                                </div>
                                                <input 
                                                    type="range" min="1" max="20" 
                                                    value={loyaltySettings?.pointsPerCurrency || 5} 
                                                    onChange={e => handleUpdateLoyalty({ pointsPerCurrency: parseInt(e.target.value) })}
                                                    className="w-full accent-indigo-600 h-2 bg-gray-100 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>

                                            <div className="space-y-6">
                                                <div className="flex justify-between items-end">
                                                    <div className="space-y-1">
                                                        <p className="text-[11px] font-black text-gray-800 uppercase tracking-widest">Minimum Harcanabilir Puan</p>
                                                        <p className="text-[10px] font-bold text-gray-400">Müşterinin puanını kullanabilmesi için gereken alt limit.</p>
                                                    </div>
                                                    <span className="text-4xl font-black italic text-indigo-600">{loyaltySettings?.minPointsToSpend || 500}</span>
                                                </div>
                                                <input 
                                                    type="range" min="100" max="2000" step="100" 
                                                    value={loyaltySettings?.minPointsToSpend || 500} 
                                                    onChange={e => handleUpdateLoyalty({ minPointsToSpend: parseInt(e.target.value) })}
                                                    className="w-full accent-indigo-600 h-2 bg-gray-100 rounded-full appearance-none cursor-pointer"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-6 p-8 bg-indigo-50/50 rounded-[2.5rem] border border-indigo-100">
                                            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-sm">
                                                <Activity size={24} />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1 italic">Sadakat Durumu</p>
                                                <p className="text-xs font-bold text-gray-500 leading-relaxed italic">Şu anda müşterileriniz her harcamalarında puan kazanıyor. Bu puanları randevu ödemelerinde nakit indirimi olarak kullanabilirler.</p>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <p className="text-[10px] font-black italic uppercase text-indigo-600">AKTİF</p>
                                                <button 
                                                    onClick={() => handleUpdateLoyalty({ isEnabled: !loyaltySettings?.isEnabled })}
                                                    className={`w-14 h-8 rounded-full transition-all relative ${loyaltySettings?.isEnabled ? 'bg-indigo-600' : 'bg-gray-200'}`}
                                                >
                                                    <div className={`absolute top-1 w-6 h-6 bg-white rounded-full transition-all ${loyaltySettings?.isEnabled ? 'right-1' : 'left-1 shadow-md'}`} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}

                        {/* Tab Content: Integrations */}
                        {activeTab === 'integrations' && (
                            <motion.div 
                                key="integrations" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}
                                className="space-y-12"
                            >
                                <section className="space-y-8">
                                    <div className="flex items-center justify-between">
                                        <div className="space-y-1">
                                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900 flex items-center gap-3">
                                                <Globe className="w-8 h-8 text-indigo-600" /> Bağlantılar & Webhooklar
                                            </h2>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">N8N, WHATSAPP BOT VE DİĞER HARİCİ SİSTEMLER İÇİN VERİ AKIŞI</p>
                                        </div>
                                        <button 
                                            onClick={() => setShowWebhookForm(true)}
                                            className="px-8 py-4 bg-black text-white rounded-[1.5rem] text-[11px] font-black uppercase tracking-widest hover:bg-gray-800 transition flex items-center gap-2"
                                        >
                                            <Plus size={16} /> Webhook Ekle
                                        </button>
                                    </div>

                                    <AnimatePresence>
                                        {showWebhookForm && (
                                            <motion.div 
                                                initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
                                                className="bg-[#121212] border-2 border-indigo-900 rounded-[3.5rem] p-12 shadow-2xl text-white outline-none"
                                            >
                                                <div className="flex justify-between items-center mb-10">
                                                    <h3 className="text-2xl font-black italic uppercase tracking-tighter">Yeni Bağlantı Tanımla</h3>
                                                    <button onClick={() => setShowWebhookForm(false)} className="p-3 hover:bg-white/10 rounded-full transition-all text-white/40"><X size={24}/></button>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-10 mb-10">
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black uppercase text-white/40 pl-1 tracking-[0.2em] italic">Servis Adı</label>
                                                        <input 
                                                            value={newWebhook.name}
                                                            onChange={e => setNewWebhook({...newWebhook, name: e.target.value})}
                                                            className="w-full bg-white/5 border-none rounded-3xl p-6 text-sm font-black italic outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
                                                            placeholder="Örn: n8n WhatsApp Bot"
                                                        />
                                                    </div>
                                                    <div className="space-y-4">
                                                        <label className="text-[10px] font-black uppercase text-white/40 pl-1 tracking-[0.2em] italic">Hedef URL (Webhook Endpoint)</label>
                                                        <input 
                                                            value={newWebhook.url}
                                                            onChange={e => setNewWebhook({...newWebhook, url: e.target.value})}
                                                            className="w-full bg-white/5 border-none rounded-3xl p-6 text-sm font-black italic outline-none focus:bg-white/10 transition-all placeholder:text-white/20"
                                                            placeholder="https://n8n.example.com/webhook/..."
                                                        />
                                                    </div>
                                                </div>
                                                <div className="flex gap-4">
                                                    <button onClick={handleAddWebhook} className="flex-1 py-5 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl">BAĞLANTIYI OLUŞTUR</button>
                                                </div>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <div className="grid grid-cols-1 gap-6">
                                        {webhooks.length === 0 && !showWebhookForm && (
                                            <div className="p-16 border-2 border-dashed border-gray-100 rounded-[4rem] text-center space-y-4 bg-gray-50/50">
                                                <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center mx-auto text-gray-200 shadow-sm">
                                                    <Link size={32} />
                                                </div>
                                                <p className="text-xl font-black italic text-gray-400 uppercase tracking-tighter">Henüz bir entegrasyon tanımlanmamış</p>
                                                <p className="text-xs font-bold text-gray-300 italic">n8n veya WhatsApp botunuzu bağlamak için Webhook ekleyin.</p>
                                            </div>
                                        )}
                                        {webhooks.map((wh: any) => (
                                            <div key={wh.id} className="bg-white border border-gray-100 rounded-[3rem] p-10 flex items-center gap-10 group hover:border-indigo-200 transition-all">
                                                <div className="w-20 h-20 bg-gray-50 rounded-[2rem] flex items-center justify-center text-gray-300 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                                                    <Link size={32} />
                                                </div>
                                                <div className="flex-1">
                                                    <h4 className="text-2xl font-black italic text-gray-900 italic tracking-tighter uppercase mb-2">{wh.name}</h4>
                                                    <div className="flex items-center gap-4 text-xs font-bold text-gray-400">
                                                        <span className="flex items-center gap-2"><Globe size={14} /> {new URL(wh.url).hostname}</span>
                                                        <span className="w-1 h-1 bg-gray-200 rounded-full" />
                                                        <span className="text-emerald-500 flex items-center gap-1"><Activity size={12} /> AKTİF</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-3">
                                                    <button className="px-6 py-3 bg-gray-50 text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-gray-100 transition-all italic flex items-center gap-2 text-gray-600">TEST GÖNDER <ChevronRight size={14}/></button>
                                                    <button onClick={() => deleteWebhook(wh.id)} className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"><Trash2 size={18} /></button>
                                                </div>
                                            </div>
                                        ))}

                                        {/* Integration Examples Card */}
                                        <div className="bg-indigo-600 rounded-[4rem] p-14 text-white relative overflow-hidden shadow-2xl shadow-indigo-600/20">
                                            <div className="absolute top-0 right-0 p-16 opacity-10 pointer-events-none">
                                                <Bot className="w-64 h-64" />
                                            </div>
                                            <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                                                <div className="space-y-8">
                                                    <h3 className="text-4xl font-black italic tracking-tighter uppercase italic leading-tight">Gelişmiş AI Bot & WhatsApp Otomasyonu</h3>
                                                    <p className="text-lg font-bold opacity-80 leading-relaxed italic">Aura Intelligence, n8n altyapısını kullanarak müşterilerinizle 7/24 WhatsApp üzerinden iletişim kurabilir. Randevu teyitleri, iptal bildirimleri ve hatta bot üzerinden randevu alma özellikleri için Webhooklarımızı kullanın.</p>
                                                    <div className="flex flex-wrap gap-4 pt-4">
                                                        {['n8n Entegrasyonu', 'WhatsApp Pro', 'Zapier', 'Custom API'].map(tag => (
                                                            <span key={tag} className="px-6 py-3 bg-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest border border-white/10">{tag}</span>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="bg-black/20 backdrop-blur-xl rounded-[3rem] p-10 border border-white/10 space-y-6">
                                                     <div className="flex items-center gap-4 mb-4">
                                                        <Terminal size={24} className="text-indigo-300" />
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-200">Webhook Veri Yapısı (JSON)</p>
                                                     </div>
                                                     <div className="bg-black/30 rounded-2xl p-6 font-mono text-[11px] text-indigo-200 leading-relaxed overflow-hidden">
                                                        <p>{"{"}</p>
                                                        <p className="pl-6">"event": "appointment.created",</p>
                                                        <p className="pl-6">"customer": "Ayşe Kaya",</p>
                                                        <p className="pl-6">"phone": "+90500...",</p>
                                                        <p className="pl-6">"service": "Medikal Masaj",</p>
                                                        <p className="pl-12">"time": "14:30"</p>
                                                        <p>{"}"}</p>
                                                     </div>
                                                     <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-50 transition-all flex items-center justify-center gap-3 shadow-xl shadow-black/20">DOKÜMANTASYONU AÇ <ChevronRight size={16}/></button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </section>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Communication Log & Insights */}
                <aside className="lg:col-span-4 space-y-12">
                    
                    {/* Insights from AI */}
                    <section className="bg-white border-2 border-indigo-100 rounded-[3.5rem] p-10 shadow-xl space-y-8">
                         <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black italic tracking-tighter uppercase text-gray-900">AI Tavsiyeleri</h3>
                                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest italic">AURA ENGINE TARAFINDAN ÖNERİLDİ</p>
                            </div>
                         </div>
                         <div className="space-y-6">
                            {aiInsights.slice(0, 3).map((insight: any, idx: number) => (
                                <div key={idx} className="p-6 bg-gray-50/50 rounded-[2rem] border border-transparent hover:border-indigo-100 hover:bg-white transition-all group">
                                    <div className="flex justify-between items-start mb-2">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest italic">{insight.title}</p>
                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-indigo-600 group-hover:translate-x-1 transition-all" />
                                    </div>
                                    <p className="text-sm font-bold text-gray-500 leading-snug italic line-clamp-2">“{insight.desc}”</p>
                                </div>
                            ))}
                         </div>
                    </section>

                    {/* Communication Log */}
                    <section className="space-y-8">
                        <div className="flex items-center gap-4 pl-2">
                            <Smartphone className="w-8 h-8 text-indigo-600" />
                            <h2 className="text-2xl font-black italic tracking-tighter uppercase text-gray-900">İletişim Akışı</h2>
                        </div>
                        <div className="bg-white/60 backdrop-blur-xl border border-gray-100 rounded-[3.5rem] p-10 shadow-xl h-[600px] overflow-y-auto no-scrollbar space-y-10 relative">
                            {allNotifs.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-center p-10 space-y-4">
                                    <Activity className="w-12 h-12 text-gray-200" />
                                    <p className="text-xs font-black text-gray-300 uppercase tracking-widest italic">İletişim akışı henüz boş</p>
                                </div>
                            )}
                            {allNotifs.map((notif: any) => (
                                <div key={notif.id} className="relative pl-10 border-l-2 border-indigo-100/50 group transition-all">
                                    <div className="absolute -left-[11px] top-0 w-5 h-5 bg-white border-2 border-indigo-600 rounded-full group-hover:scale-125 group-hover:bg-indigo-600 group-hover:border-indigo-600 transition-all z-10" />
                                    <div className="flex justify-between items-start mb-3">
                                        <span className={`px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${
                                            notif.type === 'WHATSAPP' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                        }`}>
                                            {notif.type}
                                        </span>
                                        <span className="text-[8px] font-black text-gray-300 uppercase italic">BK{notif.id.slice(0,3).toUpperCase()}</span>
                                    </div>
                                    <p className="text-base font-black italic text-gray-900 uppercase italic leading-none mb-3">
                                        {customers.find((c: any) => c.id === notif.customerId)?.name || 'Eski Müşteri'}
                                    </p>
                                    <p className="text-sm font-bold text-gray-400 italic leading-relaxed line-clamp-3 bg-gray-50/50 p-4 rounded-2xl border border-transparent group-hover:border-indigo-50 transition-all">“{notif.content}”</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Security Badge */}
                    <div className="p-8 bg-gray-50 border border-gray-100 rounded-[2.5rem] flex items-center gap-6">
                        <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-gray-400">
                            <Lock size={28} />
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-gray-900 uppercase tracking-widest mb-1 italic">Veri Güvenliği</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase italic tracking-widest">Tüm otomasyonlar AES-256 ile şifrelenir.</p>
                        </div>
                    </div>
                </aside>
            </main>
        </div>
    );
}
