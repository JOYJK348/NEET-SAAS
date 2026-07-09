# Study Materials API Specification (07-lms-api/materials.md)

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [response-examples.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/response-examples.md) for standard response envelopes.

---

## POST /api/v1/study-materials

### Purpose
Publishes new study material (PDFs, notes) for a topic.

### Permission
`lms:material:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `lms:material:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "subjectId": "sub02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "chapterId": "ch02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "topicId": "top02b-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "title": "Organic Chemistry Revision Notes",
  "fileVersionId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
  "targetBatchIds": [
    "b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  ]
}
```

### Validation Constraints
*   `title`: Required. Max 255 characters.
*   `fileVersionId`: Required. Valid storage file identifier.

### Business Rules
1.  **File Link**: Links document upload to central storage `fileVersionId` reference.
2.  **Target Mappings**: Links availability to target batches in `study_material_batches` table.

### Database Tables Affected
*   `study_materials` (Insert)
*   `study_material_batches` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Study material published successfully.",
  "data": {
    "materialId": "mat092a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
