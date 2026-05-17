import { supabase } from '@/lib/supabase';
import { toCamel, retryRequest } from '@/lib/utils/converter';
import { AppUser } from './types';

export const fetchData = async (
    bizId: string | undefined,
    currentUser: AppUser | null,
    setters: any,
    force = false,
    startDate?: string,
    endDate?: string,
    signal?: AbortSignal,
    slug?: string
) => {
    const coreTables = [
        'businesses', 'branches', 'staff', 'rooms', 
        'services', 'app_users', 'tenant_modules', 'booking_settings'
    ];

    const isSaaS = currentUser?.role === 'SaaS_Owner';
    const isGuest = !currentUser;
    
    let actualBizId = bizId;
    
    if (!actualBizId && slug) {
        try {
            const { data: bData } = await supabase.from('businesses').select('id').eq('slug', slug).maybeSingle();
            if (bData?.id) actualBizId = bData.id;
        } catch (e) {
            console.error("Failed to resolve identity:", e);
        }
    }

    const targetId = isSaaS ? actualBizId : (actualBizId || currentUser?.businessId);
    
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
        'inventory_categories', 'inventory_transfers', 'package_usage_history', 'customer_biometrics', 'coupons',
        'saas_plans', 'saas_invoices', 'payment_links', 'ai_insights'
    ];

    if (!targetId && !isSaaS && !isGuest) {
        setters.setSyncStatus('idle');
        return;
    }

    console.time("Aura Fetch Speed");
    setters.setSyncStatus('syncing');

    const dataMap: any = {};

    try {
        const tablesInThisPhase = isGuest ? publicTables : coreTables;
        
        const fetchTable = async (table: string) => {
            try {
                const result = await retryRequest(async () => {
                    if (signal?.aborted) throw new Error('Aborted');
                    let q = supabase.from(table).select('*');
                    
                    const idToUse = targetId;
                    
                    if (table === 'businesses' && isSaaS && !idToUse && slug) {
                        q = q.eq('slug', slug);
                    } else if (idToUse) {
                        if (table === 'businesses') {
                            q = q.eq('id', idToUse);
                        } else if (table === 'saas_plans') {
                            // global
                        } else {
                            q = q.eq('business_id', idToUse);
                        }
                    } else if (isSaaS && !slug) {
                        // Global Oversight Mode for SaaS Owners
                        if (['businesses', 'app_users', 'z_reports', 'payments', 'audit_logs', 'notification_logs', 'system_announcements', 'saas_invoices', 'saas_plans'].includes(table)) {
                            q = q.limit(1000);
                        } else {
                            return [];
                        }
                    } else if (currentUser?.holding_id && !slug) {
                        // Holding Oversight Mode for Multi-Tenant Owners (e.g., Sanitas)
                        if (table === 'businesses') {
                            q = q.eq('holding_id', currentUser.holding_id);
                        } else if (['z_reports', 'payments', 'audit_logs', 'notification_logs'].includes(table)) {
                            // First get the business IDs for this holding
                            const { data: holdingBiz } = await supabase.from('businesses').select('id').eq('holding_id', currentUser.holding_id);
                            const bizIds = holdingBiz?.map(b => b.id) || [];
                            if (bizIds.length > 0) {
                                q = q.in('business_id', bizIds).limit(1000);
                            } else {
                                return [];
                            }
                        } else {
                            return [];
                        }
                    } else if (!isGuest) {
                        return [];
                    }

                    if (table === 'audit_logs' || table === 'notification_logs') {
                        q = q.order('created_at', { ascending: false }).limit(50);
                    }
                    if (table === 'z_reports' || table === 'payments') {
                        q = q.order('created_at', { ascending: false }).limit(500);
                    }
                    if (table === 'appointments') {
                        const sixtyDaysAgo = new Date();
                        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
                        q = q.gte('date', sixtyDaysAgo.toISOString().split('T')[0]).limit(1000);
                    }

                    if (startDate && (table === 'payments' || table === 'expenses' || table === 'appointments')) q = q.gte('date', startDate);
                    if (endDate && (table === 'payments' || table === 'expenses' || table === 'appointments')) q = q.lte('date', endDate);
                    
                    const { data, error } = await q;
                    if (error) throw error;
                    return data;
                });
                
                const camelData = toCamel(result || []);
                dataMap[table] = camelData;

                // --- PROGRESSIVE HYDRATION ---
                if (table === 'staff') {
                    console.log(`🛡️ [Imperial Trace] Staff Hydrated: ${camelData.length} members`);
                    setters.setAllStaff?.(camelData);
                }
                if (table === 'rooms') {
                    console.log(`🛡️ [Imperial Trace] Rooms Hydrated: ${camelData.length} units`);
                    setters.setAllRooms?.(camelData);
                }
                if (table === 'services') setters.setAllServices?.(camelData);
                if (table === 'app_users') setters.setAllUsers?.(camelData);
                if (table === 'branches') setters.setBranches?.(camelData);
                if (table === 'booking_settings') setters.setBookingSettings?.(camelData[0] || null);
                if (table === 'tenant_modules') setters.setTenantModules?.(camelData);

                if (table === 'appointments') setters.setAllAppointments?.(camelData);
                if (table === 'customers') setters.setAllCustomers?.(camelData);
                if (table === 'payments') setters.setAllPayments?.(camelData);
                if (table === 'membership_plans') setters.setMembershipPlans?.(camelData);
                if (table === 'customer_memberships') setters.setCustomerMemberships?.(camelData);
                if (table === 'z_reports') setters.setZReports?.(camelData);
                if (table === 'calendar_blocks') setters.setAllBlocks?.(camelData);
                if (table === 'inventory') setters.setAllInventory?.(camelData);

                return { table, data: camelData };
            } catch (e: any) {
                console.error(`❌ Table Fetch Error: ${table}`, e);
                dataMap[table] = [];
                return { table, data: [] };
            }
        };

        await Promise.allSettled(tablesInThisPhase.map(fetchTable));
        setters.setSyncStatus('idle');

        if (dataMap.businesses) {
            const businesses = dataMap.businesses;
            const finalBizId = targetId || businesses[0]?.id;
            const targetBusiness = businesses.find((b: any) => b.id === finalBizId) || businesses[0];
            if (targetBusiness) {
                setters.setCurrentTenant?.(targetBusiness);
            }
            if ((isSaaS || currentUser?.holding_id) && !targetId && !slug) {
                setters.setAllBusinesses(businesses.sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '')));
            }
        }

        if (dataMap.branches && dataMap.branches.length > 0) {
            const branches = dataMap.branches;
            const savedBranchId = typeof window !== 'undefined' ? localStorage.getItem('aura_last_branch') : null;
            const userBranchId = currentUser?.branchId;
            let branchToUse = branches[0];
            if (savedBranchId && branches.some((b: any) => b.id === savedBranchId)) {
                branchToUse = branches.find((b: any) => b.id === savedBranchId);
            } else if (userBranchId && branches.some((b: any) => b.id === userBranchId)) {
                branchToUse = branches.find((b: any) => b.id === userBranchId);
            }
            setters.setCurrentBranch(branchToUse);
        }

        if (!isGuest) {
            Promise.allSettled(fullTables.map(fetchTable)).then(() => {
                if (signal?.aborted) return;
                setters.setAllDebts?.(dataMap.debts || []);
                setters.setAllExpenses?.(dataMap.expenses || []);
                setters.setAllPackageDefinitions?.(dataMap.package_definitions || []);
                setters.setAllPackages?.(dataMap.packages || []);
                setters.setAllCommissionRules?.(dataMap.commission_rules || []);
                setters.setAllLogs?.(dataMap.audit_logs || []);
                setters.setAllCustomerMedia?.(dataMap.customer_media || []);
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
                setters.setAllInventoryCategories?.(dataMap.inventory_categories || []);
                setters.setPackageUsageHistory?.(dataMap.package_usage_history || []);
                setters.setCustomerBiometrics?.(dataMap.customer_biometrics || []);
                setters.setCoupons?.(dataMap.coupons || []);
                setters.setAllPaymentLinks?.(dataMap.payment_links || []);
                setters.setSaaSPlans?.(dataMap.saas_plans || []);
                setters.setSaaSInvoices?.(dataMap.saas_invoices || []);
                setters.setAiInsights?.(dataMap.ai_insights || []);
            });
        }

    } catch (error: any) {
        console.error("Fetch Error:", error);
        setters.setSyncStatus('error');
    } finally {
        console.timeEnd("Aura Fetch Speed");
    }
};
