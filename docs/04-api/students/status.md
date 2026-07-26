# Status Lifecycle APIs (04-student-api/status.md)

This document specifies endpoints for managing student profile states.

---

## PATCH /api/v1/students/{id}/suspend

### Purpose

Suspends a student's active status and locks portal access.

### Permission

`student:status:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `student:status:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "reason": "Disciplinary action."
}
```

### Business Rules

- Updates status of the profile to `SUSPENDED` and linked user credentials to lock out the portal session.
- **Token Revocation**: Immediately revokes all active session refresh tokens in Redis.

---

## PATCH /api/v1/students/{id}/withdraw

### Purpose

Processes a student withdrawal (voluntary exit).

### Permission

`student:status:write`

### Request DTO

```json
{
  "withdrawalDate": "2026-07-09",
  "remarks": "Relocating to another state."
}
```

---

## PATCH /api/v1/students/{id}/graduate

### Purpose

Marks a student as graduated / completed course.

### Permission

`student:status:write`
