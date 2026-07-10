-- ============================================================================
-- SQL File: 01.12_batch_delivery_types.sql
-- Domain: Master Core Batch Delivery Types Configuration
-- Principal PostgreSQL Database Architect Design Decisions:
-- 1. "batch_delivery_types" maps operational schedules parameters per tenant.
-- 2. Added "is_default" flag mapping per tenant to allow quick automated creations.
-- 3. Checked time bounds: default_end_time > default_start_time.
-- 4. Set max students limits constraint: BETWEEN 1 AND 500.
-- 5. Configured alphanumeric check validation for "icon_name" strings.
-- 6. Uses the global touch_audit_columns trigger to populate stamps.
-- ============================================================================

-- Ensure target schema scope
SET search_path = public;

-- 1. Create Table Structure
CREATE TABLE IF NOT EXISTS public.batch_delivery_types (
    id UUID PRIMARY KEY DEFAULT generate_primary_key(),
    tenant_id UUID NOT NULL,
    
    code VARCHAR(20) NOT NULL,
    name VARCHAR(150) NOT NULL,
    description TEXT NULL,
    
    attendance_mode attendance_mode_type NOT NULL DEFAULT 'CLASSROOM',
    
    default_max_students SMALLINT NOT NULL DEFAULT 40,
    default_start_time TIME WITHOUT TIME ZONE NULL,
    default_end_time TIME WITHOUT TIME ZONE NULL,
    
    color_code color_hex NULL,
    icon_name VARCHAR(50) NULL,
    display_order SMALLINT NOT NULL DEFAULT 1,
    
    is_default BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT false,
    
    -- Audit Stamps
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_by UUID NULL, -- References public.users.id (FK added in auth migration step)
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_by UUID NULL, -- References public.users.id (FK added in auth migration step)
    deleted_at TIMESTAMP WITH TIME ZONE NULL,
    deleted_by UUID NULL, -- References public.users.id (FK added in auth migration step)
    
    version INTEGER NOT NULL DEFAULT 1,

    -- Inline constraints & validations
    CONSTRAINT fk_bdt_tenant FOREIGN KEY (tenant_id) 
        REFERENCES public.institutes(id) ON UPDATE CASCADE ON DELETE RESTRICT,
    
    CONSTRAINT chk_bdt_name_length CHECK (length(trim(name)) > 0),
    CONSTRAINT chk_bdt_code_format CHECK (code ~ '^[A-Z][A-Z0-9_]{1,19}$'),
    CONSTRAINT chk_bdt_description CHECK (description IS NULL OR (length(trim(description)) > 0 AND length(description) <= 1000)),
    CONSTRAINT chk_bdt_icon CHECK (icon_name IS NULL OR icon_name ~ '^[a-zA-Z0-9_-]+$'),
    CONSTRAINT chk_bdt_max_students CHECK (default_max_students BETWEEN 1 AND 500),
    CONSTRAINT chk_bdt_times CHECK (
        default_end_time IS NULL
        OR default_start_time IS NULL
        OR default_end_time > default_start_time
    ),
    CONSTRAINT chk_bdt_display_order CHECK (display_order BETWEEN 1 AND 999),
    CONSTRAINT chk_bdt_version CHECK (version > 0)
);

-- 2. Indexes for fast tenant search and ordering lookups (Tenant Scoped)
CREATE INDEX IF NOT EXISTS idx_bdt_tenant_active 
    ON public.batch_delivery_types(tenant_id, is_active) 
    WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_bdt_tenant_display 
    ON public.batch_delivery_types(tenant_id, display_order) 
    WHERE deleted_at IS NULL;

-- Index to accelerate tenant search queries ordering by name
CREATE INDEX IF NOT EXISTS idx_bdt_tenant_search_name
    ON public.batch_delivery_types(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- 2.1 Composite Uniqueness Constraints (enables composite foreign key verification in downstream batch tables)
ALTER TABLE public.batch_delivery_types DROP CONSTRAINT IF EXISTS uq_bdt_tenant_id CASCADE;
ALTER TABLE public.batch_delivery_types ADD CONSTRAINT uq_bdt_tenant_id UNIQUE (tenant_id, id);

-- 2.2 Partial Unique Indexes for Soft Deletes (prevents duplicate codes/names within the same tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_bdt_tenant_code 
    ON public.batch_delivery_types(tenant_id, code) 
    WHERE deleted_at IS NULL;

-- Case-insensitive name unique index using lower(trim()) mapping checks
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_bdt_tenant_name_lower
    ON public.batch_delivery_types(tenant_id, lower(trim(name)))
    WHERE deleted_at IS NULL;

-- Unique default config tracking index per tenant (enforces exactly one default setting per tenant)
CREATE UNIQUE INDEX IF NOT EXISTS uq_part_bdt_tenant_default
    ON public.batch_delivery_types(tenant_id)
    WHERE is_default = true AND deleted_at IS NULL;

-- 3. Triggers configuration for timestamp and user context tracking
DROP TRIGGER IF EXISTS trg_biu_batch_delivery_types_touch_audit ON public.batch_delivery_types;
CREATE TRIGGER trg_biu_batch_delivery_types_touch_audit
    BEFORE INSERT OR UPDATE ON public.batch_delivery_types
    FOR EACH ROW
    EXECUTE FUNCTION touch_audit_columns();

-- 4. Row-Level Security Configuration
ALTER TABLE public.batch_delivery_types ENABLE ROW LEVEL SECURITY;

-- 4.1 RLS Policies (Ensure Idempotent Setup)
DROP POLICY IF EXISTS policy_batch_delivery_types_select ON public.batch_delivery_types;
CREATE POLICY policy_batch_delivery_types_select
    ON public.batch_delivery_types
    FOR SELECT
    TO authenticated
    USING (tenant_id = current_tenant_id() AND deleted_at IS NULL);

-- Comments mappings for catalog documentation
COMMENT ON TABLE public.batch_delivery_types IS 'Tenant-specific catalog defining reusable batch delivery configurations such as schedule, attendance mode, and default operational settings';
COMMENT ON COLUMN public.batch_delivery_types.code IS 'Uppercase delivery mode code (e.g. MORNING, WEEKEND)';
COMMENT ON COLUMN public.batch_delivery_types.attendance_mode IS 'Attendance tracking delivery mode (e.g. CLASSROOM, ONLINE)';
COMMENT ON COLUMN public.batch_delivery_types.color_code IS 'Hex color string for dashboard UI styling';
COMMENT ON COLUMN public.batch_delivery_types.icon_name IS 'Font icon name for dashboard UI rendering';
COMMENT ON COLUMN public.batch_delivery_types.is_default IS 'Flag indicating if this is the default configuration setting for the tenant';
COMMENT ON COLUMN public.batch_delivery_types.version IS 'Optimistic concurrency control version stamp';
