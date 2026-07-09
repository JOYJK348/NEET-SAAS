# Admissions API Specification (13-public-api/admissions.md)

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [response-examples.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/response-examples.md) for standard response envelopes.

---

## POST /api/v1/public/admissions

### Purpose
Allows prospects to submit admission applications directly from the institute's public website.

### Permission
None (Public endpoint).

### Security Notes
*   Authentication Required: No
*   Required RBAC Permission: None
*   Tenant Isolation: Enforced via `X-Tenant-ID` header.
*   Branch Isolation: Not Applicable
*   RLS Validation: Direct SQL verification.
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "firstName": "Adithya",
  "lastName": "Kumar",
  "email": "adithya@example.com",
  "phone": "9944112233",
  "dob": "2010-05-15",
  "targetCourseId": "cne26-bf99-4d6a-8d1a-6b4b5e6f7a3f"
}
```

### Validation Constraints
*   `email`: Required. Valid format.
*   `phone`: Required. Valid format.

### Business Rules
*   Validates `X-Tenant-ID` matches an active tenant.
*   Inserts the record into the `admissions` table with status `APPLIED`.

### Database Tables Affected
*   `admissions` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Admission application submitted successfully.",
  "data": {
    "admissionId": "adm89a3-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
