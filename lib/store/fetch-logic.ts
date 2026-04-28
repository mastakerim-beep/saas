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
    const coreTables = [
        'businesses', 'branches', 'staff', 'rooms', 
        'services', 'app_users', 'tenant_modules', 'booking_settings'
    ];

    const isSaaS = currentUser?.role === 'SaaS_Owner';
    const isGuest = !currentUser;
    
    // --- IDENTITY RESOLUTION ---
    let actualBizId = bizId;
    
    // If Guest or SaaS and on a slug, but bizId is missing, resolve it NOW
    if ((isSaaS || isGuest) && !actualBizId && slug) {
        try {
            console.log("🔍 [Aura Sync] Identity Warp: Resolving business ID from slug...");
            const { data: bData } = await supabase.from('businesses').select('id').eq('slug', slug).single();
            if (bData?.id) {
                actualBizId = bData.id;
                console.log("✅ [Aura Sync] Identity Locked:", actualBizId);
            }
        } catch (e) {
            console.error("Failed to resolve identity from slug:", e);
        }
    }

    const targetId = actualBizId || currentUser?.businessId;
    
    // Public safe tables for Guest mode
    const publicTables = [
        'businesses', 'branches', 'services', 'staff', 
        'booking_settings', 'membership_plans'
    ];

    const fullTables = [
        'appointments', 'customers', 'membership_plans', 'customer_memberships', 
        'payments', 'debts', 'inventory', 'expenses', 
        'audit_logs', 'customer_media', 'packages', 'package_definitions', 
        'commission_rules', 'calendar_blocks', 'notification_logs', 'z_reports',
        'payment_definitions', 'bank_accounts', 'expense_categories', 
        'referral_sources', 'consent_form_templates', 'quotes',
        'system_announcements', 'marketing_rules', 'dynamic_pricing_rules', 
        'customer_wallets', 'wallet_transactions', 'consultation_body_maps', 
        'inventory_usage_norms', 'loyalty_settings', 'webhooks', 
        'inventory_categories', 'inventory_transfers', 'package_usage_history', 'customer_biometrics'
    ];

    let tablesToFetch = isGuest ? publicTables : [...coreTables, ...fullTables];

    if (!targetId && !isSaaS) {
        console.warn("⚠️ Fetch aborted: No targetId and not SaaS");
        setters.setSyncStatus('idle'); // Ensure UI unlock on abort
        return;
    }

    if (signal?.aborted) return;

    console.time("Aura Fetch Speed");
    setters.setSyncStatus('syncing');

    const dataMap: any = {};

    try {
        // --- PHASE 1: CORE DATA (Fast track) ---
        const tablesInThisPhase = isGuest ? publicTables : coreTables;
        
        const fetchTable = async (table: string) => {
            try {
                const result = await retryRequest(async () => {
                    if (signal?.aborted) throw new Error('Aborted');
                    let q = supabase.from(table).select('*');
                    if (signal) q = q.abortSignal(signal);
                    
                    const idToUse = bizId || targetId;
                    
                    // TARGETED SCALE FETCH: 
                    if (table === 'businesses' && isSaaS && !bizId && slug) {
                        q = q.eq('slug', slug);
                    } else if (idToUse && !(table === 'businesses' && isSaaS && !bizId && !slug)) {
                        if (table === 'businesses') q = q.eq('id', idToUse);
                        else {
                            q = q.eq('business_id', idToUse);
                        }
                    }

                    // LIMIT HEAVY TABLES
                    if (table === 'audit_logs' || table === 'notification_logs') {
                        q = q.order('created_at', { ascending: false }).limit(200);
                    }
                    if (table === 'z_reports' || table === 'payments') {
                        q = q.order('created_at', { ascending: false }).limit(1000);
                    }

                    if (startDate && (table === 'payments' || table === 'expenses')) q = q.gte('date', startDate);
                    if (endDate && (table === 'payments' || table === 'expenses')) q = q.lte('date', endDate);
                    
                    const { data, error } = await q;
                    if (error) throw error;
                    return data;
                });
                dataMap[table] = toCamel(result || []);
                return { table, data: dataMap[table] };
            } catch (e: any) {
                console.error(`❌ Table Fetch Error: ${table}`, e);
                dataMap[table] = [];
                return { table, data: [] };
            }
        };

        // Fetch Core Tables First
        await Promise.allSettled(tablesInThisPhase.map(fetchTable));

        // APPLY CORE DATA IMMEDIATELY
        if (dataMap.businesses) {
            const businesses = dataMap.businesses;
            const isGlobalFetch = isSaaS && !bizId && !slug;
            if (isGlobalFetch) {
                setters.setAllBusinesses(businesses.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '')));
            } else if (businesses.length > 0) {
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
            
            const targetBusiness = businesses.find((b: any) => b.id === targetId);
            if (targetBusiness) {
                setters.setCurrentTenant((prev: any) => JSON.stringify(prev) === JSON.stringify(targetBusiness) ? prev : targetBusiness);
            }
        }

        if (dataMap.branches) {
            setters.setBranches?.(dataMap.branches);
            if (dataMap.branches.length > 0) {
                const branches = dataMap.branches;
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
        }
        
        setters.setAllStaff?.(dataMap.staff || []);
        setters.setAllRooms?.(dataMap.rooms || []);
        setters.setAllServices?.(dataMap.services || []);
        setters.setAllUsers?.(dataMap.app_users || []);
        setters.setTenantModules?.(dataMap.tenant_modules || []);
        setters.setBookingSettings?.(dataMap.booking_settings?.[0] || null);

        // --- PHASE 2: REMAINING DATA (Background) ---
        if (!isGuest) {
            // Non-blocking fetch for the rest
            Promise.allSettled(fullTables.map(fetchTable)).then(() => {
                if (signal?.aborted) return;
                
                // Final setters for remaining data
                setters.setAllAppointments?.(toCamel(dataMap.appointments));
                setters.setAllCustomers?.(toCamel(dataMap.customers));
                setters.setAllPayments?.(toCamel(dataMap.payments));
                setters.setMembershipPlans?.(dataMap.membership_plans || []);
                setters.setCustomerMemberships?.(dataMap.customer_memberships || []);
                setters.setAllDebts?.(dataMap.debts || []);
                setters.setAllInventory?.(dataMap.inventory || []);
                setters.setAllExpenses?.(dataMap.expenses || []);
                setters.setAllPackageDefinitions?.(dataMap.package_definitions || []);
                setters.setAllPackages?.(dataMap.packages || []);
                setters.setAllCommissionRules?.(dataMap.commission_rules || []);
                setters.setAllLogs?.(dataMap.audit_logs || []);
                setters.setAllCustomerMedia?.(dataMap.customer_media || []);
                setters.setZReports?.(dataMap.z_reports || []);
                setters.setPaymentDefinitions?.(dataMap.payment_definitions || []);
                setters.setBankAccounts?.(dataMap.bank_accounts || []);
                setters.setExpenseCategories?.(dataMap.expense_categories || []);
                setters.setReferralSources?.(dataMap.referral_sources || []);
                setters.setConsentFormTemplates?.(dataMap.consent_form_templates || []);
                setters.setAllQuotes?.(dataMap.quotes || []);
                setters.setSystemAnnouncements?.(dataMap.system_announcements || []);
                setters.setMarketingRules?.(dataMap.marketing_rules || []);
                setters.setPricingRules?.(dataMap.dynamic_pricing_rules || []);
                setters.setWallets?.(dataMap.customer_wallets || []);
                setters.setWalletTransactions?.(dataMap.wallet_transactions || []);
                setters.setBodyMaps?.(dataMap.consultation_body_maps || []);
                setters.setUsageNorms?.(dataMap.inventory_usage_norms || []);
                setters.setLoyaltySettings?.(dataMap.loyalty_settings?.[0] || null);
                setters.setInventoryTransfers?.(dataMap.inventory_transfers || []);
                setters.setWebhooks?.(dataMap.webhooks || []);
                setters.setAllNotifs?.(dataMap.notification_logs || []);
                setters.setAllBlocks?.(dataMap.calendar_blocks || []);
                setters.setAllInventoryCategories?.(dataMap.inventory_categories || []);
                setters.setPackageUsageHistory?.(dataMap.package_usage_history || []);
                setters.setCustomerBiometrics?.(dataMap.customer_biometrics || []);
                
                setters.setSyncStatus('idle');
                console.log("✨ [Aura Sync] Background Hydration Complete");
            });
        } else {
            setters.setSyncStatus('idle');
        }

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
