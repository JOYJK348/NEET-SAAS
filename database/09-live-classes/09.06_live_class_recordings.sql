-- ============================================================================
-- SQL File: 09.06_live_class_recordings.sql
-- Domain: Session Video Stream Recordings (Post Production Abstractions)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Maps video stream recordings directly to execution sessions.
-- 2. Stores abstract storage object IDs, duration, codec, and file signature checkpoints.
-- 3. Models asynchronous processing milestones for transcripts, subtitles, and summaries.
-- 4. Uses touch_audit_columns trigger to populate stamps.
-- 5. Restricts duplicate mappings per session.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_recordings (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    session_id UUID NOT NULL,
    
    -- Abstraction references pointing to storage boundaries
    storage_object_id VARCHAR(250) NULL,
    thumbnail_object_id VARCHAR(250) NULL,
    transcript_object_id VARCHAR(250) NULL,
    subtitle_object_id VARCHAR(250) NULL,
    
    -- Telemetry
    duration_seconds INTEGER NOT NULL DEFAULT 0,
    resolution VARCHAR(50) NULL, -- e.g. 1080p, 720p
    bitrate_kbps INTEGER NULL,
    file_size_bytes BIGINT NULL,
    checksum VARCHAR(64) NULL, -- SHA256 checksum verification
    
    -- AI pipeline lifecycle states
    status recording_status_enum NOT NULL DEFAULT 'PROCESSING',
    
    -- Processing Milestones
    processing_started_at TIMESTAMP WITH TIME ZONE NULL,
    processing_completed_at TIMESTAMP WITH TIME ZONE NULL,
    transcript_completed_at TIMESTAMP WITH TIME ZONE NULL,
    ai_summary_completed_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lcr_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lcr_session FOREIGN KEY (tenant_id, session_id)
        REFERENCES public.live_class_sessions(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_lcr_duration CHECK (duration_seconds >= 0),
    CONSTRAINT chk_lcr_file_size CHECK (file_size_bytes IS NULL OR file_size_bytes > 0),
    CONSTRAINT chk_lcr_bitrate CHECK (bitrate_kbps IS NULL OR bitrate_kbps > 0),
    CONSTRAINT chk_lcr_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_lcr_session ON public.live_class_recordings(session_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lcr_status ON public.live_class_recordings(status) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.live_class_recordings DROP CONSTRAINT IF EXISTS uq_live_class_recordings_tenant_id CASCADE;
ALTER TABLE public.live_class_recordings ADD CONSTRAINT uq_live_class_recordings_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_recordings_touch_audit ON public.live_class_recordings;
CREATE TRIGGER trg_biu_live_class_recordings_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_recordings
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_recordings ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_recordings_policy ON public.live_class_recordings
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_recordings_policy ON public.live_class_recordings
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_recordings_policy ON public.live_class_recordings
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_recordings_policy ON public.live_class_recordings
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
