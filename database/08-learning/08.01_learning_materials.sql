-- ============================================================================
-- SQL File: 08.01_learning_materials.sql
-- Domain: Learning Materials Aggregate Root
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "learning_materials" is the root aggregate for the LMS bounded context.
-- 2. Stores only content metadata (title, description, type, academic mapping).
--    Files (PDF, Video, Image, ZIP) go into 08.03_material_attachments.
-- 3. Full academic hierarchy: course → subject → chapter → topic → batch
--    enabling granular filtering, targeting, and analytics.
-- 4. AI-ready: embedding_id for vector search, keywords for tag-based
--    discovery, search_vector for full-text search, ai_metadata JSONB.
-- 5. Version-safe: content edits create new versions in 08.02_material_versions.
-- 6. RLS: Super Admin + Institute Admin + Teacher + Student + Parent
--    (parents read-only via complementary policy).
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.learning_materials (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,

    -- Identity
    material_code VARCHAR(50) NOT NULL,

    -- Academic Hierarchy
    course_id UUID NOT NULL,
    subject_id UUID NOT NULL,
    chapter_id UUID NOT NULL,
    topic_id UUID,
    batch_id UUID,

    -- Content Metadata
    title VARCHAR(255) NOT NULL,
    description TEXT,
    material_type learning_material_type_enum NOT NULL DEFAULT 'NOTES',
    language VARCHAR(10) NOT NULL DEFAULT 'EN',
    difficulty question_difficulty_enum,
    estimated_duration INTEGER,
    reading_time INTEGER,

    -- Publishing
    status learning_material_status_enum NOT NULL DEFAULT 'DRAFT',
    published_at TIMESTAMP WITH TIME ZONE,
    published_by UUID,
    visibility material_visibility_enum NOT NULL DEFAULT 'COURSE_ONLY',

    -- AI & Search
    embedding_id UUID,
    summary TEXT,
    keywords TEXT[],
    ai_metadata JSONB,
    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('english', coalesce(title, '') || ' ' || coalesce(description, ''))
    ) STORED,

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_learning_materials_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_learning_materials_course FOREIGN KEY (tenant_id, course_id)
        REFERENCES public.courses(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_learning_materials_subject FOREIGN KEY (tenant_id, subject_id)
        REFERENCES public.subjects(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_learning_materials_chapter FOREIGN KEY (tenant_id, chapter_id)
        REFERENCES public.chapters(tenant_id, id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_learning_materials_topic FOREIGN KEY (tenant_id, topic_id)
        REFERENCES public.topics(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_learning_materials_batch FOREIGN KEY (tenant_id, batch_id)
        REFERENCES public.batches(tenant_id, id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_learning_materials_published_by FOREIGN KEY (published_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_learning_materials_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_learning_materials_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_learning_materials_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_learning_materials_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_material_code CHECK (length(trim(material_code)) > 0),
    CONSTRAINT chk_material_title CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_material_duration CHECK (estimated_duration IS NULL OR estimated_duration > 0),
    CONSTRAINT chk_material_reading_time CHECK (reading_time IS NULL OR reading_time > 0),
    CONSTRAINT chk_material_version CHECK (version > 0),

    -- Unique material code per tenant
    CONSTRAINT uq_learning_material_code UNIQUE (tenant_id, material_code)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_learning_materials_tenant_id') THEN
        ALTER TABLE public.learning_materials ADD CONSTRAINT uq_learning_materials_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lm_tenant_course ON public.learning_materials(tenant_id, course_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lm_tenant_subject ON public.learning_materials(tenant_id, subject_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lm_tenant_chapter ON public.learning_materials(tenant_id, chapter_id, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lm_tenant_topic ON public.learning_materials(tenant_id, topic_id) WHERE topic_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lm_tenant_batch ON public.learning_materials(tenant_id, batch_id) WHERE batch_id IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lm_tenant_type ON public.learning_materials(tenant_id, material_type, status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lm_tenant_status ON public.learning_materials(tenant_id, status, created_at) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lm_tenant_published ON public.learning_materials(tenant_id, published_at) WHERE published_at IS NOT NULL AND deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lm_search_vector ON public.learning_materials USING GIN(search_vector) WHERE deleted_at IS NULL;

-- Trigger: validate tenant alignment across academic hierarchy
CREATE OR REPLACE FUNCTION public.validate_learning_material_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    course_tenant UUID;
    subject_tenant UUID;
    chapter_tenant UUID;
    topic_tenant UUID;
    batch_tenant UUID;
BEGIN
    SELECT tenant_id INTO STRICT course_tenant
    FROM public.courses WHERE id = NEW.course_id AND deleted_at IS NULL;

    SELECT tenant_id INTO STRICT subject_tenant
    FROM public.subjects WHERE id = NEW.subject_id AND deleted_at IS NULL;

    SELECT tenant_id INTO STRICT chapter_tenant
    FROM public.chapters WHERE id = NEW.chapter_id AND deleted_at IS NULL;

    IF course_tenant <> NEW.tenant_id OR subject_tenant <> NEW.tenant_id OR chapter_tenant <> NEW.tenant_id THEN
        RAISE EXCEPTION 'Referential integrity violation: tenant_id mismatch across course, subject, chapter, and learning_material';
    END IF;

    IF NEW.topic_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT topic_tenant
        FROM public.topics WHERE id = NEW.topic_id AND deleted_at IS NULL;

        IF topic_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: topic tenant_id mismatch with learning_material';
        END IF;
    END IF;

    IF NEW.batch_id IS NOT NULL THEN
        SELECT tenant_id INTO STRICT batch_tenant
        FROM public.batches WHERE id = NEW.batch_id AND deleted_at IS NULL;

        IF batch_tenant <> NEW.tenant_id THEN
            RAISE EXCEPTION 'Referential integrity violation: batch tenant_id mismatch with learning_material';
        END IF;
    END IF;

    RETURN NEW;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        RAISE EXCEPTION 'Referential integrity violation: Associated course, subject, chapter, topic, or batch does not exist or is soft-deleted';
    WHEN TOO_MANY_ROWS THEN
        RAISE EXCEPTION 'Database state error: Duplicate lookup matched';
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_learning_material_tenant ON public.learning_materials;
CREATE TRIGGER trg_biu_learning_material_tenant
    BEFORE INSERT OR UPDATE ON public.learning_materials
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_learning_material_tenant();

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_learning_materials_touch_audit ON public.learning_materials;
CREATE TRIGGER trg_bu_learning_materials_touch_audit
    BEFORE INSERT OR UPDATE ON public.learning_materials
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.learning_materials ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_lm_select ON public.learning_materials;
CREATE POLICY policy_lm_select
    ON public.learning_materials FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

DROP POLICY IF EXISTS policy_lm_insert ON public.learning_materials;
CREATE POLICY policy_lm_insert
    ON public.learning_materials FOR INSERT TO authenticated
    WITH CHECK (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

DROP POLICY IF EXISTS policy_lm_update ON public.learning_materials;
CREATE POLICY policy_lm_update
    ON public.learning_materials FOR UPDATE TO authenticated
    USING (
        current_user_is_super_admin()
        OR (tenant_id = current_tenant_id())
    );

COMMENT ON TABLE public.learning_materials IS 'Learning materials aggregate root — stores content metadata with full academic hierarchy. Files stored separately in 08.03_material_attachments.';
COMMENT ON COLUMN public.learning_materials.material_code IS 'Unique material identifier code within tenant (e.g. PHY-NOTES-001)';
COMMENT ON COLUMN public.learning_materials.material_type IS 'Content format: NOTES, VIDEO, PDF, REVISION_SHEET, MIND_MAP, LAB_MANUAL, FLASH_CARDS, etc.';
COMMENT ON COLUMN public.learning_materials.estimated_duration IS 'Estimated time to consume this material (in minutes)';
COMMENT ON COLUMN public.learning_materials.reading_time IS 'Estimated reading time for text-based materials (in minutes)';
COMMENT ON COLUMN public.learning_materials.visibility IS 'Access scope: PUBLIC, COURSE_ONLY, BATCH_ONLY, PRIVATE';
COMMENT ON COLUMN public.learning_materials.embedding_id IS 'Vector embedding ID for AI-powered content recommendations and similarity search';
COMMENT ON COLUMN public.learning_materials.keywords IS 'Array of search keywords for tag-based content discovery';
COMMENT ON COLUMN public.learning_materials.search_vector IS 'Auto-generated full-text search vector from title and description (English)';
COMMENT ON COLUMN public.learning_materials.version IS 'Optimistic concurrency control version stamp';
