"use client";

import { createContext, useContext, useState, ReactNode, useMemo } from 'react';
import { 
    Appointment, CalendarBlock, Customer, Debt, Expense, 
    Product, Room, Service, Package, MembershipPlan, 
    CustomerMembership, AuditLog, NotificationLog, AiInsight, 
    ZReport, Quote, TenantModule, MarketingRule, 
    DynamicPricingRule, CustomerWallet, WalletTransaction, 
    ConsultationBodyMap, InventoryUsageNorm, CustomerMedia,
    PackageDefinition, CommissionRule, AppointmentStatus, Staff, Payment
} from './types';

export interface DataContextType {
    appointments: Appointment[];
    blocks: CalendarBlock[];
    customers: Customer[];
    debts: Debt[];
    inventory: Product[];
    rooms: Room[];
    services: Service[];
    packages: Package[];
    membershipPlans: MembershipPlan[];
    customerMemberships: CustomerMembership[];
    staffMembers: Staff[];
    allLogs: AuditLog[];
    allNotifs: NotificationLog[];
    aiInsights: AiInsight[];
    expenses: Expense[];
    zReports: ZReport[];
    quotes: Quote[];
    tenantModules: TenantModule[];
    marketingRules: MarketingRule[];
    pricingRules: DynamicPricingRule[];
    wallets: CustomerWallet[];
    walletTransactions: WalletTransaction[];
    bodyMaps: ConsultationBodyMap[];
    usageNorms: InventoryUsageNorm[];
    customerMedia: CustomerMedia[];
    packageDefinitions: PackageDefinition[];
    commissionRules: CommissionRule[];
    payments: Payment[];

    setAllAppointments: React.Dispatch<React.SetStateAction<Appointment[]>>;
    setAllBlocks: React.Dispatch<React.SetStateAction<CalendarBlock[]>>;
    setAllCustomers: React.Dispatch<React.SetStateAction<Customer[]>>;
    setAllDebts: React.Dispatch<React.SetStateAction<Debt[]>>;
    setAllInventory: React.Dispatch<React.SetStateAction<Product[]>>;
    setAllRooms: React.Dispatch<React.SetStateAction<Room[]>>;
    setAllServices: React.Dispatch<React.SetStateAction<Service[]>>;
    setAllPackages: React.Dispatch<React.SetStateAction<Package[]>>;
    setMembershipPlans: React.Dispatch<React.SetStateAction<MembershipPlan[]>>;
    setCustomerMemberships: React.Dispatch<React.SetStateAction<CustomerMembership[]>>;
    setAllStaff: React.Dispatch<React.SetStateAction<Staff[]>>;
    setAllLogs: React.Dispatch<React.SetStateAction<AuditLog[]>>;
    setAllNotifs: React.Dispatch<React.SetStateAction<NotificationLog[]>>;
    setAiInsights: React.Dispatch<React.SetStateAction<AiInsight[]>>;
    setAllExpenses: React.Dispatch<React.SetStateAction<Expense[]>>;
    setZReports: React.Dispatch<React.SetStateAction<ZReport[]>>;
    setAllQuotes: React.Dispatch<React.SetStateAction<Quote[]>>;
    setTenantModules: React.Dispatch<React.SetStateAction<TenantModule[]>>;
    setMarketingRules: React.Dispatch<React.SetStateAction<MarketingRule[]>>;
    setPricingRules: React.Dispatch<React.SetStateAction<DynamicPricingRule[]>>;
    setWallets: React.Dispatch<React.SetStateAction<CustomerWallet[]>>;
    setWalletTransactions: React.Dispatch<React.SetStateAction<WalletTransaction[]>>;
    setBodyMaps: React.Dispatch<React.SetStateAction<ConsultationBodyMap[]>>;
    setUsageNorms: React.Dispatch<React.SetStateAction<InventoryUsageNorm[]>>;
    setAllCustomerMedia: React.Dispatch<React.SetStateAction<CustomerMedia[]>>;
    setAllPackageDefinitions: React.Dispatch<React.SetStateAction<PackageDefinition[]>>;
    setAllCommissionRules: React.Dispatch<React.SetStateAction<CommissionRule[]>>;
    setAllPayments: React.Dispatch<React.SetStateAction<any[]>>;

    // CRUD Methods
    addCustomer: (c: any) => Customer;
    updateCustomer: (id: string, updates: Partial<Customer>) => void;
    deleteCustomer: (id: string) => Promise<boolean>;
    addAppointment: (a: any) => Promise<boolean>;
    updateAppointment: (id: string, updates: any) => Promise<boolean>;
    deleteAppointment: (id: string) => Promise<boolean>;
    moveAppointment: (id: string, newTime: string, newStaffId?: string, newRoomId?: string) => Promise<boolean>;
    updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<boolean>;
    addBlock: (b: any) => void;
    updateBlock: (id: string, updates: any) => Promise<boolean>;
    removeBlock: (id: string) => void;
    addPackage: (p: any) => void;
    addMembershipPlan: (p: any) => void;
    assignMembership: (cid: string, pid: string) => void;
    addProduct: (p: any) => void;
    updateProduct: (id: string, p: Partial<Product>) => void;
    removeProduct: (id: string) => void;
    addExpense: (e: any) => void;
    addService: (s: any) => void;
    updateService: (id: string, s: Partial<Service>) => void;
    removeService: (id: string) => void;
    addPackageDefinition: (p: any) => void;
    updatePackageDefinition: (id: string, p: Partial<PackageDefinition>) => void;
    removePackageDefinition: (id: string) => void;
    addQuote: (q: Omit<Quote, 'id' | 'businessId'>) => void;
    updateQuote: (id: string, updates: Partial<Quote>) => void;
    deleteQuote: (id: string) => void;
    addBodyMap: (map: Omit<ConsultationBodyMap, 'id' | 'businessId'>) => Promise<void>;
    updateBodyMap: (id: string, mapData: any) => Promise<void>;
    addUsageNorm: (norm: Omit<InventoryUsageNorm, 'id' | 'businessId'>) => Promise<void>;
    updateUsageNorm: (id: string, updates: Partial<InventoryUsageNorm>) => Promise<void>;
    addCustomerMedia: (m: Omit<CustomerMedia, 'id' | 'businessId'>) => void;
    deleteCustomerMedia: (id: string) => void;
    updateRoom: (id: string, updates: Partial<Room>) => void;
    removeRoom: (id: string) => void;
    addRoom: (r: any) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const DataProvider = ({ children }: { children: ReactNode }) => {
    const [appointments, setAllAppointments] = useState<Appointment[]>([]);
    const [blocks, setAllBlocks] = useState<CalendarBlock[]>([]);
    const [customers, setAllCustomers] = useState<Customer[]>([]);
    const [debts, setAllDebts] = useState<Debt[]>([]);
    const [inventory, setAllInventory] = useState<Product[]>([]);
    const [rooms, setAllRooms] = useState<Room[]>([]);
    const [services, setAllServices] = useState<Service[]>([]);
    const [packages, setAllPackages] = useState<Package[]>([]);
    const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
    const [customerMemberships, setCustomerMemberships] = useState<CustomerMembership[]>([]);
    const [staffMembers, setAllStaff] = useState<Staff[]>([]);
    const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
    const [allNotifs, setAllNotifs] = useState<NotificationLog[]>([]);
    const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
    const [expenses, setAllExpenses] = useState<Expense[]>([]);
    const [zReports, setZReports] = useState<ZReport[]>([]);
    const [quotes, setAllQuotes] = useState<Quote[]>([]);
    const [tenantModules, setTenantModules] = useState<TenantModule[]>([]);
    const [marketingRules, setMarketingRules] = useState<MarketingRule[]>([]);
    const [pricingRules, setPricingRules] = useState<DynamicPricingRule[]>([]);
    const [wallets, setWallets] = useState<CustomerWallet[]>([]);
    const [walletTransactions, setWalletTransactions] = useState<WalletTransaction[]>([]);
    const [bodyMaps, setBodyMaps] = useState<ConsultationBodyMap[]>([]);
    const [usageNorms, setUsageNorms] = useState<InventoryUsageNorm[]>([]);
    const [customerMedia, setAllCustomerMedia] = useState<CustomerMedia[]>([]);
    const [packageDefinitions, setAllPackageDefinitions] = useState<PackageDefinition[]>([]);
    const [commissionRules, setAllCommissionRules] = useState<CommissionRule[]>([]);
    const [allPayments, setAllPayments] = useState<any[]>([]);

    const addCustomer = (c: any) => {
        const newCustomer = { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
    };

    const updateCustomer = (id: string, updates: Partial<Customer>) => {
        setAllCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    };

    const deleteCustomer = async (id: string) => {
        setAllCustomers(prev => prev.filter(c => c.id !== id));
        return true;
    };

    const addAppointment = async (a: any) => {
        const newAppt = { ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllAppointments(prev => [...prev, newAppt]);
        return true;
    };

    const updateAppointment = async (id: string, updates: any) => {
        setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        return true;
    };

    const deleteAppointment = async (id: string) => {
        setAllAppointments(prev => prev.filter(a => a.id !== id));
        return true;
    };

    const moveAppointment = async (id: string, newTime: string, newStaffId?: string, newRoomId?: string) => {
        setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, time: newTime, staffId: newStaffId || a.staffId, roomId: newRoomId || a.roomId } : a));
        return true;
    };

    const updateAppointmentStatus = async (id: string, status: AppointmentStatus) => {
        setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        return true;
    };

    const addBlock = (b: any) => {
        const newBlock = { ...b, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllBlocks(prev => [...prev, newBlock]);
    };

    const updateBlock = async (id: string, updates: any) => {
        setAllBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
        return true;
    };

    const removeBlock = (id: string) => {
        setAllBlocks(prev => prev.filter(b => b.id !== id));
    };

    const addPackage = (p: any) => {
        const newPackage = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllPackages(prev => [...prev, newPackage]);
    };

    const addMembershipPlan = (p: any) => {
        const newPlan = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setMembershipPlans(prev => [...prev, newPlan]);
    };

    const assignMembership = (cid: string, pid: string) => {
        // Logic
    };

    const addProduct = (p: any) => {
        const newProduct = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllInventory(prev => [...prev, newProduct]);
    };

    const updateProduct = (id: string, p: Partial<Product>) => {
        setAllInventory(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
    };

    const removeProduct = (id: string) => {
        setAllInventory(prev => prev.filter(p => p.id !== id));
    };

    const addExpense = (e: any) => {
        const newExpense = { ...e, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllExpenses(prev => [...prev, newExpense]);
    };

    const addService = (s: any) => {
        const newService = { ...s, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllServices(prev => [...prev, newService]);
    };

    const updateService = (id: string, s: Partial<Service>) => {
        setAllServices(prev => prev.map(item => item.id === id ? { ...item, ...s } : item));
    };

    const removeService = (id: string) => {
        setAllServices(prev => prev.filter(s => s.id !== id));
    };

    const addPackageDefinition = (p: any) => {
        const newDef = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllPackageDefinitions(prev => [...prev, newDef]);
    };

    const updatePackageDefinition = (id: string, p: Partial<PackageDefinition>) => {
        setAllPackageDefinitions(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
    };

    const removePackageDefinition = (id: string) => {
        setAllPackageDefinitions(prev => prev.filter(p => p.id !== id));
    };

    const addQuote = (q: Omit<Quote, 'id' | 'businessId'>) => {
        // @ts-ignore
        const newQuote = { ...q, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllQuotes(prev => [...prev, newQuote as Quote]);
    };

    const updateQuote = (id: string, updates: Partial<Quote>) => {
        setAllQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    };

    const deleteQuote = (id: string) => {
        setAllQuotes(prev => prev.filter(q => q.id !== id));
    };

    const addBodyMap = async (map: Omit<ConsultationBodyMap, 'id' | 'businessId'>) => {
        // @ts-ignore
        const newMap = { ...map, id: crypto.randomUUID() };
        setBodyMaps(prev => [...prev, newMap as ConsultationBodyMap]);
    };

    const updateBodyMap = async (id: string, mapData: any) => {
        setBodyMaps(prev => prev.map(m => m.id === id ? { ...m, mapData } : m));
    };

    const addUsageNorm = async (norm: Omit<InventoryUsageNorm, 'id' | 'businessId'>) => {
        // @ts-ignore
        const newNorm = { ...norm, id: crypto.randomUUID() };
        setUsageNorms(prev => [...prev, newNorm as InventoryUsageNorm]);
    };

    const updateUsageNorm = async (id: string, updates: Partial<InventoryUsageNorm>) => {
        setUsageNorms(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    };

    const addCustomerMedia = (m: any) => {
        const newMedia = { ...m, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllCustomerMedia(prev => [...prev, newMedia]);
    };

    const deleteCustomerMedia = (id: string) => {
        setAllCustomerMedia(prev => prev.filter(m => m.id !== id));
    };

    const updateRoom = (id: string, updates: Partial<Room>) => {
        setAllRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    };

    const removeRoom = (id: string) => {
        setAllRooms(prev => prev.filter(r => r.id !== id));
    };

    const addRoom = (r: any) => {
        const newRoom = { ...r, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllRooms(prev => [...prev, newRoom]);
    };

    const contextValue: DataContextType = useMemo(() => ({
        appointments, blocks, customers, debts, inventory, rooms, services, packages,
        membershipPlans, customerMemberships, staffMembers, allLogs, allNotifs, aiInsights, expenses,
        zReports, quotes, tenantModules, marketingRules, pricingRules, wallets,
        payments: allPayments,
        walletTransactions, bodyMaps, usageNorms, customerMedia, packageDefinitions, commissionRules,
        setAllAppointments, setAllBlocks, setAllCustomers, setAllDebts, setAllInventory,
        setAllRooms, setAllServices, setAllPackages, setMembershipPlans, setCustomerMemberships,
        setAllStaff, setAllLogs, setAllNotifs, setAiInsights, setAllExpenses, setZReports, setAllQuotes,
        setTenantModules, setMarketingRules, setPricingRules, setWallets, setWalletTransactions,
        setBodyMaps, setUsageNorms, setAllCustomerMedia, setAllPackageDefinitions, setAllCommissionRules,
        setAllPayments, addCustomerMedia, deleteCustomerMedia,
        addCustomer, updateCustomer, deleteCustomer, addAppointment, updateAppointment, deleteAppointment,
        moveAppointment, updateAppointmentStatus, addBlock, updateBlock, removeBlock, addPackage,
        addMembershipPlan, assignMembership, addProduct, updateProduct, removeProduct, addExpense, addService,
        updateService, removeService, addPackageDefinition, updatePackageDefinition,
        removePackageDefinition, addQuote, updateQuote, deleteQuote, addBodyMap, updateBodyMap,
        addUsageNorm, updateUsageNorm, updateRoom, removeRoom, addRoom
    }), [
        appointments, blocks, customers, debts, inventory, rooms, services, packages,
        membershipPlans, customerMemberships, staffMembers, allLogs, allNotifs, aiInsights, expenses,
        zReports, quotes, tenantModules, marketingRules, pricingRules, wallets,
        allPayments, walletTransactions, bodyMaps, usageNorms, customerMedia,
        packageDefinitions, commissionRules
    ]);

    return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
};
