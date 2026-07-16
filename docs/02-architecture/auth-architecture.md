# Authentication Architecture Decision

> **Status:** ✅ Decided
> **Decision Date:** July 8, 2026
> **Applies To:** NestJS Backend + Next.js Frontend
> **Affects:** Every API endpoint, every user role, database schema for users/sessions

---

## 1. Problem Statement

The Coaching Management Platform has **5 distinct user roles** across **multiple institutes** (multi-tenant SaaS). We need an authentication strategy that:

- Securely authenticates all 5 roles through a single login endpoint.
- Carries tenant context (`institute_id`) on every API request automatically.
- Survives browser refresh without re-login (persistent sessions).
- Allows session revocation (admin can log out a user remotely).
- Is resistant to XSS and CSRF attacks.
- Blocks API design from "it depends on auth" — so we need this decided **now**.

---

## 2. Decision: JWT + Refresh Token Rotation via HttpOnly Cookie

### Why not pure session-based auth?

Session-based auth stores session state in the server (DB or Redis). While valid, it requires:

- A Redis instance (added cost and ops overhead for Railway).
- Session store synchronization if the backend ever scales horizontally.
- NestJS session middleware setup.

**Verdict:** Adds operational complexity with no meaningful benefit at our scale.

### Why not pure JWT (access token only)?

A single long-lived JWT cannot be revoked. If a token is stolen, the attacker has access until it expires. There is no way for an admin to log out a user remotely.

**Verdict:** Unacceptable for a platform with student data.

### Why JWT + Refresh Token Rotation?

| Concern                     | How it's handled                                                     |
| --------------------------- | -------------------------------------------------------------------- |
| Short-lived access (15 min) | Limits damage window if token is stolen                              |
| Persistent login            | Refresh Token silently issues new Access Token                       |
| Revocation                  | Refresh Token is stored in DB — can be invalidated instantly         |
| Remote logout               | Delete Refresh Token from DB → next refresh fails                    |
| XSS safety                  | Refresh Token in HttpOnly cookie → JS cannot read it                 |
| CSRF safety                 | Access Token sent as Bearer header → cannot be forged by a CSRF form |
| Multi-tenant                | `institute_id` embedded in JWT payload → every request carries it    |
| Scalability                 | Access Token validation is stateless → no DB hit per request         |

**Verdict: JWT + Refresh Token Rotation via HttpOnly Cookie is the correct strategy.**

---

## 3. Token Architecture

### 3.1 Access Token (JWT)

| Property         | Value                                                                |
| ---------------- | -------------------------------------------------------------------- |
| Algorithm        | RS256 (asymmetric — private key signs, public key verifies)          |
| Lifetime         | **15 minutes**                                                       |
| Storage (client) | **JavaScript memory only** (variable in Next.js app state / context) |
| Storage (server) | Not stored — stateless verification via public key                   |
| Transport        | `Authorization: Bearer <token>` header                               |

#### JWT Payload Structure

```json
{
  "sub": "usr_01JXXXXX",
  "institute_id": "inst_01JXXXXX",
  "role": "TENANT_ADMIN",
  "session_id": "sess_01JXXXXX",
  "force_password_change": false,
  "iat": 1720000000,
  "exp": 1720000900
}
```

**Payload field explanations:**

| Field                   | Purpose                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `sub`                   | User ID — primary identity                                                  |
| `institute_id`          | Tenant identifier — scopes all DB queries                                   |
| `role`                  | Single role: `PLATFORM_ADMIN`, `TENANT_ADMIN`, `TUTOR`, `STUDENT`, `PARENT` |
| `session_id`            | References the Login Session record — enables revocation                    |
| `force_password_change` | `true` on first login — blocks all APIs except `/auth/change-password`      |
| `iat`                   | Issued at timestamp                                                         |
| `exp`                   | Expiry timestamp                                                            |

> **Why RS256 and not HS256?**
> RS256 uses a private/public key pair. The backend signs with the private key.
> If we ever add microservices or separate services (e.g., a separate notification service),
> they can verify tokens using only the public key — without needing the private key.
> This is the correct choice for any system that may grow.

> **⚠️ Supabase Auth JWT Payload Constraints (Non-Negotiable):**
>
> 1. Custom claims inside the Supabase JWT **must only contain** the minimum identity columns: `institute_id` (UUID), `user_id` (UUID), and `role`.
> 2. **Never** map mutable user profile fields (e.g. `phone`, `avatar_url`, `first_name`) into the JWT custom claims. This keeps HTTP headers light (< 1.5KB) and avoids stale-claim bugs when a user updates their profile.
> 3. The frontend (Next.js) must query user profile data via a `/users/me` API endpoint, rather than decoding it from the JWT.
> 4. Permissions are mapped dynamically in the NestJS backend on route guard level using the `role` claim, keeping token payloads lightweight.

> **Why no permissions[] in the JWT?**
> Permissions are role-based and predictable. Including them in the JWT bloats the token size.
> Each NestJS Guard fetches effective permissions from an in-memory cache (role → permissions map)
> loaded at startup. This avoids a DB hit per request while keeping tokens small.

---

### 3.2 Refresh Token

| Property         | Value                                                     |
| ---------------- | --------------------------------------------------------- |
| Format           | Cryptographically random 256-bit token (not a JWT)        |
| Lifetime         | **7 days** (30 days if "Remember Me" is selected)         |
| Storage (client) | **HttpOnly, Secure, SameSite=Strict cookie**              |
| Storage (server) | Hashed (SHA-256) in `login_sessions` table                |
| Transport        | Automatically sent by browser on cookie-eligible requests |
| Rotation         | **Every use** — old token invalidated, new token issued   |

#### Why store the hash, not the raw token?

If the database is compromised, an attacker cannot use a hashed refresh token — they need the original random bytes. Store the SHA-256 hash in DB, keep the raw token in the cookie.

---

## 4. Login Flow

```
Client (Next.js)                    Server (NestJS)                  DB (PostgreSQL)
     │                                    │                               │
     │  POST /auth/login                  │                               │
     │  { email, password }               │                               │
     │ ─────────────────────────────────► │                               │
     │                                    │  Lookup user by email         │
     │                                    │ ─────────────────────────────►│
     │                                    │ ◄─────────────────────────────│
     │                                    │  Verify bcrypt(password)      │
     │                                    │  Check is_active = true       │
     │                                    │  Check failed_attempts < 5    │
     │                                    │                               │
     │                                    │  Create Login Session record  │
     │                                    │ ─────────────────────────────►│
     │                                    │                               │
     │                                    │  Sign Access Token (15 min)   │
     │                                    │  Generate Refresh Token       │
     │                                    │  Store RT hash in session     │
     │                                    │ ─────────────────────────────►│
     │                                    │                               │
     │ ◄─────────────────────────────────  │                               │
     │  Response:                         │                               │
     │  { access_token, user, role }      │                               │
     │  Set-Cookie: refresh_token         │                               │
     │  (HttpOnly, Secure, SameSite=Strict│                               │
```

---

## 5. Token Refresh Flow (Silent Refresh)

```
Client (Next.js)                    Server (NestJS)                  DB (PostgreSQL)
     │                                    │                               │
     │  [Access Token expires in ~1 min]  │                               │
     │  POST /auth/refresh                │                               │
     │  Cookie: refresh_token (auto-sent) │                               │
     │ ─────────────────────────────────► │                               │
     │                                    │  Extract RT from cookie       │
     │                                    │  SHA-256 hash it              │
     │                                    │  Lookup in login_sessions     │
     │                                    │ ─────────────────────────────►│
     │                                    │ ◄─────────────────────────────│
     │                                    │  Validate: not expired        │
     │                                    │  Validate: not revoked        │
     │                                    │                               │
     │                                    │  Generate new Access Token    │
     │                                    │  Generate new Refresh Token   │
     │                                    │  INVALIDATE old RT in DB      │
     │                                    │  Store new RT hash in DB      │
     │                                    │ ─────────────────────────────►│
     │                                    │                               │
     │ ◄─────────────────────────────────  │                               │
     │  { access_token }                  │                               │
     │  Set-Cookie: new refresh_token     │                               │
```

> **Refresh Token Reuse Detection:** If an already-used (rotated) Refresh Token is submitted,
> the server must assume session theft. Action: **immediately revoke ALL sessions for that user**
> and force re-login. This is the industry standard (RFC 6819).

---

## 6. Logout Flow

```
Client                              Server                           DB
  │                                    │                               │
  │  POST /auth/logout                 │                               │
  │  Authorization: Bearer <AT>        │                               │
  │  Cookie: refresh_token             │                               │
  │ ─────────────────────────────────► │                               │
  │                                    │  Extract session_id from AT   │
  │                                    │  Mark session as REVOKED      │
  │                                    │  Clear RT from login_sessions │
  │                                    │ ─────────────────────────────►│
  │                                    │                               │
  │ ◄─────────────────────────────────  │                               │
  │  { success: true }                 │                               │
  │  Set-Cookie: refresh_token=""      │                               │
  │  (clears the cookie)               │                               │
```

---

## 7. First Login / Force Password Change Flow

Platform Admin creates Tenant Admin → system generates a **temporary password**.

On first login, the JWT returned contains `"force_password_change": true`.

```
┌─────────────────────────────────────────────────────────────────────┐
│                  Force Password Change Guard                        │
│                                                                     │
│  Any request with force_password_change = true in JWT               │
│  that is NOT targeting /auth/change-password                        │
│  → Returns HTTP 403 with code: FORCE_PASSWORD_CHANGE_REQUIRED       │
│                                                                     │
│  Next.js client intercepts 403 → redirects to change-password page  │
└─────────────────────────────────────────────────────────────────────┘
```

After successful password change:

- `force_password_change` is set to `false` in DB.
- Current session is invalidated.
- User must log in fresh with their new password.

---

## 8. Password Reset Flow (Forgot Password)

```
1. User submits: POST /auth/forgot-password { email }
2. Server generates a cryptographically random one-time token (UUID v4)
3. Token stored in DB with: user_id, hashed_token, expires_at (15 min from now)
4. Email sent with reset link: https://app.coachingplatform.com/reset-password?token=<raw_token>
5. User clicks link → submits: POST /auth/reset-password { token, new_password }
6. Server: hash token → lookup in DB → validate not expired → update password
7. Token marked as USED — cannot be reused
8. All active sessions for the user are revoked (force re-login on all devices)
```

> **Security:** Always return HTTP 200 on `/forgot-password` regardless of whether
> the email exists. Never expose whether an email is registered.

---

## 9. Account Security Rules

| Rule                      | Value                                           |
| ------------------------- | ----------------------------------------------- |
| Password hashing          | bcrypt with cost factor 12                      |
| Failed login attempts     | Account locked after **5 consecutive failures** |
| Account lock duration     | **30 minutes** (then auto-unlock)               |
| Password minimum length   | 8 characters                                    |
| Password requirements     | At least 1 uppercase, 1 lowercase, 1 digit      |
| Temporary password length | 12 characters (auto-generated)                  |
| Reset token expiry        | 15 minutes                                      |
| Password reuse prevention | Last 3 passwords checked (Phase 2)              |

---

## 10. Multi-Tenant Isolation via JWT

Every API request carries `institute_id` in the JWT. NestJS implements a **TenantGuard** that:

1. Extracts `institute_id` from the verified JWT.
2. Attaches it to the request context.
3. Every service method uses it to scope all queries.

```typescript
// Example: Every DB query is automatically scoped
async findAllStudents(context: RequestContext) {
  return this.studentRepo.find({
    where: { institute_id: context.instituteId }  // ← from JWT
  });
}
```

**Platform Admin exception:** Platform Admin tokens do NOT carry an `institute_id`.
Their requests are routed to a separate PlatformGuard that skips tenant scoping.

---

## 11. NestJS Implementation Architecture

### Endpoints

| Endpoint                | Method | Auth Required          | Purpose                 |
| ----------------------- | ------ | ---------------------- | ----------------------- |
| `/auth/login`           | POST   | ❌ No                  | Login all user types    |
| `/auth/refresh`         | POST   | ❌ No (uses RT cookie) | Silent token refresh    |
| `/auth/logout`          | POST   | ✅ Yes                 | Revoke current session  |
| `/auth/logout-all`      | POST   | ✅ Yes                 | Revoke all sessions     |
| `/auth/forgot-password` | POST   | ❌ No                  | Trigger reset email     |
| `/auth/reset-password`  | POST   | ❌ No                  | Complete password reset |
| `/auth/change-password` | POST   | ✅ Yes                 | Change own password     |
| `/auth/me`              | GET    | ✅ Yes                 | Get current user info   |
| `/auth/sessions`        | GET    | ✅ Yes                 | List active sessions    |

### Guards Hierarchy

```
Request
  │
  ▼
JwtAuthGuard          ← Verifies Access Token signature + expiry
  │
  ▼
TenantGuard           ← Extracts institute_id, validates institute is active
  │
  ▼
ForcePasswordGuard    ← Checks force_password_change flag
  │
  ▼
RolesGuard            ← Checks role against endpoint requirements
  │
  ▼
PermissionsGuard      ← Checks specific permission against endpoint (future)
  │
  ▼
Controller Handler
```

---

## 12. Next.js Client Implementation

### Access Token Storage

```
❌ DO NOT store in localStorage  → vulnerable to XSS
❌ DO NOT store in sessionStorage → same problem
✅ Store in React Context / Zustand store (in-memory)
✅ On page load → call /auth/refresh to get new AT from RT cookie
✅ Axios interceptor → auto-refresh AT when response is 401
```

### Axios Interceptor Pattern

```
Request made
  │
  ▼
Add Authorization: Bearer <AT> header
  │
  ▼
Response received
  │
  ├── 200 OK → return data
  │
  └── 401 Unauthorized
        │
        ▼
        Call POST /auth/refresh  (cookie sent automatically)
          │
          ├── 200 → update AT in memory → retry original request
          │
          └── 401 → clear AT → redirect to /login
```

### Route Protection in Next.js (App Router)

```
middleware.ts (Next.js Middleware)
  │
  ├── Check for AT in memory (via a check-auth endpoint)
  │
  ├── If no AT → try POST /auth/refresh
  │     │
  │     ├── Success → allow route, set AT
  │     └── Fail → redirect to /login
  │
  └── If AT valid → check role matches required role for this route
        │
        └── Wrong role → redirect to /unauthorized
```

---

## 13. Login Session Table Design (DB Schema Reference)

```sql
login_sessions (
  id              UUID PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id),
  institute_id    UUID REFERENCES institutes(id),  -- NULL for Platform Admin
  refresh_token   VARCHAR(64) NOT NULL,            -- SHA-256 hash of raw RT
  device_info     JSONB,                           -- { os, browser, device }
  ip_address      INET,
  last_used_at    TIMESTAMP NOT NULL,
  expires_at      TIMESTAMP NOT NULL,
  is_revoked      BOOLEAN DEFAULT FALSE,
  revoked_at      TIMESTAMP,
  revoked_reason  VARCHAR(50),                     -- LOGOUT / ADMIN_REVOKE / THEFT
  created_at      TIMESTAMP NOT NULL DEFAULT NOW()
)
```

---

## 14. CORS Configuration

```
Allowed Origins:
  - https://app.yourdomain.com    (Production Vercel URL)
  - http://localhost:3000          (Local development only)

Allowed Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS

Allowed Headers: Content-Type, Authorization

Credentials: true  (REQUIRED — allows cookies to be sent cross-origin)
```

> **Critical:** `credentials: true` is required for HttpOnly cookie-based
> Refresh Token to work cross-origin (Vercel frontend → Railway backend).

---

## 15. Rate Limiting (Auth Endpoints)

| Endpoint                | Limit       | Window                |
| ----------------------- | ----------- | --------------------- |
| `/auth/login`           | 10 requests | per 15 minutes per IP |
| `/auth/forgot-password` | 5 requests  | per hour per IP       |
| `/auth/reset-password`  | 5 requests  | per hour per IP       |
| `/auth/refresh`         | 60 requests | per hour per IP       |

NestJS package: `@nestjs/throttler`

---

## 16. Environment Variables Required

```env
# JWT
JWT_PRIVATE_KEY=<RS256 private key PEM>
JWT_PUBLIC_KEY=<RS256 public key PEM>
JWT_ACCESS_TOKEN_EXPIRY=900          # 15 minutes in seconds
JWT_REFRESH_TOKEN_EXPIRY=604800      # 7 days in seconds
JWT_REFRESH_TOKEN_EXPIRY_REMEMBER=2592000  # 30 days in seconds

# Cookies
COOKIE_DOMAIN=.yourdomain.com
COOKIE_SECURE=true                   # false in local dev

# Security
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION_MINUTES=30
PASSWORD_RESET_TOKEN_EXPIRY_MINUTES=15
```

---

## 17. What This Unblocks

With this decision documented, the following work can now proceed in parallel:

| Unblocked Work                            | Why                                                                                    |
| ----------------------------------------- | -------------------------------------------------------------------------------------- |
| **Database Schema: users table**          | Know exact fields: password_hash, failed_attempts, locked_until, force_password_change |
| **Database Schema: login_sessions table** | Schema defined in Section 13                                                           |
| **API Design: Auth Module**               | All endpoints defined in Section 11                                                    |
| **API Design: All other modules**         | Know that JWT carries institute_id — all endpoints auto-scoped                         |
| **NestJS Module Structure**               | Know Guards hierarchy — Section 11                                                     |
| **Next.js Auth Setup**                    | Know AT storage strategy, interceptor pattern — Section 12                             |
| **Sprint 1 Planning**                     | Auth module is always Sprint 1 — can now be fully tasked                               |

---

## 18. Decisions NOT Made (Deferred to Phase 2)

| Decision                          | Why Deferred                        |
| --------------------------------- | ----------------------------------- |
| Multi-Factor Authentication (MFA) | Not in Phase 1 scope                |
| Social Login (Google OAuth)       | Not requested                       |
| Single Sign-On (SSO)              | Enterprise feature                  |
| Biometric Login                   | Mobile-only, Phase 2                |
| Device Trust / Device Management  | Phase 2                             |
| Permission Matrix (granular)      | Phase 1 uses role-level access only |

---

## 19. Summary of Key Decisions

| Decision                       | Choice                       | Rationale                         |
| ------------------------------ | ---------------------------- | --------------------------------- |
| Auth strategy                  | JWT + Refresh Token          | Revocable + stateless             |
| JWT algorithm                  | RS256                        | Future-proof for multi-service    |
| Access Token lifetime          | 15 minutes                   | Limits exposure window            |
| Access Token storage           | In-memory (JS)               | XSS-safe                          |
| Refresh Token lifetime         | 7 days (30 with Remember Me) | Balance security vs UX            |
| Refresh Token storage (client) | HttpOnly Secure cookie       | XSS-proof                         |
| Refresh Token storage (server) | SHA-256 hash in DB           | Breach-safe                       |
| Refresh Token rotation         | Every use                    | Industry standard                 |
| Tenant isolation               | `institute_id` in JWT        | Automatic, zero-trust per request |
| Password hashing               | bcrypt cost 12               | Proven, NestJS-native             |
| Session revocation             | Delete RT from DB            | Immediate effect                  |
| Reuse detection                | Revoke all sessions          | RFC 6819 compliant                |
