# Staff API Specifications (03-user-api/staff.md)

---

## POST /api/v1/staff

### Purpose

Registers a raw, pending profile container for a new employee.

### Permission

`staff:create`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `staff:create`
- Tenant Isolation: Enforced via `X-Tenant-ID`.
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "userId": "u091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "staffNumber": "STAFF-2026-0099"
}
```

### Validation Constraints

- `userId`: Required. Valid user ID reference.
- `staffNumber`: Required. Tenant-unique employee code.

### Business Rules

1.  **Unique Code check**: Fails if the `staffNumber` is already taken within this tenant.
2.  **Pending state initialization**: Automatically sets `status` to `PENDING` awaiting the joining workflow execution.

### Database Tables Affected

- `staff_profiles` (Insert)

### Response DTO

```json
{
  "success": true,
  "message": "Staff profile registered in pending state.",
  "data": {
    "staffProfileId": "s89a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## POST /api/v1/staff/bulk-import

### Purpose

Triggers a bulk import task for multiple staff profiles (Async).

### Permission

`staff:create`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `staff:create`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "fileVersionId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
}
```

### Validation Constraints

- `fileVersionId`: Required. Valid CSV/XLSX file pointer version in system storage.

### Business Rules

1.  **Async Processing**: This is an asynchronous operation. Handled via Outbox pattern, return `202 Accepted` immediately containing `jobId`.
2.  **Validation Gate**: The file is queued, verified against structural cell-type bounds, and imported using batch transaction blocks.

### Response DTO (202 Accepted)

```json
{
  "success": true,
  "message": "Bulk staff import job queued.",
  "data": {
    "jobId": "j091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "status": "PENDING"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
