-- ============================================================================
-- SQL File: 07.09_question_usage.sql
-- Domain: Question Usage Analytics
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Materialized analytics to avoid heavy aggregation queries on exam_answers.
-- 2. Updated periodically via batch job — not in real-time.
-- 3. Tracks exam count, attempt count, correct/wrong percentages, avg time.
-- 4. difficulty_trend JSONB stores historical difficulty shifts for ML analysis.
-- 5. One row per question — UPSERT pattern via batch update.
-- ============================================================================

SET search_path = public;

CREATE TABLE IF NOT EXISTS public.question_usage (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    question_id UUID NOT NULL,

    -- Usage Counts
    exam_count INTEGER NOT NULL DEFAULT 0,
    attempt_count INTEGER NOT NULL DEFAULT 0,
    correct_count INTEGER NOT NULL DEFAULT 0,
    wrong_count INTEGER NOT NULL DEFAULT 0,
    skipped_count INTEGER NOT NULL DEFAULT 0,

    -- Derived Percentages
    correct_percentage DECIMAL(5,2),
    wrong_percentage DECIMAL(5,2),
    skipped_percentage DECIMAL(5,2),

    -- Performance
    avg_time_seconds DECIMAL(10,2),
    max_time_seconds DECIMAL(10,2),
    min_time_seconds DECIMAL(10,2),

    -- Trend Data
    last_used_at TIMESTAMP WITH TIME ZONE,
    difficulty_trend JSONB,

    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),

    -- Soft Delete
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,

    version INTEGER NOT NULL DEFAULT 1,

    -- Constraints
    CONSTRAINT fk_question_usage_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    CONSTRAINT fk_question_usage_question FOREIGN KEY (tenant_id, question_id)
        REFERENCES public.questions(tenant_id, id) ON UPDATE RESTRICT ON DELETE CASCADE,

    CONSTRAINT fk_question_usage_deleted_by FOREIGN KEY (deleted_by)
        REFERENCES public.users(id) ON UPDATE RESTRICT ON DELETE RESTRICT,

    -- Composite Uniqueness
    CONSTRAINT uq_question_usage_tenant_id UNIQUE (tenant_id, id),

    -- Business Rules
    CONSTRAINT chk_usage_counts CHECK (exam_count >= 0 AND attempt_count >= 0 AND correct_count >= 0 AND wrong_count >= 0 AND skipped_count >= 0),
    CONSTRAINT chk_usage_percentages CHECK (
        correct_percentage IS NULL OR (correct_percentage BETWEEN 0 AND 100)
    ),
    CONSTRAINT chk_usage_time CHECK (avg_time_seconds IS NULL OR avg_time_seconds >= 0),
    CONSTRAINT chk_usage_version CHECK (version > 0),

    -- One usage row per question
    CONSTRAINT uq_question_usage UNIQUE (question_id)
);

-- Idempotent backup
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'uq_question_usage_tenant_id') THEN
        ALTER TABLE public.question_usage ADD CONSTRAINT uq_question_usage_tenant_id UNIQUE (tenant_id, id);
    END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_question_usage_tenant ON public.question_usage(tenant_id, question_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_usage_performance ON public.question_usage(tenant_id, correct_percentage, avg_time_seconds) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_question_usage_last_used ON public.question_usage(tenant_id, last_used_at) WHERE last_used_at IS NOT NULL AND deleted_at IS NULL;

-- RLS
ALTER TABLE public.question_usage ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS policy_question_usage_select ON public.question_usage;
CREATE POLICY policy_question_usage_select
    ON public.question_usage FOR SELECT TO authenticated
    USING (
        deleted_at IS NULL
        AND (
            current_user_is_super_admin()
            OR (tenant_id = current_tenant_id())
        )
    );

COMMENT ON TABLE public.question_usage IS 'Materialized question usage analytics — updated via batch job, not real-time';
COMMENT ON COLUMN public.question_usage.exam_count IS 'Number of distinct exams this question has appeared in';
COMMENT ON COLUMN public.question_usage.attempt_count IS 'Total student attempts on this question';
COMMENT ON COLUMN public.question_usage.correct_percentage IS 'Percentage of students who answered correctly';
COMMENT ON COLUMN public.question_usage.avg_time_seconds IS 'Average time spent on this question in seconds';
COMMENT ON COLUMN public.question_usage.difficulty_trend IS 'JSONB: historical difficulty shifts over time for ML analysis';
COMMENT ON COLUMN public.question_usage.version IS 'Optimistic concurrency control version stamp';
