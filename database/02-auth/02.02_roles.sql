-- ============================================================================
-- SQL File: 02.02_roles.sql
-- Domain: Authentication Role-Based Access Control (RBAC) Roles Catalog
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "roles" catalog contains platform roles (is_system = true AND tenant_id IS NULL)
--    and custom institute roles (is_system = false AND tenant_id IS NOT NULL).
-- 2. Enforces code format standards: system roles must be prefixed with "SYS_".
-- 3. Non-assignable lock: System roles (is_system = true) are forced to be non-assignable by default.
-- 4. Exposes roles selectively through RLS: platform roles are visible ONLY to super admins.
-- 5. Added display_order and case-insensitive lower(trim()) indexes to accelerate admin lookups.
-- 6. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NULL, -- Nullable for platform system roles (is_system = true)
    
    code VARCHAR(30) NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT NULL,
    
    display_order SMALLINT NOT NULL DEFAULT 1,
    is_assignable BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_roles_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Enforce strict dual classification states:
    -- System roles MUST have tenant_id NULL and non-assignable state.
    -- Tenant custom roles MUST have tenant_id specified.
    CONSTRAINT chk_roles_platform_tenant CHECK (
        (is_system = true AND tenant_id IS NULL AND is_assignable = false)
        OR
        (is_system = false AND tenant_id IS NOT NULL)
    ),
    
    CONSTRAINT chk_roles_name_length CHECK (length(trim(name)) > 0),
    -- Code prefix format logic: system roles must start with SYS_, tenant roles must start with letters only
    CONSTRAINT chk_roles_code_format CHECK (
        (is_system = true AND code ~ '^SYS_[A-Z0-9_]{1,25}$')
        OR
        (is_system = false AND code ~ '^[A-Z][A-Z0-9_]{1,29}$')
    ),
    CONSTRAINT chk_roles_description CHECK (description IS NULL OR (length(trim(description)) > 0 AND length(description) <= 1000)),
    CONSTRAINT chk_roles_display_order CHECK (display_order BETWEEN 1 AND 999),
    CONSTRAINT chk_roles_version CHECK (version > 0),
    CONSTRAINT uq_roles_tenant_code UNIQUE (tenant_id, code), -- Constraint matching tenant scopes mapping conflict targets
    CONSTRAINT uq_roles_global_code UNIQUE (code) DEFERRABLE INITIALLY DEFERRED -- Global unique constraint mapped to platform-level roles
);


-- 2. Indexes for fast tenant search and active listings (Tenant Scoped)
CREATE INDEX IF NOT EXISTS idx_roles_tenant_active 
    ON public.roles(tenant_id, is_active) 
    WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_roles_tenant_display 
    ON public.roles(tenant_id, display_order) 
    WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

-- Dynamic search index for keyword scans on name
CREATE INDEX IF NOT EXISTS idx_roles_tenant_name_search
    ON public.roles(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in downstream user_roles tables)
ALTER TABLE public.roles DROP CONSTRAINT IF EXISTS uq_roles_tenant_id;
ALTER TABLE public.roles ADD CONSTRAINT uq_roles_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Indexes for Soft Deletes (prevents duplicate codes/names within the same tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_roles_tenant_code 
    ON public.roles(tenant_id, code) 
    WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

-- Global platform roles (tenant_id IS NULL) must have unique codes globally
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_roles_global_code 
    ON public.roles(code) 
    WHERE deleted_at IS NULL AND tenant_id IS NULL;

-- Case-insensitive name unique index using lower(trim()) mapping checks
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_roles_tenant_name_lower
    ON public.roles(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_part_roles_global_name_lower
    ON public.roles(lower(trim(name)))
    WHERE deleted_at IS NULL AND tenant_id IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_roles_touch_audit ON public.roles;
CREATE TRIGGER trg_biu_roles_touch_audit
    BEFORE INSERT OR UPDATE ON public.roles
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Split policies to enable easy auditing audits checks)
DROP POLICY IF EXISTS policy_roles_tenant_select ON public.roles;
CREATE POLICY policy_roles_tenant_select
    ON public.roles
    FOR SELECT
    TO authenticated
    USING (
        tenant_id = current_tenant_id() 
        AND deleted_at IS NULL
    );

DROP POLICY IF EXISTS policy_roles_platform_select ON public.roles;
CREATE POLICY policy_roles_platform_select
    ON public.roles
    FOR SELECT
    TO authenticated
    USING (
        is_system = true 
        AND tenant_id IS NULL 
        AND current_user_is_super_admin()
        AND deleted_at IS NULL
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.roles IS 'Authentication role configurations catalog per tenant or platform level';
COMMENT ON COLUMN public.roles.code IS 'Uppercase role identifier code (e.g. SYS_SUPER_ADMIN, TEACHER)';
COMMENT ON COLUMN public.roles.is_assignable IS 'Flag indicating if the role can be manually assigned to users';
COMMENT ON COLUMN public.roles.is_system IS 'Flag indicating structural system role definition';
COMMENT ON COLUMN public.roles.version IS 'Optimistic concurrency control version stamp';
