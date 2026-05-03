"use client";

import { motion } from 'framer-motion';
import { User, MessageCircle, RefreshCw, Download, X, MapPin, Globe, Languages, Shield, Tag, ChevronRight, MessageSquare } from 'lucide-react';
import { Customer, Appointment, Payment, Quote, Branch, StaffMember } from '@/lib/store';

interface CustomerTabDetaylarProps {
    customer: Customer;
    appts: Appointment[];
    payments: Payment[];
    customerQuotes: Quote[];
    currentBranch: Branch | null;
    staffMembers: StaffMember[];
    quickNote: string;
    setQuickNote: (note: string) => void;
    onAddAppointment: () => void;
    onAddQuote: () => void;
    onDelete: () => void;
}

export function CustomerTabDetaylar({
    customer,
    appts,
    payments,
    customerQuotes,
    currentBranch,
    staffMembers,
    quickNote,
    setQuickNote,
    onAddAppointment,
    onAddQuote,
    onDelete
}: CustomerTabDetaylarProps) {
    return (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            {/* Col 1: Actions & Profile Summary */}
            <div className="xl:col-span-1 space-y-6">
                <div className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-sm text-center">
                    <div className="w-24 h-24 bg-gray-50 rounded-[2rem] mx-auto mb-6 flex items-center justify-center relative group">
                        <User className="w-12 h-12 text-gray-200" />
                        <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 border-4 border-white rounded-full" />
                    </div>
                    <p className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-6">Aktif</p>
                    
                    <div className="space-y-3">
                        <button 
                            onClick={() => window.open(`https://wa.me/${customer.phone.replace(/\D/g,'')}`, '_blank')}
                            className="w-full py-3 bg-green-50 hover:bg-green-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-green-600 flex items-center justify-center gap-2 transition-all"
                        >
                            <MessageCircle className="w-4 h-4" /> WhatsApp sohbeti başlat
                        </button>
                        <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center justify-center gap-2 transition-all">
                            <RefreshCw className="w-4 h-4" /> Düzenleme geçmişi
                        </button>
                        <button className="w-full py-3 bg-gray-50 hover:bg-gray-100 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500 flex items-center justify-center gap-2 transition-all">
                            <Download className="w-4 h-4" /> Medikal kayıtları indir
                        </button>
                        <button 
                            onClick={onDelete}
                            className="w-full py-3 border border-red-100 text-red-500 hover:bg-red-50 rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                        >
                            <X className="w-4 h-4" /> Sil
                        </button>
                    </div>
                </div>

                {/* Small Quick Stats */}
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { label: 'Randevu', count: appts.length, color: 'text-indigo-600', bg: 'bg-indigo-50', action: onAddAppointment },
                        { label: 'Satış', count: payments.length, color: 'text-green-600', bg: 'bg-green-50', action: () => {} },
                        { label: 'Teklif', count: customerQuotes.length, color: 'text-amber-600', bg: 'bg-amber-50', action: onAddQuote },
                    ].map(stat => (
                        <div key={stat.label} className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm text-center">
                            <p className="text-xl font-black italic text-gray-900">{stat.count}</p>
                            <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest mb-2">{stat.label}</p>
                            <button 
                                onClick={stat.action}
                                className={`w-full py-1.5 ${stat.bg} ${stat.color} rounded-lg text-[8px] font-black uppercase tracking-tighter`}
                            >
                                + Yeni
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Col 2 & 3: Info Blocks */}
            <div className="xl:col-span-2 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
                    <div className="p-8 grid grid-cols-2 gap-x-12 gap-y-8">
                        {/* Personel Bilgi */}
                        <div className="col-span-2 flex items-center gap-3 border-b border-gray-50 pb-4 mb-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 italic">Kişisel Bilgi</h4>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Kayıt Tarihi</span>
                            <span className="text-sm font-bold text-gray-600">{customer.createdAt?.split('T')[0] || '---'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Doğum Tarihi</span>
                            <span className="text-sm font-bold text-gray-600">{customer.birthdate || 'Girilmedi'}</span>
                        </div>

                        {/* Adres Bilgileri */}
                        <div className="col-span-2 flex items-center gap-3 border-b border-gray-50 pb-4 mt-4 mb-2">
                            <MapPin className="w-4 h-4 text-gray-400" />
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 italic">Adres Bilgileri</h4>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Ülke</span>
                            <div className="flex items-center gap-2">
                                <Globe className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-sm font-bold text-gray-600">{customer.country || 'Türkiye'}</span>
                            </div>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Dil</span>
                            <div className="flex items-center gap-2">
                                <Languages className="w-3.5 h-3.5 text-gray-400" />
                                <span className="text-sm font-bold text-gray-600">{customer.language || 'Türkçe'}</span>
                            </div>
                        </div>

                        {/* Diğer Bilgiler */}
                        <div className="col-span-2 flex items-center gap-3 border-b border-gray-50 pb-4 mt-4 mb-2">
                            <Shield className="w-4 h-4 text-gray-400" />
                            <h4 className="text-[11px] font-black uppercase tracking-widest text-gray-900 italic">Diğer Bilgiler</h4>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Kayıt Açan</span>
                            <span className="text-sm font-bold text-gray-600">{currentBranch?.name || 'Aura İşletme'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Segment</span>
                            <span className="text-sm font-bold text-indigo-600">{customer.segment}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Referans Kaynağı</span>
                            <span className="text-sm font-bold text-gray-400 italic">{customer.referenceCode || 'Belirtilmedi'}</span>
                        </div>
                        <div className="flex flex-col gap-1">
                            <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">Değişiklik Tarihi</span>
                            <span className="text-sm font-bold text-gray-400 italic">{customer.createdAt?.split('T')[0] || '---'} 21:22</span>
                        </div>
                    </div>
                </div>
                
                {/* Tags Section */}
                <div className="bg-white rounded-[2rem] border border-gray-100 shadow-sm p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h4 className="text-[11px] font-black uppercase tracking-widest flex items-center gap-2"><Tag className="w-4 h-4" /> Etiketler</h4>
                        <ChevronRight className="w-4 h-4 text-gray-300" />
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {['Sadık Müşteri', 'Masaj Müptelası', 'VIP'].map(tag => (
                            <span key={tag} className="px-3 py-1 bg-gray-50 border border-gray-100 rounded-lg text-[10px] font-bold text-gray-500 uppercase tracking-tighter">#{tag}</span>
                        ))}
                        <button className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-bold uppercase tracking-tighter hover:bg-indigo-100 transition-colors">+ Ekle</button>
                    </div>
                </div>
            </div>

            {/* Col 4: Notes */}
            <div className="xl:col-span-1 space-y-6">
                <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-lg p-8 h-full flex flex-col">
                    <h4 className="text-[11px] font-black uppercase tracking-widest mb-6 flex items-center gap-2 italic"><MessageSquare className="w-4 h-4" /> Notlar</h4>
                    
                    <div className="flex flex-col gap-4">
                        <div className="space-y-2">
                            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Hızlı Not</label>
                            <textarea 
                                value={quickNote}
                                onChange={e => setQuickNote(e.target.value)}
                                placeholder="Notunuzu giriniz..."
                                className="w-full bg-[#FAF9F6] border border-transparent focus:bg-white focus:border-indigo-100 rounded-2xl p-4 text-sm font-medium outline-none transition-all resize-none min-h-[120px]" 
                            />
                            <button className="w-full py-3 bg-black text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-black/10 hover:scale-[1.02] transition-all">Kaydet</button>
                        </div>
                        
                        <div className="mt-8 pt-8 border-t border-gray-50 space-y-4">
                            {customer.note ? (
                                 <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
                                     <p className="text-xs font-medium text-amber-700 leading-relaxed italic">"{customer.note}"</p>
                                 </div>
                            ) : (
                                <div className="py-20 text-center flex flex-col items-center gap-4">
                                    <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center text-gray-200"><MessageCircle className="w-6 h-6" /></div>
                                    <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest leading-tight px-10">Danışana ait kayıtlı not bulunmamaktadır</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
