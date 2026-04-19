import { supabase } from '@/lib/supabase';
import { toCamel, retryRequest, generateReferenceCode, generatePaymentRef } from '@/lib/utils/converter';
import { AppUser, Business, Branch } from './types';

export const fetchData = async (
    bizId: string | undefined,
    currentUser: AppUser | null,
    setters: any,
    force = false,
    startDate?: string,
    endDate?: string,
    signal?: AbortSignal,
    slug?: string // New parameter for targeted resolution
) => {
    const tables = [
        'businesses', 'branches', 'appointments', 'customers', 
        'membership_plans', 'customer_memberships', 'payments', 
        'debts', 'staff', 'inventory', 'rooms', 'expenses', 
        'services', 'app_users', 'audit_logs', 'customer_media', 
        'packages', 'package_definitions', 'commission_rules', 'calendar_blocks', 'notification_logs', 'z_reports',
        'payment_definitions', 'bank_accounts', 'expense_categories', 'referral_sources', 'consent_form_templates', 'quotes',
        'system_announcements', 'tenant_modules', 'marketing_rules', 'dynamic_pricing_rules', 'customer_wallets', 'wallet_transactions',
        'consultation_body_maps', 'inventory_usage_norms', 'loyalty_settings', 'webhooks', 'inventory_categories'
    ];

    const isSaaS = currentUser?.role === 'SaaS_Owner';
    
    // CRITICAL: If I am a SaaS owner on a slug, but bizId is undefined, 
    // it means it's still being resolved from the business list.
    // I must NOT use currentUser?.businessId as targetId because that would fetch SaaS Org data.
    // HYPER-SCALE OPTIMIZATION: 
    // If we have a bizId (cached) or we are non-SaaS, we don't need the specialized 'businesses' fetch phase.
    const isBusinessesEmpty = !setters.allBusinesses?.length;
    const isSlugPending = isSaaS && !bizId && isBusinessesEmpty;
    const targetId = isSlugPending ? undefined : (bizId || currentUser?.businessId);
    
    // If we are a SaaS owner but businesses are ALREADY LOADED (via persistence),
    // we should NOT do a Phase 1 fetch. We skip directly to Phase 2.
    const tablesToFetch = isSlugPending ? ['businesses'] : tables;
    
    if (isSlugPending) {
        console.log("🚧 [Aura Sync] Identity Lock: Fetching ONLY specialized business list...");
    }

    if (!targetId && !isSaaS) {
        console.warn("⚠️ Fetch aborted: No targetId and not SaaS");
        return;
    }

    if (signal?.aborted) return;

    console.time("Aura Fetch Speed");
    setters.setSyncStatus('syncing');

    const dataMap: any = {};

    try {
        await Promise.allSettled(tablesToFetch.map(async (table) => {
            try {
                const result = await retryRequest(async () => {
                    if (signal?.aborted) throw new Error('Aborted');
                    let q = supabase.from(table).select('*');
                    if (signal) q = q.abortSignal(signal);
                    
                    const idToUse = bizId || targetId;
                    
                    // TARGETED SCALE FETCH: 
                    // If we are SaaS and don't have a bizId yet, but have a slug, fetch ONLY that business.
                    if (table === 'businesses' && isSaaS && !bizId && slug) {
                        q = q.eq('slug', slug);
                    } else if (idToUse) {
                        // Standard tenant filtering
                        if (table === 'businesses') q = q.eq('id', idToUse);
                        else if ((table === 'audit_logs' || table === 'payments' || table === 'notification_logs') && isSaaS && !bizId) {
                            // SaaS Global Dash: Do not filter by business_id for logs and SaaS payments
                            // This allows seeing system-wide activity and income
                            q = q.order('created_at', { ascending: false }).limit(50);
                        } else {
                            q = q.eq('business_id', idToUse);
                        }
                    }

                    if (startDate && (table === 'payments' || table === 'expenses')) q = q.gte('date', startDate);
                    if (endDate && (table === 'payments' || table === 'expenses')) q = q.lte('date', endDate);
                    
                    const { data, error } = await q;
                    if (error) throw error;
                    return data;
                });
                dataMap[table] = toCamel(result || []);
            } catch (e: any) {
                if (e.name === 'AbortError' || e.message === 'Aborted') {
                    // SPECIAL CASE: Even if aborted, if we have business data, we want it!
                    // This prevents the 'no businesses' loop on slow loads.
                    if (table === 'businesses' && dataMap.businesses) {
                        console.log("💎 [Aura Sync] Applying businesses data despite abortion.");
                        setters.setAllBusinesses(toCamel(dataMap.businesses));
                    }
                    return;
                }
                console.error(`❌ Table Fetch Error: ${table}`, e);
                dataMap[table] = []; 
            }
        }));
        
        // HYPER-SCALE MERGE: Instead of replacing the full business list with one item,
        // we merge the fetched data into the existing catalog (SWR style).
        const businesses = dataMap.businesses || [];
        const isGlobalFetch = isSaaS && !bizId && !slug;

        // AUTHENTIC SYNC: If we are fetching the whole catalog (global), the result is the absolute truth.
        // If it's empty, the local state MUST be cleared.
        if (isGlobalFetch) {
            setters.setAllBusinesses(businesses.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '')));
        } else if (businesses.length > 0) {
            // MERGE SYNC (Incremental): Only merge if we have results.
            setters.setAllBusinesses((prev: any[]) => {
                const merged = [...prev];
                businesses.forEach((newBiz: any) => {
                    const idx = merged.findIndex(v => v.id === newBiz.id);
                    if (idx > -1) merged[idx] = newBiz;
                    else merged.push(newBiz);
                });
                return merged.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || ''));
            });
        }

        if (signal?.aborted) {
            console.log("🛑 Global Fetch Aborted - Shielding Volatile State");
            return;
        }

        // IDENTITY LOCK: Düşük olasılıklı olsa da, fetch tamamlandığında hâlâ bir targetId yoksa 
        // ve SaaS sahibi değilsek, state'i yanlış verilerle (boşluklarla) kirletme.
        if (!targetId && !isSaaS) {
            console.warn("🛡️ [Aura Sync] Shielded State: Fetch finished but targetId lost. Aborting write.");
            return;
        }
        
        const branches = dataMap.branches || [];
        setters.setBranches((prev: any[]) => JSON.stringify(prev) === JSON.stringify(branches) ? prev : branches);
        
        const rawAppointments = dataMap.appointments || [];
        // Mevcut randevulara apptRef ata (DB'de yoksa)
        const apptYear = new Date().getFullYear();
        const apptPrefix = 'RND';
        const assignedApptRefs = new Set(
            rawAppointments.filter((a: any) => a.apptRef).map((a: any) => a.apptRef as string)
        );
        const appointments = rawAppointments.map((a: any) => {
            if (!a.apptRef) {
                const existingNums = Array.from(assignedApptRefs)
                    .filter((code): code is string => typeof code === 'string' && code.startsWith(`${apptPrefix}-${apptYear}-`))
                    .map(code => { const parts = code.split('-'); return parts.length > 2 ? parseInt(parts[2]) : 0; });
                const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 0;
                const newRef = `${apptPrefix}-${apptYear}-${String(maxNum + 1).padStart(4, '0')}`;
                assignedApptRefs.add(newRef);
                return { ...a, apptRef: newRef };
            }
            return a;
        });
        setters.setAllAppointments((prev: any[]) => JSON.stringify(prev) === JSON.stringify(appointments) ? prev : appointments);
        
        const rawCustomers = dataMap.customers || [];
        // BUG FIX: Her müşteri için biriken listeyle üret — hepsi aynı kodu almasın
        const assignedCodes = new Set(rawCustomers.filter((c: any) => c.referenceCode).map((c: any) => c.referenceCode));
        const updatedCustomers = rawCustomers.map((c: any) => {
            if (!c.referenceCode) {
                const branch = branches.find((b: any) => b.id === c.branchId) || branches[0];
                // Biriken listedeki müşterilerle çakışmayacak kod üret
                const allWithAssigned = rawCustomers.map((rc: any) => 
                    assignedCodes.has(rc.referenceCode) || rc.referenceCode ? rc : { ...rc, referenceCode: 'PLACEHOLDER' }
                );
                // Prefix'e göre mevcut max numarayı bul
                const prefix = (branch?.name || 'GEN').substring(0, 3).toUpperCase();
                const existingNums = Array.from(assignedCodes)
                    .filter((code: any) => typeof code === 'string' && code.startsWith(prefix))
                    .map((code: any) => { const parts = code.split('-'); return parts.length > 1 ? parseInt(parts[1]) : 0; });
                const maxNum = existingNums.length > 0 ? Math.max(...existingNums) : 1000;
                const nextNum = Math.max(1000, maxNum) + 1;
                const newCode = `${prefix}-${nextNum}`;
                assignedCodes.add(newCode);
                return { ...c, referenceCode: newCode };
            }
            return c;
        });
        setters.setAllCustomers((prev: any[]) => JSON.stringify(prev) === JSON.stringify(updatedCustomers) ? prev : updatedCustomers);
        
        const rawPayments = dataMap.payments || [];
        // Payment ref: UUID'den türetilmiş sabit kısa kod (her fetch'te değişmez)
        const paymentsWithRefs = rawPayments.map((p: any) => ({ 
            ...p, 
            referenceCode: p.referenceCode || (p.id ? p.id.substring(0, 8).toUpperCase() : generatePaymentRef())
        }));
        setters.setAllPayments((prev: any[]) => JSON.stringify(prev) === JSON.stringify(paymentsWithRefs) ? prev : paymentsWithRefs);

        setters.setMembershipPlans(dataMap.membership_plans || []);
        setters.setCustomerMemberships(dataMap.customer_memberships || []);
        setters.setAllDebts(dataMap.debts || []);
        setters.setAllStaff(dataMap.staff || []);
        setters.setAllInventory(dataMap.inventory || []);
        setters.setAllRooms(dataMap.rooms || []);
        setters.setAllExpenses(dataMap.expenses || []);
        setters.setAllServices(dataMap.services || []);
        setters.setAllPackageDefinitions(dataMap.package_definitions || []);
        setters.setAllUsers?.(dataMap.app_users || []);
        console.log(`✅ Fetch Success - Staff: ${dataMap.staff?.length || 0}, Appts: ${dataMap.appointments?.length || 0}, Biz: ${dataMap.businesses?.length || 0}`);
        setters.setAllLogs?.(dataMap.audit_logs || []);
        setters.setAllCustomerMedia(dataMap.customer_media || []);
        setters.setZReports(dataMap.z_reports || []);
        setters.setPaymentDefinitions(dataMap.payment_definitions || []);
        setters.setBankAccounts(dataMap.bank_accounts || []);
        setters.setExpenseCategories(dataMap.expense_categories || []);
        setters.setReferralSources(dataMap.referral_sources || []);
        setters.setConsentFormTemplates(dataMap.consent_form_templates || []);
        setters.setAllQuotes(dataMap.quotes || []);
        setters.setSystemAnnouncements?.(dataMap.system_announcements || []);
        setters.setTenantModules(dataMap.tenant_modules || []);
        setters.setMarketingRules(dataMap.marketing_rules || []);
        setters.setPricingRules(dataMap.dynamic_pricing_rules || []);
        setters.setWallets(dataMap.customer_wallets || []);
        setters.setWalletTransactions(dataMap.wallet_transactions || []);
        setters.setBodyMaps(dataMap.consultation_body_maps || []);
        setters.setUsageNorms(dataMap.inventory_usage_norms || []);
        setters.setLoyaltySettings(dataMap.loyalty_settings?.[0] || null);
        setters.setWebhooks(dataMap.webhooks || []);
        setters.setAllNotifs(dataMap.notification_logs || []);
        setters.setAllBlocks(dataMap.calendar_blocks || []);
        setters.setAllInventoryCategories(dataMap.inventory_categories || []);
        
        if (branches.length > 0) {
            const savedBranchId = localStorage.getItem('aura_last_branch');
            const userBranchId = currentUser?.branchId;
            let branchToUse = branches[0];
            if (savedBranchId && branches.some((b: any) => b.id === savedBranchId)) {
                branchToUse = branches.find((b: any) => b.id === savedBranchId);
            } else if (userBranchId && branches.some((b: any) => b.id === userBranchId)) {
                branchToUse = branches.find((b: any) => b.id === userBranchId);
            }
            setters.setCurrentBranch((prev: any) => (prev?.id === branchToUse?.id) ? prev : branchToUse);
        }

        const targetBusiness = businesses.find((b: any) => b.id === targetId);
        if (targetBusiness) {
            setters.setCurrentTenant((prev: any) => JSON.stringify(prev) === JSON.stringify(targetBusiness) ? prev : targetBusiness);
            const newStart = targetBusiness.calendarStartHour || 9;
            const newEnd = targetBusiness.calendarEndHour || 21;
            setters.setSettings((prev: any) => (prev.startHour === newStart && prev.endHour === newEnd) ? prev : ({
                ...prev,
                startHour: newStart,
                endHour: newEnd
            }));
        }

        setters.setSyncStatus('idle');
    } catch (error: any) {
        if (error.name === 'AbortError' || error.message === 'Aborted') {
            throw error;
        }
        console.error("Fetch Error:", error);
        setters.setSyncStatus('error');
        throw error;
    } finally {
        console.timeEnd("Aura Fetch Speed");
    }
};
