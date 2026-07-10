-- ============================================================================
-- SQL File: 09.01_live_classes.sql
-- Domain: Live Classes Master Configurations (Aggregate Root)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Maps scheduled live class catalog entities per tenant.
-- 2. Embeds relational references to courses, academic years, optional batches, subjects, chapters, and topics.
-- 3. Implements strict state machine checking constraints via CHECK rules.
-- 4. Uses touch_audit_columns trigger to automate record version updates.
-- 5. Implements row-level security (RLS) scoping matching tenant allocations.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_classes (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    -- Academic Context
    course_id UUID NOT NULL,
    academic_year_id UUID NOT NULL,
    batch_id UUID NULL, -- Null implies open to all branch sessions of this course
    subject_id UUID NOT NULL,
    chapter_id UUID NULL,
    topic_id UUID NULL,
    question_paper_id UUID NULL, -- Optional link for test analysis classes
    
    -- Classroom info
    title VARCHAR(150) NOT NULL,
    subtitle VARCHAR(250) NULL,
    description TEXT NULL,
    learning_objectives TEXT[] NULL,
    prerequisites TEXT[] NULL,
    teacher_notes TEXT NULL,
    
    -- Config & Policy parameters
    class_type live_class_type_enum NOT NULL DEFAULT 'LIVE',
    meeting_provider meeting_provider_enum NOT NULL DEFAULT 'ZOOM',
    meeting_code VARCHAR(100) NULL,
    meeting_password VARCHAR(100) NULL,
    
    -- Feature gates
    waiting_room_enabled BOOLEAN NOT NULL DEFAULT true,
    lobby_enabled BOOLEAN NOT NULL DEFAULT false,
    recording_enabled BOOLEAN NOT NULL DEFAULT true,
    chat_enabled BOOLEAN NOT NULL DEFAULT true,
    screen_share_enabled BOOLEAN NOT NULL DEFAULT true,
    whiteboard_enabled BOOLEAN NOT NULL DEFAULT true,
    breakout_room_enabled BOOLEAN NOT NULL DEFAULT false,
    
    -- Schedule
    scheduled_start TIMESTAMP WITH TIME ZONE NOT NULL,
    scheduled_end TIMESTAMP WITH TIME ZONE NOT NULL,
    actual_start TIMESTAMP WITH TIME ZONE NULL,
    actual_end TIMESTAMP WITH TIME ZONE NULL,
    duration_minutes SMALLINT NULL,
    
    -- Capacity parameters
    maximum_students INTEGER NOT NULL DEFAULT 500,
    minimum_students INTEGER NOT NULL DEFAULT 1,
    allow_waitlist BOOLEAN NOT NULL DEFAULT false,
    waitlist_count INTEGER NOT NULL DEFAULT 0,
    
    -- Lifecycle state machine
    status live_class_status_enum NOT NULL DEFAULT 'DRAFT',
    
    -- Publication
    published_at TIMESTAMP WITH TIME ZONE NULL,
    published_by UUID NULL,
    
    -- Cancellation
    cancelled_at TIMESTAMP WITH TIME ZONE NULL,
    cancelled_by UUID NULL,
    cancel_reason VARCHAR(500) NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lc_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lc_course_tenant FOREIGN KEY (tenant_id, course_id)
        REFERENCES public.courses(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lc_academic_year_tenant FOREIGN KEY (tenant_id, academic_year_id)
        REFERENCES public.academic_years(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lc_batch_tenant FOREIGN KEY (tenant_id, batch_id)
        REFERENCES public.batches(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lc_subject_tenant FOREIGN KEY (tenant_id, subject_id)
        REFERENCES public.subjects(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lc_chapter_tenant FOREIGN KEY (tenant_id, chapter_id)
        REFERENCES public.chapters(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT fk_lc_topic_tenant FOREIGN KEY (tenant_id, topic_id)
        REFERENCES public.topics(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,

    CONSTRAINT fk_lc_question_paper_tenant FOREIGN KEY (tenant_id, question_paper_id)
        REFERENCES public.question_papers(tenant_id, id) ON UPDATE CASCADE ON DELETE SET NULL,
        
    CONSTRAINT chk_lc_title_length CHECK (length(trim(title)) > 0),
    CONSTRAINT chk_lc_schedule CHECK (scheduled_end > scheduled_start),
    CONSTRAINT chk_lc_actual_times CHECK (actual_end IS NULL OR actual_start IS NOT NULL),
    CONSTRAINT chk_lc_actual_ends CHECK (actual_end IS NULL OR actual_end > actual_start),
    CONSTRAINT chk_lc_duration CHECK (duration_minutes IS NULL OR duration_minutes > 0),
    
    CONSTRAINT chk_lc_publish_lifecycle CHECK (
        (status = 'DRAFT' AND published_at IS NULL AND published_by IS NULL)
        OR (status <> 'DRAFT' AND published_at IS NOT NULL AND published_by IS NOT NULL)
    ),
    
    CONSTRAINT chk_lc_cancellation CHECK (
        (status <> 'CANCELLED' AND cancelled_at IS NULL AND cancelled_by IS NULL AND cancel_reason IS NULL)
        OR (status = 'CANCELLED' AND cancelled_at IS NOT NULL AND cancelled_by IS NOT NULL AND cancel_reason IS NOT NULL)
    ),
    
    CONSTRAINT chk_lc_capacity CHECK (maximum_students >= minimum_students),
    CONSTRAINT chk_lc_version CHECK (version > 0)
);

-- Unique index to prevent duplicate sessions for same course/batch, subject, and time interval per tenant
-- (Only active when class is SCHEDULED or PUBLISHED)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_lc_schedule_slot
    ON public.live_classes(tenant_id, batch_id, subject_id, scheduled_start)
    WHERE status IN ('SCHEDULED', 'PUBLISHED') AND deleted_at IS NULL;

-- 2. Indexes for fast query listing
CREATE INDEX IF NOT EXISTS idx_lc_tenant_course ON public.live_classes(tenant_id, course_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lc_tenant_batch ON public.live_classes(tenant_id, batch_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lc_tenant_subject ON public.live_classes(tenant_id, subject_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lc_scheduled_start ON public.live_classes(scheduled_start) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lc_status ON public.live_classes(status) WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraint (for foreign key verification in child mappings)
ALTER TABLE public.live_classes DROP CONSTRAINT IF EXISTS uq_live_classes_tenant_id CASCADE;
ALTER TABLE public.live_classes ADD CONSTRAINT uq_live_classes_tenant_id UNIQUE (tenant_id, id);

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_classes_touch_audit ON public.live_classes;
CREATE TRIGGER trg_biu_live_classes_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_classes
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Tenant mismatch validation trigger
CREATE OR REPLACE FUNCTION public.validate_live_class_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_target_tenant UUID;
BEGIN
    -- Check Course
    SELECT tenant_id INTO v_target_tenant FROM public.courses WHERE id = NEW.course_id;
    IF v_target_tenant IS DISTINCT FROM NEW.tenant_id THEN
        RAISE EXCEPTION 'Tenant mismatch validation failed: course tenant does not match live class tenant';
    END IF;

    -- Check Academic Year
    SELECT tenant_id INTO v_target_tenant FROM public.academic_years WHERE id = NEW.academic_year_id;
    IF v_target_tenant IS DISTINCT FROM NEW.tenant_id THEN
        RAISE EXCEPTION 'Tenant mismatch validation failed: academic year tenant does not match live class tenant';
    END IF;

    -- Check Batch
    IF NEW.batch_id IS NOT NULL THEN
        SELECT tenant_id INTO v_target_tenant FROM public.batches WHERE id = NEW.batch_id;
        IF v_target_tenant IS DISTINCT FROM NEW.tenant_id THEN
            RAISE EXCEPTION 'Tenant mismatch validation failed: batch tenant does not match live class tenant';
        END IF;
    END IF;

    -- Check Subject
    SELECT tenant_id INTO v_target_tenant FROM public.subjects WHERE id = NEW.subject_id;
    IF v_target_tenant IS DISTINCT FROM NEW.tenant_id THEN
        RAISE EXCEPTION 'Tenant mismatch validation failed: subject tenant does not match live class tenant';
    END IF;

    -- Check Chapter
    IF NEW.chapter_id IS NOT NULL THEN
        SELECT tenant_id INTO v_target_tenant FROM public.chapters WHERE id = NEW.chapter_id;
        IF v_target_tenant IS DISTINCT FROM NEW.tenant_id THEN
            RAISE EXCEPTION 'Tenant mismatch validation failed: chapter tenant does not match live class tenant';
        END IF;
    END IF;

    -- Check Topic
    IF NEW.topic_id IS NOT NULL THEN
        SELECT tenant_id INTO v_target_tenant FROM public.topics WHERE id = NEW.topic_id;
        IF v_target_tenant IS DISTINCT FROM NEW.tenant_id THEN
            RAISE EXCEPTION 'Tenant mismatch validation failed: topic tenant does not match live class tenant';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_live_class_tenant_validate ON public.live_classes;
CREATE TRIGGER trg_biu_live_class_tenant_validate
    BEFORE INSERT OR UPDATE ON public.live_classes
    FOR EACH ROW
    EXECUTE FUNCTION validate_live_class_tenant();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_classes ENABLE ROW LEVEL SECURITY;

-- Select policy: users can see classes if they belong to the same tenant and are active
CREATE POLICY select_live_classes_policy ON public.live_classes
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

-- Write policies
CREATE POLICY insert_live_classes_policy ON public.live_classes
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_classes_policy ON public.live_classes
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_classes_policy ON public.live_classes
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
