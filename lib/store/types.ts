/**
 * Aura Core - Store Types
 * Bu dosya state yönetiminde kullanılan tüm model ve arayüz tanımlarını içerir.
 */

import * as DB from '@/lib/types/database.types';

export type Business = DB.Business;
export type Branch = DB.Branch;
export type AppUser = DB.AppUser;
export type Customer = DB.Customer;
export type MembershipPlan = DB.MembershipPlan;
export type CustomerMembership = DB.CustomerMembership;
export type Package = DB.Package;
export type PackageDefinition = DB.PackageDefinition;
export interface Appointment extends DB.Appointment {
    syncStatus?: 'idle' | 'syncing' | 'error';
}
export interface CalendarBlock extends DB.CalendarBlock {
    roomId?: string | null;
}
export type Debt = DB.Debt;
export interface Payment extends Omit<DB.Payment, 'methods' | 'isGift' | 'originalPrice' | 'giftNote' | 'soldProducts'> {
    methods: PaymentMethod[];
    isGift?: boolean;
    originalPrice?: number;
    authorizedBy?: string;
    giftNote?: string;
    sold_products?: any; // Matches DB column name if needed, but DB.Payment has soldProducts (camelCase)
    soldProducts?: any;
}
export type BookingSettings = DB.BookingSettings;
export interface Staff extends DB.Staff {
    offDay: number;
    isVisibleOnCalendar: boolean;
    sortOrder: number;
    maxDiscount: number; // Yüzde olarak (0-100)
}
export type PaymentDefinition = DB.PaymentDefinition;
export type BankAccount = DB.BankAccount;
export type ExpenseCategory = DB.ExpenseCategory;
export type ReferralSource = DB.ReferralSource;
export type ConsentFormTemplate = DB.ConsentFormTemplate;
export interface Product extends DB.Product {
    lowStockThreshold?: number;
    lastPurchasePrice?: number;
}
export type Service = DB.Service;
export type AuditLog = DB.AuditLog;
export type NotificationLog = DB.NotificationLog;
export type AiInsight = DB.AiInsight;
export type Room = DB.Room;
export type CommissionRule = DB.CommissionRule;
export type Expense = DB.Expense;
export type CustomerMedia = DB.CustomerMedia;
export type ZReport = DB.ZReport & { aiSummary?: string; notes?: string; closedBy?: string; };
export type Quote = DB.Quote;
export type LoyaltySettings = DB.LoyaltySettings;
export type Webhook = DB.Webhook;
export type SystemAnnouncement = DB.SystemAnnouncement;
export type TenantModule = DB.TenantModule;
export type MarketingRule = DB.MarketingRule;
export type DynamicPricingRule = DB.DynamicPricingRule;
export type CustomerWallet = DB.CustomerWallet;
export type WalletTransaction = DB.WalletTransaction;
export type ConsultationBodyMap = DB.ConsultationBodyMap;
export type InventoryUsageNorm = DB.InventoryUsageNorm;
export interface InventoryCategory {
    id: string;
    businessId: string;
    name: string;
    color?: string;
    createdAt?: string;
}

export type AppointmentStatus = 'pending' | 'completed' | 'no-show' | 'cancelled' | 'excused' | 'arrived' | 'unexcused-cancel';

export interface PaymentMethod {
    id: string;
    method: 'nakit' | 'kredi-karti' | 'havale' | 'banka' | 'puan' | 'abonelik' | 'diger';
    amount: number;
    currency: 'TRY' | 'USD' | 'EUR' | 'GBP';
    rate: number;
    isDeposit: boolean;
    toolId?: string;
}

export interface BusinessSettings {
    startHour: number;
    endHour: number;
    openDays: number[];
    isAutoMarketingEnabled: boolean;
    aiApprovalMode: 'manual' | 'auto';
}

export interface CurrencyRate {
    code: string;
    name: string;
    rate: number;
}

export interface StoreState {
    currentUser: AppUser | null;
    currentBusiness: Business | null;
    currentBranch: Branch | null;
    currentStaff: Staff | undefined;
    isOnline: boolean;
    syncStatus: 'idle' | 'syncing' | 'error';
    isManagerAuthorized: boolean;
    setManagerAuthorized: (val: boolean) => void;
    
    allBusinesses: Business[];
    allUsers: AppUser[];
    allPayments: Payment[]; 
    
    impersonatedBusinessId: string | null;
    isImpersonating: boolean;
    setImpersonatedBusinessId: (id: string | null) => void;
    
    updateBusinessStatus: (id: string, status: Business['status']) => void;
    deleteBusiness: (id: string) => void;
    addBusiness: (b: Partial<Business> & { name: string; slug: string }) => Promise<Business | null>;
    renewSubscription: (id: string, days: number, amount: number) => Promise<boolean>;
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
    loyaltySettings: LoyaltySettings | null;
    webhooks: Webhook[];
    tenantModules: TenantModule[];
    marketingRules: MarketingRule[];
    pricingRules: DynamicPricingRule[];
    wallets: CustomerWallet[];
    walletTransactions: WalletTransaction[];
    bodyMaps: ConsultationBodyMap[];
    usageNorms: InventoryUsageNorm[];
    inventoryCategories: InventoryCategory[];
    
    login: (email: string, pass: string) => Promise<AppUser | null>;
    logout: () => void;
    fetchData: (bizId?: string, user?: AppUser, force?: boolean, startDate?: string, endDate?: string) => Promise<void>;
    isInitialized: boolean;
    fetchPublicData: (slug: string) => Promise<void>;
    closeDay: (data: Omit<ZReport, 'id' | 'businessId' | 'branchId' | 'closedBy' | 'createdAt'>) => Promise<boolean>;
    addCustomer: (c: any) => Customer;
    updateCustomer: (id: string, updates: Partial<Customer>) => Promise<void>;
    addPackage: (p: any) => Promise<void>;
    addMembershipPlan: (p: any) => Promise<void>;
    assignMembership: (cid: string, pid: string) => Promise<void>;
    addAppointment: (a: any) => Promise<boolean>;
    moveAppointment: (id: string, newTime: string, newStaffId?: string, newRoomId?: string) => Promise<boolean>;
    deleteAppointment: (id: string) => Promise<boolean>;
    updateAppointmentStatus: (id: string, status: AppointmentStatus) => Promise<boolean>;
    calculateDynamicPrice: (servicePrice: number, timeStr: string) => { price: number, reason: string | null };
    addBlock: (b: any) => Promise<boolean>;
    updateBlock: (id: string, updates: any) => Promise<boolean>;
    removeBlock: (id: string) => Promise<boolean>;
    updateAppointment: (id: string, updates: any) => Promise<boolean>;
    addCustomerMedia: (m: Omit<CustomerMedia, 'id' | 'businessId'>) => void;
    deleteCustomerMedia: (id: string) => void;
    updateSettings: (s: Partial<BusinessSettings>) => void;
    updateBusinessSettings: (s: Partial<BusinessSettings>) => void;
    updateBusiness: (updates: Partial<Business>) => Promise<boolean>;
    
    addRoom: (r: Omit<Room, 'id' | 'businessId' | 'createdAt'>) => void;
    updateRoom: (id: string, updates: Partial<Room>) => void;
    deleteRoom: (id: string) => void;
    
    analyzeSystem: () => Promise<void>;
    processCheckout: (
        paymentData: any, 
        options?: {
            installments?: { amount: number, dueDate: string }[],
            soldProducts?: { productId: string, name: string, price: number, quantity: number, isGift?: boolean }[],
            earnedPoints?: number,
            tipAmount?: number,
            pointsUsed?: number,
            packageId?: string
        }
    ) => Promise<boolean>;
    sendNotification: (customerId: string, type: NotificationLog['type'], content: string) => void;
    addLog: (action: string, customer: string, oldValue?: string, newValue?: string) => Promise<void>;
    addProduct: (p: any) => Promise<void>;
    transferProduct: (productId: string, fromBranchId: string, toBranchId: string, amount: number) => Promise<boolean>;
    addExpense: (e: any) => Promise<void>;
    addService: (s: any) => Promise<void>;
    updateService: (id: string, s: Partial<Service>) => void;
    removeService: (id: string) => Promise<boolean>;
    
    addPackageDefinition: (p: any) => void;
    updatePackageDefinition: (id: string, p: Partial<PackageDefinition>) => void;
    removePackageDefinition: (id: string) => Promise<boolean>;
    
    addQuote: (q: Omit<Quote, 'id' | 'businessId'>) => void;
    updateQuote: (id: string, updates: Partial<Quote>) => void;
    deleteQuote: (id: string) => void;
    updateBookingSettings: (s: Partial<BookingSettings>) => Promise<void>;
    updateLoyaltySettings: (s: Partial<LoyaltySettings>) => Promise<void>;
    addWebhook: (w: Omit<Webhook, 'id' | 'businessId'>) => Promise<void>;
    deleteWebhook: (id: string) => Promise<void>;

    updateProduct: (id: string, p: Partial<Product>) => void;
    removeProduct: (id: string) => void;
    
    addInventoryCategory: (c: Omit<InventoryCategory, 'id' | 'businessId' | 'createdAt'>) => Promise<void>;
    updateInventoryCategory: (id: string, updates: Partial<InventoryCategory>) => Promise<void>;
    removeInventoryCategory: (id: string, deleteProducts: boolean) => Promise<void>;
    
    deleteCustomer: (id: string) => Promise<boolean>;
    updateBusinessLicense: (id: string, max: number) => void;
    updateBusinessBranches: (id: string, max: number) => Promise<void>;
    payDebt: (debtId: string, amount: number, methods: any) => Promise<boolean>;
    addCommissionRule: (rule: Omit<CommissionRule, 'id' | 'businessId'>) => Promise<void>;
    removeCommissionRule: (id: string) => Promise<void>;
    updateRoomStatus: (id: string, status: Room['status']) => Promise<void>;
    addStaff: (s: Omit<Staff, 'id' | 'businessId' | 'branchId'>) => Promise<void>;
    deleteStaff: (id: string) => Promise<void>;
    updateStaff: (id: string, s: Partial<Staff>) => Promise<void>;
    updateStaffPermissions: (userId: string, perms: string[]) => Promise<void>;
 
    addPaymentDefinition: (p: any) => Promise<void>;
    updatePaymentDefinition: (id: string, p: Partial<PaymentDefinition>) => Promise<void>;
    removePaymentDefinition: (id: string) => Promise<void>;
    
    addBankAccount: (b: any) => Promise<void>;
    updateBankAccount: (id: string, b: Partial<BankAccount>) => Promise<void>;
    removeBankAccount: (id: string) => Promise<void>;
    
    addExpenseCategory: (c: any) => Promise<void>;
    updateExpenseCategory: (id: string, c: Partial<ExpenseCategory>) => Promise<void>;
    removeExpenseCategory: (id: string) => Promise<void>;
    
    addReferralSource: (s: any) => Promise<void>;
    updateReferralSource: (id: string, s: Partial<ReferralSource>) => Promise<void>;
    removeReferralSource: (id: string) => Promise<void>;
    
    addConsentFormTemplate: (t: any) => Promise<void>;
    updateConsentFormTemplate: (id: string, t: Partial<ConsentFormTemplate>) => Promise<void>;
    removeConsentFormTemplate: (id: string) => Promise<void>;

    addMarketingRule: (rule: Omit<MarketingRule, 'id' | 'businessId'>) => Promise<void>;
    updateMarketingRule: (id: string, updates: Partial<MarketingRule>) => Promise<void>;
    deleteMarketingRule: (id: string) => Promise<void>;

    addPricingRule: (rule: Omit<DynamicPricingRule, 'id' | 'businessId'>) => Promise<void>;
    updatePricingRule: (id: string, updates: Partial<DynamicPricingRule>) => Promise<void>;
    deletePricingRule: (id: string) => Promise<void>;
    
    getWallet: (customerId: string) => CustomerWallet | undefined;
    loadWallet: (customerId: string, amount: number, desc?: string) => Promise<void>;
    spendFromWallet: (customerId: string, amount: number, desc?: string) => Promise<boolean>;
    
    addBodyMap: (map: Omit<ConsultationBodyMap, 'id' | 'businessId'>) => Promise<void>;
    updateBodyMap: (id: string, mapData: any) => Promise<void>;
    
    addUsageNorm: (norm: Omit<InventoryUsageNorm, 'id' | 'businessId'>) => Promise<void>;
    updateUsageNorm: (id: string, updates: Partial<InventoryUsageNorm>) => Promise<void>;
    
    getRecommendedStaff: (serviceId: string, customerId?: string) => Staff[];
    getEffectivePrice: (serviceId: string) => number;
    predictInventory: () => any[];

    addBranch: (branch: Partial<Branch>) => Promise<void>;
    updateBranch: (id: string, branch: Partial<Branch>) => void;
    deleteBranch: (id: string) => void;
 
    getCustomerPackages: (cid: string) => Package[];
    getCustomerAppointments: (cid: string) => Appointment[];
    getCustomerAppointmentsByBranch: (cid: string, bid: string) => Appointment[];
    getCustomerPayments: (cid: string) => Payment[];
    getTodayPayments: () => Payment[];
    getTodayDate: () => string;
    
    calculateCommission: (staffId: string, serviceName: string, price: number, packageId?: string) => number;
    can: (permission: string) => boolean;
    getUpsellSuggestions: (serviceName: string) => Product[];
    determineChurnRisk: (customer: Customer) => boolean;
    getChurnRiskCustomers: () => Customer[];
    getUpsellPotentialCustomers: () => { customer: Customer, reason: string }[];
    getBirthdaysToday: () => Customer[];
 
    isLicenseExpired: boolean;

    provisionStaffUser: (data: { email: string; password: string; name: string; staffId: string; permissions: string[] }) => Promise<{ success: boolean; error?: string }>;

    addAnnouncement: (a: Omit<DB.SystemAnnouncement, 'id' | 'createdAt'>) => Promise<void>;
    updateModuleStatus: (bizId: string, moduleName: string, isEnabled: boolean) => Promise<void>;
    updateBusinessPricing: (id: string, updates: { plan?: string, overrideMrr?: number | null, signupPrice?: number }) => Promise<void>;
    
    updateRates: (newRates: CurrencyRate[]) => void;
    assignRoomToAppointment: (appointmentId: string, roomId: string) => Promise<boolean>;
    downloadZReportPDF: (report: any) => void;
    broadcastAnnouncement: (title: string, content: string, type: 'info' | 'warning' | 'success' | 'danger') => Promise<void>;
    addZReport: (data: any) => Promise<boolean>;
    runImperialAudit: () => { type: 'critical' | 'warning' | 'info'; title: string; desc: string; targetId?: string; table?: string }[];
    clearCatalog: () => void;
}
