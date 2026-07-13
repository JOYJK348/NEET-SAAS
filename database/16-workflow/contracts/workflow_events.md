# Workflow Engine Events

This document describes the event-driven integration layer of the workflow engine.

## Architecture

The workflow engine uses PostgreSQL `NOTIFY`/`LISTEN` for asynchronous event emission. When a state transition occurs via `fn_submit_action()`, if the transition has an `event_name` configured, the engine fires a `pg_notify` with a JSON payload.

```
fn_submit_action()
  └── condition_expression evaluated
  └── state transition applied
  └── history logged
  └── pg_notify(event_name, payload)
        └── External consumers (Kafka/RabbitMQ/Webhooks)
              via PgBouncer/listener service
```

## Consumer Integration

External systems connect via:

1. **PgBouncer + LISTEN** — Lightweight, real-time
2. **pg_notify → Kafka Bridge** — Durable event streaming
3. **Application Triggers** — Direct handling in backend services

## Event Payload Schema

Every event notification uses this standard envelope:

```json
{
  "request_id": "uuid",
  "tenant_id": "uuid",
  "action_code": "APPROVE|REJECT|SUBMIT|...",
  "from_status": "PENDING",
  "to_status": "APPROVED",
  "performed_by": "uuid",
  "timestamp": "2026-07-12T14:30:00Z"
}
```

## Event Lifecycle

```
1. fn_submit_action() called
2. Transition validated (condition_expression checked)
3. workflow_requests row updated (version incremented)
4. workflow_history row inserted (metadata.event populated)
5. pg_notify fired with event_name
6. External listener receives and processes
```

## Guarantees

- **At-least-once delivery** — History log is the authoritative source of truth
- **Ordering** — Events fire *after* the transaction commits
- **Idempotency** — Consumers should key on `request_id + action_code + timestamp`
- **No persistence** — `NOTIFY` is ephemeral; use Kafka/RabbitMQ bridge for durable subscriptions
