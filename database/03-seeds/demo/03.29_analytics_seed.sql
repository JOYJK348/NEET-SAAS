-- ============================================================================
-- SQL Seed File: 03.29_analytics_seed.sql
-- Domain: Dashboards, Reports definitions, KPI, and Student Rollup Seeding
-- ============================================================================

SET search_path = public;

-- 1. Dashboard Definition
INSERT INTO public.dashboard_definitions (
    id, tenant_id, code, name, description, target_role, is_active, grid_layout
)
VALUES (
    'e0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001', -- ABC Tenant
    'STUDENT_DASHBOARD',
    'ABC Academy Student Analytics Dashboard',
    'Default landing layout canvas displaying course score trends, attendance tracking, and dues status.',
    'STUDENT',
    true,
    '{"columns_count": 12, "row_gap": 15}'::jsonb
)
ON CONFLICT (id) DO NOTHING;

-- 2. Dashboard Widgets Config
INSERT INTO public.dashboard_widgets (
    id, tenant_id, dashboard_definition_id, name, widget_type, row_index, col_index, size_width, size_height, data_source_query
)
VALUES 
(
    'e0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'Academic Attendance Card',
    'KPI_CARD',
    0, 0, 4, 2,
    'SELECT attendance_ratio FROM public.student_analytics WHERE student_admission_id = $1'
),
(
    'e0000000-0000-0000-0000-000000000012',
    'a0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000001',
    'Average Meiotic Exam Scores',
    'LINE_CHART',
    0, 4, 8, 4,
    'SELECT average_test_score FROM public.student_analytics WHERE student_admission_id = $1'
)
ON CONFLICT (id) DO NOTHING;

-- 3. Report Definition Template
INSERT INTO public.report_definitions (
    id, tenant_id, code, name, description, query_definition, supported_formats, is_active
)
VALUES (
    'e0000000-0000-0000-0000-000000000101',
    'a0000000-0000-0000-0000-000000000001',
    'STUDENT_REPORT_CARD',
    'Consolidated Academic and Financial Report Card',
    'Combines meiotic test percentages with billing structures details.',
    'SELECT * FROM public.student_analytics WHERE student_admission_id = :student_id',
    '{PDF,CSV}'::report_format_enum[],
    true
)
ON CONFLICT (id) DO NOTHING;

-- 4. KPI Definition Metric
INSERT INTO public.kpi_definitions (
    id, tenant_id, code, name, description, formula_expression, refresh_frequency, is_active
)
VALUES (
    'e0000000-0000-0000-0000-000000000201',
    'a0000000-0000-0000-0000-000000000001',
    'TOTAL_REV_COLLECT_PCT',
    'Academy Revenue Collection Ratio',
    'Compares collected fee payments with overall assigned invoice targets.',
    'SUM(total_received_amount) / SUM(total_invoiced_amount) * 100',
    'DAILY',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 5. Seeding Student performance Rollup (Karthik R)
INSERT INTO public.student_analytics (
    id, tenant_id, student_admission_id, total_attendance_sessions, present_sessions_count, attendance_ratio,
    exams_taken_count, average_test_score, highest_score, rank_in_batch,
    total_assigned_fees, total_paid_fees, total_outstanding_balance
)
VALUES (
    'e0000000-0000-0000-0000-000000000301',
    'a0000000-0000-0000-0000-000000000001',
    '2f000000-0000-0000-0000-000000000100', -- Karthik R
    20,
    18,
    90.00,
    2,
    88.50,
    95.00,
    2,
    93100.00,
    0.00,
    93100.00
)
ON CONFLICT (id) DO NOTHING;

-- 6. Log KPI snapshot trend data point
INSERT INTO public.kpi_snapshots (
    id, tenant_id, kpi_definition_id, branch_id, course_id, metric_value, snapshot_date
)
VALUES (
    'e0000000-0000-0000-0000-000000000401',
    'a0000000-0000-0000-0000-000000000001',
    'e0000000-0000-0000-0000-000000000201', -- KPI definition
    'b0000000-0000-0000-0000-000000000011', -- Madurai branch campus ID
    'f0000000-0000-0000-0000-000000000011', -- Course
    82.4500,
    CURRENT_DATE
)
ON CONFLICT (id) DO NOTHING;
