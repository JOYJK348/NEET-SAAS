-- ============================================================================
-- SQL File: 11.02_notification_template_versions.sql
-- Domain: Notification Template Version Control
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Manages version control for templates (body HTML/text, subject formats).
-- 2. Preserves communication payload history to guarantee legal compliance.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_template_versions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    notification_template_id UUID NOT NULL,
    
    version_number INTEGER NOT NULL DEFAULT 1,
    
    subject_template VARCHAR(250) NULL, -- Email subject or push title
    body_template TEXT NOT NULL,         -- Markdown, HTML, or plain text
    
    is_approved BOOLEAN NOT NULL DEFAULT false,
    approved_by UUID NULL, -- References public.users.id
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ntv_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_ntv_template FOREIGN KEY (tenant_id, notification_template_id)
        REFERENCES public.notification_templates(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_ntv_approver FOREIGN KEY (approved_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_ntv_number CHECK (version_number > 0),
    CONSTRAINT chk_ntv_body CHECK (length(trim(body_template)) > 0),
    CONSTRAINT chk_ntv_approval CHECK (
        (is_approved = false AND approved_by IS NULL)
        OR (is_approved = true AND approved_by IS NOT NULL)
    ),
    CONSTRAINT chk_ntv_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate version numbers per template
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ntv_template_number
    ON public.notification_template_versions(tenant_id, notification_template_id, version_number)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_ntv_template ON public.notification_template_versions(notification_template_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.notification_template_versions DROP CONSTRAINT IF EXISTS uq_notification_template_versions_tenant_id CASCADE;
ALTER TABLE public.notification_template_versions ADD CONSTRAINT uq_notification_template_versions_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_template_versions_touch_audit ON public.notification_template_versions;
CREATE TRIGGER trg_biu_notification_template_versions_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_template_versions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_template_versions ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_template_versions_policy ON public.notification_template_versions
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_template_versions_policy ON public.notification_template_versions
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_template_versions_policy ON public.notification_template_versions
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_template_versions_policy ON public.notification_template_versions
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
