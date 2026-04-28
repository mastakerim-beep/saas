"use client";

import React, { useState, useMemo } from 'react';
import { useStore, Staff, CommissionRule, AppUser, Branch } from '@/lib/store';
import { 
    Users, TrendingUp, Award, ChevronRight, Settings2, 
    Plus, Trash2, Percent, Banknote, UserCog, Calendar, 
    ShieldCheck, X, Save, RefreshCcw, AlertCircle,
    BarChart3, Star, Clock, Target, ZapOff, CheckCircle2,
    PhoneCall, Mail, Building2, ChevronDown, Edit3, ToggleLeft, ToggleRight,
    Filter, Zap, Fingerprint
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import ExportDropdown from '@/components/ui/ExportDropdown';
import DataImportWizard from '@/components/ui/DataImportWizard';
import { Appointment, Payment, Service } from '@/lib/store';

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const DAYS = ['Pazar', 'Pazartesi', 'Salı', 'Çarşamba', 'Perşembe', 'Cuma', 'Cumartesi'];
const TODAY_DAY = new Date().getDay();
const TODAY_STR = new Date().toISOString().split('T')[0];

function getAvatarColor(name: string) {
    const colors = [
        'from-indigo-500 to-purple-600',
        'from-rose-500 to-pink-600',
        'from-amber-500 to-orange-600',
        'from-emerald-500 to-teal-600',
        'from-sky-500 to-blue-600',
        'from-violet-500 to-fuchsia-600',
    ];
    const idx = name.charCodeAt(0) % colors.length;
    return colors[idx];
}

// ─── STAFF PROFILE SLIDE-OVER ─────────────────────────────────────────────────
function StaffProfilePanel({ staff, onClose, onEdit }: { staff: Staff, onClose: () => void, onEdit: () => void }) {
    const { appointments, payments, services, updateStaff } = useStore();
    
    const staffAppts = appointments.filter((a: Appointment) => a.staffId === staff.id);
    const completedAppts = staffAppts.filter((a: Appointment) => a.status === 'completed');
    const todayAppts = staffAppts.filter((a: Appointment) => a.date === TODAY_STR);
    const noShowCount = staffAppts.filter((a: Appointment) => a.status === 'no-show').length;
    const noShowRate = staffAppts.length > 0 ? ((noShowCount / staffAppts.length) * 100).toFixed(0) : '0';
    const totalRevenue = completedAppts.reduce((s: number, a: Appointment) => s + (a.price || 0), 0);

    // Loyal customers: unique customers who booked this staff > 1 time
    const customerCounts: Record<string, number> = {};
    staffAppts.forEach((a: Appointment) => { 
        if (a.customerId) {
            customerCounts[a.customerId] = (customerCounts[a.customerId] || 0) + 1; 
        }
    });
    const loyalCustomers = Object.values(customerCounts).filter((c: number) => c > 1).length;
    
    // Weekly chart data
    const weeklyData = DAYS.map((day, i) => ({
        day: day.substring(0, 3),
        count: appointments.filter((a: Appointment) => a.staffId === staff.id && new Date(a.date).getDay() === i).length,
    }));

    return (
        <motion.div
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 280 }}
            className="fixed right-0 top-0 h-full w-[420px] bg-white border-l border-gray-100 shadow-2xl z-[200] flex flex-col overflow-hidden"
        >
            {/* Header */}
            <div className={`bg-gradient-to-br ${getAvatarColor(staff.name)} p-8 relative overflow-hidden`}>
                <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/20 hover:bg-white/40 rounded-2xl transition-all text-white">
                    <X className="w-5 h-5" />
                </button>
                <div className="w-20 h-20 rounded-[2rem] bg-white/20 flex items-center justify-center font-black text-4xl text-white mb-5 shadow-xl">
                    {staff.name.charAt(0)}
                </div>
                <h2 className="text-2xl font-black text-white tracking-tight mb-1">{staff.name}</h2>
                <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black bg-white/20 text-white px-3 py-1 rounded-full uppercase tracking-widest">{staff.staffType}</span>
                    <span className="text-[10px] font-black bg-white/20 text-white px-3 py-1 rounded-full uppercase tracking-widest">{staff.role}</span>
                </div>
                <div className={`absolute bottom-0 right-0 p-8 opacity-10`}>
                    <Users size={100} />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Quick Stats */}
                <div className="grid grid-cols-3 gap-3">
                    {[
                        { label: 'Toplam Ciro', value: `₺${(totalRevenue/1000).toFixed(1)}k`, icon: TrendingUp, color: 'text-emerald-600' },
                        { label: 'Tamamlanan', value: completedAppts.length, icon: CheckCircle2, color: 'text-indigo-600' },
                        { label: 'Sadık Müşteri', value: loyalCustomers, icon: Star, color: 'text-amber-500' },
                    ].map((stat, i) => (
                        <div key={i} className="bg-gray-50 rounded-3xl p-4 text-center">
                            <stat.icon className={`w-5 h-5 ${stat.color} mx-auto mb-2`} />
                            <p className="text-xl font-black text-gray-900">{stat.value}</p>
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-wide mt-0.5">{stat.label}</p>
                        </div>
                    ))}
                </div>

                {/* Today's status */}
                <div className="bg-indigo-50 rounded-3xl p-5 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Bugün</p>
                        <p className="text-2xl font-black text-indigo-700">{todayAppts.length} randevu</p>
                    </div>
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${staff.weeklyOffDay === TODAY_DAY ? 'bg-red-100' : 'bg-emerald-100'}`}>
                        {staff.weeklyOffDay === TODAY_DAY
                            ? <ZapOff className="w-6 h-6 text-red-500" />
                            : <Zap className="w-6 h-6 text-emerald-500" />
                        }
                    </div>
                </div>

                {/* No-show rate warning */}
                {parseInt(noShowRate) > 15 && (
                    <div className="bg-red-50 border border-red-100 rounded-3xl p-4 flex items-center gap-3">
                        <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div>
                            <p className="text-xs font-black text-red-600">Yüksek No-Show Oranı</p>
                            <p className="text-[10px] text-red-400 font-bold">%{noShowRate} — İzlem gerekiyor</p>
                        </div>
                    </div>
                )}

                {/* Weekly Chart */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 rounded-3xl p-5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Haftalık Dağılım</p>
                        <div className="h-40">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={weeklyData} barSize={8}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
                                    <XAxis dataKey="day" fontSize={8} fontWeight={900} tickLine={false} axisLine={false} />
                                    <YAxis hide />
                                    <Tooltip contentStyle={{ fontSize: 10, fontWeight: 900, borderRadius: 12, border: 'none' }} />
                                    <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                                        {weeklyData.map((_, i) => (
                                            <Cell key={i} fill={i === TODAY_DAY ? '#6366f1' : '#cbd5e1'} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    <div className="bg-gray-50 rounded-3xl p-5">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-3">Hizmet Analizi</p>
                        <div className="h-40">
                            {completedAppts.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={(() => {
                                                const counts: Record<string, number> = {};
                                                completedAppts.forEach((a: Appointment) => {
                                                    if (a.service) {
                                                        counts[a.service] = (counts[a.service] || 0) + 1;
                                                    }
                                                });
                                                return Object.entries(counts).map(([name, value]) => ({ name, value }));
                                            })()}
                                            dataKey="value"
                                            nameKey="name"
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={30}
                                            outerRadius={45}
                                            paddingAngle={5}
                                        >
                                            {completedAppts.map((_: Appointment, i: number) => (
                                                <Cell key={i} fill={['#6366f1', '#10b981', '#f59e0b', '#ef4444'][i % 4]} />
                                            ))}
                                        </Pie>
                                        <Tooltip contentStyle={{ fontSize: 9, fontWeight: 900, borderRadius: 8 }} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="h-full flex items-center justify-center text-[10px] font-black text-gray-300 uppercase italic">Veri Yok</div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Aura Intelligence: Smart Suggestion */}
                <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-3xl p-5 relative overflow-hidden shadow-xl shadow-indigo-600/20">
                    <div className="absolute -right-4 -top-4 opacity-10 pointer-events-none">
                        <Zap size={100} className="text-indigo-400" />
                    </div>
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-3">
                            <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                            <p className="text-[10px] font-black text-indigo-300 uppercase tracking-widest flex items-center gap-2">
                                Aura Akıllı Öneri <span className="bg-indigo-500/20 text-indigo-300 px-2 py-0.5 rounded-full text-[8px]">AI Destekli</span>
                            </p>
                        </div>
                        <p className="text-xs font-bold text-gray-200 leading-relaxed">
                            {parseInt(noShowRate) > 15 
                                ? `${staff.name} için no-show oranı çok yüksek. Bu personel için kapora (ön ödeme) oranını artırmanız veya randevu onay sistemini katılaştırmanız önerilir.`
                                : staff.weeklyOffDay === TODAY_DAY
                                    ? `Personel bugün izinli. Cumartesi ve Pazar günleri en yüksek ciro ürettiği günler. Hafta sonu randevularını öne çıkarmak için bu personele özel kampanya oluşturun.`
                                    : completedAppts.length > 20
                                        ? `${staff.name} üstün performans gösteriyor. Yüksek kârlı hizmetlerde (örn. VIP Masaj) prim oranını %5 seviyesinde artırarak ciroyu maksimize edebilirsiniz.`
                                        : `${staff.name} genel ortalamanın altında kapasiteyle çalışıyor. Hafta içi sabah seanslarında bu personeli tercih edenlere %10 indirim tanımlayarak atıl zamanı değerlendirin.`
                            }
                        </p>
                    </div>
                </div>

                {/* Staff Info */}
                <div className="space-y-3">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Profil Bilgileri</p>
                    {[
                        { icon: Clock, label: 'İzin Günü', value: DAYS[staff.weeklyOffDay] },
                        { icon: Calendar, label: 'Takvim Durumu', value: staff.isVisibleOnCalendar ? 'Aktif / Görünür' : 'Gizli' },
                        { icon: BarChart3, label: 'Sıralama', value: `#${staff.sortOrder + 1}` },
                    ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between py-3 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <item.icon className="w-4 h-4 text-gray-300" />
                                <span className="text-xs font-bold text-gray-500">{item.label}</span>
                            </div>
                            <span className="text-xs font-black text-gray-900">{item.value}</span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 border-t border-gray-50 flex flex-wrap gap-2">
                <button
                    onClick={onEdit}
                    className="flex-1 bg-primary text-white py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-primary/90 transition-all shadow-lg shadow-primary/20"
                >
                    <Edit3 className="w-4 h-4" /> Düzenle
                </button>
                <button
                    onClick={() => updateStaff(staff.id, { status: staff.status === 'active' ? 'İzinli' : 'active' })}
                    className={`px-6 py-4 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                        staff.status === 'active' 
                            ? 'bg-amber-50 text-amber-600 hover:bg-amber-100'
                            : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'
                    }`}
                >
                    {staff.status === 'active' ? 'İzne Al' : 'Aktifleştir'}
                </button>
                {staff.status !== 'Ayrıldı' && (
                    <button
                        onClick={async () => {
                            if (confirm(`${staff.name} isimli personeli 'İşten Ayrıldı' olarak işaretlemek istediğinize emin misiniz?`)) {
                                await updateStaff(staff.id, { status: 'Ayrıldı', isVisibleOnCalendar: false });
                                onClose();
                            }
                        }}
                        className="w-full bg-red-50 text-red-600 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-red-100 transition-all border border-red-100 mt-1"
                    >
                        <ZapOff className="w-4 h-4" /> İŞTEN AYRILDI OLARAK İŞARETLE
                    </button> // Bu buton ayrıldı işaretleyip arşive atar
                )}
            </div>
        </motion.div>
    );
}

// ─── STAFF EDIT MODAL ─────────────────────────────────────────────────────────
function StaffEditModal({ staff, onClose }: { staff?: Staff, onClose: () => void }) {
    const { addStaff, updateStaff, updateStaffPermissions, allUsers, branches, can, provisionStaffUser } = useStore();
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState<Partial<Staff>>(staff || {
        name: '', role: 'Uzman', status: 'active',
        weeklyOffDay: 1, staffType: 'Terapist',
        isVisibleOnCalendar: true, sortOrder: 0
    });

    const linkedUser = allUsers.find((u: AppUser) => u.staffId === staff?.id || (u.name === staff?.name && !u.staffId));
    const RECEPTIONIST_PERMS = ['view_cash', 'move_appt', 'manage_customers'];
    const [perms, setPerms] = useState<string[]>(linkedUser?.permissions || RECEPTIONIST_PERMS);
    const [authData, setAuthData] = useState({ email: '', password: '' });

    const PERM_GROUPS = [
        {
            title: 'Finans', color: 'emerald',
            perms: [
                { id: 'view_cash', label: 'Bugünün Kasasını Gör' },
                { id: 'view_historical_finance', label: 'Geçmiş Kasayı Gör ⚠️' },
                { id: 'manage_expenses', label: 'Gider / Ödeme Yönet' },
                { id: 'edit_prices', label: 'Hizmet Fiyatı Değiştir' },
            ]
        },
        {
            title: 'Randevu & Müşteri', color: 'indigo',
            perms: [
                { id: 'delete_appt', label: 'Randevu Silme ⚠️' },
                { id: 'move_appt', label: 'Randevu Taşıma' },
                { id: 'manage_customers', label: 'Müşteri Kayıt Düzenle' },
            ]
        },
        {
            title: 'Sistem Control', color: 'rose',
            perms: [
                { id: 'manage_inventory', label: 'Stok / Ürün Yönetimi' },
                { id: 'manage_staff', label: 'Ekip Yönetimi' },
                { id: 'manage_users', label: 'Erişim Yetkileri ⚠️' },
                { id: 'view_audit_logs', label: 'Güvenlik Logları' },
            ]
        }
    ];

    const applyTemplate = (role: 'manager' | 'receptionist' | 'accountant') => {
        const templates = {
            manager: ['view_cash', 'view_historical_finance', 'manage_expenses', 'edit_prices', 'delete_appt', 'move_appt', 'manage_customers', 'manage_inventory', 'manage_staff', 'manage_users', 'view_audit_logs'],
            receptionist: ['view_cash', 'move_appt', 'manage_customers', 'manage_staff'],
            accountant: ['view_cash', 'view_historical_finance', 'manage_expenses']
        };
        setPerms(templates[role]);
    };

    const handleSave = async () => {
        if (staff) {
            updateStaff(staff.id, formData);
            if (linkedUser) updateStaffPermissions(linkedUser.id, perms);
        } else {
            const newStaff = await addStaff(formData as Omit<Staff, 'id' | 'businessId' | 'branchId'>);
            if (authData.email && authData.password && newStaff) {
                await provisionStaffUser({
                    email: authData.email,
                    password: authData.password,
                    name: formData.name!,
                    staffId: newStaff.id,
                    permissions: perms
                });
            }
        }
        onClose();
    };

    const steps = [
        { id: 1, label: 'Kimlik', icon: <UserCog size={14} /> },
        { id: 2, label: 'Operasyon', icon: <Calendar size={14} /> },
        { id: 3, label: 'Erişim', icon: <ShieldCheck size={14} /> }
    ];

    return (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-xl z-[300] flex items-center justify-center p-4">
            <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-[#0f111a] border border-white/5 rounded-[3rem] w-full max-w-2xl overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] relative"
            >
                <div className="p-12">
                    {/* Header with Steps */}
                    <div className="flex justify-between items-start mb-12">
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                {steps.map((s: { id: number, label: string, icon: React.ReactNode }, idx: number) => (
                                    <React.Fragment key={s.id}>
                                        <div className={`flex items-center gap-2 transition-all duration-500`}>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black border-2 ${
                                                step >= s.id ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_15px_rgba(79,70,229,0.5)]' : 'bg-slate-900 border-slate-800 text-slate-500'
                                            }`}>
                                                {step > s.id ? <CheckCircle2 size={12} strokeWidth={4} /> : s.icon}
                                            </div>
                                            <span className={`text-[10px] font-black uppercase tracking-widest hidden md:block ${step >= s.id ? 'text-white' : 'text-slate-600'}`}>{s.label}</span>
                                        </div>
                                        {idx < steps.length - 1 && (
                                            <div className={`h-[2px] w-8 rounded-full transition-all duration-500 ${step > s.id ? 'bg-indigo-600' : 'bg-slate-800'}`} />
                                        )}
                                    </React.Fragment>
                                ))}
                            </div>
                            <div>
                                <h2 className="text-white text-3xl font-black italic uppercase tracking-tighter leading-none">Node Deployment</h2>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.3em] mt-3">Auth Matrix Phase {step}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-12 h-12 bg-white/5 hover:bg-white/10 rounded-2xl flex items-center justify-center text-slate-400 transition-all border border-white/5 group">
                            <X size={20} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    <div className="min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div key="st1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Ad Soyad</label>
                                            <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Unvan</label>
                                            <input value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-all" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Personel Tipi</label>
                                            <select value={formData.staffType} onChange={e => setFormData({...formData, staffType: e.target.value as any})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none appearance-none cursor-pointer">
                                                <option value="Terapist" className="bg-[#0f111a]">Terapist</option>
                                                <option value="Satış Tem." className="bg-[#0f111a]">Satış Tem.</option>
                                                <option value="Diğer" className="bg-[#0f111a]">Diğer</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">İzin Günü</label>
                                            <select value={formData.weeklyOffDay} onChange={e => setFormData({...formData, weeklyOffDay: Number(e.target.value)})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none appearance-none cursor-pointer">
                                                {DAYS.map((d, i) => <option key={i} value={i} className="bg-[#0f111a]">{d}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <button onClick={() => setStep(2)} className="w-full py-5 bg-white text-black rounded-[1.8rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-100 transition-all mt-8">NEXT PHASE: OPERATIONAL PARAMETERS</button>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div key="st2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2 col-span-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Şube Ataması</label>
                                            <select value={(formData as any).branchId || ''} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData({...formData, branchId: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none appearance-none cursor-pointer">
                                                <option value="" className="bg-[#0f111a]">— Şube Seçin —</option>
                                                {branches.map((b: Branch) => <option key={b.id} value={b.id} className="bg-[#0f111a]">{b.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="flex items-center justify-between p-6 bg-white/5 border border-white/10 rounded-2xl col-span-2">
                                            <div className="flex items-center gap-4">
                                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${formData.isVisibleOnCalendar ? 'bg-indigo-600/20 text-indigo-400' : 'bg-slate-800 text-slate-600'}`}>
                                                    <Calendar size={20} />
                                                </div>
                                                <div>
                                                    <p className="text-[11px] font-black text-white uppercase tracking-wider">Takvim Görünürlüğü</p>
                                                    <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">Sovereign Booking Pool Access</p>
                                                </div>
                                            </div>
                                            <button onClick={() => setFormData({...formData, isVisibleOnCalendar: !formData.isVisibleOnCalendar})} className={`w-14 h-7 rounded-full transition-all relative ${formData.isVisibleOnCalendar ? 'bg-indigo-600' : 'bg-slate-800'}`}>
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow transition-all ${formData.isVisibleOnCalendar ? 'left-8' : 'left-1'}`} />
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 mt-8">
                                        <button onClick={() => setStep(1)} className="flex-1 py-5 bg-slate-900 text-slate-400 rounded-3xl font-black text-[11px] uppercase tracking-widest border border-slate-800 transition-all">BACK</button>
                                        <button onClick={() => setStep(3)} className="flex-[2] py-5 bg-indigo-600 text-white rounded-3xl font-black text-[11px] uppercase tracking-widest shadow-xl shadow-indigo-600/30 hover:bg-indigo-500 transition-all">NEXT: SECURITY MATRIX</button>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div key="st3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-6">
                                    {!linkedUser && (
                                        <div className="bg-indigo-600/10 border border-indigo-500/20 p-8 rounded-[2.5rem] space-y-6 group">
                                            <p className="text-[10px] font-black text-indigo-400 uppercase tracking-[0.2em] flex items-center gap-3">
                                                <Fingerprint size={14} /> NEW AUTHENTICATION NODE
                                            </p>
                                            <div className="grid grid-cols-2 gap-4">
                                                <input value={authData.email} onChange={e => setAuthData({...authData, email: e.target.value})} placeholder="Node E-mail" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all" />
                                                <input type="password" value={authData.password} onChange={e => setAuthData({...authData, password: e.target.value})} placeholder="Access Key" className="w-full bg-black/40 border border-white/5 rounded-2xl py-4 px-6 text-xs font-bold text-white outline-none focus:border-indigo-500 transition-all" />
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center bg-white/5 p-2 rounded-full pl-6">
                                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Permission Templates</p>
                                            <div className="flex gap-2">
                                                {(['manager', 'receptionist', 'accountant'] as const).map((r) => (
                                                    <button key={r} onClick={() => applyTemplate(r)} className="text-[8px] font-black px-4 py-2 bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600/20 rounded-full transition-all uppercase tracking-widest">{r}</button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-3 max-h-[250px] overflow-y-auto pr-2 no-scrollbar">
                                            {PERM_GROUPS.map(group => (
                                                <div key={group.title} className="space-y-2">
                                                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest px-2">{group.title}</p>
                                                    {group.perms.map(opt => (
                                                        <label key={opt.id} className={`flex items-center gap-2 p-3 rounded-xl border transition-all cursor-pointer ${perms.includes(opt.id) ? 'bg-indigo-600/10 border-indigo-500/30 text-white' : 'bg-white/[0.02] border-white/5 text-slate-500 hover:bg-white/5'}`}>
                                                            <div className={`w-4 h-4 rounded-md flex items-center justify-center border-2 transition-all ${perms.includes(opt.id) ? 'bg-indigo-600 border-indigo-400' : 'bg-slate-900 border-slate-800'}`}>
                                                                {perms.includes(opt.id) && <CheckCircle2 size={10} strokeWidth={4} />}
                                                            </div>
                                                            <input type="checkbox" className="sr-only" checked={perms.includes(opt.id)} onChange={() => setPerms(prev => prev.includes(opt.id) ? prev.filter(p => p !== opt.id) : [...prev, opt.id])} />
                                                            <span className="text-[9px] font-black leading-tight">{opt.label}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex gap-4 mt-8">
                                        <button onClick={() => setStep(2)} className="flex-1 py-6 bg-slate-900 text-slate-400 rounded-3xl font-black text-[11px] uppercase tracking-widest border border-slate-800 transition-all">BACK</button>
                                        <button onClick={handleSave} className="flex-[2] py-6 bg-white text-black rounded-[2rem] font-black text-[12px] uppercase tracking-[0.2em] shadow-xl hover:bg-slate-100 transition-all">DEPLOY & FINALIZE ✓</button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}

// ─── COMMISSION RULE FORM (fully wired) ───────────────────────────────────────
function CommissionRuleForm() {
    const { staffMembers, services, addCommissionRule, commissionRules, removeCommissionRule } = useStore();
    const [staffId, setStaffId] = useState('');
    const [serviceName, setServiceName] = useState('');
    const [value, setValue] = useState(10);
    const [type, setType] = useState<'percentage' | 'fixed'>('percentage');

    const handleAdd = () => {
        if (value <= 0) return;
        addCommissionRule({
            staffId: staffId || undefined,
            serviceName: serviceName || undefined,
            type,
            value,
        });
        // Reset
        setStaffId(''); setServiceName(''); setValue(10); setType('percentage');
    };

    return (
        <div className="space-y-6">
            {/* Form Card */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-[3rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-10 opacity-10"><Percent size={140} /></div>
                <h3 className="text-2xl font-black mb-2 italic flex items-center gap-3">
                    <Plus className="w-7 h-7 text-indigo-300" /> Prim Kuralı Oluştur
                </h3>
                <p className="text-indigo-200 text-[10px] font-black uppercase tracking-widest mb-8">Personele veya hizmete özel prim tanımlayın</p>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-5 relative z-10">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Personel Seçimi</label>
                        <select value={staffId} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setStaffId(e.target.value)}
                            className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-5 py-4 text-sm font-bold text-white appearance-none focus:bg-white/20 focus:outline-none transition-all">
                            <option value="" className="text-black">— Tüm Personel —</option>
                            {staffMembers.map((s: Staff) => <option key={s.id} value={s.id} className="text-black">{s.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Hizmet Kapsamı</label>
                        <select value={serviceName} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setServiceName(e.target.value)}
                            className="w-full bg-white/10 border-2 border-white/20 rounded-2xl px-5 py-4 text-sm font-bold text-white appearance-none focus:bg-white/20 focus:outline-none transition-all">
                            <option value="" className="text-black">— Tüm Hizmetler —</option>
                            {services.map((s: Service) => <option key={s.id} value={s.name} className="text-black">{s.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black uppercase text-indigo-200 tracking-widest">Prim Değeri</label>
                        <div className="flex bg-white rounded-2xl p-1.5 shadow-xl gap-1.5">
                            <input
                                type="number" value={value} min={1} max={100}
                                onChange={e => setValue(Number(e.target.value))}
                                className="flex-1 bg-transparent text-center font-black text-indigo-700 focus:outline-none text-lg"
                            />
                            <button onClick={() => setType('percentage')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${type === 'percentage' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>%</button>
                            <button onClick={() => setType('fixed')} className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${type === 'fixed' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>₺</button>
                        </div>
                    </div>
                    <button onClick={handleAdd}
                        className="bg-emerald-400 text-black py-5 rounded-[2rem] font-black text-sm hover:scale-105 active:scale-95 transition-all shadow-xl shadow-emerald-900/20 flex items-center justify-center gap-2">
                        <CheckCircle2 className="w-5 h-5" /> KURALI AKTİF ET
                    </button>
                </div>
            </div>

            {/* Rules Table */}
            <div className="bg-white border-2 border-gray-50 rounded-[3rem] shadow-sm overflow-hidden">
                {commissionRules.length === 0 ? (
                    <div className="p-16 text-center">
                        <Percent className="w-12 h-12 text-gray-200 mx-auto mb-4" />
                        <p className="font-black text-gray-300 uppercase tracking-widest text-sm">Henüz Prim Kuralı Yok</p>
                        <p className="text-xs text-gray-300 mt-1">Yukarıdan ilk kuralı oluşturun</p>
                    </div>
                ) : (
                    <table className="w-full text-left">
                        <thead className="bg-gray-50/50 border-b border-gray-100">
                            <tr>
                                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest">Kapsam</th>
                                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-center">Tür</th>
                                <th className="p-8 text-[10px] font-black uppercase text-gray-400 tracking-widest text-right">Miktar</th>
                                <th className="p-8 w-16"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {commissionRules.map((rule: CommissionRule) => (
                                <tr key={rule.id} className="hover:bg-indigo-50/20 transition-colors group">
                                    <td className="p-8">
                                        <p className="font-black text-gray-900">{rule.staffId ? staffMembers.find((s: Staff) => s.id === rule.staffId)?.name || 'Bilinmiyor' : 'Tüm Ekip'}</p>
                                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest italic">{rule.serviceName || 'Tüm Hizmetlerde Geçerli'}</p>
                                    </td>
                                    <td className="p-8 text-center">
                                        <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${rule.type === 'percentage' ? 'bg-indigo-100 text-indigo-600' : 'bg-emerald-100 text-emerald-700'}`}>
                                            {rule.type === 'percentage' ? 'Yüzdesel' : 'Sabit Prim'}
                                        </span>
                                    </td>
                                    <td className="p-8 text-right font-black text-2xl text-gray-900">{rule.type === 'percentage' ? `%${rule.value}` : `₺${rule.value}`}</td>
                                    <td className="p-8 text-right">
                                        <button onClick={() => removeCommissionRule(rule.id)}
                                            className="p-3 text-gray-200 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100">
                                            <Trash2 size={20} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}


// ─── MAIN PAGE ────────────────────────────────────────────────────────────────
export default function StaffPage() {
    const { appointments, staffMembers, commissionRules, calculateCommission, deleteStaff, updateStaff, can } = useStore();
    
    const [view, setView] = useState<'performance' | 'manage' | 'rules'>('performance');
    const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'İzinli'>('all');
    const [perfFilter, setPerfFilter] = useState<'all' | 'month' | 'today'>('all');
    const [sortBy, setSortBy] = useState<'revenue' | 'appointments' | 'commission'>('revenue');

    const filterAppts = (appts: Appointment[]) => {
        if (perfFilter === 'today') return appts.filter((a: Appointment) => a.date === TODAY_STR);
        if (perfFilter === 'month') {
            const monthStr = TODAY_STR.substring(0, 7);
            return appts.filter((a: Appointment) => a.date.startsWith(monthStr));
        }
        return appts;
    };

    const staffPerformance = useMemo(() => staffMembers.map((staff: Staff) => {
        const filtered = filterAppts(appointments.filter((a: Appointment) => a.staffId === staff.id));
        const completed = filtered.filter((a: Appointment) => a.status === 'completed');
        const noShow = filtered.filter((a: Appointment) => a.status === 'no-show').length;
        const revenue = completed.reduce((s: number, a: Appointment) => s + (a.price || 0), 0);
        const commission = completed.reduce((s: number, a: Appointment) => s + calculateCommission(staff.name, a.service, a.price, a.packageId), 0);
        const noShowRate = filtered.length > 0 ? (noShow / filtered.length) * 100 : 0;
        
        const customerCounts: Record<string, number> = {};
        filtered.forEach((a: Appointment) => { 
            if (a.customerId) {
                customerCounts[a.customerId] = (customerCounts[a.customerId] || 0) + 1; 
            }
        });
        const loyalCustomers = Object.values(customerCounts).filter((c: number) => c > 1).length;

        return {
            ...staff,
            serviceCount: completed.length,
            revenue, commission, noShowRate, loyalCustomers,
            todayAppts: appointments.filter((a: Appointment) => a.staffId === staff.id && a.date === TODAY_STR).length,
        };
    }).sort((a: any, b: any) => {
        if (sortBy === 'revenue') return b.revenue - a.revenue;
        if (sortBy === 'appointments') return b.serviceCount - a.serviceCount;
        return b.commission - a.commission;
    }), [staffMembers, appointments, perfFilter, sortBy]);

    const totalRevenue = staffPerformance.reduce((s: number, st: any) => s + st.revenue, 0);
    const totalCommission = staffPerformance.reduce((s: number, st: any) => s + st.commission, 0);
    const totalAppts = staffPerformance.reduce((s: number, st: any) => s + st.serviceCount, 0);

    const filteredStaff = staffMembers.filter((s: Staff) => statusFilter === 'all' || s.status === statusFilter);

    const openProfile = (staff: Staff) => {
        setSelectedStaff(staff);
        setIsProfileOpen(true);
        setIsEditModalOpen(false);
    };

    const openEdit = (staff?: Staff) => {
        setSelectedStaff(staff || null);
        setIsEditModalOpen(true);
        setIsProfileOpen(false);
    };

    return (
        <div className="p-8 max-w-[1300px] mx-auto animate-[fadeIn_0.3s_ease] pb-24">
            {/* ── Header ── */}
            <div className="flex justify-between items-end mb-10">
                <div>
                    <h1 className="text-4xl font-black tracking-tight mb-3 text-gray-900 italic">Ekip Yönetimi</h1>
                    <div className="flex gap-2">
                        {[
                            { id: 'performance', label: 'Performans' },
                            { id: 'manage', label: 'Kadro' },
                            { id: 'rules', label: 'Prim Havuzu' },
                        ].map(tab => (
                            <button key={tab.id} onClick={() => setView(tab.id as any)}
                                className={`text-[11px] font-black uppercase tracking-widest px-5 py-2.5 rounded-full transition-all ${view === tab.id ? 'bg-primary text-white shadow-lg shadow-primary/20' : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
                <div className="flex gap-3">
                    {can('manage_staff') && (
                        <button onClick={() => setShowImport(true)}
                            className="bg-white border-2 border-gray-100 text-gray-500 px-8 py-5 rounded-[2rem] font-black text-sm shadow-sm hover:bg-gray-50 active:scale-95 transition-all flex items-center gap-3">
                            <RefreshCcw className="w-5 h-5" /> İÇE AKTAR
                        </button>
                    )}
                    {can('manage_staff') && (
                        <button onClick={() => openEdit()}
                            className="bg-primary text-white px-8 py-5 rounded-[2rem] font-black text-sm shadow-xl shadow-primary/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3">
                            <Plus className="w-5 h-5" /> YENİ PERSONEL
                        </button>
                    )}
                </div>
            </div>

            {/* ── PERFORMANCE VIEW ── */}
            {view === 'performance' && (
                <div className="animate-[slideUp_0.4s_ease]">
                    {/* KPIs */}
                    <div className="grid grid-cols-4 gap-5 mb-10">
                        {[
                            { label: 'Ekip Büyüklüğü', val: staffMembers.length, sub: `${staffMembers.filter((s: Staff) => s.status === 'active').length} aktif`, icon: Users, color: 'bg-indigo-50 text-indigo-600' },
                            { label: 'Toplam Ciro', val: `₺${totalRevenue.toLocaleString('tr-TR')}`, sub: 'Tamamlanan randevular', icon: TrendingUp, color: 'bg-emerald-50 text-emerald-600' },
                            { label: 'Toplam Prim', val: `₺${totalCommission.toLocaleString('tr-TR')}`, sub: `${commissionRules.length} aktif kural`, icon: Award, color: 'bg-indigo-50 text-indigo-600' },
                            { label: 'Tamamlanan', val: totalAppts, sub: 'Randevu', icon: CheckCircle2, color: 'bg-purple-50 text-purple-600' },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-white border-2 border-gray-50 rounded-[2.5rem] p-7 shadow-sm flex items-center gap-5">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-inner flex-shrink-0 ${kpi.color}`}>
                                    <kpi.icon className="w-7 h-7" />
                                </div>
                                <div>
                                    <p className="text-2xl font-black text-gray-900">{kpi.val}</p>
                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-0.5">{kpi.label}</p>
                                    <p className="text-[9px] text-gray-300 font-bold mt-0.5">{kpi.sub}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Filter */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                        <div className="flex items-center gap-2 bg-white border-2 border-gray-100 rounded-2xl p-1 shadow-sm">
                            {[
                                { id: 'all', label: 'Tüm Zamanlar' },
                                { id: 'month', label: 'Bu Ay' },
                                { id: 'today', label: 'Bugün' },
                            ].map(f => (
                                <button key={f.id} onClick={() => setPerfFilter(f.id as any)}
                                    className={`px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${perfFilter === f.id ? 'bg-primary text-white shadow-md shadow-primary/20' : 'text-gray-400 hover:text-gray-600'}`}>
                                    {f.label}
                                </button>
                            ))}
                        </div>

                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-indigo-50 border border-indigo-100 rounded-2xl p-1">
                                {[
                                    { id: 'revenue', label: 'Ciroya Göre' },
                                    { id: 'appointments', label: 'Randevuya Göre' },
                                    { id: 'commission', label: 'Prime Göre' },
                                ].map(s => (
                                    <button key={s.id} onClick={() => setSortBy(s.id as any)}
                                        className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${sortBy === s.id ? 'bg-indigo-600 text-white shadow-md' : 'text-indigo-400 hover:text-indigo-600'}`}>
                                        {s.label}
                                    </button>
                                ))}
                            </div>

                            <ExportDropdown 
                                data={staffPerformance}
                                filename={`Ekip_Performans_${perfFilter}`}
                                title={`Ekip Performans Raporu (${perfFilter === 'today' ? 'Bugün' : perfFilter === 'month' ? 'Bu Ay' : 'Tüm Zamanlar'})`}
                                headers={["Sıra", "Personel", "Randevu", "Ciro", "Prim", "Sadık Müşteri", "No-Show %"]}
                                excelMapping={(s, idx) => ({
                                    "Sıra": idx + 1,
                                    "Personel Adı": s.name,
                                    "Randevu Sayısı": s.serviceCount,
                                    "Toplam Ciro": s.revenue,
                                    "Kazanılan Prim": s.commission,
                                    "Sadık Müşteri": s.loyalCustomers,
                                    "No-Show Oranı": `%${s.noShowRate.toFixed(1)}`
                                })}
                                pdfMapping={(s, idx) => [
                                    `#${idx + 1}`,
                                    s.name,
                                    s.serviceCount,
                                    `₺${s.revenue.toLocaleString('tr-TR')}`,
                                    `₺${s.commission.toLocaleString('tr-TR')}`,
                                    s.loyalCustomers,
                                    `%${s.noShowRate.toFixed(0)}`
                                ]}
                            />
                        </div>
                    </div>

                    {/* Leaderboard */}
                    <div className="bg-white border-2 border-gray-50 rounded-[3rem] shadow-sm overflow-hidden">
                        <div className="p-8 border-b border-gray-50 flex items-center justify-between">
                            <h3 className="font-black text-gray-900 text-xl uppercase tracking-tight italic">Liderlik Tablosu</h3>
                            <span className="text-[9px] font-black bg-indigo-50 text-indigo-500 px-4 py-2 rounded-full uppercase tracking-widest border border-indigo-100 flex items-center gap-2">
                                <ShieldCheck className="w-3.5 h-3.5" /> AI Analiz Aktif
                            </span>
                        </div>
                        <div className="divide-y divide-gray-50">
                            {staffPerformance.map((staff: any, idx: number) => (
                                <div key={staff.id}
                                    onClick={() => openProfile(staff as any)}
                                    className="p-8 flex items-center gap-6 hover:bg-indigo-50/20 transition-colors cursor-pointer group">
                                    {/* Rank */}
                                    <div className="w-8 text-center font-black text-gray-200 text-xl flex-shrink-0">
                                        {idx === 0 ? <Award className="w-7 h-7 text-amber-400 mx-auto" /> : `#${idx + 1}`}
                                    </div>
                                    {/* Avatar */}
                                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(staff.name)} flex items-center justify-center font-black text-xl text-white shadow-lg flex-shrink-0`}>
                                        {staff.name.charAt(0)}
                                    </div>
                                    {/* Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h4 className="font-black text-lg text-gray-900">{staff.name}</h4>
                                            <span className={`text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${staff.staffType === 'Terapist' ? 'bg-indigo-100 text-indigo-600' : 'bg-amber-100 text-amber-600'}`}>{staff.staffType}</span>
                                            {staff.weeklyOffDay === TODAY_DAY && (
                                                <span className="text-[8px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest bg-red-100 text-red-500">İzinli</span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-[10px] font-bold text-gray-400">{staff.serviceCount} randevu</span>
                                            <span className="text-[10px] font-black text-indigo-500">⭐ {staff.loyalCustomers} sadık müşteri</span>
                                            {staff.noShowRate > 10 && (
                                                <span className="text-[10px] font-black text-red-400">⚠ %{staff.noShowRate.toFixed(0)} no-show</span>
                                            )}
                                        </div>
                                        {/* Revenue bar */}
                                        <div className="mt-3 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                                            <div
                                                className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"
                                                style={{ width: totalRevenue > 0 ? `${(staff.revenue / totalRevenue) * 100}%` : '0%' }}
                                            />
                                        </div>
                                    </div>
                                    {/* Numbers */}
                                    <div className="flex items-center gap-12 flex-shrink-0">
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Ciro</p>
                                            <p className="text-2xl font-black text-gray-900 tabular-nums">₺{staff.revenue.toLocaleString('tr-TR')}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-1">Prim</p>
                                            <p className="text-2xl font-black text-emerald-600 tabular-nums">₺{staff.commission.toLocaleString('tr-TR')}</p>
                                        </div>
                                        <ChevronRight className="w-5 h-5 text-gray-200 group-hover:text-indigo-400 transition-colors" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* ── MANAGE VIEW ── */}
            {view === 'manage' && (
                <div className="animate-[slideUp_0.4s_ease]">
                    {/* Filter bar */}
                    <div className="flex gap-3 mb-6 overflow-x-auto pb-2 no-scrollbar">
                        {['all', 'active', 'İzinli', 'Ayrıldı'].map(f => (
                            <button key={f} onClick={() => setStatusFilter(f as any)}
                                className={`px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border-2 whitespace-nowrap ${statusFilter === f ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' : 'border-gray-100 text-gray-400 hover:border-gray-300'}`}>
                                {f === 'all' ? 'Tümü' : f === 'Ayrıldı' ? 'Arşiv (Ayrılanlar)' : f} {f !== 'all' && `(${staffMembers.filter((s: Staff) => s.status === f).length})`}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {filteredStaff.map((staff: Staff) => {
                            const todayAppts = appointments.filter((a: Appointment) => a.staffId === staff.id && a.date === TODAY_STR);
                            const isOffToday = staff.weeklyOffDay === TODAY_DAY;
                            return (
                                <div key={staff.id}
                                    className={`relative bg-white border-2 rounded-[2.5rem] p-7 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden cursor-pointer ${
                                        staff.syncStatus === 'syncing' ? 'border-indigo-100 animate-pulse' :
                                        staff.syncStatus === 'error' ? 'border-red-100' :
                                        isOffToday ? 'border-amber-100 bg-amber-50/20' : 'border-gray-50 hover:border-indigo-100'
                                    }`}
                                    onClick={() => openProfile(staff)}
                                >
                                    {/* Sync overlay */}
                                    {staff.syncStatus === 'syncing' && (
                                        <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10 backdrop-blur-sm rounded-[2.5rem]">
                                            <div className="flex items-center gap-2 text-indigo-600">
                                                <RefreshCcw className="w-4 h-4 animate-spin" />
                                                <span className="text-[10px] font-black uppercase">Kaydediliyor...</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* Avatar + quick actions */}
                                    <div className="flex justify-between items-start mb-5">
                                        <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${getAvatarColor(staff.name)} flex items-center justify-center font-black text-xl text-white shadow-lg`}>
                                            {staff.name.charAt(0)}
                                        </div>
                                        <div className="flex gap-1.5" onClick={e => e.stopPropagation()}>
                                            {(can('manage_staff') || can('manage_users')) && (
                                                <button onClick={() => openEdit(staff)}
                                                    className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-indigo-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                                    <Settings2 size={16} />
                                                </button>
                                            )}
                                            {can('manage_staff') && (
                                                <button onClick={() => confirm('Personeli silmek istediğinize emin misiniz?') && deleteStaff(staff.id)}
                                                    className="p-2 bg-gray-50 text-gray-400 rounded-xl hover:bg-red-600 hover:text-white transition-all opacity-0 group-hover:opacity-100">
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    <h3 className="font-black text-lg text-gray-900 mb-1 truncate">{staff.name}</h3>
                                    <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">{staff.role}</p>

                                    <div className="flex flex-wrap gap-1.5 mb-5">
                                        <span className="text-[8px] font-black bg-gray-100 text-gray-500 px-2.5 py-1.5 rounded-full uppercase">{staff.staffType}</span>
                                        {staff.isVisibleOnCalendar
                                            ? <span className="text-[8px] font-black bg-emerald-100 text-emerald-700 px-2.5 py-1.5 rounded-full uppercase">Takvimde Aktif</span>
                                            : <span className="text-[8px] font-black bg-gray-100 text-gray-400 px-2.5 py-1.5 rounded-full uppercase">Gizli</span>
                                        }
                                        {isOffToday && <span className="text-[8px] font-black bg-amber-100 text-amber-600 px-2.5 py-1.5 rounded-full uppercase">Bugün İzinli</span>}
                                    </div>

                                    {/* Today's appointments */}
                                    <div className="border-t border-gray-50 pt-4 flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-gray-300" />
                                            <span className="text-[10px] font-black text-gray-400">Bugün: {todayAppts.length} randevu</span>
                                        </div>
                                        {/* Status quick toggle */}
                                        <button
                                            onClick={(e) => { e.stopPropagation(); updateStaff(staff.id, { status: staff.status === 'active' ? 'İzinli' : 'active' }); }}
                                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${staff.status === 'active' ? 'bg-emerald-50 text-emerald-600 hover:bg-amber-50 hover:text-amber-600' : 'bg-amber-50 text-amber-600 hover:bg-emerald-50 hover:text-emerald-600'}`}
                                        >
                                            <div className={`w-1.5 h-1.5 rounded-full ${staff.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                                            {staff.status}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Add new card */}
                        <button onClick={() => openEdit()}
                            className="border-2 border-dashed border-gray-200 rounded-[2.5rem] p-7 flex flex-col items-center justify-center gap-3 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all group text-gray-300 hover:text-indigo-400 min-h-[200px]">
                            <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-current flex items-center justify-center">
                                <Plus className="w-7 h-7" />
                            </div>
                            <span className="text-[10px] font-black uppercase tracking-widest">Personel Ekle</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ── RULES VIEW ── */}
            {view === 'rules' && (
                <div className="animate-[slideUp_0.4s_ease]">
                    <CommissionRuleForm />
                </div>
            )}

            {/* ── MODALS & PANELS ── */}
            <AnimatePresence>
                {isProfileOpen && selectedStaff && (
                    <>
                        <motion.div
                            key="backdrop"
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            onClick={() => setIsProfileOpen(false)}
                            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[190]"
                        />
                        <StaffProfilePanel
                            key="panel"
                            staff={selectedStaff}
                            onClose={() => setIsProfileOpen(false)}
                            onEdit={() => { setIsProfileOpen(false); setIsEditModalOpen(true); }}
                        />
                    </>
                )}
                {isEditModalOpen && (
                    <StaffEditModal
                        key="edit"
                        staff={selectedStaff || undefined}
                        onClose={() => { setIsEditModalOpen(false); setSelectedStaff(null); }}
                    />
                )}
            </AnimatePresence>
            {showImport && (
                <DataImportWizard 
                    type="staff" 
                    onClose={() => setShowImport(false)} 
                />
            )}
        </div>
    );
}
