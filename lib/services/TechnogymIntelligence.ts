import { supabase } from '../supabase';

/**
 * AURA SPA - TECHNOGYM INTELLIGENCE SERVICE
 * Bridge between Mywellness Biometrics and Spa Revenue.
 */
export const TechnogymIntelligence = {
  /**
   * Analyzes customer biometrics and generates "High-Value" actionable insights
   * for the business owner.
   */
  async getActionableInsights(businessId: string) {
    const { data: biometrics, error } = await supabase
      .from('customer_biometrics')
      .select(`
        *,
        customers (
          id,
          name,
          phone,
          email
        )
      `)
      .eq('business_id', businessId)
      .order('last_sync_at', { ascending: false });

    if (error) throw error;

    const insights = biometrics.map(bio => {
      let recommendation = null;
      let priority = 'low';

      // 1. High Fatigue -> Recovery Recommendation
      if (bio.muscle_fatigue_level === 'High' || (bio.strength_score < 40 && bio.mobility_score < 50)) {
        recommendation = {
          title: 'Deep Tissue Recovery Needed',
          description: `${bio.customers.name} just finished a high-intensity session with low mobility scores.`,
          action: 'Send Recovery Massage Offer',
          discountCode: 'TG-RECOVERY-20',
          type: 'revenue_generator'
        };
        priority = 'high';
      }

      // 2. High Body Fat -> Membership/Nutrition Upsell
      else if (bio.body_fat_percent > 25 && bio.wellness_age > 40) {
        recommendation = {
          title: 'Body Transformation Upsell',
          description: `${bio.customers.name} is looking to reduce body fat. Suggested PT session.`,
          action: 'Pitch "Total Reform" Package',
          type: 'retention'
        };
        priority = 'medium';
      }

      return {
        customerId: bio.customer_id,
        customerName: bio.customers.name,
        wellnessAge: bio.wellness_age,
        source: bio.source,
        recommendation,
        priority,
        timestamp: bio.last_sync_at
      };
    });

    return insights.filter(i => i.recommendation !== null);
  },

  /**
   * Simulates a "Success Sync" from Technogym Mywellness Cloud
   */
  async triggerMockSync(businessId: string, customerId: string) {
    const mockData = {
      business_id: businessId,
      customer_id: customerId,
      weight: 78.5,
      body_fat_percent: 22.4,
      muscle_fat_percent: 44.2,
      visceral_fat_level: 8,
      basal_metabolism: 1850,
      wellness_age: 32,
      mobility_score: 45, // Low
      balance_score: 72,
      strength_score: 38, // Low
      muscle_fatigue_level: 'High',
      source: 'Technogym_Mywellness'
    };

    const { data, error } = await supabase
      .from('customer_biometrics')
      .insert([mockData])
      .select();

    if (error) throw error;
    return data;
  }
};
