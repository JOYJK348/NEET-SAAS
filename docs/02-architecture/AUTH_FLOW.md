# Authentication Flow Reference

> **Purpose:** Single source of truth for all auth flow sequences.
> **Scope:** Covers Login, Token Refresh, Logout, Password Reset, and Multi-Tenant flows.
> **Base Architecture:** [auth-architecture.md](auth-architecture.md)
> **API Contracts:** [02-auth-api/](api-design/02-auth-api/)

---

## 1. Login Flow

```mermaid
sequenceDiagram
    participant C as Client (Next.js)
    participant S as Server (NestJS)
    participant DB as Database
    participant R as Redis

    C->>S: POST /auth/login<br/>{ email, password, deviceInfo }
    S->>DB: SELECT user WHERE email = ?
    DB-->>S: User record + password_hash

    alt User not found
        S-->>C: 401 INVALID_CREDENTIALS
    else Account locked
        S-->>C: 423 ACCOUNT_LOCKED
    else User suspended
        S-->>C: 403 USER_SUSPENDED
    else Password mismatch
        S->>DB: Increment failed_attempts
        alt failed_attempts >= 5
            S->>DB: SET locked_until = NOW() + 30min
            S-->>C: 423 ACCOUNT_LOCKED
        else
            S-->>C: 401 INVALID_CREDENTIALS
        end
    else Success
        S->>DB: RESET failed_attempts = 0, locked_until = NULL
        S->>DB: INSERT login_session<br/>(refresh_token_hash, device_info, ip, expires_at)
        S->>R: Cache session metadata
        S->>S: Sign Access Token (RS256, 15min)
        S-->>C: 200 OK<br/>{ accessToken, user, permissions }<br/>Set-Cookie: refresh_token (HttpOnly)
    end
```

### Key Rules

| Rule                    | Value                                    |
| ----------------------- | ---------------------------------------- |
| Rate limit              | 10 req / 15min per IP                    |
| Max concurrent sessions | 5 (oldest auto-evicted)                  |
| Account lock            | After 5 consecutive failures             |
| Lock duration           | 30 minutes (auto-unlock)                 |
| MFA redirect            | Returns 202 + `mfaToken` if TOTP enabled |

### Response Shape

```json
{
  "success": true,
  "data": {
    "accessToken": "eyJ...",
    "user": { "id": "usr_xxx", "email": "...", "role": "TENANT_ADMIN" },
    "permissions": ["institute.view", "student.create"]
  },
  "meta": { "timestamp": "...", "correlationId": "..." }
}
```

---

## 2. Refresh Token Rotation

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database
    participant R as Redis

    Note over C: Access Token expiring<br/>(Axios 401 interceptor)

    C->>S: POST /auth/refresh<br/>Cookie: refresh_token (auto-sent)

    S->>S: SHA-256(refresh_token)
    S->>DB: SELECT session WHERE refresh_token_hash = ?
    DB-->>S: Session record

    alt Session not found
        S-->>C: 401 TOKEN_REVOKED<br/>Clear cookie
    else Session expired
        S-->>C: 401 TOKEN_EXPIRED<br/>Clear cookie
    else Session revoked (replay attack)
        S->>DB: REVOKE ALL sessions for user
        S->>R: Evict all user cache keys
        S->>S: Log security alert
        S-->>C: 401 SESSION_FAMILY_REVOKED<br/>Clear cookie
    else Valid session
        S->>DB: Mark old RT as revoked
        S->>DB: INSERT new RT hash (rotation)
        S->>R: Update session cache
        S->>S: Sign new Access Token (15min)
        S-->>C: 200 OK<br/>{ accessToken }<br/>Set-Cookie: new refresh_token
    end
```

### Token Properties

| Property       | Access Token        | Refresh Token                     |
| -------------- | ------------------- | --------------------------------- |
| Format         | JWT (RS256)         | Random 256-bit                    |
| Lifetime       | 15 minutes          | 7 days (30 with Remember Me)      |
| Client storage | In-memory (Zustand) | HttpOnly, Secure, SameSite=Strict |
| Server storage | Not stored          | SHA-256 hash in `login_sessions`  |
| Rotation       | Not applicable      | Every use                         |

### JWT Payload

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

---

## 3. Logout Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database
    participant R as Redis

    C->>S: POST /auth/logout<br/>Authorization: Bearer <AT><br/>Cookie: refresh_token
    S->>S: Verify AT signature + expiry
    S->>S: Extract session_id from AT
    S->>DB: UPDATE login_session SET is_revoked = true<br/>WHERE id = session_id
    S->>R: DEL session:session_id
    S-->>C: 200 OK<br/>{ success: true }<br/>Set-Cookie: refresh_token="" (clear)
```

---

## 4. Logout All Devices

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database
    participant R as Redis

    C->>S: POST /auth/logout-all<br/>Authorization: Bearer <AT>
    S->>S: Verify AT, extract user_id
    S->>DB: UPDATE login_session SET is_revoked = true<br/>WHERE user_id = ? AND is_revoked = false
    S->>R: DEL user:sessions:{userId}
    S-->>C: 200 OK<br/>{ success: true, message: "All sessions terminated" }
```

---

## 5. Forgot Password Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database
    participant E as Email Service

    C->>S: POST /auth/forgot-password<br/>{ email }

    Note over S: Always returns 200 (anti-enumeration)

    S->>DB: SELECT user WHERE email = ?
    alt User found
        S->>S: Generate random reset token
        S->>DB: INSERT password_reset_token<br/>(user_id, hashed_token, expires_at)
        S->>E: Send reset email<br/>https://app.com/reset-password?token=<raw>
    else User not found
        Note over S: Silent no-op
    end

    S-->>C: 200 OK<br/>{ message: "If email exists, reset link sent" }

    Note over C: Email arrives (1-5s)

    C->>C: Redirect to reset-password page<br/>Read token from URL
```

### Security Rules

| Rule          | Value                                |
| ------------- | ------------------------------------ |
| Rate limit    | 5 req / hour per IP                  |
| Token expiry  | 15 minutes                           |
| Token format  | Random UUID v4                       |
| Return status | Always 200                           |
| Email delay   | Not sent if email not found (silent) |

---

## 6. Reset Password Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database

    C->>S: POST /auth/reset-password<br/>{ token, newPassword }
    S->>S: SHA-256(token)
    S->>DB: SELECT reset_token WHERE hashed_token = ?

    alt Token not found
        S-->>C: 400 INVALID_TOKEN
    else Token expired
        S-->>C: 400 TOKEN_EXPIRED
    else Token already used
        S-->>C: 400 TOKEN_ALREADY_USED
    else Valid token
        S->>S: Validate password complexity
        alt Weak password
            S-->>C: 422 WEAK_PASSWORD
        else Password reused (last 5)
            S-->>C: 422 PASSWORD_REUSED
        else Success
            S->>DB: UPDATE users SET password_hash = bcrypt(newPassword)
            S->>DB: Mark token as USED
            S->>DB: REVOKE all sessions for user
            S-->>C: 200 OK<br/>{ success: true, message: "Password reset successfully" }
        end
    end
```

---

## 7. Change Password (Authenticated)

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database

    C->>S: POST /auth/change-password<br/>Authorization: Bearer <AT><br/>{ currentPassword, newPassword }
    S->>S: Verify AT
    S->>DB: SELECT user WHERE id = ?
    alt Current password wrong
        S-->>C: 401 INVALID_PASSWORD
    else New password same as last 5
        S-->>C: 422 PASSWORD_REUSED
    else Success
        S->>DB: UPDATE users SET password_hash = bcrypt(newPassword)
        S->>DB: REVOKE all other sessions (keep current)
        S-->>C: 200 OK
    end
```

---

## 8. Multi-Tenant / Branch Selection

```mermaid
sequenceDiagram
    participant C as Client
    participant S as Server
    participant DB as Database

    Note over C: User logs in with tenant context

    C->>S: POST /auth/login<br/>X-Tenant-ID: <tenantId><br/>{ email, password }
    S->>DB: SELECT user WHERE email = ?<br/>AND tenant_id = X-Tenant-ID
    S->>S: Sign JWT with institute_id

    Note over C: Switch tenant (Platform Admin only)

    C->>S: POST /auth/switch-tenant<br/>Authorization: Bearer <AT><br/>{ targetTenantId }
    S->>S: Verify user has access to target tenant
    S->>S: Re-sign JWT with new institute_id
    S-->>C: 200 OK<br/>{ accessToken }

    Note over C: Switch branch (within same tenant)

    C->>S: POST /auth/switch-branch<br/>Authorization: Bearer <AT><br/>{ targetBranchId }
    S-->>C: 200 OK<br/>{ accessToken }<br/>(branch_id embedded in JWT claims)
```

### Tenant Context in JWT

```json
{
  "sub": "usr_01JXXXXX",
  "institute_id": "inst_01JXXXXX",
  "branch_id": "branch_01JXXXXX",
  "role": "TENANT_ADMIN",
  "session_id": "sess_01JXXXXX",
  "force_password_change": false
}
```

> **Platform Admin Exception:** Platform Admin JWT carries NO `institute_id`. Guards detect this and skip tenant scoping.

---

## 9. Guard Hierarchy (Runtime)

```mermaid
flowchart LR
    R[Request] --> J[JwtAuthGuard]
    J --> T[TenantGuard]
    T --> F[ForcePasswordGuard]
    F --> RG[RolesGuard]
    RG --> PG[PermissionsGuard]
    PG --> H[Controller Handler]

    J -.->|Fail| J401[401 Unauthorized]
    T -.->|Fail| T403[403 Tenant Inactive]
    F -.->|Fail| F403[403 Force Password Change]
    RG -.->|Fail| R403[403 Forbidden]
    PG -.->|Fail| P403[403 Missing Permission]
```

| Guard                | Purpose                                             | Failure Code |
| -------------------- | --------------------------------------------------- | ------------ |
| `JwtAuthGuard`       | Verify RS256 signature + expiry                     | 401          |
| `TenantGuard`        | Extract institute_id, validate tenant active        | 403          |
| `ForcePasswordGuard` | Block if `force_password_change = true`             | 403          |
| `RolesGuard`         | Check role (`@Roles('TENANT_ADMIN')`)               | 403          |
| `PermissionsGuard`   | Check permission (`@Permissions('student.create')`) | 403          |

---

## 10. Session Table Schema (Reference)

```sql
CREATE TABLE login_sessions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    institute_id    UUID REFERENCES institutes(id),  -- NULL for Platform Admin
    refresh_token_hash VARCHAR(64) NOT NULL,         -- SHA-256
    device_info     JSONB,                           -- { os, browser, device, platform }
    ip_address      INET,
    last_used_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN DEFAULT FALSE,
    revoked_at      TIMESTAMPTZ,
    revoked_reason  VARCHAR(50),                     -- LOGOUT / ADMIN_REVOKE / THEFT / EXPIRED
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON login_sessions(user_id, is_revoked);
CREATE INDEX idx_sessions_rt_hash ON login_sessions(refresh_token_hash);
CREATE INDEX idx_sessions_expires ON login_sessions(expires_at) WHERE is_revoked = FALSE;
```

---

## 11. AuthEvent Logging

Every auth action must log to `AuthEvents` table for audit trail.

### Events Catalog

| Event Type               | Trigger                          | Payload                                               |
| ------------------------ | -------------------------------- | ----------------------------------------------------- |
| `LOGIN_SUCCESS`          | Successful password verification | `{ userId, tenantId, sessionId, ip, deviceInfo }`     |
| `LOGIN_FAILED`           | Wrong password or locked account | `{ email, ip, reason, attemptCount }`                 |
| `LOGOUT`                 | User-initiated logout            | `{ userId, sessionId }`                               |
| `TOKEN_REFRESHED`        | Successful token rotation        | `{ userId, sessionId, oldTokenFamily }`               |
| `TOKEN_REPLAY_DETECTED`  | Rotated token re-submitted       | `{ userId, sessionId, ip }` — triggers security alert |
| `PASSWORD_CHANGED`       | Authenticated password change    | `{ userId }`                                          |
| `PASSWORD_RESET_REQUEST` | Forgot password submitted        | `{ email }`                                           |
| `PASSWORD_RESET_SUCCESS` | Reset token consumed             | `{ userId }`                                          |
| `ACCOUNT_LOCKED`         | 5th consecutive failure          | `{ userId, email, ip, duration }`                     |
| `ACCOUNT_UNLOCKED`       | Auto-unlock or admin unlock      | `{ userId, reason }`                                  |
| `SESSION_REVOKED`        | Admin revokes user session       | `{ userId, sessionId, adminId, reason }`              |
| `MFA_CHALLENGE_PASSED`   | TOTP verification success        | `{ userId, sessionId }`                               |
| `MFA_CHALLENGE_FAILED`   | TOTP verification failed         | `{ userId, ip, attemptCount }`                        |
| `FORCE_PASSWORD_CHANGE`  | First login with temp password   | `{ userId }`                                          |

### Implementation Rules

- Events are **fire-and-forget** — never block the main flow
- Insert via Prisma inside the same transaction where possible
- `ip_address` and `user_agent` extracted from request context
- `LOGIN_FAILED` events do NOT require a valid userId (email-only is acceptable)

### Schema Reference

```sql
CREATE TABLE auth_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id       UUID REFERENCES institutes(id),  -- NULL if pre-tenant (e.g. login)
    user_id         UUID REFERENCES users(id),       -- NULL if not authenticated yet
    session_id      UUID,                            -- NULL if pre-session
    email           VARCHAR(255),
    event_type      VARCHAR(50) NOT NULL,            -- LOGIN_SUCCESS, LOGIN_FAILED, etc.
    ip_address      INET,
    user_agent      TEXT,
    details         JSONB,                           -- Additional context per event
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_auth_events_user ON auth_events(user_id, created_at);
CREATE INDEX idx_auth_events_type ON auth_events(event_type, created_at);
CREATE INDEX idx_auth_events_tenant ON auth_events(tenant_id, created_at);
```

---

## 12. Error Code Reference

| Code                     | HTTP Status | When                               |
| ------------------------ | ----------- | ---------------------------------- |
| `INVALID_CREDENTIALS`    | 401         | Email or password wrong            |
| `USER_SUSPENDED`         | 403         | Account deactivated by admin       |
| `ACCOUNT_LOCKED`         | 423         | 5+ failed attempts                 |
| `TOKEN_EXPIRED`          | 401         | Refresh token past expiry          |
| `TOKEN_REVOKED`          | 401         | Session logged out / revoked       |
| `SESSION_FAMILY_REVOKED` | 401         | Replay attack detected             |
| `MFA_REQUIRED`           | 202         | TOTP challenge needed              |
| `FORCE_PASSWORD_CHANGE`  | 403         | First login, must change password  |
| `WEAK_PASSWORD`          | 422         | Password doesn't meet complexity   |
| `PASSWORD_REUSED`        | 422         | Matches last 5 passwords           |
| `INVALID_TOKEN`          | 400         | Reset token invalid                |
| `TOKEN_ALREADY_USED`     | 400         | Reset token already consumed       |
| `TENANT_ACCESS_DENIED`   | 403         | User doesn't belong to this tenant |
| `MAX_SESSIONS_REACHED`   | 429         | 5 concurrent session limit         |

---

## 13. Quick Reference: Endpoint Summary

| Endpoint                | Method | Auth   | Rate Limit | Purpose                 |
| ----------------------- | ------ | ------ | ---------- | ----------------------- |
| `/auth/login`           | POST   | No     | 10/15min   | Authenticate user       |
| `/auth/refresh`         | POST   | Cookie | 60/hour    | Rotate tokens           |
| `/auth/logout`          | POST   | Yes    | —          | End current session     |
| `/auth/logout-all`      | POST   | Yes    | —          | End all sessions        |
| `/auth/forgot-password` | POST   | No     | 5/hour     | Send reset email        |
| `/auth/reset-password`  | POST   | No     | 5/hour     | Complete password reset |
| `/auth/change-password` | POST   | Yes    | —          | Change own password     |
| `/auth/me`              | GET    | Yes    | —          | Current user profile    |
| `/auth/sessions`        | GET    | Yes    | —          | List active sessions    |
| `/auth/switch-tenant`   | POST   | Yes    | —          | Switch tenant context   |
| `/auth/switch-branch`   | POST   | Yes    | —          | Switch branch context   |

---

> **Maintain this doc:** Update whenever auth flows change. Keep sequence diagrams in sync with implementation.
