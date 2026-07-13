# Governance Bounded Context

Platform-wide rules, configuration, compliance, and operational control.

## Scope

This module manages **six core governance concepts** — no more:

1. **Policy Categories** — Taxonomy of policy domains (security, exam, billing, etc.)
2. **Policy Settings** — Hierarchical key-value store (tenant override > global > default)
3. **Feature Flags** — Dynamic feature toggles with plan gating and rollout control
4. **Audit Logs** — Central append-only compliance trail
5. **System Settings** — Platform-level configuration (brand, timezone, maintenance)
6. **API Keys** — Encrypted vault for third-party integrations

> Background jobs, webhook delivery, system announcements, and job history are **not** part of governance. They will become their own bounded contexts if those capabilities grow.

## Design Principles

1. **Policy Resolution Hierarchy**: Tenant-specific → Global → Default
2. **Append-only Audit**: No UPDATE/DELETE on `audit_logs` (trigger-enforced)
3. **Encryption at Rest**: API keys encrypted via `pgp_sym_encrypt()`
4. **Feature Flag Priority**: Tenant override always wins over global
5. **Permission-Driven**: RLS on all tables; no hardcoded role checks

## Compile Order

| Step | File | Depends On |
|------|------|------------|
| 1 | `tables/001_policy_categories.sql` | — |
| 2 | `tables/002_policy_settings.sql` | 001 |
| 3 | `tables/003_feature_flags.sql` | — |
| 4 | `tables/004_audit_logs.sql` | — |
| 5 | `tables/005_system_settings.sql` | — |
| 6 | `tables/006_api_keys.sql` | — |
| 7 | `functions/001_governance_functions.sql` | 1–6 |
| 8 | `procedures/001_governance_procedures.sql` | 7 |
| 9 | `triggers/001_governance_triggers.sql` | 1–7 |
| 10 | `rls/001_governance_rls.sql` | 1–6 |
| 11 | `indexes/001_governance_indexes.sql` | 1–6 |
| 12 | `views/001_governance_views.sql` | 1–6 |
| 13 | `seeds/001_policy_categories.sql` | 1 |
| 14 | `seeds/002_default_policies.sql` | 1, 2 |
| 15 | `seeds/003_feature_flags.sql` | 3 |
| 16 | `seeds/004_system_settings.sql` | 5 |
| 17 | `validation/999_validation.sql` | All |

> `contracts/` is documentation only — no SQL execution required.

## Externally Required Objects

- `touch_audit_columns()` — from `00-governance` (audit stamp automation)
- `current_user_id_or_null()` — returns current user UUID or NULL
- `current_user_is_super_admin()` — super admin check
- `fn_has_permission(tenant_id, user_id, permission)` — from `15-authorization`
- `fn_rls_can_select/insert/update()` — from `15-authorization` (RLS helpers)
- `app.encryption_key` — custom config parameter for pgcrypto
- `pgcrypto` extension — for API key encryption

## Key Functions

| Function | Purpose |
|---|---|
| `fn_get_policy(tenant_id, policy_key)` | Resolves policy value (tenant → global → default) |
| `fn_is_feature_enabled(tenant_id, feature_key)` | Checks if feature is active for tenant |
| `fn_get_system_setting(setting_key)` | Returns platform-level setting |
| `fn_write_audit(...)` | Universal audit logger (SECURITY DEFINER) |
| `fn_validate_policy(value, type, rule)` | Validates value against type+rule constraints |
| `fn_get_api_key(tenant_id, service)` | Decrypts and returns API key |

## Key Procedures

| Procedure | Schedule | Purpose |
|---|---|---|
| `sp_cleanup_audit_logs(retention_days)` | Monthly | Purge old audit records |
| `sp_rotate_api_keys()` | Daily | Deactivate expired API keys |
| `sp_disable_deprecated_flags()` | Weekly | Disable deprecated feature flags |
