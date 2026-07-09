# ADR-005: Table Partitioning Strategy

## Context and Problem Statement

High-volume tables (`attendance_records` ~225M, `audit_logs` ~250M, `student_learning_history` ~500M telemetry rows, `login_histories` ~3M rows) degrade in indexing scan performance over a 3-year timeline.

## Decision Outcome

Chosen Option: **PostgreSQL Declarative Range Partitioning by Month**.

### Rules

1. Partition key: `created_at` (TIMESTAMPTZ) / `check_in_at` (TIMESTAMPTZ).
2. Tables configured for Range Partitioning:
   * `audit_logs` (System Domain)
   * `login_histories` (User Domain)
   * `student_learning_history` (LMS Domain)
   * `attendance_records` (Attendance Domain)
3. Scheduler crons automatically create next month's partition tables off-peak.
4. Retention policy defines archiving partitions to cold cloud storage (e.g. CF R2) after 1 year.
