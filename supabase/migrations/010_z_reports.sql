-- 010_z_reports.sql
-- Table to store end-of-day reconciliation reports

CREATE TABLE IF NOT EXISTS z_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_id UUID REFERENCES businesses(id) ON DELETE CASCADE,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    expected_nakit NUMERIC DEFAULT 0,
    actual_nakit NUMERIC DEFAULT 0,
    expected_kart NUMERIC DEFAULT 0,
    actual_kart NUMERIC DEFAULT 0,
    expected_havale NUMERIC DEFAULT 0,
    actual_havale NUMERIC DEFAULT 0,
    total_difference NUMERIC DEFAULT 0,
    closed_by UUID REFERENCES app_users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(branch_id, report_date)
);

-- RLS Policies
ALTER TABLE z_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their business Z-reports"
ON z_reports FOR SELECT
USING (business_id = (SELECT business_id FROM app_users WHERE id = auth.uid()));

CREATE POLICY "Users can create Z-reports for their business"
ON z_reports FOR INSERT
WITH CHECK (business_id = (SELECT business_id FROM app_users WHERE id = auth.uid()));

CREATE INDEX IF NOT EXISTS idx_z_reports_business_date ON z_reports(business_id, report_date);
