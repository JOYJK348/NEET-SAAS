-- ============================================================================
-- SQL File: 01.11_topics.sql
-- Domain: Master Core Syllabus Topics Configuration
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "topics" belong to specific "chapters" to map sub-syllabus partitions.
-- 2. Uses composite foreign key (tenant_id, chapter_id) with ON UPDATE CASCADE
--    to prevent cross-tenant/course references.
-- 3. Added optional "learning_objectives" TEXT field for AI lesson plans and tags.
-- 4. Added "difficulty_level" VARCHAR(20) CHECK parameter (EASY, MEDIUM, HARD, ADVANCED).
-- 5. Naming alignment: Renamed estimated_sessions to planned_sessions.
-- 6. Scopes unique name/short_name validation case-insensitively using partial unique lower(trim()) indexes.
-- 7. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.topics (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    
    code VARCHAR(30) NOT NULL,
    name VARCHAR(150) NOT NULL,
    short_name VARCHAR(20) NULL,
    description TEXT NULL,
    learning_objectives TEXT NULL,
    
    difficulty_level VARCHAR(20) NOT NULL DEFAULT 'MEDIUM',
    planned_hours SMALLINT NOT NULL DEFAULT 4,
    planned_sessions SMALLINT NOT NULL DEFAULT 3,
    display_order SMALLINT NOT NULL DEFAULT 1,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References auth_users.id (FK added in auth migration step)
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_topics_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Composite foreign key enforcing tenant safety
    CONSTRAINT fk_topics_chapter_tenant FOREIGN KEY (tenant_id, chapter_id) 
        REFERENCES public.chapters(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_topics_name_length CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_topics_short_name_length CHECK (short_name IS NULL OR length(trim(short_name)) > 0),
    CONSTRAINT chk_topics_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]{1,29}$'),
    CONSTRAINT chk_topics_description CHECK (description IS NULL OR (length(trim(description)) > 0 AND length(description) <= 1000)),
    CONSTRAINT chk_topics_objectives CHECK (learning_objectives IS NULL OR (length(trim(learning_objectives)) > 0 AND length(learning_objectives) <= 2000)),
    CONSTRAINT chk_topics_difficulty CHECK (difficulty_level IN ('EASY', 'MEDIUM', 'HARD', 'ADVANCED')),
    CONSTRAINT chk_topics_planned_hours CHECK (planned_hours BETWEEN 1 AND 1000),
    CONSTRAINT chk_topics_planned_sessions CHECK (planned_sessions BETWEEN 1 AND 500),
    CONSTRAINT chk_topics_display_order CHECK (display_order > 0),
    CONSTRAINT chk_topics_version CHECK (version > 0)
);

-- 2. Indexes for fast tenant search and ordering lookups (Tenant Scoped)
CREATE INDEX IF NOT EXISTS idx_topics_tenant_chapter_active 
    ON public.topics(tenant_id, chapter_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_topics_tenant_chapter_display 
    ON public.topics(tenant_id, chapter_id, display_order) 
    WHERE deleted_at IS NULL;

-- Dynamic search index for keyword scans on name
CREATE INDEX IF NOT EXISTS idx_topics_tenant_name_search
    ON public.topics(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in downstream entities)
ALTER TABLE public.topics DROP CONSTRAINT IF EXISTS uq_topics_tenant_id;
ALTER TABLE public.topics ADD CONSTRAINT uq_topics_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Indexes for Soft Deletes (prevents duplicate codes/names within the same chapter)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_topics_tenant_ch_code 
    ON public.topics(tenant_id, chapter_id, code) 
    WHERE deleted_at IS NULL;

-- Case-insensitive name unique index using lower(trim()) mapping checks
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_topics_tenant_ch_name_lower
    ON public.topics(tenant_id, chapter_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- Case-insensitive short_name unique index using lower(trim()) mapping checks (when not null)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_topics_tenant_ch_short_name_lower
    ON public.topics(tenant_id, chapter_id, lower(trim(short_name)))
    WHERE deleted_at IS NULL AND short_name IS NOT NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_topics_touch_audit ON public.topics;
CREATE TRIGGER trg_biu_topics_touch_audit
    BEFORE INSERT OR UPDATE ON public.topics
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.topics ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_topics_select ON public.topics;
CREATE POLICY policy_topics_select
    ON public.topics
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.topics IS 'Academic syllabus topics configurations directory per chapter';
COMMENT ON COLUMN public.topics.code IS 'Uppercase topic identifier code (e.g. CARNOT_CYCLE)';
COMMENT ON COLUMN public.topics.short_name IS 'Short uppercase abbreviation code (e.g. CARN)';
COMMENT ON COLUMN public.topics.difficulty_level IS 'Syllabus cognitive difficulty rating (e.g. MEDIUM)';
COMMENT ON COLUMN public.topics.learning_objectives IS 'Text explanation of syllabus learning outcomes';
COMMENT ON COLUMN public.topics.planned_hours IS 'Planned teaching hours allocation';
COMMENT ON COLUMN public.topics.planned_sessions IS 'Planned lecture sessions count';
COMMENT ON COLUMN public.topics.display_order IS 'Sort order tracking sequence';
COMMENT ON COLUMN public.topics.is_active IS 'Active selection toggle';
COMMENT ON COLUMN public.topics.version IS 'Optimistic concurrency control version stamp';
