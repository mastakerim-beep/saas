"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';

// ---- MODELS & TYPES ----
import * as DB from '@/lib/types/database.types';

export type Business = DB.Business;
export type Branch = DB.Branch;
export type AppUser = DB.AppUser;
export type Customer = DB.Customer;
export type MembershipPlan = DB.MembershipPlan;
export type CustomerMembership = DB.CustomerMembership;
export type Package = DB.Package;
export type PackageDefinition = DB.PackageDefinition;
export type Appointment = DB.Appointment;
export type CalendarBlock = DB.CalendarBlock;
export type Debt = DB.Debt;
export type Payment = DB.Payment;
export type BookingSettings = DB.BookingSettings;
export type Staff = DB.Staff;
export type PaymentDefinition = DB.PaymentDefinition;
export type BankAccount = DB.BankAccount;
export type ExpenseCategory = DB.ExpenseCategory;
export type ReferralSource = DB.ReferralSource;
export type ConsentFormTemplate = DB.ConsentFormTemplate;
export type Product = DB.Product;
export type Service = DB.Service;
export type AuditLog = DB.AuditLog;
export type NotificationLog = DB.NotificationLog;
export type AiInsight = DB.AiInsight;
export type Room = DB.Room;
export type CommissionRule = DB.CommissionRule;
export type Expense = DB.Expense;
export type CustomerMedia = DB.CustomerMedia;
export type ZReport = DB.ZReport;
export type Quote = DB.Quote;
export type SystemAnnouncement = DB.SystemAnnouncement;
export type TenantModule = DB.TenantModule;

export type AppointmentStatus = 'pending' | 'completed' | 'no-show' | 'cancelled' | 'excused' | 'arrived';

export interface PaymentMethod {
    id: string;
    method: 'nakit' | 'kredi-karti' | 'havale' | 'banka' | 'puan' | 'abonelik' | 'diger';
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR' | 'GBP';
    rate: number;
    isDeposit: boolean;
    toolId?: string; // payment_definition_id reference
}

export interface BusinessSettings {
    startHour: number;
    endHour: number;
    openDays: number[];
    isAutoMarketingEnabled: boolean;
}

export interface CurrencyRate {
    code: string;
    name: string;
    rate: number;
}

// ---- STORE STATE INTERFACE ----

interface StoreState {
    currentUser: AppUser | null;
    currentBusiness: Business | null;
    currentBranch: Branch | null;
    isOnline: boolean;
    syncStatus: 'idle' | 'syncing' | 'error';
    
    allBusinesses: Business[];
    allUsers: AppUser[];
    allPayments: Payment[]; 
    
    impersonatedBusinessId: string | null;
    isImpersonating: boolean;
    setImpersonatedBusinessId: (id: string | null) => void;
    
    
    updateBusinessStatus: (id: string, status: Business['status']) => void;
    deleteBusiness: (id: string) => void;
    addBusiness: (b: Omit<Business, 'id' | 'status' | 'maxBranches'>) => Promise<Business | null>;
    provisionBusinessUser: (data: { email: string; password: string; name: string; businessId: string }) => Promise<{ success: boolean; error?: string }>;
    setCurrentBranch: (branch: Branch | null) => void;
    
    customers: Customer[];
    packages: Package[];
    membershipPlans: MembershipPlan[];
    customerMemberships: CustomerMembership[];
    appointments: Appointment[];
    blocks: CalendarBlock[];
    payments: Payment[];
    staffMembers: Staff[];
    debts: Debt[];
    branches: Branch[];
    allLogs: AuditLog[];
    allNotifs: NotificationLog[];
    aiInsights: AiInsight[];
    customerMedia: CustomerMedia[];
    inventory: Product[];
    rooms: Room[];
    services: Service[];
    packageDefinitions: PackageDefinition[];
    commissionRules: CommissionRule[];
    rates: CurrencyRate[];
    expenses: Expense[];
    zReports: ZReport[];
    settings: BusinessSettings;
    allowedBranches: Branch[];
    bookingSettings: BookingSettings | null;
    paymentDefinitions: PaymentDefinition[];
    bankAccounts: BankAccount[];
    expenseCategories: ExpenseCategory[];
    referralSources: ReferralSource[];
    consentFormTemplates: ConsentFormTemplate[];
    quotes: Quote[];
    systemAnnouncements: SystemAnnouncement[];
    tenantModules: TenantModule[];
    
    // Actions
    login: (email: string, pass: string) => Promise<boolean>;
    logout: () => void;
    fetchData: (bizId?: string, user?: AppUser, force?: boolean) => Promise<void>;
    isInitialized: boolean;
    fetchPublicData: (slug: string) => Promise<void>;
    closeDay: (data: Omit<ZReport, 'id' | 'businessId' | 'branchId' | 'closedBy' | 'createdAt'>) => Promise<boolean>;
    addCustomer: (c: any) => Customer;
    updateCustomer: (id: string, updates: Partial<Customer>) => void;
    addPackage: (p: any) => void;
    addMembershipPlan: (p: any) => void;
    assignMembership: (cid: string, pid: string) => void;
    addAppointment: (a: any) => Promise<boolean>;
    moveAppointment: (id: string, newTime: string, newStaffId: string) => Promise<boolean>;
    deleteAppointment: (id: string) => Promise<boolean>;
    updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<boolean>;
    calculateDynamicPrice: (servicePrice: number, timeStr: string) => { price: number, reason: string | null };
    addBlock: (b: any) => void;
    removeBlock: (id: string) => void;
    addCustomerMedia: (m: Omit<CustomerMedia, 'id' | 'businessId'>) => void;
    deleteCustomerMedia: (id: string) => void;
    updateSettings: (s: Partial<BusinessSettings>) => void;
    
    // Room Management
    addRoom: (r: Omit<Room, 'id' | 'businessId' | 'createdAt'>) => void;
    updateRoom: (id: string, updates: Partial<Room>) => void;
    deleteRoom: (id: string) => void;
    
    analyzeSystem: () => Promise<void>;
    processCheckout: (p: any, debtInfo?: { amount: number, dueDate: string }, soldProducts?: { productId: string, quantity: number }[]) => Promise<boolean>;
    sendNotification: (customerId: string, type: NotificationLog['type'], content: string) => void;
    addLog: (action: string, customer: string, oldValue?: string, newValue?: string) => void;
    addProduct: (p: any) => void;
    addExpense: (e: any) => void;
    addService: (s: any) => void;
    updateService: (id: string, s: Partial<Service>) => void;
    removeService: (id: string) => void;
    
    addPackageDefinition: (p: any) => void;
    updatePackageDefinition: (id: string, p: Partial<PackageDefinition>) => void;
    removePackageDefinition: (id: string) => void;
    
    // Quotes
    addQuote: (q: Omit<Quote, 'id' | 'businessId'>) => void;
    updateQuote: (id: string, updates: Partial<Quote>) => void;
    deleteQuote: (id: string) => void;

    updateProduct: (id: string, p: Partial<Product>) => void;
    
    deleteCustomer: (id: string) => Promise<boolean>;
    updateBusinessLicense: (id: string, max: number) => void;
    updateBusinessBranches: (id: string, max: number) => Promise<void>;
    payDebt: (debtId: string, amount: number, methods: any) => Promise<boolean>;
    addCommissionRule: (rule: Omit<CommissionRule, 'id' | 'businessId'>) => void;
    removeCommissionRule: (id: string) => void;
    updateRoomStatus: (id: string, status: Room['status']) => void;
    
    // Staff Management
    addStaff: (s: Omit<Staff, 'id' | 'businessId' | 'branchId'>) => void;
    deleteStaff: (id: string) => void;
    updateStaff: (id: string, s: Partial<Staff>) => void;
    updateStaffPermissions: (userId: string, perms: string[]) => void;
 
    addPaymentDefinition: (p: any) => void;
    updatePaymentDefinition: (id: string, p: Partial<PaymentDefinition>) => void;
    removePaymentDefinition: (id: string) => void;
    
    addBankAccount: (b: any) => void;
    updateBankAccount: (id: string, b: Partial<BankAccount>) => void;
    removeBankAccount: (id: string) => void;
    
    addExpenseCategory: (c: any) => void;
    updateExpenseCategory: (id: string, c: Partial<ExpenseCategory>) => void;
    removeExpenseCategory: (id: string) => void;
    
    addReferralSource: (s: any) => void;
    updateReferralSource: (id: string, s: Partial<ReferralSource>) => void;
    removeReferralSource: (id: string) => void;
    
    addConsentFormTemplate: (t: any) => void;
    updateConsentFormTemplate: (id: string, t: Partial<ConsentFormTemplate>) => void;
    removeConsentFormTemplate: (id: string) => void;

    // Branches
    addBranch: (branch: Partial<Branch>) => Promise<void>;
    updateBranch: (id: string, branch: Partial<Branch>) => void;
    deleteBranch: (id: string) => void;
 
    // Helpers
    getCustomerPackages: (cid: string) => Package[];
    getCustomerAppointments: (cid: string) => Appointment[];
    getCustomerAppointmentsByBranch: (cid: string, bid: string) => Appointment[];
    getCustomerPayments: (cid: string) => Payment[];
    getTodayPayments: () => Payment[];
    
    calculateCommission: (staffId: string, serviceName: string, price: number, packageId?: string) => number;
    can: (permission: string) => boolean;
    getUpsellSuggestions: (serviceName: string) => Product[];
    determineChurnRisk: (customer: Customer) => boolean;
    getChurnRiskCustomers: () => Customer[];
    getUpsellPotentialCustomers: () => { customer: Customer, reason: string }[];
    getBirthdaysToday: () => Customer[];
 
    // License
    isLicenseExpired: boolean;

    // SaaS Admin Actions
    addAnnouncement: (a: Omit<DB.SystemAnnouncement, 'id' | 'createdAt'>) => Promise<void>;
    updateModuleStatus: (bizId: string, moduleName: string, isEnabled: boolean) => Promise<void>;
    updateBusinessPricing: (id: string, updates: { plan?: string, overrideMrr?: number | null, signupPrice?: number }) => Promise<void>;
}
 
 
 const toCamel = (obj: any): any => {
     if (Array.isArray(obj)) return obj.map(v => toCamel(v));
     if (obj !== null && typeof obj === 'object') {
         const n: any = {};
         for(let k of Object.keys(obj)) {
             const camelK = k.replace(/_([a-z])/g, (_, m) => m.toUpperCase());
             n[camelK] = toCamel(obj[k]);
         }
         return n;
     }
     return obj;
 }
 
 const toSnake = (obj: any): any => {
     if (Array.isArray(obj)) return obj.map(v => toSnake(v));
     if (obj !== null && typeof obj === 'object') {
         const n: any = {};
         for(let k of Object.keys(obj)) {
             const snakeK = k.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
             let val = obj[k];
             // Convert empty strings to null for DB compatibility (especially UUID/Numeric columns)
            if (val === undefined || val === '') val = null;
            n[snakeK] = toSnake(val);
         }
         return n;
     }
     return obj;
 };
 
 const StoreContext = createContext<StoreState | null>(null);
 
 export function StoreProvider({ children }: { children: ReactNode }) {
     const [currentUser, setCurrentUser] = useState<AppUser | null>(null);
     const [isInitialized, setIsInitialized] = useState(false);
     const [lastFetch, setLastFetch] = useState<number>(0);
     const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
 
     const [isOnline, setIsOnline] = useState(typeof window !== 'undefined' ? navigator.onLine : true);
 
     useEffect(() => {
         const handleOnline = () => setIsOnline(true);
         const handleOffline = () => setIsOnline(false);
         window.addEventListener('online', handleOnline);
         window.addEventListener('offline', handleOffline);
         return () => {
             window.removeEventListener('online', handleOnline);
             window.removeEventListener('offline', handleOffline);
         };
     }, []);
 
     
     const [allBusinesses, setAllBusinesses] = useState<Business[]>([]);
     const [allUsers, setAllUsers] = useState<AppUser[]>([]);
     const [allowedBranches, setAllowedBranches] = useState<Branch[]>([]);
     const [currentBranch, setCurrentBranchState] = useState<Branch | null>(null);
     const [bookingSettings, setBookingSettings] = useState<BookingSettings | null>(null);
     const [allAppointments, setAllAppointments] = useState<Appointment[]>([]);
     const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
     const [allPackages, setAllPackages] = useState<Package[]>([]);
     const [membershipPlans, setMembershipPlans] = useState<MembershipPlan[]>([]);
     const [customerMemberships, setCustomerMemberships] = useState<CustomerMembership[]>([]);
     const [allNotifs, setAllNotifs] = useState<NotificationLog[]>([]);
     const [aiInsights, setAiInsights] = useState<AiInsight[]>([]);
     const [allBlocks, setAllBlocks] = useState<CalendarBlock[]>([]);
     const [allPayments, setAllPayments] = useState<Payment[]>([]);
     const [allDebts, setAllDebts] = useState<Debt[]>([]);
     const [allStaff, setAllStaff] = useState<Staff[]>([]);
     const [allInventory, setAllInventory] = useState<Product[]>([]);
     const [allRooms, setAllRooms] = useState<Room[]>([]);
     const [allCommissionRules, setAllCommissionRules] = useState<CommissionRule[]>([]);
     const [allExpenses, setAllExpenses] = useState<Expense[]>([]);
     const [allServices, setAllServices] = useState<Service[]>([]);
     const [allPackageDefinitions, setAllPackageDefinitions] = useState<PackageDefinition[]>([]);
     const [paymentDefinitions, setPaymentDefinitions] = useState<PaymentDefinition[]>([]);
     const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
     const [expenseCategories, setExpenseCategories] = useState<ExpenseCategory[]>([]);
     const [referralSources, setReferralSources] = useState<ReferralSource[]>([]);
     const [consentFormTemplates, setConsentFormTemplates] = useState<ConsentFormTemplate[]>([]);
     const [allLogs, setAllLogs] = useState<AuditLog[]>([]);
     const [allCustomerMedia, setAllCustomerMedia] = useState<CustomerMedia[]>([]);
     const [zReports, setZReports] = useState<ZReport[]>([]);
     const [impersonatedBusinessId, setImpersonatedBusinessId] = useState<string | null>(null);
      const [allQuotes, setAllQuotes] = useState<Quote[]>([]);
     const [systemAnnouncements, setSystemAnnouncements] = useState<SystemAnnouncement[]>([]);
     const [tenantModules, setTenantModules] = useState<TenantModule[]>([]);
     const [tenantSlug, setTenantSlug] = useState<string | null>(null);
     const [currentTenant, setCurrentTenant] = useState<Business | null>(null);
     const [settings, setSettings] = useState<BusinessSettings>({ startHour: 9, endHour: 21, openDays: [1,2,3,4,5,6], isAutoMarketingEnabled: true });
 
     const retryRequest = async <T,>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> => {
         try {
             return await fn();
         } catch (error) {
             if (retries <= 0) throw error;
             await new Promise(r => setTimeout(r, delay));
             return retryRequest(fn, retries - 1, delay * 2);
         }
     };
 
     // Effect to identify tenant from URL Path (now using unified single domain)
     useEffect(() => {
         if (typeof window !== 'undefined') {
             const path = window.location.pathname;
             const parts = path.split('/');
             const potentialSlug = parts[1];
             
             // System paths that are not tenant slugs
             const systemPaths = ['login', 'admin', 'api', '_next', 'static', 'favicon.ico'];
             
             if (potentialSlug && !systemPaths.includes(potentialSlug)) {
                 setTenantSlug(potentialSlug);
             } else {
                 setTenantSlug(null);
             }
         }
     }, []);
 
     // Effect to set currentTenant once businesses are loaded
     useEffect(() => {
         if (tenantSlug && allBusinesses.length > 0) {
             const biz = allBusinesses.find(b => b.slug === tenantSlug);
             if (biz) {
                 setCurrentTenant(biz);
                 // Also auto-fetch data for this business if not done
                 fetchData(biz.id);
             }
         }
     }, [tenantSlug, allBusinesses]);
 
     const fetchData = async (bizId?: string, userOverride?: AppUser, force = false) => {
        const activeUser = userOverride || currentUser;
        const isSaaS = activeUser?.role === 'SaaS_Owner';
        const targetId = bizId || impersonatedBusinessId || currentTenant?.id || activeUser?.businessId;
        
        if (!targetId && !isSaaS) return;

        // Cache Logic: Don't refetch if last fetch was within 2 minutes (unless forced)
        const now = Date.now();
        if (!force && lastFetch && now - lastFetch < 120000 && !bizId) {
            console.log("Speed Paketi: Veriler önbellekten geliyor (Cache Hit)");
            return;
        }

        console.time("Aura Fetch Speed");
        setSyncStatus('syncing');
        const tables = [
            'businesses', 'branches', 'appointments', 'customers', 
            'membership_plans', 'customer_memberships', 'payments', 
            'debts', 'staff', 'inventory', 'rooms', 'expenses', 
            'services', 'app_users', 'audit_logs', 'customer_media', 
            'packages', 'package_definitions', 'commission_rules', 'calendar_blocks', 'notification_logs', 'z_reports',
            'payment_definitions', 'bank_accounts', 'expense_categories', 'referral_sources', 'consent_form_templates', 'quotes',
            'system_announcements', 'tenant_modules'
        ];

        const dataMap: any = {};

        try {
            // Speed Paketi: Tüm tabloları tam paralel olarak çekiyoruz
            await Promise.allSettled(tables.map(async (table) => {
                try {
                    const result = await retryRequest(async () => {
                        let q = supabase.from(table).select('*');
                        
                        // Apply business filter
                        if (!isSaaS || bizId) {
                            const idToUse = bizId || targetId;
                            if (idToUse) {
                                if (table === 'businesses') q = q.eq('id', idToUse);
                                else q = q.eq('business_id', idToUse);
                            }
                        }
                        
                        const { data, error } = await q;
                        if (error) throw (error);
                        return data;
                    });
                    dataMap[table] = toCamel(result || []);
                } catch (e) {
                    console.warn(`Tablo atlanıyor (Safe Mode): ${table}`, e);
                    dataMap[table] = []; 
                }
            }));

            // State'leri toplu olarak güncelle (Batching)
            setAllBusinesses(dataMap.businesses || []);
            setAllowedBranches(dataMap.branches || []);
            setAllAppointments(dataMap.appointments || []);
            setAllCustomers(dataMap.customers || []);
            setMembershipPlans(dataMap.membership_plans || []);
            setCustomerMemberships(dataMap.customer_memberships || []);
            setAllPayments(dataMap.payments || []);
            setAllDebts(dataMap.debts || []);
            setAllStaff(dataMap.staff || []);
            setAllInventory(dataMap.inventory || []);
            setAllRooms(dataMap.rooms || []);
            setAllExpenses(dataMap.expenses || []);
            setAllServices(dataMap.services || []);
            setAllPackageDefinitions(dataMap.package_definitions || []);
            setAllUsers(dataMap.app_users || []);
            setAllLogs(dataMap.audit_logs || []);
            setAllCustomerMedia(dataMap.customer_media || []);
            setZReports(dataMap.z_reports || []);
            setPaymentDefinitions(dataMap.payment_definitions || []);
            setBankAccounts(dataMap.bank_accounts || []);
            setExpenseCategories(dataMap.expense_categories || []);
            setReferralSources(dataMap.referral_sources || []);
            setConsentFormTemplates(dataMap.consent_form_templates || []);
            setAllQuotes((dataMap.quotes || []).map(toCamel));
            setSystemAnnouncements(dataMap.system_announcements || []);
            setTenantModules(dataMap.tenant_modules || []);
            
            // SaaS Admin Data
            // These would normally be stored in specialized state arrays if we added them to StoreState
            // For now, filtering and exposing via helpers if needed

            // Branch Selection Logic
            if (currentUser && dataMap.branches?.length > 0) {
                const savedBranchId = localStorage.getItem('aura_last_branch');
                const branchToUse = (dataMap.branches.some((b: any) => b.id === savedBranchId)) ? savedBranchId : dataMap.branches[0].id;
                setCurrentBranchState(dataMap.branches.find((b: any) => b.id === branchToUse));
            }

            setLastFetch(Date.now());
            setSyncStatus('idle');
            setIsInitialized(true);
            
            // Trigger AI analysis on data load
            await store.analyzeSystem();
            
            console.timeEnd("Aura Fetch Speed");
        } catch (error: any) {
            console.error("Critical Fetch Error:", error);
            setSyncStatus('error');
            setIsInitialized(true);
        }
    };
 
 
     // Fetch full user profile from app_users table (role, businessId, permissions)
     const fetchAppUserProfile = async (authUserId: string, email: string): Promise<AppUser | null> => {
         const { data, error } = await supabase
             .from('app_users')
             .select('*')
             .eq('email', email)
             .single();
         if (error || !data) {
             // Fallback: try by id
             const { data: byId } = await supabase.from('app_users').select('*').eq('id', authUserId).single();
             if (!byId) return null;
             return {
                 id: byId.id,
                 businessId: byId.business_id,
                 branchId: byId.branch_id || null,
                 role: byId.role || 'Staff',
                 name: byId.name || 'Kullanıcı',
                 email: byId.email,
                 permissions: byId.permissions || [],
                 allowedBranches: byId.allowed_branches || []
             };
         }
         return {
             id: data.id,
             businessId: data.business_id || null,
             branchId: data.branch_id || null,
             role: data.role || 'Staff',
             name: data.name || 'Kullanıcı',
             email: data.email,
             permissions: data.permissions || [],
             allowedBranches: data.allowed_branches || []
         };
     };
 
     useEffect(() => {
         const initAuth = async () => {
             const { data: { session } } = await supabase.auth.getSession();
             if (session?.user) {
                 try {
                     const appUser = await fetchAppUserProfile(session.user.id, session.user.email!);
                     if (appUser) {
                         setCurrentUser(appUser);
                         await fetchData(appUser.businessId || undefined, appUser);
                     }
                 } catch (err) {
                     console.error('Auth init fetch error:', err);
                 }
             }
             setIsInitialized(true);
         };
         initAuth();
     }, []);
 
     const login = async (email: string, pass: string) => {
         const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
         if (error || !data.user) return false;
         
         // Read profile from app_users table, NOT from user_metadata
         const appUser = await fetchAppUserProfile(data.user.id, email);
         if (!appUser) {
             console.error('Login: no app_users record found for', email);
             await supabase.auth.signOut();
             return false;
         }
         setCurrentUser(appUser);
         try {
             await fetchData(appUser.businessId || undefined, appUser);
         } catch (e) {
             console.error('Login fetch error', e);
             return false;
         }
         return true;
     };
 
     const logout = async () => {
         await supabase.auth.signOut();
         setCurrentUser(null);
         window.location.href = '/login';
     };
 
     // filterByBiz: ALL roles (including SaaS_Owner) see only their own business data
     // in regular panels. The /super-admin page uses allBusinesses directly.
     const filterByBiz = <T extends { businessId?: string }>(list: T[]) => {
         if (!currentUser && !currentTenant) return [];
         
         const activeBizId = currentTenant?.id || currentUser?.businessId;
         if (!activeBizId && currentUser?.role === 'SaaS_Owner') return list;
         
         return list.filter(i => i.businessId === activeBizId);
     };
 
     const appointments = useMemo(() => filterByBiz(allAppointments).filter(a => !currentBranch?.id || a.branchId === currentBranch.id), [allAppointments, currentBranch]);
     const customers = useMemo(() => filterByBiz(allCustomers), [allCustomers, currentUser, currentTenant]);
     const currentBusiness = useMemo(() => allBusinesses.find(b => b.id === (currentTenant?.id || currentUser?.businessId)) || null, [currentUser, allBusinesses, currentTenant]);
    const expenses = useMemo(() => filterByBiz(allExpenses).filter(e => !currentBranch?.id || e.branchId === currentBranch.id), [allExpenses, currentBranch, currentUser, currentTenant]);
 
     // Safe business ID resolver: ensures we always use a valid businessId from the DB
     const getSafeBizId = (): string | undefined => {
         return currentTenant?.id || currentUser?.businessId || allBusinesses[0]?.id;
     };
 
     
     // DB SYNC HELPER
     const syncDb = (table: string, op: 'insert'|'update'|'delete', data: any, id?: string) => {
         const activeId = getSafeBizId();
         if (!activeId && table !== 'businesses' && table !== 'app_users' && table !== 'branches') return Promise.resolve();
         
         const { syncStatus, ...cleanData } = data;
         const payload = toSnake(cleanData);
 
         const updateLocalStatus = (status: 'syncing' | 'synced' | 'error') => {
             if (!id) return;
             const updaters: Record<string, any> = {
                 appointments: setAllAppointments,
                 staff: setAllStaff,
                 services: setAllServices,
                 customers: setAllCustomers,
                 inventory: setAllInventory,
                 membership_plans: setMembershipPlans,
                 customer_memberships: setCustomerMemberships,
                 payments: setAllPayments,
                 expenses: setAllExpenses,
                 businesses: setAllBusinesses,
                 branches: setAllowedBranches,
                 notification_logs: setAllNotifs,
                 audit_logs: setAllLogs,
                 customer_media: setAllCustomerMedia,
                 packages: setAllPackages,
                 commission_rules: setAllCommissionRules,
                 calendar_blocks: setAllBlocks,
                  quotes: setAllQuotes,
                 z_reports: setZReports,
                 rooms: setAllRooms
             };
 
             const setter = updaters[table];
             if (setter) {
                 setter((prev: any[]) => prev.map(item => item.id === id ? { ...item, syncStatus: status } : item));
             }
         };
 
         return new Promise<void>((resolve, reject) => {
            const handle = async () => {
              updateLocalStatus('syncing');
              setSyncStatus('syncing');
              try {
                  const finalizedPayload = Object.keys(payload).reduce((acc: any, key) => {
                      acc[key] = (payload[key] === '' || payload[key] === undefined) ? null : payload[key];
                      return acc;
                  }, {});

                  // Auto-inject business_id if missing and required for tenant isolation
                  const tenantTables = ['branches', 'appointments', 'customers', 'membership_plans', 'customer_memberships', 'payments', 'debts', 'staff', 'inventory', 'rooms', 'expenses', 'services', 'audit_logs', 'customer_media', 'packages', 'package_definitions', 'commission_rules', 'calendar_blocks', 'notification_logs', 'z_reports', 'payment_definitions', 'bank_accounts'];
                  if (op === 'insert' && tenantTables.includes(table) && !finalizedPayload.business_id) {
                      finalizedPayload.business_id = activeId;
                  }

                  await retryRequest(async () => {
                      let res;
                      if (op === 'insert') res = await supabase.from(table).insert([finalizedPayload]);
                      if (op === 'update') res = await supabase.from(table).update(finalizedPayload).eq('id', id);
                      if (op === 'delete') res = await supabase.from(table).delete().eq('id', id);
                      
                      if (res?.error) {
                          console.error(`DB Error [${table} ${op}]:`, res.error);
                          throw res.error;
                      }
                      return res;
                  });
 
                    updateLocalStatus('synced');
                    setSyncStatus('idle');
                    resolve();
                } catch (error: any) {
                    console.error(`Sync error after retries [${table} ${op}]:`, error);
                    updateLocalStatus('error');
                    setSyncStatus('error');
                    reject(error);
                }
            };
            handle();
        });
    };
 
     const addAppointment = async (data: any) => {
        const safeBizId = getSafeBizId();
        const safeBranchId = currentBranch?.id || allowedBranches[0]?.id;

        const a = { 
            ...data, 
            id: crypto.randomUUID(), 
            businessId: safeBizId || 'SYSTEM_ERR', 
            branchId: safeBranchId || null, // Explicit null if not found
            syncStatus: 'syncing' as const,
            status: 'pending' as const,
            isPaid: false // Default
        };
        
        if (!a.businessId || a.businessId === 'SYSTEM_ERR') {
            console.error('Critical: Appointment created without BusinessID');
            return false;
        }

        setAllAppointments(prev => [...prev, a]);
        try {
            await syncDb('appointments', 'insert', a, a.id);
            return true;
        } catch (e) {
            console.error('AddAppointment Sync Failed:', e);
            return false;
        }
        
        // Log the action
        store.addLog('Randevu Oluşturuldu', a.customerName, '', `${a.time} - ${a.service}`);
        
        return true;
     };
 
     const fetchDataFull = fetchData; // Alias
 
    const store: StoreState = {
        currentUser,
        currentBusiness,
        currentBranch,
        isOnline,
        syncStatus,
        allBusinesses,
        allUsers,
        allPayments,
        impersonatedBusinessId,
        isImpersonating: !!impersonatedBusinessId,
        setImpersonatedBusinessId,
        updateBusinessStatus: (id, status) => {
            setAllBusinesses(prev => prev.map(b => b.id === id ? { ...b, status } : b));
            syncDb('businesses', 'update', { status }, id);
        },
        deleteBusiness: (id) => {
            setAllBusinesses(prev => prev.filter(b => b.id !== id));
            syncDb('businesses', 'delete', {}, id);
        },
        addBusiness: async (b) => {
            let newBizId = crypto.randomUUID();
            let newBiz = { ...b, id: newBizId, status: 'Aktif' as const, maxBranches: 1 };
            
            try {
                // 1. İlk Kayıt Denemesi
                try {
                    await syncDb('businesses', 'insert', newBiz, newBizId);
                } catch (dbError: any) {
                    // Eğer hata slug çakışmasıysa (Postgres code 23505)
                    if (dbError.code === '23505' && dbError.message?.includes('slug')) {
                        console.log("Slug çakışması algılandı, otomatik onarılıyor...");
                        const suffix = Math.random().toString(36).substring(2, 5);
                        newBiz.slug = `${newBiz.slug}-${suffix}`;
                        // İkinci deneme
                        await syncDb('businesses', 'insert', newBiz, newBizId);
                    } else {
                        throw dbError;
                    }
                }
                
                // 2. Varsayılan Şube Oluştur
                const defaultBranch = {
                    id: crypto.randomUUID(),
                    business_id: newBizId,
                    name: 'Merkez Şube',
                    location: 'Belirtilmedi',
                    status: 'Aktif' as const
                };
                await syncDb('branches', 'insert', defaultBranch, defaultBranch.id);

                // 3. Başarılıysa state güncelle
                setAllBusinesses(prev => [...prev, newBiz as any]);
                setAllowedBranches(prev => [...prev, defaultBranch as any]);
                
                return newBiz as any;
            } catch (error) {
                console.error("İşletme ekleme başarısız:", error);
                throw error;
            }
        },
        provisionBusinessUser: async (data) => {
            const biz = allBusinesses.find(b => b.id === data.businessId);
            if (biz) {
                const activeCount = allUsers.filter(u => u.businessId === biz.id).length;
                if (activeCount >= (biz.maxUsers || 5)) {
                    return { success: false, error: `Kullanıcı limiti aşıldı (Max: ${biz.maxUsers}). Lütfen planınızı yükseltin.` };
                }
            }
            const { data: { session } } = await supabase.auth.getSession();
            const res = await fetch('/api/admin/provision-user', {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session?.access_token}`
                },
                body: JSON.stringify(data)
            });
            return await res.json();
        },
        setCurrentBranch: (branch) => {
            setCurrentBranchState(branch);
            if (branch) localStorage.setItem('aura_last_branch', branch.id);
            else localStorage.removeItem('aura_last_branch');
        },
        customers,
        packages: allPackages,
        membershipPlans,
        customerMemberships,
        appointments,
        blocks: allBlocks,
        payments: allPayments,
        staffMembers: allStaff,
        debts: allDebts,
        branches: allowedBranches,
        allLogs,
        allNotifs,
        aiInsights,
        customerMedia: allCustomerMedia,
        inventory: allInventory,
        rooms: allRooms,
        services: allServices,
        packageDefinitions: allPackageDefinitions,
        commissionRules: allCommissionRules,
        rates: [],
        expenses: expenses,
        zReports,
        settings,
        allowedBranches,
        bookingSettings,
        paymentDefinitions,
        bankAccounts,
        expenseCategories,
        referralSources,
        consentFormTemplates,
        login,
        logout,
        fetchData,
        isInitialized,
        fetchPublicData: async (slug) => {
            const { data: business } = await supabase.from('businesses').select('*').eq('slug', slug).single();
            if (!business) return;
            
            const { data: branches } = await supabase.from('branches').select('*').eq('business_id', business.id);
            const { data: services } = await supabase.from('services').select('*').eq('business_id', business.id).eq('is_public', true);
            const { data: staff } = await supabase.from('staff').select('*').eq('business_id', business.id).eq('status', 'Aktif');
            const { data: settings } = await supabase.from('booking_settings').select('*').eq('business_id', business.id).single();

            setAllBusinesses([toCamel(business)]);
            setAllowedBranches(toCamel(branches || []));
            setAllServices(toCamel(services || []));
            setAllStaff(toCamel(staff || []));
            setBookingSettings(toCamel(settings));
        },
        closeDay: async (data) => {
            const z = { ...data, id: crypto.randomUUID(), businessId: getSafeBizId()!, branchId: currentBranch?.id!, closedBy: currentUser?.name!, createdAt: new Date().toISOString() };
            setZReports(prev => [...prev, z]);
            syncDb('z_reports', 'insert', z, z.id);
            return true;
        },
        addCustomer: (c) => {
            const nc = { ...c, id: crypto.randomUUID(), businessId: getSafeBizId()!, createdAt: new Date().toISOString() };
            setAllCustomers(prev => [...prev, nc]);
            syncDb('customers', 'insert', nc, nc.id);
            return nc;
        },
        updateCustomer: (id, updates) => {
            setAllCustomers(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
            syncDb('customers', 'update', updates, id);
        },
        addPackage: (p) => {
            const np = { ...p, id: crypto.randomUUID(), businessId: getSafeBizId()!, createdAt: new Date().toISOString() };
            setAllPackages(prev => [...prev, np]);
            syncDb('packages', 'insert', np, np.id);
        },
        addMembershipPlan: (p) => {
            const mp = { ...p, id: crypto.randomUUID(), businessId: getSafeBizId()!, createdAt: new Date().toISOString() };
            setMembershipPlans(prev => [...prev, mp]);
            syncDb('membership_plans', 'insert', mp, mp.id);
        },
        assignMembership: (cid, pid) => {
            const m = { id: crypto.randomUUID(), businessId: getSafeBizId()!, customerId: cid, planId: pid, startDate: new Date().toISOString(), expiryDate: new Date().toISOString(), remainingSessions: 10, status: 'active' as const };
            setCustomerMemberships(prev => [...prev, m]);
            syncDb('customer_memberships', 'insert', m, m.id);
        },
        addAppointment,
        moveAppointment: async (id, newTime, newStaffId) => {
            const appt = allAppointments.find(a => a.id === id);
            setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, time: newTime, staffId: newStaffId } : a));
            syncDb('appointments', 'update', { time: newTime, staffId: newStaffId }, id);
            
            if (appt) {
                store.addLog('Randevu Taşındı', appt.customerName, appt.time, newTime);
            }
            return true;
        },
        deleteAppointment: async (id) => {
            setAllAppointments(prev => prev.filter(a => a.id !== id));
            syncDb('appointments', 'delete', {}, id);
            return true;
        },
        updateAppointmentStatus: async (id, status) => {
            const appt = allAppointments.find(a => a.id === id);
            
            setAllAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
            syncDb('appointments', 'update', { status }, id);
            
            // Bridge Logic: Package session deduction
            if (status === 'completed' && appt?.packageId) {
                const pkg = allPackages.find(p => p.id === appt.packageId);
                if (pkg) {
                    const newUsed = pkg.usedSessions + 1;
                    setAllPackages(prev => prev.map(p => p.id === pkg.id ? { ...p, usedSessions: newUsed } : p));
                    syncDb('packages', 'update', { used_sessions: newUsed }, pkg.id);
                    store.addLog('Paket Seansı Kullanıldı', appt.customerName, `${pkg.usedSessions}/${pkg.totalSessions}`, `${newUsed}/${pkg.totalSessions}`);
                }
            }

            if (appt) {
                store.addLog('Randevu Durumu Değişti', appt.customerName, appt.status, status);
            }
            return true;
        },
        calculateDynamicPrice: (p, t) => ({ price: p, reason: null }),
        addBlock: (b) => {
            const nb = { ...b, id: crypto.randomUUID(), businessId: getSafeBizId()!, branchId: currentBranch?.id! };
            setAllBlocks(prev => [...prev, nb]);
            syncDb('calendar_blocks', 'insert', nb, nb.id);
        },
        removeBlock: (id) => {
            setAllBlocks(prev => prev.filter(b => b.id !== id));
            syncDb('calendar_blocks', 'delete', {}, id);
        },
        addCustomerMedia: (m) => {
            const nm = { ...m, id: crypto.randomUUID(), businessId: getSafeBizId()! };
            setAllCustomerMedia(prev => [...prev, nm]);
            syncDb('customer_media', 'insert', nm, nm.id);
        },
        deleteCustomerMedia: (id) => {
            setAllCustomerMedia(prev => prev.filter(m => m.id !== id));
            syncDb('customer_media', 'delete', {}, id);
        },
        updateSettings: (s) => setSettings(prev => ({ ...prev, ...s })),
        addRoom: (r) => {
            const nr = { ...r, id: crypto.randomUUID(), businessId: getSafeBizId()!, createdAt: new Date().toISOString() };
            setAllRooms(prev => [...prev, nr as any]);
            syncDb('rooms', 'insert', nr, nr.id);
        },
        updateRoom: (id, updates) => {
            setAllRooms(prev => prev.map(r => r.id === id ? { ...r, ...updates } : r));
            syncDb('rooms', 'update', updates, id);
        },
        deleteRoom: (id) => {
            setAllRooms(prev => prev.filter(r => r.id !== id));
            syncDb('rooms', 'delete', {}, id);
        },
        processCheckout: async (p, d, s) => {
            const bizId = getSafeBizId();
            if (!bizId) return false;

            const pay = { 
                ...p, 
                id: crypto.randomUUID(), 
                businessId: bizId, 
                branchId: currentBranch?.id!, 
                date: new Date().toISOString().split('T')[0],
                createdAt: new Date().toISOString()
            };
            
            // 1. Save Payment
            setAllPayments(prev => [...prev, pay]);
            syncDb('payments', 'insert', pay, pay.id);
            
            // 2. Handle Debts (Connection)
            if (d && d.amount > 0) {
                const debtRecord = {
                    id: crypto.randomUUID(),
                    businessId: bizId,
                    customerId: pay.customerId,
                    customerName: pay.customerName,
                    amount: d.amount,
                    dueDate: d.dueDate,
                    status: 'açık',
                    createdAt: new Date().toISOString()
                };
                setAllDebts(prev => [...prev, debtRecord as any]);
                syncDb('debts', 'insert', debtRecord, debtRecord.id);
                store.addLog('Borç Kaydedildi', pay.customerName, '', `₺${d.amount}`);
            }

            // 3. Handle Inventory (Connection)
            if (s && s.length > 0) {
                s.forEach(item => {
                    const prod = allInventory.find(iv => iv.id === item.productId);
                    if (prod) {
                        const newStock = Math.max(0, (prod.stock || 0) - item.quantity);
                        store.updateProduct(prod.id, { stock: newStock });
                        store.addLog('Stok Düştü', prod.name, `${prod.stock}`, `${newStock}`);
                    }
                });
            }
            
            store.addLog('Ödeme Alındı', pay.customerName, '', `₺${pay.totalAmount}`);
            
            // Trigger AI Re-analysis after checkout
            store.analyzeSystem();
            
            return true;
        },
        analyzeSystem: async () => {
            const bizId = getSafeBizId();
            if (!bizId) return;

            const insights: Omit<AiInsight, 'id'>[] = [];

            // Case 1: Overdue Debts
            const overdues = allDebts.filter(d => d.status === 'açık' && new Date(d.dueDate) < new Date());
            if (overdues.length > 0) {
                const total = overdues.reduce((s, d) => s + d.amount, 0);
                insights.push({
                    businessId: bizId,
                    title: 'Vadesi Geçmiş Alacak Riski',
                    desc: `${overdues.length} müşteriden toplam ₺${total.toLocaleString('tr-TR')} tahsilat bekliyor. Kaçak önleme modu önerilir.`,
                    impact: 'high',
                    category: 'risk'
                });
            }

            // Case 2: High Spenders without Packages
            const highSpenders = allCustomers.filter(c => {
                const customerPayments = allPayments.filter(p => p.customerId === c.id);
                const totalPaid = customerPayments.reduce((s, p) => s + p.totalAmount, 0);
                const hasPackage = allPackages.some(pkg => pkg.customerId === c.id && pkg.usedSessions < pkg.totalSessions);
                return totalPaid > 5000 && !hasPackage;
            });

            if (highSpenders.length > 0) {
                insights.push({
                    businessId: bizId,
                    title: 'Sadakat & Paket Fırsatı',
                    desc: `${highSpenders.length} yüksek harcamalı müşteri henüz paket sahibi değil. Upsell kampanyası başlatılabilir.`,
                    impact: 'medium',
                    category: 'sales'
                });
            }

            // Case 3: Low Staff Utilization (Simple)
            if (allAppointments.filter(a => a.status === 'pending').length < 5) {
                insights.push({
                    businessId: bizId,
                    title: 'Düşük Doluluk Oranı',
                    desc: 'Önümüzdeki günlerde doluluk %20\'nin altında. Kampanya veya hatırlatma mesajları önerilir.',
                    impact: 'low',
                    category: 'marketing'
                });
            }

            // Update local state and Sync with DB
            // We'll replace old insights for this business to avoid duplication
            setAiInsights(insights.map(i => ({ ...i, id: crypto.randomUUID() })) as any);
            
            // In a real scenario, we'd clear old insights for this business in DB first
            // For now, we rely on the setAiInsights to update the dashboard.
        },
        sendNotification: (cid, type, content) => {},
        addLog: (action, customer, oldValue, newValue) => {
            const log = {
                id: crypto.randomUUID(),
                businessId: getSafeBizId()!,
                date: new Date().toISOString(),
                customerName: customer,
                action,
                oldValue,
                newValue,
                user: currentUser?.name || 'Sistem'
            };
            setAllLogs(prev => [log, ...prev].slice(0, 100)); // Keep last 100 in memory
            syncDb('audit_logs', 'insert', log, log.id);
        },
        addProduct: (p) => {
            const np = { ...p, id: crypto.randomUUID(), businessId: getSafeBizId()! };
            setAllInventory(prev => [...prev, np]);
            syncDb('inventory', 'insert', np, np.id);
        },
        updateProduct: (id, updates) => {
            setAllInventory(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            syncDb('inventory', 'update', updates, id);
        },
        addExpense: (e) => {
            const ne = { ...e, id: crypto.randomUUID(), businessId: getSafeBizId()!, branchId: e.branchId || currentBranch?.id || null };
            setAllExpenses(prev => [...prev, ne as any]);
            syncDb('expenses', 'insert', ne, ne.id);
        },
        addService: (s) => {
            const ns = { ...s, id: crypto.randomUUID(), businessId: getSafeBizId()! };
            setAllServices(prev => [...prev, ns]);
            syncDb('services', 'insert', ns, ns.id);
        },
        updateService: (id, updates) => {
            setAllServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
            syncDb('services', 'update', updates, id);
        },
        removeService: (id) => {
            setAllServices(prev => prev.filter(s => s.id !== id));
            syncDb('services', 'delete', {}, id);
        },
        addPackageDefinition: (p) => {
            const np = { ...p, id: crypto.randomUUID(), businessId: getSafeBizId()!, isActive: true };
            setAllPackageDefinitions(prev => [...prev, np]);
            syncDb('package_definitions', 'insert', np, np.id);
        },
        updatePackageDefinition: (id, updates) => {
            setAllPackageDefinitions(prev => prev.map(p => p.id === id ? { ...p, ...updates } : p));
            syncDb('package_definitions', 'update', updates, id);
        },
        removePackageDefinition: (id) => {
            setAllPackageDefinitions(prev => prev.filter(p => p.id !== id));
            syncDb('package_definitions', 'delete', {}, id);
        },
        deleteCustomer: async (id) => {
            setAllCustomers(prev => prev.filter(c => c.id !== id));
            syncDb('customers', 'delete', {}, id);
            return true;
        },
        updateBusinessLicense: (id, max) => {},
        updateBusinessBranches: async (id, max) => {
            setAllBusinesses(prev => prev.map(b => b.id === id ? { ...b, maxBranches: max } : b));
            syncDb('businesses', 'update', { max_branches: max }, id);
        },
        payDebt: async (id, amt, meth) => true,
        addCommissionRule: (rule) => {},
        removeCommissionRule: (id) => {},
        updateRoomStatus: (id, status) => {
            setAllRooms(prev => prev.map(r => r.id === id ? { ...r, status } : r));
            syncDb('rooms', 'update', { status }, id);
        },
        addStaff: (s) => {
            const bizId = getSafeBizId();
            if (bizId) {
                const biz = allBusinesses.find(x => x.id === bizId);
                const myStaffCount = allStaff.filter(x => x.businessId === bizId).length;
                if (biz && myStaffCount >= (biz.maxUsers || 5)) {
                    alert(`Personel limiti aşıldı (Max: ${biz.maxUsers}). Ek personel için planınızı yükseltin.`);
                    return;
                }
            }
            const ns = { ...s, id: crypto.randomUUID(), businessId: getSafeBizId()!, branchId: currentBranch?.id!, status: 'Aktif' as const };
            setAllStaff(prev => [...prev, ns as any]);
            syncDb('staff', 'insert', ns, ns.id);
        },
        deleteStaff: (id) => {
            setAllStaff(prev => prev.filter(s => s.id !== id));
            syncDb('staff', 'delete', {}, id);
        },
        updateStaff: (id, staff) => {
            setAllStaff(prev => prev.map(s => s.id === id ? { ...s, ...staff } : s));
            syncDb('staff', 'update', staff, id);
        },
        updateStaffPermissions: (userId, perms) => {
            setAllUsers(prev => prev.map(u => u.id === userId ? { ...u, permissions: perms } : u));
            syncDb('app_users', 'update', { permissions: perms }, userId);
        },

        addPaymentDefinition: (p) => {
            const np = { ...p, id: crypto.randomUUID(), businessId: getSafeBizId()!, isActive: true, createdAt: new Date().toISOString() };
            setPaymentDefinitions(prev => [...prev, np]);
            syncDb('payment_definitions', 'insert', np, np.id);
        },
        updatePaymentDefinition: (id, p) => {
            setPaymentDefinitions(prev => prev.map(item => item.id === id ? { ...item, ...p } : item));
            syncDb('payment_definitions', 'update', p, id);
        },
        removePaymentDefinition: (id) => {
            setPaymentDefinitions(prev => prev.filter(item => item.id !== id));
            syncDb('payment_definitions', 'delete', {}, id);
        },

        addBankAccount: (b) => {
            const nb = { ...b, id: crypto.randomUUID(), businessId: getSafeBizId()!, isActive: true };
            setBankAccounts(prev => [...prev, nb]);
            syncDb('bank_accounts', 'insert', nb, nb.id);
        },
        updateBankAccount: (id, b) => {
            setBankAccounts(prev => prev.map(item => item.id === id ? { ...item, ...b } : item));
            syncDb('bank_accounts', 'update', b, id);
        },
        removeBankAccount: (id) => {
            setBankAccounts(prev => prev.filter(item => item.id !== id));
            syncDb('bank_accounts', 'delete', {}, id);
        },

        addExpenseCategory: (c) => {
            const nc = { ...c, id: crypto.randomUUID(), businessId: getSafeBizId()! };
            setExpenseCategories(prev => [...prev, nc]);
            syncDb('expense_categories', 'insert', nc, nc.id);
        },
        updateExpenseCategory: (id, c) => {
            setExpenseCategories(prev => prev.map(item => item.id === id ? { ...item, ...c } : item));
            syncDb('expense_categories', 'update', c, id);
        },
        removeExpenseCategory: (id) => {
            setExpenseCategories(prev => prev.filter(item => item.id !== id));
            syncDb('expense_categories', 'delete', {}, id);
        },

        addReferralSource: (s) => {
            const ns = { ...s, id: crypto.randomUUID(), businessId: getSafeBizId()! };
            setReferralSources(prev => [...prev, ns]);
            syncDb('referral_sources', 'insert', ns, ns.id);
        },
        updateReferralSource: (id, s) => {
            setReferralSources(prev => prev.map(item => item.id === id ? { ...item, ...s } : item));
            syncDb('referral_sources', 'update', s, id);
        },
        removeReferralSource: (id) => {
            setReferralSources(prev => prev.filter(item => item.id !== id));
            syncDb('referral_sources', 'delete', {}, id);
        },

        addConsentFormTemplate: (t) => {
            const nt = { ...t, id: crypto.randomUUID(), businessId: getSafeBizId()!, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
            setConsentFormTemplates(prev => [...prev, nt]);
            syncDb('consent_form_templates', 'insert', nt, nt.id);
        },
        updateConsentFormTemplate: (id, t) => {
            setConsentFormTemplates(prev => prev.map(item => item.id === id ? { ...item, ...t, updatedAt: new Date().toISOString() } : item));
            syncDb('consent_form_templates', 'update', { ...t, updated_at: new Date().toISOString() }, id);
        },
        removeConsentFormTemplate: (id) => {
            setConsentFormTemplates(prev => prev.filter(item => item.id !== id));
            syncDb('consent_form_templates', 'delete', {}, id);
        },
        addBranch: async (b) => {
            const bizId = getSafeBizId();
            if (bizId) {
                const biz = allBusinesses.find(x => x.id === bizId);
                const myBranchCount = allowedBranches.filter(x => x.businessId === bizId).length;
                if (biz && myBranchCount >= (biz.maxBranches || 1)) {
                    alert(`Şube limiti aşıldı (Max: ${biz.maxBranches}). Ek şube için planınızı yükseltin.`);
                    return;
                }
            }
            const nb = { ...b, id: crypto.randomUUID(), business_id: getSafeBizId()! };
            setAllowedBranches(prev => [...prev, nb as any]);
            syncDb('branches', 'insert', nb, nb.id);
        },
        updateBranch: (id, b) => {
            setAllowedBranches(prev => prev.map(item => item.id === id ? { ...item, ...b } : item));
            syncDb('branches', 'update', b, id);
        },
        deleteBranch: (id) => {
            setAllowedBranches(prev => prev.filter(b => b.id !== id));
            syncDb('branches', 'delete', {}, id);
        },
        getCustomerPackages: (cid) => allPackages.filter(p => p.customerId === cid),
        getCustomerAppointments: (cid) => allAppointments.filter(a => a.customerId === cid),
        getCustomerAppointmentsByBranch: (cid, bid) => allAppointments.filter(a => a.customerId === cid && a.branchId === bid),
        getCustomerPayments: (cid) => allPayments.filter(p => p.customerId === cid),
        getTodayPayments: () => allPayments.filter(p => p.date === new Date().toISOString().split('T')[0]),
        calculateCommission: (staffId, serviceName, price, packageId) => {
            if (packageId) return 0;
            const rule = allCommissionRules.find(r => r.staffId === staffId && (r.serviceName === serviceName || r.serviceName === 'Tümü'));
            if (rule) {
                return (price * (rule.value || 0)) / 100;
            }
            return 0;
        },
        can: (p) => {
            if (!currentUser) return false;
            if (currentUser.role === 'SaaS_Owner' || currentUser.role === 'Business_Owner') return true;
            return currentUser.permissions.includes(p);
        },
        getUpsellSuggestions: (s) => [],
        determineChurnRisk: (c) => {
            const customerAppointments = allAppointments.filter(a => a.customerId === c.id);
            if (customerAppointments.length === 0) return false;
            
            const now = new Date();
            const lastAppt = customerAppointments
                .filter(a => a.status === 'completed')
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
                
            if (!lastAppt) {
                const canceledCount = customerAppointments.filter(a => a.status === 'cancelled' || a.status === 'no-show').length;
                return canceledCount >= 2;
            }
            
            const daysSinceLast = (now.getTime() - new Date(lastAppt.date).getTime()) / (1000 * 3600 * 24);
            const totalCount = customerAppointments.length;
            
            if (totalCount >= 3 && daysSinceLast > 45) {
                return true;
            }
            
            const canceledCount = customerAppointments.filter(a => a.status === 'cancelled' || a.status === 'no-show').length;
            const completedCount = customerAppointments.filter(a => a.status === 'completed').length;
            if (canceledCount > 0 && canceledCount > completedCount) {
                return true;
            }

            return false;
        },
        getChurnRiskCustomers: () => {
            return allCustomers.filter(c => store.determineChurnRisk(c));
        },
        getUpsellPotentialCustomers: () => {
            const potential: { customer: Customer, reason: string }[] = [];
            allPackages.forEach(p => {
                const c = allCustomers.find(cust => cust.id === p.customerId);
                if (!c) return;

                if (p.totalSessions - p.usedSessions === 1) {
                    potential.push({ customer: c, reason: 'Son Seans (Abonelik Yenileme)' });
                } else if (new Date(p.expiry) < new Date() && p.usedSessions < p.totalSessions) {
                    potential.push({ customer: c, reason: 'Süresi Dolan Paket' });
                }
            });
            return potential;
        },
        getBirthdaysToday: () => {
            const today = new Date();
            const dayMonth = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}`;
            return allCustomers.filter(c => c.birthdate && c.birthdate.includes(dayMonth));
        },
        quotes: allQuotes,
        addQuote: (q: any) => {
            const bizId = getSafeBizId();
            const nq = { 
                ...q, 
                id: crypto.randomUUID(), 
                businessId: bizId!,
                branchId: currentBranch?.id || null,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };
            setAllQuotes(prev => [...prev, nq as any]);
            syncDb('quotes', 'insert', nq, nq.id);
        },
        updateQuote: (id: string, updates: any) => {
            const upds = { ...updates, updatedAt: new Date().toISOString() };
            setAllQuotes(prev => prev.map(q => q.id === id ? { ...q, ...upds } : q));
            syncDb('quotes', 'update', upds, id);
        },
        deleteQuote: (id: string) => {
            setAllQuotes(prev => prev.filter(q => q.id !== id));
            syncDb('quotes', 'delete', {}, id);
        },
        addAnnouncement: async (announcement: any) => {
            const { data, error } = await supabase.from('system_announcements').insert(toSnake(announcement)).select().single();
            if (error) {
                console.error("Announcement error:", error);
                return;
            }
            setAllNotifs(prev => [...prev, toCamel(data)]);
        },
        updateModuleStatus: async (bizId: string, moduleName: string, isEnabled: boolean) => {
            const { error } = await supabase.from('tenant_modules').upsert(toSnake({ businessId: bizId, moduleName, isEnabled }), { onConflict: 'business_id,module_name' });
            if (error) console.error("Module update error:", error);
            else await fetchData();
        },
        updateBusinessPricing: async (id: string, updates: any) => {
            const { error } = await supabase.from('businesses').update(toSnake(updates)).eq('id', id);
            if (error) console.error("Pricing update error:", error);
            else setAllBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
        },
        systemAnnouncements,
        tenantModules,
        isLicenseExpired: false
    };
 
     return (
         <StoreContext.Provider value={store}>
             {isInitialized ? children : null}
         </StoreContext.Provider>
     );
 }
 
 export const useStore = () => {
     const context = useContext(StoreContext);
     if (!context) throw new Error('useStore must be used within StoreProvider');
     return context;
 };
