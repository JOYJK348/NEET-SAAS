# File Versioning API Specification (11-system-api/file-versioning.md)

This document defines endpoints for managing file versions and validations.

---

## POST /api/v1/files/{id}/verify-upload

### Purpose

Verifies that a file has been successfully uploaded to object storage and records its checksum.

### Permission

`file:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `file:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "checksumSha256": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```

### Business Rules

1.  **Check Object Existence**: Verifies that the file key metadata exists in the Cloudflare R2 bucket.
2.  **Validate Checksum**: Confirms that the target hash matches the metadata returned by object storage to ensure upload integrity.
3.  **Activate Version**: Updates the status of the file version record to `ACTIVE`.

### Database Tables Affected

- `file_versions` (Update)

### Response DTO

```json
{
  "success": true,
  "message": "File upload verified and activated.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
