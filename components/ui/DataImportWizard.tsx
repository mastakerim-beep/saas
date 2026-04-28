"use client";

import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
    X, Upload, FileSpreadsheet, CheckCircle2, AlertCircle, 
    ChevronRight, ArrowRight, Table, Settings2, Zap, ShieldCheck,
    RefreshCw, Search, Filter, Database, Users
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useStore } from '@/lib/store';

interface DataImportWizardProps {
    onClose: () => void;
    type: 'customers' | 'services' | 'staff' | 'products';
}

export default function DataImportWizard({ onClose, type }: DataImportWizardProps) {
    const { addCustomer, addService, addStaff, addProduct } = useStore();
    const [step, setStep] = useState(1);
    const [file, setFile] = useState<File | null>(null);
    const [data, setData] = useState<any[]>([]);
    const [headers, setHeaders] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [isImporting, setIsImporting] = useState(false);
    const [results, setResults] = useState<{ success: number; failed: number }>({ success: 0, failed: 0 });

    const systemFields = {
        customers: [
            { id: 'name', label: 'Ad Soyad', required: true },
            { id: 'phone', label: 'Telefon', required: true },
            { id: 'email', label: 'E-posta', required: false },
            { id: 'birthdate', label: 'Doğum Tarihi', required: false },
            { id: 'segment', label: 'Segment (VIP/Normal)', required: false },
            { id: 'note', label: 'Özel Notlar', required: false }
        ],
        services: [
            { id: 'name', label: 'Hizmet Adı', required: true },
            { id: 'price', label: 'Fiyat', required: true },
            { id: 'duration', label: 'Süre (Dakika)', required: true },
            { id: 'category', label: 'Kategori', required: false }
        ],
        staff: [
            { id: 'name', label: 'Ad Soyad', required: true },
            { id: 'role', label: 'Unvan', required: true },
            { id: 'phone', label: 'Telefon', required: false }
        ],
        products: [
            { id: 'name', label: 'Ürün Adı', required: true },
            { id: 'price', label: 'Satış Fiyatı', required: true },
            { id: 'stock', label: 'Stok Adedi', required: true },
            { id: 'sku', label: 'Barkod/SKU', required: false },
            { id: 'category', label: 'Kategori', required: false }
        ]
    }[type];

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setFile(file);

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const jsonData = XLSX.utils.sheet_to_json(ws, { header: 1 });
            
            if (jsonData.length > 0) {
                const headerRow: any = jsonData[0];
                setHeaders(headerRow);
                setData(jsonData.slice(1));
                
                // Auto-mapping logic
                const newMapping: Record<string, string> = {};
                headerRow.forEach((h: string) => {
                    const match = systemFields.find(f => 
                        h.toLowerCase().includes(f.id.toLowerCase()) || 
                        h.toLowerCase().includes(f.label.toLowerCase())
                    );
                    if (match) newMapping[h] = match.id;
                });
                setMapping(newMapping);
            }
            setStep(2);
        };
        reader.readAsBinaryString(file);
    };

    const runImport = async () => {
        setIsImporting(true);
        let success = 0;
        let failed = 0;

        for (const row of data) {
            try {
                const item: any = {};
                headers.forEach((h, idx) => {
                    const fieldId = mapping[h];
                    if (fieldId) item[fieldId] = row[idx];
                });

                if (type === 'customers') await addCustomer(item);
                else if (type === 'services') await addService(item);
                else if (type === 'staff') await addStaff(item);
                else if (type === 'products') await addProduct(item);
                
                success++;
            } catch (err) {
                console.error('Import error for row:', row, err);
                failed++;
            }
        }

        setResults({ success, failed });
        setIsImporting(false);
        setStep(3);
    };

    return (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-2xl z-[1000] flex items-center justify-center p-6">
            <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 40 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                className="bg-[#0a0b14] border border-white/5 rounded-[4rem] w-full max-w-4xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,1)] relative"
            >
                {/* Background Glow */}
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-indigo-600/10 rounded-full blur-[100px] pointer-events-none" />
                <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-purple-600/10 rounded-full blur-[100px] pointer-events-none" />

                <div className="p-16 relative z-10">
                    {/* Header */}
                    <div className="flex justify-between items-start mb-16">
                        <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                {[1, 2, 3].map(i => (
                                    <React.Fragment key={i}>
                                        <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xs font-black transition-all border-2 ${
                                            step >= i ? 'bg-indigo-600 border-indigo-400 text-white shadow-[0_0_20px_rgba(79,70,229,0.4)]' : 'bg-slate-900 border-slate-800 text-slate-600'
                                        }`}>
                                            {step > i ? <CheckCircle2 size={16} strokeWidth={3} /> : i}
                                        </div>
                                        {i < 3 && <div className={`h-[2px] w-8 rounded-full ${step > i ? 'bg-indigo-600' : 'bg-slate-800'}`} />}
                                    </React.Fragment>
                                ))}
                            </div>
                            <div>
                                <h2 className="text-white text-4xl font-black italic uppercase tracking-tighter leading-none">Veri Aktarıcı</h2>
                                <p className="text-[10px] font-bold text-indigo-400 uppercase tracking-[0.4em] mt-3">Imperial Entegrasyon Aşaması {step}</p>
                            </div>
                        </div>
                        <button onClick={onClose} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-3xl flex items-center justify-center text-slate-400 transition-all border border-white/5 group">
                            <X size={24} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>
                    </div>

                    <div className="min-h-[400px]">
                        <AnimatePresence mode="wait">
                            {step === 1 && (
                                <motion.div 
                                    key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                                    className="flex flex-col items-center justify-center h-full space-y-10"
                                >
                                    <div className="relative group cursor-pointer w-full max-w-2xl">
                                        <input type="file" accept=".xlsx, .xls, .csv" onChange={handleFileUpload} className="absolute inset-0 w-full h-full opacity-0 z-50 cursor-pointer" />
                                        <div className="border-4 border-dashed border-white/5 bg-white/[0.02] group-hover:bg-indigo-600/[0.03] group-hover:border-indigo-500/30 rounded-[3rem] p-20 text-center transition-all duration-500">
                                            <div className="w-24 h-24 bg-indigo-600/10 rounded-[2.5rem] flex items-center justify-center mx-auto mb-8 shadow-inner group-hover:scale-110 group-hover:shadow-[0_0_30px_rgba(79,70,229,0.3)] transition-all duration-500">
                                                <Upload className="w-10 h-10 text-indigo-400" />
                                            </div>
                                            <h3 className="text-white text-2xl font-black italic uppercase tracking-tight mb-2">Veri Kaynağını Yükle</h3>
                                            <p className="text-slate-500 text-xs font-bold uppercase tracking-widest leading-relaxed">Excel veya CSV dosyasını buraya sürükleyin<br/>Imperial desteği: .xlsx, .xls, .csv</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-4 text-slate-600 text-[10px] font-black uppercase tracking-[0.2em]">
                                        <span className="flex items-center gap-2"><Database size={12} /> Otomatik Eşleştirme</span>
                                        <span className="opacity-20">|</span>
                                        <span className="flex items-center gap-2"><ShieldCheck size={12} /> Bütünlük Doğrulaması</span>
                                        <span className="opacity-20">|</span>
                                        <span className="flex items-center gap-2"><Zap size={12} /> Yüksek Hızlı Senkron</span>
                                    </div>
                                </motion.div>
                            )}

                            {step === 2 && (
                                <motion.div 
                                    key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}
                                    className="space-y-10"
                                >
                                    <div className="grid grid-cols-2 gap-8">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 space-y-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Settings2 className="text-indigo-400" size={20} />
                                                <h4 className="text-white text-xs font-black uppercase tracking-widest italic">Aktarım Matrisi (Alan Eşleştirme)</h4>
                                            </div>
                                            <div className="space-y-4 max-h-[400px] overflow-y-auto pr-4 no-scrollbar">
                                                {headers.map(header => (
                                                    <div key={header} className="group p-4 bg-white/[0.02] hover:bg-white/[0.05] border border-white/5 rounded-2xl flex items-center justify-between transition-all">
                                                        <div className="flex flex-col">
                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Excel Sütunu</span>
                                                            <span className="text-xs font-bold text-white italic">{header}</span>
                                                        </div>
                                                        <ArrowRight size={14} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                                                        <div className="w-1/2">
                                                            <select 
                                                                value={mapping[header] || ''} 
                                                                onChange={(e) => setMapping({ ...mapping, [header]: e.target.value })}
                                                                className="w-full bg-slate-900/50 border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black text-indigo-300 uppercase tracking-widest outline-none focus:border-indigo-500 transition-all cursor-pointer"
                                                            >
                                                                <option value="">-- Yoksay --</option>
                                                                {systemFields.map(f => (
                                                                    <option key={f.id} value={f.id} className="bg-[#0f111a]">{f.label} {f.required ? '*' : ''}</option>
                                                                ))}
                                                            </select>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="bg-white/[0.02] border border-white/5 rounded-[3rem] p-10 h-1/2 overflow-hidden">
                                                <div className="flex items-center gap-3 mb-6">
                                                    <Search className="text-indigo-400" size={20} />
                                                    <h4 className="text-white text-xs font-black uppercase tracking-widest italic">Veri Önizleme & Denetim</h4>
                                                </div>
                                                <div className="overflow-auto max-h-[300px] rounded-2xl border border-white/5 bg-black/40 no-scrollbar">
                                                    <table className="w-full text-[10px] font-bold text-slate-400 text-left border-collapse">
                                                        <thead className="bg-white/5 sticky top-0">
                                                            <tr>
                                                                {headers.map(h => <th key={h} className="p-4 border-b border-white/5 uppercase tracking-tighter whitespace-nowrap">{h}</th>)}
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-white/[0.02]">
                                                            {data.slice(0, 5).map((row, i) => (
                                                                <tr key={i} className="hover:bg-white/[0.01]">
                                                                    {row.map((cell: any, j: number) => <td key={j} className="p-4 whitespace-nowrap opacity-60">{cell}</td>)}
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                                <p className="mt-4 text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] text-center italic">— Toplam {data.length} satır tespit edildi —</p>
                                            </div>
                                            
                                            <button 
                                                onClick={runImport}
                                                disabled={isImporting}
                                                className="w-full py-8 bg-white text-black rounded-[2.5rem] font-black text-sm uppercase tracking-[0.3em] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-4 group"
                                            >
                                                {isImporting ? <RefreshCw className="animate-spin" size={20} /> : <Zap size={20} className="group-hover:text-indigo-600" />}
                                                AKTARIM SÜRECİNİ BAŞLAT
                                            </button>
                                            <button onClick={() => setStep(1)} className="w-full py-6 bg-slate-900/50 text-slate-500 rounded-[2rem] font-black text-[10px] uppercase tracking-widest border border-white/5 hover:text-slate-300 transition-all">İPTAL ET / GERİ DÖN</button>
                                        </div>
                                    </div>
                                </motion.div>
                            )}

                            {step === 3 && (
                                <motion.div 
                                    key="s3" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                                    className="flex flex-col items-center justify-center h-full space-y-12 py-10"
                                >
                                    <div className="relative">
                                        <div className="w-48 h-48 bg-green-500/10 rounded-full flex items-center justify-center shadow-[0_0_80px_rgba(34,197,94,0.1)]">
                                            <CheckCircle2 size={80} className="text-green-500" strokeWidth={1.5} />
                                        </div>
                                        <motion.div 
                                            initial={{ rotate: 0 }} animate={{ rotate: 360 }} transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                                            className="absolute inset-[-20px] border-2 border-dashed border-green-500/20 rounded-full"
                                        />
                                    </div>

                                    <div className="text-center space-y-4">
                                        <h3 className="text-white text-4xl font-black italic uppercase tracking-tighter italic">Aktarım Tamamlandı</h3>
                                        <p className="text-slate-500 text-xs font-black uppercase tracking-[0.4em]">Sistem Senkronizasyon Raporu</p>
                                    </div>

                                    <div className="flex gap-8">
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-10 w-48 text-center space-y-2">
                                            <p className="text-4xl font-black text-green-500">{results.success}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Başarılı Kayıtlar</p>
                                        </div>
                                        <div className="bg-white/[0.02] border border-white/5 rounded-3xl p-10 w-48 text-center space-y-2">
                                            <p className="text-4xl font-black text-rose-500">{results.failed}</p>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Hatalı Paketler</p>
                                        </div>
                                    </div>

                                    <button 
                                        onClick={onClose}
                                        className="py-6 px-16 bg-indigo-600 text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.3em] shadow-xl shadow-indigo-600/20 hover:scale-105 active:scale-95 transition-all"
                                    >
                                        KONTROL MERKEZİNE DÖN
                                    </button>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
