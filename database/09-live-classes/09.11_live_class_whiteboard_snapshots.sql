-- ============================================================================
-- SQL File: 09.11_live_class_whiteboard_snapshots.sql
-- Domain: Session Whiteboard Draw Snapshots (Archiving Content Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Archives session visual whiteboard outputs periodically.
-- 2. Tracks draw revisions, page number mappings, and captured by context.
-- 3. Stores raw OCR processed texts and embedding vectors keys for search utility.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_whiteboard_snapshots (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    session_id UUID NOT NULL,
    
    -- Snapshot storage pointer
    storage_object_id VARCHAR(250) NOT NULL,
    page_number SMALLINT NOT NULL DEFAULT 1,
    drawing_version SMALLINT NOT NULL DEFAULT 1,
    
    -- OCR metadata for AI search
    ocr_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PENDING, COMPLETED, FAILED
    ocr_text TEXT NULL,
    embedding_id UUID NULL, -- Placeholder mapping to vector databases
    
    captured_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    captured_by UUID NULL, -- References public.users.id
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lcwhite_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcwhite_session FOREIGN KEY (tenant_id, session_id)
        REFERENCES public.live_class_sessions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_lcwhite_capturer FOREIGN KEY (captured_by)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_lcwhite_page CHECK (page_number > 0),
    CONSTRAINT chk_lcwhite_draw_version CHECK (drawing_version > 0),
    CONSTRAINT chk_lcwhite_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_lcwhite_session ON public.live_class_whiteboard_snapshots(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcwhite_captured ON public.live_class_whiteboard_snapshots(captured_at) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_whiteboard_snapshots_touch_audit ON public.live_class_whiteboard_snapshots;
CREATE TRIGGER trg_biu_live_class_whiteboard_snapshots_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_whiteboard_snapshots
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_whiteboard_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_whiteboard_snapshots_policy ON public.live_class_whiteboard_snapshots
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_whiteboard_snapshots_policy ON public.live_class_whiteboard_snapshots
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_whiteboard_snapshots_policy ON public.live_class_whiteboard_snapshots
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_whiteboard_snapshots_policy ON public.live_class_whiteboard_snapshots
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
