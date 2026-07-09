-- ============================================================================
-- SQL File: 02.01_users.sql
-- Domain: Authentication Core synced profiles mapping
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Maps public user profiles 1:1 to Supabase auth.users(id) with ON DELETE CASCADE.
-- 2. "tenant_id" is nullable only for platform-level Super Admins (is_super_admin = true).
-- 3. Users default to a 'PENDING' status for validation before active branch deployment.
-- 4. Enables composite uniques checks (tenant_id, id) to support downstream safe RBAC mapping.
-- 5. Restricts duplicate emails per tenant case-insensitively.
-- 6. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY, -- Maps 1:1 to auth.users(id)
    tenant_id UUID NULL,
    branch_id UUID NULL, -- Primary branch mapping (multiple branch assignments handled via bridge table)
    
    email email_address NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    user_type user_type_enum NOT NULL DEFAULT 'STAFF',
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id (FK added in post-auth migration step)
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id (FK added in post-auth migration step)
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id (FK added in post-auth migration step)
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_users_auth FOREIGN KEY (id) 
        REFERENCES auth.users(id) ON UPDATE CASCADE ON DELETE CASCADE,
        
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Composite foreign key enforcing tenant safety
    CONSTRAINT fk_users_branch_tenant FOREIGN KEY (tenant_id, branch_id) 
        REFERENCES public.branches(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_users_name_first CHECK (length(trim(first_name)) > 0),
    CONSTRAINT chk_users_name_last CHECK (length(trim(last_name)) > 0),
    CONSTRAINT chk_users_tenant_or_super CHECK (is_super_admin = true OR tenant_id IS NOT NULL),
    CONSTRAINT chk_users_status CHECK (status IN ('PENDING', 'ACTIVE', 'SUSPENDED', 'INACTIVE')),
    CONSTRAINT chk_users_version CHECK (version > 0)
);

-- 2. Indexes for fast tenant active searches and profiles lookup
CREATE INDEX IF NOT EXISTS idx_users_tenant_active 
    ON public.users(tenant_id, status) 
    WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_users_tenant_branch_active 
    ON public.users(tenant_id, branch_id, status) 
    WHERE deleted_at IS NULL AND tenant_id IS NOT NULL AND branch_id IS NOT NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in downstream user_roles tables)
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS uq_users_tenant_id;
ALTER TABLE public.users ADD CONSTRAINT uq_users_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Indexes for Soft Deletes (prevents duplicate emails within the same tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_users_tenant_email 
    ON public.users(tenant_id, lower(trim(email))) 
    WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_users_touch_audit ON public.users;
CREATE TRIGGER trg_biu_users_touch_audit
    BEFORE INSERT OR UPDATE ON public.users
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_users_select ON public.users;
CREATE POLICY policy_users_select
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        (is_super_admin = true)
        OR (tenant_id = current_tenant_id() AND deleted_at IS NULL)
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.users IS 'Tenant profile entities synced from Supabase Auth configuration';
COMMENT ON COLUMN public.users.id IS 'Profile reference key mirroring Supabase auth.users.id';
COMMENT ON COLUMN public.users.branch_id IS 'Primary branch campus assignment pointer';
COMMENT ON COLUMN public.users.user_type IS 'Profile type category mapping (e.g. STAFF, STUDENT, PARENT)';
COMMENT ON COLUMN public.users.status IS 'Onboarding lifecycle mapping state (e.g. PENDING, ACTIVE)';
COMMENT ON COLUMN public.users.is_super_admin IS 'Flag denoting platform management roles';
COMMENT ON COLUMN public.users.version IS 'Optimistic concurrency control version stamp';
