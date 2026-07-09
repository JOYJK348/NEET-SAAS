# Student Search API Specification (04-student-api/search.md)

This document defines advanced query filters and indexing strategies for student searches.

---

## GET /api/v1/students/search

### Purpose
Exposes a criteria-based search query API to retrieve active student records.

### Permission
`student:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `student:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced
*   RLS Validation: Enforced
*   Sensitive Fields Masked: Yes (demographics details hidden from non-admin roles).

### Request Parameters
*   `filter[batchId]`: UUID (Filter by batch).
*   `filter[status]`: String (`ACTIVE`, `SUSPENDED`, `WITHDRAWN`, `COMPLETED`).
*   `search`: String (Fuzzy search matching name, phone, admission or roll number).
*   `page`: Positive Integer.
*   `limit`: Integer.

### Business Rules
*   Branch managers can only search student profiles enrolled inside their active branch contexts.

### Database Tables Affected
*   `student_profiles` (Select)
*   `batch_enrollments` (Select)

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Student search executed successfully.",
  "data": [
    {
      "studentProfileId": "s71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "admissionNumber": "NEET-2026-8899",
      "rollNumber": "PH-2026-0089",
      "name": "Adithya Kumar",
      "email": "adithya@example.com",
      "phone": "9944112233",
      "status": "ACTIVE",
      "batch": {
        "id": "b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
        "name": "NEET Physics Batch A"
      }
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "pageSize": 25,
      "totalPages": 1,
      "totalRecords": 1
    },
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
