-- ============================================================================
-- File       : 001_roles_indexes.sql
-- Module     : Authorization
-- Purpose    : Core search and filter optimization indexes for roles table.
-- Depends On : roles
-- Author     : Agaran Platform
-- Version    : 1.0.0
-- ============================================================================

-- 1. Partial unique index to prevent duplicate role codes within active tenant scope
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_roles_tenant_code 
    ON roles(tenant_id, lower(trim(code))) 
    WHERE deleted_at IS NULL;

-- 2. Case-insensitive unique role name checks per tenant
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_roles_tenant_name_lower
    ON roles(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- 3. Composite lookup index for active roles queries
CREATE INDEX IF NOT EXISTS idx_roles_tenant_type_priority
    ON roles (tenant_id, role_type, priority)
    WHERE deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- Comments
-- ----------------------------------------------------------------------------
COMMENT ON INDEX uq_part_roles_tenant_code IS 'Enforces unique lowercase role codes per tenant context, excluding deleted entries.';
COMMENT ON INDEX idx_roles_tenant_type_priority IS 'Accelerates dynamic privilege resolution checks and priority precedence checks.';
