# Employment Lifecycle APIs (03-user-api/employment.md)

This document specifies the core state-transition endpoints for employee lifecycle management.

---

## POST /api/v1/staff/{id}/join

### Purpose

Executes the joining process for a pending staff profile, creating active job assignments.

### Permission

`staff:employment:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `staff:employment:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "branchId": "b12a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "departmentId": "d02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "designationId": "des02a3-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "joiningDate": "2026-07-09",
  "probationPeriodDays": 90
}
```

### Validation Constraints

- `branchId`: Required.
- `departmentId`: Required.
- `joiningDate`: Required. ISO Date.

### Business Rules

1.  **State check**: The staff profile status must be `PENDING`.
2.  **Activate Status**: Updates the `staff_profiles.status` to `ACTIVE`.
3.  **Active Record Creation**: Inserts the initial active row into the `staff_employment` table.

### Database Tables Affected

- `staff_profiles` (Update)
- `staff_employment` (Insert)

### Response DTO

```json
{
  "success": true,
  "message": "Staff member marked as active employee.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## POST /api/v1/staff/{id}/confirm

### Purpose

Confirms employment, ending the probation period.

### Permission

`staff:employment:write`

### Request DTO

None.

### Business Rules

- Verifies that the target employee profile is in the `ACTIVE` status.
- Sets the probation status on the employment record to `CONFIRMED`.

---

## POST /api/v1/staff/{id}/terminate

### Purpose

Terminates employment (sets end dates and invalidates credentials).

### Permission

`staff:employment:write`

### Request DTO

```json
{
  "terminationDate": "2026-07-09",
  "remarks": "Notice period completed."
}
```

### Business Rules

1.  **Date Validation**: The `terminationDate` must be equal to or later than the joining date.
2.  **Deactivate Profile**: Sets the profile status to `TERMINATED`.
3.  **Credential Revocation**: Automatically invalidates the user's active session refresh tokens in Redis and PostgreSQL.

### Database Tables Affected

- `staff_profiles` (Update)
- `staff_employment` (Update)
- `refresh_tokens` (Update)

---

## GET /api/v1/staff/{id}/timeline

### Purpose

Retrieves a chronological audit timeline of the employee's workforce milestones.

### Permission

`staff:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `staff:read`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO

```json
{
  "success": true,
  "message": "Staff employment timeline retrieved.",
  "data": [
    {
      "event": "CREATED",
      "timestamp": "2026-07-09T01:00:00.000Z",
      "title": "Profile Registered",
      "description": "Onboarding initialized as PENDING profile.",
      "actorName": "HR Admin"
    },
    {
      "event": "JOINED",
      "timestamp": "2026-07-09T03:00:00.000Z",
      "title": "Employee Joined",
      "description": "Marked ACTIVE in NEET Physics department.",
      "actorName": "HR Admin"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
