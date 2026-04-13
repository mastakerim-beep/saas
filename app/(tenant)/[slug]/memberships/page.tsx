"use client";

import { useStore, MembershipPlan } from '@/lib/store';
import { 
    Zap, Star, Award, ShieldCheck, 
    Plus, CreditCard, Users, 
    ChevronRight, CheckCircle2, 
    Settings, Crown, Calendar, X,
    ArrowRight
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function MembershipsPage() {
    const { membershipPlans, customerMemberships, customers, assignMembership, addMembershipPlan } = useStore();
    const [selectedTab, setSelectedTab] = useState<'plans' | 'members'>('plans');

    // Modals
    const [isNewPlanOpen, setIsNewPlanOpen] = useState(false);
    const [isAssignOpen, setIsAssignOpen] = useState(false);

    // New Plan Form State
    const [newPlan, setNewPlan] = useState({ name: '', price: '', sessions: '', benefits: '' });

    // Assign Form State
    const [assignCustomer, setAssignCustomer] = useState('');
    const [assignPlan, setAssignPlan] = useState('');

    const handleCreatePlan = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPlan.name || !newPlan.price || !newPlan.sessions) return;
        addMembershipPlan({
            name: newPlan.name,
            price: Number(newPlan.price),
            sessionsPerMonth: Number(newPlan.sessions),
            periodDays: 30, // Default 1 month
            benefits: newPlan.benefits.split(',').map(b => b.trim()).filter(b => b),
            allowedServices: ['all']
        });
        setIsNewPlanOpen(false);
        setNewPlan({ name: '', price: '', sessions: '', benefits: '' });
    };

    const handleAssign = (e: React.FormEvent) => {
        e.preventDefault();
        if (!assignCustomer || !assignPlan) return;
        assignMembership(assignCustomer, assignPlan);
        setIsAssignOpen(false);
        setAssignCustomer('');
        setAssignPlan('');
        setSelectedTab('members');
    };

    return (
        <div className="p-4 md:p-8 max-w-[1200px] mx-auto animate-[fadeIn_0.3s_ease] space-y-10 font-sans">
            <div className="flex flex-col md:flex-row md:justify-between md:items-end gap-6 mb-10">
                <div>
                    <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-gray-900">Abonelik & Sadakat Sistemi</h1>
                    <p className="text-gray-500 text-xs md:text-sm font-semibold flex items-center gap-2">
                        <Crown className="w-4 h-4 text-amber-500" /> İşletmeniz için aylık düzenli gelir (MRR) paketleri oluşturun.
                    </p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setIsAssignOpen(true)} className="bg-white border border-gray-200 text-gray-900 px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition hover:border-indigo-300 hover:text-indigo-600 shadow-sm">
                        <Users className="w-4 h-4"/> Üyelik Sat
                    </button>
                    <button onClick={() => setIsNewPlanOpen(true)} className="bg-black text-white px-5 py-3 rounded-2xl font-black text-xs flex items-center gap-2 transition hover:bg-gray-800 shadow-xl">
                        <Plus className="w-4 h-4"/> Yeni Plan
                    </button>
                </div>
            </div>

            <div className="flex gap-1 mb-8 bg-gray-100 p-1 rounded-[1.5rem] w-fit">
                <button 
                    onClick={() => setSelectedTab('plans')}
                    className={`px-6 py-2.5 rounded-2xl text-[10px] sm:text-xs font-black transition-all ${selectedTab === 'plans' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    ABONELİK PAKETLERİ
                </button>
                <button 
                    onClick={() => setSelectedTab('members')}
                    className={`px-6 py-2.5 rounded-2xl text-[10px] sm:text-xs font-black transition-all ${selectedTab === 'members' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    AKTİF ÜYELER ({customerMemberships.length})
                </button>
            </div>

            {selectedTab === 'plans' ? (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {membershipPlans.map(plan => (
                        <div key={plan.id} className="bg-white border md:border-2 border-indigo-50 rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-8 shadow-sm relative overflow-hidden group hover:border-indigo-300 transition-all">
                            <div className="flex justify-between items-start mb-6">
                                <div className="bg-indigo-600 p-3 rounded-2xl text-white">
                                    <Crown className="w-6 h-6" />
                                </div>
                                <span className="bg-emerald-100 text-emerald-600 text-[9px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Aylık Paket</span>
                            </div>
                            <h3 className="text-xl md:text-2xl font-black text-gray-900 mb-2">{plan.name}</h3>
                            <div className="flex items-baseline gap-2 mb-8 border-b border-gray-100 pb-6">
                                <span className="text-3xl md:text-4xl font-black tracking-tighter text-indigo-600">₺{plan.price}</span>
                                <span className="text-[10px] md:text-xs font-bold text-gray-400 uppercase">/ Ay</span>
                            </div>
                            
                            <ul className="space-y-4 mb-8 flex-1">
                                {plan.benefits.map((b, i) => (
                                    <li key={i} className="flex items-center gap-3 text-xs font-bold text-gray-600">
                                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> <span className="truncate">{b}</span>
                                    </li>
                                ))}
                                <li className="flex items-center gap-3 text-xs font-bold text-gray-900 bg-gray-50 p-2 rounded-xl">
                                    <Zap className="w-4 h-4 text-amber-500" /> {plan.sessionsPerMonth} Seans Hizmet Kullanımı
                                </li>
                            </ul>

                            <button className="w-full bg-indigo-50 text-indigo-600 py-3 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                Planı Düzenle
                            </button>
                        </div>
                    ))}
                    
                    {/* Add Plan Template */}
                    <div onClick={() => setIsNewPlanOpen(true)} className="bg-gray-50/50 border-2 border-dashed border-gray-200 rounded-[3rem] p-8 flex flex-col items-center justify-center text-center group cursor-pointer hover:bg-white hover:border-indigo-300 transition-all min-h-[300px]">
                        <div className="w-16 h-16 bg-white shadow-sm rounded-full flex items-center justify-center text-indigo-400 group-hover:text-indigo-600 group-hover:scale-110 transition-all mb-4">
                            <Plus className="w-8 h-8" />
                        </div>
                        <p className="text-xs font-black text-gray-400 group-hover:text-indigo-400 uppercase tracking-widest">Yeni Paket Modeli</p>
                    </div>
                </motion.div>
            ) : (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-white border border-gray-100 rounded-[2rem] md:rounded-[3rem] overflow-x-auto shadow-sm">
                    <table className="w-full text-left min-w-[800px]">
                        <thead className="bg-gray-50/50 border-b border-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-400">
                            <tr>
                                <th className="px-8 py-5">Müşteri</th>
                                <th className="px-6 py-5">Üyelik Seviyesi</th>
                                <th className="px-6 py-5 text-center">Kalan Seans</th>
                                <th className="px-6 py-5 text-center">Durum</th>
                                <th className="px-8 py-5 text-right">Geçerlilik Bitiş</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {customerMemberships.map(mem => {
                                const customer = customers.find(c => c.id === mem.customerId);
                                const plan = membershipPlans.find(p => p.id === mem.planId);
                                return (
                                    <tr key={mem.id} className="hover:bg-gray-50/80 transition-colors group">
                                        <td className="px-8 py-5">
                                            <div className="flex items-center gap-4">
                                                <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-500">
                                                    {customer?.name.charAt(0)}
                                                </div>
                                                <div>
                                                    <p className="font-black text-gray-900 text-sm">{customer?.name}</p>
                                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-wider">{customer?.phone}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <span className="text-[10px] font-black text-indigo-700 bg-indigo-50 border border-indigo-100 px-3 py-1.5 rounded-xl uppercase tracking-widest">{plan?.name}</span>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <div className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 bg-gray-900 text-white rounded-xl font-black text-xs shadow-sm">
                                                <Zap className="w-3 h-3 text-yellow-400 fill-yellow-400" /> {mem.remainingSessions}
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-center">
                                            <span className="text-[9px] font-black uppercase text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg flex items-center justify-center gap-2 w-fit mx-auto">
                                                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> AKTİF
                                            </span>
                                        </td>
                                        <td className="px-8 py-5 text-right">
                                            <p className="text-xs font-black text-gray-700">{mem.expiryDate.split('T')[0]}</p>
                                            <button className="text-[9px] font-black text-indigo-400 uppercase tracking-widest mt-1 opacity-0 group-hover:opacity-100 hover:text-indigo-600 transition-all flex items-center justify-end gap-1 w-full">Yenile <ArrowRight className="w-3 h-3"/></button>
                                        </td>
                                    </tr>
                                );
                            })}
                            {customerMemberships.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-10 py-32 text-center">
                                        <Crown className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-black uppercase tracking-widest text-sm">Hala Hiç Aktif Üyeniz Yok.</p>
                                        <p className="text-gray-400 font-medium text-xs mt-2">Müşterilerinize abonelik satarak düzenli gelir elde edebilirsiniz.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </motion.div>
            )}

            {/* MODALS */}
            <AnimatePresence>
                {isNewPlanOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase flex items-center gap-2"><Crown className="w-5 h-5 text-indigo-500"/> Yeni Paket Oluştur</h2>
                                <button onClick={() => setIsNewPlanOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition"><X className="w-5 h-5 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleCreatePlan} className="p-8 space-y-5">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Paket Adı</label>
                                    <input type="text" required value={newPlan.name} onChange={e=>setNewPlan({...newPlan, name: e.target.value})} placeholder="Örn: Bronze Masaj Paketi" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400" />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Aylık Fiyat (₺)</label>
                                        <input type="number" required value={newPlan.price} onChange={e=>setNewPlan({...newPlan, price: e.target.value})} placeholder="0.00" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400" />
                                    </div>
                                    <div className="flex-1">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Seans Hakkı</label>
                                        <input type="number" required value={newPlan.sessions} onChange={e=>setNewPlan({...newPlan, sessions: e.target.value})} placeholder="Örn: 4" className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400" />
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">Ayrıcalıklar (Virgülle ayırın)</label>
                                    <input type="text" value={newPlan.benefits} onChange={e=>setNewPlan({...newPlan, benefits: e.target.value})} placeholder="Ücretsiz çay, öncelikli rezervasyon..." className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-xs outline-none focus:border-indigo-400" />
                                </div>
                                <div className="pt-4">
                                    <button type="submit" className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-200">
                                        Paketi Kaydet
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}

                {isAssignOpen && (
                    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
                        <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-lg overflow-hidden">
                            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                                <h2 className="text-lg font-black text-gray-900 tracking-tight uppercase flex items-center gap-2"><CreditCard className="w-5 h-5 text-indigo-500"/> Müşteriye Üyelik Sat</h2>
                                <button onClick={() => setIsAssignOpen(false)} className="p-2 hover:bg-gray-200 rounded-xl transition"><X className="w-5 h-5 text-gray-400" /></button>
                            </div>
                            <form onSubmit={handleAssign} className="p-8 space-y-6">
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Müşteri Seçin</label>
                                    <select required value={assignCustomer} onChange={e=>setAssignCustomer(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 appearance-none">
                                        <option value="">Arama / Seçme</option>
                                        {customers.map(c => <option key={c.id} value={c.id}>{c.name} ({c.phone})</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-2 block">Abonelik Paketi Seçin</label>
                                    <select required value={assignPlan} onChange={e=>setAssignPlan(e.target.value)} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 font-bold text-sm outline-none focus:border-indigo-400 appearance-none">
                                        <option value="">Paket Seçiniz</option>
                                        {membershipPlans.map(p => <option key={p.id} value={p.id}>{p.name} - ₺{p.price}</option>)}
                                    </select>
                                </div>
                                
                                {assignPlan && (
                                    <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 flex gap-3 items-center">
                                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                        <p className="text-xs font-bold text-emerald-700">Bu işlem sonucunda müşterinin hesabına anında seans hakkı tanımlanacaktır. Tahsilatı "Kasa" menüsünden almayı unutmayın.</p>
                                    </div>
                                )}

                                <div className="pt-2">
                                    <button type="submit" className="w-full py-4 bg-black text-white rounded-2xl font-black text-sm hover:bg-gray-800 transition-colors shadow-xl">
                                        Üyeliği Başlat
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
