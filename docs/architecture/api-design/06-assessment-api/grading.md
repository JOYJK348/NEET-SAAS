# Grading API Specification (06-assessment-api/grading.md)

This document defines endpoints for running auto-evaluations and generating test scores.

---

## POST /api/v1/exams/{id}/grade

### Purpose
Triggers the automatic grading process for all submitted attempts of an exam (Async).

### Permission
`exam:grade`

### Security Notes
*   Authentication Required: Yes
*   Required RBAC Permission: `exam:grade`
*   Tenant Isolation: Enforced
*   Branch Isolation: Not Applicable
*   RLS Validation: Enforced
*   Sensitive Fields Masked: No.

### Business Rules
1.  **Exam Completion Check**: Verifies that the scheduled exam window has ended before grading begins.
2.  **Async Processing**: This is an asynchronous batch operation. Returns a `202 Accepted` status along with a `jobId`.
3.  **Auto Scoring Evaluation**:
    *   Iterates through all `exam_attempt_responses` records for the exam.
    *   Compares student answers against correct keys in the question bank.
    *   Applies positive/negative marking rules defined in the exam template to calculate raw scores.
    *   Calculates ranks, percentiles, and updates individual `exam_attempts` scores.

### Database Tables Affected
*   `exam_attempts` (Update status to `GRADED`, sets scores)
*   `exam_results` (Insert score details)

### Response DTO (202 Accepted)
```json
{
  "success": true,
  "message": "Exam auto-grading process queued.",
  "data": {
    "jobId": "j90a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "status": "PENDING"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```
