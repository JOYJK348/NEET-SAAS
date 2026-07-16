# ADR-007: Object Storage Strategy

## Context and Problem Statement

coaching ERP files (OMR sheets, receipts, documents) need tracking without bloat in transactional database tables.

## Decision Outcome

Chosen Option: **Decoupled Object Storage with Metadata Registry**.

### Rules

1. Binary files are stored in external cloud buckets (e.g. Supabase Storage / S3).
2. The database maintains a lightweight metadata record in `files` and `file_versions` tables, tracking size, mime-types, and SHA-256 integrity checksums.
