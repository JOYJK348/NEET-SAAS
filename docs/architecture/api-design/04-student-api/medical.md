# Medical Profiles API Specification (04-student-api/medical.md)

This document defines endpoints for managing student health and medical profiles.

---

## POST /api/v1/students/{id}/medical

### Purpose

Registers or updates student medical alert records.

### Permission

`student:medical:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `student:medical:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "bloodGroup": "O+",
  "allergies": "Peanut allergy, Penicillin sensitive.",
  "medicalNotes": "Carries inhaler for asthma.",
  "specialNeeds": true,
  "disabilityDetails": "Mild visual impairment, requests front-row seating."
}
```

### Business Rules

- Acts as a 1:1 metadata profile details page for the student.
- Enforces secure access policies (restricted strictly to branch managers, health officers, and class instructors).

### Database Tables Affected

- `student_medical_profiles` (Insert / Update)

### Response DTO

```json
{
  "success": true,
  "message": "Student medical profile updated successfully.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
