-- ============================================================================
-- SQL File: 11.22_notification_variables.sql
-- Domain: Dynamic message variables catalog (Shared Platform context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Registry validating format codes of substitution variables before sending.
-- 2. Restricts variable structure codes via regex keys.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.notification_variables (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(100) NOT NULL, -- e.g. student_name, due_date
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    default_value VARCHAR(250) NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_nvar_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_nvar_code CHECK (code ~ '^[a-z0-9_]{3,100}$'),
    CONSTRAINT chk_nvar_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_nvar_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate codes within tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_nvar_tenant_code
    ON public.notification_variables(tenant_id, code)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.notification_variables DROP CONSTRAINT IF EXISTS uq_notification_variables_tenant_id CASCADE;
ALTER TABLE public.notification_variables ADD CONSTRAINT uq_notification_variables_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_notification_variables_touch_audit ON public.notification_variables;
CREATE TRIGGER trg_biu_notification_variables_touch_audit
    BEFORE INSERT OR UPDATE ON public.notification_variables
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.notification_variables ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_notification_variables_policy ON public.notification_variables
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_notification_variables_policy ON public.notification_variables
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_notification_variables_policy ON public.notification_variables
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_notification_variables_policy ON public.notification_variables
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
