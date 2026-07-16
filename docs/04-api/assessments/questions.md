# Questions API Specification (06-assessment-api/questions.md)

Refer to [common-errors.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/common-errors.md) and [response-examples.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/shared/response-examples.md) for standard response envelopes.

---

## POST /api/v1/questions

### Purpose

Registers a new question inside the central question bank.

### Permission

`question:create`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: `question:create`
- Tenant Isolation: Enforced (linked to active tenant, but decoupled from LMS).
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "subjectId": "sub02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "chapterId": "ch02a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "topicId": "top02b-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "type": "MCQ",
  "difficulty": "MEDIUM",
  "cognitiveLevel": "APPLICATION",
  "questionText": "What is the primary product of the reaction between an alkene and HBr in the presence of peroxides?",
  "options": [
    { "optionIndex": 1, "text": "Markovnikov addition product" },
    { "optionIndex": 2, "text": "Anti-Markovnikov addition product" },
    { "optionIndex": 3, "text": "Rearranged product" },
    { "optionIndex": 4, "text": "No reaction" }
  ],
  "correctOptionIndices": [2],
  "solutionExplanation": "Peroxides initiate free radical addition, yielding anti-Markovnikov product."
}
```

### Validation Constraints

- `type`: Required. Must be `MCQ`, `MSQ` (Multiple Select), `NAT` (Numerical), or `TF` (True/False).
- `correctOptionIndices`: Required. Must match index values in options list.

### Business Rules

1.  **Normalization check**: Must verify that `subjectId`, `chapterId`, and `topicId` exist and are logically related.
2.  **Version tracking**: Questions are versioned. Creating or updating a question writes to `question_versions` table to support test history immutability.

### Database Tables Affected

- `questions` (Insert)
- `question_versions` (Insert)

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Question registered in bank successfully.",
  "data": {
    "questionId": "q092a3d1-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "versionNo": 1
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## POST /api/v1/questions/bulk-import

### Purpose

Imports questions in batch format asynchronously.

### Permission

`question:create`

### Request DTO

```json
{
  "fileVersionId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
}
```
