-- ============================================================================
-- SQL File: 00.04_functions.sql
-- Domain: Global Utility & Helper Functions
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "set_updated_at()": Generic trigger handler ensuring modification timestamp updates.
-- 2. "current_tenant_id()": Extracts target tenant UUID context from active JWT claim variables.
-- 3. "current_branch_id()": Extracts branch context for multi-branch isolation.
-- 4. "current_user_id()": Extracts active user context from JWT claims.
-- 5. "touch_audit_columns()": Automatically populates created_by, updated_by, and timestamps.
-- 6. "generate_primary_key()": Abstracted UUID wrapper defaulting to LANGUAGE sql.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Timestamp auto-updater trigger function
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
COMMENT ON FUNCTION set_updated_at IS 'Triggers update to updated_at timestamp on row mutations';

-- 2. Tenant Context Resolver (RLS helper)
CREATE OR REPLACE FUNCTION current_tenant_id()
RETURNS UUID AS $$
DECLARE
    claims jsonb;
BEGIN
    IF current_setting('request.jwt.claims', true) = '' THEN
        RETURN NULL;
    END IF;
    
    claims := current_setting('request.jwt.claims', true)::jsonb;
    IF claims IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN nullif(claims->>'tenantId', '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;
COMMENT ON FUNCTION current_tenant_id IS 'Resolves active tenant_id context from Supabase JWT claims';

-- 3. Branch Context Resolver (RLS helper)
CREATE OR REPLACE FUNCTION current_branch_id()
RETURNS UUID AS $$
DECLARE
    claims jsonb;
BEGIN
    IF current_setting('request.jwt.claims', true) = '' THEN
        RETURN NULL;
    END IF;
    
    claims := current_setting('request.jwt.claims', true)::jsonb;
    IF claims IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN nullif(claims->>'branchId', '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;
COMMENT ON FUNCTION current_branch_id IS 'Resolves active branch_id context from Supabase JWT claims';

-- 4. User Context Resolver (RLS helper)
CREATE OR REPLACE FUNCTION current_user_id()
RETURNS UUID AS $$
DECLARE
    claims jsonb;
BEGIN
    IF current_setting('request.jwt.claims', true) = '' THEN
        RETURN NULL;
    END IF;
    
    claims := current_setting('request.jwt.claims', true)::jsonb;
    IF claims IS NULL THEN
        RETURN NULL;
    END IF;
    
    RETURN nullif(claims->>'sub', '')::uuid;
END;
$$ LANGUAGE plpgsql STABLE SET search_path = public;
COMMENT ON FUNCTION current_user_id IS 'Resolves active user_id context from Supabase JWT claims';

-- 5. Audit Stamps Populator trigger function
CREATE OR REPLACE FUNCTION touch_audit_columns()
RETURNS TRIGGER AS $$
DECLARE
    active_user UUID;
BEGIN
    active_user := current_user_id();
    
    IF TG_OP = 'INSERT' THEN
        NEW.created_at = now();
        NEW.updated_at = now();
        IF active_user IS NOT NULL THEN
            NEW.created_by = active_user;
            NEW.updated_by = active_user;
        END IF;
    ELSIF TG_OP = 'UPDATE' THEN
        NEW.updated_at = now();
        IF active_user IS NOT NULL THEN
            NEW.updated_by = active_user;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
COMMENT ON FUNCTION touch_audit_columns IS 'Populates audit stamps automatically for Base Entities';

-- 6. Abstracted Primary Key generator
CREATE OR REPLACE FUNCTION generate_primary_key()
RETURNS UUID
LANGUAGE sql
STABLE
SET search_path = public
AS $$
    SELECT gen_random_uuid();
$$;
COMMENT ON FUNCTION generate_primary_key IS 'Abstracted primary key generator resolving to gen_random_uuid fallback';

