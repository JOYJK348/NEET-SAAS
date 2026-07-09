# GET /api/v1/auth/me

### Purpose
Returns profile information and permissions for the authenticated user session.

### Permission
None (Active session required).

### Response DTO
```json
{
  "success": true,
  "message": "User context retrieved.",
  "data": {
    "userId": "u71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "email": "tutor@eliteneet.com",
    "name": "Rajesh Kumar",
    "roleCode": "TUTOR",
    "profilePictureUrl": "https://storage.eliteneet.com/files/v1/avatar.jpg",
    "department": "Physics Dept",
    "designation": "Senior Lecturer",
    "timezone": "Asia/Kolkata",
    "language": "en",
    "permissions": [
      "lms:material:publish",
      "lms:chapter:read"
    ]
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

# GET /api/v1/auth/sessions

### Purpose
Lists all active sessions for the user account.

### Permission
None (Active session required).

---

## DELETE /api/v1/auth/sessions/{id}

### Purpose
Revokes a specific active session.

### Business Rules
*   Cannot revoke the current session (the session used to send this delete call) via this endpoint. The client must call `POST /auth/logout` to terminate the active session.

---

# POST /api/v1/auth/switch-tenant

### Purpose
Switches active tenant scope, returning a new JWT with updated claims if authorized.

### Request DTO
```json
{
  "tenantId": "i92a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
}
```

### Business Rules
1.  **Authorization**: Verifies the user has a valid role for the target `tenantId` in `user_tenant_roles` table.
2.  **Invalidate & Reissue**: Invalidates the old JWT, reissues a new JWT containing the target tenant claim permissions, and evicts old permission cache in Redis.

---

# POST /api/v1/auth/switch-branch

### Purpose
Switches active branch filter context scope inside JWT.

### Request DTO
```json
{
  "branchId": "b12a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f"
}
```
