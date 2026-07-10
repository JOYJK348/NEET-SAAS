-- ============================================================================
-- SQL Seed File: 03.27_fees_seed.sql
-- Domain: Billing Configurations, Assignments, and Transaction Ledger Seeding
-- ============================================================================

SET search_path = public;

-- 1. Financial Period Mapping (FY 2026-2027)
INSERT INTO public.financial_periods_mapping (
    id, tenant_id, code, name, start_date, end_date, is_closed
)
VALUES (
    'f0000000-0000-0000-0000-000000000001',
    'a0000000-0000-0000-0000-000000000001', -- ABC Tenant
    'FY_2026_2027',
    'Financial Year 2026-2027',
    '2026-04-01',
    '2027-03-31',
    false
)
ON CONFLICT (id) DO NOTHING;

-- 2. Fee Collection Center (Main Online Portal)
INSERT INTO public.fee_collection_centers (
    id, tenant_id, branch_id, code, name, is_online
)
VALUES (
    'f0000000-0000-0000-0000-000000000011',
    'a0000000-0000-0000-0000-000000000001',
    'b0000000-0000-0000-0000-000000000011', -- Madurai branch campus ID from branches seed
    'HQ_ONLINE',
    'ABC Academy Corporate Online Portal',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Fee Structure (NEET Regular Prep Course Fee Package)
INSERT INTO public.fee_structures (
    id, tenant_id, course_id, academic_year_id, branch_id, code, name, description, effective_from, status
)
VALUES (
    'f0000000-0000-0000-0000-000000000101',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000011', -- Course
    'c0000000-0000-0000-0000-000000000011', -- AY
    'b0000000-0000-0000-0000-000000000011', -- Madurai branch campus ID from branches seed
    'NEET_2027_REG',
    'NEET 2027 Regular Premium Fee Package',
    'Standard billing structure covering course tuitions, library usage, exam portals, and review sheets.',
    '2026-04-01 00:00:00+00',
    'ACTIVE'
)
ON CONFLICT (id) DO NOTHING;

-- 4. Components Itemized breakdown
INSERT INTO public.fee_structure_items (
    id, tenant_id, fee_structure_id, item_name, amount, tax_percentage, display_order, mandatory, refundable
)
VALUES 
(
    'f0000000-0000-0000-0000-000000000201',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000101',
    'Admission Registration Fee',
    10000.00,
    18.00,
    1,
    true,
    false
),
(
    'f0000000-0000-0000-0000-000000000202',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000101',
    'Tuition and Mentorship Fee',
    60000.00,
    18.00,
    2,
    true,
    false
),
(
    'f0000000-0000-0000-0000-000000000203',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000101',
    'Books and Test Series Fee',
    10000.00,
    5.00,
    3,
    true,
    false
)
ON CONFLICT (id) DO NOTHING;

-- 5. Late Fee Penalty master rule
INSERT INTO public.fee_penalties (
    id, tenant_id, code, name, description, amount_per_day, max_penalty_limit, grace_days
)
VALUES (
    'f0000000-0000-0000-0000-000000000301',
    'a0000000-0000-0000-0000-000000000001',
    'LATE_100_DAY',
    'Standard late payment fee ₹100 per day',
    'Charge applied post grace window validation checks.',
    100.00,
    3000.00,
    5
)
ON CONFLICT (id) DO NOTHING;

-- 6. Installment plan templates
INSERT INTO public.fee_installments (
    id, tenant_id, fee_structure_id, installment_number, offset_days, amount_percentage, grace_days, late_fee_rule_id
)
VALUES 
(
    'f0000000-0000-0000-0000-000000000401',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000101',
    1,
    0, -- Immediately due
    40.00,
    5,
    'f0000000-0000-0000-0000-000000000301'
),
(
    'f0000000-0000-0000-0000-000000000402',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000101',
    2,
    60, -- Due in 60 days
    30.00,
    5,
    'f0000000-0000-0000-0000-000000000301'
),
(
    'f0000000-0000-0000-0000-000000000403',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000101',
    3,
    120, -- Due in 120 days
    30.00,
    5,
    'f0000000-0000-0000-0000-000000000301'
)
ON CONFLICT (id) DO NOTHING;

-- 7. Sibling Discount Configuration template
INSERT INTO public.fee_discounts (
    id, tenant_id, code, name, description, discount_percentage, valid_from
)
VALUES (
    'f0000000-0000-0000-0000-000000000501',
    'a0000000-0000-0000-0000-000000000001',
    'SIBLING_10',
    'Sibling fee concession 10%',
    'Discount for enrolling siblings.',
    10.00,
    '2026-04-01 00:00:00+00'
)
ON CONFLICT (id) DO NOTHING;

-- 8. Assign structure to student (Karthik R)
-- Calculations: Base=80,000, Tax=13,100 (10k Admission @18% = 1.8k; 60k Tuition @18% = 10.8k; 10k Books @5% = 500. Total = 13.1k). Net = 93,100.
INSERT INTO public.student_fee_assignments (
    id, tenant_id, student_admission_id, fee_structure_id, base_amount, tax_amount, discount_amount, final_amount, assigned_by
)
VALUES (
    'f0000000-0000-0000-0000-000000000601',
    'a0000000-0000-0000-0000-000000000001',
    '2f000000-0000-0000-0000-000000000100', -- Karthik R
    'f0000000-0000-0000-0000-000000000101', -- Structure Package
    80000.00,
    13100.00,
    0.00,
    93100.00,
    '3b000000-0000-0000-0000-000000000013' -- Staff
)
ON CONFLICT (id) DO NOTHING;

-- 9. Seed Student-specific Installments (Plan broken down into 40%, 30%, 30% splits)
INSERT INTO public.student_fee_installments (
    id, tenant_id, student_fee_assignment_id, fee_installment_id, installment_number, due_date,
    base_amount, tax_amount, discount_amount, penalty_amount, final_amount, paid_amount, balance_amount, status
)
VALUES 
(
    'f0000000-0000-0000-0000-000000000701',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000601',
    'f0000000-0000-0000-0000-000000000401',
    1,
    CURRENT_DATE + 5,
    32000.00, -- 40% of 80k base
    5240.00,  -- 40% of 13.1k tax
    0.00,
    0.00,
    37240.00,
    0.00,
    37240.00,
    'UNPAID'
),
(
    'f0000000-0000-0000-0000-000000000702',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000601',
    'f0000000-0000-0000-0000-000000000402',
    2,
    CURRENT_DATE + 60,
    24000.00, -- 30% of 80k
    3930.00,  -- 30% of 13.1k
    0.00,
    0.00,
    27930.00,
    0.00,
    27930.00,
    'UNPAID'
),
(
    'f0000000-0000-0000-0000-000000000703',
    'a0000000-0000-0000-0000-000000000001',
    'f0000000-0000-0000-0000-000000000601',
    'f0000000-0000-0000-0000-000000000403',
    3,
    CURRENT_DATE + 120,
    24000.00,
    3930.00,
    0.00,
    0.00,
    27930.00,
    0.00,
    27930.00,
    'UNPAID'
)
ON CONFLICT (id) DO NOTHING;

-- 10. Log Audited Event in Immutable timelines
INSERT INTO public.fee_audit_logs (
    id, tenant_id, student_admission_id, event_type, description, payload, triggered_by
)
VALUES (
    'f0000000-0000-0000-0000-000000000801',
    'a0000000-0000-0000-0000-000000000001',
    '2f000000-0000-0000-0000-000000000100',
    'FEE_ASSIGNED',
    'Assigned NEET Regular 2027 package plan totaling ₹93,100.',
    '{"assigned_by_role": "ADMIN", "package": "NEET_2027_REG"}'::jsonb,
    '3b000000-0000-0000-0000-000000000013'
)
ON CONFLICT (id) DO NOTHING;
