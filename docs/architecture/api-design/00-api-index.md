# 00 Platform API Master Index

*   **Version**: 1.0
*   **Status**: DRAFT
*   **Owner**: Architecture Review Board
*   **Total Domains**: 12
*   **Target Lifecycle**: v1.0-Release-Contracts

---

## 1. Purpose
This document serves as the master register cataloging all planned API endpoints for the Coaching Management Platform. It tracks the distribution of capabilities, operational bounds, and contract readiness across the system domains.

---

## 2. API Domain Distribution

| ID | Domain Namespace | Endpoint Scope | Planned APIs | Status | Reference Spec |
|---|---|---|---|---|---|
| **02** | Authentication (`auth`) | JWT, Session Refresh, Revocations | 12 | Planned | [02-auth-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/02-auth-api.md) |
| **03** | User Profile & HR (`users`) | Staff profiles, HR onboarding, departments | 18 | Planned | [03-user-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/03-user-api.md) |
| **04** | Academic Core (`academic`)| Subjects, batches, timetables, courses | 35 | Planned | [04-academic-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/04-academic-api.md) |
| **05** | Student Portal (`students`)| Admissions, guardians maps, transfers | 42 | Planned | [05-student-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/05-student-api.md) |
| **06** | Attendance (`attendance`) | Staff/Student clock-in, live counts | 15 | Planned | [06-attendance-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/06-attendance-api.md) |
| **07** | Fees & Billing (`fees`) | Plans allocation, installments, receipts | 38 | Planned | [07-fee-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/07-fee-api.md) |
| **08** | Question Bank (`assessment`) | Question catalog, templates, CBT attempts | 54 | Planned | [08-assessment-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/08-assessment-api.md) |
| **09** | LMS Core (`lms`) | Chapters, materials, recordings, homework | 68 | Planned | [09-lms-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/09-lms-api.md) |
| **10** | Communications (`comms`) | Notifications queue, SMS alerts, templates | 20 | Planned | [10-communication-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/10-communication-api.md) |
| **11** | System Infrastructure (`sys`)| Transcoding, pre-signed upload URLs, health | 25 | Planned | [11-system-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/11-system-api.md) |
| **12** | Analytics Read-Model (`stats`)| CQRS dashboards, aggregations sync triggers | 15 | Planned | [12-analytics-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/12-analytics-api.md) |
| **13** | AI Administration (`ai-admin`)| Providers setup, prompts management, token audits | 12 | Planned | [13-ai-admin-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/13-ai-admin-api.md) |
| **14** | Platform Infrastructure (`sys`)| Pre-signed URLs, flags, background jobs, logs | 25 | Planned | [14-platform-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/14-platform-api.md) |
| **15** | Internal Workers (`workers`)  | Job executors, notifications polling, cron runs  | 8  | Planned | [15-internal-worker-api.md](file:///d:/FreeLance/NEET_platform/docs/architecture/api-design/15-internal-worker-api.md) |

**Total Estimated Endpoints**: 362

---

## 3. Global Status Legend
*   `DRAFT`: Structure under active revision.
*   `REVIEW`: Submitted to Architecture Review Board.
*   `APPROVED`: Locked API contract, ready for backend coding.
*   `RELEASED`: Implemented and verified in active staging/production.
