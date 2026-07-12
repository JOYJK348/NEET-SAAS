# Shared Error Catalogue

This document defines the standardized error codes, classification rules, and message contracts used across the backend APIs, web clients, and mobile applications.

---

## 1. Error Code Format

All system error codes **MUST** follow a strict alphanumeric scheme:

$$\text{ERROR\_CODE} = \text{MODULE\_PREFIX} \_ \text{THREE\_DIGIT\_ID}$$

*   **MODULE_PREFIX**: A 3 or 4 letter code corresponding to the bounded context (e.g. `AUTH`, `RBAC`, `WKFL`, `EXAM`, `FEES`).
*   **THREE_DIGIT_ID**: A sequential number starting from `001`.

---

## 2. Error Code Registry

### 2.1 Authentication & Session (`AUTH`)

| Error Code | HTTP Status | Message Key | Description |
|:---|:---:|:---|:---|
| `AUTH_001` | 401 | `UNAUTHORIZED_TOKEN` | Bearer token is missing, expired, or cryptographically invalid. |
| `AUTH_002` | 401 | `OTP_EXPIRED` | The submitted verification OTP has expired. |
| `AUTH_003` | 400 | `OTP_INVALID` | The submitted verification OTP is incorrect. |
| `AUTH_004` | 403 | `TENANT_MISMATCH` | User tenant ID does not match the target request context. |

### 2.2 Access Control & Authorization (`RBAC`)

| Error Code | HTTP Status | Message Key | Description |
|:---|:---:|:---|:---|
| `RBAC_001` | 403 | `INSUFFICIENT_PERMISSIONS` | User does not carry the required permission scope. |
| `RBAC_002` | 403 | `ROLE_NOT_FOUND` | User is assigned to a role that does not exist or has been deleted. |
| `RBAC_003` | 403 | `FEATURE_FLAG_DISABLED` | Target feature flag is disabled for this tenant. |

### 2.3 Workflow & State Engine (`WKFL`)

| Error Code | HTTP Status | Message Key | Description |
|:---|:---|:---|:---|
| `WKFL_001` | 422 | `WORKFLOW_LOCKED` | Cannot edit entity while it is in PENDING_REVIEW state. |
| `WKFL_002` | 403 | `INVALID_ASSIGNEE` | Logged-in user does not carry the permission required for this step. |
| `WKFL_003` | 409 | `VERSION_CONFLICT` | The approval request version in the database is newer than the payload. |
| `WKFL_004` | 400 | `INVALID_TRANSITION` | Transition (e.g. DRAFT ➔ COMPLETED) is not allowed. |

### 2.4 Governance Policies (`POL`)

| Error Code | HTTP Status | Message Key | Description |
|:---|:---:|:---|:---|
| `POL_001` | 422 | `LIMIT_EXCEEDED` | Attempt violates policy limits (e.g. max CBT attempts). |
| `POL_002` | 422 | `LEAD_TIME_VIOLATION` | Action fails schedule timing guidelines (e.g. exam publishing). |
| `POL_003` | 403 | `RATE_LIMIT_EXCEEDED` | User IP has exceeded maximum requests per minute threshold. |

### 2.5 Academic & Exams (`EXAM`)

| Error Code | HTTP Status | Message Key | Description |
|:---|:---:|:---|:---|
| `EXAM_001` | 422 | `TUTOR_DOUBLE_BOOKING` | Tutor is already allocated to another batch at the target slot. |
| `EXAM_002` | 422 | `ROOM_ALLOCATION_CONFLICT` | Classroom room identifier is booked for an overlapping slot. |
| `EXAM_003` | 404 | `EXAM_NOT_FOUND` | Mock test template does not exist. |

### 2.6 Fees & Billing (`FEES`)

| Error Code | HTTP Status | Message Key | Description |
|:---|:---:|:---|:---:|
| `FEES_001` | 402 | `INSUFFICIENT_FUNDS` | Transaction failed during checkout validation. |
| `FEES_002` | 422 | `LEDGER_CLOSED` | Cannot post payment or waiver to a closed ledger year. |

---

## 3. JSON Error Message Contract

Every error payload returned by APIs must follow this strict structure:

```json
{
  "success": false,
  "error": {
    "code": "WKFL_001",
    "message": "Cannot edit entity while it is in PENDING_REVIEW state.",
    "correlation_id": "4a12c82f-8a03-4f99-9bfd-872f10b7713d",
    "timestamp": "2026-07-12T12:22:40Z",
    "details": {
      "entity_type": "STUDY_MATERIAL",
      "entity_id": "8cd2c8e0-1234-5678-abcd-ef123456789b"
    }
  }
}
```
