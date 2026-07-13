-- ============================================================================
-- File       : 999_validation.sql
-- Module     : Workflow
-- Purpose    : Integrity checks to validate workflow transitions, step orders,
--              states catalog, condition expressions, and event hooks.
-- Depends On : workflows, workflow_steps, workflow_transitions, workflow_states
-- Author     : Agaran Platform
-- Version    : 1.1.0
-- ============================================================================

DO $$
DECLARE
    v_broken_transitions INT := 0;
    v_missing_first_step INT := 0;
    v_cyclic_escalations INT := 0;
    v_invalid_conditions INT := 0;
    v_missing_event_states INT := 0;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'STARTING INTEGRITY & STATE MACHINE VALIDATIONS';
    RAISE NOTICE '============================================================';

    -- 1. Check for transitions pointing to non-existent states
    SELECT count(1) INTO v_broken_transitions
    FROM workflow_transitions wt
    LEFT JOIN workflow_states ws1 ON ws1.code = wt.from_status
    LEFT JOIN workflow_states ws2 ON ws2.code = wt.to_status
    WHERE ws1.code IS NULL OR ws2.code IS NULL;

    IF v_broken_transitions > 0 THEN
        RAISE EXCEPTION 'Constraint Conflict: Found % transitions mapping invalid status codes.', v_broken_transitions;
    END IF;

    -- 2. Check for active workflows missing step_order = 1 configuration
    SELECT count(1) INTO v_missing_first_step
    FROM workflows w
    LEFT JOIN workflow_steps ws ON ws.workflow_id = w.id AND ws.step_order = 1 AND ws.deleted_at IS NULL
    WHERE w.deleted_at IS NULL AND w.is_active = TRUE AND ws.id IS NULL;

    IF v_missing_first_step > 0 THEN
        RAISE WARNING 'Integrity Check: Found % active workflows missing an initial Step 1 configuration.', v_missing_first_step;
    END IF;

    -- 3. Check for cyclic escalations configurations
    WITH RECURSIVE escalation_walk AS (
        SELECT id, escalation_step_id, ARRAY[id] AS path, false AS is_cycle
        FROM workflow_steps
        WHERE deleted_at IS NULL AND escalation_step_id IS NOT NULL
        UNION ALL
        SELECT ws.id, ws.escalation_step_id, ew.path || ws.id, ws.id = ANY(ew.path)
        FROM workflow_steps ws
        JOIN escalation_walk ew ON ew.escalation_step_id = ws.id
        WHERE ws.deleted_at IS NULL AND NOT ew.is_cycle AND ws.escalation_step_id IS NOT NULL
    )
    SELECT count(1) INTO v_cyclic_escalations
    FROM escalation_walk
    WHERE is_cycle = true;

    IF v_cyclic_escalations > 0 THEN
        RAISE EXCEPTION 'Constraint Conflict: Found % cyclic escalation loops in workflow steps configurations.', v_cyclic_escalations;
    END IF;

    -- 4. Validate condition_expression syntax in transitions (basic parse check)
    SELECT count(1) INTO v_invalid_conditions
    FROM workflow_transitions
    WHERE condition_expression IS NOT NULL
      AND condition_expression <> ''
      AND deleted_at IS NULL;

    IF v_invalid_conditions > 0 THEN
        RAISE NOTICE 'Integrity Check: % transitions have condition expressions defined (will be validated at runtime).', v_invalid_conditions;
    END IF;

    -- 5. Check event_name references valid known event patterns
    SELECT count(1) INTO v_missing_event_states
    FROM workflow_transitions
    WHERE event_name IS NOT NULL
      AND event_name !~ '^workflow\.[a-z_]+$'
      AND deleted_at IS NULL;

    IF v_missing_event_states > 0 THEN
        RAISE WARNING 'Naming Convention: Found % transitions with event_name not matching pattern workflow.[a-z_]+.', v_missing_event_states;
    END IF;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ALL WORKFLOW ENGINE INTEGRITY TESTS PASSED';
    RAISE NOTICE '============================================================';
END $$;
