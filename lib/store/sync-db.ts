import { supabase } from '@/lib/supabase';
import { toSnake, retryRequest } from '@/lib/utils/converter';

export const syncDb = async (
    table: string, 
    op: 'insert' | 'update' | 'delete', 
    data: any, 
    id?: string, 
    activeId?: string,
    setSyncStatus?: (status: 'idle' | 'syncing' | 'error') => void,
    updateLocalStatus?: (table: string, id: string, status: 'syncing' | 'synced' | 'error') => void
) => {
    // 1. IDENTITY LOCK: Check if we have a business context
    const isSpecialTable = table === 'businesses' || table === 'app_users' || table === 'branches';
    
    // Nuclear Fallback Chain: activeId -> data -> localStorage (last resolved biz) -> currentUser (if available)
    let effectiveBizId = activeId || data?.businessId || data?.business_id;
    
    if (!effectiveBizId && !isSpecialTable && typeof window !== 'undefined') {
        const saved = localStorage.getItem('aura_last_resolved_biz_id');
        if (saved) effectiveBizId = saved;
    }

    if (!effectiveBizId && !isSpecialTable) {
        console.error(`🛡️ [Aura Sync] Identity Block aborted sync for [${table}]. Missing business_id.`);
        return false;
    }
    
    // Save the last successful biz ID for future fallbacks
    if (effectiveBizId && typeof window !== 'undefined') {
        localStorage.setItem('aura_last_resolved_biz_id', effectiveBizId);
    }
    
    const { syncStatus, ...cleanData } = data;
    const payload = toSnake(cleanData);

    const onStatusUpdate = (status: 'syncing' | 'synced' | 'error') => {
        if (id && updateLocalStatus) updateLocalStatus(table, id, status);
        if (setSyncStatus) setSyncStatus(status === 'syncing' ? 'syncing' : 'idle');
    };

    onStatusUpdate('syncing');

    try {
        const finalizedPayload = Object.keys(payload).reduce((acc: any, key) => {
            acc[key] = (payload[key] === '' || payload[key] === undefined) ? null : payload[key];
            return acc;
        }, {});

        // 2. ENFORCE REFERENCE: Ensure tenant tables always have business_id
        const tenantTables = [
            'branches', 'appointments', 'customers', 'membership_plans', 'customer_memberships', 
            'payments', 'debts', 'staff', 'inventory', 'rooms', 'expenses', 'services', 
            'audit_logs', 'customer_media', 'packages', 'package_definitions', 'commission_rules', 
            'calendar_blocks', 'notification_logs', 'z_reports', 'payment_definitions', 'bank_accounts',
            'marketing_rules', 'dynamic_pricing_rules', 'customer_wallets', 'wallet_transactions',
            'consultation_body_maps', 'inventory_usage_norms', 'quotes', 'expense_categories', 
            'referral_sources', 'consent_form_templates', 'tenant_modules', 'loyalty_settings', 'webhooks',
            'inventory_categories', 'package_usage_history'
        ];

        if (op === 'insert' && tenantTables.includes(table)) {
            finalizedPayload.business_id = finalizedPayload.business_id || effectiveBizId;
        }

        const result = await retryRequest(async () => {
            let res;
            if (op === 'insert') res = await supabase.from(table).insert([finalizedPayload]);
            if (op === 'update') {
                let q = supabase.from(table).update(finalizedPayload).eq('id', id);
                if (effectiveBizId && !isSpecialTable) q = q.eq('business_id', effectiveBizId);
                res = await q;
            }
            if (op === 'delete') {
                // For safety, force the business_id check on delete if available
                let q = supabase.from(table).delete().eq('id', id);
                if (effectiveBizId && !isSpecialTable) q = q.eq('business_id', effectiveBizId);
                res = await q;
            }
            
            if (res?.error) {
                console.error(`🔴 DB Sync Error [Table: ${table}, Op: ${op}]:`, res.error);
                throw res.error;
            }
            return res;
        });

        onStatusUpdate('synced');
        return true;
    } catch (error: any) {
        console.error(`❌ Sync failed [${table} ${op}]:`, error.message || error);
        onStatusUpdate('error');
        return false;
    }
};
