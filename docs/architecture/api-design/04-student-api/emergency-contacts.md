# Emergency Contacts API Specification (04-student-api/emergency-contacts.md)

This document defines endpoints for managing student emergency contacts.

---

## POST /api/v1/students/{id}/emergency-contacts

### Purpose

Registers a prioritized emergency contact card for the student.

### Permission

`student:emergency:write`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `student:emergency:write`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "contactName": "Suresh Kumar",
  "relationship": "UNCLE",
  "phone": "9944332211",
  "priorityOrder": 1
}
```

### Validation Constraints

- `priorityOrder`: Required. Integer (e.g. 1 represents primary fallback contact).

### Business Rules

- Ensures `priorityOrder` values are unique per student profile context.

### Database Tables Affected

- `student_emergency_contacts` (Insert)

### Response DTO

```json
{
  "success": true,
  "message": "Emergency contact card registered successfully.",
  "data": {
    "contactId": "ec02a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
