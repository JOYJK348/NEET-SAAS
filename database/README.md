# Coaching Management Platform - Database Standards & Guidelines

This directory houses the PostgreSQL (Supabase compatible) DDL schemas, migration controls, and database function routines for the Coaching Management Platform.

---

## 1. Directory Structure (Domain-Driven Design)

Database resources are partitioned vertically into **Bounded Contexts**. Under each context directory, SQL resources are organized by their database type:

```text
database/
├── README.md                 # This master convention document
├── migrations/               # Sequential migration scripts directory
├── 15-authorization/
│   ├── README.md             # Sub-domain specifications
│   ├── tables/               # DDL table creation scripts (prefixed by execution sequence)
│   ├── functions/            # Postgres functions and procedures
│   ├── rls/                  # Supabase Row-Level Security policy definitions
│   ├── indexes/              # Optimization B-Tree or GIN indexes
│   ├── seeds/                # Initial lookup data inserts
│   └── views/                # Database abstraction views
├── 16-workflow/
...
```

---

## 2. SQL Naming & Coding Standards

1.  **Case Strategy**: PostgreSQL is case-insensitive.
    *   **Tables**: Plural and `snake_case` (e.g. `role_permissions`).
    *   **Columns**: Singular and `snake_case` (e.g. `permission_key`).
    *   **Functions**: Prefix with `fn_` and use `snake_case` (e.g. `fn_has_permission`).
    *   **Triggers**: Suffix with `_trigger` (e.g. `audit_logs_trigger`).
2.  **File Naming Sequence**: Tables DDL files must carry a 3-digit order sequence (e.g., `tables/001_roles.sql`) to avoid definition dependency compile failures during setups.

---

## 3. Auditable Common Columns

Every core business/transactional table **MUST** define the following default audited columns:

```sql
CREATE TABLE example_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES institutes(id) ON DELETE RESTRICT,
    
    -- Transaction payload columns here...
    
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    created_by UUID, -- Resolved user UUID
    updated_by UUID, -- Resolved user UUID
    deleted_at TIMESTAMPTZ, -- Soft delete target timestamp
    version INT DEFAULT 1 NOT NULL, -- Optimistic locking
    metadata JSONB -- Dynamic tenant attributes vault
);
```

---

## 4. Row-Level Security (RLS) Protocol

Supabase Row-Level Security is **ENABLED** on all tables containing tenant-sensitive data.
*   The leftmost query constraint on all select/lookups must target the tenant boundary: `tenant_id`.
*   RLS policies must leverage the Permission Engine helper functions (e.g. `fn_has_permission`) to validate action scopes dynamically, rather than hardcoding static role strings.
