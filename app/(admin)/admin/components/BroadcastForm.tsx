import React, { useState } from 'react';
import { useStore } from '@/lib/store';

export const BroadcastForm = () => {
    const { broadcastAnnouncement } = useStore();
    const [title, setTitle] = useState('');
    const [content, setContent] = useState('');
    const [type, setType] = useState<'info' | 'warning' | 'success' | 'danger'>('info');
    const [loading, setLoading] = useState(false);

    const handleBroadcast = async () => {
        if (!title || !content) return alert("Bütün alanlar zorunludur.");
        setLoading(true);
        try {
            await broadcastAnnouncement(title, content, type);
            alert("YAYIN BAŞARIYLA İLETİLDİ");
            setTitle('');
            setContent('');
        } catch (err) {
            alert("İLETİM HATASI");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-3xl space-y-10 text-left">
            <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Anons Başlığı</label>
                <input 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Örn: Sistem Bakımı, Yeni Özellik Güncellemesi"
                    className="w-full bg-slate-50 border border-indigo-100 rounded-[1.5rem] py-6 px-10 text-slate-900 font-black outline-none focus:border-indigo-500 transition-all shadow-inner text-sm"
                />
            </div>

            <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Yayın Tipi</label>
                <div className="flex gap-4">
                    {['info', 'warning', 'success', 'danger'].map((t: any) => (
                        <button 
                            key={t}
                            onClick={() => setType(t)}
                            className={`flex-1 py-4 rounded-[1.2rem] text-[11px] font-black uppercase tracking-[0.15em] border-2 transition-all ${
                                type === t 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-xl shadow-indigo-600/20' 
                                : 'bg-white border-slate-100 text-slate-400 hover:border-indigo-200'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[12px] font-black text-slate-400 uppercase tracking-[0.2em] ml-2">Mesaj İçeriği</label>
                <textarea 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={6}
                    placeholder="Anonsun detaylı açıklaması..."
                    className="w-full bg-slate-50 border border-indigo-100 rounded-[2.5rem] py-6 px-10 text-slate-800 font-medium outline-none focus:border-indigo-500 transition-all shadow-inner text-sm leading-relaxed"
                />
            </div>

            <button 
                onClick={handleBroadcast}
                disabled={loading}
                className="w-full py-7 bg-slate-900 text-white rounded-[2.5rem] font-black text-[14px] uppercase tracking-[0.3em] shadow-2xl hover:bg-indigo-600 active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {loading ? 'SİSTEME DAĞITILIYOR...' : 'KÜRESEL YAYINI BAŞLAT ✓'}
            </button>
        </div>
    );
};
