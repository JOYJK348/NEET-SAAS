# Public Content API Specification (13-public-api/public-content.md)

This document defines endpoints for querying public directories.

---

## GET /api/v1/public/courses

### Purpose

Exposes the list of active courses offered by the institute to the public website.

### Permission

None (Public).

### Security Notes

- Authentication Required: No
- Required RBAC Permission: None
- Tenant Isolation: Enforced via `X-Tenant-ID` header.
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Courses retrieved.",
  "data": [
    {
      "courseId": "cne26-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "name": "NEET 2-Year Intensive Program",
      "code": "NEET-2YR-INT",
      "description": "Comprehensive coaching syllabus mapping Physics, Chemistry, and Biology."
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
