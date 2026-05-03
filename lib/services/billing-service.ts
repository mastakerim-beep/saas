import { Business } from "@/lib/store/types";
import { supabase } from "@/lib/supabase";

export const PLANS = {
    BASIC: 'Basic',
    ENTERPRISE: 'Aura Enterprise'
};

export class BillingService {
    /**
     * Checks if a business has an active subscription.
     */
    static async getSubscriptionStatus(businessId: string) {
        const { data, error } = await supabase
            .from('businesses')
            .select('paymentStatus, expiryDate, plan, is_suspended')
            .eq('id', businessId)
            .single();

        if (error) throw error;
        return data;
    }

    /**
     * Creates a checkout session for Iyzico (Placeholder logic)
     */
    static async createIyzicoSession(businessId: string, plan: string) {
        // This would call a Supabase Edge Function to interact with Iyzico API
        const { data, error } = await supabase.functions.invoke('iyzico-checkout', {
            body: { businessId, plan }
        });
        
        if (error) throw error;
        return data;
    }

    /**
     * Creates a checkout session for Stripe (Placeholder logic)
     */
    static async createStripeSession(businessId: string, plan: string) {
        const { data, error } = await supabase.functions.invoke('stripe-checkout', {
            body: { businessId, plan }
        });
        
        if (error) throw error;
        return data;
    }

    /**
     * Suspends a business manually
     */
    static async suspendBusiness(businessId: string, reason: string) {
        const { error } = await supabase
            .from('businesses')
            .update({ 
                is_suspended: true,
                suspension_reason: reason,
                updated_at: new Date().toISOString()
            })
            .eq('id', businessId);
        
        if (error) throw error;
        return true;
    }

    /**
     * Reactivates a suspended business
     */
    static async reactivateBusiness(businessId: string) {
        const { error } = await supabase
            .from('businesses')
            .update({ 
                is_suspended: false,
                suspension_reason: null,
                paymentStatus: 'paid',
                updated_at: new Date().toISOString()
            })
            .eq('id', businessId);
        
        if (error) throw error;
        return true;
    }
}
