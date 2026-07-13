-- ============================================================================
-- SQL File: 001_people_triggers.sql
-- Domain: Student Profiles Automations and Trigger Handlers
-- ============================================================================

SET search_path = public;

-- Sequences for auto-numbering
CREATE SEQUENCE IF NOT EXISTS student_admission_seq START WITH 1000;
CREATE SEQUENCE IF NOT EXISTS student_roll_seq START WITH 1000;

-- 1. Auto-identifiers generator trigger function
CREATE OR REPLACE FUNCTION public.fn_trg_student_auto_identifiers()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_adm_no VARCHAR(100);
    v_roll_no VARCHAR(100);
BEGIN
    -- 1. Generate & Insert Admission Number identifier
    v_adm_no := 'ADM-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || nextval('student_admission_seq');
    INSERT INTO public.person_identifiers (
        student_profile_id, tenant_id, identifier_type, identifier_value, is_active
    ) VALUES (
        new.user_id, new.tenant_id, 'ADMISSION_NO', v_adm_no, true
    ) ON CONFLICT DO NOTHING;

    -- 2. Generate & Insert Roll Number identifier
    v_roll_no := 'ROLL-' || TO_CHAR(CURRENT_DATE, 'YYYY') || '-' || nextval('student_roll_seq');
    INSERT INTO public.person_identifiers (
        student_profile_id, tenant_id, identifier_type, identifier_value, is_active
    ) VALUES (
        new.user_id, new.tenant_id, 'ROLL_NO', v_roll_no, true
    ) ON CONFLICT DO NOTHING;

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_after_insert_student_auto_id ON public.student_profiles;
CREATE TRIGGER trg_after_insert_student_auto_id
    AFTER INSERT ON public.student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_student_auto_identifiers();


-- 2. Profile completion percentage trigger function
CREATE OR REPLACE FUNCTION public.fn_trg_student_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_student_id UUID;
    v_new_completion NUMERIC;
BEGIN
    -- Resolve student target ID depending on table context
    IF TG_OP = 'DELETE' THEN
        v_target_student_id := old.student_profile_id;
    ELSE
        v_target_student_id := new.student_profile_id;
    END IF;

    IF v_target_student_id IS NOT NULL THEN
        v_new_completion := fn_profile_completion(v_target_student_id);
        
        UPDATE public.student_profiles
        SET profile_completion_percentage = v_new_completion,
            last_profile_updated_at = NOW()
        WHERE user_id = v_target_student_id;
    END IF;

    RETURN NULL;
END;
$$;

-- Connect profile completion triggers to child tables
DROP TRIGGER IF EXISTS trg_update_completion_on_docs ON public.student_documents;
CREATE TRIGGER trg_update_completion_on_docs
    AFTER INSERT OR UPDATE OR DELETE ON public.student_documents
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_student_profile_completion();

DROP TRIGGER IF EXISTS trg_update_completion_on_medical ON public.student_medical_profiles;
CREATE TRIGGER trg_update_completion_on_medical
    AFTER INSERT OR UPDATE OR DELETE ON public.student_medical_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_student_profile_completion();

DROP TRIGGER IF EXISTS trg_update_completion_on_parents ON public.student_parents;
CREATE TRIGGER trg_update_completion_on_parents
    AFTER INSERT OR UPDATE OR DELETE ON public.student_parents
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_student_profile_completion();

DROP TRIGGER IF EXISTS trg_update_completion_on_contacts ON public.emergency_contacts;
CREATE TRIGGER trg_update_completion_on_contacts
    AFTER INSERT OR UPDATE OR DELETE ON public.emergency_contacts
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_student_profile_completion();


-- 3. Dynamic Lifecycle Event Publisher & Auditor Trigger function
CREATE OR REPLACE FUNCTION public.fn_trg_student_lifecycle_events()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_payload JSONB;
    v_event_name VARCHAR(100);
    v_action VARCHAR(50);
BEGIN
    IF TG_OP = 'INSERT' THEN
        v_event_name := 'student.created';
        v_action := 'student.create';
    ELSIF TG_OP = 'UPDATE' THEN
        IF old.academic_status <> new.academic_status THEN
            v_event_name := 'student.status_changed';
            v_action := 'student.status_update';
        ELSE
            v_event_name := 'student.updated';
            v_action := 'student.update';
        END IF;
    END IF;

    -- Build payload contract
    v_payload := jsonb_build_object(
        'student_id', new.user_id,
        'tenant_id', new.tenant_id,
        'status', new.academic_status,
        'profile_version', new.profile_version,
        'timestamp', NOW()
    );

    -- Emit PG Notify Event (for backend microservices integrations)
    PERFORM pg_notify('people_events', jsonb_build_object('event', v_event_name, 'data', v_payload)::text);

    -- Write to audit log trail (if audit_logs table is available)
    BEGIN
        INSERT INTO public.audit_logs (
            tenant_id, entity_type, entity_id, action, old_value, new_value, performed_by
        ) VALUES (
            new.tenant_id, 'student_profile', new.user_id, v_action, 
            CASE WHEN TG_OP = 'UPDATE' THEN to_jsonb(old) ELSE NULL END, 
            to_jsonb(new), 
            COALESCE(new.updated_by, new.created_by, '99999999-9999-9999-9999-999999999999'::UUID)
        );
    EXCEPTION WHEN OTHERS THEN
        -- Fallback if audit log schema is missing or disabled in early tests
        NULL;
    END;

    RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS trg_student_lifecycle_events ON public.student_profiles;
CREATE TRIGGER trg_student_lifecycle_events
    AFTER INSERT OR UPDATE ON public.student_profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.fn_trg_student_lifecycle_events();
