# 00 Platform API Master Index

- **Version**: 1.0
- **Status**: DRAFT
- **Owner**: Architecture Review Board
- **Total Domains**: 12
- **Target Lifecycle**: v1.0-Release-Contracts

---

## 1. Purpose

This document serves as the master register cataloging all planned API endpoints for the Coaching Management Platform. It tracks the distribution of capabilities, operational bounds, and contract readiness across the system domains.

---

## 2. API Domain Distribution

| ID     | Domain Namespace                | Endpoint Scope                                    | Planned APIs | Status  | Reference Spec                                           |
| ------ | ------------------------------- | ------------------------------------------------- | ------------ | ------- | -------------------------------------------------------- |
| **02** | Authentication (`auth`)         | JWT, Session Refresh, Revocations                 | 12           | Planned | [02-auth-api](./02-auth-api/)                            |
| **03** | User Profile & HR (`users`)     | Staff profiles, HR onboarding, departments        | 18           | Planned | [03-user-api](./03-user-api/)                            |
| **04** | Academic Core (`academic`)      | Subjects, batches, timetables, courses            | 35           | Planned | [05-academic-api](./05-academic-api/)                    |
| **05** | Student Portal (`students`)     | Admissions, guardians maps, transfers             | 42           | Planned | [04-student-api](./04-student-api/)                      |
| **06** | Attendance (`attendance`)       | Staff/Student clock-in, live counts               | 15           | Planned | [09-attendance-api](./09-attendance-api/)                |
| **07** | Fees & Billing (`fees`)         | Plans allocation, installments, receipts          | 38           | Planned | [08-fee-api](./08-fee-api/)                              |
| **08** | Question Bank (`assessment`)    | Question catalog, templates, CBT attempts         | 54           | Planned | [06-assessment-api](./06-assessment-api/)                |
| **09** | LMS Core (`lms`)                | Chapters, materials, recordings, homework         | 68           | Planned | [07-lms-api](./07-lms-api/)                              |
| **10** | Communications (`comms`)        | Notifications queue, SMS alerts, templates        | 20           | Planned | [10-communication-api](./10-communication-api/)          |
| **11** | System Infrastructure (`sys`)   | Transcoding, pre-signed upload URLs, health       | 25           | Planned | [11-system-api](./11-system-api/)                        |
| **12** | Analytics Read-Model (`stats`)  | CQRS dashboards, aggregations sync triggers       | 15           | Planned | [12-analytics-api](./12-analytics-api/)                  |
| **13** | AI Administration (`ai-admin`)  | Providers setup, prompts management, token audits | 12           | Planned | [13-ai-admin-api.md](./13-ai-admin-api.md)               |
| **14** | Platform Infrastructure (`sys`) | Pre-signed URLs, flags, background jobs, logs     | 25           | Planned | [14-platform-api.md](./14-platform-api.md)               |
| **15** | Internal Workers (`workers`)    | Job executors, notifications polling, cron runs   | 8            | Planned | [15-internal-worker-api.md](./15-internal-worker-api.md) |

**Total Estimated Endpoints**: 362

---

## 3. Global Status Legend

- `DRAFT`: Structure under active revision.
- `REVIEW`: Submitted to Architecture Review Board.
- `APPROVED`: Locked API contract, ready for backend coding.
- `RELEASED`: Implemented and verified in active staging/production.
