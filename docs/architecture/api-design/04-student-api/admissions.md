# Admissions API Specification (04-student-api/admissions.md)

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [response-examples.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/response-examples.md) for standard response envelopes.

---

## POST /api/v1/admissions

### Purpose
Submits a new student admission application.

### Permission
None (Public / Counselor access).

### Security Notes
*   Authentication Required: No (Public application form).
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
  "targetAcademicYearId": "ay26-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "targetCourseId": "cne26-bf99-4d6a-8d1a-6b4b5e6f7a3f"
}
```

### Validation Constraints
*   `firstName`: Required. Max 100 characters.
*   `email`: Required. Valid format.
*   `dob`: Required. `YYYY-MM-DD` format. Must verify student age matches minimum target limits (e.g. minimum 14 years old for NEET coaching registration).

### Business Rules
1.  **Duplicate check**: Checks if email or phone is already registered as an active student profile.
2.  **Pending state**: Saves application record to the `admissions` table with status `APPLIED`.

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

---

## PATCH /api/v1/admissions/{id}/approve

### Purpose
Approves an application and generates the student enrollment token.

### Permission
`admission:approve`

### Request DTO
```json
{
  "remarks": "Counselling review passed. Fees mapped."
}
```

### Business Rules
1.  **State check**: The application must be in `APPLIED` state.
2.  **State Transition**: Updates `admissions.status` to `APPROVED`.
3.  **Outbox Trigger**: Emits `AdmissionApproved` event to trigger invoice generation in billing/fees domain.

### Database Tables Affected
*   `admissions` (Update)

---

## PATCH /api/v1/admissions/{id}/reject

### Purpose
Rejects the admission application.

### Permission
`admission:approve`

### Request DTO
```json
{
  "rejectionReason": "Documents mismatch during verification checks."
}
```
