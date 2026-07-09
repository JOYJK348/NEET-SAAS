# Assessment Audit API Specification (06-assessment-api/audit.md)

This document defines query contracts for pulling score sheets override audits.

---

## GET /api/v1/exams/{id}/attempts/{attemptId}/audit

### Purpose
Retrieves manual score overrides and adjustment histories for a student's attempt.

### Permission
`exam:audit:read`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `exam:audit:read`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Response DTO (200 OK)
```json
{
  "success": true,
  "data": [
    {
      "logId": "l091a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "action": "SCORE_OVERRIDE",
      "oldValue": {
        "score": 120.00
      },
      "newValue": {
        "score": 124.00
      },
      "reason": "Grace marks awarded for ambiguous question correction.",
      "createdAt": "2026-07-09T02:00:00.000Z",
      "actorName": "Physics HOD"
    }
  ],
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
