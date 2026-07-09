# ADR-017: Postgres ENUM Lookup Master Evolution Plan

## Status
LOCKED (July 8, 2026)

## Context and Problem Statement
Postgres ENUM types are convenient but present operational challenges: altering an ENUM type (e.g. adding a value) acquires an exclusive lock on the table, blocking transaction writes. As we scale, lookup tables are more flexible.

## Decision Outcome
We implement the following **ENUM Lookup Transition Path**:

### 1. MVP Scope
For the initial release, native Postgres ENUMs are used for low-frequency status fields (e.g., `PublishStatus`, `VerificationStatus`).

### 2. High-Frequency / Extensible Fields
Dynamic lookup-master tables are used for entities that tenants may customize:
*   `departments` (in `02-user.md`): Stores custom tenant streams instead of enums.
*   `tags` (in `06-assessment.md`): Replaces hardcoded enums with dynamic taxonomy indexes.

### 3. Transition Plan
When migrating a native ENUM to a Lookup Table:
1.  Create the lookup master table (`status_master`) and populate it with initial enum values.
2.  Add a nullable foreign key column referencing `status_master.id`.
3.  Deploy application code that writes to *both* the ENUM column and the new FKey column.
4.  Backfill old records, apply the `NOT NULL` constraint to the FKey, and drop the ENUM column in off-peak maintenance hours.
