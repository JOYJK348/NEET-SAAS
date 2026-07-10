-- ============================================================================
-- SQL File: 03.03_system_roles_seed.sql
-- Domain: Authentication Role-Based Access Control (RBAC) System Roles Seeds
-- Design Strategy:
-- 1. Idempotent DML seed inserting global platform system roles (tenant_id IS NULL).
-- 2. Enforces structural system role properties (is_system = true, is_assignable = false).
-- 3. Uses ON CONFLICT ON CONSTRAINT uq_roles_global_code to match constraints correctly.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- Seed system roles configurations
INSERT INTO public.roles (
    tenant_id,
    code,
    name,
    description,
    display_order,
    is_assignable,
    is_system,
    is_active,
    version
) VALUES
    -- Platform System Roles (tenant_id IS NULL, prefixed with SYS_)
    (NULL, 'SYS_SUPER_ADMIN', 'Super Administrator', 'Full platform-wide super administrator bypass credentials', 1, false, true, true, 1),
    (NULL, 'SYS_PLATFORM_SUPPORT', 'Platform Support Engineer', 'Customer support and diagnostics diagnostics scope', 2, false, true, true, 1),
    (NULL, 'SYS_DEVOPS', 'Platform Operations Engineer', 'Platform configuration management and infrastructure monitoring controls', 3, false, true, true, 1),
    (NULL, 'SYS_READ_ONLY_AUDITOR', 'Global Compliance Auditor', 'System-wide compliance audit trail logging read controls', 4, false, true, true, 1)
ON CONFLICT ON CONSTRAINT uq_roles_global_code DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    display_order = EXCLUDED.display_order,
    is_assignable = EXCLUDED.is_assignable,
    is_system = EXCLUDED.is_system,
    is_active = EXCLUDED.is_active,
    updated_at = CASE 
        WHEN (roles.name IS DISTINCT FROM EXCLUDED.name 
              OR roles.description IS DISTINCT FROM EXCLUDED.description
              OR roles.display_order IS DISTINCT FROM EXCLUDED.display_order
              OR roles.is_assignable IS DISTINCT FROM EXCLUDED.is_assignable
              OR roles.is_system IS DISTINCT FROM EXCLUDED.is_system
              OR roles.is_active IS DISTINCT FROM EXCLUDED.is_active) THEN now()
        ELSE roles.updated_at
    END,
    version = CASE 
        WHEN (roles.name IS DISTINCT FROM EXCLUDED.name 
              OR roles.description IS DISTINCT FROM EXCLUDED.description
              OR roles.display_order IS DISTINCT FROM EXCLUDED.display_order
              OR roles.is_assignable IS DISTINCT FROM EXCLUDED.is_assignable
              OR roles.is_system IS DISTINCT FROM EXCLUDED.is_system
              OR roles.is_active IS DISTINCT FROM EXCLUDED.is_active) THEN roles.version + 1
        ELSE roles.version
    END;
