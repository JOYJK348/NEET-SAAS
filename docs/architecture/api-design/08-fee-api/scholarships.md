# Scholarships API Specification (08-fee-api/scholarships.md)

This document defines endpoints for managing merit scholarships.

---

## POST /api/v1/students/{id}/scholarships

### Purpose
Grants a scholarship reduction allocation to a student.

### Permission
`fee:scholarship:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `fee:scholarship:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "scholarshipName": "NEET Meritorious Scholarship",
  "reductionPercentage": 25.00,
  "remarks": "Scored >95% in Admission test."
}
```

### Business Rules
*   Applies a percentage deduction to the student's next invoice generation flow checks.

### Database Tables Affected
*   `student_scholarships` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Scholarship assigned to student successfully.",
  "data": {
    "studentScholarshipId": "sch092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
