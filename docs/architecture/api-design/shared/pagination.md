# API Pagination & Sorting Standards (shared/pagination.md)

This document contains standard schema definitions for paginated query requests and envelope wrappers.

---

## 1. Offset Pagination Parameters

All standard list endpoints (GET) support offset pagination via query params:

- `page`: Positive Integer (Default: `1`).
- `limit`: Constraint limit count per page (Default: `25`, Max: `100`).
- `sort`: Comma-separated field names. Prefix with `-` for descending (e.g. `-createdAt,lastName`).

### Paginated Metadata Response Block

```json
"meta": {
  "pagination": {
    "currentPage": 1,
    "pageSize": 25,
    "totalPages": 10,
    "totalRecords": 248
  },
  "timestamp": "2026-07-09T03:00:00.000Z",
  "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
}
```

---

## 2. Cursor Pagination Parameters

Required for high-volume logs and telemetry endpoints (e.g. `student_learning_history`, `audit_logs`):

- `cursor`: Base64 encoded cursor string wrapping the sorting offset identifiers.
- `limit`: Constraint limit count per page (Default: `50`, Max: `250`).

### Cursor Metadata Response Block

```json
"meta": {
  "pagination": {
    "pageSize": 50,
    "nextCursor": "eyJjcmVhdGVkX2F0IjoiMjAyNi0wNy0wOVQyMjozMDowMC4wMDBaIiwiaWQiOiJmNzhhMmUxZC1jMGFhLTQzZDktYTQxYS03YjNiNGI1ZTZmN2EifQ=="
  },
  "timestamp": "2026-07-09T03:00:00.000Z",
  "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
}
```
