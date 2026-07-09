# Academic Profile API Specification (04-student-api/academic-profile.md)

This document defines query endpoints for retrieving student academic details.

---

## GET /api/v1/students/{id}/academic-profile

### Purpose
Retrieves a summary of the student's active courses, batches, roll numbers, and historical progress aggregates.

### Permission
`student:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `student:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Academic profile details retrieved.",
  "data": {
    "studentProfileId": "s71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "admissionNumber": "NEET-2026-8899",
    "rollNumber": "PH-2026-0089",
    "currentBatch": {
      "id": "b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "name": "NEET Physics Batch A"
    },
    "enrolledCourses": [
      {
        "courseId": "cne26-bf99-4d6a-8d1a-6b4b5e6f7a3f",
        "courseName": "Two Year NEET Preparation Program"
      }
    ]
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
