'use client';

import React, { useState } from 'react';
import { Upload, CheckCircle2, AlertCircle, ArrowRight, Loader2, FileSpreadsheet, Ghost } from 'lucide-react';
import * as XLSX from 'xlsx';
import { MigrationEngine, MigrationItem, MigrationHealthReport } from '@/lib/migration/engine';
import { useBusiness } from '@/lib/store/BusinessContext';

type Step = 'select' | 'upload' | 'mapping' | 'validation' | 'executing' | 'success';

export const MigrationWizard: React.FC = () => {
    const { business } = useBusiness();
    const [step, setStep] = useState<Step>('select');
    const [dataType, setDataType] = useState<'customer' | 'service' | 'appointment'>('customer');
    const [rawData, setRawData] = useState<any[]>([]);
    const [columns, setColumns] = useState<string[]>([]);
    const [mapping, setMapping] = useState<Record<string, string>>({});
    const [report, setReport] = useState<MigrationHealthReport | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // Adım 1: Dosya Okuma
    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            const bstr = evt.target?.result;
            const wb = XLSX.read(bstr, { type: 'binary' });
            const wsname = wb.SheetNames[0];
            const ws = wb.Sheets[wsname];
            const data = XLSX.utils.sheet_to_json(ws);
            
            if (data.length > 0) {
                setRawData(data);
                setColumns(Object.keys(data[0] as any));
                setStep('mapping');
            }
        };
        reader.readAsBinaryString(file);
    };

    // Adım 3: Validasyon Başlat
    const startValidation = async () => {
        if (!business) return;
        setIsLoading(true);
        setStep('validation');

        try {
            const engine = new MigrationEngine(business.id);
            
            // Veriyi maple
            const items: MigrationItem[] = rawData.map(row => {
                const mappedRow: any = {};
                Object.entries(mapping).forEach(([systemKey, excelKey]) => {
                    mappedRow[systemKey] = row[excelKey];
                });
                return { type: dataType as any, data: mappedRow };
            });

            await engine.uploadToStaging(items);
            const healthReport = await engine.validateStaging();
            setReport(healthReport);
        } catch (error) {
            console.error('Validation failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    // Adım 4: Final Aktarım
    const runMigration = async () => {
        if (!business) return;
        setIsLoading(true);
        setStep('executing');

        try {
            const engine = new MigrationEngine(business.id);
            await engine.executeMigration();
            setStep('success');
        } catch (error) {
            console.error('Migration failed:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-6 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-800">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-2">
                        <FileSpreadsheet className="text-indigo-500" /> Master Migration Engine
                    </h2>
                    <p className="text-slate-500 dark:text-slate-400">Verileri sisteme "en iyi" hızla yükleyin.</p>
                </div>
                <div className="flex gap-1">
                    {['select', 'upload', 'mapping', 'validation', 'success'].map((s, idx) => (
                        <div key={s} className={`h-1.5 w-12 rounded-full ${['select', 'upload', 'mapping', 'validation', 'executing', 'success'].indexOf(step) >= idx ? 'bg-indigo-500' : 'bg-slate-200 dark:bg-slate-700'}`} />
                    ))}
                </div>
            </div>

            {/* Steps Rendering */}
            {step === 'select' && (
                <div className="grid grid-cols-3 gap-4">
                    {[
                        { id: 'customer', label: 'Müşteriler', icon: '👥' },
                        { id: 'service', label: 'Hizmetler', icon: '💆' },
                        { id: 'appointment', label: 'Geçmiş Randevular', icon: '📅' }
                    ].map(type => (
                        <button 
                            key={type.id}
                            onClick={() => { setDataType(type.id as any); setStep('upload'); }}
                            className="p-8 border-2 border-slate-100 dark:border-slate-800 rounded-xl hover:border-indigo-500 transition-all text-center group"
                        >
                            <span className="text-4xl mb-4 block group-hover:scale-110 transition-transform">{type.icon}</span>
                            <span className="font-semibold dark:text-white">{type.label}</span>
                        </button>
                    ))}
                </div>
            )}

            {step === 'upload' && (
                <div className="border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl p-12 text-center">
                    <input type="file" id="file-upload" className="hidden" accept=".xlsx,.csv" onChange={handleFileUpload} />
                    <label htmlFor="file-upload" className="cursor-pointer">
                        <div className="bg-indigo-50 dark:bg-indigo-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Upload className="text-indigo-500" size={32} />
                        </div>
                        <h4 className="text-xl font-bold dark:text-white mb-2">Excel veya CSV Dosyası Seçin</h4>
                        <p className="text-slate-500 mb-6">Mevcut işletme verilerini içeren dosyayı sürükleyin.</p>
                        <span className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors">Dosya Seç</span>
                    </label>
                </div>
            )}

            {step === 'mapping' && (
                <div className="space-y-6">
                    <p className="font-semibold dark:text-white">Excel sütunlarını sistemle eşleştirin:</p>
                    <div className="grid grid-cols-2 gap-4">
                        {(dataType === 'customer' ? ['name', 'phone', 'email', 'note'] : 
                          dataType === 'service' ? ['name', 'price', 'duration'] : 
                          ['customer_name', 'customer_phone', 'service', 'staff_name', 'date', 'time', 'price']
                        ).map(key => (
                            <div key={key} className="flex flex-col gap-2 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl">
                                <label className="text-xs uppercase font-bold text-slate-500 tracking-wider font-mono">{key}</label>
                                <select 
                                    className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 outline-none"
                                    onChange={(e) => setMapping(prev => ({ ...prev, [key]: e.target.value }))}
                                >
                                    <option value="">Seçiniz...</option>
                                    {columns.map(col => <option key={col} value={col}>{col}</option>)}
                                </select>
                            </div>
                        ))}
                    </div>
                    <button 
                        onClick={startValidation}
                        disabled={Object.keys(mapping).length === 0}
                        className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 disabled:opacity-50"
                    >
                        Doğrulamayı Başlat <ArrowRight size={20} />
                    </button>
                </div>
            )}

            {step === 'validation' && (
                <div className="text-center py-12">
                    {isLoading ? (
                        <div className="space-y-4">
                            <Loader2 className="animate-spin mx-auto text-indigo-500" size={48} />
                            <p className="text-slate-600 dark:text-slate-400 animate-pulse">Veriler stagging alanına alınıyor ve kontrol ediliyor...</p>
                        </div>
                    ) : report && (
                        <div className="space-y-8 animate-in fade-in zoom-in duration-300">
                            <div className="grid grid-cols-3 gap-4">
                                <div className="bg-indigo-50 dark:bg-indigo-500/10 p-6 rounded-2xl">
                                    <span className="text-3xl font-bold text-indigo-600 block">{report.total}</span>
                                    <span className="text-sm text-indigo-500 font-medium">Toplam Veri</span>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-500/10 p-6 rounded-2xl">
                                    <span className="text-3xl font-bold text-emerald-600 block">{report.passed}</span>
                                    <span className="text-sm text-emerald-500 font-medium">Geçerli / Hazır</span>
                                </div>
                                <div className="bg-rose-50 dark:bg-rose-500/10 p-6 rounded-2xl">
                                    <span className="text-3xl font-bold text-rose-600 block">{report.failed}</span>
                                    <span className="text-sm text-rose-500 font-medium">Hatalı Kayıt</span>
                                </div>
                            </div>

                            {report.autoMatches.length > 0 && (
                                <div className="bg-amber-50 dark:bg-amber-500/10 p-4 rounded-xl text-left border border-amber-100 dark:border-amber-900/30">
                                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-semibold mb-2">
                                        <Ghost size={18} /> Akıllı Eşleştirme Tespit Edildi
                                    </div>
                                    <ul className="text-sm space-y-1 text-amber-600 dark:text-amber-500">
                                        {report.autoMatches.map((m, i) => (
                                            <li key={i}>• "{m.original}" hizmetini sistemdeki "{m.matchedWith}" ile birleştireceğiz.</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {report.failed > 0 && (
                                <div className="text-left bg-slate-50 dark:bg-slate-800/40 p-4 rounded-xl">
                                    <h5 className="font-bold text-rose-500 mb-2 flex items-center gap-2"><AlertCircle size={16} /> Kritik Hatalar:</h5>
                                    <div className="max-h-40 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                                        {report.errors.map((err, i) => (
                                            <div key={i} className="text-sm p-3 border-l-4 border-rose-500 bg-white dark:bg-slate-800 shadow-sm rounded-r-lg">
                                                <p className="font-bold">{err.data.name || err.data.customer_name || 'İsimsiz Kayıt'}</p>
                                                <p className="text-slate-500">{err.note}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-3">
                                <button onClick={() => setStep('mapping')} className="flex-1 py-4 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 rounded-xl font-bold">Geri Dön</button>
                                <button onClick={runMigration} className="flex-[2] py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700">Güvenli Aktarımı Başlat</button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {step === 'executing' && (
                <div className="text-center py-20">
                    <Loader2 className="animate-spin mx-auto text-indigo-500 mb-6" size={64} />
                    <h3 className="text-2xl font-bold dark:text-white mb-2">Final Aktarımı Yapılıyor</h3>
                    <p className="text-slate-500">Sistem veritabanı bağlarını kuruyor ve randevuları takvime işliyor...</p>
                </div>
            )}

            {step === 'success' && (
                <div className="text-center py-12 animate-in zoom-in duration-500">
                    <div className="bg-emerald-100 dark:bg-emerald-500/20 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle2 className="text-emerald-500" size={48} />
                    </div>
                    <h3 className="text-3xl font-bold dark:text-white mb-4">Mükemmel! İşlem Tamamlandı.</h3>
                    <p className="text-slate-500 mb-8 max-w-sm mx-auto">Tüm veriler başarıyla aktarıldı. İşletme artık tam kapasiteyle çalışmaya hazır.</p>
                    <button onClick={() => window.location.reload()} className="px-8 py-3 bg-slate-800 dark:bg-slate-700 text-white rounded-xl hover:bg-slate-700 transition-colors">Yönetime Dön</button>
                </div>
            )}
        </div>
    );
};
