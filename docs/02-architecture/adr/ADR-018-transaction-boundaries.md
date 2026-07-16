# ADR-018: Database Transaction Boundary and Eventual Consistency Strategy

## Status

LOCKED (July 8, 2026)

## Context and Problem Statement

In a multi-tenant coaching ERP/LMS system, complex operations (such as student admissions, batch transfers, and assignment evaluations) often touch multiple database domains. Wrapping these long-running operations in a single database transaction blocks connection pools, risks deadlocks, and degrades performance. We need a clear partition of synchronous database transactions versus asynchronous background events.

## Decision Outcome

We choose a **Hybrid Transactional Model**: Synchronous ACID transactions are kept small and local. All secondary side-effects (notifications, aggregate recalculations, auditing updates) are decoupled using transactional background queues or eventual consistency handlers.

### 1. Synchronous ACID Boundary Rules

A database transaction is strictly limited to operations that _must_ fail together. No HTTP requests, external network calls (such as storage uploads or SSO redirects), or heavy loops may occur inside an open transaction blocks.

- **Admissions Boundary**: Creating a user credentials profile and student profile must occur inside a single synchronous transaction. Mapping fee plans or trigger notifications must be decoupled.
- **Assignment Submissions Boundary**: Saving a student response and updating attempts count occurs in a synchronous block. Plagiarism checks and dashboard calculations are decoupled.

### 2. Transactional Queue Pattern (Outbox Pattern)

To ensure reliable event dispatching without distributed transactions (Sagas):

1.  During a database write, the application inserts an event payload into the `background_jobs` or `notification_queue` tables within the _same_ synchronous database transaction block.
2.  An async worker polls these tables, executing the secondary tasks (e.g., sending SMS alerts, updating `lms_student_aggregations`).
3.  If the async task fails, it retries up to 3 times (configured in `max_retries`) before moving to DLQ (Dead Letter Queue), keeping the core transaction unaffected.

### 3. Eventual Consistency Staleness SLAs

- **Dashboard Ranks & Analytics**: Sync latency must be under 5 minutes.
- **Audit logs**: Sync latency must be near real-time (under 5 seconds).
- **Notifications**: Dispatched within 30 seconds of trigger.
