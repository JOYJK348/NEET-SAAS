# Policy Engine Configuration

This document specifies the global and tenant-specific business rules, limits, and runtime validation parameters of the platform.

---

## 1. Scope & Core Difference

Unlike authorization (which validates *who* can do an action), the **Policy Engine** evaluates **business constraints and rules** (*how* actions must behave based on environment context, values, or metrics).

```text
+-----------------------+
|  Authentication Guard |  (Who are you?)
+-----------+-----------+
            |
+-----------v-----------+
|  Authorization Guard  |  (Do you have the permission scope?)
+-----------+-----------+
            |
+-----------v-----------+
|   Policy Guard Room   |  (Does this request satisfy business limits?)
+-----------------------+
```

---

## 2. Policy Definitions Schema

All settings parameters must map to a standardized `policy_settings` database schema:

| Field | Type | Description |
|:---|:---:|:---|
| `policy_key` | String | Unique setting key (e.g. `auth.otp.expiry_seconds`) |
| `data_type` | Enum | `'INTEGER'`, `'DECIMAL'`, `'BOOLEAN'`, `'STRING'` |
| `default_value` | String | Fallback value if no override is configured |
| `global_override` | String | Nullable platform-wide override |
| `tenant_override` | String | Nullable tenant-specific override |
| `priority` | Integer | Resolution precedence order (higher values override default) |

### 2.1 Default Policy Registry

| Policy Key | Data Type | Default Value | Priority | Description |
|:---|:---:|:---:|:---:|:---|
| `auth.password.min_length` | `INTEGER` | `8` | 1 | Minimum password characters |
| `auth.otp.expiry_seconds` | `INTEGER` | `300` | 1 | Time OTP remains valid (5 mins) |
| `auth.session.timeout_minutes` | `INTEGER` | `120` | 1 | Time before idle session invalidates (2 hours) |
| `api.rate_limit.max_rpm` | `INTEGER` | `100` | 1 | Max requests per minute per IP |
| `academic.attendance.tolerance` | `DECIMAL` | `75.00` | 1 | Minimum attendance percentage for exam entry |
| `exams.cbt.max_attempts` | `INTEGER` | `3` | 1 | Maximum times a student can attempt mock exams |
| `exams.publish.lead_hours` | `INTEGER` | `24` | 1 | Hours in advance an exam schedule must be published |
| `billing.overdue.tolerance_days` | `INTEGER` | `15` | 1 | Grace period days allowed for fee arrears |

---

## 3. Policy Evaluation Logic & Priority Resolution

When an API requests policy limits evaluation, the Policy Engine resolves values using the following **Priority Hierarchy**:

```text
       [1st Priority: Global Override] (If set, applies to all tenants)
                      │
                      ▼
       [2nd Priority: Tenant Override] (Specific tenant configuration)
                      │
                      ▼
       [3rd Priority: Default Value] (Default base parameter fallback)
```

### 3.1 Resolution Function
```typescript
function resolvePolicyValue(policyKey: string, tenantId: string): string {
    const policy = db.policy_settings.findOne({ key: policyKey });
    
    if (policy.global_override !== null) {
        return policy.global_override;
    }
    
    const tenantPolicy = db.tenant_policy_overrides.findOne({ tenant_id: tenantId, key: policyKey });
    if (tenantPolicy && tenantPolicy.override_value !== null) {
        return tenantPolicy.override_value;
    }
    
    return policy.default_value;
}
```

### 3.2 Example: CBT Exam Attempt Check
When a student initiates an exam attempt:
1. System queries resolved policy value: `resolvePolicyValue('exams.cbt.max_attempts', tenant_id)`.
2. System queries attempts count:
   `SELECT count(*) FROM exam_attempts WHERE student_id = :student_id AND exam_id = :exam_id`.
3. If `attempts >= max_attempts`, the attempt is blocked with an error code `422 Unprocessable Entity` (Limit Exceeded).
