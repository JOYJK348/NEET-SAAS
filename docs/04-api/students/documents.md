# Documents API Specification (04-student-api/documents.md)

This document defines endpoints for uploading and verifying student compliance files (Transfer Certificate, Aadhaar, marksheets) using the centralized `entity_documents` schema.

---

## POST /api/v1/students/{id}/documents

### Purpose

Registers a compliance document for a student profile (linked to a centralized storage upload version).

### Permission

`student:document:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `student:document:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "documentCategory": "IDENTITY",
  "documentType": "AADHAAR",
  "fileVersionId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
  "expiresAt": "2036-07-09T00:00:00.000Z"
}
```

### Business Rules

1.  **Central Link**: References the centralized file storage via `fileVersionId` mapping to `file_versions.id`.
2.  **Uniqueness**: Employs partial unique index constraints (`uq_active_identity_document`) allowing only one active document per owner (e.g. only one active Aadhaar or PAN).
3.  **Audit Versioning**: Inserts history metadata traces into `entity_document_versions`.

### Database Tables Affected

- `entity_documents` (Insert)
- `entity_document_versions` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Student document registered successfully.",
  "data": {
    "documentId": "d09a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
