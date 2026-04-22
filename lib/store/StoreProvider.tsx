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
    const fetchControllerRef = React.useRef<AbortController | null>(null);
    const params = useParams();
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
            const bizFromSlug = biz.allBusinesses.find(b => b.slug === slug);
            if (bizFromSlug) {
                id = bizFromSlug.id;
            } else if (lastResolvedBizIdRef.current && !isSaaS) {
                // STICKY FALLBACK: If we have a slug but list is empty, don't clear the ID
                id = lastResolvedBizIdRef.current;
            }
        } else {
            id = auth.currentUser?.businessId || undefined;
        }

        if (id) lastResolvedBizIdRef.current = id;
        return id;
    }, [auth.impersonatedBusinessId, auth.currentUser?.businessId, slug, biz.allBusinesses]);

    // Update ref in effect for consistency
    useEffect(() => {
        activeBizIdRef.current = activeBizId;
    }, [activeBizId]);

    const fetchData = React.useCallback(async (bizId?: string, user?: AppUser, force?: boolean, startDate?: string, endDate?: string) => {
        // Throttling Logic
        const now = Date.now();
        const targetBizId = bizId || activeBizIdRef.current;
        const targetUser = user || authRef.current.currentUser;
        
        const isIdChanged = targetBizId !== lastFetchBizIdRef.current;

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
            setWebhooks: biz.setWebhooks
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

    const getCustomerAppointments = React.useCallback((cid: string) => {
        return data.appointments.filter(a => a.customerId === cid);
    }, [data.appointments]);

    const getCustomerPayments = React.useCallback((cid: string) => {
        return data.payments.filter(p => p.customerId === cid);
    }, [data.payments]);

    const getChurnRiskCustomers = React.useCallback(() => {
        return data.customers.filter(c => c.isChurnRisk);
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
        return data.customers.filter((c: Customer) => c.birthdate?.includes(today));
    }, [data.customers]);

    const calculateCommission = React.useCallback((staffId: string, serviceName: string, amount: number) => {
        const rules = data.commissionRules.filter(r => r.staffId === staffId);
        const specificRule = rules.find(r => r.serviceName === serviceName);
        const generalRule = rules.find(r => r.serviceName === 'Tümü');
        const rule = specificRule || generalRule;
        if (!rule) return 0;
        return rule.type === 'percentage' ? (amount * rule.value) / 100 : rule.value;
    }, [data.commissionRules]);

    const determineChurnRisk = React.useCallback((customer: Customer) => {
        return customer.isChurnRisk || false;
    }, []);

    const addLog = React.useCallback(async (type: string, target: string, source: string = 'Sistem', detail?: string) => {
        const id = crypto.randomUUID();
        // action field added for backward compatibility with the NOT NULL constraint if it persists
        const log = { id, type, target, source, detail, action: type, businessId: activeBizIdRef.current, createdAt: new Date().toISOString() };
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
            closedBy: auth.currentUser?.name
        });
        if (ok) await fetchData();
        return ok;
    };

    const stableMethods: any = useMemo(() => ({
        login: authRef.current.login,
        logout: authRef.current.logout,
        fetchData,
        fetchPublicData: async () => {},
        isInitialized: authRef.current.isInitialized,
        updateBusinessStatus: authRef.current.updateBusinessStatus,
        deleteBusiness: authRef.current.deleteBusiness,
        addBusiness: authRef.current.addBusiness,
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
        
        // --- CUSTOMER METHODS ---
        addCustomer: async (c: any) => {
            const refCode = c.referenceCode || (() => {
                const branchName = bizRef.current.currentBranch?.name || bizRef.current.branches[0]?.name || 'GEN';
                const prefix = branchName.substring(0, 3).toUpperCase();
                const existingNums = dataRef.current.customers
                    .map(cx => cx.referenceCode)
                    .filter(code => code && typeof code === 'string' && code.startsWith(prefix))
                    .map(code => { const parts = (code as string).split('-'); return parts.length > 1 ? parseInt(parts[1]) : 0; });
                const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 1000;
                return `${prefix}-${Math.max(1000, maxNum) + 1}`;
            })();
            const customer = dataRef.current.addCustomer({ ...c, referenceCode: refCode });
            await syncDb('customers', 'insert', customer, customer.id, activeBizIdRef.current);
            return customer;
        },
        updateCustomer: async (id: string, updates: any) => {
            dataRef.current.updateCustomer(id, updates);
            await syncDb('customers', 'update', updates, id, activeBizIdRef.current);
            stableMethods.addLog('Müşteri Güncellendi', id, '', 'Güncelleme');
        },
        deleteCustomer: async (id: string) => {
            markAsModified(id);
            const customer = dataRef.current.customers.find(c => c.id === id);
            const ok = await dataRef.current.deleteCustomer(id);
            if (ok) {
                await syncDb('customers', 'delete', {}, id, activeBizIdRef.current);
                if (customer) stableMethods.addLog('Müşteri Silindi', customer.name);
            }
            return ok;
        },

        // --- APPOINTMENT METHODS ---
        addAppointment: async (a: any) => {
            const id = crypto.randomUUID();
            const targetBizId = activeBizIdRef.current || a.businessId || authRef.current.currentUser?.businessId;
            const year = new Date().getFullYear();
            const apptPrefix = 'RND';
            const existingNums = dataRef.current.appointments
                .filter(ap => ap.apptRef && (ap.apptRef as string).startsWith(`${apptPrefix}-${year}-`))
                .map(ap => parseInt((ap.apptRef as string).split('-')[2] || '0'));
            const maxApptNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
            const apptRef = `${apptPrefix}-${year}-${String(maxApptNum + 1).padStart(4, '0')}`;
            const appt = { ...a, id, businessId: targetBizId, apptRef };
            dataRef.current.setAllAppointments((prev: any) => [appt, ...prev]);
            const { bodyMapData, ...dbPayload } = appt;
            const ok = await syncDb('appointments', 'insert', dbPayload, id, targetBizId);
            if (!ok) {
                dataRef.current.setAllAppointments((prev: any) => prev.filter((ap: any) => ap.id !== id));
                return false;
            }
            const regions = a.selectedRegions || a.bodyMapData;
            if (regions && regions.length > 0) {
                const bmId = crypto.randomUUID();
                const bm = { id: bmId, appointmentId: id, customerId: a.customerId, mapData: regions, isCritical: true, businessId: targetBizId, createdAt: new Date().toISOString() };
                dataRef.current.setBodyMaps((prev: any) => [...prev, bm]);
                await syncDb('consultation_body_maps', 'insert', bm, bmId, targetBizId);
            }
            stableMethods.addLog('Randevu Oluşturuldu', a.customerName, '', `${a.service} (${a.communicationSource || 'Direkt'})`);
            triggerWebhooks('appointment.created', appt, bizRef.current.webhooks);
            return true;
        },
        deleteAppointment: async (id: string) => {
            const apt = dataRef.current.appointments.find(a => a.id === id);
            if (!apt) return false;
            if (apt.isSealed) {
                console.error("❌ Mühürlü randevu silinemez!");
                return false;
            }
            markAsModified(id);
            const okLocal = await dataRef.current.deleteAppointment(id);
            if (okLocal) {
                // Ensure we delete by both ID and business_id for maximum safety and RLS compliance
                const okRemote = await syncDb('appointments', 'delete', {}, id, activeBizIdRef.current);
                if (!okRemote) {
                    console.error("❌ Veritabanı silme işlemi başarısız. Geri alınıyor...");
                    dataRef.current.setAllAppointments((prev: any) => [...prev, apt]);
                    unmarkAsModified(id);
                    alert("⚠️ Randevu silinemedi! Bu kayıt mühürlü olabilir veya veri sahipliği (RLS) kısıtına takılmış olabilirsiniz. Lütfen sayfayı yenileyip tekrar deneyin.");
                    return false;
                }
                
                // Logging and Webhooks aftermath
                triggerWebhooks('appointment.cancelled', apt, bizRef.current.webhooks);
                await stableMethods.addLog('Randevu Silindi', apt.customerName, 'İşlem Başarılı', `${apt.service} randevusu silindi.`);
                return true;
            }
            return false;
        },
        updateAppointment: async (id: string, updates: any) => {
            const prevState = dataRef.current.appointments.find(a => a.id === id);
            if (prevState?.isSealed && !updates.isSealed) {
                console.error("❌ Mühürlü randevu güncellenemez!");
                return false;
            }
            dataRef.current.updateAppointment(id, updates);
            const ok = await syncDb('appointments', 'update', updates, id, activeBizIdRef.current);
            if (!ok && prevState) {
                dataRef.current.updateAppointment(id, prevState);
                return false;
            }
            return true;
        },
        moveAppointment: async (id: string, newTime: string, newStaffId?: string, newRoomId?: string) => {
            const ok = await dataRef.current.moveAppointment(id, newTime, newStaffId, newRoomId);
            if (ok) {
                await syncDb('appointments', 'update', { time: newTime, staff_id: newStaffId, room_id: newRoomId }, id, activeBizIdRef.current);
                stableMethods.addLog('Randevu Taşındı', id, '', newTime);
            }
            return ok;
        },
        updateAppointmentStatus: async (id: string, status: AppointmentStatus) => {
            const appt = dataRef.current.appointments.find(a => a.id === id);
            const ok = await dataRef.current.updateAppointmentStatus(id, status);
            if (ok && appt) {
                await syncDb('appointments', 'update', { status }, id, activeBizIdRef.current);
                if (appt.packageId) {
                    const pkg = dataRef.current.packages.find(p => p.id === appt.packageId);
                    if (pkg) {
                        if (status === 'excused' || status === 'cancelled') {
                            const newUsed = Math.max(0, (pkg.usedSessions || 0) - 1);
                            dataRef.current.setAllPackages((prev: any[]) => prev.map(p => p.id === pkg.id ? { ...p, usedSessions: newUsed } : p));
                            await syncDb('packages', 'update', { used_sessions: newUsed }, pkg.id, activeBizIdRef.current);
                            stableMethods.addLog('İptal (Seans İade)', appt.customerName, `Eski: ${pkg.usedSessions}`, `Yeni: ${newUsed}`);
                        }
                    }
                } else {
                    stableMethods.addLog('Randevu Durumu Güncellendi', appt.customerName, appt.status, status);
                }
            }
            return !!ok;
        },
        
        // --- BASE LOGGING ---
        addBlock: async (b: any) => {
            const id = crypto.randomUUID();
            const block = { ...b, id };
            dataRef.current.setAllBlocks((prev: CalendarBlock[]) => [block, ...prev]);
            const ok = await syncDb('calendar_blocks', 'insert', block, id, activeBizIdRef.current);
            if (ok) stableMethods.addLog('Takvim Engeli Eklendi', 'Mekan', '', b.reason || 'Blok');
            return ok;
        },
        updateBlock: async (id: string, updates: any) => {
            dataRef.current.updateBlock(id, updates);
            await syncDb('calendar_blocks', 'update', updates, id, activeBizIdRef.current);
            return true;
        },
        removeBlock: async (id: string) => {
            dataRef.current.removeBlock(id);
            const ok = await syncDb('calendar_blocks', 'delete', {}, id, activeBizIdRef.current);
            return ok;
        },
        addProduct: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            dataRef.current.setAllInventory((prev: Product[]) => [np, ...prev]);
            await syncDb('inventory', 'insert', np, id, activeBizIdRef.current);
            stableMethods.addLog('Envanter Eklendi', 'Depo', '', p.name);
        },
        updateProduct: async (id: string, p: any) => {
            dataRef.current.updateProduct(id, p);
            await syncDb('inventory', 'update', p, id, activeBizIdRef.current);
        },
        removeProduct: async (id: string) => {
            markAsModified(id);
            const product = dataRef.current.inventory.find(p => p.id === id);
            if (!product) return;
            dataRef.current.removeProduct(id);
            await syncDb('inventory', 'delete', {}, id, activeBizIdRef.current);
            stableMethods.addLog('Envanterden Silindi', product.name, 'Yönetici Onaylı');
        },
        addExpense: async (e: any) => {
            const id = crypto.randomUUID();
            const ne = { ...e, id, user: authRef.current.currentUser?.name };
            dataRef.current.setAllExpenses((prev: Expense[]) => [ne, ...prev]);
            await syncDb('expenses', 'insert', ne, id, activeBizIdRef.current);
            stableMethods.addLog('Gider Eklendi', 'Muhasebe', '', e.desc);
        },
        addPackage: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id, usedSessions: 0, createdAt: new Date().toISOString() };
            data.setAllPackages((prev: Package[]) => [np, ...prev]);
            await syncDb('packages', 'insert', np, id, activeBizId);
            await stableMethods.addLog('Paket Eklendi', p.customerId, '', p.name);
        },
        addMembershipPlan: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            data.setMembershipPlans((prev: MembershipPlan[]) => [np, ...prev]);
            await syncDb('membership_plans', 'insert', np, id, activeBizId);
            await stableMethods.addLog('Üyelik Planı Oluşturuldu', 'Sistem', '', p.name);
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
            await stableMethods.addLog('Oda Eklendi', 'Mekan', '', r.name);
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
                data.setAllRooms((prev: any) => [...prev, room]);
                return;
            }
            await stableMethods.addLog('Kabin Silindi', room.name, 'Yönetici Onaylı');
        },
        analyzeSystem: async () => {
            if (!activeBizId) return;
            const newInsights: any[] = [];
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
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];
            const recentPayments = data.payments.filter(p => p.date >= sevenDaysAgoStr);
            const staffRevenue: Record<string, number> = {};
            recentPayments.forEach(p => {
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
            const churnRisks = data.customers.filter(c => stableMethods.determineChurnRisk(c));
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
            dataRef.current.setAiInsights(newInsights);
            for (const insight of newInsights.filter(i => i.impact === 'high')) {
                await syncDb('ai_insights', 'insert', insight, insight.id, activeBizIdRef.current);
            }
        },
        processCheckout: async (paymentData: any, options: any = {}) => {
            const { installments, soldProducts, earnedPoints, tipAmount, pointsUsed, packageId } = options;
            const bizId = activeBizIdRef.current;
            if (!bizId) return false;
            setSyncStatus('syncing');
            try {
                const paymentId = crypto.randomUUID();
                const payYear = new Date().getFullYear();
                const paymentRef = `ODM-${payYear}-${Math.floor(Math.random()*9000)+1000}`;
                const paymentRecord = { ...paymentData, id: paymentId, referenceCode: paymentRef, tipAmount: tipAmount || 0, soldProducts: soldProducts || [], createdAt: new Date().toISOString() };
                
                // 1. Loyalty Points Logic
                if (paymentData.customerId) {
                    const customer = dataRef.current.customers.find(c => c.id === paymentData.customerId);
                    if (customer) {
                        let newPoints = (customer.loyaltyPoints || 0) + (earnedPoints || 0) - (pointsUsed || 0);
                        dataRef.current.setAllCustomers((prev: any[]) => prev.map(c => c.id === customer.id ? { ...c, loyaltyPoints: newPoints } : c));
                        await syncDb('customers', 'update', { loyalty_points: newPoints }, customer.id, bizId);
                    }
                }

                // 2. Retail Stock Deduction
                if (soldProducts && soldProducts.length > 0) {
                    for (const sp of soldProducts) {
                        const product = dataRef.current.inventory.find(i => i.id === sp.id || i.name === sp.name);
                        if (product) {
                            const newStock = Math.max(0, (product.stock || 0) - (sp.quantity || 1));
                            dataRef.current.updateProduct(product.id, { stock: newStock });
                            await syncDb('inventory', 'update', { stock: newStock }, product.id, bizId);
                        }
                    }
                }

                // 3. Automated Commission & Expense
                const apptId = paymentData.appointmentId;
                if (apptId) {
                    const appt = dataRef.current.appointments.find(a => a.id === apptId);
                    const staffsToPay = [paymentData.staffId || appt?.staffId, ...(appt?.additionalStaff?.map((s:any) => s.id) || [])].filter(Boolean);
                    
                    for (const sid of staffsToPay) {
                        const amount = (paymentData.totalAmount || 0) / staffsToPay.length;
                        const comm = stableMethods.calculateCommission(sid, appt?.service || 'Genel', amount);
                        const expId = crypto.randomUUID();
                        const exp = {
                            id: expId, businessId: bizId, branchId: bizRef.current.currentBranch?.id,
                            category: 'PERSONEL_PRIMI', amount: comm, date: new Date().toISOString().split('T')[0],
                            description: `${paymentData.customerName || 'Müşteri'} - ${appt?.service || 'Hizmet'} Primi`,
                            payout_status: 'BEKLEMEDE', related_staff_id: sid, related_appointment_id: apptId,
                            createdAt: new Date().toISOString()
                        };
                        dataRef.current.setAllExpenses((prev: any[]) => [exp, ...prev]);
                        await syncDb('expenses', 'insert', exp, expId, bizId);
                    }
                }

                dataRef.current.setAllPayments((prev: any[]) => [paymentRecord, ...prev]);
                await syncDb('payments', 'insert', paymentRecord, paymentId, bizId);
                
                if (paymentData.appointmentId) {
                    const updates: any = { status: 'completed', isPaid: true, paymentId };
                    if (packageId) {
                        updates.packageId = packageId;
                        const pkg = dataRef.current.packages.find(p => p.id === packageId);
                        if (pkg) {
                            const newUsed = Math.min(pkg.totalSessions, (pkg.usedSessions || 0) + 1);
                            dataRef.current.setAllPackages((prev: any[]) => prev.map(p => p.id === packageId ? { ...p, usedSessions: newUsed } : p));
                            await syncDb('packages', 'update', { used_sessions: newUsed }, packageId, bizId);
                        }
                    }
                    dataRef.current.updateAppointment(paymentData.appointmentId, updates);
                    await syncDb('appointments', 'update', updates, paymentData.appointmentId, bizId);
                }
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
            const n = { id, customerId: cid, type, content, status: 'SENT', sentAt: new Date().toISOString(), triggerSource: 'manual' };
            dataRef.current.setAllNotifs((prev: NotificationLog[]) => [n, ...prev]);
            await syncDb('notification_logs', 'insert', n, id, activeBizIdRef.current);
        },
        addPackageDefinition: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            dataRef.current.setAllPackageDefinitions((prev: any) => [np, ...prev]);
            await syncDb('package_definitions', 'insert', np, id, activeBizIdRef.current);
        },
        updatePackageDefinition: async (id: string, p: any) => {
            dataRef.current.updatePackageDefinition(id, p);
            await syncDb('package_definitions', 'update', p, id, activeBizIdRef.current);
        },
        removePackageDefinition: async (id: string) => {
            const item = dataRef.current.packageDefinitions.find(p => p.id === id);
            if (!item) return false;
            dataRef.current.removePackageDefinition(id);
            const ok = await syncDb('package_definitions', 'delete', {}, id, activeBizIdRef.current);
            if (!ok && item) dataRef.current.setAllPackageDefinitions((prev: any) => [...prev, item]);
            return ok;
        },
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
        addCommissionRule: async (rule: any) => {
            const id = crypto.randomUUID();
            const nr = { ...rule, id };
            dataRef.current.setAllCommissionRules((prev: any) => [nr, ...prev]);
            await syncDb('commission_rules', 'insert', nr, id, activeBizIdRef.current);
        },
        removeCommissionRule: async (id: string) => {
            dataRef.current.setAllCommissionRules((prev: CommissionRule[]) => prev.filter((r: CommissionRule) => r.id !== id));
            await syncDb('commission_rules', 'delete', {}, id, activeBizIdRef.current);
        },
        addStaff: async (s: any) => {
            const id = crypto.randomUUID();
            const ns = { ...s, id, isVisibleOnCalendar: true, sortOrder: 0 };
            dataRef.current.setAllStaff((prev: Staff[]) => [...prev, ns]);
            await syncDb('staff', 'insert', ns, id, activeBizIdRef.current);
        },
        updateStaff: async (id: string, s: any) => {
            dataRef.current.setAllStaff((prev: Staff[]) => prev.map((st: Staff) => st.id === id ? { ...st, ...s } : st));
            await syncDb('staff', 'update', s, id, activeBizIdRef.current);
        },
        deleteStaff: async (id: string) => {
            const staff = dataRef.current.staffMembers.find(st => st.id === id);
            if (!staff) return;
            dataRef.current.setAllStaff((prev: Staff[]) => prev.filter(st => st.id !== id));
            await syncDb('staff', 'delete', {}, id, activeBizIdRef.current);
            stableMethods.addLog('Personel Silindi', staff.name);
        },
        updateStaffPermissions: async (userId: string, perms: string[]) => {
            await syncDb('users', 'update', { permissions: perms }, userId, activeBizIdRef.current);
        },
        addPaymentDefinition: async (p: any) => {
            const id = crypto.randomUUID();
            const np = { ...p, id };
            bizRef.current.setPaymentDefinitions((prev: PaymentDefinition[]) => [...prev, np]);
            await syncDb('payment_definitions', 'insert', np, id, activeBizIdRef.current);
        },
        updatePaymentDefinition: async (id: string, p: Partial<PaymentDefinition>) => {
            bizRef.current.setPaymentDefinitions((prev: PaymentDefinition[]) => prev.map((x: PaymentDefinition) => x.id === id ? { ...x, ...p } : x));
            await syncDb('payment_definitions', 'update', p, id, activeBizIdRef.current);
        },
        removePaymentDefinition: async (id: string) => {
            bizRef.current.setPaymentDefinitions((prev: PaymentDefinition[]) => prev.filter((x: PaymentDefinition) => x.id !== id));
            await syncDb('payment_definitions', 'delete', {}, id, activeBizIdRef.current);
        },
        addBankAccount: async (b: any) => {
            const id = crypto.randomUUID();
            const nb = { ...b, id };
            bizRef.current.setBankAccounts((prev: BankAccount[]) => [...prev, nb]);
            await syncDb('bank_accounts', 'insert', nb, id, activeBizIdRef.current);
        },
        updateBankAccount: async (id: string, b: Partial<BankAccount>) => {
            bizRef.current.setBankAccounts((prev: BankAccount[]) => prev.map((x: BankAccount) => x.id === id ? { ...x, ...b } : x));
            await syncDb('bank_accounts', 'update', b, id, activeBizIdRef.current);
        },
        removeBankAccount: async (id: string) => {
            bizRef.current.setBankAccounts((prev: BankAccount[]) => prev.filter((x: BankAccount) => x.id !== id));
            await syncDb('bank_accounts', 'delete', {}, id, activeBizIdRef.current);
        },
        addExpenseCategory: async (c: any) => {
            const id = crypto.randomUUID();
            const nc = { ...c, id };
            bizRef.current.setExpenseCategories((prev: ExpenseCategory[]) => [...prev, nc]);
            await syncDb('expense_categories', 'insert', nc, id, activeBizIdRef.current);
        },
        updateExpenseCategory: async (id: string, c: Partial<ExpenseCategory>) => {
            bizRef.current.setExpenseCategories((prev: ExpenseCategory[]) => prev.map((x: ExpenseCategory) => x.id === id ? { ...x, ...c } : x));
            await syncDb('expense_categories', 'update', c, id, activeBizIdRef.current);
        },
        removeExpenseCategory: async (id: string) => {
            bizRef.current.setExpenseCategories((prev: ExpenseCategory[]) => prev.filter((x: ExpenseCategory) => x.id !== id));
            await syncDb('expense_categories', 'delete', {}, id, activeBizIdRef.current);
        },
        addReferralSource: async (s: any) => {
            const id = crypto.randomUUID();
            const ns = { ...s, id };
            bizRef.current.setReferralSources((prev: ReferralSource[]) => [...prev, ns]);
            await syncDb('referral_sources', 'insert', ns, id, activeBizIdRef.current);
        },
        updateReferralSource: async (id: string, s: Partial<ReferralSource>) => {
            bizRef.current.setReferralSources((prev: ReferralSource[]) => prev.map((x: ReferralSource) => x.id === id ? { ...x, ...s } : x));
            await syncDb('referral_sources', 'update', s, id, activeBizIdRef.current);
        },
        removeReferralSource: async (id: string) => {
            bizRef.current.setReferralSources((prev: ReferralSource[]) => prev.filter((x: ReferralSource) => x.id !== id));
            await syncDb('referral_sources', 'delete', {}, id, activeBizIdRef.current);
        },
        addConsentFormTemplate: async (t: any) => {
            const id = crypto.randomUUID();
            const nt = { ...t, id };
            bizRef.current.setConsentFormTemplates((prev: ConsentFormTemplate[]) => [...prev, nt]);
            await syncDb('consent_form_templates', 'insert', nt, id, activeBizIdRef.current);
        },
        updateConsentFormTemplate: async (id: string, t: Partial<ConsentFormTemplate>) => {
            bizRef.current.setConsentFormTemplates((prev: ConsentFormTemplate[]) => prev.map((x: ConsentFormTemplate) => x.id === id ? { ...x, ...t } : x));
            await syncDb('consent_form_templates', 'update', t, id, activeBizIdRef.current);
        },
        removeConsentFormTemplate: async (id: string) => {
            bizRef.current.setConsentFormTemplates((prev: ConsentFormTemplate[]) => prev.filter((x: ConsentFormTemplate) => x.id !== id));
            await syncDb('consent_form_templates', 'delete', {}, id, activeBizIdRef.current);
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
        addUsageNorm: async (norm: any) => {
            const id = crypto.randomUUID();
            const nn = { ...norm, id, businessId: activeBizId };
            data.setUsageNorms((prev: any) => [...prev, nn]);
            await syncDb('inventory_usage_norms', 'insert', nn, id, activeBizId);
        },
        updateUsageNorm: async (id: string, updates: any) => {
            data.setUsageNorms((prev: any[]) => prev.map(n => n.id === id ? { ...n, ...updates } : n));
            await syncDb('inventory_usage_norms', 'update', updates, id, activeBizId);
        },
        addInventoryCategory: async (c: any) => {
            const id = crypto.randomUUID();
            const nc = { ...c, id, businessId: activeBizId };
            data.setAllInventoryCategories((prev: any) => [...prev, nc]);
            await syncDb('inventory_categories', 'insert', nc, id, activeBizId);
        },
        updateInventoryCategory: async (id: string, updates: any) => {
            data.setAllInventoryCategories((prev: any[]) => prev.map(c => c.id === id ? { ...c, ...updates } : c));
            await syncDb('inventory_categories', 'update', updates, id, activeBizId);
        },
        removeInventoryCategory: async (id: string) => {
            data.setAllInventoryCategories((prev: any[]) => prev.filter(c => c.id !== id));
            await syncDb('inventory_categories', 'delete', {}, id, activeBizId);
        },
        addCustomerMedia: async (m: any) => {
            const id = crypto.randomUUID();
            const nm = { ...m, id, businessId: activeBizId, createdAt: new Date().toISOString() };
            data.setAllCustomerMedia((prev: any) => [nm, ...prev]);
            await syncDb('customer_media', 'insert', nm, id, activeBizId);
        },
        deleteCustomerMedia: async (id: string) => {
            data.setAllCustomerMedia((prev: any[]) => prev.filter(m => m.id !== id));
            await syncDb('customer_media', 'delete', {}, id, activeBizId);
        },
        calculateDynamicPrice: (price: number, timeStr: string) => {
            const [h] = timeStr.split(':').map(Number);
            if (h >= 9 && h < 12) return { price: price * 0.8, reason: 'Happy Hour İndirimi (%20)' };
            return { price, reason: null };
        },
        closeDay: async (reportData: any) => {
            const bizId = activeBizIdRef.current;
            if (!bizId) return false;
            const today = stableMethods.getTodayDate();
            const paymentsToday = stableMethods.getTodayPayments();
            const total = paymentsToday.reduce((sum: number, p: any) => sum + p.totalAmount, 0) || 0;
            const id = crypto.randomUUID();
            const report = { ...reportData, id, businessId: bizId, branchId: bizRef.current.currentBranch?.id, closedBy: authRef.current.currentUser?.name || 'Sistem', createdAt: new Date().toISOString() };
            dataRef.current.setZReports((prev: any[]) => [...prev, report]);
            const success = await syncDb('z_reports', 'insert', report, id, bizId);
            if (success) {
                stableMethods.downloadZReportPDF(report);
                stableMethods.addLog('Gün Kapatıldı', 'Sistem', '', `Ciro: ${total}`);
            }
            return !!success;
        },
        updateBusiness: async (updates: Partial<Business>) => {
            const bizId = activeBizIdRef.current;
            if (!bizId) return false;
            bizRef.current.setCurrentTenant((prev: Business | null) => prev ? { ...prev, ...updates } : null);
            return !!(await syncDb('businesses', 'update', updates, bizId, bizId));
        },
        runImperialAudit: () => {
            const alerts: any[] = [];
            const today = new Date().toISOString().split('T')[0];
            const customers = dataRef.current.customers;
            const appts = dataRef.current.appointments;
            
            // 1. Ghost Room Audit
            dataRef.current.rooms.forEach(room => {
                if (room.status === 'occupied' && !appts.some(a => a.date === today && a.roomId === room.id && a.status === 'in-service')) {
                    alerts.push({ type: 'critical', title: 'Hayalet Oda', desc: `${room.name} dolu ama aktif randevu yok!`, targetId: room.id });
                }
            });

            // 2. Revenue Leakage Audit (Paid/Unpaid verification)
            appts.forEach(a => {
                if (a.status === 'completed' && !a.isPaid && a.price > 0 && !a.isSealed) {
                    alerts.push({ type: 'critical', title: 'Tahsilat Kaçağı', desc: `${a.customerName} - ${a.service} tamamlandı ama ödeme ALINMADI!`, targetId: a.id });
                }
                if (a.isSealed) {
                    // isSealed items are protected but we don't alert on them unless there's an inconsistency
                }
            });

            // 3. Birthday Audit
            const bdayToday = stableMethods.getBirthdaysToday();
            bdayToday.forEach((c: Customer) => {
                alerts.push({ type: 'info', title: 'Bugün Doğum Günü', desc: `${c.name} için özel bir kampanya sunulabilir.`, targetId: c.id });
            });

            // 4. Low Stock Audit
            dataRef.current.inventory.forEach(p => {
                if ((p.stock || 0) < (p.lowStockThreshold || 5)) {
                    alerts.push({ type: 'warning', title: 'Kritik Stok', desc: `${p.name} azalıyor! (Mevcut: ${p.stock})`, targetId: p.id });
                }
            });

            return alerts;
        },
        isLicenseExpired,
        broadcastAnnouncement: async (title: string, content: string, type: any) => {
            const id = crypto.randomUUID();
            const ann = { id, title, content, type, businessId: activeBizIdRef.current || null, isActive: true, createdAt: new Date().toISOString() };
            await syncDb('system_announcements', 'insert', ann, id, activeBizIdRef.current || '');
        },
        addBranch: async (branch: any) => {
            const id = crypto.randomUUID();
            const nb = { ...branch, id, businessId: activeBizIdRef.current, createdAt: new Date().toISOString() };
            bizRef.current.setBranches((prev: any) => [...prev, nb]);
            await syncDb('branches', 'insert', nb, id, activeBizIdRef.current);
        },
        updateBranch: async (id: string, branch: any) => {
            bizRef.current.setBranches((prev: any) => prev.map((b: any) => b.id === id ? { ...b, ...branch } : b));
            await syncDb('branches', 'update', branch, id, activeBizIdRef.current);
        },
        deleteBranch: async (id: string) => {
            bizRef.current.setBranches((prev: any) => prev.filter((b: any) => b.id !== id));
            await syncDb('branches', 'delete', null, id, activeBizIdRef.current);
        },
        updateRates: (nr: CurrencyRate[]) => bizRef.current.setAllRates(nr),
        downloadZReportPDF: (report: any) => {
            const { generateZReportPDF } = require('@/lib/utils/pdf-generator');
            generateZReportPDF(report, bizRef.current.currentTenant);
        },
        // --- RESTORED & NEW METHODS ---
        transferProduct: async (transfer: any) => {
            const bizId = activeBizIdRef.current;
            if (!bizId) return false;
            const { productId, fromBranchId, toBranchId, quantity, transferType, pricePerUnit } = transfer;
            
            // Adjust stocks
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
            
            // Log transfer
            const tid = crypto.randomUUID();
            await syncDb('inventory_transfers', 'insert', { ...transfer, id: tid, businessId: bizId, createdAt: new Date().toISOString() }, tid, bizId);
            
            // Handle financial impact (Income/Expense linkage)
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
                const daysLeft = Math.floor((p.stock || 0) / 0.5); // Fallback: 0.5 units/day
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
        addLog,
        addZReport,
        calculateCommission,
        determineChurnRisk,
        getTodayDate,
        getTodayPayments,
        getCustomerAppointments,
        getCustomerPayments,
        getChurnRiskCustomers,
        getUpsellPotentialCustomers,
        getBirthdaysToday
    }), [
        fetchData, markAsModified, biz.clearCatalog, can, addLog, addZReport, calculateCommission, determineChurnRisk, getTodayDate, getTodayPayments, 
        getCustomerAppointments, getCustomerPayments, getChurnRiskCustomers, getUpsellPotentialCustomers, getBirthdaysToday
    ]);

    const shieldedAppointments = useMemo(() => data.appointments.filter(a => !recentlyModified.has(a.id)), [data.appointments, recentlyModified]);
    const shieldedBlocks = useMemo(() => data.blocks.filter(b => !recentlyModified.has(b.id)), [data.blocks, recentlyModified]);
    const shieldedCustomers = useMemo(() => data.customers.filter(c => !recentlyModified.has(c.id)), [data.customers, recentlyModified]);
    const shieldedInventory = useMemo(() => data.inventory.filter(p => !recentlyModified.has(p.id)), [data.inventory, recentlyModified]);

    return (
        <StoreMethodsContext.Provider value={stableMethods}>
            <StoreDataContext.Provider value={{
                currentUser: auth.currentUser,
                currentBusiness: biz.currentTenant,
                currentBranch: biz.currentBranch,
                isOnline: isOnline,
                syncStatus: syncStatus,
                isManagerAuthorized: isManagerAuthorized,
                allBusinesses: biz.allBusinesses,
                allUsers: auth.allUsers,
                impersonatedBusinessId: auth.impersonatedBusinessId,
                isImpersonating: auth.isImpersonating,
                currentStaff: auth.currentUser ? data.staffMembers.find(s => s.id === auth.currentUser?.staffId || s.name === auth.currentUser?.name) : undefined,
                customers: shieldedCustomers,
                allCustomers: shieldedCustomers,
                packages: data.packages,
                allPackages: data.packages,
                membershipPlans: data.membershipPlans,
                customerMemberships: data.customerMemberships,
                appointments: shieldedAppointments,
                allAppointments: shieldedAppointments,
                blocks: shieldedBlocks,
                allBlocks: shieldedBlocks,
                payments: data.payments || [],
                allPayments: data.payments || [],
                staffMembers: data.staffMembers,
                allStaff: data.staffMembers,
                debts: data.debts,
                allDebts: data.debts,
                branches: biz.branches,
                allLogs: data.allLogs,
                allNotifs: data.allNotifs,
                aiInsights: data.aiInsights,
                customerMedia: data.customerMedia,
                inventory: shieldedInventory,
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
                isLicenseExpired
            }}>
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
