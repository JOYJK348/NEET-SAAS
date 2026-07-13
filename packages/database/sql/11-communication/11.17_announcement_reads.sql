-- ============================================================================
-- SQL File: 11.17_announcement_reads.sql
-- Domain: Announcements read verification checks logs
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Logs who viewed which announcements to verify legal compliance.
-- 2. Restricts duplicate read entries per announcement per user.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.announcement_reads (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    announcement_id UUID NOT NULL,
    user_id UUID NOT NULL, -- References public.users.id
    
    read_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ar_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_ar_announcement FOREIGN KEY (tenant_id, announcement_id)
        REFERENCES public.announcements(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_ar_user FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_ar_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate read log mapping per user
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ar_announcement_user
    ON public.announcement_reads(tenant_id, announcement_id, user_id)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_ar_announcement ON public.announcement_reads(announcement_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_ar_user ON public.announcement_reads(user_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_announcement_reads_touch_audit ON public.announcement_reads;
CREATE TRIGGER trg_biu_announcement_reads_touch_audit
    BEFORE INSERT OR UPDATE ON public.announcement_reads
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.announcement_reads ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_announcement_reads_policy ON public.announcement_reads
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_announcement_reads_policy ON public.announcement_reads
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_announcement_reads_policy ON public.announcement_reads
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_announcement_reads_policy ON public.announcement_reads
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
