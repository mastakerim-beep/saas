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
    signal?: AbortSignal
) => {
    const isSaaS = currentUser?.role === 'SaaS_Owner';
    const targetId = bizId || currentUser?.businessId;
    
    // console.log("🔍 Aura Fetch Started:", { bizId, targetId, isSaaS });

    if (!targetId && !isSaaS) {
        console.warn("⚠️ Fetch aborted: No targetId and not SaaS");
        return;
    }

    if (signal?.aborted) return;

    console.time("Aura Fetch Speed");
    setters.setSyncStatus('syncing');

    const tables = [
        'businesses', 'branches', 'appointments', 'customers', 
        'membership_plans', 'customer_memberships', 'payments', 
        'debts', 'staff', 'inventory', 'rooms', 'expenses', 
        'services', 'app_users', 'audit_logs', 'customer_media', 
        'packages', 'package_definitions', 'commission_rules', 'calendar_blocks', 'notification_logs', 'z_reports',
        'payment_definitions', 'bank_accounts', 'expense_categories', 'referral_sources', 'consent_form_templates', 'quotes',
        'system_announcements', 'tenant_modules', 'marketing_rules', 'dynamic_pricing_rules', 'customer_wallets', 'wallet_transactions',
        'consultation_body_maps', 'inventory_usage_norms'
    ];

    const dataMap: any = {};

    try {
        await Promise.allSettled(tables.map(async (table) => {
            try {
                const result = await retryRequest(async () => {
                    if (signal?.aborted) throw new Error('Aborted');
                    let q = supabase.from(table).select('*');
                    if (signal) q = q.abortSignal(signal);
                    
                    const idToUse = bizId || targetId;
                    const skipFilter = isSaaS && !bizId && table === 'businesses';

                    if (idToUse && !skipFilter) {
                        if (table === 'businesses') q = q.eq('id', idToUse);
                        else q = q.eq('business_id', idToUse);
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
                    // Do not log or clear data if aborted
                    return;
                }
                console.error(`❌ Table Fetch Error: ${table}`, e);
                dataMap[table] = []; 
            }
        }));
        
        if (signal?.aborted) {
            console.log("🛑 Global Fetch Aborted - Shielding State (Preventing UI flicker)");
            return;
        }

        // Batch updates with reference stability checks
        const businesses = dataMap.businesses || [];
        setters.setAllBusinesses((prev: any[]) => JSON.stringify(prev) === JSON.stringify(businesses) ? prev : businesses);
        
        const branches = dataMap.branches || [];
        setters.setBranches((prev: any[]) => JSON.stringify(prev) === JSON.stringify(branches) ? prev : branches);
        
        const appointments = dataMap.appointments || [];
        setters.setAllAppointments((prev: any[]) => JSON.stringify(prev) === JSON.stringify(appointments) ? prev : appointments);
        
        const rawCustomers = dataMap.customers || [];
        const updatedCustomers = rawCustomers.map((c: any) => {
            if (!c.referenceCode) {
                const branch = branches.find((b: any) => b.id === c.branchId) || branches[0];
                return { ...c, referenceCode: generateReferenceCode(branch?.name || 'AURA', rawCustomers) };
            }
            return c;
        });
        setters.setAllCustomers((prev: any[]) => JSON.stringify(prev) === JSON.stringify(updatedCustomers) ? prev : updatedCustomers);
        
        const rawPayments = dataMap.payments || [];
        const paymentsWithRefs = rawPayments.map((p: any) => ({ ...p, referenceCode: p.referenceCode || generatePaymentRef() }));
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
        setters.setAllNotifs(dataMap.notification_logs || []);
        setters.setAllBlocks(dataMap.calendar_blocks || []);
        
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
