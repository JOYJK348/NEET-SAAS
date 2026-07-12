# Authorization Domain Schema Specifications

This sub-domain governs the Role-Based Access Control (RBAC), permission allocations, and menu visibilities.

---

## 1. Domain Entities & Schemas

The following DDL tables are defined in `/tables` to handle system authorization:
1.  **`menu_groups`**: Parent visual layout groupings + `slug` configurations + UI visual tags (`color`, `description`, `default_expanded`).
2.  **`menu_master`**: Detailed page directories + workflow keys & cache key mappings + `page_type` tags (`MENU`, `PAGE`, `ACTION`, `HIDDEN`).
3.  **`permission_groups`**: Group classifications for UI display lists (e.g. *Admissions*, *Learning*).
4.  **`permissions`**: Static system capabilities keys catalog + resource/action parameters + scope parameter + `is_deprecated` lifecycle toggle.
5.  **`roles`**: Runtime system and custom tenant roles + `is_default` settings + `role_type` identifier (`SYSTEM`, `CUSTOM`).
6.  **`role_permissions`**: Pivot table mapping role credentials to capability permissions.
7.  **`user_roles`**: Pivot table mapping user logins to roles with temporal limits (`effective_from`, `effective_to`) + audit tracking (`assigned_by`, `assignment_reason`, `revoked_by`, `revoked_reason`).
8.  **`role_menu_visibility`**: Override visibility settings + visibility override mode (`ALLOW`, `DENY`, `INHERIT`).
9.  **`role_templates`**: Seed templates for pre-configured sets linking template roles directly to permission FK IDs.
10. **`menu_permissions`**: Pivot mapping menu pages directly to permission requirements.
11. **`permission_dependencies`**: Direct validation tracking mapping dependencies (e.g., `edit` requires `view`).
12. **`role_inheritance`**: Structural parent-child inheritance mappings.
13. **`permission_conditions`**: Attribute-based security mappings (ABAC) defining context rule parameters (e.g. branch-wise restrictions).

---

## 2. Row-Level Security (RLS) Specification

All tables are protected by Row-Level Security (RLS) policies:
-   **SUPER_ADMIN**: Short-circuits policy validations to allow unrestricted reads/writes.
-   **TENANT_ADMIN**: Granted access to view and edit tables bounded by matching `tenant_id`.
-   **Users/Roles**: Evaluates capability claims dynamically using database checks `fn_has_permission()`.

---

## 3. Compile Dependency Sequence

The SQL scripts in this folder must compile in the following order:
1.  `tables/` DDL scripts (001 to 013)
2.  `functions/` helpers (001 to 007)
3.  `views/` queries (001 to 002)
4.  `rls/` policies scripts (001 to 013)
5.  `indexes/` optimization scripts (001 to 006)
6.  `seeds/` idempotent datasets:
    *   `seeds/001_menu_groups.sql`
    *   `seeds/002_menu_master.sql`
    *   `seeds/003_permission_groups.sql`
    *   `seeds/004_permissions.sql`
    *   `seeds/005_system_roles.sql`
    *   `seeds/006_role_permissions.sql`
    *   `seeds/007_menu_permissions.sql`
    *   `seeds/008_role_templates.sql`
    *   `seeds/009_super_admin.sql`
    *   `seeds/999_validation.sql`
