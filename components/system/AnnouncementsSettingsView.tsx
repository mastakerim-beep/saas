"use client";

import { useState } from 'react';
import { useStore, NotificationLog } from '@/lib/store';
import { Megaphone } from 'lucide-react';

export default function AnnouncementsSettingsView() {
    const { broadcastAnnouncement, allNotifs, currentBusiness } = useStore();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [type, setType] = useState<'info' | 'warning' | 'success' | 'danger'>('info');

    const handleSend = async () => {
        if (!title || !content) return;
        await broadcastAnnouncement(title, content, type);
        setTitle("");
        setContent("");
    };

    const myNotifs = (allNotifs || []).filter(n => n.businessId === currentBusiness?.id);

    return (
        <div className="space-y-12">
            <div className="bg-white rounded-[3.5rem] p-10 border border-indigo-50 shadow-sm">
                <h3 className="text-xl font-black text-gray-900 uppercase italic tracking-tighter mb-8 flex items-center gap-3">
                    <Megaphone className="text-indigo-600" size={24} />
                    YENİ DUYURU YAYINLA
                </h3>
                <div className="space-y-6 max-w-2xl">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Duyuru Başlığı</label>
                        <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Örn: Hafta Sonu Kampanyası" className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Duyuru İçeriği</label>
                        <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Tüm şubelerdeki çalışma arkadaşlarımıza ve müşterilerimize iletilecek mesaj..." rows={3} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100" />
                    </div>
                    <div className="flex gap-4">
                        <div className="flex-1 space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Tür</label>
                            <select value={type} onChange={e => setType(e.target.value as any)} className="w-full bg-gray-50 border-none rounded-2xl px-6 py-4 font-black text-gray-900 outline-none focus:ring-2 focus:ring-indigo-100 italic uppercase tracking-tighter">
                                <option value="info">BİLGİLENDİRME</option>
                                <option value="warning">UYARI</option>
                                <option value="success">GÜZEL HABER</option>
                                <option value="danger">KRİTİK</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button onClick={handleSend} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-indigo-100 hover:scale-105 active:scale-95 transition-all">
                                DUYURUYU YAYINLA ✓
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h3 className="text-sm font-black text-gray-900 uppercase tracking-widest flex items-center gap-3">
                    BİZE ÖZEL GEÇMİŞ DUYURULAR
                </h3>
                <div className="grid gap-4">
                    {myNotifs.length === 0 && <p className="text-xs font-bold text-gray-400 italic">Henüz bir duyuru yayınlamadınız.</p>}
                    {myNotifs.map((n, i) => (
                        <div key={i} className="bg-white p-6 rounded-[2rem] border border-gray-50 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white ${n.type === 'danger' ? 'bg-rose-500' : n.type === 'warning' ? 'bg-amber-500' : 'bg-indigo-600'}`}>
                                    <Megaphone size={18} />
                                </div>
                                <div>
                                    <h4 className="font-black text-gray-900 uppercase tracking-tight">{(n as any).title || n.content}</h4>
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{new Date(n.sentAt || '').toLocaleDateString('tr-TR')} • {n.type}</p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
