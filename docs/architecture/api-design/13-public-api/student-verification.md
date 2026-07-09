# Student Verification API Specification (13-public-api/student-verification.md)

This document defines endpoints for verifying student certificates and tickets.

---

## GET /api/v1/public/verify-student/{rollNumber}

### Purpose
Allows third parties to verify a student's active enrollment and credentials.

### Permission
None (Public).

### Security Notes
*   Authentication Required: No
*   Required RBAC Permission: None
*   Tenant Isolation: Enforced via `X-Tenant-ID` header.
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: Yes (redacts addresses, GPA details, and phone numbers).

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Student enrollment verified.",
  "data": {
    "name": "Adithya Kumar",
    "rollNumber": "PH-2026-0089",
    "status": "ACTIVE",
    "courseName": "Two Year NEET Preparation Program"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
