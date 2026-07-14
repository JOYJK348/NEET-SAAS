# Storage API Specification (11-system-api/storage.md)

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [response-examples.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/response-examples.md) for standard response envelopes.

---

## POST /api/v1/files/presign

### Purpose

Generates a pre-signed upload URL for direct client binary transfer to Cloudflare R2 bucket.

### Permission

`file:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `file:write`
- Tenant Isolation: Enforced (Bucket objects prefix namespaces mapped by tenant UUID).
- Branch Isolation: Not Applicable
- RLS Validation: Direct SQL verification.
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "fileName": "avatar.jpg",
  "mimeType": "image/jpeg",
  "fileSizeBytes": 102450
}
```

### Validation Constraints

- `fileSizeBytes`: Required. Must not exceed maximum upload boundaries defined for the MIME type category in conventions.

### Business Rules

1.  **Prefix generation**: Generates a secure target file key string structured as: `{tenantId}/{uuid_filename}`.
2.  **Short-Lived Link**: Generates a secure R2 pre-signed link valid for exactly 15 minutes.
3.  **Active Version Reservation**: Inserts a pending record into `file_versions` table and returns its UUID.

### Database Tables Affected

- `file_versions` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Pre-signed upload URL generated.",
  "data": {
    "fileVersionId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
    "uploadUrl": "https://r2.eliteneet.com/tenant-123/avatar.jpg?X-Amz-Signature=...",
    "objectKey": "tenant-123/avatar.jpg"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
