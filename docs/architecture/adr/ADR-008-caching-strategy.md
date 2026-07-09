# ADR-008: Caching Strategy

## Context and Problem Statement

Authentication checks, permission lists, and dashboard widget lookups must resolve in under 5ms (SLA). Direct relational queries on PostgreSQL fail this budget under load.

## Decision Outcome

Chosen Option: **Distributed Redis Caching with Write-Invalidation**.

### Rules

1. High-frequency queries (session tokens, RBAC permissions, active dashboard KPIs) are cached in Redis.
2. Invalidation: Write transactions explicitly evict the target key (e.g. `user:permissions:123`) from Redis on update.
3. Fallback: If Redis goes offline, database queries fallback directly to PostgreSQL indexing.
