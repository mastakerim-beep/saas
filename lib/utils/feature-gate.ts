import { Business, AppUser } from "@/lib/store/types";

export type FeatureGateStatus = {
    isLocked: boolean;
    reason: 'unpaid' | 'suspended' | 'quota_exceeded' | null;
    message: string | null;
};

export const PLANS = {
    BASIC: 'Basic',
    ENTERPRISE: 'Aura Enterprise'
};

export const PLAN_LIMITS = {
    [PLANS.BASIC]: {
        maxBranches: 1,
        maxUsers: 5,
        hasAI: false,
        hasAdvancedAnalytics: false
    },
    [PLANS.ENTERPRISE]: {
        maxBranches: 999,
        maxUsers: 999,
        hasAI: true,
        hasAdvancedAnalytics: true
    }
};

/**
 * Checks if the current business system should be globally locked.
 */
export const checkSystemLock = (business: Business, currentUser: AppUser | null): FeatureGateStatus => {
    // 1. SUPERADMIN BYPASS: kerim@mail.com is never locked out
    if (currentUser?.email === 'kerim@mail.com') {
        return { isLocked: false, reason: null, message: null };
    }

    // 2. MANUAL SUSPENSION
    if ((business as any).is_suspended) {
        return { 
            isLocked: true, 
            reason: 'suspended', 
            message: 'Bu işletme hesabı yönetici tarafından askıya alınmıştır. Lütfen destek ile iletişime geçin.' 
        };
    }

    // 3. PAYMENT & GRACE PERIOD CHECK
    if (business.paymentStatus === 'unpaid') {
        const graceUntil = (business as any).grace_period_until;
        if (graceUntil) {
            const graceDate = new Date(graceUntil);
            const now = new Date();
            
            if (now > graceDate) {
                return { 
                    isLocked: true, 
                    reason: 'unpaid', 
                    message: 'Ödeme süreniz ve 3 günlük ek tolerans süreniz dolmuştur. Sisteme erişim kısıtlanmıştır.' 
                };
            }
        } else {
            // No grace period defined means immediate lock on unpaid if not overridden
            if (!(business as any).is_manual_override) {
                return { 
                    isLocked: true, 
                    reason: 'unpaid', 
                    message: 'Ödeme bekleyen abonelik. Lütfen devam etmek için paketinizi yenileyin.' 
                };
            }
        }
    }

    return { isLocked: false, reason: null, message: null };
};

/**
 * Checks if a specific resource (branch/user) can be added based on plan.
 */
export const checkQuota = (business: Business, resourceType: 'branches' | 'users', currentCount: number): { allowed: boolean; limit: number } => {
    const planName = business.plan || PLANS.BASIC;
    const limits = (PLAN_LIMITS as any)[planName] || PLAN_LIMITS[PLANS.BASIC];
    
    const limit = resourceType === 'branches' ? limits.maxBranches : limits.maxUsers;
    
    return {
        allowed: currentCount < limit,
        limit
    };
};

/**
 * Checks if a specific feature is available for the current plan.
 */
export const hasFeature = (business: Business, feature: keyof typeof PLAN_LIMITS[typeof PLANS.BASIC]): boolean => {
    const planName = business.plan || PLANS.BASIC;
    const limits = (PLAN_LIMITS as any)[planName] || PLAN_LIMITS[PLANS.BASIC];
    
    return !!limits[feature];
};
