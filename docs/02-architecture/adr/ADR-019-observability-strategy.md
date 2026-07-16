# ADR-019: Observability, Metrics, and Telemetry Logging Strategy

## Status

LOCKED (July 8, 2026)

## Context and Problem Statement

In a distributed multi-tenant environment, identifying performance bottlenecks, query lock contentions, deadlocks, and background worker failures is extremely difficult without centralized instrumentation. We need a unified telemetry logging strategy.

## Decision Outcome

We implement a **Three-Pillar Observability Architecture**:

1.  **Logging**: Centralized structure format logs with context correlation IDs.
2.  **Metrics**: Automated performance aggregations tracking API latency, write TPS, and system costs.
3.  **Traces**: Distributed correlation IDs across transactions.

### 1. Database Deadlock & Lock Observability

To quickly isolate deadlock issues:

- Postgres log parameter `log_lock_waits = on` is enabled to capture transactions waiting longer than 1 second for a lock.
- Enable `deadlock_timeout = 1s` to raise immediate database exceptions on circular dependency locks.
- Background jobs tracker polls `pg_stat_activity` and fires Slack alerts if locks block critical operations.

### 2. Event Telemetry Logging

- All audit logs are tagged with `request_id` (correlation trace identifier) mapping back to the API request header.
- High-frequency telemetry (like student video playback loops) is written directly to partitioned `student_learning_history` tables and analyzed asynchronously, preventing database load spikes.

### 3. Application Performance Alerts

We configure automated alerts for key operational thresholds:

- **API Latency**: Trigger warning if P95 latency exceeds 500ms for more than 5 consecutive minutes.
- **Job Failures**: Alert immediately if a background job reaches the DLQ status.
- **Tenant Storage Limits**: Warn tenant administrators when utilization reaches 80% of storage quota.
