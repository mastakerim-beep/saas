-- AURA SPA SaaS ERP - SURGE PRICING AI MIGRATION
-- Purpose: Implement an Uber-style dynamic pricing mechanism based on biometric fatigue and slot availability.

-- 1. Create the Surge Pricing configuration for businesses
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS surge_pricing_enabled BOOLEAN DEFAULT false;
ALTER TABLE businesses ADD COLUMN IF NOT EXISTS max_surge_multiplier DECIMAL(3, 2) DEFAULT 1.50; -- Max 50% increase

-- 2. Create the AI function to calculate dynamic price multiplier
CREATE OR REPLACE FUNCTION fn_calculate_surge_multiplier(
    p_business_id UUID,
    p_service_type VARCHAR -- e.g., 'recovery_massage'
)
RETURNS DECIMAL(3, 2) AS $$
DECLARE
    v_fatigue_count INT;
    v_total_active_users INT;
    v_fatigue_ratio DECIMAL;
    v_available_slots INT;
    v_surge_multiplier DECIMAL(3, 2) := 1.00;
    v_surge_enabled BOOLEAN;
    v_max_multiplier DECIMAL(3, 2);
BEGIN
    -- Check if surge pricing is enabled for the business
    SELECT surge_pricing_enabled, max_surge_multiplier 
    INTO v_surge_enabled, v_max_multiplier
    FROM businesses 
    WHERE id = p_business_id;

    IF NOT v_surge_enabled THEN
        RETURN 1.00;
    END IF;

    -- A. Calculate Biometric Demand (Fatigue Ratio)
    -- Count users with 'High' or 'Medium' fatigue in the last 4 hours
    SELECT COUNT(*) INTO v_fatigue_count
    FROM customer_biometrics
    WHERE business_id = p_business_id
    AND last_sync_at >= NOW() - INTERVAL '4 hours'
    AND muscle_fatigue_level IN ('High', 'Medium');

    SELECT COUNT(*) INTO v_total_active_users
    FROM customer_biometrics
    WHERE business_id = p_business_id
    AND last_sync_at >= NOW() - INTERVAL '4 hours';

    IF v_total_active_users > 0 THEN
        v_fatigue_ratio := v_fatigue_count::DECIMAL / v_total_active_users;
    ELSE
        v_fatigue_ratio := 0;
    END IF;

    -- B. Calculate Supply (Available Slots)
    -- Note: Assuming a simplified check for appointments today that are not yet arrived
    -- In a real scenario, this would query the exact time blocks and rooms.
    SELECT COUNT(*) INTO v_available_slots
    FROM appointments
    WHERE business_id = p_business_id
    AND date = CURRENT_DATE
    AND status IN ('pending');

    -- C. The Surge Logic (Uber Style)
    -- If fatigue is high (high demand for recovery) AND slots are low (< 5), increase price
    IF v_service_type = 'recovery_massage' OR v_service_type = 'sports_massage' THEN
        IF v_fatigue_ratio > 0.60 AND v_available_slots < 5 THEN
            v_surge_multiplier := 1.25; -- 25% increase
        ELSIF v_fatigue_ratio > 0.80 AND v_available_slots < 3 THEN
            v_surge_multiplier := 1.50; -- 50% increase (max)
        END IF;
    END IF;

    -- Ensure we don't exceed the business max limit
    IF v_surge_multiplier > v_max_multiplier THEN
        v_surge_multiplier := v_max_multiplier;
    END IF;

    RETURN v_surge_multiplier;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION fn_calculate_surge_multiplier IS 'Calculates Uber-style surge pricing multiplier based on real-time hardware fatigue signals and available room slots.';
