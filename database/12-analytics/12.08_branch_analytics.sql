-- ============================================================================
-- SQL File: 12.08_branch_analytics.sql
-- Domain: Branch Location aggregates database
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Summarizes active enrollment metrics, averages scores, collection ratios per branch campus.
-- 2. Embeds indices optimizations for fast multi-tenant mapping dashboards.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.branch_analytics (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    branch_id UUID NOT NULL,
    
    -- Metrics
    active_students_count INTEGER NOT NULL DEFAULT 0,
    average_test_score DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    average_attendance_ratio DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    
    total_revenue DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    total_outstanding DECIMAL(12,2) NOT NULL DEFAULT 0.00,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ba_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_ba_branch FOREIGN KEY (tenant_id, branch_id)
        REFERENCES public.branches(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_ba_enrollments CHECK (active_students_count >= 0),
    CONSTRAINT chk_ba_scores CHECK (average_test_score BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_ba_attendance CHECK (average_attendance_ratio BETWEEN 0.00 AND 100.00),
    CONSTRAINT chk_ba_revenue CHECK (total_revenue >= 0.00 AND total_outstanding >= 0.00),
    CONSTRAINT chk_ba_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate branch summary records
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ba_branch
    ON public.branch_analytics(tenant_id, branch_id)
    WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_branch_analytics_touch_audit ON public.branch_analytics;
CREATE TRIGGER trg_biu_branch_analytics_touch_audit
    BEFORE INSERT OR UPDATE ON public.branch_analytics
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.branch_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_branch_analytics_policy ON public.branch_analytics
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_branch_analytics_policy ON public.branch_analytics
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_branch_analytics_policy ON public.branch_analytics
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_branch_analytics_policy ON public.branch_analytics
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
