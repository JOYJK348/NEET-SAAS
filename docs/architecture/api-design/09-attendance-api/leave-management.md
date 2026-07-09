# Leave Management API Specification (09-attendance-api/leave-management.md)

This document defines endpoints for executing employee and student leave requests.

---

## POST /api/v1/leaves

### Purpose
Submits a new leave request (e.g. sick leave, casual leave).

### Permission
`leave:submit`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `leave:submit`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "startDate": "2026-07-15",
  "endDate": "2026-07-16",
  "type": "SICK_LEAVE",
  "reason": "Severe fever.",
  "medicalCertificateId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
}
```

### Business Rules
1.  **Dates validation**: Start date must be chronologically prior or equal to end date.
2.  **Pending review status**: Saves the record inside `leaves` table with status `PENDING`.

### Database Tables Affected
*   `leaves` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Leave request submitted successfully.",
  "data": {
    "leaveId": "lv092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## PATCH /api/v1/leaves/{id}/approve

### Purpose
Approves or rejects a pending leave request.

### Permission
`leave:approve`

### Request DTO
```json
{
  "status": "APPROVED",
  "remarks": "Leave approved."
}
```
