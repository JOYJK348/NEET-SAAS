# ADR-004: Historic Snapshot Strategy

## Context and Problem Statement

Master records (Student names, batch names, course titles) can be renamed. If reports or certificates query live relational fields, historical receipts, and diplomas render incorrect names.

## Decision Outcome

Chosen Option: **Transactional Field Snapshotting**.

### Rules

1. Tables tracking static outcomes (e.g. `fee_receipts`, `student_assessment_attempts`, `lead_conversions`) store snapshots of variable metadata (e.g. `student_name_snapshot`, `batch_name_snapshot`) at runtime.
2. These fields are written once and never updated, ensuring historical reports are reproducible forever.
