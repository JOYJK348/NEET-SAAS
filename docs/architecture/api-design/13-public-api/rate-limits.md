# Rate Limits API Specification (13-public-api/rate-limits.md)

This document defines throttling and quota parameters for public endpoints.

---

## 1. Public Endpoint Rate Limit Scopes

To protect core servers from external loops, the Gateway enforces IP and Token Bucket throttling limits:

| Endpoint | Standard Limit | Burst Limit |
|---|---|---|
| `POST /public/admissions` | 5 submissions / min | 15 / hour |
| `GET /public/verify-student/*` | 60 requests / min | 200 / min |
| `GET /public/widgets/*` | 100 requests / min | 300 / min |
| `POST /public/webhooks/*` | 200 requests / min | 500 / min |

---

## 2. API Key Quota Enforcements
Third-party clients using registered API keys are limited by monthly quotas:
*   Quota checks execute at Gateway layer using Redis caches.
*   Once requests count exceeds monthly limit, Gateway rejects calls with status `429 Too Many Requests` returning error code `QUOTA_EXCEEDED`.
