# Governance Event Payload Contracts

## audit_logs Row Schema

| Column | Type | Description |
|---|---|---|
| `id` | BIGSERIAL | Auto-increment PK |
| `tenant_id` | UUID | Tenant scope (nullable for system-wide actions) |
| `entity_type` | VARCHAR | Affected table/domain (e.g. policy_setting, feature_flag) |
| `entity_id` | UUID | Affected record ID |
| `action` | VARCHAR | Event name (e.g. policy.updated, feature.enabled) |
| `old_value` | JSONB | Previous state (null for INSERT) |
| `new_value` | JSONB | Current state (null for DELETE) |
| `performed_by` | UUID | Acting user |
| `ip_address` | INET | Request origin IP |
| `user_agent` | TEXT | Client user agent |
| `request_id` | UUID | Request tracing ID |
| `correlation_id` | UUID | Distributed tracing correlation |
| `created_at` | TIMESTAMPTZ | Event timestamp |

## fn_get_policy Resolution Flow

```
fn_get_policy(tenant_id, 'security.password.min_length')
  │
  ├─ 1. tenant_id + policy_key EXISTS?
  │     YES → return value
  │
  ├─ 2. NULL tenant_id + policy_key EXISTS?
  │     YES → return value
  │
  └─ 3. Return default_value from any row
```

## fn_is_feature_enabled Resolution Flow

```
fn_is_feature_enabled(tenant_id, 'ai.tutor')
  │
  ├─ 1. tenant_id + feature_key EXISTS?
  │     YES → return enabled
  │
  └─ 2. NULL tenant_id + feature_key EXISTS?
        YES → return enabled
        NO  → return false
```
