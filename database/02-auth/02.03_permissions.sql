-- ============================================================================
-- SQL File: 02.03_permissions.sql
-- Domain: Authentication Role-Based Access Control (RBAC) Permissions Catalog
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "permissions" is a global catalog. No "tenant_id" is allowed.
-- 2. Dot notation format enforced on "code" checks (e.g. students.read, courses.write).
-- 3. Increased code length to VARCHAR(100) to allow long hierarchical keys.
-- 4. Removed the unique name index constraint; code is the single immutable unique identifier.
-- 5. Tightened RLS selection criteria: only Super Admins and active staff are authorized to view catalog.
-- 6. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.permissions (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    
    code VARCHAR(100) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    module_code VARCHAR(30) NOT NULL,
    display_order SMALLINT NOT NULL DEFAULT 1,
    
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT true, -- Permissions are application metadata, always true
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT chk_permissions_name_length CHECK (length(trim(name)) > 0),
    -- Code prefix format logic: enforces resource.action structure
    CONSTRAINT chk_permissions_code_format CHECK (code ~ '^[a-z0-9_-]+(\.[a-z0-9_-]+)+$'),
    CONSTRAINT chk_permissions_module_format CHECK (module_code ~ '^[A-Z0-9_]{2,30}$'),
    CONSTRAINT chk_permissions_description CHECK (description IS NULL OR (length(trim(description)) > 0 AND length(description) <= 1000)),
    CONSTRAINT chk_permissions_display_order CHECK (display_order BETWEEN 1 AND 999),
    CONSTRAINT chk_permissions_system_lock CHECK (is_system = true), -- Enforces application metadata immutability
    CONSTRAINT chk_permissions_version CHECK (version > 0)
);

-- 2. Indexes for fast search and display ordering
CREATE INDEX IF NOT EXISTS idx_permissions_active_display 
    ON public.permissions(module_code, display_order) 
    WHERE deleted_at IS NULL AND is_active = true;

-- 2.1 Partial Unique Indexes for Soft Deletes (prevents duplicate codes globally)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_permissions_code 
    ON public.permissions(code) 
    WHERE deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_permissions_touch_audit ON public.permissions;
CREATE TRIGGER trg_biu_permissions_touch_audit
    BEFORE INSERT OR UPDATE ON public.permissions
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.permissions ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Restrict visibility to Super Admins and internal Staff to hide catalog from students/parents)
DROP POLICY IF EXISTS policy_permissions_select ON public.permissions;
CREATE POLICY policy_permissions_select
    ON public.permissions
    FOR SELECT
    TO authenticated
    USING (
        deleted_at IS NULL 
        AND is_active = true
        AND (
            current_user_is_super_admin()
            OR EXISTS (
                -- Restrict metadata reads only to system staff
                SELECT 1 FROM public.users 
                WHERE id = auth.uid() 
                AND user_type = 'STAFF'::user_type_enum 
                AND deleted_at IS NULL
            )
        )
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.permissions IS 'Global RBAC permissions catalog metadata';
COMMENT ON COLUMN public.permissions.code IS 'Immutable dot-notation permission key (e.g. students.read)';
COMMENT ON COLUMN public.permissions.module_code IS 'Functional category grouping (e.g. STUDENTS, COURSES)';
COMMENT ON COLUMN public.permissions.is_system IS 'Flag indicating structural system definition (always true)';
COMMENT ON COLUMN public.permissions.version IS 'Optimistic concurrency control version stamp';
