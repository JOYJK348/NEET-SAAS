# Webhooks API Specification (13-public-api/webhooks.md)

This document defines endpoints for incoming external webhook calls.

---

## POST /api/v1/public/webhooks/incoming/{provider}

### Purpose
Inbound endpoint to receive webhook event data from third-party systems.

### Permission
None (Public endpoint authenticated via provider signatures).

### Security Notes
*   Authentication Required: No
*   Required RBAC Permission: None
*   Tenant Isolation: Not Applicable (Resolved from payload body contents).
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced on internal databases updates.
*   Sensitive Fields Masked: No.

### Request DTO
Raw payload format defined by external provider.

### Business Rules
1.  **Provider Verification**: Verifies incoming payload signatures using keys saved inside configurations database records.
2.  **Job Queuing**: Adds payload processing to outbox execution queue (returns `200 OK` status immediately to caller).
