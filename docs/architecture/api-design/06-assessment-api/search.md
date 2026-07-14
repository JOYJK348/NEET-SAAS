# Assessment Search API Specification (06-assessment-api/search.md)

This document defines advanced filter parameters for the question bank catalog.

---

## GET /api/v1/questions/search

### Purpose

Exposes a criteria-based search query API to filter questions in the bank.

### Permission

`question:read`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `question:read`
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request Parameters

- `filter[subjectId]`: UUID.
- `filter[chapterId]`: UUID.
- `filter[topicId]`: UUID.
- `filter[difficulty]`: String (`EASY`, `MEDIUM`, `HARD`).
- `filter[type]`: String (`MCQ`, `MSQ`, `NAT`).
- `search`: String (Fuzzy search matching question text).
- `page`: Positive Integer.
- `limit`: Integer.

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Questions search executed successfully.",
  "data": [
    {
      "questionId": "q092a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
      "type": "MCQ",
      "difficulty": "MEDIUM",
      "questionText": "What is the primary product of the reaction between an alkene and HBr in the presence of peroxides?",
      "subject": {
        "id": "sub02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
        "name": "Organic Chemistry"
      }
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
