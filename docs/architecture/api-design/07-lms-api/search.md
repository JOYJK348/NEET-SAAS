# LMS Search API Specification (07-lms-api/search.md)

This document defines filters for querying study materials and courses.

---

## GET /api/v1/study-materials/search

### Purpose

Exposes a criteria-based search query API to filter published materials.

### Permission

`lms:material:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `lms:material:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request Parameters

- `filter[subjectId]`: UUID.
- `filter[chapterId]`: UUID.
- `filter[topicId]`: UUID.
- `search`: String (Fuzzy search matching title).
- `page`: Positive Integer.
- `limit`: Integer.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Materials search executed successfully.",
  "data": [
    {
      "materialId": "mat092a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "title": "Organic Chemistry Revision Notes",
      "fileUrl": "https://storage.eliteneet.com/files/v1/notes.pdf"
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
