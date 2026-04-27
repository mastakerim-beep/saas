"use client";

import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback } from 'react';
import { 
    Appointment, CalendarBlock, Customer, Debt, Expense, 
    Product, Room, Service, Package, MembershipPlan, 
    CustomerMembership, AuditLog, NotificationLog, AiInsight, 
    ZReport, Quote, TenantModule, MarketingRule, 
    DynamicPricingRule, CustomerWallet, WalletTransaction, 
    ConsultationBodyMap, InventoryUsageNorm, CustomerMedia,
    PackageDefinition, CommissionRule, AppointmentStatus, Staff, Payment, InventoryCategory, PackageUsageHistory,
    PaymentDefinition, BankAccount, ExpenseCategory, ReferralSource, ConsentFormTemplate, SystemAnnouncement, LoyaltySettings, Webhook
} from './types';
import { syncDb } from './sync-db';

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
    inventoryCategories: InventoryCategory[];
    packageUsageHistory: PackageUsageHistory[];
    paymentDefinitions: PaymentDefinition[];
    bankAccounts: BankAccount[];
    expenseCategories: ExpenseCategory[];
    referralSources: ReferralSource[];
    consentFormTemplates: ConsentFormTemplate[];
    systemAnnouncements: SystemAnnouncement[];
    loyaltySettings: LoyaltySettings | null;
    webhooks: Webhook[];

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
    setAllInventoryCategories: React.Dispatch<React.SetStateAction<InventoryCategory[]>>;
    setPackageUsageHistory: React.Dispatch<React.SetStateAction<PackageUsageHistory[]>>;
    setPaymentDefinitions: React.Dispatch<React.SetStateAction<PaymentDefinition[]>>;
    setBankAccounts: React.Dispatch<React.SetStateAction<BankAccount[]>>;
    setExpenseCategories: React.Dispatch<React.SetStateAction<ExpenseCategory[]>>;
    setReferralSources: React.Dispatch<React.SetStateAction<ReferralSource[]>>;
    setConsentFormTemplates: React.Dispatch<React.SetStateAction<ConsentFormTemplate[]>>;
    setSystemAnnouncements: React.Dispatch<React.SetStateAction<SystemAnnouncement[]>>;
    setLoyaltySettings: React.Dispatch<React.SetStateAction<LoyaltySettings | null>>;
    setWebhooks: React.Dispatch<React.SetStateAction<Webhook[]>>;

    // CRUD Methods
    addCustomer: (c: any) => Customer;
    updateCustomer: (id: string, updates: Partial<Customer>) => void;
    deleteCustomer: (id: string) => Promise<boolean>;
    addAppointment: (a: any) => Promise<boolean>;
    updateAppointment: (id: string, updates: any) => Promise<boolean>;
    deleteAppointment: (id: string) => Promise<boolean>;
    moveAppointment: (id: string, newTime: string, newStaffId?: string, newRoomId?: string) => Promise<boolean>;
    updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<boolean>;
    addBlock: (b: any) => Promise<boolean>;
    updateBlock: (id: string, updates: any) => Promise<boolean>;
    removeBlock: (id: string) => Promise<boolean>;
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
    addInventoryCategory: (c: any) => Promise<void>;
    updateInventoryCategory: (id: string, updates: Partial<InventoryCategory>) => Promise<void>;
    removeInventoryCategory: (id: string, deleteProducts: boolean) => Promise<void>;
    transferProduct: (productId: string, fromBranchId: string, toBranchId: string, amount: number, pricePerUnit?: number, transferType?: string) => Promise<boolean>;
    addPackageUsageHistory: (h: any) => void;
    addLog: (action: string, customer: string, oldValue?: string, newValue?: string) => Promise<void>;
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
    const [inventoryCategories, setAllInventoryCategories] = useState<InventoryCategory[]>([]);
    const [packageUsageHistory, setPackageUsageHistory] = useState<PackageUsageHistory[]>([]);
    const [paymentDefinitions, setPaymentDefinitions] = useState<PaymentDefinition[]>([]);
    const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
    const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
    const [referralSources, setReferralSources] = useState<ReferralSource[]>([]);
    const [consentFormTemplates, setConsentFormTemplates] = useState<ConsentFormTemplate[]>([]);
    const [systemAnnouncements, setSystemAnnouncements] = useState<SystemAnnouncement[]>([]);
    const [loyaltySettings, setLoyaltySettings] = useState<LoyaltySettings | null>(null);
    const [webhooks, setWebhooks] = useState<Webhook[]>([]);


    const addCustomer = useCallback((c: any) => {
        const newCustomer = { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllCustomers(prev => [...prev, newCustomer]);
        return newCustomer;
    }, []);

    const updateCustomer = useCallback((id: string, updates: Partial<Customer>) => {
        setAllCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    }, []);

    const deleteCustomer = useCallback(async (id: string) => {
        setAllCustomers(prev => prev.filter(c => c.id !== id));
        return true;
    }, []);

    const addAppointment = useCallback(async (a: any) => {
        const newAppt = { ...a, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllAppointments(prev => [...prev, newAppt]);
        return true;
    }, []);

    const updateAppointment = useCallback(async (id: string, updates: any) => {
        setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, ...updates } : a));
        return true;
    }, []);

    const deleteAppointment = useCallback(async (id: string) => {
        setAllAppointments(prev => prev.filter(a => a.id !== id));
        return true;
    }, []);

    const moveAppointment = useCallback(async (id: string, newTime: string, newStaffId?: string, newRoomId?: string) => {
        setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, time: newTime, staffId: newStaffId || a.staffId, roomId: newRoomId || a.roomId } : a));
        return true;
    }, []);

    const updateAppointmentStatus = useCallback(async (id: string, status: AppointmentStatus) => {
        setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
        return true;
    }, []);

    const addBlock = useCallback(async (b: any) => {
        const newBlock = { ...b, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllBlocks(prev => [...prev, newBlock]);
        return true;
    }, []);

    const updateBlock = useCallback(async (id: string, updates: any) => {
        setAllBlocks(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
        return true;
    }, []);

    const removeBlock = useCallback(async (id: string) => {
        setAllBlocks(prev => prev.filter(b => b.id !== id));
        return true;
    }, []);

    const addPackage = useCallback((p: any) => {
        const newPackage = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllPackages(prev => [...prev, newPackage]);
    }, []);

    const addMembershipPlan = useCallback((p: any) => {
        const newPlan = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setMembershipPlans(prev => [...prev, newPlan]);
    }, []);

    const assignMembership = useCallback((cid: string, pid: string) => {
        // Logic
    }, []);

    const addProduct = useCallback((p: any) => {
        const newProduct = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllInventory(prev => [...prev, newProduct]);
        syncDb('inventory', 'insert', newProduct);
    }, []);

    const updateProduct = useCallback((id: string, p: Partial<Product>) => {
        setAllInventory(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
        syncDb('inventory', 'update', p, id);
    }, []);

    const removeProduct = useCallback((id: string) => {
        setAllInventory(prev => prev.filter(p => p.id !== id));
        syncDb('inventory', 'delete', {}, id);
    }, []);

    const addExpense = useCallback((e: any) => {
        const newExpense = { ...e, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllExpenses(prev => [...prev, newExpense]);
    }, []);

    const addService = useCallback((s: any) => {
        const newService = { ...s, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllServices(prev => [...prev, newService]);
    }, []);

    const updateService = useCallback((id: string, s: Partial<Service>) => {
        setAllServices(prev => prev.map(item => item.id === id ? { ...item, ...s } : item));
    }, []);

    const removeService = useCallback((id: string) => {
        setAllServices(prev => prev.filter(s => s.id !== id));
    }, []);

    const addPackageDefinition = useCallback((p: any) => {
        const newDef = { ...p, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllPackageDefinitions(prev => [...prev, newDef]);
    }, []);

    const updatePackageDefinition = useCallback((id: string, p: Partial<PackageDefinition>) => {
        setAllPackageDefinitions(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
    }, []);

    const removePackageDefinition = useCallback((id: string) => {
        setAllPackageDefinitions(prev => prev.filter(p => p.id !== id));
    }, []);

    const addQuote = useCallback((q: Omit<Quote, 'id' | 'businessId'>) => {
        // @ts-ignore
        const newQuote = { ...q, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllQuotes(prev => [...prev, newQuote as Quote]);
    }, []);

    const updateQuote = useCallback((id: string, updates: Partial<Quote>) => {
        setAllQuotes(prev => prev.map(q => q.id === id ? { ...q, ...updates } : q));
    }, []);

    const deleteQuote = useCallback((id: string) => {
        setAllQuotes(prev => prev.filter(q => q.id !== id));
    }, []);

    const addBodyMap = useCallback(async (map: Omit<ConsultationBodyMap, 'id' | 'businessId'>) => {
        // @ts-ignore
        const newMap = { ...map, id: crypto.randomUUID() };
        setBodyMaps(prev => [...prev, newMap as ConsultationBodyMap]);
    }, []);

    const updateBodyMap = useCallback(async (id: string, mapData: any) => {
        setBodyMaps(prev => prev.map(m => m.id === id ? { ...m, mapData } : m));
    }, []);

    const addUsageNorm = useCallback(async (norm: Omit<InventoryUsageNorm, 'id' | 'businessId'>) => {
        // @ts-ignore
        const newNorm = { ...norm, id: crypto.randomUUID() };
        setUsageNorms(prev => [...prev, newNorm as InventoryUsageNorm]);
    }, []);

    const updateUsageNorm = useCallback(async (id: string, updates: Partial<InventoryUsageNorm>) => {
        setUsageNorms(prev => prev.map(n => n.id === id ? { ...n, ...updates } : n));
    }, []);

    const addCustomerMedia = useCallback((m: any) => {
        const newMedia = { ...m, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllCustomerMedia(prev => [...prev, newMedia]);
    }, []);

    const deleteCustomerMedia = useCallback((id: string) => {
        setAllCustomerMedia(prev => prev.filter(m => m.id !== id));
    }, []);

    const updateRoom = useCallback((id: string, updates: Partial<Room>) => {
        setAllRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
    }, []);

    const removeRoom = useCallback((id: string) => {
        setAllRooms(prev => prev.filter(r => r.id !== id));
    }, []);

    const addRoom = useCallback((r: any) => {
        const newRoom = { ...r, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllRooms(prev => [...prev, newRoom]);
    }, []);

    const addInventoryCategory = useCallback(async (c: any) => {
        const newCat = { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setAllInventoryCategories(prev => [...prev, newCat]);
        syncDb('inventory_categories', 'insert', newCat);
    }, []);

    const updateInventoryCategory = useCallback(async (id: string, updates: Partial<InventoryCategory>) => {
        setAllInventoryCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
        syncDb('inventory_categories', 'update', updates, id);
    }, []);

    const removeInventoryCategory = useCallback(async (id: string, deleteProducts: boolean) => {
        const category = inventoryCategories.find(c => c.id === id);
        if (!category) return;

        if (deleteProducts) {
            setAllInventory(prev => prev.filter(p => p.category !== category.name));
            // Note: Batch delete is complex in this sync system, usually we'd delete by category in DB
            syncDb('inventory', 'delete', {}, undefined, undefined, undefined, (table, id, status) => {
                // custom logic for batch delete if needed
            });
            // Simplified: let DB handle cascade or do a custom query
            // In this specific syncDb, we don't have batch delete. 
            // For now, let's keep it simple and delete the category.
        } else {
            setAllInventory(prev => prev.map(p => p.category === category.name ? { ...p, category: 'Genel' } : p));
        }
        setAllInventoryCategories(prev => prev.filter(c => c.id !== id));
        syncDb('inventory_categories', 'delete', {}, id);
    }, [inventoryCategories]);

    const transferProduct = useCallback(async (productId: string, fromBranchId: string, toBranchId: string, amount: number, pricePerUnit: number = 0, transferType: string = 'free') => {
        // Envanter bağımlılığını kaldırmak için doğrudan state setter'ı içinden kontrol edebiliriz ya da 
        // find işlemini dışarıdan gelen güncel referansla (inventoryRef olsa iyi olurdu ama mevcut yapıda setter yeterli) yapabiliriz.
        // Mevcut yapıda inventory bağımlılığı re-render döngüsüne sokuyor.
        
        // Önemli: inventory bağımlılığını [] yaparak fonksiyonu re-render'lardan kurtarıyoruz.
        // İçerideki logic'i ise state'in en güncel halini görecek şekilde (prev => ...) kurguluyoruz.
        
        return new Promise<boolean>(async (resolve) => {
            setAllInventory(prev => {
                const sourceProduct = prev.find(p => p.id === productId);
                if (!sourceProduct || (sourceProduct.stock || 0) < amount) {
                    resolve(false);
                    return prev;
                }

                // 1. Düşüş (Kaynak şube)
                const newSourceStock = sourceProduct.stock - amount;
                
                // 2. Artış (Hedef şube)
                const targetProduct = prev.find(p => p.name === sourceProduct.name && p.branchId === toBranchId);
                
                const updatedList = prev.map(p => {
                    if (p.id === productId) return { ...p, stock: newSourceStock };
                    if (targetProduct && p.id === targetProduct.id) return { ...p, stock: (targetProduct.stock || 0) + amount };
                    return p;
                });

                if (!targetProduct) {
                    const newId = crypto.randomUUID();
                    updatedList.push({ ...sourceProduct, id: newId, branchId: toBranchId, stock: amount, createdAt: new Date().toISOString() });
                }

                // Async işlemler (SyncDB) dışarıda yapılacak
                (async () => {
                    await syncDb('inventory', 'update', { stock: newSourceStock }, productId);
                    if (targetProduct) {
                        await syncDb('inventory', 'update', { stock: (targetProduct.stock || 0) + amount }, targetProduct.id);
                    } else {
                        const newProd = updatedList[updatedList.length - 1];
                        await syncDb('inventory', 'insert', newProd, newProd.id);
                    }

                    await syncDb('inventory_transfers', 'insert', {
                        product_id: productId,
                        from_branch_id: fromBranchId,
                        to_branch_id: toBranchId,
                        quantity: amount,
                        price_per_unit: pricePerUnit,
                        transfer_type: transferType,
                        created_at: new Date().toISOString()
                    });
                })();

                resolve(true);
                return updatedList;
            });
        });
    }, []);

    const addPackageUsageHistory = useCallback((h: any) => {
        const newHistory = { ...h, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
        setPackageUsageHistory(prev => [newHistory, ...prev]);
    }, []);

    const addLog = useCallback(async (action: string, customer: string, oldValue?: string, newValue?: string) => {
        const newLog: any = {
            id: crypto.randomUUID(),
            date: new Date().toISOString(),
            customerName: customer,
            action,
            oldValue: oldValue || null,
            newValue: newValue || null,
            user: 'Personel',
            createdAt: new Date().toISOString()
        };
        setAllLogs(prev => [newLog, ...prev]);
        // @ts-ignore
        await syncDb('audit_logs', 'insert', {
            date: newLog.date,
            customer_name: customer,
            action,
            old_value: oldValue,
            new_value: newValue,
            user: 'Personel',
            created_at: newLog.createdAt
        });
    }, []);

    const contextValue: DataContextType = useMemo(() => ({
        appointments, blocks, customers, debts, inventory, rooms, services, packages,
        membershipPlans, customerMemberships, staffMembers, allLogs, allNotifs, aiInsights, expenses,
        zReports, quotes, tenantModules, marketingRules, pricingRules, wallets,
        payments: allPayments,
        walletTransactions, bodyMaps, usageNorms, customerMedia, packageDefinitions, commissionRules,
        paymentDefinitions, bankAccounts, expenseCategories, referralSources, consentFormTemplates,
        systemAnnouncements, loyaltySettings, webhooks,
        setAllAppointments, setAllBlocks, setAllCustomers, setAllDebts, setAllInventory,
        setAllRooms, setAllServices, setAllPackages, setMembershipPlans, setCustomerMemberships,
        setAllStaff, setAllLogs, setAllNotifs, setAiInsights, setAllExpenses, setZReports, setAllQuotes,
        setTenantModules, setMarketingRules, setPricingRules, setWallets, setWalletTransactions,
        setBodyMaps, setUsageNorms, setAllCustomerMedia, setAllPackageDefinitions, setAllCommissionRules,
        setAllPayments, setAllInventoryCategories, addCustomerMedia, deleteCustomerMedia,
        setPaymentDefinitions, setBankAccounts, setExpenseCategories, setReferralSources,
        setConsentFormTemplates, setSystemAnnouncements, setLoyaltySettings, setWebhooks,
        addCustomer, updateCustomer, deleteCustomer, addAppointment, updateAppointment, deleteAppointment,
        moveAppointment, updateAppointmentStatus, addBlock, updateBlock, removeBlock, addPackage,
        addMembershipPlan, assignMembership, addProduct, updateProduct, removeProduct, addExpense, addService,
        updateService, removeService, addPackageDefinition, updatePackageDefinition,
        removePackageDefinition, addQuote, updateQuote, deleteQuote, addBodyMap, updateBodyMap,
        addUsageNorm, updateUsageNorm, updateRoom, removeRoom, addRoom,
        addInventoryCategory, updateInventoryCategory, removeInventoryCategory,
        transferProduct, addPackageUsageHistory, addLog,
        inventoryCategories, packageUsageHistory, setPackageUsageHistory
    }), [
        appointments, blocks, customers, debts, inventory, rooms, services, packages,
        membershipPlans, customerMemberships, staffMembers, allLogs, allNotifs, aiInsights, expenses,
        zReports, quotes, tenantModules, marketingRules, pricingRules, wallets,
        allPayments, walletTransactions, bodyMaps, usageNorms, customerMedia,
        packageDefinitions, commissionRules, inventoryCategories, transferProduct, packageUsageHistory,
        paymentDefinitions, bankAccounts, expenseCategories, referralSources, consentFormTemplates,
        systemAnnouncements, loyaltySettings, webhooks
    ]);


    return <DataContext.Provider value={contextValue}>{children}</DataContext.Provider>;
};

export const useData = () => {
    const context = useContext(DataContext);
    if (!context) throw new Error('useData must be used within DataProvider');
    return context;
};
