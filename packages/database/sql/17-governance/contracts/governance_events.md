# Governance Events

## Event Channel: `feature_flag_changed`

Fired via `pg_notify` when a feature flag's `enabled` state toggles.

```json
{
  "feature_key": "ai.tutor",
  "tenant_id": "uuid-or-null",
  "enabled": true,
  "timestamp": "2026-07-12T14:30:00Z"
}
```

## Standard Event Names (via `fn_write_audit`)

| Event              | Trigger                     | Description              |
| ------------------ | --------------------------- | ------------------------ |
| `policy.created`   | INSERT on `policy_settings` | New policy created       |
| `policy.updated`   | UPDATE on `policy_settings` | Policy value changed     |
| `feature.enabled`  | Feature flag toggled ON     | Feature activated        |
| `feature.disabled` | Feature flag toggled OFF    | Feature deactivated      |
| `api_key.rotated`  | `sp_rotate_api_keys()`      | Expired key deactivated  |
| `audit.cleanup`    | `sp_cleanup_audit_logs()`   | Old audit records purged |

## Consumer Guide

1. **Cache Invalidation** — Listen on `feature_flag_changed` to bust in-memory caches
2. **Compliance** — All governance mutations auto-log to `audit_logs` via triggers
3. **Webhooks** — Future: bridge `pg_notify` → outgoing webhook delivery
