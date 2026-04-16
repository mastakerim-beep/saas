"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import { BusinessProvider, useBusiness } from './BusinessContext';
import { DataProvider, useData } from './DataContext';
import { 
    StoreState, AppUser, Staff, Appointment, Payment, Customer, 
    Product, Service, Package, MembershipPlan, CustomerMembership,
    PaymentDefinition, BankAccount, ExpenseCategory, ReferralSource, 
    ConsentFormTemplate, AuditLog, NotificationLog, CommissionRule,
    PackageDefinition, Quote, MarketingRule, DynamicPricingRule, Room, Expense, CalendarBlock
} from './types';
import { fetchData as fetchDataLogic } from './fetch-logic';
import { syncDb } from './sync-db';

const StoreContext = createContext<StoreState | undefined>(undefined);

// Main Orchestrator component that holds the global store logic
// This must be wrapped by individual context providers
const StoreOrchestrator = ({ children }: { children: ReactNode }) => {
    const auth = useAuth();
    const biz = useBusiness();
    const data = useData();

    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        // Otomatik veri çekme başlatıcı
        if (auth.currentUser) {
            fetchData();
        }

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
        };
    }, [auth.currentUser]);

    const activeBizId = auth.impersonatedBusinessId || auth.currentUser?.businessId;

    const runSync = async (table: string, action: 'insert' | 'update' | 'delete', payload: any, id?: string) => {
        if (!isOnline) return;
        setSyncStatus('syncing');
        try {
            await syncDb(table, action, payload, id);
            setSyncStatus('idle');
        } catch (err) {
            setSyncStatus('error');
        }
    };

    const fetchData = async (bizId?: string, user?: AppUser, force?: boolean, startDate?: string, endDate?: string) => {
        const targetBizId = bizId || activeBizId;
        const targetUser = user || auth.currentUser;
        
        if (!targetUser) return;
        const isSaaS = targetUser.role === 'SaaS_Owner';
        if (!targetBizId && !isSaaS) return;

        await fetchDataLogic(
            targetBizId,
            targetUser,
            {
                setAllCustomers: data.setAllCustomers,
                setAllAppointments: data.setAllAppointments,
                setAllBlocks: data.setAllBlocks,
                setAllNotifs: data.setAllNotifs,
                setAllLogs: data.setAllLogs,
                setAllStaff: data.setAllStaff,
                setAllInventory: data.setAllInventory,
                setAllRooms: data.setAllRooms,
                setAllServices: data.setAllServices,
                setAllPackageDefinitions: data.setAllPackageDefinitions,
                setAllExpenses: data.setAllExpenses,
                setZReports: data.setZReports,
                setAllPackages: data.setAllPackages,
                setAllQuotes: data.setAllQuotes,
                setTenantModules: data.setTenantModules,
                setMarketingRules: data.setMarketingRules,
                setPricingRules: data.setPricingRules,
                setWallets: data.setWallets,
                setWalletTransactions: data.setWalletTransactions,
                setBodyMaps: data.setBodyMaps,
                setUsageNorms: data.setUsageNorms,
                setAllCustomerMedia: data.setAllCustomerMedia,
                setAllDebts: data.setAllDebts,
                setAiInsights: data.setAiInsights,
                setMembershipPlans: data.setMembershipPlans,
                setCustomerMemberships: data.setCustomerMemberships,
                setAllBusinesses: biz.setAllBusinesses,
                setBranches: biz.setBranches,
                setSettings: biz.setSettings,
                setBookingSettings: biz.setBookingSettings,
                setPaymentDefinitions: biz.setPaymentDefinitions,
                setBankAccounts: biz.setBankAccounts,
                setExpenseCategories: biz.setExpenseCategories,
                setReferralSources: biz.setReferralSources,
                setConsentFormTemplates: biz.setConsentFormTemplates,
                setSyncStatus: setSyncStatus,
                setCurrentBranch: biz.setCurrentBranch,
                setCurrentTenant: biz.setCurrentTenant,
                setAllPayments: data.setAllPayments
            },
            force,
            startDate,
            endDate
        );
    };

    const store: StoreState = {
        currentUser: auth.currentUser,
        currentBusiness: biz.currentTenant,
        currentBranch: biz.currentBranch,
        isOnline: isOnline,
        syncStatus: syncStatus,
        
        allBusinesses: biz.allBusinesses,
        allUsers: auth.allUsers,
        allPayments: [], 

        impersonatedBusinessId: auth.impersonatedBusinessId,
        isImpersonating: auth.isImpersonating,
        setImpersonatedBusinessId: auth.setImpersonatedBusinessId,
        
        updateBusinessStatus: auth.updateBusinessStatus,
        deleteBusiness: auth.deleteBusiness,
        addBusiness: auth.addBusiness,
        provisionBusinessUser: auth.provisionBusinessUser,
        setCurrentBranch: biz.setCurrentBranch,

        customers: data.customers,
        packages: data.packages,
        membershipPlans: data.membershipPlans,
        customerMemberships: data.customerMemberships,
        appointments: data.appointments,
        blocks: data.blocks,
        payments: [], 
        staffMembers: data.staffMembers,
        debts: data.debts,
        branches: biz.branches,
        allLogs: data.allLogs,
        allNotifs: data.allNotifs,
        aiInsights: data.aiInsights,
        customerMedia: data.customerMedia,
        inventory: data.inventory,
        rooms: data.rooms,
        services: data.services,
        packageDefinitions: data.packageDefinitions,
        commissionRules: data.commissionRules,
        rates: biz.allRates,
        expenses: data.expenses,
        zReports: data.zReports,
        settings: biz.settings,
        allowedBranches: biz.branches,
        bookingSettings: biz.bookingSettings,
        paymentDefinitions: biz.paymentDefinitions,
        bankAccounts: biz.bankAccounts,
        expenseCategories: biz.expenseCategories,
        referralSources: biz.referralSources,
        consentFormTemplates: biz.consentFormTemplates,
        quotes: data.quotes,
        systemAnnouncements: [],
        tenantModules: data.tenantModules,
        marketingRules: data.marketingRules,
        pricingRules: data.pricingRules,
        wallets: data.wallets,
        walletTransactions: data.walletTransactions,
        bodyMaps: data.bodyMaps,
        usageNorms: data.usageNorms,

        login: auth.login,
        logout: auth.logout,
        fetchData,
        isInitialized: auth.isInitialized,
        fetchPublicData: async () => {},

        addCustomer: async (c: any) => {
            const customer = data.addCustomer(c);
            await syncDb('customers', 'insert', customer, customer.id, activeBizId);
            return customer;
        },
        updateCustomer: async (id: string, updates: any) => {
            data.updateCustomer(id, updates);
            await syncDb('customers', 'update', updates, id, activeBizId);
            await store.addLog('Müşteri Güncellendi', id, '', 'Güncelleme');
        },
        deleteCustomer: async (id: string) => {
            const customer = data.customers.find(c => c.id === id);
            const ok = await data.deleteCustomer(id);
            if (ok) {
                await syncDb('customers', 'delete', {}, id, activeBizId);
                if (customer) await store.addLog('Müşteri Silindi', customer.name);
            }
            return ok;
        },
        addAppointment: async (a: any) => {
            const id = crypto.randomUUID();
            const appt = { ...a, id };
            data.setAllAppointments((prev: any) => [appt, ...prev]);
            await syncDb('appointments', 'insert', appt, id, activeBizId);
            await store.addLog('Randevu Oluşturuldu', a.customerName, '', a.service);
            return true;
        },
        updateAppointment: async (id: string, updates: any) => {
            data.updateAppointment(id, updates);
            await syncDb('appointments', 'update', updates, id, activeBizId);
            return true;
        },
        deleteAppointment: async (id: string) => {
            const apt = data.appointments.find(a => a.id === id);
            const ok = await data.deleteAppointment(id);
            if (ok) {
                await syncDb('appointments', 'delete', {}, id, activeBizId);
                if (apt) await store.addLog('Randevu Silindi', apt.customerName);
            }
            return ok;
        },
        moveAppointment: async (id: string, newTime: string, newStaffId?: string, newRoomId?: string) => {
            const ok = await data.moveAppointment(id, newTime, newStaffId, newRoomId);
            if (ok) {
                await syncDb('appointments', 'update', { time: newTime, staff_id: newStaffId, room_id: newRoomId }, id, activeBizId);
                await store.addLog('Randevu Taşındı', id, '', newTime);
            }
            return ok;
        },
        updateAppointmentStatus: async (id: string, status: any) => {
            const ok = await data.updateAppointmentStatus(id, status);
            if (ok) await syncDb('appointments', 'update', { status }, id, activeBizId);
            return ok;
        },
        
        addBlock: async (b: any) => {
            const id = crypto.randomUUID();
            const block = { ...b, id };
            data.setAllBlocks((prev: CalendarBlock[]) => [block, ...prev]);
            await syncDb('calendar_blocks', 'insert', block, id, activeBizId);
            await store.addLog('Takvim Engeli Eklendi', 'Mekan', '', b.reason || 'Blok');
        },
        updateBlock: async (id: string, updates: any) => {
            data.updateBlock(id, updates);
            await syncDb('calendar_blocks', 'update', updates, id, activeBizId);
            return true;
        },
        removeBlock: async (id: string) => {
            data.removeBlock(id);
            await syncDb('calendar_blocks', 'delete', {}, id, activeBizId);
        },
        
        addPackage: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id, usedSessions: 0, createdAt: new Date().toISOString() };
            data.setAllPackages((prev: Package[]) => [np, ...prev]);
            await syncDb('packages', 'insert', np, id, activeBizId);
            await store.addLog('Paket Eklendi', p.customerId, '', p.name);
        },
        addMembershipPlan: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            data.setMembershipPlans((prev: MembershipPlan[]) => [np, ...prev]);
            await syncDb('membership_plans', 'insert', np, id, activeBizId);
            await store.addLog('Üyelik Planı Oluşturuldu', 'Sistem', '', p.name);
        },
        assignMembership: async (cid: string, pid: string) => {
            const plan = data.membershipPlans.find(p => p.id === pid);
            if (!plan) return;
            const id = crypto.randomUUID();
            const m = { 
                id, customerId: cid, planId: pid, 
                startDate: new Date().toISOString().split('T')[0], 
                expiryDate: new Date(Date.now() + (plan.periodDays || 30) * 86400000).toISOString().split('T')[0], 
                remainingSessions: plan.sessionsPerMonth, 
                status: 'active' as const 
            };
            data.setCustomerMemberships((prev: any) => [...prev, m]);
            await syncDb('customer_memberships', 'insert', m, id, activeBizId);
        },
        
        addRoom: () => {}, 
        updateRoom: () => {},
        deleteRoom: () => {},
        
        analyzeSystem: async () => {},
        processCheckout: async (paymentData: any, installments?: any[], soldProducts?: any[], earnedPoints?: number, tipAmount?: number, pointsUsed?: number) => {
            if (!activeBizId) return false;
            setSyncStatus('syncing');
            try {
                const paymentId = crypto.randomUUID();
                const paymentRecord = {
                    ...paymentData,
                    id: paymentId,
                    tipAmount: tipAmount || 0,
                    soldProducts: soldProducts || [],
                    createdAt: new Date().toISOString()
                };
                
                // 1. Ödeme Kaydı
                data.setAllPayments((prev: any[]) => [paymentRecord, ...prev]);
                await syncDb('payments', 'insert', paymentRecord, paymentId, activeBizId);

                // 2. Randevu Güncelleme
                if (paymentData.appointmentId) {
                    const updates = { status: 'completed', isPaid: true, paymentId };
                    data.updateAppointment(paymentData.appointmentId, updates);
                    await syncDb('appointments', 'update', updates, paymentData.appointmentId, activeBizId);
                }

                // 3. Puan Güncelleme
                if (paymentData.customerId && (earnedPoints || pointsUsed)) {
                    const customer = data.customers.find(c => c.id === paymentData.customerId);
                    if (customer) {
                        const newPoints = (customer.loyaltyPoints || 0) + (earnedPoints || 0) - (pointsUsed || 0);
                        data.updateCustomer(paymentData.customerId, { loyaltyPoints: newPoints });
                        await syncDb('customers', 'update', { loyalty_points: newPoints }, paymentData.customerId, activeBizId);
                    }
                }

                // 4. Stok Güncelleme
                if (soldProducts && soldProducts.length > 0) {
                    for (const item of soldProducts) {
                        if (item.isGift) continue;
                        const product = data.inventory.find(p => p.id === item.productId);
                        if (product) {
                            const newStock = Math.max(0, (product.stock || 0) - item.quantity);
                            data.updateProduct(item.productId, { stock: newStock });
                            await syncDb('inventory', 'update', { stock: newStock }, item.productId, activeBizId);
                        }
                    }
                }

                // 5. Taksitler / Borçlar
                if (installments && installments.length > 0) {
                    for (const inst of installments) {
                        const debtId = crypto.randomUUID();
                        const debtRecord = {
                            id: debtId,
                            customerId: paymentData.customerId,
                            appointmentId: paymentData.appointmentId,
                            amount: inst.amount,
                            dueDate: inst.dueDate,
                            status: 'açık',
                            customerName: paymentData.customerName,
                            description: `${paymentData.service} Taksit`,
                            createdAt: new Date().toISOString()
                        };
                        data.setAllDebts((prev: any[]) => [debtRecord, ...prev]);
                        await syncDb('debts', 'insert', debtRecord, debtId, activeBizId);
                    }
                }

                // 6. Log
                const logId = crypto.randomUUID();
                const log = {
                    id: logId,
                    customerName: paymentData.customerName,
                    action: 'Tahsilat Tamamlandı',
                    newValue: `Tutar: ${paymentData.totalAmount} TL`,
                    user: auth.currentUser?.name || 'Sistem'
                };
                data.setAllLogs((prev: any[]) => [log, ...prev]);
                await syncDb('audit_logs', 'insert', log, logId, activeBizId);

                setSyncStatus('idle');
                return true;
            } catch (err) {
                console.error("Checkout Error:", err);
                setSyncStatus('error');
                return false;
            }
        },
        sendNotification: async (cid: string, type: any, content: string) => {
            const id = crypto.randomUUID();
            const n = { id, customerId: cid, type, content, status: 'SENT', sentAt: new Date().toISOString() };
            data.setAllNotifs((prev: NotificationLog[]) => [n, ...prev]);
            await syncDb('notification_logs', 'insert', n, id, activeBizId);
        },
        addLog: async (action: string, customer: string, oldV?: string, newV?: string) => {
            const id = crypto.randomUUID();
            const log = { id, customerName: customer, action, oldValue: oldV, newValue: newV, user: auth.currentUser?.name || 'Sistem', date: new Date().toISOString() };
            data.setAllLogs((prev: any[]) => [log, ...prev]);
            await syncDb('audit_logs', 'insert', log, id, activeBizId);
        },
        addProduct: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            data.setAllInventory((prev: Product[]) => [np, ...prev]);
            await syncDb('inventory', 'insert', np, id, activeBizId);
            await store.addLog('Envanter Eklendi', 'Depo', '', p.name);
        },
        updateProduct: async (id: string, p: any) => {
            data.updateProduct(id, p);
            await syncDb('inventory', 'update', p, id, activeBizId);
        },
        addExpense: async (e: any) => {
            const id = crypto.randomUUID();
            const ne = { ...e, id, user: auth.currentUser?.name };
            data.setAllExpenses((prev: Expense[]) => [ne, ...prev]);
            await syncDb('expenses', 'insert', ne, id, activeBizId);
            await store.addLog('Gider Eklendi', 'Muhasebe', '', e.desc);
        },
        addService: async (s: any) => {
            const id = crypto.randomUUID();
            const ns = { ...s, id };
            data.setAllServices((prev: any) => [ns, ...prev]);
            await syncDb('services', 'insert', ns, id, activeBizId);
        },
        updateService: async (id: string, s: any) => {
            data.updateService(id, s);
            await syncDb('services', 'update', s, id, activeBizId);
        },
        removeService: async (id: string) => {
            data.removeService(id);
            await syncDb('services', 'delete', {}, id, activeBizId);
        },
        addPackageDefinition: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            data.setAllPackageDefinitions((prev: any) => [np, ...prev]);
            await syncDb('package_definitions', 'insert', np, id, activeBizId);
        },
        updatePackageDefinition: async (id: string, p: any) => {
            data.updatePackageDefinition(id, p);
            await syncDb('package_definitions', 'update', p, id, activeBizId);
        },
        removePackageDefinition: async (id: string) => {
            data.removePackageDefinition(id);
            await syncDb('package_definitions', 'delete', {}, id, activeBizId);
        },
        addQuote: async (q: any) => {
            const id = crypto.randomUUID();
            const nq = { ...q, id };
            data.setAllQuotes((prev: any) => [nq, ...prev]);
            await syncDb('quotes', 'insert', nq, id, activeBizId);
        },
        updateQuote: async (id: string, updates: any) => {
            data.updateQuote(id, updates);
            await syncDb('quotes', 'update', updates, id, activeBizId);
        },
        deleteQuote: async (id: string) => {
            data.deleteQuote(id);
            await syncDb('quotes', 'delete', {}, id, activeBizId);
        },
        addCustomerMedia: data.addCustomerMedia,
        deleteCustomerMedia: data.deleteCustomerMedia,
        
        payDebt: async (id: string, amount: number, methods: any) => {
            const debt = data.debts.find(d => d.id === id);
            if (!debt) return false;
            const newStatus = debt.amount - amount <= 0 ? 'kapandı' : 'açık';
            data.setAllDebts((prev: any[]) => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
            await syncDb('debts', 'update', { status: newStatus }, id, activeBizId);

            const paymentId = crypto.randomUUID();
            const pay = { 
                id: paymentId, 
                customerId: debt.customerId, 
                customerName: 'Borç Ödemesi', 
                service: 'Borç Tahsilatı', 
                methods, 
                totalAmount: amount, 
                date: new Date().toISOString().split('T')[0], 
                note: 'Borç ödemesi' 
            };
            data.setAllPayments((prev: any[]) => [pay, ...prev]);
            await syncDb('payments', 'insert', pay, paymentId, activeBizId);
            return true;
        },
        addCommissionRule: async (rule: any) => {
            const id = crypto.randomUUID();
            const nr = { ...rule, id };
            data.setAllCommissionRules((prev: any) => [nr, ...prev]);
            await syncDb('commission_rules', 'insert', nr, id, activeBizId);
        },
        removeCommissionRule: async (id: string) => {
            data.setAllCommissionRules((prev: CommissionRule[]) => prev.filter((r: CommissionRule) => r.id !== id));
            await syncDb('commission_rules', 'delete', {}, id, activeBizId);
        },
        updateRoomStatus: async (id: string, status: Room['status']) => {
            data.setAllRooms((prev: Room[]) => prev.map((r: Room) => r.id === id ? { ...r, status } : r));
            await syncDb('rooms', 'update', { status }, id, activeBizId);
        },
        addStaff: async (s: any) => {
            const id = crypto.randomUUID();
            const ns = { ...s, id, isVisibleOnCalendar: true, sortOrder: 0 };
            data.setAllStaff((prev: Staff[]) => [...prev, ns]);
            await syncDb('staff', 'insert', ns, id, activeBizId);
        },
        deleteStaff: async (id: string) => {
            data.setAllStaff((prev: Staff[]) => prev.filter((s: Staff) => s.id !== id));
            await syncDb('staff', 'delete', {}, id, activeBizId);
        },
        updateStaff: async (id: string, s: any) => {
            data.setAllStaff((prev: Staff[]) => prev.map((st: Staff) => st.id === id ? { ...st, ...s } : st));
            await syncDb('staff', 'update', s, id, activeBizId);
        },
        updateStaffPermissions: async (userId: string, perms: string[]) => {
            // Logically updates users/auth if needed, but for now we sync role/permissions if in DB
            await syncDb('users', 'update', { permissions: perms }, userId, activeBizId);
        },
        
        addPaymentDefinition: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            biz.setPaymentDefinitions((prev: PaymentDefinition[]) => [...prev, np]);
            await syncDb('payment_definitions', 'insert', np, id, activeBizId);
        },
        updatePaymentDefinition: async (id: string, p: Partial<PaymentDefinition>) => {
            biz.setPaymentDefinitions((prev: PaymentDefinition[]) => prev.map((x: PaymentDefinition) => x.id === id ? { ...x, ...p } : x));
            await syncDb('payment_definitions', 'update', p, id, activeBizId);
        },
        removePaymentDefinition: async (id: string) => {
            biz.setPaymentDefinitions((prev: PaymentDefinition[]) => prev.filter((x: PaymentDefinition) => x.id !== id));
            await syncDb('payment_definitions', 'delete', {}, id, activeBizId);
        },
        addBankAccount: async (b: any) => {
            const id = crypto.randomUUID();
            const nb = { ...b, id };
            biz.setBankAccounts((prev: BankAccount[]) => [...prev, nb]);
            await syncDb('bank_accounts', 'insert', nb, id, activeBizId);
        },
        updateBankAccount: async (id: string, b: Partial<BankAccount>) => {
            biz.setBankAccounts((prev: BankAccount[]) => prev.map((x: BankAccount) => x.id === id ? { ...x, ...b } : x));
            await syncDb('bank_accounts', 'update', b, id, activeBizId);
        },
        removeBankAccount: async (id: string) => {
            biz.setBankAccounts((prev: BankAccount[]) => prev.filter((x: BankAccount) => x.id !== id));
            await syncDb('bank_accounts', 'delete', {}, id, activeBizId);
        },
        addExpenseCategory: async (c: any) => {
            const id = crypto.randomUUID();
            const nc = { ...c, id };
            biz.setExpenseCategories((prev: ExpenseCategory[]) => [...prev, nc]);
            await syncDb('expense_categories', 'insert', nc, id, activeBizId);
        },
        updateExpenseCategory: async (id: string, c: Partial<ExpenseCategory>) => {
            biz.setExpenseCategories((prev: ExpenseCategory[]) => prev.map((x: ExpenseCategory) => x.id === id ? { ...x, ...c } : x));
            await syncDb('expense_categories', 'update', c, id, activeBizId);
        },
        removeExpenseCategory: async (id: string) => {
            biz.setExpenseCategories((prev: ExpenseCategory[]) => prev.filter((x: ExpenseCategory) => x.id !== id));
            await syncDb('expense_categories', 'delete', {}, id, activeBizId);
        },
        addReferralSource: async (s: any) => {
            const id = crypto.randomUUID();
            const ns = { ...s, id };
            biz.setReferralSources((prev: ReferralSource[]) => [...prev, ns]);
            await syncDb('referral_sources', 'insert', ns, id, activeBizId);
        },
        updateReferralSource: async (id: string, s: Partial<ReferralSource>) => {
            biz.setReferralSources((prev: ReferralSource[]) => prev.map((x: ReferralSource) => x.id === id ? { ...x, ...s } : x));
            await syncDb('referral_sources', 'update', s, id, activeBizId);
        },
        removeReferralSource: async (id: string) => {
            biz.setReferralSources((prev: ReferralSource[]) => prev.filter((x: ReferralSource) => x.id !== id));
            await syncDb('referral_sources', 'delete', {}, id, activeBizId);
        },
        addConsentFormTemplate: async (t: any) => {
            const id = crypto.randomUUID();
            const nt = { ...t, id };
            biz.setConsentFormTemplates((prev: ConsentFormTemplate[]) => [...prev, nt]);
            await syncDb('consent_form_templates', 'insert', nt, id, activeBizId);
        },
        updateConsentFormTemplate: async (id: string, t: Partial<ConsentFormTemplate>) => {
            biz.setConsentFormTemplates((prev: ConsentFormTemplate[]) => prev.map((x: ConsentFormTemplate) => x.id === id ? { ...x, ...t } : x));
            await syncDb('consent_form_templates', 'update', t, id, activeBizId);
        },
        removeConsentFormTemplate: async (id: string) => {
            biz.setConsentFormTemplates((prev: ConsentFormTemplate[]) => prev.filter((x: ConsentFormTemplate) => x.id !== id));
            await syncDb('consent_form_templates', 'delete', {}, id, activeBizId);
        },
        
        addMarketingRule: async (rule: any) => {
            const id = crypto.randomUUID();
            const nr = { ...rule, id };
            data.setMarketingRules((prev: any) => [...prev, nr]);
            await syncDb('marketing_rules', 'insert', nr, id, activeBizId);
        },
        updateMarketingRule: async (id: string, updates: any) => {
            data.setMarketingRules((prev: MarketingRule[]) => prev.map((r: MarketingRule) => r.id === id ? { ...r, ...updates } : r));
            await syncDb('marketing_rules', 'update', updates, id, activeBizId);
        },
        deleteMarketingRule: async (id: string) => {
            data.setMarketingRules((prev: MarketingRule[]) => prev.filter((r: MarketingRule) => r.id !== id));
            await syncDb('marketing_rules', 'delete', {}, id, activeBizId);
        },
        addPricingRule: async (rule: any) => {
            const id = crypto.randomUUID();
            const nr = { ...rule, id };
            data.setPricingRules((prev: DynamicPricingRule[]) => [...prev, nr]);
            await syncDb('dynamic_pricing_rules', 'insert', nr, id, activeBizId);
        },
        updatePricingRule: async (id: string, updates: any) => {
            data.setPricingRules((prev: DynamicPricingRule[]) => prev.map((r: DynamicPricingRule) => r.id === id ? { ...r, ...updates } : r));
            await syncDb('dynamic_pricing_rules', 'update', updates, id, activeBizId);
        },
        deletePricingRule: async (id: string) => {
            data.setPricingRules((prev: DynamicPricingRule[]) => prev.filter((r: DynamicPricingRule) => r.id !== id));
            await syncDb('dynamic_pricing_rules', 'delete', {}, id, activeBizId);
        },
        
        getWallet: (customerId: string) => data.wallets.find(w => w.customerId === customerId),
        loadWallet: async (customerId: string, amount: number, desc?: string) => {
            if (!activeBizId) return;
            const wallet = data.wallets.find(w => w.customerId === customerId);
            if (!wallet) {
                const id = crypto.randomUUID();
                const nw = { id, customerId, balance: amount, businessId: activeBizId };
                data.setWallets((prev: any[]) => [...prev, nw]);
                await syncDb('customer_wallets', 'insert', nw, id, activeBizId);
            } else {
                const newBalance = (wallet.balance || 0) + amount;
                data.setWallets((prev: any[]) => prev.map(w => w.customerId === customerId ? { ...w, balance: newBalance } : w));
                await syncDb('customer_wallets', 'update', { balance: newBalance }, wallet.id, activeBizId);
            }
        },
        spendFromWallet: async (customerId: string, amount: number, desc?: string) => {
            const wallet = data.wallets.find(w => w.customerId === customerId);
            if (!wallet || (wallet.balance || 0) < amount) return false;
            const newBalance = wallet.balance - amount;
            data.setWallets((prev: any[]) => prev.map(w => w.customerId === customerId ? { ...w, balance: newBalance } : w));
            await syncDb('customer_wallets', 'update', { balance: newBalance }, wallet.id, activeBizId);
            return true;
        },
        
        addBodyMap: data.addBodyMap,
        updateBodyMap: data.updateBodyMap,
        addUsageNorm: data.addUsageNorm,
        updateUsageNorm: data.updateUsageNorm,
        
        calculateDynamicPrice: () => ({ price: 0, reason: null }),
        closeDay: async () => true,
        updateSettings: biz.setSettings,
        updateBusinessSettings: biz.setSettings,
        updateBusiness: async () => true,
        transferProduct: async () => true,
        updateBusinessLicense: () => {},
        updateBusinessBranches: async () => {},
        runImperialAudit: () => [],
        isLicenseExpired: false,
        provisionStaffUser: async () => ({ success: true }),
        addAnnouncement: async () => {},
        updateModuleStatus: async () => {},
        updateBusinessPricing: async () => {},
        updateRates: () => {},
        assignRoomToAppointment: async () => true,
        getBirthdaysToday: () => [],
        getChurnRiskCustomers: () => [],
        getTodayPayments: () => {
            const today = new Date().toISOString().split('T')[0];
            return data.payments.filter((p: Payment) => p.date === today);
        },
        getUpsellPotentialCustomers: () => [],
        getUpsellSuggestions: (serviceName: string) => {
            return data.inventory.filter((i: Product) => (i.stock || 0) > 0).slice(0, 3);
        },
        predictInventory: () => [],
        can: (permission: string) => true,
        calculateCommission: (staffId: string, serviceName: string, price: number) => {
            // Default %10 komisyon mantığı
            return price * 0.1;
        },
        determineChurnRisk: (customer: Customer) => false,
        getEffectivePrice: (serviceId: string) => {
            const s = data.services.find((sv: Service) => sv.id === serviceId);
            return s ? s.price : 0;
        },
        getRecommendedStaff: (serviceId: string) => {
            return data.staffMembers.slice(0, 3);
        },
        getCustomerPackages: (cid: string) => data.packages.filter((p: Package) => p.customerId === cid),
        getCustomerAppointments: (cid: string) => data.appointments.filter((a: Appointment) => a.customerId === cid),
        getCustomerAppointmentsByBranch: (cid: string, bid: string) => data.appointments.filter((a: Appointment) => a.customerId === cid && a.branchId === bid),
        getCustomerPayments: (cid: string) => data.payments.filter((p: Payment) => p.customerId === cid),
        getTodayDate: () => new Date().toISOString().split('T')[0],
        addBranch: async () => {},
        updateBranch: () => {},
        deleteBranch: () => {}
    };

    return (
        <StoreContext.Provider value={store}>
            {children}
        </StoreContext.Provider>
    );
};

// The PUBLIC StoreProvider that wraps children with everything needed
export const StoreProvider = ({ children }: { children: ReactNode }) => {
    return (
        <AuthProvider>
            <BusinessProvider>
                <DataProvider>
                    <StoreOrchestrator>
                        {children}
                    </StoreOrchestrator>
                </DataProvider>
            </BusinessProvider>
        </AuthProvider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (!context) throw new Error('useStore must be used within a StoreProvider');
    return context;
};
