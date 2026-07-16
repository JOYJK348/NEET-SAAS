# Batches API Specification (05-academic-api/batches.md)

This document defines endpoints for managing batch classes.

---

## POST /api/v1/batches

### Purpose

Registers a new academic batch in a branch.

### Permission

`batch:create`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `batch:create`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced via payload `branchId` mapping.
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "name": "NEET 2026 Batch Alpha",
  "code": "NEET-26-ALPHA",
  "branchId": "b12a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "courseId": "cne26-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "maxCapacity": 40
}
```

### Validation Constraints

- `maxCapacity`: Required. Positive Integer.
- `code`: Required. Unique per tenant.

### Business Rules

1.  **Capacity Validation**: Restricts admissions or student mappings once active batch enrollment count reaches `maxCapacity`.
2.  **Duplicate check**: Ensures code does not conflict within tenant.

### Database Tables Affected

- `batches` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Batch registered successfully.",
  "data": {
    "batchId": "b02a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
