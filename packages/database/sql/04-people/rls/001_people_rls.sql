-- ============================================================================
-- SQL File: 001_people_rls.sql
-- Domain: Row Level Security (RLS) policies for Context 04-People
-- ============================================================================

SET search_path = public;

-- Enable RLS across all new tables
ALTER TABLE public.staff_batch_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_medical_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_qualifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.person_identifiers ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- 1. staff_batch_assignments Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_sba_select ON public.staff_batch_assignments;
CREATE POLICY policy_sba_select ON public.staff_batch_assignments
    FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (staff_profile_id = auth.uid())
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
                )
            )
        )
    );

DROP POLICY IF EXISTS policy_sba_modify ON public.staff_batch_assignments;
CREATE POLICY policy_sba_modify ON public.staff_batch_assignments
    FOR ALL TO authenticated
    USING (
        tenant_id = current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
        )
    );

-- ----------------------------------------------------------------------------
-- 2. student_medical_profiles Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_smp_select ON public.student_medical_profiles;
CREATE POLICY policy_smp_select ON public.student_medical_profiles
    FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (student_profile_id = auth.uid())
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
                )
            )
            OR EXISTS (
                SELECT 1 FROM public.student_parents sp
                WHERE sp.student_profile_id = student_medical_profiles.student_profile_id
                  AND sp.parent_profile_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS policy_smp_modify ON public.student_medical_profiles;
CREATE POLICY policy_smp_modify ON public.student_medical_profiles
    FOR ALL TO authenticated
    USING (
        tenant_id = current_tenant_id()
        AND EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
        )
    );

-- ----------------------------------------------------------------------------
-- 3. staff_qualifications Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_sq_select ON public.staff_qualifications;
CREATE POLICY policy_sq_select ON public.staff_qualifications
    FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (staff_profile_id = auth.uid())
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
                )
            )
        )
    );

DROP POLICY IF EXISTS policy_sq_modify ON public.staff_qualifications;
CREATE POLICY policy_sq_modify ON public.staff_qualifications
    FOR ALL TO authenticated
    USING (
        tenant_id = current_tenant_id()
        AND (
            staff_profile_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
            )
        )
    );

-- ----------------------------------------------------------------------------
-- 4. emergency_contacts Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_ec_select ON public.emergency_contacts;
CREATE POLICY policy_ec_select ON public.emergency_contacts
    FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (student_profile_id = auth.uid())
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
                )
            )
            OR EXISTS (
                SELECT 1 FROM public.student_parents sp
                WHERE sp.student_profile_id = emergency_contacts.student_profile_id
                  AND sp.parent_profile_id = auth.uid()
            )
        )
    );

DROP POLICY IF EXISTS policy_ec_modify ON public.emergency_contacts;
CREATE POLICY policy_ec_modify ON public.emergency_contacts
    FOR ALL TO authenticated
    USING (
        tenant_id = current_tenant_id()
        AND (
            student_profile_id = auth.uid()
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
            )
        )
    );

-- ----------------------------------------------------------------------------
-- 5. student_status_history Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_ssh_select ON public.student_status_history;
CREATE POLICY policy_ssh_select ON public.student_status_history
    FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (student_profile_id = auth.uid())
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
                )
            )
        )
    );

-- ----------------------------------------------------------------------------
-- 6. person_identifiers Policies
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS policy_pi_select ON public.person_identifiers;
CREATE POLICY policy_pi_select ON public.person_identifiers
    FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (student_profile_id = auth.uid())
            OR (
                tenant_id = current_tenant_id()
                AND EXISTS (
                    SELECT 1 FROM public.users 
                    WHERE id = auth.uid() AND user_type = 'STAFF'::user_type_enum AND deleted_at IS NULL
                )
            )
            OR EXISTS (
                SELECT 1 FROM public.student_parents sp
                WHERE sp.student_profile_id = person_identifiers.student_profile_id
                  AND sp.parent_profile_id = auth.uid()
            )
        )
    );
