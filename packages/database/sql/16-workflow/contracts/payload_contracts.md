# Workflow Event Payload Contracts

## Envelope (All Events)

```json
{
  "request_id": "UUID",
  "tenant_id": "UUID",
  "action_code": "STRING",
  "from_status": "STRING",
  "to_status": "STRING",
  "performed_by": "UUID",
  "timestamp": "ISO8601"
}
```

## Type Definitions

| Field | Type | Format | Description |
|---|---|---|---|
| `request_id` | UUID | v4 | Workflow request identifier |
| `tenant_id` | UUID | v4 | Multi-tenant scope identifier |
| `action_code` | String | Uppercase | Action performed (APPROVE, REJECT, etc.) |
| `from_status` | String | Uppercase | Previous workflow state |
| `to_status` | String | Uppercase | New workflow state |
| `performed_by` | UUID | v4 | User who performed the action |
| `timestamp` | String | ISO 8601 | UTC timestamp of transition |

## Event-Specific Contracts

### workflow.submitted

```json
{
  "request_id": "a1b2c3d4-...",
  "tenant_id": "00000000-0000-0000-0000-000000000000",
  "action_code": "SUBMIT",
  "from_status": "DRAFT",
  "to_status": "PENDING",
  "performed_by": "user-uuid",
  "timestamp": "2026-07-12T14:30:00Z"
}
```

### workflow.completed

```json
{
  "request_id": "a1b2c3d4-...",
  "tenant_id": "00000000-0000-0000-0000-000000000000",
  "action_code": "APPROVE",
  "from_status": "PENDING",
  "to_status": "APPROVED",
  "performed_by": "user-uuid",
  "timestamp": "2026-07-12T14:30:00Z"
}
```

### workflow.rejected

```json
{
  "request_id": "a1b2c3d4-...",
  "tenant_id": "00000000-0000-0000-0000-000000000000",
  "action_code": "REJECT",
  "from_status": "PENDING",
  "to_status": "REJECTED",
  "performed_by": "user-uuid",
  "timestamp": "2026-07-12T14:30:00Z"
}
```

### workflow.changes_requested

```json
{
  "request_id": "a1b2c3d4-...",
  "tenant_id": "00000000-0000-0000-0000-000000000000",
  "action_code": "RETURN",
  "from_status": "PENDING",
  "to_status": "CHANGES_REQUESTED",
  "performed_by": "user-uuid",
  "timestamp": "2026-07-12T14:30:00Z"
}
```

### workflow.cancelled

```json
{
  "request_id": "a1b2c3d4-...",
  "tenant_id": "00000000-0000-0000-0000-000000000000",
  "action_code": "CANCEL",
  "from_status": "PENDING",
  "to_status": "CANCELLED",
  "performed_by": "user-uuid",
  "timestamp": "2026-07-12T14:30:00Z"
}
```

### workflow.escalated

```json
{
  "request_id": "a1b2c3d4-...",
  "tenant_id": "00000000-0000-0000-0000-000000000000",
  "action_code": "ESCALATE",
  "from_status": "PENDING",
  "to_status": "PENDING",
  "performed_by": "00000000-0000-0000-0000-000000000000",
  "escalation_level": 1,
  "target_strategy": "TENANT_ADMIN",
  "timestamp": "2026-07-12T14:30:00Z"
}
```

## Notes

- All payloads are JSON strings passed via `pg_notify(channel, payload)`
- Consumers should use `request_id` as the idempotency key
- The `performed_by` field uses zero-UUID for system actions
- Additional metadata may appear in future versions; consumers should be tolerant of unknown fields
