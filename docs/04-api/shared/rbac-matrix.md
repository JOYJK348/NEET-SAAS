# Role-Based Access Control (RBAC) API Matrix

This document acts as the definitive contract mapping API endpoints to the required permissions scopes and target user roles.

---

## 1. Role Definitions

- **Super Admin (`SUPER_ADMIN`)**: Platform-wide owner. Access to system health, global configurations, and super admin settings. Bypass RLS controls.
- **Tenant Admin (`ADMIN`)**: Single-tenant administrative owner. Full CRUD permissions inside their specific `tenant_id` context.
- **Faculty (`FACULTY`)**: Lecturers, tutors, and coaching staff. Manage timetables, evaluation scores, attendance marking.
- **Student (`STUDENT`)**: Access to active batches schedules, CBT attempts, transaction receipts history.
- **Parent (`PARENT`)**: Read-only tracking mapping matching target student progress, exam scores, and fee installments lists.

---

## 2. API Permission Mapping Matrix

| API Endpoint Path                         | HTTP Method | Required Permission Code          | Student | Parent | Faculty | Admin | Super Admin |
| :---------------------------------------- | :---------: | :-------------------------------- | :-----: | :----: | :-----: | :---: | :---------: |
| `/api/v1/institutes/onboard`              |    POST     | None (Public Onboarding)          |   ❌    |   ❌   |   ❌    |  ❌   |     ✅      |
| `/api/v1/auth/login`                      |    POST     | None (Public Auth)                |   ✅    |   ✅   |   ✅    |  ✅   |     ✅      |
| `/api/v1/academics/batches`               |    POST     | `batches.create`                  |   ❌    |   ❌   |   ❌    |  ✅   |     ✅      |
| `/api/v1/academics/batches/:id/schedule`  |     GET     | `timetable.read`                  |   ✅    |   ✅   |   ✅    |  ✅   |     ✅      |
| `/api/v1/students`                        |    POST     | `students.create`                 |   ❌    |   ❌   |   ❌    |  ✅   |     ✅      |
| `/api/v1/attendance/check-in`             |    POST     | `attendance.mark`                 |   ✅    |   ❌   |   ✅    |  ✅   |     ✅      |
| `/api/v1/attendance/override`             |    POST     | `attendance.override`             |   ❌    |   ❌   |   ❌    |  ✅   |     ✅      |
| `/api/v1/assessments/attempts/:id/submit` |    POST     | `tests.evaluate` (Direct attempt) |   ✅    |   ❌   |   ❌    |  ✅   |     ✅      |
| `/api/v1/assessments/evaluate`            |    POST     | `tests.evaluate`                  |   ❌    |   ❌   |   ✅    |  ✅   |     ✅      |
| `/api/v1/billing/payments/checkout`       |    POST     | `fees.collect` (Checkout)         |   ✅    |   ✅   |   ❌    |  ✅   |     ✅      |
| `/api/v1/billing/closures/close`          |    POST     | `fees.waive` (Close Ledger)       |   ❌    |   ❌   |   ❌    |  ✅   |     ✅      |
| `/api/v1/notifications/dispatch`          |    POST     | `notifications.send`              |   ❌    |   ❌   |   ✅    |  ✅   |     ✅      |
| `/api/v1/reports/export`                  |    POST     | `reports.export`                  |   ❌    |   ❌   |   ❌    |  ✅   |     ✅      |
| `/api/v1/ai/conversations`                |    POST     | `ai.chat`                         |   ✅    |   ❌   |   ✅    |  ✅   |     ✅      |
| `/api/v1/ai-admin/providers`              |     GET     | `system.governance.read`          |   ❌    |   ❌   |   ❌    |  ❌   |     ✅      |
| `/api/v1/platform/settings`               |     GET     | `system.governance.read`          |   ❌    |   ❌   |   ❌    |  ✅   |     ✅      |
| `/api/v1/internal/*`                      |     ALL     | None (Network firewalled)         |   ❌    |   ❌   |   ❌    |  ❌   |     ❌      |

---

## 3. Webhook Target Contracts

- **Razorpay Payments Callback (`POST /api/v1/webhooks/razorpay`)**: Public endpoint secured via signature validation verification (`X-Razorpay-Signature`).
- **Comms Delivery Receipts (`POST /api/v1/webhooks/comms`)**: Public endpoint validating callback signatures against provider profiles keys.
