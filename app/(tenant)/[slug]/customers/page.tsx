"use client";

import { useState, useMemo, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStore, Customer, Appointment, Payment } from '@/lib/store';
import { 
    Search, Plus, Download, Calendar as CalendarIcon, X, User, Activity, Star, Zap, Package as PackageIcon, Gift, Calendar
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import ExportDropdown from '@/components/ui/ExportDropdown';
import DataImportWizard from '@/components/ui/DataImportWizard';

// Modular Components
import { AddCustomerModal } from '@/components/customers/AddCustomerModal';
import { SmartStack } from '@/components/customers/SmartStack';
import { CustomerCard } from '@/components/customers/CustomerCard';
import { CustomerDetail } from '@/components/customers/CustomerDetail';

export default function CustomersPage() {
    const { 
        customers, 
        getCustomerAppointments, 
        getCustomerPayments,
        getChurnRiskCustomers,
        getUpsellPotentialCustomers,
        getBirthdaysToday
    } = useStore();

    const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showImport, setShowImport] = useState(false);
    const [search, setSearch] = useState('');
    const [activeStack, setActiveStack] = useState('Hepsi');
    const [dateRange, setDateRange] = useState({ 
        start: '', 
        end: '' 
    });

    const searchParams = useSearchParams();
    const customerIdParam = searchParams.get('id');
    const searchTermParam = searchParams.get('search');

    useEffect(() => {
        if (customerIdParam && customers.length > 0) {
            const customer = customers.find((c: Customer) => c.id === customerIdParam);
            if (customer) {
                setSelectedCustomer(customer);
            }
        }
        if (searchTermParam) {
            setSearch(searchTermParam);
        }
    }, [customerIdParam, searchTermParam, customers]);

    const insights = useMemo(() => ({
        churn: getChurnRiskCustomers(),
        upsell: getUpsellPotentialCustomers(),
        birthdays: getBirthdaysToday()
    }), [getChurnRiskCustomers, getUpsellPotentialCustomers, getBirthdaysToday]);

    const filtered = useMemo(() => {
        let list = (customers || []).filter((c: Customer) => 
            c.name.toLowerCase().includes(search.toLowerCase()) || 
            c.phone.includes(search)
        );
        
        if (activeStack === 'VIP') list = list.filter((c: Customer) => c.segment === 'VIP');
        if (activeStack === 'Risk') list = list.filter((c: Customer) => insights.churn.some((churnC: Customer) => churnC.id === c.id));
        if (activeStack === 'Upsell') list = list.filter((c: Customer) => insights.upsell.some((u: any) => u.customer.id === c.id));
        if (activeStack === 'Dogum') list = list.filter((c: Customer) => insights.birthdays.some((b: Customer) => b.id === c.id));
        if (activeStack === 'Bugün') {
             const today = new Date().toISOString().split('T')[0];
             list = list.filter((c: Customer) => getCustomerAppointments(c.id).some((a: Appointment) => a.date === today));
        }

        if (dateRange.start && dateRange.end) {
            list = list.filter((c: Customer) => {
                const customerDate = c.createdAt?.split('T')[0];
                return customerDate && customerDate >= dateRange.start && customerDate <= dateRange.end;
            });
        }
        
        return list;
    }, [customers, search, activeStack, insights, getCustomerAppointments, dateRange]);

    if (selectedCustomer) return <CustomerDetail customer={selectedCustomer} onClose={() => setSelectedCustomer(null)} />;

    return (
        <div className="p-8 pb-32 max-w-[1600px] mx-auto min-h-screen">
            {showModal && <AddCustomerModal onClose={() => setShowModal(false)} onSave={() => setShowModal(false)} />}

            {/* Header Area */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-16 px-4">
                <div className="text-center md:text-left">
                    <h1 className="text-4xl font-black tracking-tight mb-2 text-gray-900 leading-none uppercase italic text-shadow-sm">Danışan Portalı</h1>
                    <p className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em] italic">Aura Intelligence CRM</p>
                </div>
                
                <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
                    <div className="relative w-full md:w-[300px]">
                        <Search className="w-5 h-5 absolute left-5 top-1/2 -translate-y-1/2 text-gray-300" />
                        <input 
                            type="text" 
                            value={search} 
                            onChange={e => setSearch(e.target.value)} 
                            placeholder="İsim veya telefon ara..."
                            className="w-full bg-white border border-gray-100 rounded-[2rem] pl-14 pr-6 py-4 font-black text-sm tracking-tight shadow-sm transition-all focus:ring-2 focus:ring-indigo-100 outline-none" 
                        />
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-gray-100 rounded-[2rem] px-4 py-2 shadow-sm">
                        <CalendarIcon size={16} className="text-gray-300" />
                        <input 
                            type="date" 
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({...prev, start: e.target.value}))}
                            className="bg-transparent text-[10px] font-black uppercase outline-none"
                        />
                        <div className="w-2 h-[1px] bg-gray-200" />
                        <input 
                            type="date" 
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({...prev, end: e.target.value}))}
                            className="bg-transparent text-[10px] font-black uppercase outline-none"
                        />
                        {(dateRange.start || dateRange.end) && (
                            <button onClick={() => setDateRange({start: '', end: ''})} className="ml-2 text-rose-500"><X size={14}/></button>
                        )}
                    </div>

                    <button 
                        onClick={() => setShowImport(true)}
                        className="px-6 py-4 bg-white border border-gray-100 text-gray-500 rounded-[2.5rem] font-black text-[10px] uppercase tracking-widest flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 transition-all shadow-sm"
                    >
                        <Download className="w-4 h-4 rotate-180" /> İÇE AKTAR
                    </button>
                    <ExportDropdown 
                        data={filtered}
                        filename="Aura_Musteri_Listesi"
                        title="Danışan Portalı Veri Raporu"
                        headers={["ID", "İsim Soyad", "Telefon", "Segment", "Harcama", "Randevu", "Kayıt Tarihi"]}
                        excelMapping={(c) => ({
                            "Referans": c.referenceCode || c.id.substring(0,8),
                            "Müşteri Adı": c.name,
                            "Telefon": c.phone,
                            "Segment": c.segment,
                            "Toplam Harcama": getCustomerPayments(c.id).reduce((s: number, p: Payment) => s + (p.totalAmount || 0), 0),
                            "Randevu Sayısı": getCustomerAppointments(c.id).length,
                            "Kayıt Tarihi": c.createdAt?.split('T')[0] || '---'
                        })}
                        pdfMapping={(c) => [
                            c.referenceCode || c.id.substring(0,5),
                            c.name,
                            c.phone,
                            c.segment,
                            `₺${getCustomerPayments(c.id).reduce((s: number, p: Payment) => s + (p.totalAmount || 0), 0).toLocaleString('tr-TR')}`,
                            getCustomerAppointments(c.id).length,
                            c.createdAt?.split('T')[0] || '---'
                        ]}
                    />
                </div>

                <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setShowModal(true)} 
                    className="bg-black text-white px-8 py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.1em] flex items-center gap-3 shadow-2xl shadow-black/20 hover:bg-gray-900 transition-all"
                >
                    <Plus className="w-5 h-5" /> Danışan Kaydet
                </motion.button>
            </div>

            {/* Smart Intelligence Stacks */}
            <div className="flex gap-6 mb-12 overflow-x-auto no-scrollbar pb-6 px-4">
                <SmartStack 
                    icon={Activity} label="Tüm Kayıtlar" count={customers.length} color="text-indigo-600"
                    active={activeStack === 'Hepsi'} onClick={() => setActiveStack('Hepsi')} 
                />
                <SmartStack 
                    icon={Star} label="VIP Danışanlar" count={customers.filter((c: Customer) => c.segment === 'VIP').length} color="text-amber-500"
                    active={activeStack === 'VIP'} onClick={() => setActiveStack('VIP')} 
                />
                <SmartStack 
                    icon={Zap} label="Risk Grubu" count={insights.churn.length} color="text-red-500"
                    active={activeStack === 'Risk'} onClick={() => setActiveStack('Risk')} 
                />
                <SmartStack 
                    icon={PackageIcon} label="Yenileme Bekleyen" count={insights.upsell.length} color="text-emerald-500"
                    active={activeStack === 'Upsell'} onClick={() => setActiveStack('Upsell')} 
                />
                <SmartStack 
                    icon={Gift} label="Doğum Günü" count={insights.birthdays.length} color="text-pink-500"
                    active={activeStack === 'Dogum'} onClick={() => setActiveStack('Dogum')} 
                />
                 <SmartStack 
                    icon={Calendar} label="Bugün Aktif" count={customers.filter((c: Customer) => getCustomerAppointments(c.id).some((a: any) => a.date === new Date().toISOString().split('T')[0])).length} color="text-indigo-400"
                    active={activeStack === 'Bugün'} onClick={() => setActiveStack('Bugün')} 
                />
            </div>

            {/* Modern Card-Like List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 px-4">
                <AnimatePresence>
                    {filtered.length === 0 ? (
                        <div className="col-span-full py-40 text-center">
                            <div className="w-24 h-24 bg-gray-50 rounded-[3rem] flex items-center justify-center mx-auto mb-6 text-gray-200"><User className="w-12 h-12" /></div>
                            <p className="text-[10px] font-black text-gray-300 uppercase tracking-[0.5em]">Sonuç Bulunamadı</p>
                        </div>
                    ) : (
                        filtered.map((c: Customer) => (
                            <CustomerCard 
                                key={c.id}
                                customer={c}
                                stats={{
                                    appt: getCustomerAppointments(c.id).length,
                                    spent: getCustomerPayments(c.id).reduce((s: number, p: Payment) => s + (p.totalAmount || 0), 0)
                                }}
                                isRisk={insights.churn.some((risk: Customer) => risk.id === c.id)}
                                onClick={() => setSelectedCustomer(c)}
                            />
                        ))
                    )}
                </AnimatePresence>
            </div>

            <AnimatePresence>
                {showImport && (
                    <DataImportWizard 
                        type="customers" 
                        onClose={() => setShowImport(false)} 
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
