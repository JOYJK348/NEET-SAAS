-- ============================================================================
-- File       : 999_validation.sql
-- Module     : Authorization
-- Purpose    : Diagnostic validation rules check script to run after seeds deployment.
-- Depends On : menu_master, permissions, menu_permissions, roles, role_permissions, role_inheritance, permission_dependencies
-- Author     : Agaran Platform
-- Version    : 1.0.1
-- ============================================================================

DO $$
DECLARE
    v_orphan_menus INT := 0;
    v_orphan_permissions INT := 0;
    v_duplicate_role_perms INT := 0;
    v_duplicate_menu_codes INT := 0;
    v_cyclic_inheritance INT := 0;
    v_cyclic_menus INT := 0;
    v_dependency_loops INT := 0;
BEGIN
    RAISE NOTICE '============================================================';
    RAISE NOTICE 'STARTING INTEGRITY & CONFLICT VALIDATIONCHECKS';
    RAISE NOTICE '============================================================';

    -- 1. Check for page-type menus lacking target permission bindings
    SELECT count(1) INTO v_orphan_menus
    FROM menu_master mm
    LEFT JOIN menu_permissions mp ON mp.menu_id = mm.id
    WHERE mp.id IS NULL AND mm.deleted_at IS NULL AND mm.page_type = 'PAGE';
    IF v_orphan_menus > 0 THEN
        RAISE WARNING 'Integrity Check: Found % PAGE-type menus lacking permission bindings.', v_orphan_menus;
    END IF;

    -- 2. Check for permissions without valid group classification links
    SELECT count(1) INTO v_orphan_permissions
    FROM permissions
    WHERE permission_group_id IS NULL AND deleted_at IS NULL;
    IF v_orphan_permissions > 0 THEN
        RAISE WARNING 'Integrity Check: Found % permissions lacking UI permission group links.', v_orphan_permissions;
    END IF;

    -- 3. Check for duplicate menu codes within the same tenant scope
    SELECT count(1) INTO v_duplicate_menu_codes
    FROM (
        SELECT tenant_id, menu_code, count(1)
        FROM menu_master
        WHERE deleted_at IS NULL
        GROUP BY tenant_id, menu_code
        HAVING count(1) > 1
    ) sub;
    IF v_duplicate_menu_codes > 0 THEN
        RAISE EXCEPTION 'Constraint Conflict: Found % duplicate menu_code values active in tenants.', v_duplicate_menu_codes;
    END IF;

    -- 4. Check for duplicate permission mappings assigned to the same role
    SELECT count(1) INTO v_duplicate_role_perms
    FROM (
        SELECT role_id, permission_id, count(1) 
        FROM role_permissions 
        WHERE deleted_at IS NULL 
        GROUP BY role_id, permission_id 
        HAVING count(1) > 1
    ) sub;
    IF v_duplicate_role_perms > 0 THEN
        RAISE WARNING 'Optimistic Check: Found % redundant/duplicate role-permission assignments.', v_duplicate_role_perms;
    END IF;

    -- 5. Cyclic Role Inheritance Check
    WITH RECURSIVE inheritance_walk AS (
        SELECT role_id, inherits_role_id, ARRAY[role_id] AS path, false AS is_cycle
        FROM role_inheritance
        WHERE deleted_at IS NULL
        UNION ALL
        SELECT ri.role_id, ri.inherits_role_id, iw.path || ri.role_id, ri.role_id = ANY(iw.path)
        FROM role_inheritance ri
        JOIN inheritance_walk iw ON iw.inherits_role_id = ri.role_id
        WHERE ri.deleted_at IS NULL AND NOT iw.is_cycle
    )
    SELECT count(1) INTO v_cyclic_inheritance
    FROM inheritance_walk
    WHERE is_cycle = true;
    IF v_cyclic_inheritance > 0 THEN
        RAISE EXCEPTION 'Architecture Conflict: Cyclic role inheritance detected in database paths.';
    END IF;

    -- 6. Cyclic Menu Hierarchy Check
    WITH RECURSIVE menu_walk AS (
        SELECT id, parent_menu_id, ARRAY[id] AS path, false AS is_cycle
        FROM menu_master
        WHERE deleted_at IS NULL
        UNION ALL
        SELECT mm.id, mm.parent_menu_id, mw.path || mm.id, mm.id = ANY(mw.path)
        FROM menu_master mm
        JOIN menu_walk mw ON mw.parent_menu_id = mm.id
        WHERE mm.deleted_at IS NULL AND NOT mw.is_cycle
    )
    SELECT count(1) INTO v_cyclic_menus
    FROM menu_walk
    WHERE is_cycle = true;
    IF v_cyclic_menus > 0 THEN
        RAISE EXCEPTION 'Architecture Conflict: Cyclic parent-child menu relation detected.';
    END IF;

    -- 7. Permission Dependency Loops Check
    WITH RECURSIVE dependency_walk AS (
        SELECT permission_id, requires_permission_id, ARRAY[permission_id] AS path, false AS is_cycle
        FROM permission_dependencies
        WHERE deleted_at IS NULL
        UNION ALL
        SELECT pd.permission_id, pd.requires_permission_id, dw.path || pd.permission_id, pd.permission_id = ANY(dw.path)
        FROM permission_dependencies pd
        JOIN dependency_walk dw ON dw.requires_permission_id = pd.permission_id
        WHERE pd.deleted_at IS NULL AND NOT dw.is_cycle
    )
    SELECT count(1) INTO v_dependency_loops
    FROM dependency_walk
    WHERE is_cycle = true;
    IF v_dependency_loops > 0 THEN
        RAISE EXCEPTION 'Architecture Conflict: Loop cycle found in permission dependency tree.';
    END IF;

    RAISE NOTICE '============================================================';
    RAISE NOTICE 'ALL INTEGRITY DIAGNOSTIC CHECKS PASSED SUCCESSFULLY';
    RAISE NOTICE '============================================================';
END $$;
