# Topics API Specification (05-academic-api/topics.md)

This document defines endpoints for managing syllabus topics and prerequisite mappings.

---

## POST /api/v1/topics

### Purpose
Registers a specific teaching topic within a chapter.

### Permission
`topic:create`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `topic:create`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "chapterId": "ch02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "name": "Alkanes Nomenclature & Properties",
  "estimatedHours": 4,
  "orderIndex": 1,
  "prerequisiteTopicIds": [
    "top01a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  ]
}
```

### Validation Constraints
*   `estimatedHours`: Required. Positive decimal value.
*   `orderIndex`: Required.

### Business Rules
1.  **Acyclic Validation**: Verifies that prerequisite topics do not form circular dependencies (acyclic check performed in business layer).
2.  **Prerequisites Link**: Inserts prerequisite records into `topic_prerequisites` table mapping dependencies.

### Database Tables Affected
*   `topics` (Insert)
*   `topic_prerequisites` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Topic registered with prerequisites successfully.",
  "data": {
    "topicId": "top02b-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
