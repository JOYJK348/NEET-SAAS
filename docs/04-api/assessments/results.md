# Results API Specification (06-assessment-api/results.md)

This document defines endpoints for querying student exam scores, ranking sheets, and statistics.

---

## GET /api/v1/exams/{id}/results

### Purpose

Retrieves the ranked scorecard list for an exam.

### Permission

`exam:result:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `exam:result:read`
- Tenant Isolation: Enforced
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request Parameters

- `filter[batchId]`: UUID.
- `page`: Positive Integer.
- `limit`: Integer.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Exam results scorecard list retrieved.",
  "data": [
    {
      "studentName": "Adithya Kumar",
      "rollNumber": "PH-2026-0089",
      "totalMarksObtained": 620.0,
      "rank": 1,
      "percentile": 99.85,
      "sectionScores": [
        {
          "sectionName": "Physics Section A",
          "correctAnswersCount": 32,
          "wrongAnswersCount": 3,
          "score": 125.0
        }
      ]
    }
  ],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "pageSize": 25,
      "totalPages": 1,
      "totalRecords": 1
    },
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
