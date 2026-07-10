-- ============================================================================
-- SQL File: 13.07_ai_generated_content.sql
-- Domain: AI Generated content assets (Cache context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Cache configuration registry for generated study materials (explanations, revision plans).
-- 2. Prevents repeating expensive LLM calls if same entity requests the same context.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.ai_generated_content (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    -- Source properties (e.g. Question explain, exam summary)
    content_type VARCHAR(100) NOT NULL, -- e.g. QUESTION_EXPLANATION, STUDY_PLAN, NOTES_SUMMARY
    
    -- Target linkage (polymorphic identifiers references)
    reference_entity_type VARCHAR(50) NOT NULL, -- e.g. QUESTIONS, ADMISSIONS
    reference_entity_id UUID NOT NULL,
    
    generated_output JSONB NOT NULL, -- The final formatted text content or JSON struct
    
    -- Meta
    is_published BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_agc_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_agc_type CHECK (length(trim(content_type)) > 0),
    CONSTRAINT chk_agc_entity CHECK (length(trim(reference_entity_type)) > 0),
    CONSTRAINT chk_agc_version CHECK (version > 0)
);

-- 2. Unique: cache one generated entity summary per target type per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_agc_entity_cache
    ON public.ai_generated_content(tenant_id, content_type, reference_entity_type, reference_entity_id)
    WHERE deleted_at IS NULL;

-- 2.1 Indexes
CREATE INDEX IF NOT EXISTS idx_agc_cache ON public.ai_generated_content(reference_entity_type, reference_entity_id) WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.ai_generated_content DROP CONSTRAINT IF EXISTS uq_ai_generated_content_tenant_id CASCADE;
ALTER TABLE public.ai_generated_content ADD CONSTRAINT uq_ai_generated_content_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_ai_generated_content_touch_audit ON public.ai_generated_content;
CREATE TRIGGER trg_biu_ai_generated_content_touch_audit
    BEFORE INSERT OR UPDATE ON public.ai_generated_content
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.ai_generated_content ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_generated_content_policy ON public.ai_generated_content
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_ai_generated_content_policy ON public.ai_generated_content
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_ai_generated_content_policy ON public.ai_generated_content
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_ai_generated_content_policy ON public.ai_generated_content
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- 5. Late-binding foreign keys to resolve circular load-order dependencies
ALTER TABLE public.ai_messages DROP CONSTRAINT IF EXISTS fk_amsg_gen_content;
ALTER TABLE public.ai_messages ADD CONSTRAINT fk_amsg_gen_content 
    FOREIGN KEY (tenant_id, ai_generated_content_id) 
    REFERENCES public.ai_generated_content(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL;
