# Guardians API Specification (04-student-api/guardians.md)

This document defines endpoints for managing student guardian profiles and relationships mappings.

---

## POST /api/v1/students/{id}/guardians

### Purpose
Creates a guardian profile and links it to the student.

### Permission
`student:guardian:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `student:guardian:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "firstName": "Rajendra",
  "lastName": "Kumar",
  "phone": "9988776655",
  "email": "rajendra@example.com",
  "relationship": "FATHER",
  "isPrimaryContact": true
}
```

### Validation Constraints
*   `relationship`: Required. Must be `FATHER`, `MOTHER`, `GUARDIAN`, or `OTHER`.
*   `phone`: Required. Valid format.

### Business Rules
1.  **Multiple guardians**: Allows multiple guardians per student, but enforces that exactly one guardian must be marked as `isPrimaryContact = true` (enforced via database constraints/partial indices).
2.  **User Portal Link**: If an email is provided, generates a linked user profile and triggers credentials emails for the Parent Portal.

### Database Tables Affected
*   `guardian_profiles` (Insert)
*   `student_guardians` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Guardian profile linked to student successfully.",
  "data": {
    "guardianProfileId": "g09a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
