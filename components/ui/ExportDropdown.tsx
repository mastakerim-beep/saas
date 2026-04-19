"use client";

import { useState, useRef, useEffect } from "react";
import { Download, FileDown, FileSpreadsheet, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { exportToExcel, exportToPDF } from "@/lib/utils/export-utils";

interface ExportDropdownProps {
    data: any[];
    filename: string;
    title: string;
    headers: string[];
    pdfMapping: (item: any, index: number) => any[];
    excelMapping?: (item: any, index: number) => any;
    className?: string;
}

export default function ExportDropdown({ 
    data, 
    filename, 
    title, 
    headers, 
    pdfMapping, 
    excelMapping,
    className = "" 
}: ExportDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleExcelExport = () => {
        const excelData = excelMapping ? data.map((item, idx) => excelMapping(item, idx)) : data;
        exportToExcel(excelData, filename, title);
        setIsOpen(false);
    };

    const handlePDFExport = () => {
        const pdfData = data.map((item, idx) => pdfMapping(item, idx));
        exportToPDF(headers, pdfData, filename, title);
        setIsOpen(false);
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 px-6 py-4 bg-white text-indigo-950 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest border border-indigo-50 hover:bg-indigo-50 transition-all shadow-xl shadow-indigo-100/20"
            >
                <Download size={14} className={isOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                DIŞA AKTAR
                <ChevronDown size={12} className={`ml-1 transition-transform ${isOpen ? "rotate-180" : ""}`} />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 10, scale: 0.95 }}
                        className="absolute right-0 mt-3 w-64 bg-white rounded-[2rem] shadow-2xl shadow-indigo-200/50 border border-indigo-50 p-3 z-[100] origin-top-right overflow-hidden"
                    >
                        <div className="px-4 py-3 border-b border-gray-50 mb-2">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">Format Seçimi</p>
                        </div>
                        
                        <button
                            onClick={handleExcelExport}
                            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-emerald-50 text-gray-600 hover:text-emerald-700 rounded-2xl transition-all group"
                        >
                            <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
                                <FileSpreadsheet size={20} className="text-emerald-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black uppercase tracking-tight">Excel (.xlsx)</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Profesyonel Rapor</p>
                            </div>
                        </button>

                        <button
                            onClick={handlePDFExport}
                            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-rose-50 text-gray-600 hover:text-rose-700 rounded-2xl transition-all group mt-1"
                        >
                            <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center group-hover:bg-rose-100 transition-colors">
                                <FileDown size={20} className="text-rose-600" />
                            </div>
                            <div className="text-left">
                                <p className="text-xs font-black uppercase tracking-tight">PDF Belgesi (.pdf)</p>
                                <p className="text-[9px] font-bold text-gray-400 uppercase">Yazdırılabilir Form</p>
                            </div>
                        </button>

                        <div className="mt-4 p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                            <p className="text-[8px] font-black text-indigo-400 leading-relaxed uppercase tracking-tighter">
                                * Veriler güncel filtrelemeleriniz doğrultusunda hazırlanacaktır.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
