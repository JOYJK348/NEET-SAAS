# Documents API Specification (03-user-api/documents.md)

This document defines endpoints for uploading and verifying HR onboarding compliance documents (Aadhaar, Resume, Offer Letter) using the centralized `entity_documents` schema.

---

## POST /api/v1/staff/{id}/documents

### Purpose
Registers a compliance document for a staff profile (linked to a centralized storage upload version).

### Permission
`staff:document:write`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `staff:document:write`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Request DTO
```json
{
  "documentCategory": "IDENTITY",
  "documentType": "AADHAAR",
  "fileVersionId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
  "expiresAt": "2036-07-09T00:00:00.000Z"
}
```

### Validation Constraints
*   `documentCategory`: Required. Must be `IDENTITY`, `ACADEMIC`, `EMPLOYMENT`, `LEGAL`, or `FINANCIAL`.
*   `documentType`: Required. Must be `AADHAAR`, `PAN`, `RESUME`, `DEGREE`, or `OFFER_LETTER`.
*   `fileVersionId`: Required. Valid central file version identifier.

### Business Rules
1.  **Partial uniqueness check**: Ensures exactly one active identity document per owner (e.g. only one active Aadhaar or PAN). Handled by DB partial index:
    `uq_active_identity_document`.
2.  **Version tracking**: Creates a record in `entity_documents` pointing to `fileVersionId` as the current version, and logs a historical entry in `entity_document_versions`.

### Database Tables Affected
*   `entity_documents` (Insert)
*   `entity_document_versions` (Insert)

### Response DTO (201 Created)
```json
{
  "success": true,
  "message": "Document registered successfully.",
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

---

## PATCH /api/v1/staff/{id}/documents/{docId}/verify

### Purpose
Approves or rejects a submitted onboarding document.

### Permission
`staff:document:verify`

### Request DTO
```json
{
  "verificationStatus": "VERIFIED",
  "remarks": "Aadhaar verified via Digilocker e-sign gateway."
}
```

### Validation Constraints
*   `verificationStatus`: Required. Must be `VERIFIED` or `REJECTED`.

### Response DTO
```json
{
  "success": true,
  "message": "Document verification status updated.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
