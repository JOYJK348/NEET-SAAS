-- ============================================================================
-- File       : 001_setup_test_data.sql
-- Module     : Testing
-- Purpose    : Setup baseline integration test data for multiple tenants and users.
-- Depends On : auth.users, institutes, branches, users, roles, user_roles
-- Author     : Agaran Platform
-- Version    : 1.1.7
-- ============================================================================

-- 1. Mock Supabase Auth Users (only inserting writable columns)
INSERT INTO auth.users (id, email, role)
VALUES 
    ('11111111-1111-1111-1111-111111111111', 'alpha_faculty@test.com', 'authenticated'),
    ('22222222-2222-2222-2222-222222222222', 'alpha_approver@test.com', 'authenticated'),
    ('33333333-3333-3333-3333-333333333333', 'beta_faculty@test.com', 'authenticated'),
    ('99999999-9999-9999-9999-999999999999', 'superadmin@test.com', 'authenticated')
ON CONFLICT (id) DO NOTHING;

-- 2. Setup Test Tenants (Institutes)
INSERT INTO public.institutes (id, code, slug, name, display_name, email, phone, status)
VALUES 
    ('88888888-8888-8888-8888-888888888888', 'ALPHA_NEET', 'alpha-neet', 'Alpha NEET Academy', 'Alpha NEET', 'alpha@neet.com', '919876543210', 'ACTIVE'),
    ('99999999-9999-9999-9999-999999999999', 'BETA_MED', 'beta-med', 'Beta Medical Academy', 'Beta Med', 'beta@med.com', '919876543211', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 3. Setup Test Campus Branches
INSERT INTO public.branches (id, tenant_id, code, slug, name, display_name, email, phone, status)
VALUES 
    ('88888888-8888-8888-8888-000000000000', '88888888-8888-8888-8888-888888888888', 'CHN_BRANCH', 'chennai', 'Chennai Campus', 'Chennai', 'chn@neet.com', '919876543210', 'ACTIVE'),
    ('99999999-9999-9999-9999-000000000000', '99999999-9999-9999-9999-999999999999', 'MDU_BRANCH', 'madurai', 'Madurai Campus', 'Madurai', 'mdu@med.com', '919876543211', 'ACTIVE')
ON CONFLICT (id) DO NOTHING;

-- 4. Setup Test User Profiles (Linked to Tenants and Branches)
INSERT INTO public.users (id, tenant_id, branch_id, email, first_name, last_name, user_type, status, is_super_admin)
VALUES 
    -- Alpha Tenant Users
    ('11111111-1111-1111-1111-111111111111', '88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-000000000000', 'alpha_faculty@test.com', 'Alpha', 'Faculty', 'STAFF'::user_type_enum, 'ACTIVE'::user_status_type, false),
    ('22222222-2222-2222-2222-222222222222', '88888888-8888-8888-8888-888888888888', '88888888-8888-8888-8888-000000000000', 'alpha_approver@test.com', 'Alpha', 'Approver', 'STAFF'::user_type_enum, 'ACTIVE'::user_status_type, false),
    
    -- Beta Tenant Users
    ('33333333-3333-3333-3333-333333333333', '99999999-9999-9999-9999-999999999999', '99999999-9999-9999-9999-000000000000', 'beta_faculty@test.com', 'Beta', 'Faculty', 'STAFF'::user_type_enum, 'ACTIVE'::user_status_type, false),
    
    -- Global Super Admin
    ('99999999-9999-9999-9999-999999999999', NULL, NULL, 'superadmin@test.com', 'Global', 'SuperAdmin', 'STAFF'::user_type_enum, 'ACTIVE'::user_status_type, true)
ON CONFLICT (id) DO NOTHING;

-- 5. Setup Roles for Test Tenant
INSERT INTO roles (id, tenant_id, name, code, role_type, is_default, is_editable, is_deletable, priority)
VALUES
    ('22222222-2222-2222-2222-900000000002', '88888888-8888-8888-8888-888888888888', 'Tenant Administrator', 'TENANT_ADMIN', 'SYSTEM', false, false, false, 90),
    ('33333333-3333-3333-3333-900000000003', '88888888-8888-8888-8888-888888888888', 'Faculty Member', 'FACULTY', 'CUSTOM', false, true, true, 50)
ON CONFLICT (id) DO NOTHING;

-- 6. Setup User Roles Assignments (Set effective_from 1 hour ago to ensure validity)
-- Link Alpha Faculty user to standard FACULTY role
INSERT INTO user_roles (tenant_id, user_id, role_id, effective_from, effective_to, assigned_by, assignment_reason)
VALUES 
    ('88888888-8888-8888-8888-888888888888', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-900000000003', NOW() - INTERVAL '1 hour', NULL, '99999999-9999-9999-9999-999999999999', 'Assign Faculty role')
ON CONFLICT (tenant_id, user_id, role_id) DO NOTHING;

-- Link Alpha Approver user to TENANT_ADMIN role
INSERT INTO user_roles (tenant_id, user_id, role_id, effective_from, effective_to, assigned_by, assignment_reason)
VALUES 
    ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-222222222222', '22222222-2222-2222-2222-900000000002', NOW() - INTERVAL '1 hour', NULL, '99999999-9999-9999-9999-999999999999', 'Assign Admin role')
ON CONFLICT (tenant_id, user_id, role_id) DO NOTHING;

-- 7. Insert Explicit Permissions & Mappings for Integration Tests
INSERT INTO permissions (tenant_id, permission_group_id, permission_key, resource, action, description, scope, is_system)
VALUES
    ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-100000000001', 'exams.question.approve', 'question', 'approve', 'Approve exam questions', 'TENANT', true),
    ('88888888-8888-8888-8888-888888888888', '44444444-4444-4444-4444-100000000001', 'exams.mock.approve', 'mock', 'approve', 'Approve mock exams', 'TENANT', true),
    ('88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-100000000001', 'academics.subjects.view', 'subjects', 'view', 'View subjects list', 'TENANT', true)
ON CONFLICT (tenant_id, permission_key) DO NOTHING;

-- Clear previous mappings to avoid dirty runs
DELETE FROM role_permissions WHERE tenant_id = '88888888-8888-8888-8888-888888888888';

-- Grant ALL permissions to TENANT_ADMIN role for Alpha Tenant
INSERT INTO role_permissions (tenant_id, role_id, permission_id)
SELECT '88888888-8888-8888-8888-888888888888', '22222222-2222-2222-2222-900000000002', id
FROM permissions
WHERE tenant_id = '88888888-8888-8888-8888-888888888888'
ON CONFLICT (tenant_id, role_id, permission_id) DO NOTHING;

-- Grant ONLY specific non-administrative permissions to FACULTY role for Alpha Tenant
INSERT INTO role_permissions (tenant_id, role_id, permission_id)
SELECT '88888888-8888-8888-8888-888888888888', '33333333-3333-3333-3333-900000000003', id
FROM permissions
WHERE tenant_id = '88888888-8888-8888-8888-888888888888'
  AND permission_key IN ('exams.question.approve', 'academics.subjects.view')
ON CONFLICT (tenant_id, role_id, permission_id) DO NOTHING;

-- 8. Dynamically Replicate Menu Groups, Menu Master and Menu Permissions to Test Tenant
DO $$
DECLARE
    v_base_tenant UUID;
    v_test_tenant UUID := '88888888-8888-8888-8888-888888888888';
BEGIN
    -- Fallback to the default seed tenant ID if it doesn't exist in institutes table
    SELECT id INTO v_base_tenant FROM public.institutes WHERE id NOT IN (v_test_tenant, '99999999-9999-9999-9999-999999999999') LIMIT 1;
    IF v_base_tenant IS NULL THEN
        v_base_tenant := 'a0000000-0000-0000-0000-000000000001';
    END IF;
    
    -- Replicate Menu Groups
    INSERT INTO menu_groups (id, tenant_id, code, slug, title, icon, color, description, default_expanded, display_order, is_visible, is_system)
    SELECT id, v_test_tenant, code, slug, title, icon, color, description, default_expanded, display_order, is_visible, is_system
    FROM menu_groups
    WHERE tenant_id = v_base_tenant
    ON CONFLICT (id) DO NOTHING;

    -- Replicate Menu Master (parent_menu_id mapped correctly)
    INSERT INTO menu_master (id, tenant_id, parent_menu_id, menu_group_id, menu_code, title, route, icon, display_order, feature_id, module, page_type, is_visible, is_system, license_key, feature_flag_key, cache_key, workflow_enabled, workflow_key)
    SELECT id, v_test_tenant, parent_menu_id, menu_group_id, menu_code, title, route, icon, display_order, feature_id, module, page_type, is_visible, is_system, license_key, feature_flag_key, cache_key, workflow_enabled, workflow_key
    FROM menu_master
    WHERE tenant_id = v_base_tenant
    ON CONFLICT (id) DO NOTHING;

    -- Replicate Menu Permissions
    INSERT INTO menu_permissions (tenant_id, menu_id, permission_id)
    SELECT v_test_tenant, mp.menu_id, p_new.id
    FROM menu_permissions mp
    JOIN permissions p_old ON p_old.id = mp.permission_id
    JOIN permissions p_new ON p_new.permission_key = p_old.permission_key AND p_new.tenant_id = v_test_tenant
    WHERE mp.tenant_id = v_base_tenant
    ON CONFLICT (tenant_id, menu_id, permission_id) DO NOTHING;
END $$;

-- 9. Seed Workflows, Steps and Transitions Direct mapping (Failsafe)
DO $$
DECLARE
    v_test_tenant UUID := '88888888-8888-8888-8888-888888888888';
    v_test_wf_id UUID := 'bbbbbbbb-bbbb-bbbb-bbbb-888888888888';
BEGIN
    -- 1. Insert Workflow Record
    INSERT INTO workflows (id, tenant_id, workflow_code, workflow_version, name, description, allow_parallel, allow_cancel, auto_complete, is_active)
    VALUES (
        v_test_wf_id, v_test_tenant, 'EXAM_PUBLISH', 1, 'Exam Publishing Workflow', 'Standard multi-step verification pipeline before exam publishing', false, true, false, true
    ) ON CONFLICT (tenant_id, workflow_code, workflow_version) DO NOTHING;

    -- 2. Insert Workflow Steps
    INSERT INTO workflow_steps (tenant_id, workflow_id, step_order, step_name, step_type, is_optional, allow_skip, required_permission, assignment_strategy, timeout_hours, escalation_strategy)
    VALUES
        (v_test_tenant, v_test_wf_id, 1, 'Faculty Draft verification', 'APPROVAL', false, false, 'exams.question.approve', 'PERMISSION', 48, 'NEXT_APPROVER'),
        (v_test_tenant, v_test_wf_id, 2, 'Principal Final Sign-off', 'APPROVAL', false, false, 'exams.mock.approve', 'PERMISSION', 24, 'TENANT_ADMIN')
    ON CONFLICT (tenant_id, workflow_id, step_order) DO NOTHING;

    -- 3. Insert Workflow Transitions
    INSERT INTO workflow_transitions (tenant_id, workflow_id, from_status, to_status, action_code, requires_comment, condition_expression, event_name, transition_name)
    VALUES
        (v_test_tenant, v_test_wf_id, 'DRAFT', 'PENDING', 'SUBMIT', false, NULL, 'workflow.submitted', 'Submit for approval'),
        (v_test_tenant, v_test_wf_id, 'PENDING', 'APPROVED', 'APPROVE', false, NULL, 'workflow.completed', 'Approve transaction step'),
        (v_test_tenant, v_test_wf_id, 'PENDING', 'REJECTED', 'REJECT', true, NULL, 'workflow.rejected', 'Reject transaction step'),
        (v_test_tenant, v_test_wf_id, 'PENDING', 'CHANGES_REQUESTED', 'RETURN', true, NULL, 'workflow.changes_requested', 'Return to author for changes'),
        (v_test_tenant, v_test_wf_id, 'CHANGES_REQUESTED', 'PENDING', 'SUBMIT', false, NULL, 'workflow.resubmitted', 'Re-submit corrected version'),
        (v_test_tenant, v_test_wf_id, 'PENDING', 'CANCELLED', 'CANCEL', false, NULL, 'workflow.cancelled', 'Cancel request')
    ON CONFLICT (tenant_id, workflow_id, from_status, action_code, to_status) DO NOTHING;
END $$;
