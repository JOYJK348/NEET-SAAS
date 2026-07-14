# Audit API Specification (04-student-api/audit.md)

This document defines query contracts for pulling compliance audit trails and session logs for student profiles.

---

## GET /api/v1/students/{id}/audit

### Purpose

Retrieves action audit trails for the student.

### Permission

`student:audit:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `student:audit:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: Yes (hides old/new values of passwords).

### Request Parameters

- `cursor`: String (Cursor offset for paging).
- `limit`: Integer.

### Response DTO

```json
{
  "success": true,
  "data": [
    {
      "logId": "l89a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "entityType": "student_profiles",
      "action": "UPDATE",
      "ipAddress": "192.168.1.1",
      "createdAt": "2026-07-09T01:20:00.000Z"
    }
  ],
  "meta": {
    "pagination": {
      "pageSize": 50,
      "nextCursor": "eyJjcmVhdGVkX2F0IjoiMjAyNi0wNy0wOVQyMjozMDowMC4wMDBaIiwiaWQiOiJmNzhhMmUx..."
    },
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## GET /api/v1/students/{id}/login-history

### Purpose

Retrieves login histories logs for the student account.

### Permission

`student:audit:read`
