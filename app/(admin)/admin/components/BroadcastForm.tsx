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
        <div className="max-w-2xl space-y-8 text-left">
            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Anons Başlığı</label>
                <input 
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    placeholder="Örn: Sistem Bakımı, Yeni Özellik Güncellemesi"
                    className="w-full bg-slate-50 border border-indigo-50 rounded-2xl py-5 px-8 text-slate-900 font-black outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Yayın Tipi</label>
                <div className="flex gap-3">
                    {['info', 'warning', 'success', 'danger'].map((t: any) => (
                        <button 
                            key={t}
                            onClick={() => setType(t)}
                            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                                type === t 
                                ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-600/20' 
                                : 'bg-white border-slate-100 text-gray-500'
                            }`}
                        >
                            {t}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest ml-1">Mesaj İçeriği</label>
                <textarea 
                    value={content}
                    onChange={e => setContent(e.target.value)}
                    rows={4}
                    placeholder="Anonsun kısa açıklaması..."
                    className="w-full bg-slate-50 border border-indigo-50 rounded-[2rem] py-5 px-8 text-slate-800 font-medium outline-none focus:border-indigo-500 transition-all shadow-inner"
                />
            </div>

            <button 
                onClick={handleBroadcast}
                disabled={loading}
                className="w-full py-6 bg-indigo-600 text-white rounded-[1.8rem] font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-indigo-600/40 hover:bg-indigo-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
                {loading ? 'YAYINLANIYOR...' : 'KÜRESEL YAYINI BAŞLAT ✓'}
            </button>
        </div>
    );
};
