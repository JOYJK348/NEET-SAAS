# Internal Worker API Contract Specification (15-internal-worker-api)

This document details endpoints designed exclusively for internal background worker services (e.g. pg-boss runner scripts, scheduler daemons, cron loops).

> [!WARNING]
> **Internal-Only Security Boundary**: These endpoints must be blocked at the edge API gateway (Nginx/Kong) and never exposed to the public internet.

---

## 1. Background Jobs Execution Loop

### POST /api/v1/internal/jobs/execute

- **Purpose**: Trigger the worker thread runner to grab the next pending task from the background queue and execute it.
- **Response DTO (200 OK)**:

```json
{
  "success": true,
  "message": "Job runner loop initialized.",
  "data": {
    "jobsProcessed": 1,
    "activeThreadsCount": 3
  }
}
```

---

## 2. Transactional Notification polling

### POST /api/v1/internal/notifications/process

- **Purpose**: Read pending items from `notification_queue`, construct body templates, and dispatch carrier requests.
- **Response DTO (200 OK)**:

```json
{
  "success": true,
  "data": {
    "processedCount": 14,
    "successCount": 12,
    "failedCount": 2
  }
}
```

---

## 3. Cron Scheduler loop Trigger

### POST /api/v1/internal/scheduler/run

- **Purpose**: Invoked by midnight system crontab to check matching active cron configurations and execute snapshots sync.
- **Response DTO (200 OK)**:

```json
{
  "success": true,
  "data": {
    "triggeredJobsCount": 3,
    "executedTimestamps": "2026-07-11T00:00:00Z"
  }
}
```
