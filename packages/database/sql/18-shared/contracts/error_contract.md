# Shared Error Contract

## Standard Error Response Format

Every API error response must follow this structure across backend, frontend, Flutter, Android, and iOS:

```json
{
  "success": false,
  "error": {
    "code": "AUTH_001",
    "message": "Invalid credentials",
    "detail": "Email or password is incorrect.",
    "http_status": 401,
    "correlation_id": "uuid",
    "timestamp": "2026-07-12T14:30:00Z"
  }
}
```

## Fields

| Field            | Type   | Required | Description                                         |
| ---------------- | ------ | -------- | --------------------------------------------------- |
| `code`           | String | Yes      | Error code from `error_codes` table (e.g. AUTH_001) |
| `message`        | String | Yes      | Human-readable error summary                        |
| `detail`         | String | No       | Detailed error description for debugging            |
| `http_status`    | Int    | Yes      | HTTP status code (100-599)                          |
| `correlation_id` | UUID   | Yes      | Trace identifier for request correlation            |
| `timestamp`      | String | Yes      | ISO 8601 UTC timestamp                              |

## Error Code Format

```
{MODULE}_{NNN}
```

- Module prefix: `AUTH`, `USER`, `AUTHZ`, `EXAM`, `FEE`, `WF`, `FILE`, `API`, `COMMON`
- Numeric: Zero-padded 3-digit sequential number

## Resolution

Backend:

```sql
SELECT * FROM fn_get_error('AUTH_001');
```

Returns `(code, module, message, detail, http_status)` for constructing the response.
