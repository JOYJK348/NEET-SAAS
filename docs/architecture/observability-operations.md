# 🔭 Observability & Operations Strategy

> **Scope:** Platform-wide operational architecture  
> **Owner:** DevOps / Platform Team  
> **Status:** 🟡 Draft  
> **Applies To:** All domains (01-11)  
> **Last Reviewed By:** — (Pending)

---

## 1. Observability Stack

| Layer              | Technology                | Purpose                                 |
| ------------------ | ------------------------- | --------------------------------------- |
| **Metrics**        | Prometheus                | System + application metrics collection |
| **Visualization**  | Grafana                   | Dashboards, alerting UI                 |
| **Logs**           | Loki (via Grafana)        | Centralized log aggregation             |
| **Tracing**        | OpenTelemetry             | Distributed tracing across services     |
| **Error Tracking** | Sentry                    | Unhandled exceptions, error grouping    |
| **Uptime**         | UptimeRobot / BetterStack | External availability monitoring        |

---

## 2. Metrics

### 2.1 Infrastructure Metrics

| Metric       | Source                   | Dashboard               |
| ------------ | ------------------------ | ----------------------- |
| CPU Usage    | Prometheus node_exporter | Grafana: Infrastructure |
| Memory Usage | Prometheus node_exporter | Grafana: Infrastructure |
| Disk I/O     | Prometheus node_exporter | Grafana: Infrastructure |
| Network I/O  | Prometheus node_exporter | Grafana: Infrastructure |

### 2.2 Database Metrics

| Metric                      | Source                       | Dashboard         |
| --------------------------- | ---------------------------- | ----------------- |
| Query Latency (P50/P95/P99) | pg_stat_statements           | Grafana: Database |
| Slow Queries (> 200ms)      | pg_stat_statements           | Grafana: Database |
| Active Connections          | pg_stat_activity             | Grafana: Database |
| Connection Pool Usage       | PgBouncer / Supabase metrics | Grafana: Database |
| Deadlocks                   | pg_stat_database             | Grafana: Database |
| Table Bloat                 | pg_stat_user_tables          | Grafana: Database |
| Index Hit Rate              | pg_stat_user_indexes         | Grafana: Database |
| Rows Read / Written         | pg_stat_user_tables          | Grafana: Database |
| WAL Size                    | pg_stat_wal                  | Grafana: Database |
| Replication Lag             | pg_stat_replication          | Grafana: Database |

### 2.3 Application Metrics

| Metric                                        | Source                             | Dashboard         |
| --------------------------------------------- | ---------------------------------- | ----------------- |
| API Latency (per endpoint, P50/P95/P99)       | OpenTelemetry / NestJS interceptor | Grafana: API      |
| Request Count (per endpoint, per status code) | OpenTelemetry                      | Grafana: API      |
| Error Rate (4xx, 5xx)                         | OpenTelemetry                      | Grafana: API      |
| Active Users (concurrent sessions)            | Application counter                | Grafana: Business |
| Background Job Duration                       | Bull MQ metrics                    | Grafana: Jobs     |
| Queue Depth                                   | Bull MQ metrics                    | Grafana: Jobs     |
| Event Processing Lag                          | Custom metric                      | Grafana: Events   |

### 2.4 Cache Metrics

| Metric                            | Source              | Dashboard      |
| --------------------------------- | ------------------- | -------------- |
| Redis Hit Rate                    | Redis INFO stats    | Grafana: Cache |
| Redis Memory Usage                | Redis INFO memory   | Grafana: Cache |
| Redis Connection Count            | Redis INFO clients  | Grafana: Cache |
| Cache Miss Rate (per key pattern) | Application counter | Grafana: Cache |
| Cache Eviction Rate               | Redis INFO stats    | Grafana: Cache |

### 2.5 Business Metrics

| Metric                              | Source                    | Dashboard         |
| ----------------------------------- | ------------------------- | ----------------- |
| Daily New Institutes                | Application event counter | Grafana: Business |
| Daily Admissions                    | Application event counter | Grafana: Business |
| Active Subscriptions                | Periodic DB count         | Grafana: Business |
| Subscription Renewals / Expirations | Domain events             | Grafana: Business |
| Daily Attendance %                  | Aggregation job           | Grafana: Business |
| Assessment Completion Rate          | Aggregation job           | Grafana: Business |
| Revenue (if applicable)             | Payment domain events     | Grafana: Business |

---

## 3. Logging Strategy

### 3.1 Log Levels

| Level   | Usage                                        | Example                                      |
| ------- | -------------------------------------------- | -------------------------------------------- |
| `ERROR` | Unrecoverable failures, unhandled exceptions | Prisma query failure, payment webhook crash  |
| `WARN`  | Recoverable issues, degraded performance     | Redis fallback to DB, retry attempt          |
| `INFO`  | Business events, state transitions           | Institute created, subscription expired      |
| `DEBUG` | Development-time detail                      | Query parameters, cache key lookups          |
| `TRACE` | Granular internal flow                       | Function entry/exit (disabled in production) |

### 3.2 Log Format (Structured JSON)

```json
{
  "timestamp": "2026-07-08T13:00:00.000Z",
  "level": "INFO",
  "correlationId": "req-abc-123",
  "traceId": "otel-xyz-456",
  "service": "cmp-api",
  "module": "InstituteService",
  "action": "institute.created",
  "instituteId": "uuid-...",
  "userId": "uuid-...",
  "duration": 45,
  "message": "Institute created successfully"
}
```

### 3.3 Mandatory Context Fields

Every log line MUST include:

| Field           | Source                                   | Purpose                         |
| --------------- | ---------------------------------------- | ------------------------------- |
| `correlationId` | `X-Correlation-ID` header (or generated) | End-to-end request tracing      |
| `traceId`       | OpenTelemetry auto-instrumentation       | Distributed tracing correlation |
| `instituteId`   | JWT claim                                | Tenant isolation in logs        |
| `userId`        | JWT claim                                | Who performed the action        |
| `module`        | NestJS service class name                | Source identification           |
| `action`        | Developer-defined action name            | Business event identification   |

### 3.4 Log Categories

| Category             | Content                                                  | Retention                      |
| -------------------- | -------------------------------------------------------- | ------------------------------ |
| **Application Logs** | API requests, responses, business logic                  | 30 days                        |
| **Access Logs**      | HTTP method, path, status, latency, user agent           | 90 days                        |
| **Audit Logs**       | CRUD on sensitive entities (before/after JSONB)          | 3 years                        |
| **Security Logs**    | Failed login, permission denied, JWT invalid, rate limit | 1 year                         |
| **Payment Logs**     | Webhook payloads, payment status changes                 | 7 years (financial compliance) |
| **Error Logs**       | Stack traces, unhandled exceptions                       | 90 days                        |

---

## 4. Distributed Tracing

### 4.1 Trace Flow Example

```text
[Frontend] → [API Gateway] → [NestJS Controller] → [Service Layer] → [Prisma/DB]
                                    │                      │
                                    ↓                      ↓
                               [Redis Cache]          [Bull Queue]
                                                          │
                                                          ↓
                                                   [Event Handler]
                                                          │
                                                          ↓
                                                   [Notification Service]
```

### 4.2 Correlation ID Flow

```text
Browser generates X-Correlation-ID
        ↓
API Gateway preserves header
        ↓
NestJS middleware extracts → attaches to request context
        ↓
Logger middleware includes in every log
        ↓
Prisma query tags include correlation ID
        ↓
Background jobs carry correlation ID in payload
        ↓
Domain events include correlation ID
```

**Rule:** Every domain event payload MUST include `correlationId` so downstream consumers can trace back to the original request.

---

## 5. Alerting

### 5.1 Alert Thresholds

| Alert                            | Condition        | Severity               | Notification Channel   |
| -------------------------------- | ---------------- | ---------------------- | ---------------------- |
| API P95 > 200ms                  | Sustained 5 min  | ⚠️ Warning             | Slack #ops-alerts      |
| API P99 > 500ms                  | Sustained 5 min  | 🔴 Critical            | Slack + PagerDuty      |
| Error Rate > 1%                  | Sustained 5 min  | ⚠️ Warning             | Slack #ops-alerts      |
| Error Rate > 5%                  | Sustained 2 min  | 🔴 Critical            | Slack + PagerDuty      |
| DB Connection Pool > 85%         | Any              | ⚠️ Warning             | Slack #db-alerts       |
| DB Connection Pool > 95%         | Any              | 🔴 Critical            | PagerDuty              |
| Redis Unavailable                | > 30 seconds     | 🔴 Critical            | Slack + PagerDuty      |
| Redis Memory > 75%               | Any              | ⚠️ Warning             | Slack #cache-alerts    |
| Deadlocks > 3/hour               | Rolling 1 hour   | ⚠️ Warning             | Slack #db-alerts       |
| Deadlocks > 10/hour              | Rolling 1 hour   | 🔴 Critical            | PagerDuty              |
| Slow Query > 1s                  | Any single query | ⚠️ Warning             | Slack #db-alerts       |
| Queue Depth > 1,000              | Sustained 5 min  | ⚠️ Warning             | Slack #ops-alerts      |
| Queue Depth > 5,000              | Sustained 5 min  | 🔴 Critical            | PagerDuty              |
| Event Processing Lag > 60s       | Sustained 5 min  | ⚠️ Warning             | Slack #ops-alerts      |
| Disk Usage > 80%                 | Any              | ⚠️ Warning             | Slack #infra-alerts    |
| Disk Usage > 90%                 | Any              | 🔴 Critical            | PagerDuty              |
| CPU > 85%                        | Sustained 10 min | ⚠️ Warning             | Slack #infra-alerts    |
| Subscription Cron Failure        | Any failure      | 🔴 Critical            | Slack + PagerDuty      |
| Payment Webhook Failure > 3/hour | Rolling 1 hour   | 🔴 Critical            | PagerDuty              |
| Failed Logins > 10/min (same IP) | Rolling 1 min    | 🔴 Critical (security) | Slack #security-alerts |

### 5.2 Escalation Policy

```text
Warning  → Slack notification → 15 min auto-resolve check
Critical → Slack + PagerDuty → On-call engineer → 5 min acknowledgment required
Fatal    → All channels → Incident declared → War room
```

---

## 6. SLO & Error Budget

### 6.1 Service Level Objectives

| SLI (Indicator)   | SLO (Objective) | Measurement                          |
| ----------------- | --------------- | ------------------------------------ |
| Availability      | 99.9%           | Uptime checks every 30s              |
| API Latency (P95) | < 200ms         | OpenTelemetry histogram              |
| API Latency (P99) | < 500ms         | OpenTelemetry histogram              |
| Error Rate (5xx)  | < 0.1%          | Request count ratio                  |
| Data Durability   | 99.999%         | Supabase managed (WAL + replication) |

### 6.2 Error Budget

| SLO                 | Allowed Downtime / Month | Allowed Errors / Million Requests |
| ------------------- | ------------------------ | --------------------------------- |
| 99.9% availability  | 43 minutes 49 seconds    | —                                 |
| 99.95% availability | 21 minutes 54 seconds    | —                                 |
| < 0.1% error rate   | —                        | 1,000 errors per 1M requests      |

### 6.3 Error Budget Policy

- **Budget remaining > 50%:** Normal releases, feature deployments allowed
- **Budget remaining 20–50%:** Only bug fixes and stability improvements
- **Budget remaining < 20%:** Feature freeze. Only reliability work.
- **Budget exhausted (0%):** Incident review mandatory. No deploys until budget replenishes.

---

## 7. Health Checks

### 7.1 Endpoint

```text
GET /health
```

### 7.2 Response

```json
{
  "status": "healthy",
  "timestamp": "2026-07-08T13:00:00Z",
  "version": "1.2.3",
  "uptime": "72h 15m",
  "checks": {
    "database": { "status": "healthy", "latency": "3ms" },
    "redis": { "status": "healthy", "latency": "1ms" },
    "storage": { "status": "healthy" },
    "queue": { "status": "healthy", "depth": 12 },
    "mail": { "status": "healthy" },
    "payment": { "status": "degraded", "note": "Webhook retry pending" }
  }
}
```

### 7.3 Check Definitions

| Component        | Check Method           | Timeout | Failure Behavior                        |
| ---------------- | ---------------------- | ------- | --------------------------------------- |
| Database         | `SELECT 1` via Prisma  | 5s      | Status: unhealthy, alert                |
| Redis            | `PING` command         | 3s      | Status: degraded (fallback to DB)       |
| Supabase Storage | HEAD request to bucket | 5s      | Status: degraded (uploads disabled)     |
| Bull Queue       | Connection check       | 3s      | Status: degraded (async jobs paused)    |
| Mail (SMTP)      | Connection test        | 5s      | Status: degraded (notifications queued) |
| Payment Gateway  | API status endpoint    | 5s      | Status: degraded (payments queued)      |

### 7.4 Liveness vs Readiness

| Probe         | Purpose                 | Endpoint            | Failure Action            |
| ------------- | ----------------------- | ------------------- | ------------------------- |
| **Liveness**  | Is the process alive?   | `GET /health/live`  | Restart container         |
| **Readiness** | Can it handle requests? | `GET /health/ready` | Remove from load balancer |

---

## 8. Backup & Disaster Recovery

### 8.1 Backup Schedule

| Type                  | Frequency                  | Retention | Storage                   |
| --------------------- | -------------------------- | --------- | ------------------------- |
| Continuous WAL Backup | Real-time                  | 7 days    | Supabase managed (S3)     |
| Daily Snapshot        | Every 24 hours (02:00 UTC) | 30 days   | Supabase managed          |
| Weekly Full Backup    | Every Sunday (04:00 UTC)   | 90 days   | Separate S3 bucket        |
| Monthly Archive       | 1st of month               | 1 year    | Cold storage (S3 Glacier) |

### 8.2 Recovery Targets

| Scenario                 | RTO     | RPO    | Method                                 |
| ------------------------ | ------- | ------ | -------------------------------------- |
| Single table corruption  | 15 min  | 5 min  | Point-in-time recovery (WAL)           |
| Full DB failure          | 30 min  | 5 min  | Supabase automatic failover            |
| Region outage            | 2 hours | 15 min | Cross-region replica promotion         |
| Accidental data deletion | 1 hour  | 0 min  | Point-in-time recovery to pre-deletion |

### 8.3 Restore Testing

| Test                          | Frequency          | Owner                  |
| ----------------------------- | ------------------ | ---------------------- |
| Single table restore          | Monthly            | Platform Team          |
| Full DB restore to staging    | Quarterly          | Platform Team          |
| Cross-region failover drill   | Bi-annually        | Platform Team + DevOps |
| Backup integrity verification | Weekly (automated) | Automated script       |

---

## 9. Operational Runbooks

### 9.1 Redis Down

```text
Detection: Health check → Redis unhealthy
           Alert: Redis Unavailable (Critical)

Step 1: Circuit breaker activates (automatic)
        → All cache reads fallback to direct DB queries
        → Latency increases (P95: 5ms → 30ms)

Step 2: Auto-reconnect attempts every 10 seconds
        → Log: WARN "Redis reconnection attempt N"

Step 3: If reconnected within 5 minutes:
        → Cache warms up on read (lazy loading)
        → No manual intervention needed

Step 4: If down > 5 minutes:
        → Notify on-call engineer (PagerDuty)
        → Check Redis server/container status
        → Restart Redis if needed
        → Verify cache warm-up

Step 5: Post-incident:
        → Review cause (memory, network, config)
        → Update runbook if new failure mode
```

---

### 9.2 Payment Webhook Failure

```text
Detection: Payment webhook returns non-200
           Alert: Payment Webhook Failure (Critical)

Step 1: Automatic retry (3 attempts, exponential backoff)
        → Retry 1: 30 seconds
        → Retry 2: 2 minutes
        → Retry 3: 10 minutes

Step 2: If all retries fail:
        → Push to Dead Letter Queue (DLQ)
        → Log: ERROR "Payment webhook permanently failed"
        → Alert: PagerDuty

Step 3: Manual investigation:
        → Check DLQ for failed payloads
        → Verify payment gateway status
        → Check webhook signature validation

Step 4: Manual replay:
        → Admin endpoint: POST /admin/webhooks/replay/{id}
        → Replays the exact webhook payload
        → Verify subscription state machine transitions

Step 5: Post-incident:
        → Reconcile subscription states with payment gateway
        → Flag any institutes with mismatched states
```

---

### 9.3 Subscription Cron Failure

```text
Detection: Cron job fails or doesn't run
           Alert: Subscription Cron Failure (Critical)

Step 1: Check cron scheduler health
        → Is the scheduler process running?
        → Is the cron expression correct?

Step 2: Manual trigger:
        → Admin endpoint: POST /admin/jobs/subscription-expiry/run
        → Runs the expiry check immediately

Step 3: Verify results:
        → Check subscriptions with ends_at < now() and status = ACTIVE
        → These should have been expired

Step 4: Reconcile:
        → For each missed expiry:
           → Update subscription status → EXPIRED
           → Update institute status → SUSPENDED
           → Publish SubscriptionExpired event
           → Invalidate caches
```

---

### 9.4 Database Connection Pool Exhaustion

```text
Detection: Connection pool > 85%
           Alert: DB Connection Pool Warning

Step 1: Check for long-running queries:
        → SELECT * FROM pg_stat_activity WHERE state != 'idle'
          AND query_start < now() - interval '30 seconds'

Step 2: If long-running queries found:
        → Identify the query and source
        → Kill if safe: SELECT pg_terminate_backend(pid)

Step 3: If no long-running queries:
        → Check for connection leaks in application
        → Review recent deployments for unclosed connections
        → Increase pool size temporarily if needed

Step 4: If pool > 95% (Critical):
        → Enable connection queueing
        → Reject non-critical requests (return 503)
        → Scale up connection pool
```

---

## 10. Capacity Planning & Alerts

### 10.1 Resource Thresholds

| Resource       | Warning (⚠️)           | Critical (🔴)         | Action                             |
| -------------- | ---------------------- | --------------------- | ---------------------------------- |
| DB Storage     | 70%                    | 85%                   | Archive old data, increase storage |
| DB Connections | 85%                    | 95%                   | Scale pool, investigate leaks      |
| Redis Memory   | 75%                    | 90%                   | Review TTLs, increase memory       |
| Disk Usage     | 80%                    | 90%                   | Clean logs, archive, expand        |
| CPU            | 80% (sustained 10 min) | 95% (sustained 5 min) | Scale horizontally                 |
| RAM            | 80%                    | 90%                   | Optimize queries, scale            |
| Queue Depth    | 1,000                  | 5,000                 | Scale workers, investigate delays  |

### 10.2 Capacity Review Schedule

| Review                      | Frequency | Focus                                   |
| --------------------------- | --------- | --------------------------------------- |
| Storage growth trend        | Monthly   | DB size, log volume, attachment storage |
| Connection pool utilization | Weekly    | Peak vs average, leak detection         |
| Cache efficiency            | Monthly   | Hit rate, eviction rate, memory         |
| Query performance           | Weekly    | Slow query log, index usage stats       |
| Growth projection vs actual | Quarterly | Compare predictions vs reality          |

---

## 11. Feature Flags

### 11.1 Strategy

Feature flags control the rollout of new features and database migrations. They enable safe deployments and instant rollback without code deployments.

### 11.2 Current Feature Flags

| Flag Name                        | Default | Description                        | Phase   |
| -------------------------------- | ------- | ---------------------------------- | ------- |
| `ff_branch_timezone`             | `false` | Enable per-branch timezone support | Phase 2 |
| `ff_academic_calendar_v2`        | `false` | Branch-level academic years        | Phase 4 |
| `ff_subscription_features_jsonb` | `false` | Feature-based licensing (JSONB)    | Phase 3 |
| `ff_holiday_recurrence`          | `false` | Recurring holiday auto-generation  | Phase 4 |
| `ff_franchise_mode`              | `false` | Parent-child institute hierarchy   | Phase 3 |

### 11.3 Flag Lifecycle

```text
Created → Enabled (% rollout) → Fully Enabled → Flag Removed (code cleanup)
```

**Rule:** Feature flags must be cleaned up within 30 days of full rollout. No permanent flags.

---

## 12. Deployment Strategy

### 12.1 Deployment Model

| Environment | Strategy      | Rollback Time               |
| ----------- | ------------- | --------------------------- |
| Staging     | Direct deploy | Instant (redeploy previous) |
| Production  | Blue-Green    | < 2 minutes                 |

### 12.2 Deployment Order

```text
1. Database migration (Prisma migrate)
        ↓
2. Background workers (Bull MQ consumers)
        ↓
3. API servers (NestJS — Blue-Green swap)
        ↓
4. Cache warm-up (optional, lazy load)
        ↓
5. Health check verification
        ↓
6. Traffic switch (Blue → Green)
```

### 12.3 Rollback Plan

| Scenario               | Action                            | Time      |
| ---------------------- | --------------------------------- | --------- |
| API bug (no DB change) | Switch traffic back to Blue       | < 1 min   |
| DB migration issue     | Run rollback migration, then swap | 5-15 min  |
| Data corruption        | Point-in-time recovery            | 15-30 min |

### 12.4 Migration Safety Rules

- Every Prisma migration MUST have a rollback migration
- Migrations must be backward-compatible (old code works with new schema)
- No `DROP COLUMN` in the same release — deprecate first, remove next release
- Large data migrations run as background jobs, not blocking migrations

---

## 13. Incident Response

### 13.1 Severity Levels

| Severity  | Definition            | Response Time     | Example                                 |
| --------- | --------------------- | ----------------- | --------------------------------------- |
| **SEV-1** | Full service outage   | 5 min             | DB down, all APIs failing               |
| **SEV-2** | Major feature broken  | 15 min            | Payments failing, authentication broken |
| **SEV-3** | Minor feature broken  | 1 hour            | Dashboard widget not loading            |
| **SEV-4** | Cosmetic / low impact | Next business day | Typo in notification, minor UI issue    |

### 13.2 Incident Flow

```text
Detection (Alert fires)
        ↓
Acknowledgment (on-call engineer, < 5 min for SEV-1)
        ↓
Investigation (identify root cause)
        ↓
Mitigation (stop the bleeding — rollback, feature flag, etc.)
        ↓
Resolution (fix the root cause)
        ↓
Post-Mortem (blameless, within 48 hours for SEV-1/2)
        ↓
Action Items (preventive measures, runbook updates)
```

---

## 14. Dashboard Templates

### 14.1 Platform Dashboard (Global Operations)

- **Active Institutes**: Total gauge of active tenants.
- **Active Users**: Concurrent user sessions count.
- **API TPS**: Transaction-per-second API throughput trends.
- **DB Connections**: Current vs max connection count.
- **Redis Hit Ratio**: Hit/miss percentage comparison.

### 14.2 Institute Dashboard (Tenant Operations)

- **Students**: Total active student enrollments count.
- **Attendance**: Daily student attendance percentage status.
- **Revenue**: Current monthly billing collection rate.
- **Subscription**: Current plan tier and limits status bar.
- **Branches**: Total configured physical campuses count.

### 14.3 Operations Dashboard (Infrastructure Alerts)

- **Queue Lag**: Bull MQ jobs waiting time trends.
- **Failed Jobs**: Background job failure metrics.
- **Webhooks**: Webhook status delivery trends (Stripe/Razorpay callback metrics).
- **Slow Queries**: Count of slow DB queries exceeding 200ms threshold.
- **Error Rate**: Global application error percentage trends (4xx vs 5xx).

---

_Last updated: July 8, 2026_
