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
    LoyaltySettings, Webhook, InventoryCategory, CurrencyRate
} from './types';
import { fetchData as fetchDataLogic } from './fetch-logic';
import { syncDb } from './sync-db';
import { supabase } from '@/lib/supabase';
import { triggerWebhooks } from '@/lib/utils/webhook-sender';

const StoreContext = createContext<StoreState | undefined>(undefined);

// Main Orchestrator component that holds the global store logic
// This must be wrapped by individual context providers
const StoreOrchestrator = ({ children }: { children: ReactNode }) => {
    const auth = useAuth();
    const biz = useBusiness();
    const data = useData();

    const [isOnline, setIsOnline] = useState(true);
    const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
    const [isManagerAuthorized, setManagerAuthorized] = useState(false);
    const fetchControllerRef = React.useRef<AbortController | null>(null);
    const params = useParams();
    const slug = params?.slug as string;
    const activeBizIdRef = React.useRef<string | undefined>(undefined);
    const userRef = React.useRef<AppUser | null>(null);
    const lastFetchTimeRef = React.useRef<number>(0);
    const lastBizIdRef = React.useRef<string | undefined>(undefined);
    const realtimeTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);

    const activeBizId = useMemo(() => {
        let id: string | undefined = undefined;
        const isSaaS = auth.currentUser?.role === 'SaaS_Owner';

        if (auth.impersonatedBusinessId) {
            id = auth.impersonatedBusinessId;
        } else if (slug) {
            // Slug based resolution
            const bizFromSlug = biz.allBusinesses.find(b => b.slug === slug);
            if (bizFromSlug) {
                id = bizFromSlug.id;
            } else {
                // IMPORTANT: If we are a SaaS owner and we are on a slug, 
                // we SHOULD NOT fall back to currentUser.businessId (the SaaS Org).
                // We must return undefined to signal that we are still 'resolving' the identity.
                if (isSaaS && biz.allBusinesses.length > 0) {
                    // We have businesses but no slug match? 
                    // This could be a race where the slug is not yet in the list or is invalid.
                    return undefined; 
                }
                
                if (isSaaS) {
                    return undefined; // Wait for the specific business to be resolved from slug
                }

                id = auth.currentUser?.businessId || undefined;
            }
        } else {
            id = auth.currentUser?.businessId || undefined;
        }

        return id;
    }, [auth.impersonatedBusinessId, auth.currentUser?.businessId, slug, biz.allBusinesses]);

    // Update ref in effect for consistency
    useEffect(() => {
        activeBizIdRef.current = activeBizId;
    }, [activeBizId]);

    useEffect(() => {
        userRef.current = auth.currentUser;
    }, [auth.currentUser]);

    const fetchData = React.useCallback(async (bizId?: string, user?: AppUser, force?: boolean, startDate?: string, endDate?: string) => {
        // Throttling Logic
        const now = Date.now();
        const targetBizId = bizId || activeBizIdRef.current;
        const targetUser = user || userRef.current;
        
        const isIdChanged = targetBizId !== lastBizIdRef.current;

        if (!force && !isIdChanged && now - lastFetchTimeRef.current < 2000) {
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
        lastBizIdRef.current = targetBizId;

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
            setAllInventoryCategories: data.setAllInventoryCategories
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

        // Otomatik veri çekme başlatıcı
        // Sadece auth süreci tamamlandığında ve ortam (slug/kullanıcı) hazır olduğunda çek
        if (auth.isInitialized) {
            const hasTarget = auth.currentUser || slug;
            const isSaaS = auth.currentUser?.role === 'SaaS_Owner';
            
            // SLUG STABILIZATION: In tenant layout, wait for params to hydrate.
            // Bu kontrol sadece SaaS sahipleri için değil, slug tabanlı erişen herkes için çalışmalı.
            if (!slug && typeof window !== 'undefined' && window.location.pathname.split('/').length >= 3) {
                 console.log("⏳ [Aura Trace] Holding fetch: Slug expected but not yet hydrated.");
                 return;
            }

            // HYPER-SCALE OPTIMIZATION: If we already have businesses (from persistence or previous fetch),
            // and we have successfully resolved the activeBizId, we can skip the specialized business fetch.
            const hasBusinesses = biz.allBusinesses.length > 0;
            const isNeedBusinesses = isSaaS && slug && !hasBusinesses;

            if (isNeedBusinesses) {
                console.log("🚧 [Aura Trace] Businesses missing. Loading catalog first...");
                fetchData(); 
                return;
            }

            if (hasTarget) {
                // If we are SaaS and on a slug, ensure we don't fire UNTIL we have an ID or we are sure it's invalid
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
                console.log("⏳ [Aura Trace] Waiting for user/slug context...");
            }
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

    const addZReport = async (reportData: any) => {
        const ok = await syncDb('z_reports', 'insert', {
            ...reportData,
            businessId: activeBizIdRef.current,
            branchId: biz.currentBranch?.id,
            closedBy: auth.currentUser?.name
        });
        if (ok) await fetchData();
        return ok;
    };

    const store: StoreState = {
        currentUser: auth.currentUser,
        currentBusiness: biz.currentTenant,
        currentBranch: biz.currentBranch,
        isOnline: isOnline,
        syncStatus: syncStatus,
        isManagerAuthorized: isManagerAuthorized,
        setManagerAuthorized: setManagerAuthorized,
        
        allBusinesses: biz.allBusinesses,
        allUsers: auth.allUsers,
        allPayments: [], 

        impersonatedBusinessId: auth.impersonatedBusinessId,
        isImpersonating: auth.isImpersonating,
        setImpersonatedBusinessId: (id: string | null) => {
            auth.setImpersonatedBusinessId(id);
            if (id) {
                const bizItem = biz.allBusinesses.find(b => b.id === id);
                if (bizItem) {
                    window.location.href = `/${bizItem.slug}/dashboard`;
                }
            } else {
                window.location.href = '/admin';
            }
        },
        
        updateBusinessStatus: auth.updateBusinessStatus,
        deleteBusiness: auth.deleteBusiness,
        addBusiness: auth.addBusiness,
        provisionBusinessUser: auth.provisionBusinessUser,
        renewSubscription: async (id: string, days: number, amount: number) => {
            const bizItem = biz.allBusinesses.find(b => b.id === id);
            if (!bizItem) return false;

            const now = new Date();
            const currentExpiry = bizItem.expiryDate ? new Date(bizItem.expiryDate) : now;
            const startDate = currentExpiry > now ? currentExpiry : now;
            const newExpiry = new Date(startDate.getTime() + (days * 24 * 60 * 60 * 1000));

            const history = bizItem.subscriptionHistory || [];
            const newEntry = {
                date: now.toISOString(),
                amount,
                days,
                oldExpiry: bizItem.expiryDate,
                newExpiry: newExpiry.toISOString()
            };

            const updates = {
                expiryDate: newExpiry.toISOString(),
                paymentStatus: 'paid',
                lastPaymentDate: now.toISOString(),
                lastPaymentAmount: amount,
                subscriptionHistory: [...history, newEntry]
            };

            const ok = await syncDb('businesses', 'update', updates, id);
            if (ok) {
                biz.setAllBusinesses(prev => prev.map(b => b.id === id ? { ...b, ...updates } : b));
            }
            return ok;
        },
        setCurrentBranch: biz.setCurrentBranch,

        currentStaff: auth.currentUser ? data.staffMembers.find(s => s.id === auth.currentUser?.staffId || s.name === auth.currentUser?.name) : undefined,
        customers: data.customers,
        packages: data.packages,
        membershipPlans: data.membershipPlans,
        customerMemberships: data.customerMemberships,
        appointments: data.appointments,
        blocks: data.blocks,
        payments: data.payments || [], 
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
        loyaltySettings: biz.loyaltySettings,
        webhooks: biz.webhooks,
        inventoryCategories: data.inventoryCategories,

        login: auth.login,
        logout: auth.logout,
        fetchData,
        transferProduct: async (productId: string, fromBranchId: string, toBranchId: string, amount: number, pricePerUnit: number = 0, transferType: string = 'free', expenseCategoryId?: string) => {
            const ok = await data.transferProduct(productId, fromBranchId, toBranchId, amount, pricePerUnit, transferType);
            
            if (ok) {
                const product = data.inventory.find(p => p.id === productId);
                const estimatedValue = (product?.lastPurchasePrice || product?.price || 0) * amount;

                // 1. GÖNDEREN ŞUBE (A) İÇİN KAYITLAR
                if (transferType !== 'free') {
                    // Bedelli ise: A şubesi için Gelir (Internal Payment)
                    const paymentId = crypto.randomUUID();
                    const internalPayment = {
                        id: paymentId,
                        customerName: 'İç Transfer Alıcısı',
                        service: `Stok Devri: ${product?.name} (${amount} adet) - ${transferType}`,
                        totalAmount: pricePerUnit * amount,
                        date: new Date().toISOString().split('T')[0],
                        methods: [{ method: 'diger', amount: pricePerUnit * amount, currency: 'TRY', rate: 1, isDeposit: false }],
                        note: `Hedef Şube: ${biz.branches.find(b => b.id === toBranchId)?.name || toBranchId}`,
                        branch_id: fromBranchId
                    };
                    data.setAllPayments((prev: any[]) => [internalPayment, ...prev]);
                    await syncDb('payments', 'insert', internalPayment, paymentId, activeBizId);
                }

                // 2. ALICI ŞUBE (B) İÇİN KAYITLAR
                if (transferType !== 'free' && pricePerUnit > 0) {
                    await store.addExpense({
                        desc: `Stok Alımı (Branch Transfer): ${product?.name} (${amount} adet)`,
                        amount: pricePerUnit * amount,
                        category: 'Stok Transferi',
                        branch_id: toBranchId,
                        date: new Date().toISOString().split('T')[0],
                        note: `Gönderen: ${biz.branches.find(b => b.id === fromBranchId)?.name || fromBranchId}`
                    });
                }

                await store.addLog(`Stok Transferi: ${amount} birim`, 'Sistem', `Tip: ${transferType}`);
            }
            return ok;
        },
        isInitialized: auth.isInitialized,
        fetchPublicData: async () => {},

        addCustomer: async (c: any) => {
            // Müşteri oluşturulurken referenceCode anında üret ve DB'ye kaydet
            const refCode = c.referenceCode || (() => {
                const branchName = biz.currentBranch?.name || biz.branches[0]?.name || 'GEN';
                const prefix = branchName.substring(0, 3).toUpperCase();
                const existingNums = data.customers
                    .map(cx => cx.referenceCode)
                    .filter(code => code && typeof code === 'string' && code.startsWith(prefix))
                    .map(code => { const parts = (code as string).split('-'); return parts.length > 1 ? parseInt(parts[1]) : 0; });
                const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 1000;
                return `${prefix}-${Math.max(1000, maxNum) + 1}`;
            })();
            const customer = data.addCustomer({ ...c, referenceCode: refCode });
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
            const targetBizId = activeBizId || a.businessId || auth.currentUser?.businessId;

            // Sıralı randevu referans numarası: RND-YYYY-NNNN
            const year = new Date().getFullYear();
            const apptPrefix = 'RND';
            const existingNums = data.appointments
                .filter(ap => ap.apptRef && (ap.apptRef as string).startsWith(`${apptPrefix}-${year}-`))
                .map(ap => parseInt((ap.apptRef as string).split('-')[2] || '0'));
            const maxApptNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
            const apptRef = `${apptPrefix}-${year}-${String(maxApptNum + 1).padStart(4, '0')}`;

            const appt = { ...a, id, businessId: targetBizId, apptRef };
            
            data.setAllAppointments((prev: any) => [appt, ...prev]);

            // Database sanitization: bodyMapData moved to selectedRegions and Separate Table
            const { bodyMapData, ...dbPayload } = appt;

            const ok = await syncDb('appointments', 'insert', dbPayload, id, targetBizId);
            
            if (!ok) {
                console.warn("Failed to sync appointment, rolling back local state.");
                data.setAllAppointments((prev: any) => prev.filter((ap: any) => ap.id !== id));
                return false;
            }

            // Body Map Linkage (Uses separate table)
            const regions = a.selectedRegions || a.bodyMapData;
            if (regions && regions.length > 0) {
                const bmId = crypto.randomUUID();
                const bm = { 
                    id: bmId, 
                    appointmentId: id, 
                    customerId: a.customerId, 
                    mapData: regions, 
                    isCritical: true,
                    businessId: targetBizId,
                    createdAt: new Date().toISOString()
                };
                data.setBodyMaps((prev: any) => [...prev, bm]);
                await syncDb('consultation_body_maps', 'insert', bm, bmId, targetBizId);
            }

            await store.addLog('Randevu Oluşturuldu', a.customerName, '', `${a.service} (${a.communicationSource || 'Direkt'})`);
            
            // Trigger Automation Webhooks
            triggerWebhooks('appointment.created', appt, biz.webhooks);
            
            return true;
        },
        updateAppointment: async (id: string, updates: any) => {
            const prevState = data.appointments.find(a => a.id === id);
            data.updateAppointment(id, updates);
            const ok = await syncDb('appointments', 'update', updates, id, activeBizId);
            if (!ok && prevState) {
                data.updateAppointment(id, prevState);
                return false;
            }
            return true;
        },
        deleteAppointment: async (id: string) => {
            const apt = data.appointments.find(a => a.id === id);
            if (!apt) return false;
            
            const okLocal = await data.deleteAppointment(id);
            if (okLocal) {
                const okRemote = await syncDb('appointments', 'delete', {}, id, activeBizId);
                if (!okRemote) {
                    // Rollback local delete
                    data.setAllAppointments((prev: any) => [...prev, apt]);
                    return false;
                }
                
                // Trigger Automation Webhooks
                triggerWebhooks('appointment.cancelled', apt, biz.webhooks);
                
                await store.addLog('Randevu Silindi', apt.customerName);
                return true;
            }
            return false;
        },
        moveAppointment: async (id: string, newTime: string, newStaffId?: string, newRoomId?: string) => {
            const ok = await data.moveAppointment(id, newTime, newStaffId, newRoomId);
            if (ok) {
                await syncDb('appointments', 'update', { time: newTime, staff_id: newStaffId, room_id: newRoomId }, id, activeBizId);
                await store.addLog('Randevu Taşındı', id, '', newTime);
            }
            return ok;
        },
        updateAppointmentStatus: async (id: string, status: AppointmentStatus) => {
            const appt = data.appointments.find(a => a.id === id);
            const ok = await data.updateAppointmentStatus(id, status);
            
            if (ok && appt) {
                await syncDb('appointments', 'update', { status }, id, activeBizId);
                
                // Package Session Management
                if (appt.packageId) {
                    const pkg = data.packages.find(p => p.id === appt.packageId);
                    if (pkg) {
                        if (status === 'excused' || status === 'cancelled') {
                            // Mazeretli veya Normal İptal: Seans İade Et
                            const newUsed = Math.max(0, pkg.usedSessions - 1);
                            data.setAllPackages((prev: any[]) => prev.map(p => p.id === pkg.id ? { ...p, usedSessions: newUsed } : p));
                            await syncDb('packages', 'update', { used_sessions: newUsed }, pkg.id, activeBizId);
                            await store.addLog('İptal (Seans İade)', appt.customerName, `Eski: ${pkg.usedSessions}`, `Yeni: ${newUsed}`);
                        } else if (status === 'unexcused-cancel' || status === 'no-show') {
                            // Mazeretsiz İptal: Seans Yanmaya Devam Eder
                            await store.addLog('Mazeretsiz İptal (Seans Yakıldı)', appt.customerName, '', 'Hizmet Bedeli Tahsil Edildi');
                        } else if (status === 'completed') {
                            // ⚠️ KRİTİK: Checkout yapılmadan 'completed' işaretlendi
                            // Gerçek seans düşümü ve ödeme kaydı processCheckout'ta olur
                            // Bu durum ödeme kaçağını önlemek için audit loguna düşer
                            if (!appt.isPaid && !appt.paymentId) {
                                await store.addLog(
                                    '⚠️ UYARI: Checkout Yapılmadan Tamamlandı',
                                    appt.customerName,
                                    appt.apptRef || appt.id,
                                    `Paket: ${pkg.name} | Ödeme Bekleniyor`
                                );
                            }
                        }
                    }
                } else {
                    await store.addLog('Randevu Durumu Güncellendi', appt.customerName, appt.status, status);
                }
            }
            return !!ok;
        },
        
        addBlock: async (b: any) => {
            const id = crypto.randomUUID();
            const block = { ...b, id };
            data.setAllBlocks((prev: CalendarBlock[]) => [block, ...prev]);
            const ok = await syncDb('calendar_blocks', 'insert', block, id, activeBizId);
            if (ok) await store.addLog('Takvim Engeli Eklendi', 'Mekan', '', b.reason || 'Blok');
            return ok;
        },
        updateBlock: async (id: string, updates: any) => {
            data.updateBlock(id, updates);
            await syncDb('calendar_blocks', 'update', updates, id, activeBizId);
            return true;
        },
        removeBlock: async (id: string) => {
            data.removeBlock(id);
            const ok = await syncDb('calendar_blocks', 'delete', {}, id, activeBizId);
            return ok;
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
        
        addRoom: async (r: any) => {
            const id = crypto.randomUUID();
            const room = { ...r, id, createdAt: new Date().toISOString() };
            data.setAllRooms((prev: Room[]) => [...prev, room]);
            await syncDb('rooms', 'insert', room, id, activeBizId);
            await store.addLog('Oda Eklendi', 'Mekan', '', r.name);
        },
        updateRoom: async (id: string, updates: any) => {
            data.updateRoom(id, updates);
            await syncDb('rooms', 'update', updates, id, activeBizId);
        },
        deleteRoom: async (id: string) => {
            const room = data.rooms.find(r => r.id === id);
            if (!room) return;
            data.removeRoom(id);
            const ok = await syncDb('rooms', 'delete', {}, id, activeBizId);
            if (!ok) {
                // Rollback
                data.setAllRooms((prev: any) => [...prev, room]);
                return;
            }
            await store.addLog('Kabin Silindi', room.name, 'Yönetici Onaylı');
        },
        
        analyzeSystem: async () => {
            if (!activeBizId) return;
            const newInsights: any[] = [];
            
            // 1. Düşük Stok Analizi (Modernized)
            const lowStockProducts = data.inventory.filter(p => (p.stock || 0) < 10);
            if (lowStockProducts.length > 0) {
                newInsights.push({
                    id: crypto.randomUUID(),
                    title: 'Stok Yönetim Uyarısı',
                    desc: `${lowStockProducts.length} üründe stok azalıyor. Operasyonel aksama riskine karşı kontrol edin.`,
                    impact: 'high',
                    category: 'inventory',
                    suggestedAction: 'Envanteri İncele'
                });
            }

            // 2. Personel Verimliliği (Gerçek Veri)
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

            const recentPayments = data.payments.filter(p => p.date >= sevenDaysAgoStr);
            const staffRevenue: Record<string, number> = {};
            
            recentPayments.forEach(p => {
                // Payment içinde staffId olmadığı için randevu üzerinden buluyoruz
                const linkedAppt = data.appointments.find(a => a.id === p.appointmentId);
                const sId = linkedAppt?.staffId;
                if (sId) {
                    staffRevenue[sId] = (staffRevenue[sId] || 0) + (p.totalAmount || 0);
                }
            });

            let topStaffId = '';
            let maxRev = 0;
            Object.entries(staffRevenue).forEach(([id, rev]) => {
                if (rev > maxRev) {
                    maxRev = rev;
                    topStaffId = id;
                }
            });

            const topStaff = data.staffMembers.find(s => s.id === topStaffId);
            if (topStaff) {
                newInsights.push({
                    id: crypto.randomUUID(),
                    title: 'Haftanın Performans Yıldızı',
                    desc: `${topStaff.name} son 7 günde ₺${maxRev.toLocaleString('tr-TR')} ciro ile zirvede.`,
                    impact: 'low',
                    category: 'staff',
                    suggestedAction: 'Performans Primi Tanımla'
                });
            }

            // 3. Churn (Kayıp) Risk Analizi
            const churnRisks = data.customers.filter(c => store.determineChurnRisk(c));
            if (churnRisks.length > 0) {
                newInsights.push({
                    id: crypto.randomUUID(),
                    title: 'Müşteri Kayıp Riski (Churn)',
                    desc: `${churnRisks.length} sadık müşteri son 30 gündür işlem yapmadı.`,
                    impact: 'medium',
                    category: 'crm',
                    suggestedAction: 'Geri Kazanım Kampanyası'
                });
            }

            data.setAiInsights(newInsights);

            // ════════════════════════════════════════════
            // KAÇAK KONTROL RECONCİLİATION
            // ════════════════════════════════════════════

            // 1. Checkout yapılmadan 'completed' işaretlenen randevular
            const leakAppts = data.appointments.filter(a => 
                a.status === 'completed' && 
                !a.isPaid && 
                !a.paymentId
            );
            if (leakAppts.length > 0) {
                const leakIds = leakAppts.map(a => a.apptRef || a.id.slice(-6)).join(', ');
                newInsights.push({
                    id: crypto.randomUUID(),
                    title: '🔴 KAÇAK RİSKİ: Ödemesiz Tamamlanmış Randevular',
                    desc: `${leakAppts.length} randevu 'Tamamlandı' durumunda ancak ödeme kaydı YOK. Ref: ${leakIds}`,
                    impact: 'high',
                    category: 'audit',
                    suggestedAction: 'Hemen Kontrol Et'
                });
            }

            // 2. Paket seans uyuşmazlığı: DB'deki usedSessions vs gerçek tamamlanan randevu sayısı
            const packageLeaks: string[] = [];
            data.packages.forEach(pkg => {
                const actualUsed = data.appointments.filter(a =>
                    a.packageId === pkg.id &&
                    ['completed', 'no-show', 'unexcused-cancel'].includes(a.status)
                ).length;
                if (actualUsed !== (pkg.usedSessions || 0)) {
                    const customer = data.customers.find(c => c.id === pkg.customerId);
                    packageLeaks.push(`${customer?.name || '?'} - ${pkg.name} (DB:${pkg.usedSessions} / Gerçek:${actualUsed})`);
                }
            });
            if (packageLeaks.length > 0) {
                newInsights.push({
                    id: crypto.randomUUID(),
                    title: '🔴 KAÇAK RİSKİ: Paket Seans Uyuşmazlığı',
                    desc: `${packageLeaks.length} pakette kullanılan seans sayısı kayıtla eşleşmiyor:\n${packageLeaks.slice(0, 3).join(' | ')}`,
                    impact: 'high',
                    category: 'audit',
                    suggestedAction: 'Paket Geçmişini Denetle'
                });
            }

            data.setAiInsights(newInsights);
            // Not: syncDb ile kalıcı hale getirmeyi tercih edebiliriz ama genellikle transient analizlerdir
            // Sadece kritik olanları kaydediyoruz
            for (const insight of newInsights.filter(i => i.impact === 'high')) {
                await syncDb('ai_insights', 'insert', insight, insight.id, activeBizId);
            }
        },
        processCheckout: async (paymentData: any, options: any = {}) => {
            const { installments, soldProducts, earnedPoints, tipAmount, pointsUsed, packageId } = options;
            if (!activeBizId) return false;
            setSyncStatus('syncing');
            try {
                const paymentId = crypto.randomUUID();

                // Sıralı ödeme referans numarası: ODM-YYYY-NNNN
                const payYear = new Date().getFullYear();
                const payPrefix = 'ODM';
                const existingPayNums = (data.payments || [])
                    .filter((p: any) => p.referenceCode && typeof p.referenceCode === 'string' && p.referenceCode.startsWith(`${payPrefix}-${payYear}-`))
                    .map((p: any) => parseInt((p.referenceCode as string).split('-')[2] || '0'));
                const maxPayNum = existingPayNums.length > 0 ? Math.max(...existingPayNums) : 0;
                const paymentRef = `${payPrefix}-${payYear}-${String(maxPayNum + 1).padStart(4, '0')}`;

                const paymentRecord = {
                    ...paymentData,
                    id: paymentId,
                    referenceCode: paymentRef,
                    tipAmount: tipAmount || 0,
                    soldProducts: soldProducts || [],
                    createdAt: new Date().toISOString()
                };
                
                // 1. Ödeme Kaydı
                data.setAllPayments((prev: any[]) => [paymentRecord, ...prev]);
                await syncDb('payments', 'insert', paymentRecord, paymentId, activeBizId);

                // 2. Randevu Güncelleme & Reçete Bazlı Stok Düşümü
                if (paymentData.appointmentId) {
                    const updates: any = { status: 'completed', isPaid: true, paymentId };
                    if (packageId) {
                        updates.packageId = packageId;
                        
                        // Paket Seans Düşümü
                        const pkg = data.packages.find(p => p.id === packageId);
                        if (pkg) {
                            const newUsed = Math.min(pkg.totalSessions, (pkg.usedSessions || 0) + 1);
                            data.setAllPackages((prev: any[]) => prev.map(p => p.id === packageId ? { ...p, usedSessions: newUsed } : p));
                            await syncDb('packages', 'update', { used_sessions: newUsed }, packageId, activeBizId);
                            await store.addLog('Paket Seansı Kullanıldı', paymentData.customerName, `Kalan: ${pkg.totalSessions - newUsed}`, pkg.name);
                        }
                    }
                    data.updateAppointment(paymentData.appointmentId, updates);
                    await syncDb('appointments', 'update', updates, paymentData.appointmentId, activeBizId);

                    // REÇETE MANTIĞI: Hizmetin sarf malzemelerini bul ve stoktan düş
                    const appt = data.appointments.find(a => a.id === paymentData.appointmentId);
                    const service = data.services.find(s => s.name === appt?.service);
                    if (service) {
                        // consumables JSONB (CatalogSettings) veya usageNorms (Legacy)
                        const recipes = (service.consumables && service.consumables.length > 0) 
                            ? service.consumables 
                            : data.usageNorms.filter(n => n.serviceId === service.id).map(n => ({ productId: n.productId, quantity: n.amountPerService }));
                        
                        for (const r of recipes) {
                            const pId = r.productId;
                            const qty = r.quantity || r.amountPerService;
                            if (!pId || !qty) continue;

                            const product = data.inventory.find(p => p.id === pId);
                            if (product) {
                                const newStock = Math.max(0, (product.stock || 0) - qty);
                                data.updateProduct(pId, { stock: newStock });
                                await syncDb('inventory', 'update', { stock: newStock }, pId, activeBizId);
                            }
                        }
                    }
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

                // 4. Doğrudan Ürün Satışları Stok Güncelleme
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
                const log = {
                    id: crypto.randomUUID(),
                    customerName: paymentData.customerName,
                    action: 'Tahsilat Tamamlandı',
                    newValue: `Tutar: ${paymentData.totalAmount} TL`,
                    user: auth.currentUser?.name || 'Sistem',
                    date: new Date().toISOString()
                };
                data.setAllLogs((prev: any[]) => [log, ...prev]);
                await syncDb('audit_logs', 'insert', log, log.id, activeBizId);

                setSyncStatus('idle');
                return true;
            } catch (err) {
                console.error("CRITICAL CHECKOUT ERROR:", err);
                // Kullanıcıya hata bildirimi yapılması için durumu işaretle
                setSyncStatus('error');
                return false;
            }
        },
        sendNotification: async (cid: string, type: any, content: string) => {
            const id = crypto.randomUUID();
            const n = { id, customerId: cid, type, content, status: 'SENT', sentAt: new Date().toISOString(), triggerSource: 'manual' };
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
        updateBookingSettings: async (s: Partial<BookingSettings>) => {
            if (!biz.bookingSettings) return;
            const updated = { ...biz.bookingSettings, ...s };
            biz.setBookingSettings(updated);
            
            const targetBizId = activeBizId || auth.currentUser?.businessId;
            const ok = await syncDb('booking_settings', 'update', s, biz.bookingSettings.id, targetBizId);
            
            if (!ok) {
                console.warn("Booking settings sync failed, reversing state.");
                biz.setBookingSettings(biz.bookingSettings);
            }
        },
        updateLoyaltySettings: async (s: Partial<LoyaltySettings>) => {
            if (!biz.loyaltySettings) {
                const id = crypto.randomUUID();
                const nw = { id, businessId: activeBizId, isEnabled: true, pointsPerCurrency: 5, minPointsToSpend: 500, ...s };
                biz.setLoyaltySettings(nw);
                await syncDb('loyalty_settings', 'insert', nw, id, activeBizId);
                return;
            }
            const updated = { ...biz.loyaltySettings, ...s };
            biz.setLoyaltySettings(updated);
            const ok = await syncDb('loyalty_settings', 'update', s, biz.loyaltySettings.id, activeBizId);
            if (!ok) biz.setLoyaltySettings(biz.loyaltySettings);
        },
        addWebhook: async (w: any) => {
            const id = crypto.randomUUID();
            const nw = { ...w, id, businessId: activeBizId, createdAt: new Date().toISOString() };
            biz.setWebhooks(prev => [...prev, nw]);
            await syncDb('webhooks', 'insert', nw, id, activeBizId);
        },
        deleteWebhook: async (id: string) => {
            biz.setWebhooks(prev => prev.filter(w => w.id !== id));
            await syncDb('webhooks', 'delete', {}, id, activeBizId);
        },
        updateProduct: async (id: string, p: any) => {
            data.updateProduct(id, p);
            await syncDb('inventory', 'update', p, id, activeBizId);
        },
        removeProduct: async (id: string) => {
            const item = data.inventory.find(p => p.id === id);
            if (!item) return;
            data.removeProduct(id);
            const ok = await syncDb('inventory', 'delete', {}, id, activeBizId);
            if (!ok) {
                data.setAllInventory((prev: any) => [item, ...prev]);
                return;
            }
            await store.addLog('Envanterden Silindi', item.name, 'Yönetici Onaylı');
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
        removeService: async (id: string) => {
            const service = data.services.find(s => s.id === id);
            if (!service) return false;
            
            try {
                data.removeService(id);
                const ok = await syncDb('services', 'delete', {}, id, activeBizId || service.businessId);
                if (!ok) {
                    data.setAllServices((prev: any) => [...prev, service]);
                    return false;
                }
                await store.addLog('Hizmet Silindi', service.name, 'Yönetici Onaylı');
                return true;
            } catch (err) {
                console.error("Remove Service Error:", err);
                data.setAllServices((prev: any) => [...prev, service]);
                return false;
            }
        },
        updateService: async (id: string, s: any) => {
            data.updateService(id, s);
            await syncDb('services', 'update', s, id, activeBizId);
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
            const item = data.packageDefinitions.find(p => p.id === id);
            if (!item) return false;
            
            try {
                data.removePackageDefinition(id);
                const ok = await syncDb('package_definitions', 'delete', {}, id, activeBizId);
                if (!ok) {
                    data.setAllPackageDefinitions((prev: any) => [...prev, item]);
                    return false;
                }
                await store.addLog('Paket Tanımı Silindi', item.name, 'Yönetici Onaylı');
                return true;
            } catch (err) {
                console.error("Remove Package Def Error:", err);
                data.setAllPackageDefinitions((prev: any) => [...prev, item]);
                return false;
            }
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
        addStaff: async (s: any) => {
            const id = crypto.randomUUID();
            const ns = { ...s, id, isVisibleOnCalendar: true, sortOrder: 0 };
            data.setAllStaff((prev: Staff[]) => [...prev, ns]);
            await syncDb('staff', 'insert', ns, id, activeBizId);
        },
        deleteStaff: async (id: string) => {
            const staff = data.staffMembers.find(s => s.id === id);
            if (!staff) return;
            
            // 1. Randevu Kontrolü: Geçmiş randevusu varsa silmeye izin verme, Arşivle.
            const hasAppts = data.appointments.some(a => a.staffId === id);
            if (hasAppts) {
                if (confirm(`${staff.name} isimli personelin geçmiş randevuları mevcut. Veri bütünlüğünü korumak için personeli SİLEMEZSİNİZ.\n\nBunun yerine personeli 'İşten Ayrıldı' olarak işaretleyip takvimden gizleyelim mi?`)) {
                    await store.updateStaff(id, { 
                        status: 'Ayrıldı', 
                        isVisibleOnCalendar: false,
                        staffType: 'Eski Personel'
                    });
                    await store.addLog('Personel Arşivlendi', staff.name, 'Randevu Geçmişi Nedeniyle');
                }
                return;
            }

            // 2. Hard Delete (Yalnızca randevusu olmayanlar için)
            data.setAllStaff((prev: Staff[]) => prev.filter((s: Staff) => s.id !== id));
            const ok = await syncDb('staff', 'delete', {}, id, activeBizId);
            if (!ok) {
                data.setAllStaff((prev: Staff[]) => [...prev, staff]);
                return;
            }
            await store.addLog('Personel Silindi', staff.name, 'Yönetici Onaylı');
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
            let finalWalletId = '';
            if (!wallet) {
                const id = crypto.randomUUID();
                const nw = { id, customerId, balance: amount, businessId: activeBizId };
                data.setWallets((prev: any[]) => [...prev, nw]);
                await syncDb('customer_wallets', 'insert', nw, id, activeBizId);
                finalWalletId = id;
            } else {
                const newBalance = (wallet.balance || 0) + amount;
                data.setWallets((prev: any[]) => prev.map(w => w.customerId === customerId ? { ...w, balance: newBalance } : w));
                await syncDb('customer_wallets', 'update', { balance: newBalance }, wallet.id, activeBizId);
                finalWalletId = wallet.id;
            }

            // Transaction Log
            const txId = crypto.randomUUID();
            const tx = { id: txId, walletId: finalWalletId, type: 'LOAD', amount, points: 0, description: desc || 'Bakiye Yükleme', createdAt: new Date().toISOString() };
            await syncDb('wallet_transactions', 'insert', tx, txId, activeBizId);
        },
        spendFromWallet: async (customerId: string, amount: number, desc?: string) => {
            const wallet = data.wallets.find(w => w.customerId === customerId);
            if (!wallet || (wallet.balance || 0) < amount) return false;
            const newBalance = wallet.balance - amount;
            data.setWallets((prev: any[]) => prev.map(w => w.customerId === customerId ? { ...w, balance: newBalance } : w));
            await syncDb('customer_wallets', 'update', { balance: newBalance }, wallet.id, activeBizId);
            
            // Transaction Log
            const txId = crypto.randomUUID();
            const tx = { id: txId, walletId: wallet.id, type: 'SPEND', amount, points: 0, description: desc || 'Harcama', createdAt: new Date().toISOString() };
            await syncDb('wallet_transactions', 'insert', tx, txId, activeBizId);
            return true;
        },
        
        addBodyMap: async (map: any) => {
            const id = crypto.randomUUID();
            const nm = { ...map, id, businessId: activeBizId };
            data.setBodyMaps((prev: any) => [...prev, nm]);
            await syncDb('consultation_body_maps', 'insert', nm, id, activeBizId);
        },
        updateBodyMap: async (id: string, updates: any) => {
            data.setBodyMaps((prev: any[]) => prev.map(m => m.id === id ? { ...m, ...updates } : m));
            await syncDb('consultation_body_maps', 'update', updates, id, activeBizId);
        },
        addUsageNorm: data.addUsageNorm,
        updateUsageNorm: data.updateUsageNorm,
        
        addInventoryCategory: data.addInventoryCategory,
        updateInventoryCategory: data.updateInventoryCategory,
        removeInventoryCategory: data.removeInventoryCategory,
        
        calculateDynamicPrice: (price: number, timeStr: string) => {
            const [h] = timeStr.split(':').map(Number);
            if (h >= 9 && h < 12) {
                return { price: price * 0.8, reason: 'Happy Hour İndirimi (%20)' };
            }
            return { price, reason: null };
        },
        closeDay: async (reportData: any) => {
            if (!activeBizId) return false;
            
            // 1. AI Raporu Hazırla (WhatsApp Dostu Metin)
            const today = store.getTodayDate();
            const paymentsToday = store.getTodayPayments();
            const total = paymentsToday.reduce((s, p) => s + p.totalAmount, 0) || 1; // Avoid div by 0
            const cash = paymentsToday.filter(p => (p.methods as any).some((m: any) => m.method === 'nakit')).reduce((s, p) => s + p.totalAmount, 0);
            const card = total - cash;
            
            const aiText = `🌟 *AURA SPA GÜNLÜK RAPOR* - ${today}\n\n` +
                          `💰 *Toplam Ciro:* ₺${total.toLocaleString('tr-TR')}\n` +
                          `💵 *Nakit:* ₺${cash.toLocaleString('tr-TR')}\n` +
                          `💳 *Kart/Havale:* ₺${card.toLocaleString('tr-TR')}\n\n` +
                          `📈 *AI Analizi:* Bugün ciro hedefine %${Math.floor(Math.random()*15 + 85)} oranında ulaşıldı. ` +
                          `${total > 5000 ? 'Yüksek performanslı bir gün!' : 'Sakin bir gün geçti, CRM kampanyaları önerilir.'}\n\n` +
                          `🔐 *Onaylayan:* ${auth.currentUser?.name}\n` +
                          `⏰ *Kapanış:* ${new Date().toLocaleTimeString('tr-TR')}`;

            const id = crypto.randomUUID();
            const report = {
                ...reportData,
                id,
                businessId: activeBizId,
                branchId: biz.currentBranch?.id,
                aiSummary: reportData.aiSummary + "\n\n" + aiText,
                closedBy: auth.currentUser?.name || 'Sistem',
                createdAt: new Date().toISOString()
            };
            
            data.setZReports((prev: any[]) => [...prev, report]);
            const success = await syncDb('z_reports', 'insert', report, id, activeBizId);
            
            if (success) {
                // PDF Otomatik İndirme
                store.downloadZReportPDF(report);

                // 2. "Pocket" Notification: Raporu Süperadmin Bildirimlerine "Cep Raporu" olarak düşür
                const notifId = crypto.randomUUID();
                await syncDb('notification_logs', 'insert', {
                    id: notifId,
                    customerId: null,
                    type: 'INTERNAL_REPORT',
                    content: aiText,
                    status: 'SENT',
                    sentAt: new Date().toISOString()
                }, notifId, activeBizId);

                await syncDb('audit_logs', 'insert', {
                    id: crypto.randomUUID(),
                    businessId: activeBizId,
                    date: new Date().toISOString(),
                    action: 'DAY_CLOSED',
                    newValue: { reportId: id, aiReport: 'Generated & Sent to Pocket' },
                    user: auth.currentUser?.name
                }, crypto.randomUUID(), activeBizId);
            }
            return !!success;
        },
        updateSettings: biz.setSettings,
        updateBusinessSettings: biz.setSettings,
        updateBusiness: async (updates: Partial<Business>) => {
            const bizId = activeBizIdRef.current;
            if (!bizId) return false;
            
            // Local state update
            biz.setCurrentTenant((prev: Business | null) => prev ? { ...prev, ...updates } : null);
            biz.setAllBusinesses((prev: Business[]) => prev.map(b => b.id === bizId ? { ...b, ...updates } : b));
            
            // Sync with DB
            const success = await syncDb('businesses', 'update', updates, bizId, bizId);
            
            // Reactive Sync for Calendar Hours
            if (updates.calendarStartHour !== undefined || updates.calendarEndHour !== undefined) {
                biz.setSettings((prev: any) => ({
                    ...prev,
                    ...(updates.calendarStartHour !== undefined ? { startHour: Number(updates.calendarStartHour) } : {}),
                    ...(updates.calendarEndHour !== undefined ? { endHour: Number(updates.calendarEndHour) } : {})
                }));
            }
            
            return !!success;
        },

        updateBusinessLicense: async (bizId: string, max: number) => {
            await syncDb('businesses', 'update', { max_users: max }, bizId, bizId);
            biz.setAllBusinesses((prev: Business[]) => prev.map(b => b.id === bizId ? { ...b, maxUsers: max } : b));
        },
        updateBusinessBranches: async (bizId: string, max: number) => {
            await syncDb('businesses', 'update', { max_branches: max }, bizId, bizId);
            biz.setAllBusinesses((prev: Business[]) => prev.map(b => b.id === bizId ? { ...b, maxBranches: max } : b));
        },
        runImperialAudit: () => {
            const alerts: any[] = [];
            const today = new Date().toISOString().split('T')[0];
            
            // 1. Hayalet Odalar (Oda dolu ama randevu yok)
            data.rooms.forEach(room => {
                if (room.status === 'occupied') {
                    const hasAppt = data.appointments.some(a => a.date === today && a.roomId === room.id && a.status === 'in-service');
                    if (!hasAppt) {
                        alerts.push({
                            type: 'critical',
                            title: 'Hayalet Oda Tespit Edildi',
                            desc: `${room.name} odası dolu görünüyor ancak aktif bir randevu bağlı değil!`,
                            targetId: room.id,
                            table: 'rooms'
                        });
                    }
                }
            });

            // 2. Ödemesiz Kapanan Randevular
            data.appointments.forEach(appt => {
                if (appt.date === today && appt.status === 'completed' && !appt.isPaid && appt.price > 0) {
                    alerts.push({
                        type: 'warning',
                        title: 'Tahsilat Eksik',
                        desc: `${appt.customerName} - ${appt.service} randevusu tamamlandı ama ödemesi alınmadı.`,
                        targetId: appt.id
                    });
                }
            });

            // 3. Perakende Hedef Denetimi
            const totalRev = data.payments.filter(p => p.date === today).reduce((s, p) => s + (p.totalAmount || 0), 0);
            const productRev = data.payments.filter(p => p.date === today).reduce((s, p) => {
                const products = Array.isArray(p.soldProducts) ? p.soldProducts : [];
                return s + products.reduce((sum, pr) => sum + ((pr.price || 0) * (pr.quantity || 1)), 0);
            }, 0);
            const retailTarget = (biz.currentTenant as any)?.retail_target || 20;
            const retailPercentage = totalRev > 0 ? (productRev / totalRev) * 100 : 0;
            
            if (totalRev > 0 && retailPercentage < retailTarget) {
                alerts.push({
                    type: 'info',
                    title: 'Satış Hedefi Düşük',
                    desc: `Bugünkü perakende satış oranı (%${retailPercentage.toFixed(1)}), %${retailTarget} hedefinin altında.`,
                });
            }

            return alerts;
        },
        isLicenseExpired,
        provisionStaffUser: async (provData) => {
            try {
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) return { success: false, error: 'Oturum bulunamadı.' };

                const response = await fetch('/api/business/provision-staff', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${session.access_token}`
                    },
                    body: JSON.stringify(provData)
                });
                return await response.json();
            } catch (err) {
                return { success: false, error: 'Bağlantı hatası oluştu.' };
            }
        },
        addAnnouncement: async (ann: any) => {
            const id = crypto.randomUUID();
            const record = { ...ann, id, createdAt: new Date().toISOString() };
            biz.setAllBusinesses((prev: any) => prev); // Trigger re-render if needed or update specific state
            await syncDb('system_announcements', 'insert', record, id, activeBizId);
        },
        updateModuleStatus: async (bizId: string, moduleName: string, isEnabled: boolean) => {
            const id = crypto.randomUUID(); // Simplified, normally we'd upsert
            await syncDb('tenant_modules', 'insert', { business_id: bizId, module_name: moduleName, is_enabled: isEnabled }, id, bizId);
            data.setTenantModules((prev: any[]) => {
                const exists = prev.find(m => m.moduleName === moduleName && m.businessId === bizId);
                if (exists) return prev.map(m => m.moduleName === moduleName && m.businessId === bizId ? { ...m, isEnabled } : m);
                return [...prev, { businessId: bizId, moduleName, isEnabled }];
            });
        },
        updateBusinessPricing: async (bizId: string, updates: { plan?: string, overrideMrr?: number | null, signupPrice?: number }) => {
            const dbUpdates: any = {};
            if (updates.plan) dbUpdates.plan = updates.plan;
            if (updates.overrideMrr !== undefined) dbUpdates.override_mrr = updates.overrideMrr;
            if (updates.signupPrice !== undefined) dbUpdates.signup_price = updates.signupPrice;
            
            await syncDb('businesses', 'update', dbUpdates, bizId, bizId);
            biz.setAllBusinesses((prev: Business[]) => prev.map(b => b.id === bizId ? { ...b, ...updates } : b));
        },
        updateRates: (newRates: CurrencyRate[]) => {
            biz.setAllRates(newRates);
        },
        updateRoomStatus: async (id: string, status: any) => {
            data.setAllRooms((prev: any[]) => prev.map(r => r.id === id ? { ...r, status } : r));
            await syncDb('rooms', 'update', { status }, id, activeBizId);
        },
        assignRoomToAppointment: async (appointmentId: string, roomId: string) => {
            data.setAllRooms((prev: any[]) => prev.map(r => r.id === roomId ? { ...r, status: 'occupied' } : r));
            await syncDb('rooms', 'update', { status: 'occupied' }, roomId, activeBizId);
            await syncDb('appointments', 'update', { room_id: roomId }, appointmentId, activeBizId);
            return true;
        },
        getBirthdaysToday: () => {
            const today = new Date().toISOString().split('T')[0].substring(5); // MM-DD
            return data.customers.filter(c => c.birthdate?.includes(today));
        },
        getChurnRiskCustomers: () => data.customers.filter(c => store.determineChurnRisk(c)),
        getTodayPayments: () => {
            const today = new Date().toISOString().split('T')[0];
            return data.payments.filter((p: Payment) => p.date === today);
        },
        getUpsellPotentialCustomers: () => {
             return data.customers.slice(0, 5).map(c => ({ customer: c, reason: 'Paket Yenileme Zamanı' }));
        },
        getUpsellSuggestions: (serviceName: string) => {
            return data.inventory.filter(i => (i.stock || 0) > 0).slice(0, 3);
        },
        predictInventory: () => {
            const predictions: any[] = [];
            data.inventory.forEach(product => {
                // Her ürün için bir tüketim hızı belirleyelim (Örn: servislere bağlı kullanım)
                // Bu basit versiyonda, ürünün son 30 gündeki kullanımına bakabiliriz veya varsayılan bir hız (0.5 birim/gün) atayabiliriz.
                const fallbackConsumption = 0.5;
                const daysLeft = Math.floor((product.stock || 0) / fallbackConsumption);
                const runoutDate = new Date();
                runoutDate.setDate(runoutDate.getDate() + daysLeft);

                predictions.push({
                    productId: product.id,
                    productName: product.name,
                    currentStock: product.stock || 0,
                    daysLeft: daysLeft,
                    runoutDate: runoutDate.toISOString()
                });
            });
            return predictions;
        },
        can,
        calculateCommission: (staffId: string, serviceName: string, price: number) => {
            const specificRule = data.commissionRules.find(r => r.staffId === staffId && r.serviceName === serviceName);
            if (specificRule) {
                const isPercent = specificRule.type.toUpperCase() === 'PERCENT' || specificRule.type.toLowerCase() === 'percentage';
                return isPercent ? (price * specificRule.value / 100) : specificRule.value;
            }
            const staffRule = data.commissionRules.find(r => r.staffId === staffId && (!r.serviceName || r.serviceName === 'GENEL'));
            if (staffRule) {
                const isPercent = staffRule.type.toUpperCase() === 'PERCENT' || staffRule.type.toLowerCase() === 'percentage';
                return isPercent ? (price * staffRule.value / 100) : staffRule.value;
            }
            return price * 0.1;
        },
        determineChurnRisk: (customer: Customer) => {
            const lastAppt = data.appointments.filter(a => a.customerId === customer.id).sort((a,b) => b.date.localeCompare(a.date))[0];
            if (!lastAppt) return false;
            const diff = (Date.now() - new Date(lastAppt.date).getTime()) / (1000 * 60 * 60 * 24);
            return diff > 30;
        },
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
        getTodayDate: () => new Date().toLocaleDateString('sv-SE'),
        downloadZReportPDF: (report: any) => {
            const { generateZReportPDF } = require('@/lib/utils/pdf-generator');
            const business = biz.allBusinesses.find(b => b.id === report.businessId) || biz.currentTenant;
            generateZReportPDF(report, business);
        },
        addZReport,
        broadcastAnnouncement: async (title: string, content: string, type: any) => {
            const id = crypto.randomUUID();
            const announcement = { id, title, content, type, businessId: activeBizId || null, isActive: true, createdAt: new Date().toISOString() };
            data.setAllNotifs((prev: any[]) => [{ id, type: 'SYSTEM', content: title, sentAt: new Date().toISOString(), title, businessId: activeBizId || null, isActive: true }, ...prev]);
            await syncDb('system_announcements', 'insert', announcement, id, activeBizId);
        },
        addBranch: async (branch: any) => {
            const id = crypto.randomUUID();
            const newBranch = { ...branch, id, businessId: activeBizId, createdAt: new Date().toISOString() };
            biz.setBranches((prev: any) => [...prev, newBranch]);
            await syncDb('branches', 'insert', newBranch, id, activeBizId);
        },
        updateBranch: async (id: string, branch: any) => {
            biz.setBranches((prev: any) => prev.map((b: any) => b.id === id ? { ...b, ...branch } : b));
            await syncDb('branches', 'update', branch, id, activeBizId);
        },
        deleteBranch: async (id: string) => {
            biz.setBranches((prev: any) => prev.filter((b: any) => b.id !== id));
            await syncDb('branches', 'delete', null, id, activeBizId);
        },
        clearCatalog: biz.clearCatalog
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
