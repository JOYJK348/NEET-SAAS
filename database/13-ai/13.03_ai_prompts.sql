-- ============================================================================
-- SQL File: 13.03_ai_prompts.sql
-- Domain: Prompt templates registry manager
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Prompt layouts configurations repository (avoids hardcoding in backend code).
-- 2. Scopes version parameters tracking updates over time.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.ai_prompts (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(100) NOT NULL, -- e.g. EXPLAIN_QUESTION, STUDY_PLAN_GENERATOR
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    system_prompt TEXT NOT NULL,
    user_template TEXT NULL, -- Dynamic inputs placeholders (e.g. {{question_body}})
    
    version_number INTEGER NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_ap_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_ap_code CHECK (code ~ '^[A-Z0-9_]{3,100}$'),
    CONSTRAINT chk_ap_name CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_ap_system CHECK (length(trim(system_prompt)) > 0),
    CONSTRAINT chk_ap_version_num CHECK (version_number > 0),
    CONSTRAINT chk_ap_version CHECK (version > 0)
);

-- 2. Unique: prevent duplicate prompt templates codes per version per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_ap_tenant_code_version
    ON public.ai_prompts(tenant_id, code, version_number)
    WHERE deleted_at IS NULL;

-- 2.2 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.ai_prompts DROP CONSTRAINT IF EXISTS uq_ai_prompts_tenant_id CASCADE;
ALTER TABLE public.ai_prompts ADD CONSTRAINT uq_ai_prompts_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_ai_prompts_touch_audit ON public.ai_prompts;
CREATE TRIGGER trg_biu_ai_prompts_touch_audit
    BEFORE INSERT OR UPDATE ON public.ai_prompts
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.ai_prompts ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_prompts_policy ON public.ai_prompts
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_ai_prompts_policy ON public.ai_prompts
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_ai_prompts_policy ON public.ai_prompts
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_ai_prompts_policy ON public.ai_prompts
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
