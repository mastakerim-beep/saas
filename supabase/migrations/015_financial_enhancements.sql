-- ============================================================
-- 015 - Financial Enhancements & Branch Isolation for Expenses
-- ============================================================

-- 1. Add branch_id to Expenses
ALTER TABLE expenses ADD COLUMN IF NOT EXISTS branch_id UUID REFERENCES branches(id) ON DELETE SET NULL;

-- 2. Update RLS for expenses to support branch isolation
CREATE OR REPLACE FUNCTION check_expense_branch_access(target_branch_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    u_role TEXT;
    u_biz UUID;
BEGIN
    SELECT role, business_id INTO u_role, u_biz 
    FROM app_users 
    WHERE id = auth.uid();
    
    -- If SaaS owner, full access
    IF u_role = 'SaaS_Owner' THEN 
        RETURN true; 
    END IF;

    -- If Business Owner, check if branch belongs to their business
    IF u_role = 'Business_Owner' THEN
        RETURN EXISTS (SELECT 1 FROM branches WHERE id = target_branch_id AND business_id = u_biz);
    END IF;

    -- For Staff or Branch Manager, check user_branch_access
    IF u_role IN ('Branch_Manager', 'Staff') THEN
        RETURN EXISTS (
            SELECT 1 FROM user_branch_access 
            WHERE user_id = auth.uid() 
            AND branch_id = target_branch_id
        );
    END IF;

    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- Adjust Expenses row level policies using new rules
DROP POLICY IF EXISTS "expenses_select" ON expenses;
CREATE POLICY "expenses_select" ON expenses 
    FOR SELECT TO authenticated 
    USING (
        business_id = get_my_business_id() AND 
        (branch_id IS NULL OR get_my_role() IN ('SaaS_Owner', 'Business_Owner') OR check_expense_branch_access(branch_id))
    );

DROP POLICY IF EXISTS "expenses_insert" ON expenses;
CREATE POLICY "expenses_insert" ON expenses 
    FOR INSERT TO authenticated 
    WITH CHECK (
        business_id = get_my_business_id() AND 
        (branch_id IS NULL OR get_my_role() IN ('SaaS_Owner', 'Business_Owner') OR check_expense_branch_access(branch_id))
    );

DROP POLICY IF EXISTS "expenses_update" ON expenses;
CREATE POLICY "expenses_update" ON expenses 
    FOR UPDATE TO authenticated 
    USING (
        business_id = get_my_business_id() AND 
        (branch_id IS NULL OR get_my_role() IN ('SaaS_Owner', 'Business_Owner') OR check_expense_branch_access(branch_id))
    );

DROP POLICY IF EXISTS "expenses_delete" ON expenses;
CREATE POLICY "expenses_delete" ON expenses 
    FOR DELETE TO authenticated 
    USING (
        business_id = get_my_business_id() AND 
        get_my_role() IN ('SaaS_Owner', 'Business_Owner', 'Branch_Manager') AND
        (branch_id IS NULL OR check_expense_branch_access(branch_id))
    );
