-- ============================================================================
-- SQL File: 09.07_live_class_resources.sql
-- Domain: Live Class Handout Materials and Resources (Distribution Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Links distributed learning files to scheduled classes and optionally specific sessions.
-- 2. Supports access visibility control parameters (download rules, date boundaries).
-- 3. Implements sequence index sequencing via display_order.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_resources (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    live_class_id UUID NOT NULL,
    session_id UUID NULL, -- Optional: links to a specific lecture restart/session
    
    -- Resource Metadata
    storage_object_id VARCHAR(250) NOT NULL,
    resource_type resource_type_enum NOT NULL DEFAULT 'PDF',
    title VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    -- Access policy controls
    display_order SMALLINT NOT NULL DEFAULT 1,
    is_downloadable BOOLEAN NOT NULL DEFAULT true,
    is_public BOOLEAN NOT NULL DEFAULT true,
    
    available_from TIMESTAMP WITH TIME ZONE NULL,
    available_until TIMESTAMP WITH TIME ZONE NULL,
    
    uploaded_by UUID NULL, -- References public.users.id
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lcres_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcres_class FOREIGN KEY (tenant_id, live_class_id)
        REFERENCES public.live_classes(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_lcres_session FOREIGN KEY (tenant_id, session_id)
        REFERENCES public.live_class_sessions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_lcres_uploader FOREIGN KEY (uploaded_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_lcres_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_lcres_order CHECK (display_order > 0),
    CONSTRAINT chk_lcres_dates CHECK (available_until IS NULL OR available_from IS NULL OR available_until > available_from),
    CONSTRAINT chk_lcres_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_lcres_class ON public.live_class_resources(live_class_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcres_session ON public.live_class_resources(session_id) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.live_class_resources DROP CONSTRAINT IF EXISTS uq_live_class_resources_tenant_id CASCADE;
ALTER TABLE public.live_class_resources ADD CONSTRAINT uq_live_class_resources_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_resources_touch_audit ON public.live_class_resources;
CREATE TRIGGER trg_biu_live_class_resources_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_resources
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_resources ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_resources_policy ON public.live_class_resources
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_resources_policy ON public.live_class_resources
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_resources_policy ON public.live_class_resources
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_resources_policy ON public.live_class_resources
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
