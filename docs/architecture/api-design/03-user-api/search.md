# Staff Search API Specification (03-user-api/search.md)

This document defines advanced query filters and indexing strategies for staff searches.

---

## GET /api/v1/staff/search

### Purpose
Exposes a criteria-based search query API to retrieve active staff list records.

### Permission
`staff:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `staff:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Enforced (if user is mapped to specific branch)
*   RLS Validation: Enforced
*   Sensitive Fields Masked: Yes (salary details hidden from non-admin roles).

### Request Parameters
*   `filter[departmentId]`: UUID (Filter by department).
*   `filter[branchId]`: UUID (Filter by branch).
*   `filter[status]`: String (`ACTIVE`, `SUSPENDED`, `TERMINATED`).
*   `search`: String (Fuzzy search matching name, phone, or staff number).
*   `page`: Positive Integer.
*   `limit`: Integer.

### Business Rules
1.  **Scope Constraints**: Branch managers can only search staff members mapped to their active branches.
2.  **Salary masking**: The response payload body omits compensation details unless the active JWT role matches `TENANT_ADMIN` or `HR_MANAGER`.

### Database Tables Affected
*   `staff_profiles` (Select)
*   `staff_employment` (Select)

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Staff search executed successfully.",
  "data": [
    {
      "staffProfileId": "s89a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "staffNumber": "STAFF-2026-0089",
      "name": "Dr. Ramesh Krishnan",
      "email": "lecturer@eliteneet.com",
      "phone": "9876543210",
      "status": "ACTIVE",
      "department": {
        "id": "d02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
        "name": "NEET Physics"
      },
      "designation": "Senior Physics Lecturer",
      "joiningDate": "2026-07-09"
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
