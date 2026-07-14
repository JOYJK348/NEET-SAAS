# ADR-015: Concurrency, Idempotency, and Race Condition Mitigation Strategy

## Status

LOCKED (July 8, 2026)

## Context and Problem Statement

In a high-concurrency educational ERP/LMS, multiple actors can trigger identical operations simultaneously. For example: a student double-clicks a payment or assignment submission button, or two admins edit the same batch allocation record. Without idempotency and concurrency guards, this causes duplicate records, inconsistent balances, and race conditions.

## Decision Outcome

We implement an **Idempotency Key & Optimistic Locking Strategy**:

### 1. API Idempotency Keys (Post/Put Actions)

- All state-changing endpoints (such as payments, submissions, and onboarding creation) accept a unique HTTP header: `Idempotency-Key` (UUID).
- The API gateway stores this key in Redis with a TTL of 2 hours. If a duplicate key arrives, the gateway returns the cached response directly without hitting database write pipelines.

### 2. Optimistic Concurrency Control (OCC)

- For critical mutable tables (`study_materials`, `assignments`, `staff_profiles`), we use PostgreSQL's native `xmin` system column.
- The `xmin` changes automatically on every row update. When the client executes an update, it must supply the fetched `xmin` value (mapped as an `ETag` in HTTP headers).
- The query executes: `UPDATE ... WHERE id = :id AND xmin = :etag`. If zero rows are affected, it returns an HTTP `412 Precondition Failed` error, preventing dirty writes.
