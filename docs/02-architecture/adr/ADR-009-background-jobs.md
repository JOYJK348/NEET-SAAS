# ADR-009: Background Jobs Strategy

## Context and Problem Statement

Heavy operational tasks (notification dispatches, overdue reminders, exam leaderboard calculations) degrade core API response speeds if executed synchronously.

## Decision Outcome

Chosen Option: **Decoupled Background Processing (BullMQ & Redis)**.

### Rules

1. API endpoints schedule async tasks by pushing payload objects to BullMQ queues.
2. Background workers run as isolated processes to pick up and process tasks.
3. Every job lifecycle step is tracked in `background_jobs` and `background_job_logs` tables.
