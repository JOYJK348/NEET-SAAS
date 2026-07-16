# Database Naming & Auditing Conventions 📐

## Standards

1. **Case Style**: Snake case (`snake_case`) for database tables and column names.
2. **Pluralization**: Table names should be plural (e.g. `users`, `institutes`).
3. **Primary Keys**: Always `id` as `UUID` or `String` generated automatically.
4. **Tenant Scoping**: Every multitenant entity must carry an `institute_id` column indexed and referencing `institutes(id)`.
5. **Auditing Columns**: Mandatory columns:
   - `created_at` (timestamp)
   - `updated_at` (timestamp)
   - `created_by` (UUID)
   - `updated_by` (UUID)
   - `deleted_at` (timestamp, nullable for logical soft deletes)

---

[⬅️ Back to Database Index](../README.md)
