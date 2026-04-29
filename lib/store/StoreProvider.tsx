"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo } from 'react';
import { useParams, usePathname } from 'next/navigation';
import { AuthProvider, useAuth } from './AuthContext';
import { BusinessProvider, useBusiness } from './BusinessContext';
import { DataProvider, useData } from './DataContext';
import { 
    StoreState, AppUser, Staff, Appointment, Payment, Customer, 
    Product, Service, Package, MembershipPlan, CustomerMembership, Business,
    PaymentDefinition, BankAccount, ExpenseCategory, ReferralSource, 
    ConsentFormTemplate, AuditLog, NotificationLog, CommissionRule,
    PackageDefinition, Quote, MarketingRule, DynamicPricingRule, Room, Expense, CalendarBlock, AppointmentStatus, BookingSettings,
    LoyaltySettings, Webhook, InventoryCategory, CurrencyRate, PackageUsageHistory
} from './types';
import { fetchData as fetchDataLogic } from './fetch-logic';
import { syncDb } from './sync-db';
import { supabase } from '@/lib/supabase';
import { triggerWebhooks } from '@/lib/utils/webhook-sender';
import { checkQuota, checkSystemLock } from '@/lib/utils/feature-gate';
import EmpireLockScreen from '@/components/layout/EmpireLockScreen';
import QuotaUpgradeModal from '@/components/modals/QuotaUpgradeModal';
import { useAppointmentMethods } from './hooks/useAppointmentMethods';
import { usePaymentMethods } from './hooks/usePaymentMethods';
import { useCustomerMethods } from './hooks/useCustomerMethods';
import { useInventoryMethods } from './hooks/useInventoryMethods';
import { useStaffMethods } from './hooks/useStaffMethods';
import { useFinanceMethods } from './hooks/useFinanceMethods';
import { usePackageMethods } from './hooks/usePackageMethods';
import { useSupportMethods } from './hooks/useSupportMethods';

const StoreMethodsContext = createContext<any>(undefined);
const StoreDataContext = createContext<any>(undefined);

// Unified hook for backward compatibility
export const useStore = () => {
    const methods = useContext(StoreMethodsContext);
    const data = useContext(StoreDataContext);
    if (!methods || !data) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return { ...data, ...methods };
};

// Main Orchestrator component that holds the global store logic
// This must be wrapped by individual context providers
const StoreOrchestrator = ({ children }: { children: ReactNode }) => {
    const auth = useAuth();
    const biz = useBusiness();
    const data = useData();

    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
    const [isManagerAuthorized, setManagerAuthorized] = useState(false);
    
    // Empire Command Center States
    const [pendingVetoes, setPendingVetoes] = useState<{type: 'payment' | 'appointment', data: any}[]>([]);
    const [panopticonFeed, setPanopticonFeed] = useState<any[]>([]);
    const fetchControllerRef = React.useRef<AbortController | null>(null);
    const params = useParams();
    const pathname = usePathname();
    const slug = params?.slug as string;
    
    // --- IDENTITY ANCHOR ---
    const lastResolvedBizIdRef = React.useRef<string | undefined>(undefined);
    
    // --- DATA REFS (Stable bridge for methods) ---
    const dataRef = React.useRef(data);
    const bizRef = React.useRef(biz);
    const authRef = React.useRef(auth);

    useEffect(() => { dataRef.current = data; }, [data]);
    useEffect(() => { bizRef.current = biz; }, [biz]);
    useEffect(() => { authRef.current = auth; }, [auth]);

    const activeBizIdRef = React.useRef<string | undefined>(undefined);
    const lastFetchTimeRef = React.useRef<number>(0);
    const lastFetchBizIdRef = React.useRef<string | undefined>(undefined);
    const realtimeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);
    
    const [recentlyModified, setRecentlyModified] = useState<Set<string>>(new Set());
    const recentlyModifiedRef = React.useRef<Set<string>>(new Set());
    const [quotaError, setQuotaError] = useState<{resource: 'Şube' | 'Personel', limit: number} | null>(null);

    const markAsModified = React.useCallback((id: string) => {
        setRecentlyModified(prev => {
            const next = new Set(prev);
            next.add(id);
            recentlyModifiedRef.current = next;
            return next;
        });
        setTimeout(() => {
            setRecentlyModified(prev => {
                const next = new Set(prev);
                next.delete(id);
                recentlyModifiedRef.current = next;
                return next;
            });
        }, 5000);
    }, []);

    const unmarkAsModified = React.useCallback((id: string) => {
        setRecentlyModified(prev => {
            const next = new Set(prev);
            next.delete(id);
            recentlyModifiedRef.current = next;
            return next;
        });
    }, []);

    const activeBizId = useMemo(() => {
        let id: string | undefined = undefined;
        const isSaaS = auth.currentUser?.role === 'SaaS_Owner';

        if (auth.impersonatedBusinessId) {
            id = auth.impersonatedBusinessId;
        } else if (slug) {
            // Priority 1: Match from existing businesses (hydrated or fetched)
            const bizFromSlug = biz.allBusinesses.find(b => b.slug === slug);
            if (bizFromSlug) {
                id = bizFromSlug.id;
            } else if (lastResolvedBizIdRef.current && !isSaaS) {
                // STICKY FALLBACK: If we have a slug but list is empty, don't clear the ID
                id = lastResolvedBizIdRef.current;
            }
        } else if (auth.currentUser?.businessId && !isSaaS) {
            id = auth.currentUser.businessId;
        }

        // STICKY IDENTITY CACHE (Hydration Guard)
        // If we are on a slug but data is still loading, do not revert to NULL
        if (!id && slug && lastResolvedBizIdRef.current) {
             id = lastResolvedBizIdRef.current;
        }

        if (id) lastResolvedBizIdRef.current = id;
        return id;
    }, [auth.impersonatedBusinessId, auth.currentUser?.businessId, auth.currentUser?.role, slug, biz.allBusinesses]);

    // Update ref in effect for consistency
    useEffect(() => {
        activeBizIdRef.current = activeBizId;
        if (activeBizId && typeof window !== 'undefined') {
            localStorage.setItem('aura_last_resolved_biz_id', activeBizId);
        }
    }, [activeBizId]);

    const fetchData = React.useCallback(async (bizId?: string, user?: AppUser, force?: boolean, startDate?: string, endDate?: string) => {
        // Throttling Logic
        const now = Date.now();
        const targetBizId = bizId || activeBizIdRef.current;
        const targetUser = user || authRef.current.currentUser;
        
        const isIdChanged = targetBizId !== lastFetchBizIdRef.current;

        const isInitialLoadMatching = isIdChanged && !lastFetchBizIdRef.current;
        if (!force && !isIdChanged && now - lastFetchTimeRef.current < 2000 && !isInitialLoadMatching) {
            return;
        }

        // İptal mekanizması: Önceki istek varsa durdur
        if (fetchControllerRef.current) {
            fetchControllerRef.current.abort();
        }
        const controller = new AbortController();
        fetchControllerRef.current = controller;

        if (!targetUser) return;
        const isSaaS = targetUser.role === 'SaaS_Owner';
        if (!targetBizId && !isSaaS) return;

        // Validation passed, now we can set the throttle timestamp and last ID
        lastFetchTimeRef.current = now;
        lastFetchBizIdRef.current = targetBizId;

        // Note: data ve biz objelerinden gelen setter fonksiyonları React tarafından stable tutulur, 
        // ancak objenin kendisi her re-render'da değişebileceği için fetchData'yı bozmamak adına 
        // doğrudan bağımlılık yerine fonksiyon içinde kullanıyoruz.
        const setters = {
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
            setCurrentBranch: biz.setCurrentBranch,
            setCurrentTenant: biz.setCurrentTenant,
            setSettings: biz.setSettings,
            setBookingSettings: biz.setBookingSettings,
            setPaymentDefinitions: biz.setPaymentDefinitions,
            setBankAccounts: biz.setBankAccounts,
            setExpenseCategories: biz.setExpenseCategories,
            setReferralSources: biz.setReferralSources,
            setConsentFormTemplates: biz.setConsentFormTemplates,
            setSyncStatus: setSyncStatus,
            setAllPayments: data.setAllPayments,
            setAllInventoryCategories: data.setAllInventoryCategories,
            setLoyaltySettings: biz.setLoyaltySettings,
            setPackageUsageHistory: data.setPackageUsageHistory,
            setWebhooks: biz.setWebhooks,
            setSystemAnnouncements: data.setSystemAnnouncements,
            setAllUsers: auth.setAllUsers,
            setAllCommissionRules: data.setAllCommissionRules,
            setInventoryTransfers: data.setInventoryTransfers,
            setCustomerBiometrics: data.setCustomerBiometrics,
            setCoupons: data.setCoupons
        };

        try {
            setSyncStatus('syncing');
            await fetchDataLogic(
                targetBizId,
                targetUser,
                setters,
                force,
                startDate,
                endDate,
                controller.signal,
                slug // Targeted resolution
            );
        } catch (err: any) {
            if (err.name === 'AbortError' || err.message === 'Aborted') {
                console.log("Fetch aborted for new request. Status check...");
            } else {
                console.error("Fetch Error:", err);
                setSyncStatus('error');
            }
        } finally {
            if (fetchControllerRef.current === controller) {
                setSyncStatus(prev => prev === 'syncing' ? 'idle' : prev);
            }
        }
    }, []); // Bağımlılık dizisi boşaltıldı: Ref'ler kullanılıyor.

    useEffect(() => {
        const handleOnline = () => setIsOnline(true);
        const handleOffline = () => setIsOnline(false);
        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const normalizePath = (p: string) => p?.replace(/\/+$/, '') || '/';
        const normalizedPath = normalizePath(pathname);
        const isLoginPath = normalizedPath.startsWith('/login');

        // Otomatik veri çekme başlatıcı
        // Sadece auth süreci tamamlandığında ve ortam (slug/kullanıcı) hazır olduğunda çek
        if (auth.isInitialized) {
            if (isLoginPath) {
                console.log("🛡️ [Aura Trace] Login path detected. Releasing store locks.");
                setSyncStatus('idle');
                return;
            }

            const hasTarget = auth.currentUser || slug;
            const isSaaS = auth.currentUser?.role === 'SaaS_Owner';
            
            // SLUG STABILIZATION: In tenant layout, wait for params to hydrate.
            if (!slug && typeof window !== 'undefined' && window.location.pathname.split('/').length >= 3) {
                 console.log("⏳ [Aura Trace] Holding fetch: Slug expected but not yet hydrated.");
                 return;
            }

            // HYPER-SCALE OPTIMIZATION
            const hasBusinesses = biz.allBusinesses.length > 0;
            const isNeedBusinesses = isSaaS && slug && !hasBusinesses;

            if (isNeedBusinesses) {
                console.log("🚧 [Aura Trace] Businesses missing. Loading catalog first...");
                fetchData(); 
                return;
            }

            if (hasTarget) {
                // If we are SaaS and on a slug, ensure we don't fire UNTIL we have an ID
                if (isSaaS && slug && !activeBizId && hasBusinesses) {
                    console.log("⏳ [Aura Trace] Resolved ID is still pending despite having businesses...");
                    return;
                }

                console.log("🔍 [Aura Trace] Triggering fetch:", { 
                    initialized: auth.isInitialized, 
                    user: auth.currentUser?.email, 
                    activeBizId, 
                    slug,
                    cacheHit: hasBusinesses
                });
                fetchData(activeBizId);
            } else {
                console.log("⏳ [Aura Trace] No user/slug context. Releasing UI lock.");
                setSyncStatus('idle');
            }
        } else {
            // SHIELD: Systems not initialized or logging out
            setSyncStatus('idle');
        }

        // Debounced Realtime Trigger
        const triggerFetch = () => {
            if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
            realtimeTimeoutRef.current = setTimeout(async () => {
                await fetchData(undefined, undefined, true); // Force fetch on realtime
            }, 1000); // 1s Stability Delay
        };

        // Realtime Subscriptions

        // Realtime Subscriptions
        let channel: any;
        if (activeBizId) {
            channel = supabase.channel(`realtime-biz-${activeBizId}`)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments', filter: `business_id=eq.${activeBizId}` }, triggerFetch)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'staff', filter: `business_id=eq.${activeBizId}` }, triggerFetch)
                .on('postgres_changes', { event: '*', schema: 'public', table: 'payments', filter: `business_id=eq.${activeBizId}` }, triggerFetch)
                .subscribe();
        }
        
        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            if (channel) supabase.removeChannel(channel);
            if (realtimeTimeoutRef.current) clearTimeout(realtimeTimeoutRef.current);
        };
    }, [auth.isInitialized, activeBizId, slug]); // Sadece ID/slug değişiminde veya auth yüklendiğinde tetiklenir.


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


    const isLicenseExpired = React.useMemo(() => {
        if (!biz.currentTenant?.expiryDate) return false;
        const expiry = new Date(biz.currentTenant.expiryDate);
        return expiry < new Date();
    }, [biz.currentTenant]);

    const can = React.useCallback((permission: string) => {
        const user = auth.currentUser;
        if (!user) return false;
        
        // Super admin/owner roles have full access
        const superRoles = ['SaaS_Owner', 'Business_Owner', 'manager', 'Manager'];
        if (superRoles.includes(user.role)) return true;
        
        // Check permissions array for others
        return user.permissions?.includes(permission) || false;
    }, [auth.currentUser]);

    const getCustomerAppointments = React.useCallback((cid: string) => {
        return (data.appointments || []).filter(a => a.customerId === cid);
    }, [data.appointments]);

    const getCustomerPackages = React.useCallback((cid: string) => {
        return (data.packages || []).filter(p => p.customerId === cid);
    }, [data.packages]);

    const getCustomerPayments = React.useCallback((cid: string) => {
        return (data.payments || []).filter(p => p.customerId === cid);
    }, [data.payments]);

    const getChurnRiskCustomers = React.useCallback(() => {
        return (data.customers || []).filter(c => c.isChurnRisk);
    }, [data.customers]);

    const getUpsellPotentialCustomers = React.useCallback(() => {
        // Customers with packages that are > 80% used
        const results: any[] = [];
        data.packages.forEach(pkg => {
            const usage = (pkg.usedSessions || 0) / pkg.totalSessions;
            if (usage > 0.8 && usage < 1.0) {
                const customer = data.customers.find(c => c.id === pkg.customerId);
                if (customer) results.push({ customer, package: pkg });
            }
        });
        return results;
    }, [data.packages, data.customers]);

    const getBirthdaysToday = React.useCallback(() => {
        const today = new Date().toISOString().split('T')[0].substring(5); // MM-DD
        return (data.customers || []).filter((c: Customer) => c.birthdate?.includes(today));
    }, [data.customers]);

    const calculateCommission = React.useCallback((staffId: string, serviceName: string, amount: number) => {
        const rules = (data.commissionRules || []).filter((r: any) => r.staffId === staffId);
        const specificRule = rules.find((r: any) => r.serviceName === serviceName);
        const generalRule = rules.find((r: any) => r.serviceName === 'Tümü');
        const rule = specificRule || generalRule;
        if (!rule) return 0;
        return rule.type === 'percentage' ? (amount * rule.value) / 100 : rule.value;
    }, [data.commissionRules]);

    const determineChurnRisk = React.useCallback((customer: Customer) => {
        return customer.isChurnRisk || false;
    }, []);

    const addLog = React.useCallback(async (type: string, target: string, source: string = 'Sistem', detail?: string) => {
        const id = crypto.randomUUID();
        const now = new Date().toISOString();
        // action field added for backward compatibility with the NOT NULL constraint if it persists
        const log = { 
            id, 
            type, 
            target, 
            source, 
            detail, 
            action: type, 
            businessId: activeBizIdRef.current, 
            date: now,
            createdAt: now 
        };
        data.setAllLogs((prev: any[]) => [log, ...prev]);
        await syncDb('audit_logs', 'insert', log, id, activeBizIdRef.current);
    }, [data.setAllLogs]);

    const getTodayDate = React.useCallback(() => new Date().toISOString().split('T')[0], []);
    
    const getTodayPayments = React.useCallback(() => {
        const today = getTodayDate();
        return data.payments.filter((p: any) => p.date === today);
    }, [data.payments, getTodayDate]);

    const addZReport = async (reportData: any) => {
        const ok = await syncDb('z_reports', 'insert', {
            ...reportData,
            businessId: activeBizIdRef.current,
            branchId: biz.currentBranch?.id,
            closedBy: auth.currentUser?.id,
            closedByName: auth.currentUser?.name
        });
        if (ok) await fetchData();
        return ok;
    };

    const stableMethodsRef = React.useRef<any>(null);

    const hookDeps = { 
        data: data,
        dataRef: dataRef, 
        activeBizIdRef: activeBizIdRef, 
        authRef: authRef, 
        syncDb: syncDb, 
        triggerWebhooks: triggerWebhooks, 
        markAsModified: markAsModified, 
        unmarkAsModified: unmarkAsModified, 
        bizRef: bizRef, 
        setSyncStatus: setSyncStatus, 
        setPendingVetoes: setPendingVetoes,
        setQuotaError: setQuotaError,
        fetchData: fetchData,
        stableMethodsRef // Passing the ref instead of null
    };

    const appMethods = useAppointmentMethods(hookDeps);
    const payMethods = usePaymentMethods(hookDeps);
    const custMethods = useCustomerMethods(hookDeps);
    const invMethods = useInventoryMethods(hookDeps);
    const staffMethods = useStaffMethods(hookDeps);
    const finMethods = useFinanceMethods(hookDeps);
    const pkgMethods = usePackageMethods(hookDeps);
    const supportMethods = useSupportMethods(hookDeps);

    const stableMethods: any = useMemo(() => {
        const methods: any = {
            pendingVetoes,
            panopticonFeed,
            login: authRef.current.login,
            logout: authRef.current.logout,
            fetchData,
            fetchPublicData: async (manualSlug?: string) => {
                await fetchData(undefined, undefined, true, undefined, undefined);
            },
            isInitialized: authRef.current.isInitialized,
            updateBusinessStatus: authRef.current.updateBusinessStatus,
            deleteBusiness: authRef.current.deleteBusiness,
            addBusiness: authRef.current.addBusiness,
            updateAnyBusiness: async (id: string, updates: any) => {
                bizRef.current.setAllBusinesses((prev: any[]) => prev.map((b: any) => b.id === id ? { ...b, ...updates } : b));
                await syncDb('businesses', 'update', updates, id, id);
                await fetchData(undefined, undefined, true); 
                return true;
            },
            provisionBusinessUser: authRef.current.provisionBusinessUser,
            setImpersonatedBusinessId: (id: string | null) => {
                authRef.current.setImpersonatedBusinessId(id);
                if (id) {
                    const bizItem = bizRef.current.allBusinesses.find(b => b.id === id);
                    if (bizItem) {
                        window.location.href = `/${bizItem.slug}/dashboard`;
                    }
                } else {
                    window.location.href = '/admin';
                }
            },
            setManagerAuthorized,
            markAsModified,
            addLog,
            getTodayDate,
            getTodayPayments,
            addZReport,
            calculateCommission,
            determineChurnRisk,

            // Spread modular methods
            ...appMethods,
            ...payMethods,
            ...custMethods,
            ...invMethods,
            ...staffMethods,
            ...finMethods,
            ...pkgMethods,
            ...supportMethods,

            // Remaining UI/Support methods
            addQuote: async (q: any) => {
                const id = crypto.randomUUID();
                const nq = { ...q, id };
                dataRef.current.setAllQuotes((prev: any) => [nq, ...prev]);
                await syncDb('quotes', 'insert', nq, id, activeBizIdRef.current);
            },
            updateQuote: async (id: string, updates: any) => {
                dataRef.current.updateQuote(id, updates);
                await syncDb('quotes', 'update', updates, id, activeBizIdRef.current);
            },
            deleteQuote: async (id: string) => {
                dataRef.current.deleteQuote(id);
                await syncDb('quotes', 'delete', {}, id, activeBizIdRef.current);
            },
            payDebt: async (id: string, amount: number, methods: any) => {
                const debt = dataRef.current.debts.find(d => d.id === id);
                if (!debt) return false;
                const newStatus = debt.amount - amount <= 0 ? 'kapandı' : 'açık';
                dataRef.current.setAllDebts((prev: any[]) => prev.map(d => d.id === id ? { ...d, status: newStatus } : d));
                await syncDb('debts', 'update', { status: newStatus }, id, activeBizIdRef.current);
                const paymentId = crypto.randomUUID();
                const pay = { id: paymentId, customerId: debt.customerId, customerName: 'Borç Ödemesi', service: 'Borç Tahsilatı', methods, totalAmount: amount, date: new Date().toISOString().split('T')[0], note: 'Borç ödemesi' };
                dataRef.current.setAllPayments((prev: any[]) => [pay, ...prev]);
                await syncDb('payments', 'insert', pay, paymentId, activeBizIdRef.current);
                return true;
            },
            addCustomerMedia: async (m: any) => {
                const id = crypto.randomUUID();
                const nm = { ...m, id, businessId: activeBizIdRef.current, createdAt: new Date().toISOString() };
                dataRef.current.setAllCustomerMedia((prev: any) => [nm, ...prev]);
                await syncDb('customer_media', 'insert', nm, id, activeBizIdRef.current);
            },
            deleteCustomerMedia: async (id: string) => {
                dataRef.current.setAllCustomerMedia((prev: any[]) => prev.filter(m => m.id !== id));
                await syncDb('customer_media', 'delete', {}, id, activeBizIdRef.current);
            },
            calculateDynamicPrice: (price: number, timeStr: string) => {
                const [h] = timeStr.split(':').map(Number);
                if (h >= 9 && h < 12) return { price: price * 0.8, reason: 'Happy Hour İndirimi (%20)' };
                return { price, reason: null };
            },
            closeDay: async (reportData: any) => {
                const bizId = activeBizIdRef.current;
                if (!bizId) return false;
                const today = methods.getTodayDate();
                const paymentsToday = methods.getTodayPayments();
                const total = paymentsToday.reduce((sum: number, p: any) => sum + p.totalAmount, 0) || 0;
                const id = crypto.randomUUID();
                const report = { ...reportData, id, businessId: bizId, branchId: bizRef.current.currentBranch?.id, closedBy: authRef.current.currentUser?.name || 'Sistem', createdAt: new Date().toISOString() };
                dataRef.current.setZReports((prev: any[]) => [...prev, report]);
                const success = await syncDb('z_reports', 'insert', report, id, bizId);
                if (success) {
                    methods.downloadZReportPDF(report);
                    methods.addLog('Gün Kapatıldı', 'Sistem', '', `Ciro: ${total}`);
                }
                return !!success;
            },
            updateBusiness: async (updates: Partial<Business>) => {
                const bizId = activeBizIdRef.current;
                if (!bizId) return false;
                bizRef.current.setCurrentTenant((prev: Business | null) => prev ? { ...prev, ...updates } : null);
                return !!(await syncDb('businesses', 'update', updates, bizId, bizId));
            },
            addBranch: async (branch: any) => {
                const bizData = bizRef.current.currentTenant;
                if (bizData) {
                    const { allowed, limit } = checkQuota(bizData, 'branches', bizRef.current.branches.length);
                    if (!allowed) {
                        setQuotaError({ resource: 'Şube', limit });
                        return false;
                    }
                }
                const id = crypto.randomUUID();
                const nb = { ...branch, id, businessId: activeBizIdRef.current, createdAt: new Date().toISOString() };
                bizRef.current.setBranches((prev: any) => [...prev, nb]);
                await syncDb('branches', 'insert', nb, id, activeBizIdRef.current);
                return true;
            },
            updateBranch: async (id: string, branch: any) => {
                bizRef.current.setBranches((prev: any) => prev.map((b: any) => b.id === id ? { ...b, ...branch } : b));
                await syncDb('branches', 'update', branch, id, activeBizIdRef.current);
            },
            deleteBranch: async (id: string) => {
                bizRef.current.setBranches((prev: any) => prev.filter((b: any) => b.id !== id));
                await syncDb('branches', 'delete', null, id, activeBizIdRef.current);
            },
            downloadZReportPDF: (report: any) => {
                const { generateZReportPDF } = require('@/lib/utils/pdf-generator');
                generateZReportPDF(report, bizRef.current.currentTenant);
            },
            transferProduct: async (transfer: any) => {
                const bizId = activeBizIdRef.current;
                if (!bizId) return false;
                const { productId, fromBranchId, toBranchId, quantity, transferType, pricePerUnit } = transfer;
                const inventory = dataRef.current.inventory;
                const fromProduct = inventory.find(p => p.id === productId && p.branchId === fromBranchId);
                const toProduct = inventory.find(p => p.id === productId && p.branchId === toBranchId);
                if (fromProduct) {
                    const newFromStock = Math.max(0, (fromProduct.stock || 0) - quantity);
                    dataRef.current.updateProduct(fromProduct.id, { stock: newFromStock });
                    await syncDb('inventory', 'update', { stock: newFromStock }, fromProduct.id, bizId);
                }
                if (toProduct) {
                    const newToStock = (toProduct.stock || 0) + quantity;
                    dataRef.current.updateProduct(toProduct.id, { stock: newToStock });
                    await syncDb('inventory', 'update', { stock: newToStock }, toProduct.id, bizId);
                }
                const tid = crypto.randomUUID();
                await syncDb('inventory_transfers', 'insert', { ...transfer, id: tid, businessId: bizId, createdAt: new Date().toISOString() }, tid, bizId);
                if (transferType === 'cost' || transferType === 'profit') {
                    const amount = quantity * (pricePerUnit || 0);
                    const expId = crypto.randomUUID();
                    await syncDb('expenses', 'insert', {
                        id: expId, businessId: bizId, branchId: toBranchId,
                        category: 'URUN_TRANSFERI', amount: amount, date: new Date().toISOString().split('T')[0],
                        description: `${fromProduct?.name || 'Ürün'} Transfer Maliyeti`, payout_status: 'ODENDI', createdAt: new Date().toISOString()
                    }, expId, bizId);
                }
                return true;
            },
            predictInventory: () => {
                return dataRef.current.inventory.map(p => {
                    const daysLeft = Math.floor((p.stock || 0) / 0.5);
                    const runoutDate = new Date();
                    runoutDate.setDate(runoutDate.getDate() + daysLeft);
                    return { productId: p.id, productName: p.name, daysLeft, runoutDate: runoutDate.toISOString() };
                });
            },
            getCustomerSummary: (cid: string) => ({
                customer: dataRef.current.customers.find(c => c.id === cid),
                appointments: dataRef.current.appointments.filter(a => a.customerId === cid),
                packages: dataRef.current.packages.filter(p => p.customerId === cid),
                payments: dataRef.current.payments.filter(p => p.customerId === cid)
            }),
            clearCatalog: biz.clearCatalog,
            can,
            getCustomerPackages,
            getCustomerAppointments,
            getCustomerPayments,
            getChurnRiskCustomers,
            getUpsellPotentialCustomers,
            getBirthdaysToday,
            setLocale: data.setLocale,
            addCoupon: async (c: any) => {
                const id = crypto.randomUUID();
                const nc = { ...c, id, businessId: activeBizIdRef.current, createdAt: new Date().toISOString(), isUsed: false };
                dataRef.current.setCoupons((prev: any[]) => [...prev, nc]);
                await syncDb('coupons', 'insert', nc, id, activeBizIdRef.current);
            },
            deleteCoupon: async (id: string) => {
                dataRef.current.setCoupons((prev: any[]) => prev.filter(c => c.id !== id));
                await syncDb('coupons', 'delete', {}, id, activeBizIdRef.current);
            },
            applyCoupon: (code: string) => {
                const coupon = dataRef.current.coupons.find((c: any) => c.code === code && !c.isUsed);
                if (!coupon) return null;
                // Expiry check
                if (coupon.expiryDate && new Date(coupon.expiryDate) < new Date()) return null;
                return coupon;
            }
        };

        stableMethodsRef.current = methods;
        return methods;
    }, [
        fetchData, markAsModified, biz.clearCatalog, can, addLog, addZReport, calculateCommission, determineChurnRisk, getTodayDate, getTodayPayments, 
        getCustomerPackages, getCustomerAppointments, getCustomerPayments, getChurnRiskCustomers, getUpsellPotentialCustomers, getBirthdaysToday,
        appMethods, payMethods, custMethods, invMethods, staffMethods, finMethods, pkgMethods, supportMethods,
        data.setLocale
    ]);



    const shieldedAppointments = useMemo(() => (data.appointments || []).filter(a => !recentlyModified.has(a.id)), [data.appointments, recentlyModified]);
    const shieldedBlocks = useMemo(() => (data.blocks || []).filter(b => !recentlyModified.has(b.id)), [data.blocks, recentlyModified]);
    const shieldedCustomers = useMemo(() => (data.customers || []).filter(c => !recentlyModified.has(c.id)), [data.customers, recentlyModified]);
    const shieldedInventory = useMemo(() => (data.inventory || []).filter(p => !recentlyModified.has(p.id)), [data.inventory, recentlyModified]);

    const systemLock = useMemo(() => {
        if (!biz.currentTenant) return { isLocked: false, reason: null, message: null };
        return checkSystemLock(biz.currentTenant, auth.currentUser);
    }, [biz.currentTenant, auth.currentUser]);

    return (
        <StoreMethodsContext.Provider value={stableMethods}>
            <StoreDataContext.Provider value={{
                currentUser: auth.currentUser,
                currentBusiness: biz.currentTenant,
                currentBranch: biz.currentBranch,
                isOnline: isOnline,
                syncStatus: syncStatus,
                isInitialized: auth.isInitialized,
                isManagerAuthorized: isManagerAuthorized,
                allBusinesses: biz.allBusinesses,
                allUsers: auth.allUsers,
                impersonatedBusinessId: auth.impersonatedBusinessId,
                isImpersonating: auth.isImpersonating,
                currentStaff: auth.currentUser ? data.staffMembers.find(s => s.id === auth.currentUser?.staffId || s.name === auth.currentUser?.name) : undefined,
                customers: shieldedCustomers || [],
                allCustomers: shieldedCustomers || [],
                packages: data.packages || [],
                allPackages: data.packages || [],
                membershipPlans: data.membershipPlans || [],
                customerMemberships: data.customerMemberships || [],
                appointments: shieldedAppointments || [],
                allAppointments: shieldedAppointments || [],
                blocks: shieldedBlocks || [],
                allBlocks: shieldedBlocks || [],
                payments: data.payments || [],
                allPayments: data.payments || [],
                staffMembers: data.staffMembers || [],
                allStaff: data.staffMembers || [],
                debts: data.debts || [],
                allDebts: data.debts || [],
                branches: biz.branches || [],
                allLogs: data.allLogs || [],
                allNotifs: data.allNotifs || [],
                aiInsights: data.aiInsights || [],
                customerMedia: data.customerMedia || [],
                inventory: shieldedInventory || [],
                rooms: data.rooms || [],
                services: data.services || [],
                packageDefinitions: data.packageDefinitions || [],
                commissionRules: data.commissionRules || [],
                rates: biz.allRates || [],
                expenses: data.expenses || [],
                zReports: data.zReports || [],
                inventoryTransfers: data.inventoryTransfers || [],
                settings: biz.settings,
                allowedBranches: biz.branches || [],
                bookingSettings: biz.bookingSettings,
                paymentDefinitions: biz.paymentDefinitions || [],
                bankAccounts: biz.bankAccounts || [],
                expenseCategories: biz.expenseCategories || [],
                referralSources: biz.referralSources || [],
                consentFormTemplates: biz.consentFormTemplates || [],
                quotes: data.quotes || [],
                tenantModules: data.tenantModules || [],
                marketingRules: data.marketingRules || [],
                pricingRules: data.pricingRules || [],
                wallets: data.wallets || [],
                walletTransactions: data.walletTransactions || [],
                bodyMaps: data.bodyMaps || [],
                usageNorms: data.usageNorms || [],
                loyaltySettings: biz.loyaltySettings,
                webhooks: biz.webhooks || [],
                inventoryCategories: data.inventoryCategories || [],
                isLicenseExpired,
                locale: data.locale,
                coupons: data.coupons || [],
            }}>
                {systemLock.isLocked && <EmpireLockScreen reason={systemLock.reason} message={systemLock.message || ""} slug={slug} />}
                <QuotaUpgradeModal 
                    isOpen={!!quotaError} 
                    onClose={() => setQuotaError(null)} 
                    resource={quotaError?.resource || 'Şube'} 
                    limit={quotaError?.limit || 0} 
                    slug={slug} 
                />
                {children}
            </StoreDataContext.Provider>
        </StoreMethodsContext.Provider>
    );
};

export const StoreProvider = ({ children }: { children: ReactNode }) => {
    return (
        <AuthProvider>
            <BusinessProvider>
                <DataProvider>
                    <StoreOrchestrator>{children}</StoreOrchestrator>
                </DataProvider>
            </BusinessProvider>
        </AuthProvider>
    );
};

