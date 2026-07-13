-- ============================================================================
-- SQL File: 12.07_student_analytics.sql
-- Domain: Student Performance Consolidated Rollups
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Aggregates student execution metrics (ratios, scores, attendance percentages) into single records.
-- 2. Scopes RLS visibility to allow student/parent filters matching auth user ID.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.student_analytics (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    student_admission_id UUID NOT NULL,
    
    -- Attendance aggregates
    total_attendance_sessions INTEGER NOT NULL DEFAULT 0,
    present_sessions_count INTEGER NOT NULL DEFAULT 0,
    attendance_ratio DECIMAL(5,2) NOT NULL DEFAULT 0.00, -- e.g. 92.50%
    
    -- Academics performance (Exam aggregates)
    exams_taken_count INTEGER NOT NULL DEFAULT 0,
    average_test_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    highest_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    rank_in_batch SMALLINT NULL,
    
    -- Billing Status
    total_assigned_fees DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_paid_fees DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_outstanding_balance DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_sa_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_sa_student FOREIGN KEY (tenant_id, student_admission_id)
        REFERENCES public.student_admissions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_sa_attendance_sessions CHECK (total_attendance_sessions >= 0 AND present_sessions_count >= 0 AND present_sessions_count <= total_attendance_sessions),
    CONSTRAINT chk_sa_attendance_ratio CHECK (attendance_ratio BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_sa_exams CHECK (exams_taken_count >= 0),
    CONSTRAINT chk_sa_scores CHECK (average_test_score BETWEEN 0.00 AND 100.00 AND highest_score BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_sa_rank CHECK (rank_in_batch IS NULL OR rank_in_batch > 0),
    
    CONSTRAINT chk_sa_fees CHECK (total_assigned_fees >= 0.00 AND total_paid_fees >= 0.00 AND total_outstanding_balance >= 0.00),
    CONSTRAINT chk_sa_fees_calc CHECK (total_outstanding_balance = total_assigned_fees - total_paid_fees),
    CONSTRAINT chk_sa_version CHECK (version > 0)
);

-- 2. Unique: one consolidated progress analytics rollup record per student admission
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_sa_student
    ON public.student_analytics(tenant_id, student_admission_id)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_sa_student ON public.student_analytics(student_admission_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_student_analytics_touch_audit ON public.student_analytics;
CREATE TRIGGER trg_biu_student_analytics_touch_audit
    BEFORE INSERT OR UPDATE ON public.student_analytics
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.student_analytics ENABLE ROW LEVEL SECURITY;

-- Select policy: students can see their own rollup data
CREATE POLICY select_student_analytics_policy ON public.student_analytics
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
        AND (
            -- Student Admission checks
            (student_admission_id IN (
                SELECT id FROM public.student_admissions 
                WHERE student_profile_id = (SELECT id FROM public.student_profiles WHERE user_id = auth.uid())
            ))
            OR
            -- Parent Admission check
            (student_admission_id IN (
                SELECT sa.id FROM public.student_admissions sa
                JOIN public.student_parents sp ON sa.student_profile_id = sp.student_profile_id
                WHERE sp.parent_profile_id = (SELECT id FROM public.parent_profiles WHERE user_id = auth.uid())
            ))
            -- Staff bypass RLS checks natively
            OR EXISTS (
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() AND user_type = 'STAFF' AND deleted_at IS NULL
            )
        )
    );

CREATE POLICY insert_student_analytics_policy ON public.student_analytics
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_student_analytics_policy ON public.student_analytics
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_student_analytics_policy ON public.student_analytics
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
