-- ============================================================================
-- SQL File: 13.08_ai_feedback.sql
-- Domain: User evaluation checks (Feedback Context)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Captures student thumbs up/down feedback ratings on AI Tutor responses.
-- 2. Embeds text remarks input details to help calibrating prompts.
-- 3. Touch audits automatically populate update stamps.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.ai_feedback (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    ai_message_id UUID NOT NULL,
    
    -- Ratings
    rating_score SMALLINT NOT NULL, -- e.g. 1 (helpful) or -1 (unhelpful)
    comments TEXT NULL,
    
    user_id UUID NOT NULL, -- References public.users.id
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_afb_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency
    CONSTRAINT fk_afb_message FOREIGN KEY (tenant_id, ai_message_id)
        REFERENCES public.ai_messages(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_afb_user FOREIGN KEY (user_id)
        REFERENCES public.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT chk_afb_score CHECK (rating_score IN (-1, 1)),
    CONSTRAINT chk_afb_version CHECK (version > 0)
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS idx_afb_message ON public.ai_feedback(ai_message_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_ai_feedback_touch_audit ON public.ai_feedback;
CREATE TRIGGER trg_biu_ai_feedback_touch_audit
    BEFORE INSERT OR UPDATE ON public.ai_feedback
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.ai_feedback ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_ai_feedback_policy ON public.ai_feedback
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_ai_feedback_policy ON public.ai_feedback
    FOR INSERT
    WITH CHECK (
        tenant_id = current_tenant_id()
        AND user_id = auth.uid()
    );

CREATE POLICY update_ai_feedback_policy ON public.ai_feedback
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL AND user_id = auth.uid())
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_ai_feedback_policy ON public.ai_feedback
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL AND user_id = auth.uid());
