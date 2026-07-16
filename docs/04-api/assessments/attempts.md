# Attempts API Specification (06-assessment-api/attempts.md)

This document defines endpoints for student exam attempts.

---

## POST /api/v1/exams/{id}/attempts/start

### Purpose

Starts a student's CBT attempt, generating the randomized test questionnaire bundle.

### Permission

`student:exam:attempt`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `student:exam:attempt`
- Tenant Isolation: Enforced via student token.
- Branch Isolation: Enforced
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Business Rules

1.  **Exam Window Check**: Validates that the current time falls within the scheduled start/end range.
2.  **Duplicate Block**: Fails if the student has already started or completed this exam.
3.  **Active Session Creation**: Creates the attempt record in `exam_attempts` setting status to `IN_PROGRESS`.

### Database Tables Affected

- `exam_attempts` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Exam attempt started.",
  "data": {
    "attemptId": "att092a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "questions": [
      {
        "questionId": "q092a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
        "questionText": "What is the primary product of the reaction between an alkene and HBr in the presence of peroxides?",
        "options": [
          { "optionIndex": 1, "text": "Markovnikov addition product" },
          { "optionIndex": 2, "text": "Anti-Markovnikov addition product" },
          { "optionIndex": 3, "text": "Rearranged product" },
          { "optionIndex": 4, "text": "No reaction" }
        ]
      }
    ]
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## POST /api/v1/exams/{id}/attempts/{attemptId}/save-response

### Purpose

Saves a student's answer choice during a live CBT exam.

### Permission

`student:exam:attempt`

### Request DTO

```json
{
  "questionId": "q092a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "selectedOptionIndices": [2]
}
```

### Business Rules

1.  **State check**: Verifies the attempt status is `IN_PROGRESS` and the scheduled time has not expired.
2.  **Save or Overwrite**: Inserts or updates the student's answer choice in `exam_attempt_responses`.

### Database Tables Affected

- `exam_attempt_responses` (Insert/Update)

---

## POST /api/v1/exams/{id}/attempts/{attemptId}/submit

### Purpose

Submits and finalizes the exam attempt.

### Permission

`student:exam:attempt`

### Business Rules

- Changes the attempt status to `SUBMITTED`.
- Stamps the final submission timestamp.
