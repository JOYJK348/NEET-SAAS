# Qualifications API Specification (03-user-api/qualifications.md)

This document defines endpoints for managing staff degrees and educational credentials.

---

## POST /api/v1/staff/{id}/qualifications

### Purpose
Registers a new academic qualification credential for a staff member.

### Permission
`staff:qualification:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `staff:qualification:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "degreeName": "M.Sc. in Physics",
  "institution": "University of Madras",
  "yearOfPassing": 2018,
  "fileVersionId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
}
```

### Validation Constraints
*   `degreeName`: Required.
*   `yearOfPassing`: Required. Must be a valid year in the past.
*   `fileVersionId`: Required. Valid central file identifier.

### Business Rules
1.  **File Link**: Links document upload verification file through `fileVersionId` referencing `file_versions.id` centrally.
2.  **Verification Status**: Automatically registers the qualification in an `UNVERIFIED` state.

### Database Tables Affected
*   `staff_qualifications` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Qualification registered successfully.",
  "data": {
    "qualificationId": "q02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## PATCH /api/v1/staff/{id}/qualifications/{qualId}/verify

### Purpose
Approves or rejects a staff member's qualification credentials.

### Permission
`staff:qualification:verify`

### Request DTO
```json
{
  "status": "VERIFIED",
  "remarks": "Certificates verified against Madras University database."
}
```

### Validation Constraints
*   `status`: Required. Must be `VERIFIED` or `REJECTED`.

### Business Rules
*   Updates the qualification record in `staff_qualifications`, stamping the validator staff ID context (`verified_by_staff_id`) and timestamp.
