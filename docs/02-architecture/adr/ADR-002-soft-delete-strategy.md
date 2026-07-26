# ADR-002: Soft-Delete vs. Immutable Ledger Strategy

## Context and Problem Statement

coaching ERPs require tracking student enrollment statuses, payments, and audits. Standard CRUD operations that perform physical `DELETE` queries violate audit compliance, damage historical reporting, and corrupt billing history logs.

## Decision Outcome

Chosen Option: **Hybrid Soft-Delete and Immutable Ledger Strategy**.

### Rules

1. **Tuition Ledger Tables (Transactions, Receipts, Invoices)**: Strictly INSERT-only (immutable). Physical edits or deletes are blocked. Corrective entries require a separate reversing transaction.
2. **Master Data Tables (Users, Students, Courses)**: Soft-deleted by shifting status enums (e.g. `UserStatus.ARCHIVED` or `StudentStatus.DROPPED_OUT`) and logging `archived_at` / `archived_by` values.
3. **Transient Tables (Holidays, Queue)**: Hard deletes allowed where no structural records depend on them.
