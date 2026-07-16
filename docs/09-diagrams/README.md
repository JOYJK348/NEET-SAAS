# 09 System Architecture Diagrams 🗺️

Welcome to the **System Architecture Diagrams** index. Here we organize Mermaid layouts mapping container boundaries and logical relationships.

## Active Diagrams

### 1. Multi-Tenant Request Isolation

```mermaid
sequence diagram
  autonumber
  actor User as Tenant User
  participant API as NestJS API Gateway
  participant ALS as AsyncLocalStorage Context
  participant RLS as PostgreSQL Row Level Security (RLS)

  User->>API: HTTP Request with Tenant ID header / Cookie
  API->>ALS: Store Tenant ID context (AsyncLocalStorage)
  API->>RLS: Set transaction tenant context (SET LOCAL app.current_tenant_id)
  RLS->>RLS: Enforce database level tenant locks
```

---

[⬅️ Back to Main Documentation Index](../README.md)
