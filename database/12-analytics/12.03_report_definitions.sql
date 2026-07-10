-- ============================================================================
-- SQL File: 12.03_report_definitions.sql
-- Domain: Report template definitions catalog
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Pre-configured templates mapping report targets (Attendance, Fee structures).
-- 2. Embeds dynamic query details, formats restrictions.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.report_definitions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(50) NOT NULL, -- e.g. DAILY_FEE_COLLECTION, BATCH_PASS_PERCENTAGE
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    query_definition TEXT NOT NULL, -- Base query block
    supported_formats report_format_enum[] NOT NULL DEFAULT '{PDF,CSV}'::report_format_enum[],
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_rd_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_rd_code CHECK (code ~ '^[A-Z0-9_]{3,50}$'),
    CONSTRAINT chk_rd_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_rd_query CHECK (length(trim(query_definition)) > 0),
    CONSTRAINT chk_rd_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate report codes per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_rd_tenant_code
    ON public.report_definitions(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.report_definitions DROP CONSTRAINT IF EXISTS uq_report_definitions_tenant_id CASCADE;
ALTER TABLE public.report_definitions ADD CONSTRAINT uq_report_definitions_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_report_definitions_touch_audit ON public.report_definitions;
CREATE TRIGGER trg_biu_report_definitions_touch_audit
    BEFORE INSERT OR UPDATE ON public.report_definitions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.report_definitions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_report_definitions_policy ON public.report_definitions
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_report_definitions_policy ON public.report_definitions
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_report_definitions_policy ON public.report_definitions
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_report_definitions_policy ON public.report_definitions
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
