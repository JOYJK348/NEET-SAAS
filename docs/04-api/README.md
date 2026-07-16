# 04 REST API Design & Contracts 🔌

Welcome to the **REST API Design & Contracts** catalog. This section defines the REST guidelines, routing conventions, status codes mappings, and individual namespace endpoints specs.

## Core Design Conventions

- 📘 **[01-api-design-conventions.md](01-api-design-conventions.md)** — Sorting parameters, query filtering formats, and global error contracts.
- 📇 **[00-api-index.md](00-api-index.md)** — Complete index listing of all planned endpoints.
- ⚙️ **[openapi.yaml](openapi.yaml)** — OpenAPI v3 schema definitions.

## Domain Namespace Specs

- 🔑 **[auth/ (Authentication APIs)](auth/README.md)** — Login, refresh, MFA, and logout controls.
- 👥 **[users/ (User HR APIs)](users/README.md)** — Tutors profiles, shifts, and team onboarding.
- 🎓 **[students/ (Student APIs)](students/README.md)** — Admissions, cohort mappings, and guardian links.
- 🏫 **[academics/ (Academic APIs)](academics/README.md)** — Courses, parallel batches, and batch schedules.
- 📝 **[assessments/ (Assessment APIs)](assessments/README.md)** — Question pool, test templates, and evaluations.
- 📹 **[lms/ (LMS Content APIs)](lms/README.md)** — Video class links, PDFs libraries, chapters tree.
- 💳 **[fees/ (Fees & Billing APIs)](fees/README.md)** — Installments plans, receipts ledger, and invoices.
- ⏱️ **[attendance/ (Attendance APIs)](attendance/README.md)** — Student clock-in counts, leaves.
- 📢 **[communication/ (Communication APIs)](communication/README.md)** — Alert templates, SMS logs, email dispatchers.
- 🔧 **[system/ (System APIs)](system/README.md)** — Bucket uploads, health checks.
- 📊 **[analytics/ (Analytics APIs)](analytics/README.md)** — BI reports sync triggers.
- 🌐 **[public/ (Public Portal APIs)](public/README.md)** — Onboarding widgets, verification checks.

## Infrastructure Namespace Specs

- 🤖 **[13-ai-admin-api.md](13-ai-admin-api.md)** — OpenAI prompt definitions, prompt tokens audit.
- ⚙️ **[14-platform-api.md](14-platform-api.md)** — Tenant licensing, feature flag overrides.
- ⚙️ **[15-internal-worker-api.md](15-internal-worker-api.md)** — Cron engines, queues pollers.

---

[⬅️ Back to Main Documentation Index](../README.md)
