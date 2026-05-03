"use client";

import { motion } from 'framer-motion';
import { CheckCircle, RefreshCw, Shield, User, MapPin, Globe, Languages, Settings } from 'lucide-react';
import { Customer, StaffMember } from '@/lib/store';

interface CustomerTabDuzenleProps {
    customer: Customer;
    editForm: Partial<Customer>;
    setEditForm: (form: Partial<Customer>) => void;
    handleSave: () => void;
    isSaving: boolean;
    saveSuccess: boolean;
    staffMembers: StaffMember[];
}

export function CustomerTabDuzenle({
    customer,
    editForm,
    setEditForm,
    handleSave,
    isSaving,
    saveSuccess,
    staffMembers
}: CustomerTabDuzenleProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-8 pb-32">
            <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div>
                    <h3 className="text-2xl font-black italic tracking-tighter uppercase italic">Müşteri Düzenle</h3>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Sistem Kayıt ID: #{customer.id.substring(0,8)}</p>
                </div>
                <div className="flex gap-4">
                    {saveSuccess && (
                        <div className="flex items-center gap-2 px-4 py-2 bg-green-50 text-green-600 rounded-xl text-[10px] font-black uppercase tracking-widest animate-bounce">
                            <CheckCircle className="w-4 h-4" /> Başarıyla Güncellendi
                        </div>
                    )}
                    <button 
                        onClick={handleSave}
                        disabled={isSaving}
                        className="px-10 py-4 bg-indigo-600 text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all flex items-center gap-3 disabled:opacity-50"
                    >
                        {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Shield className="w-4 h-4" />}
                        BİLGİLERİ GÜNCELLE
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Kişisel Bilgiler */}
                <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><User className="w-5 h-5" /></div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest italic">Kişisel Bilgiler</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ad Soyad</label>
                            <input 
                                type="text" value={editForm.name} onChange={e => setEditForm({...editForm, name: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">TC Kimlik / Pasaport</label>
                            <input 
                                type="text" value={editForm.citizenshipNumber || ''} onChange={e => setEditForm({...editForm, citizenshipNumber: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Telefon</label>
                            <input 
                                type="text" value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">E-Posta</label>
                            <input 
                                type="email" value={editForm.email} onChange={e => setEditForm({...editForm, email: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Cinsiyet</label>
                            <select 
                                value={editForm.gender || ''} onChange={e => setEditForm({...editForm, gender: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                            >
                                <option value="">Seçiniz</option>
                                <option value="Kadın">Kadın</option>
                                <option value="Erkek">Erkek</option>
                                <option value="Diğer">Diğer</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Doğum Tarihi</label>
                            <input 
                                type="date" value={editForm.birthdate || ''} onChange={e => setEditForm({...editForm, birthdate: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Segment</label>
                            <select 
                                value={editForm.segment} onChange={e => setEditForm({...editForm, segment: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                            >
                                <option value="Normal">Normal</option>
                                <option value="VIP">VIP</option>
                                <option value="Kurumsal">Kurumsal</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Satış Temsilcisi</label>
                            <select 
                                value={editForm.salesRepId || ''} onChange={e => setEditForm({...editForm, salesRepId: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                            >
                                <option value="">Seçiniz</option>
                                {staffMembers.map((s: any) => <option key={s.id} value={s.id}>{s.name}</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Adres Bilgileri */}
                <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm flex flex-col gap-8">
                    <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><MapPin className="w-5 h-5" /></div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest italic">Adres Bilgileri</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Ülke</label>
                            <input 
                                type="text" value={editForm.country || 'Türkiye'} onChange={e => setEditForm({...editForm, country: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Şehir</label>
                            <input 
                                type="text" value={editForm.city || ''} onChange={e => setEditForm({...editForm, city: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">İlçe</label>
                            <input 
                                type="text" value={editForm.district || ''} onChange={e => setEditForm({...editForm, district: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Zaman Dilimi</label>
                            <select 
                                value={editForm.timezone || 'Europe/Istanbul'} onChange={e => setEditForm({...editForm, timezone: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                            >
                                <option value="Europe/Istanbul">GMT+3 (Istanbul)</option>
                                <option value="Europe/London">GMT+0 (London)</option>
                                <option value="America/New_York">GMT-5 (NYC)</option>
                            </select>
                        </div>
                        <div className="col-span-2 flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Tam Adres</label>
                            <textarea 
                                value={editForm.address || ''} onChange={e => setEditForm({...editForm, address: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-3xl p-6 text-sm font-bold outline-none transition-all resize-none min-h-[120px]"
                            />
                        </div>
                    </div>
                </div>

                {/* İletişim Pazarlama */}
                <div className="bg-white rounded-[3rem] border border-gray-100 p-10 shadow-sm flex flex-col gap-8 md:col-span-2">
                    <div className="flex items-center gap-4 border-b border-gray-50 pb-6">
                        <div className="w-10 h-10 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600"><Settings className="w-5 h-5" /></div>
                        <h4 className="text-[11px] font-black uppercase tracking-widest italic">İletişim & Pazarlama İzinleri</h4>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">SMS İzni</label>
                            <select 
                                value={editForm.smsPermission || 'Hayır'} onChange={e => setEditForm({...editForm, smsPermission: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                            >
                                <option value="Evet">Evet, İzin Ver</option>
                                <option value="Hayır">Hayır, İzin Verme</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">E-Posta İzni</label>
                            <select 
                                value={editForm.emailPermission || 'Evet'} onChange={e => setEditForm({...editForm, emailPermission: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                            >
                                <option value="Evet">Evet, İzin Ver</option>
                                <option value="Hayır">Hayır, İzin Verme</option>
                            </select>
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">İletişim Kaynağı</label>
                            <input 
                                type="text" value={editForm.communicationSource || ''} onChange={e => setEditForm({...editForm, communicationSource: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">İletişim Tercihi</label>
                            <select 
                                value={editForm.communicationChoice || ''} onChange={e => setEditForm({...editForm, communicationChoice: e.target.value})}
                                className="bg-gray-50 border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-bold outline-none transition-all appearance-none"
                            >
                                <option value="">Seçiniz</option>
                                <option value="Telefon">Telefon</option>
                                <option value="WhatsApp">WhatsApp</option>
                                <option value="Email">Email</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
