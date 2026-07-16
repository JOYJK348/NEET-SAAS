# Platform & Infrastructure API Contract Specification (14-platform-api)

This directory defines API routing contracts for cross-cutting platform infrastructure services.

---

## 1. Tenant Settings Configuration

### GET /api/v1/platform/settings

- **Purpose**: Fetch locale, timezone, password policies configurations for the active tenant.
- **Permission**: `tenant:settings:read` (Tenant Admin only)
- **Response DTO (200 OK)**:

```json
{
  "success": true,
  "data": {
    "id": "a1400000-0000-0000-0000-000000000001",
    "timezone": "Asia/Kolkata",
    "currency": "INR",
    "locale": "en-IN",
    "sessionTimeoutSeconds": 7200
  }
}
```

### PUT /api/v1/platform/settings

- **Purpose**: Update active settings parameters.
- **Request Headers**:
  - `If-Match`: Integer (Required for Optimistic Locking)
- **Request DTO**:

```json
{
  "timezone": "Asia/Kolkata",
  "currency": "INR",
  "locale": "en-IN",
  "sessionTimeoutSeconds": 3600
}
```

---

## 2. Feature Flags Management

### GET /api/v1/platform/features

- **Purpose**: Retrieve custom modules status flags.
- **Response DTO (200 OK)**:

```json
{
  "success": true,
  "data": [
    {
      "code": "AI_TUTOR",
      "name": "AI Tutor access switch",
      "isEnabled": true
    }
  ]
}
```

### PATCH /api/v1/platform/features/:code

- **Purpose**: Toggle feature activation switch.
- **Request DTO**:

```json
{
  "isEnabled": false
}
```

---

## 3. Storage objects & chunked Uploads

### POST /api/v1/platform/files/presign

- **Purpose**: Generate short-lived pre-signed destination URL to upload file binaries directly to S3/R2 storage.
- **Request DTO**:

```json
{
  "fileName": "profile_image.png",
  "mimeType": "image/png",
  "fileSizeBytes": 524288
}
```

- **Response DTO (201 Created)**:

```json
{
  "success": true,
  "data": {
    "fileId": "so8812a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "uploadUrl": "https://r2.neetplatform.com/tenant-123/profile_image.png?X-Amz-Signature=...",
    "objectKey": "tenant-123/profile_image.png"
  }
}
```

---

## 4. Background Job Queue Manager

### POST /api/v1/platform/jobs

- **Purpose**: Queue a long-running operational task (e.g. Bulk result PDF generation).
- **Request Headers**:
  - `Idempotency-Key`: UUID (Required. Prevents duplicate job creation).
- **Request DTO**:

```json
{
  "jobType": "GENERATE_REPORT",
  "priority": 2,
  "payload": {
    "reportType": "ACADEMICS_SUMMARY",
    "batchId": "b11a000-bf99-4d6a-8d1a-6b4b5e6f7a3f"
  }
}
```

- **Response DTO (202 Accepted)**:

```json
{
  "success": true,
  "data": {
    "jobId": "job990a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "status": "PENDING"
  }
}
```
