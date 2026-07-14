# Audit Logging Standards

This document establishes the specifications, database schema definitions, and compliance requirements for security and transactional change auditing.

---

## 1. Compliance Requirements (SOC2 / ISO 27001)

To meet enterprise compliance rules, the system must maintain an immutable log of all actions that modify state or configure policies.

### 1.1 Core Audit Attributes

Every audit log must capture the **5 Ws (Who, What, Where, When, Why)**:

- **Who**: The authenticated user identifier (`user_id`, `role_id`).
- **What**: The action identifier (e.g. `materials.approve`) and record ID.
- **Where**: Metadata representing request provenance (IP Address, User-Agent, Device category).
- **When**: Server-time ISO UTC timestamp.
- **Why**: Human-provided justification/remarks (Mandatory for critical transactions like overrides or fee waivers).

---

## 2. Audit Trail Database Schema

Audit events are written to the centralized `audit_logs` table:

```sql
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    user_id UUID NOT NULL,
    user_role_id UUID NOT NULL,
    action_key VARCHAR(100) NOT NULL, -- e.g. 'learning.material.approve'
    entity_type VARCHAR(50) NOT NULL, -- e.g. 'study_materials'
    entity_id UUID NOT NULL,

    -- State change logs
    old_value JSONB,
    new_value JSONB,

    -- Request Provenance Metadata (Where)
    ip_address INET NOT NULL,
    device_category VARCHAR(30) NOT NULL, -- e.g. 'Desktop', 'Mobile', 'Tablet'
    browser VARCHAR(50) NOT NULL,         -- e.g. 'Chrome 125.0', 'Safari 17'
    location VARCHAR(100),                -- Optional geoip lookup (e.g. 'Chennai, IN')

    -- Distributed Trace Mappings
    correlation_id UUID NOT NULL,         -- Matches trace across microservices boundary
    request_id UUID NOT NULL,             -- Unique HTTP Request session ID

    reason TEXT, -- Nullable reason (Mandatory for overrides)
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);
```

---

## 3. Implementation Protocols

### 3.1 Non-Repudiation (Immutability)

- **No Updates/Deletes**: The database user profile assigned to the audit service must only carry `INSERT` privileges on the `audit_logs` table. `UPDATE` or `DELETE` executions must be completely blocked at the engine level.
- **Write-Ahead Logging**: Critical actions must commit their audit logs in the same atomic database transaction boundary as the resource write. If the audit insert fails, the target action rolls back immediately.

### 3.2 Trace Mappings (Correlation & Request IDs)

- Every incoming request must be assigned a `request_id` at the API Gateway.
- If a request spans async workers or microservices queues, a `correlation_id` is passed along headers. Both IDs are written to the log to enable quick distributed debugging.
