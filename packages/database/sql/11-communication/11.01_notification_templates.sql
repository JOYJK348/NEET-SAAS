-- ============================================================================
-- SQL File: 11.01_notification_templates.sql
-- Domain: Notification Template Configurations (Aggregate Root)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Structures communication templates parameters mapped per tenant.
-- 2. Scopes fallback channel settings and variables schema parameters.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_templates (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(100) NOT NULL, -- e.g. STUDENT_ABSENT_REMINDER
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    default_channel notification_channel_type_enum NOT NULL DEFAULT 'EMAIL',
    fallback_channel notification_channel_type_enum NULL,
    
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
    CONSTRAINT fk_nt_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_nt_code CHECK (code ~ '^[A-Z0-9_]{3,100}$'),
    CONSTRAINT chk_nt_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_nt_channels CHECK (fallback_channel IS NULL OR fallback_channel IS DISTINCT FROM default_channel),
    CONSTRAINT chk_nt_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate codes within the same tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_nt_tenant_code
    ON public.notification_templates(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.notification_templates DROP CONSTRAINT IF EXISTS uq_notification_templates_tenant_id CASCADE;
ALTER TABLE public.notification_templates ADD CONSTRAINT uq_notification_templates_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_templates_touch_audit ON public.notification_templates;
CREATE TRIGGER trg_biu_notification_templates_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_templates
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_templates_policy ON public.notification_templates
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_templates_policy ON public.notification_templates
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_templates_policy ON public.notification_templates
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_templates_policy ON public.notification_templates
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
