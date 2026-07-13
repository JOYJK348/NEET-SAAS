-- ============================================================================
-- SQL File: 07.08_question_reviews.sql
-- Domain: Question Academic Review Workflow
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Tracks the academic review workflow: DRAFT → IN_REVIEW → APPROVED / REJECTED.
-- 2. Multiple review rounds per question with reviewer comments.
-- 3. reviewer_id references users with reviewer role.
-- 4. Cascade deletes with question — reviews have no independent lifecycle.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_reviews (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    question_id UUID NOT NULL,

    reviewer_id UUID NOT NULL,
    review_status review_status_enum NOT NULL DEFAULT 'PENDING',
    comments TEXT,
    reviewed_at TIMESTAMP WITH TIME ZONE,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_question_reviews_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_reviews_question FOREIGN KEY (tenant_id, question_id)
        REFERENCES public.questions(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_question_reviews_reviewer FOREIGN KEY (reviewer_id)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_reviews_created_by FOREIGN KEY (created_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_reviews_updated_by FOREIGN KEY (updated_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    CONSTRAINT fk_question_reviews_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE SET NULL,

    -- Composite Uniqueness
    CONSTRAINT uq_question_reviews_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_review_comments CHECK (comments IS NULL OR length(trim(comments)) > 0),
    CONSTRAINT chk_review_timing CHECK (
        (review_status = 'PENDING' AND reviewed_at IS NULL)
        OR (review_status IN ('IN_REVIEW', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED') AND reviewed_at IS NOT NULL)
    ),
    CONSTRAINT chk_review_version CHECK (version > 0)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_question_reviews_tenant_id') THEN
        ALTER TABLE public.question_reviews ADD CONSTRAINT uq_question_reviews_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_reviews_question ON public.question_reviews(question_id, review_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_reviews_reviewer ON public.question_reviews(reviewer_id, review_status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_reviews_tenant ON public.question_reviews(tenant_id, question_id) WHERE deleted_at IS NULL;

-- Audit trigger
DROP TRIGGER IF EXISTS trg_bu_question_reviews_touch_audit ON public.question_reviews;
CREATE TRIGGER trg_bu_question_reviews_touch_audit
    BEFORE INSERT OR UPDATE ON public.question_reviews
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- RLS
ALTER TABLE public.question_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_question_reviews_select ON public.question_reviews;
CREATE POLICY policy_question_reviews_select
    ON public.question_reviews FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

COMMENT ON TABLE public.question_reviews IS 'Academic review workflow for question approval and quality control';
COMMENT ON COLUMN public.question_reviews.review_status IS 'Workflow: PENDING → IN_REVIEW → CHANGES_REQUESTED / APPROVED / REJECTED';
COMMENT ON COLUMN public.question_reviews.comments IS 'Reviewer comments and feedback for changes';
COMMENT ON COLUMN public.question_reviews.reviewed_at IS 'Timestamp when review decision was made';
COMMENT ON COLUMN public.question_reviews.version IS 'Optimistic concurrency control version stamp';
