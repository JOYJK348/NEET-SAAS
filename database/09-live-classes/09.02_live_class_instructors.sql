-- ============================================================================
-- SQL File: 09.02_live_class_instructors.sql
-- Domain: Live Class Instructors and Lecturers Mapping (Bridge Entity)
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Maps multiple staff profiles (tutors) to a scheduled live class session.
-- 2. Scopes roles via participant_role_enum (HOST, CO_HOST, Moderator, Guest).
-- 3. Utilizes composite keys to guarantee tenant isolation validation constraints.
-- 4. Automatically touch audit fields upon changes.
-- 5. Implements tenant alignment verification checks.
-- ============================================================================

SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.live_class_instructors (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    live_class_id UUID NOT NULL,
    staff_profile_id UUID NOT NULL,
    
    role participant_role_enum NOT NULL DEFAULT 'HOST',
    is_primary BOOLEAN NOT NULL DEFAULT false,
    display_order SMALLINT NOT NULL DEFAULT 1,
    
    joined_at TIMESTAMP WITH TIME ZONE NULL,
    left_at TIMESTAMP WITH TIME ZONE NULL,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL,
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL,
    
    version INTEGER NOT NULL DEFAULT 1,
    
    -- Constraints
    CONSTRAINT fk_lci_tenant FOREIGN KEY (tenant_id)
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Force tenant consistency between class mapping and instructor mapping
    CONSTRAINT fk_lci_class FOREIGN KEY (tenant_id, live_class_id)
        REFERENCES public.live_classes(tenant_id, id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_lci_staff FOREIGN KEY (staff_profile_id)
        REFERENCES public.staff_profiles(user_id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    CONSTRAINT chk_lci_display_order CHECK (display_order > 0),
    CONSTRAINT chk_lci_version CHECK (version > 0)
);

-- 2. Unique: only map a staff member once to a class
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_lci_class_staff
    ON public.live_class_instructors(tenant_id, live_class_id, staff_profile_id)
    WHERE deleted_at IS NULL;

-- 2.1 Unique primary instructor index: enforce only ONE primary host per live class
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_lci_class_primary_instructor
    ON public.live_class_instructors(live_class_id)
    WHERE is_primary = true AND deleted_at IS NULL;

-- 2.2 Indexes
CREATE INDEX IF NOT EXISTS idx_lci_class ON public.live_class_instructors(live_class_id) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_lci_staff ON public.live_class_instructors(staff_profile_id) WHERE deleted_at IS NULL;

-- 3. Triggers Configuration
DROP TRIGGER IF EXISTS trg_biu_live_class_instructors_touch_audit ON public.live_class_instructors;
CREATE TRIGGER trg_biu_live_class_instructors_touch_audit
    BEFORE INSERT OR UPDATE ON public.live_class_instructors
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 3.1 Tenant validation checks for staff_profile
CREATE OR REPLACE FUNCTION public.validate_live_class_instructor_tenant()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_staff_tenant UUID;
BEGIN
    SELECT tenant_id INTO v_staff_tenant 
    FROM public.staff_profiles 
    WHERE user_id = NEW.staff_profile_id;
    
    IF v_staff_tenant IS DISTINCT FROM NEW.tenant_id THEN
        RAISE EXCEPTION 'Tenant mismatch validation failed: staff profile tenant does not match live class instructor tenant';
    END IF;
    
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_biu_live_class_instructor_tenant_validate ON public.live_class_instructors;
CREATE TRIGGER trg_biu_live_class_instructor_tenant_validate
    BEFORE INSERT OR UPDATE ON public.live_class_instructors
    FOR EACH ROW
    EXECUTE FUNCTION validate_live_class_instructor_tenant();

-- 4. Row-Level Security Configuration
ALTER TABLE public.live_class_instructors ENABLE ROW LEVEL SECURITY;

CREATE POLICY select_live_class_instructors_policy ON public.live_class_instructors
    FOR SELECT
    USING (
        tenant_id = current_tenant_id()
        AND deleted_at IS NULL
    );

CREATE POLICY insert_live_class_instructors_policy ON public.live_class_instructors
    FOR INSERT
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY update_live_class_instructors_policy ON public.live_class_instructors
    FOR UPDATE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    WITH CHECK (tenant_id = current_tenant_id());

CREATE POLICY delete_live_class_instructors_policy ON public.live_class_instructors
    FOR DELETE
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);
