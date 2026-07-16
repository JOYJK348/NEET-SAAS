# Status Lifecycle APIs (03-user-api/status.md)

This document specifies discrete lifecycle endpoints for managing employee profile states.

---

## PATCH /api/v1/staff/{id}/activate

### Purpose

Re-activates a suspended staff profile, unlocking user credentials.

### Permission

`staff:status:write`

### Request DTO

None.

### Business Rules

- Updates status of the staff profile to `ACTIVE`.
- Updates linked `users.status` to `ACTIVE` in auth registry.

---

## PATCH /api/v1/staff/{id}/suspend

### Purpose

Suspends a staff member's profile and locks access.

### Permission

`staff:status:write`

### Request DTO

```json
{
  "reason": "Security investigation"
}
```

### Business Rules

- Updates status of the profile to `SUSPENDED`.
- Locks linked user credentials.
- **Token Revocation**: Immediately revokes all active session refresh tokens in Redis and PostgreSQL.

---

## PATCH /api/v1/staff/{id}/archive

### Purpose

Archives (soft-deletes) a terminated staff profile.

### Permission

`staff:status:write`

### Business Rules

- Requires the profile status to be `TERMINATED`.
- Sets the profile status to `ARCHIVED`.
- Appends standard soft-delete fields (`deleted_at`, `deleted_by`).
