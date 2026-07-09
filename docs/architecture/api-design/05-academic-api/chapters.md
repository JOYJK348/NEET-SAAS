# Chapters API Specification (05-academic-api/chapters.md)

This document defines endpoints for managing chapter sequences inside subjects.

---

## POST /api/v1/chapters

### Purpose
Registers a chapter within a subject.

### Permission
`chapter:create`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `chapter:create`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "subjectId": "sub02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "name": "Hydrocarbons",
  "orderIndex": 1
}
```

### Business Rules
*   Ensures `orderIndex` is unique per subject context to preserve logical teaching order structure.

### Database Tables Affected
*   `chapters` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Chapter registered successfully.",
  "data": {
    "chapterId": "ch02a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
