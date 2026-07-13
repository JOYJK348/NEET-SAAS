# 04 — Quality Gates & Operational Budgets

This playbook defines the quality standards, latency budgets, event registries, and error code schemas required to maintain operational excellence.

---

## 1. Performance Budgets

Every sprint's deliverables must operate within these bounds:

| Target Area | Metric Budget | Measurement Standard |
|:---|:---|:---|
| **API Load (GET)** | `< 200ms` | 95th percentile, mock database payload |
| **API Mutation (POST/PATCH)** | `< 350ms` | Processing time under database locks |
| **Auth Rotations** | `< 500ms` | Session token validation and payload generation |
| **Cache Lookups** | `< 5ms` | Redis query latency |
| **UI Load (Static Pages)** | `< 500ms` | Next.js Server Component rendering |
| **UI Load (Dashboards)** | `< 1.5s` | Parallel component fetching + layout caching |
| **Video Playbacks** | `< 2.0s` | Time-to-First-Frame on R2 media CDN |
| **Memory Footprint** | `< 512MB` | Under load inside Docker containers |
| **Connection Pool** | `max 20` | Database pool limit per container |

---

## 2. Event Registry Catalog

Even if the platform executes processes synchronously during V1, events **must** pass through local emitters to simplify scaling to Kafka/NATS in the future:

| Event Name | Source Module | Payload Attributes |
|:---|:---|:---|
| `StudentCreated` | 04 People | `{ studentId, tenantId, email, name }` |
| `StudentUpdated` | 04 People | `{ studentId, changedFields[] }` |
| `StudentDeleted` | 04 People | `{ studentId, tenantId }` |
| `FeePaid` | 10 Billing | `{ paymentId, installmentId, amount, mode }` |
| `AttendanceMarked` | 05 Attendance | `{ sessionId, date, presentIds[], absentIds[] }` |
| `AssignmentSubmitted` | 08 Learning | `{ submissionId, assignmentId, studentId }` |
| `ExamPublished` | 06 Exams | `{ examId, batchId, startDate, totalMarks }` |
| `LiveClassScheduled` | 09 Live Classes | `{ classId, batchId, jitsiLink, date }` |
| `RecordingProcessed` | 09 Live Classes | `{ classId, recordingUrl, duration }` |
| `NotificationSent` | 11 Comm | `{ deliveryId, recipient, channel }` |

---

## 3. Error Code Catalog

Raw error strings are prohibited. Map errors to these codes for uniform handling on the client:

| Code | Severity | UI Action | Default Message |
|:---|:---|:---|:---|
| **AUTH_001** | error | redirect | "Your session has expired. Please log in again." |
| **AUTH_002** | error | inline | "Invalid email or password." |
| **TENANT_001** | critical | redirect | "Institute account is suspended. Contact support." |
| **STUDENT_001** | error | inline | "A student with this email address already exists." |
| **EXAM_001** | warning | modal | "This exam has ended and is locked for submissions." |
| **BILLING_001** | error | toast | "This installment invoice has already been paid." |
| **SYSTEM_500** | critical | toast | "An unexpected error occurred. Please try again later." |

---

## 4. Sprint Exit Criteria Quality Gates

Every sprint must pass these gates before sign-off:

1.  **Code Coverage:** Unit tests must cover `> 85%` of the service business logic.
2.  **No N+1 Queries:** Database query patterns must verify that relational lists load in flat batches.
3.  **RLS Isolation:** RLS validation checks must confirm that a tenant's database requests never access data belonging to other tenants.
4.  **Static Analysis:** TypeScript compilation holds `0` errors, and ESLint returns `0` warnings.
5.  **Performance:** Page load latency and API response times must meet the budgets listed above.
6.  **Accessibility (WCAG 2.2 AA Compliance):** All custom interactive elements must pass access evaluations:
    *   *Keyboard Navigation:* Interactive components (buttons, links, select boxes, modals) must be fully navigable using the `Tab`, `Arrow`, and `Enter`/`Space` keys.
    *   *Focus States:* Visible focus indicators must be present on focus shifts. Modals/Drawers must implement focus traps.
    *   *Aria Labels:* Non-text elements (icons, action icons) must have descriptive `aria-label` or `aria-labelledby` properties.
    *   *Color Contrast:* Text contrast ratios must meet WCAG AA standards (minimum `4.5:1` for regular text).

