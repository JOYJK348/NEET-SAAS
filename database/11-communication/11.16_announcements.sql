-- ============================================================================
-- SQL File: 11.16_announcements.sql
-- Domain: Portal Announcements Bulletin (Announcement context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures global dashboard alerts (e.g., Holidays, Schedule changes).
-- 2. Restricts viewability scope to specific targets (Course, Department lines).
-- 3. Enables clean scheduling using effective expiry time parameters.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.announcements (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    -- Target filters
    course_id UUID NULL,
    department_id UUID NULL,
    
    -- Announcement Details
    announcement_type announcement_type_enum NOT NULL DEFAULT 'GENERAL',
    title VARCHAR(150) NOT NULL,
    content TEXT NOT NULL,
    
    -- Scheduling Range
    published_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    expires_at TIMESTAMP WITH TIME ZONE NULL,
    
    created_by_user UUID NULL, -- References public.users.id
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ann_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_ann_course_tenant FOREIGN KEY (tenant_id, course_id)
        REFERENCES public.courses(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_ann_dept_tenant FOREIGN KEY (tenant_id, department_id)
        REFERENCES public.departments(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT fk_ann_publisher FOREIGN KEY (created_by_user)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_ann_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_ann_content CHECK (length(trim(content)) > 0),
    CONSTRAINT chk_ann_dates CHECK (expires_at IS NULL OR expires_at > published_at),
    CONSTRAINT chk_ann_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_ann_tenant_type ON public.announcements(tenant_id, announcement_type) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ann_dates ON public.announcements(published_at, expires_at) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.announcements DROP CONSTRAINT IF EXISTS uq_announcements_tenant_id CASCADE;
ALTER TABLE public.announcements ADD CONSTRAINT uq_announcements_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_announcements_touch_audit ON public.announcements;
CREATE TRIGGER trg_biu_announcements_touch_audit
    BEFORE INSERT OR UPDATE ON public.announcements
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_announcements_policy ON public.announcements
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_announcements_policy ON public.announcements
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_announcements_policy ON public.announcements
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_announcements_policy ON public.announcements
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
