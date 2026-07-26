# ADR-001: Multi-Tenancy Architecture Selection

## Context and Problem Statement

The platform is designed as a software-as-a-service (SaaS) Coaching Management Platform (CMP). It must securely host multiple independent institutes (tenants), each containing multiple branches. Tenants require strong isolation, compliance boundaries, and customized configurations while maintaining low operational overhead and cost-efficiency.

## Decision Drivers

- **Security Isolation**: Cross-tenant data leaks are unacceptable.
- **Resource Overhead**: Creating separate database instances per tenant increases cost and complexity.
- **Performance Scaling**: Support up to 10,000+ tenants without resource exhaustion.
- **Schema Management**: Migrations must apply uniformly across all tenant spaces.

## Considered Options

1. **Database-Per-Tenant**: Separate physical databases per tenant.
2. **Schema-Per-Tenant**: Separate PostgreSQL schemas inside a single database.
3. **Shared Database, Shared Schema (Tenant ID Column)**: Single database, single schema, with a partition/filter key (e.g. `institute_id`) on all tenant tables.

## Decision Outcome

Chosen Option: **Option 3 (Shared Database, Shared Schema with Tenant ID)**.

### Consequences

- **Isolation Enforcement**: Implemented at the database layer using PostgreSQL Row-Level Security (RLS) policies scoped to the tenant (`institute_id`) resolved from Supabase JWT auth claims.
- **Migration Simplicity**: All database updates apply instantly to all tenants via a single migration run.
- **Performance**: High indexing accuracy (e.g. composite B-tree indices including `institute_id`) prevents scan leaks.
