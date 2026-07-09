# Public Search API Specification (13-public-api/search.md)

This document defines filters for querying public course directories.

---

## GET /api/v1/public/courses/search

### Purpose
Filters the list of public courses.

### Permission
None (Public).

### Request Parameters
*   `search`: String (Fuzzy search matching course name).
*   `page`: Positive Integer.
*   `limit`: Integer.

### Response DTO (200 OK)
```json
{
  "success": true,
  "message": "Courses search completed.",
  "data": [
    {
      "courseId": "cne26-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "name": "NEET 2-Year Intensive Program",
      "description": "Comprehensive coaching syllabus mapping Physics, Chemistry, and Biology."
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
