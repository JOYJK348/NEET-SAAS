-- ============================================================================
-- SQL File: 03.04_role_permissions_seed.sql
-- Domain: Authentication Role-Based Access Control (RBAC) Mappings Seeds
-- Design Strategy:
-- 1. Idempotent DML mapping system permissions directly to system roles (SYS_*).
-- 2. Uses ON CONFLICT DO NOTHING since bridge table modifications are insert/delete operations.
-- 3. Employs WITH CTE clauses for single-lookup role resolution to prevent NULL inserts.
-- 4. Filters permissions based on active system metadata states to limit hardcoded lists.
-- 5. Implements self-validating post-transaction blocks to guarantee data consistency.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- ============================================================================
-- 1. SYS_SUPER_ADMIN MAPPINGS (Receives every active platform-defined permission)
-- ============================================================================
WITH role_id_lookup AS (
    SELECT id FROM public.roles WHERE code = 'SYS_SUPER_ADMIN' AND tenant_id IS NULL
)
INSERT INTO public.role_permissions (role_id, permission_id, created_by)
SELECT 
    r.id AS role_id,
    p.id AS permission_id,
    NULL AS created_by
FROM role_id_lookup r
CROSS JOIN public.permissions p
WHERE p.deleted_at IS NULL
  AND p.is_active = true
  AND p.is_system = true
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- 2. SYS_READ_ONLY_AUDITOR MAPPINGS (Access to all active non-mutation read scopes)
-- ============================================================================
WITH role_id_lookup AS (
    SELECT id FROM public.roles WHERE code = 'SYS_READ_ONLY_AUDITOR' AND tenant_id IS NULL
)
INSERT INTO public.role_permissions (role_id, permission_id, created_by)
SELECT 
    r.id AS role_id,
    p.id AS permission_id,
    NULL AS created_by
FROM role_id_lookup r
CROSS JOIN public.permissions p
WHERE p.deleted_at IS NULL
  AND p.is_active = true
  AND p.is_system = true
  -- Automatically maps all read-only capability codes ending in .read or .download
  AND (p.code LIKE '%.read' OR p.code LIKE '%.download')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- 3. SYS_PLATFORM_SUPPORT MAPPINGS (Access to read scopes, diagnostics, and support mutations)
-- ============================================================================
WITH role_id_lookup AS (
    SELECT id FROM public.roles WHERE code = 'SYS_PLATFORM_SUPPORT' AND tenant_id IS NULL
)
INSERT INTO public.role_permissions (role_id, permission_id, created_by)
SELECT 
    r.id AS role_id,
    p.id AS permission_id,
    NULL AS created_by
FROM role_id_lookup r
CROSS JOIN public.permissions p
WHERE p.deleted_at IS NULL
  AND p.is_active = true
  AND p.is_system = true
  AND (
      -- Automatically inherits all diagnostic read capabilities
      p.code LIKE '%.read'
      OR p.code LIKE '%.download'
      -- Explicit diagnostics mutations permissions mappings
      OR p.code IN (
          'security.session.revoke',
          'users.update'
      )
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ============================================================================
-- 4. SELF-VALIDATION VERIFICATION TRANSACTION BLOCK
-- ============================================================================
DO $$
DECLARE
    super_admin_mapped_count INTEGER;
    auditor_mapped_count INTEGER;
    support_mapped_count INTEGER;
BEGIN
    -- Verify SYS_SUPER_ADMIN mapping mapping checks
    SELECT COUNT(1) INTO super_admin_mapped_count
    FROM public.role_permissions rp
    JOIN public.roles r ON r.id = rp.role_id
    WHERE r.code = 'SYS_SUPER_ADMIN' AND r.tenant_id IS NULL;

    IF super_admin_mapped_count = 0 THEN
        RAISE EXCEPTION 'Database reference seeding validation error: SYS_SUPER_ADMIN has 0 mapped permissions.';
    END IF;

    -- Verify SYS_READ_ONLY_AUDITOR mapping mapping checks
    SELECT COUNT(1) INTO auditor_mapped_count
    FROM public.role_permissions rp
    JOIN public.roles r ON r.id = rp.role_id
    WHERE r.code = 'SYS_READ_ONLY_AUDITOR' AND r.tenant_id IS NULL;

    IF auditor_mapped_count = 0 THEN
        RAISE EXCEPTION 'Database reference seeding validation error: SYS_READ_ONLY_AUDITOR has 0 mapped permissions.';
    END IF;

    -- Verify SYS_PLATFORM_SUPPORT mapping mapping checks
    SELECT COUNT(1) INTO support_mapped_count
    FROM public.role_permissions rp
    JOIN public.roles r ON r.id = rp.role_id
    WHERE r.code = 'SYS_PLATFORM_SUPPORT' AND r.tenant_id IS NULL;

    IF support_mapped_count = 0 THEN
        RAISE EXCEPTION 'Database reference seeding validation error: SYS_PLATFORM_SUPPORT has 0 mapped permissions.';
    END IF;
END $$;
