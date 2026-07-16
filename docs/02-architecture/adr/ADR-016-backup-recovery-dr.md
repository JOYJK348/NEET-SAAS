# ADR-016: Backup, Recovery, and Disaster Recovery Strategy

## Status

LOCKED (July 8, 2026)

## Context and Problem Statement

Database corruption, server failures, or accidental deletion of tenant storage elements can halt operations. We need a disaster recovery strategy defining RPO and RTO bounds.

## Decision Outcome

We implement a **Multi-Region Disaster Recovery Plan**:

- **RPO (Recovery Point Objective)**: 1 Minute.
- **RTO (Recovery Time Objective)**: 15 Minutes.

### 1. Database Backup & PITR Schedule

- **Continuous Archiving**: Write Ahead Logs (WAL) are pushed to Cloudflare R2 every minute.
- **Point-in-Time Recovery (PITR)**: Enables rolling back database state to any specific second in the past 14 days.
- **Daily Snapshots**: Automated full backups are executed daily at 02:00 UTC and replicated across regions.

### 2. Disaster Recovery Simulation

Every 6 months, the Platform Team must execute a simulated disaster recovery run:

1.  **Staging Database Destruction**: Spin down active Supabase staging instance.
2.  **Point-In-Time Restore**: Restore WAL archive to a secondary cluster.
3.  **Integrity Validation**: Validate foreign keys, user tenant mappings, and check constraint integrity.
