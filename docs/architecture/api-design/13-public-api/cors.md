# CORS Policy API Specification (13-public-api/cors.md)

This document defines allowed origins and CORS rules for public and integration domains.

---

## 1. Cross-Origin Resource Sharing (CORS) Rules

To secure browser integrations, the API Gateway enforces origin validations based on the client type:

*   **Public Portal Pages (Admissions, Forms)**:
    *   `Access-Control-Allow-Origin`: Restricted strictly to the tenant's configured website URL (e.g. `https://eliteneet.com`). Wildcards (`*`) are prohibited.
    *   `Access-Control-Allow-Headers`: `Content-Type, X-Tenant-ID`.
*   **Embeddable Widgets (Announcements, Results)**:
    *   Allowed origins are validated dynamically against active `X-Tenant-ID` domain configs.
    *   Methods allowed: `GET, OPTIONS`.
*   **Partner APIs**:
    *   Bypasses browser CORS checks (direct server-to-server HTTP integrations). Enforced strictly using API Key credentials headers validation.
