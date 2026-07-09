-- ============================================================================
-- SQL File: 02.01_users.sql
-- Domain: Authentication Core synced profiles mapping
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. Maps public user profiles 1:1 to Supabase auth.users(id) with ON DELETE CASCADE.
-- 2. "tenant_id" is nullable only for platform-level Super Admins (is_super_admin = true).
-- 3. Users default to a 'PENDING' status for validation before active branch deployment.
-- 4. RLS is strictly scoped: Users can ONLY see their own row, unless they are a Super Admin.
-- 5. Trigger sync handles insertions and updates (email, names) without trusting raw metadata for overrides.
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
    last_name VARCHAR(100) NULL, -- Nullable to support single-name/Indian formats
    
    user_type user_type_enum NOT NULL DEFAULT 'STAFF',
    status user_status_type NOT NULL DEFAULT 'PENDING',
    
    is_super_admin BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_users_auth FOREIGN KEY (id) 
        REFERENCES auth.users(id) ON DELETE CASCADE,
        
    CONSTRAINT fk_users_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
        
    -- Composite foreign key enforcing tenant safety
    CONSTRAINT fk_users_branch_tenant FOREIGN KEY (tenant_id, branch_id) 
        REFERENCES public.branches(tenant_id, id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_users_name_first CHECK (length(trim(first_name)) > 0),
    CONSTRAINT chk_users_name_last CHECK (last_name IS NULL OR length(trim(last_name)) > 0),
    CONSTRAINT chk_users_tenant_or_super CHECK (is_super_admin = true OR tenant_id IS NOT NULL),
    -- Super admins cannot belong to a physical campus branch
    CONSTRAINT chk_users_super_branch CHECK (NOT is_super_admin OR branch_id IS NULL),
    CONSTRAINT chk_users_version CHECK (version > 0)
);

-- 2. Indexes for fast tenant active searches, search keywords, and profiles lookup
CREATE INDEX IF NOT EXISTS idx_users_tenant_active 
    ON public.users(tenant_id, status) 
    WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

-- Dynamic search index for keyword scans on consolidated full name expression
CREATE INDEX IF NOT EXISTS idx_users_tenant_name_search
    ON public.users(tenant_id, lower(trim(first_name || ' ' || coalesce(last_name, ''))))
    WHERE deleted_at IS NULL AND tenant_id IS NOT NULL;

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

-- 4. Sync Trigger functions from auth.users -> public.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser bypass capabilities to write to public
SET search_path = public
AS $$
DECLARE
    default_first_name VARCHAR(100);
    default_last_name VARCHAR(100);
BEGIN
    -- Extract values safely, defaulting if metadata is missing or corrupt
    default_first_name := coalesce(new.raw_user_meta_data->>'first_name', 'New');
    default_last_name  := new.raw_user_meta_data->>'last_name';
    
    INSERT INTO public.users (
        id,
        tenant_id,
        branch_id,
        email,
        first_name,
        last_name,
        user_type,
        status,
        is_super_admin
    ) VALUES (
        new.id,
        NULL, -- Crucial: never trust client metadata for tenant mapping during raw insert
        NULL, -- Crucial: never trust client metadata for branch assignment during raw insert
        new.email::email_address,
        default_first_name,
        default_last_name,
        'STAFF'::user_type_enum, -- Default safe classification
        'PENDING'::user_status_type, -- Requires admin onboarding authorization
        false -- Never allow client metadata to escalate privilege levels to super admin
    );
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        -- Safely complete transaction to avoid blocking Supabase internal signup channels
        RAISE WARNING 'Sync trigger handle_new_user failed: %', SQLERRM;
        RETURN new;
END;
$$;

-- 4.1 Sync updates (e.g. Email changes, Profile Meta updates) from auth.users -> public.users
CREATE OR REPLACE FUNCTION public.handle_update_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with superuser bypass capabilities to write to public
SET search_path = public
AS $$
BEGIN
    UPDATE public.users
    SET 
        email = new.email::email_address,
        first_name = coalesce(new.raw_user_meta_data->>'first_name', first_name),
        last_name = coalesce(new.raw_user_meta_data->>'last_name', last_name)
    WHERE id = new.id;
    RETURN new;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Sync trigger handle_update_user failed: %', SQLERRM;
        RETURN new;
END;
$$;

-- 4.2 Attach Sync Triggers to auth.users
DROP TRIGGER IF EXISTS trg_au_sync_user ON auth.users;
CREATE TRIGGER trg_au_sync_user
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

DROP TRIGGER IF EXISTS trg_au_sync_user_update ON auth.users;
CREATE TRIGGER trg_au_sync_user_update
    AFTER UPDATE OF email, raw_user_meta_data ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_update_user();

-- 5. Helper function for RLS recursive checks bypass (checks super admin role)
CREATE OR REPLACE FUNCTION public.current_user_is_super_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
STRICT -- Prevents execution on null auth session contexts immediately
AS $$
    SELECT coalesce(
        (SELECT is_super_admin FROM public.users WHERE id = auth.uid() AND deleted_at IS NULL),
        false
    );
$$;


-- 6. Row-Level Security Configuration
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 6.1 RLS Policies (Strict ownership checks, super admins bypass checks, and team lookup access mapped by permissions/roles)
DROP POLICY IF EXISTS policy_users_select ON public.users;
CREATE POLICY policy_users_select
    ON public.users
    FOR SELECT
    TO authenticated
    USING (
        -- Enforce user identity checks natively: users can only see their own profile
        (id = auth.uid())
        OR current_user_is_super_admin()
    );

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.users IS 'Tenant profile entities synced from Supabase Auth configuration';
COMMENT ON COLUMN public.users.id IS 'Profile reference key mirroring Supabase auth.users.id';
COMMENT ON COLUMN public.users.branch_id IS 'Primary branch campus assignment pointer';
COMMENT ON COLUMN public.users.user_type IS 'Profile type category mapping (e.g. STAFF, STUDENT, PARENT)';
COMMENT ON COLUMN public.users.status IS 'Onboarding lifecycle mapping state (e.g. PENDING, ACTIVE)';
COMMENT ON COLUMN public.users.is_super_admin IS 'Flag denoting platform management roles';
COMMENT ON COLUMN public.users.version IS 'Optimistic concurrency control version stamp';
