"use client";

import { useStore } from "@/lib/store";
import { useState, useMemo, useRef, useEffect } from "react";
import { Search, User, Calendar, Briefcase, X, ChevronRight, Hash } from "lucide-react";
import { AuditLog, Customer, Appointment, Staff } from "@/lib/store/types";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useParams } from "next/navigation";

export default function GlobalSearch() {
    const { customers, appointments, staffMembers, currentBusiness, currentBranch } = useStore();
    const [searchTerm, setSearchTerm] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const router = useRouter();
    const params = useParams();
    const slug = params.slug;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const results = useMemo(() => {
        if (searchTerm.length < 2) return { customers: [], appointments: [], staff: [] };

        const term = searchTerm.toLowerCase();

        // 1. Customers: Always scoped to Business (Universal across branches)
        const filteredCustomers = customers.filter((c: Customer) => 
            c.name.toLowerCase().includes(term) || 
            (c.phone && String(c.phone).includes(term))
        ).slice(0, 5);

        // 2. Appointments: Scoped to current branch if selected
        const filteredAppointments = appointments.filter((a: Appointment) => {
            const matches = a.customerName.toLowerCase().includes(term) || 
                           (a.service && a.service.toLowerCase().includes(term));
            if (!currentBranch) return matches;
            return matches && a.branchId === currentBranch.id;
        }).slice(0, 5);

        // 3. Staff: Scoped to current branch if selected
        const filteredStaff = staffMembers.filter((s: Staff) => {
            const matches = s.name.toLowerCase().includes(term);
            if (!currentBranch) return matches;
            return matches && s.branchId === currentBranch.id;
        }).slice(0, 5);

        return {
            customers: filteredCustomers,
            appointments: filteredAppointments,
            staff: filteredStaff
        };
    }, [searchTerm, customers, appointments, staffMembers, currentBranch]);

    const hasResults = results.customers.length > 0 || results.appointments.length > 0 || results.staff.length > 0;

    const handleSelect = (type: string, id: string, extra?: string) => {
        setIsOpen(false);
        setSearchTerm("");
        
        if (type === 'customer') {
            router.push(`/${slug}/customers?id=${id}`);
        } else if (type === 'appointment') {
            router.push(`/${slug}/calendar`);
        } else if (type === 'staff') {
            router.push(`/${slug}/staff`);
        }
    };

    return (
        <div className="relative group" ref={searchRef}>
            <div className={`
                relative flex items-center transition-all duration-500
                ${isOpen && searchTerm.length >= 2 ? 'w-[500px]' : 'w-[400px]'}
            `}>
                <Search className={`
                    w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 transition-colors duration-300
                    ${isOpen ? 'text-indigo-600' : 'text-indigo-300'}
                `} />
                <input 
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="Müşteri, Randevu veya Ekip ara..."
                    className={`
                        w-full bg-indigo-50/50 border focus:bg-white focus:ring-4 focus:ring-indigo-500/5 rounded-2xl pl-12 pr-12 py-3 text-sm font-bold outline-none transition-all placeholder:text-indigo-200
                        ${isOpen ? 'border-indigo-500/50 shadow-lg' : 'border-indigo-50'}
                    `}
                />
                {searchTerm && (
                    <button 
                        onClick={() => setSearchTerm("")}
                        className="absolute right-4 p-1 hover:bg-gray-100 rounded-lg text-gray-400 transition-colors"
                    >
                        <X size={14} />
                    </button>
                )}
            </div>

            <AnimatePresence>
                {isOpen && searchTerm.length >= 2 && (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute top-16 left-0 w-full bg-white border border-gray-100 rounded-[2.5rem] shadow-2xl p-6 z-[200] overflow-hidden"
                    >
                        {!hasResults ? (
                            <div className="py-10 text-center opacity-40 italic flex flex-col items-center">
                                <Search className="w-12 h-12 mb-2 text-indigo-200" />
                                <p className="text-sm font-bold text-gray-900">"{searchTerm}" için sonuç bulunamadı.</p>
                            </div>
                        ) : (
                            <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                {/* Customers Group */}
                                {results.customers.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <User size={12} /> Müşteriler
                                        </h3>
                                        <div className="space-y-1">
                                            {results.customers.map((c: Customer) => (
                                                <button 
                                                    key={c.id}
                                                    onClick={() => handleSelect('customer', c.id, c.name)}
                                                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-indigo-50 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center font-black text-indigo-600 group-hover:bg-white transition-colors">
                                                            {c.name.charAt(0)}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-black text-sm text-gray-900 leading-tight">{c.name}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{c.phone || 'Telefon Yok'}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Appointments Group */}
                                {results.appointments.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Calendar size={12} /> Randevular
                                        </h3>
                                        <div className="space-y-1">
                                            {results.appointments.map((a: Appointment) => (
                                                <button 
                                                    key={a.id}
                                                    onClick={() => handleSelect('appointment', a.id)}
                                                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-emerald-50 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center font-black text-emerald-600 group-hover:bg-white transition-colors">
                                                            <Hash size={14} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-black text-sm text-gray-900 leading-tight">{a.customerName}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">{a.service}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Staff Group */}
                                {results.staff.length > 0 && (
                                    <div>
                                        <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                            <Briefcase size={12} /> Ekip
                                        </h3>
                                        <div className="space-y-1">
                                            {results.staff.map((s: Staff) => (
                                                <button 
                                                    key={s.id}
                                                    onClick={() => handleSelect('staff', s.id)}
                                                    className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-rose-50 transition-all group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-10 h-10 bg-rose-50 rounded-xl flex items-center justify-center font-black text-rose-600 group-hover:bg-white transition-colors">
                                                            <User size={14} />
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="font-black text-sm text-gray-900 leading-tight">{s.name}</p>
                                                            <p className="text-[10px] font-bold text-gray-400 uppercase">Personel</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight size={14} className="text-gray-300 opacity-0 group-hover:opacity-100 transition-all" />
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        <div className="mt-6 pt-6 border-t border-gray-50 flex items-center justify-between">
                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Global "Hakimiyet" Araması</p>
                            <div className="flex items-center gap-1.5 opacity-40">
                                <div className="px-1.5 py-0.5 border border-gray-300 rounded text-[8px] font-bold text-gray-500 lowercase">esc</div>
                                <span className="text-[8px] font-bold text-gray-400">kapat</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
