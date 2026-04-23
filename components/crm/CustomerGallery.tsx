"use client";

import { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Plus, Trash2, Maximize2, X, ChevronLeft, ChevronRight, History, UploadCloud, Info } from 'lucide-react';
import { useStore, CustomerMedia } from '@/lib/store';
import { supabase } from '@/lib/supabase';

interface CustomerGalleryProps {
    customerId: string;
}

export default function CustomerGallery({ customerId }: CustomerGalleryProps) {
    const { currentUser, customerMedia, addCustomerMedia, deleteCustomerMedia } = useStore();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [selectedImage, setSelectedImage] = useState<CustomerMedia | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const media = customerMedia.filter(m => m.customerId === customerId).sort((a,b) => new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime());

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !currentUser?.businessId) return;

        try {
            setIsUploading(true);
            setUploadProgress(10);

            // 1. Upload to Supabase Storage
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
            const filePath = `${currentUser?.businessId || 'global'}/${customerId}/${fileName}`;

            const { data: uploadData, error: uploadError } = await supabase.storage
                .from('customer-media')
                .upload(filePath, file, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (uploadError) throw uploadError;
            setUploadProgress(70);

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('customer-media')
                .getPublicUrl(filePath);

            // 3. Add to Database via Store
            addCustomerMedia({
                customerId,
                fileUrl: publicUrl,
                fileType: media.length === 0 ? 'before' : 'after', // First image is 'before', others 'after' by default
                note: 'Manuel Geri Bildirim',
                createdAt: new Date().toISOString()
            });

            setUploadProgress(100);
            setTimeout(() => {
                setIsUploading(false);
                setUploadProgress(0);
            }, 500);

        } catch (error: any) {
            console.error('Upload Error:', error);
            alert('Yükleme başarısız: ' + error.message);
            setIsUploading(false);
        }
    };

    const handleDelete = (id: string) => {
        if (confirm('Bu görseli kalıcı olarak silmek istediğinize emin misiniz?')) {
            deleteCustomerMedia(id);
            setSelectedImage(null);
        }
    };

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-sm font-black text-gray-900 leading-none">Gelişim Galerisi</h3>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Görsel Kayıt ve Analiz</p>
                </div>
                <div className="flex gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileSelect} 
                        className="hidden" 
                        accept="image/*"
                    />
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="p-3 bg-indigo-600 text-white rounded-2xl hover:scale-105 active:scale-95 transition shadow-lg shadow-indigo-100 disabled:opacity-50 flex items-center gap-2"
                    >
                        {isUploading ? (
                            <div className="flex items-center gap-2 px-2">
                                <History className="w-4 h-4 animate-spin" />
                                <span className="text-[10px] font-black tracking-tighter">%{uploadProgress}</span>
                            </div>
                        ) : (
                            <>
                                <UploadCloud className="w-5 h-5" />
                                <span className="text-[10px] font-black hidden sm:inline uppercase tracking-widest px-1">YÜKLE</span>
                            </>
                        )}
                    </button>
                </div>
            </div>

            {media.length === 0 ? (
                <div className="bg-gray-50 border-2 border-dashed border-gray-100 rounded-[2rem] p-10 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-gray-300 mb-4 shadow-sm">
                        <ImageIcon size={32} />
                    </div>
                    <p className="text-xs font-black text-gray-400 uppercase tracking-widest">Henüz Görsel Bulunmuyor</p>
                    <p className="text-[10px] text-gray-300 mt-2 italic px-8">Müşterinin seans gelişimini takip etmek için ilk fotoğrafı yükleyin.</p>
                </div>
            ) : (
                <div className="grid grid-cols-2 gap-3">
                    {media.map((item) => (
                        <div 
                            key={item.id} 
                            onClick={() => setSelectedImage(item)}
                            className="group relative aspect-[4/5] rounded-[1.5rem] overflow-hidden border border-gray-100 cursor-pointer hover:ring-4 ring-indigo-50 transition-all"
                        >
                            <img src={item.fileUrl} alt={item.note} className="w-full h-full object-cover transition duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-4">
                                <p className="text-[10px] font-black text-white uppercase tracking-widest leading-none mb-1">{item.fileType?.toUpperCase()}</p>
                                <p className="text-[9px] text-white/70 font-bold italic line-clamp-1">{item.createdAt?.split('T')[0]}</p>
                            </div>
                            <div className={`absolute top-3 left-3 px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter ${
                                item.fileType === 'before' ? 'bg-amber-400 text-amber-900' : 'bg-emerald-400 text-emerald-900'
                            }`}>
                                {item.fileType === 'before' ? 'ÖNCE' : 'SONRA'}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Lightbox / Preview */}
            {selectedImage && (
                <div className="fixed inset-0 bg-black/95 backdrop-blur-xl z-[300] flex items-center justify-center p-4 sm:p-20">
                    <button onClick={() => setSelectedImage(null)} className="absolute top-10 right-10 p-4 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition backdrop-blur-md">
                        <X size={24} />
                    </button>
                    
                    <div className="max-w-xl w-full flex flex-col gap-6">
                        <div className="relative rounded-[3rem] overflow-hidden shadow-2xl border border-white/10 bg-black/40">
                            <img src={selectedImage.fileUrl} alt="Gelişim" className="w-full max-h-[60vh] object-contain" />
                            <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-black via-black/60 to-transparent">
                                <div className="flex items-center gap-3 mb-2">
                                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${
                                        selectedImage.fileType === 'before' ? 'bg-amber-400 text-amber-900' : 'bg-emerald-400 text-emerald-900'
                                    }`}>
                                        {selectedImage.fileType === 'before' ? 'Başlangıç (Önce)' : 'Sonuç (Sonra)'}
                                    </span>
                                    <span className="text-[10px] font-bold text-white/50 tracking-widest">{selectedImage.createdAt?.split('T')[0]}</span>
                                </div>
                                <h4 className="text-lg font-black text-white italic tracking-tight">{selectedImage.note}</h4>
                            </div>
                        </div>
                        
                        <div className="flex gap-4">
                            <button 
                                className="flex-1 py-5 bg-white/10 hover:bg-white/20 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest transition backdrop-blur-md flex items-center justify-center gap-2"
                            >
                                <Info size={16}/> NOTU DÜZENLE
                            </button>
                            <button 
                                onClick={() => handleDelete(selectedImage.id)}
                                className="flex-1 py-5 bg-red-500/10 hover:bg-red-500 text-white rounded-3xl font-black text-[10px] uppercase tracking-widest transition backdrop-blur-md group flex items-center justify-center gap-2"
                            >
                                <Trash2 size={16} className="group-hover:scale-110 transition"/> GÖRSELİ SİL
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
