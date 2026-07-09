# ADR-014: Database Schema Migration, Seeding, and Versioning Strategy

## Status
LOCKED (July 8, 2026)

## Context and Problem Statement
In a multi-tenant coaching ERP platform with a hot database schema, deploying DDL scripts directly without version gates, rollback policies, or validation seeds risks structural regressions, orphaned records, and platform-wide downtime. We need a standardized database change management lifecycle.

## Decision Outcome
We choose a **Git-tracked, Zero-Downtime Migration Policy** using structural migrations, seeding directories, and backward-compatible version gates.

### 1. Versioning & Migration Directory
*   All migrations are version-controlled inside the `/supabase/migrations/` directory using standard epoch timestamps:
    `YYYYMMDDHHMMSS_description.sql`
*   No developer may modify a migration file that has already been merged into the `main` branch. Any schema alteration must create a new forward migration script.

### 2. Zero-Downtime (Backward Compatibility) Rules
To execute DDL edits on production databases without service interruption:
1.  **Additions Only**: Always split modifications into backward-compatible phases. Add new tables or nullable columns first, deploy backend code that writes to both locations, and only run cleanup scripts to drop deprecated fields in a later phase.
2.  **No Default Table Overwrites**: Never drop columns or rename tables directly. Use Postgres views or application translation layers to wrap changes.
3.  **Partial/Delayed Index Creation**: Big tables indexes must be created concurrently (`CREATE INDEX CONCURRENTLY`) to prevent locking the target table against runtime transactional operations.

### 3. Cascade & Foreign Key Rules
All migrations must explicitly designate FKey deletion strategies:
*   `ON DELETE RESTRICT` (Default): Prevent deletion of parent records if child associations exist (used for core operational entities like `institutes`, `branches`, `subjects`).
*   `ON DELETE CASCADE`: Used strictly for local dependent child tables (e.g. `topics` → `chapters`, `submission_attempts` → `assignment_submissions`).
*   `ON DELETE SET NULL`: Used where records are optional (e.g. `timetable_slots` in `live_sessions`).

### 4. Seeding Strategy
Database seed configurations live under `/supabase/seeds/`:
*   `01-system-master.sql`: Master system roles, static resource permissions, default storage providers, and global system metadata configurations.
*   `02-tenant-demo.sql`: Safe staging/development mock profiles, demo students, and diagnostic LMS batch runs.

### 5. Rollback Strategy
Every SQL migration script must contain a mapped rollback comment detailing the undo SQL statements:
```sql
-- Migration Up
ALTER TABLE study_materials ADD COLUMN xmin OID;

-- Migration Down
-- ALTER TABLE study_materials DROP COLUMN xmin;
```
If a deployment fails validation testing:
1.  Initiate backend deployment rollback.
2.  Run the corresponding Down migration scripts concurrently.
3.  Evict cached permissions/tokens in Redis.
