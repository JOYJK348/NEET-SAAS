# 🌐 Platform API Contract Specification

> **Module:** Platform Integration, API Routing & Gateway Contracts  
> **Schema Version:** 1.0  
> **Status:** 🟡 Draft  
> **Parent Architecture:** `docs/architecture/tech-stack.md`  

---

## 1. Global API Conventions

### 1.1 Base URL & Versioning
All API endpoints conform to RESTful path guidelines prefixed with the semantic versioning parameter:
```text
https://api.coachingplatform.com/api/v1
```

### 1.2 Global Headers
Requests must supply the following headers to pass authentication and multi-tenancy verification rules:

| Header | Type | Required | Description |
|---|---|---|---|
| `Authorization` | String | Yes | Bearer JWT Token (`Bearer <jwt_token>`) |
| `X-Tenant-ID` | UUID | Yes | Tenant Context Reference (`institute_id`) |
| `X-Branch-ID` | UUID | No | Active branch boundary filter context |
| `X-Correlation-ID`| UUID | No | Tracing correlation trace identifier |

---

## 2. Standardized Payloads

### 2.1 Unified Response Envelope
To maintain consistency across frontend integrations, all JSON payloads are wrapped in the standard response wrapper:

#### Success Response Envelope (200 OK / 201 Created)
```json
{
  "success": true,
  "data": {},
  "meta": {
    "timestamp": "2026-07-08T22:30:00Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  }
}
```

#### Error Response Envelope (4xx / 5xx)
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_FAILED",
    "message": "Input validation checks failed.",
    "details": [
      {
        "field": "phone",
        "issue": "Invalid phone number format."
      }
    ]
  },
  "meta": {
    "timestamp": "2026-07-08T22:30:00Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  }
}
```

---

### 2.2 Pagination, Filtering, Sorting & Search
GET endpoints returning list payloads use standardized query parameters:

```text
GET /api/v1/students?page=1&limit=25&sort=-created_at&search=John&filter[status]=ACTIVE
```

#### Parameters:
* `page`: Positive Integer (Default: `1`).
* `limit`: Page count constraint (Default: `25`, Max: `100`).
* `sort`: Comma-separated field names. Prefix with `-` for descending order (e.g. `-created_at,name`).
* `search`: Free-text fuzzy string matcher scoped by indexed search arrays (e.g. student names/roll numbers).
* `filter[field]`: Precise key-value filters matching database indexes (e.g. `filter[status]=ACTIVE`).

#### Paginated Metadata Envelope
```json
{
  "success": true,
  "data": [],
  "meta": {
    "pagination": {
      "currentPage": 1,
      "pageSize": 25,
      "totalPages": 10,
      "totalRecords": 248
    },
    "timestamp": "2026-07-08T22:30:00Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  }
}
```

---

## 3. Global Error Registry

| HTTP Status | Custom Error Code | Description / Triggers |
|---|---|---|
| **400 Bad Request** | `BAD_REQUEST`, `VALIDATION_FAILED` | Broken schema validation payloads |
| **401 Unauthorized** | `TOKEN_EXPIRED`, `INVALID_TOKEN` | Auth verification issues |
| **403 Forbidden** | `FORBIDDEN_RESOURCE`, `ROLE_MISMATCH`| Access boundary errors (RLS blocks) |
| **404 Not Found** | `RESOURCE_NOT_FOUND` | Missing ID lookups |
| **409 Conflict** | `DUPLICATE_ENTRY`, `RECORD_LOCKED` | Idempotency or DB unique constraints hit |
| **422 Unprocessable** | `BUSINESS_INVARIANT_VIOLATION` | State machine transition / logic error |

---

## 4. Domain Route Specifications

---

### 4.1 Institute Domain (01)

#### `POST /api/v1/institutes/onboard`
* **Purpose**: Onboard a new tenant institute and auto-provision the default administrative credentials.
* **Payload (Request DTO)**:
```json
{
  "name": "Elite NEET Academy",
  "category_id": "c71a3d12-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "sub_domain": "eliteneet",
  "admin_name": "Rajesh Kumar",
  "admin_email": "rajesh@eliteneet.com",
  "admin_phone": "+919876543210"
}
```
* **Validation**:
  * `sub_domain`: Matches regex `^[a-z0-9-]+$`.
  * `admin_email`: Valid email format.
* **Response DTO (201 Created)**:
```json
{
  "success": true,
  "data": {
    "institute_id": "f81a3e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
    "admin_user_id": "a12d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7b",
    "status": "ACTIVE"
  }
}
```

#### `GET /api/v1/institutes/branches`
* **Purpose**: List all branches inside the tenant context.
* **Response DTO (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "b12e3e1d-c0aa-43d9-a41a-7b3b4b5e6f7c",
      "name": "Adyar Branch",
      "code": "ADY-01",
      "status": "ACTIVE"
    }
  ]
}
```

---

### 4.2 User & Auth Domain (02)

#### `POST /api/v1/auth/login`
* **Purpose**: Authenticate user and issue access and refresh tokens.
* **Request DTO**:
```json
{
  "email": "rajesh@eliteneet.com",
  "password": "SecurePassword123!",
  "device_id": "device_fingerprint_hash"
}
```
* **Response DTO (200 OK)**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "expires_in": 900,
    "user": {
      "id": "a12d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7b",
      "name": "Rajesh Kumar",
      "email": "rajesh@eliteneet.com"
    }
  }
}
```
* **Security Note**: Refresh token is placed in an `HttpOnly`, `Secure`, `SameSite=Strict` cookie named `jid`.

#### `POST /api/v1/auth/refresh`
* **Purpose**: Rotate refresh token and issue new transient JWT keys.
* **Response DTO (200 OK)**:
```json
{
  "success": true,
  "data": {
    "access_token": "eyJhbGciOi...",
    "expires_in": 900
  }
}
```

---

### 4.3 Academic Domain (03)

#### `POST /api/v1/academics/batches`
* **Purpose**: Create a new academic batch allocation.
* **Request DTO**:
```json
{
  "course_id": "c12d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7b",
  "academic_year_id": "y99d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7c",
  "name": "NEET Morning Batch 2026",
  "code": "NEET-26-AM",
  "max_seats": 50
}
```
* **Response DTO (201 Created)**:
```json
{
  "success": true,
  "data": {
    "batch_id": "b88d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7c",
    "name": "NEET Morning Batch 2026",
    "seats_available": 50
  }
}
```

#### `GET /api/v1/academics/batches/:id/schedule`
* **Purpose**: Load scheduled timetable slots for a batch.
* **Response DTO (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "slot_id": "s11a3e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
      "subject_name": "Physics",
      "tutor_name": "Dr. Ramesh",
      "start_time": "09:00:00",
      "end_time": "10:30:00",
      "weekday": "MONDAY"
    }
  ]
}
```

---

### 4.4 Student Domain (04)

#### `POST /api/v1/students`
* **Purpose**: Create a new Student Profile record.
* **Request DTO**:
```json
{
  "first_name": "Aditya",
  "last_name": "Varma",
  "email": "aditya.v@gmail.com",
  "phone": "+918877665544",
  "guardian_name": "Sundar Varma",
  "guardian_phone": "+919988776655",
  "guardian_relationship": "FATHER",
  "admission_date": "2026-07-08",
  "initial_batch_id": "b88d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7c"
}
```
* **Response DTO (210 Created)**:
```json
{
  "success": true,
  "data": {
    "student_profile_id": "s99a3e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
    "admission_number": "ADY-2026-0089",
    "status": "ACTIVE"
  }
}
```

---

### 4.5 Attendance Domain (05)

#### `POST /api/v1/attendance/check-in`
* **Purpose**: Record a daily check-in event (supporting physical RFID/biometric or application-based check-in).
* **Request DTO**:
```json
{
  "student_profile_id": "s99a3e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
  "check_in_at": "2026-07-08T09:02:15Z",
  "device_id": "gate_scanner_01",
  "latitude": 13.0063,
  "longitude": 80.2574
}
```
* **Response DTO (201 Created)**:
```json
{
  "success": true,
  "data": {
    "attendance_record_id": "att123a3-c0aa-43d9-a41a-7b3b4b5e6f7a",
    "status": "PRESENT",
    "is_late": true
  }
}
```

---

### 4.6 Assessment Domain (06)

#### `POST /api/v1/assessments/attempts/:id/submit`
* **Purpose**: Submit an active CBT test attempt containing all answered questions.
* **Request DTO**:
```json
{
  "responses": [
    {
      "question_version_id": "q11a3e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
      "selected_answer": ["A"],
      "time_spent_seconds": 45
    }
  ],
  "proctoring_metadata": {
    "tab_switch_count": 2,
    "fullscreen_exit_count": 0,
    "camera_enabled": true
  }
}
```
* **Response DTO (200 OK)**:
```json
{
  "success": true,
  "data": {
    "attempt_id": "att99a3e-c0aa-43d9-a41a-7b3b4b5e6f7a",
    "status": "SUBMITTED",
    "submitted_at": "2026-07-08T12:00:00Z"
  }
}
```

---

### 4.7 Fee Management Domain (07)

#### `POST /api/v1/billing/payments/checkout`
* **Purpose**: Initialize a payment check-out transaction for tuition installments.
* **Request DTO**:
```json
{
  "student_fee_installment_id": "inst88d3-c0aa-43d9-a41a-7b3b4b5e6f7c",
  "payment_source": "ONLINE",
  "gateway_name": "RAZORPAY"
}
```
* **Response DTO (200 OK)**:
```json
{
  "success": true,
  "data": {
    "gateway_order_id": "order_FGH8923JKL",
    "amount": 25000.00,
    "currency": "INR"
  }
}
```

---

### 4.8 Communication Domain (08)

#### `POST /api/v1/notifications/dispatch`
* **Purpose**: Direct transactional notification queue dispatch.
* **Request DTO**:
```json
{
  "recipient_user_id": "u11d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7b",
  "template_name": "Fee Overdue Alert",
  "idempotency_key": "fee-alert-inst123",
  "priority": "HIGH",
  "payload": {
    "student_name": "Aditya Varma",
    "due_amount": "₹25,000"
  }
}
```
* **Response DTO (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "queue_id": "q12e3e1d-c0aa-43d9-a41a-7b3b4b5e6f7c",
    "status": "QUEUED"
  }
}
```

---

### 4.9 CRM Domain (09)

#### `POST /api/v1/crm/leads/convert`
* **Purpose**: Convert qualified pipeline lead into a registered Student Profile.
* **Request DTO**:
```json
{
  "lead_id": "l99d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7c",
  "target_batch_id": "b88d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7c",
  "initial_payment_verified": true
}
```
* **Response DTO (201 Created)**:
```json
{
  "success": true,
  "data": {
    "student_profile_id": "s99a3e1d-c0aa-43d9-a41a-7b3b4b5e6f7a",
    "conversion_id": "conv88d3-c0aa-43d9-a41a-7b3b4b5e6f7c"
  }
}
```

---

### 4.10 Reporting & Analytics Domain (10)

#### `POST /api/v1/reports/export`
* **Purpose**: Trigger an asynchronous data export.
* **Request DTO**:
```json
{
  "template_id": "rt55d3e1-c0aa-43d9-a41a-7b3b4b5e6f7c",
  "export_format": "XLSX",
  "filters": {
    "batch_id": "b88d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7c"
  }
}
```
* **Response DTO (202 Accepted)**:
```json
{
  "success": true,
  "data": {
    "export_id": "exp99a3e-c0aa-43d9-a41a-7b3b4b5e6f7a",
    "status": "PENDING"
  }
}
```

---

### 4.11 System Core Domain (11)

#### `POST /api/v1/system/files/upload`
* **Purpose**: Upload document metadata registry mapping.
* **Request DTO**:
```json
{
  "file_path": "admissions/ADY-2026-0089/marksheet.pdf",
  "mime_type": "application/pdf",
  "file_size_bytes": 1048576,
  "checksum": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"
}
```
* **Response DTO (201 Created)**:
```json
{
  "success": true,
  "data": {
    "file_id": "f88d3e1d-c0aa-43d9-a41a-7b3b4b5e6f7c",
    "upload_destination_s3_key": "raw/admissions/ADY-2026-0089/marksheet.pdf"
  }
}
```

---

## 5. Security & Verification Strategy
1. **Payload Signatures**: Webhook triggers must verify signature hashes using dynamic tenant keys (`secret_signing_key`).
2. **Access Token Lifetimes**: Strict 15-minute verification lifetimes verified against the central database blacklist registries on revocation events.
