# Custom API Error Code Registry (shared/common-errors.md)

This document contains reusable custom error code lists and envelopes that endpoints reference to specify error states.

---

## 1. Global Custom Error Code Registry

| HTTP Status               | Custom Error Code       | Description / Trigger Case                            | Actionable Fix for Frontend Client           |
| ------------------------- | ----------------------- | ----------------------------------------------------- | -------------------------------------------- |
| **400 Bad Request**       | `BAD_REQUEST`           | Base validation failure, malformed payload structure. | Correct schema type bindings.                |
| **400 Bad Request**       | `VALIDATION_FAILED`     | Dynamic form field constraint violations.             | Display structural inline validations.       |
| **401 Unauthorized**      | `TOKEN_EXPIRED`         | Access Token has expired.                             | Initiate `POST /auth/refresh` request.       |
| **401 Unauthorized**      | `INVALID_TOKEN`         | Token checksum/signing key fails verification.        | Force logout and clear session state.        |
| **401 Unauthorized**      | `INVALID_CREDENTIALS`   | Incorrect username, email, or password combination.   | Prompts user to retry or reset credentials.  |
| **403 Forbidden**         | `FORBIDDEN_RESOURCE`    | User lacks permission scopes to view resource.        | Display "Access Denied" page.                |
| **403 Forbidden**         | `ROLE_MISMATCH`         | Action not allowed for current role context.          | Request target elevation credentials.        |
| **404 Not Found**         | `RESOURCE_NOT_FOUND`    | Database query lookup fails for given key ID.         | Prompt resource deleted notification.        |
| **409 Conflict**          | `DUPLICATE_ENTRY`       | Fails unique indexing check (e.g. duplicate code).    | Display uniqueness check notification.       |
| **409 Conflict**          | `RECORD_LOCKED`         | Concurrency optimistic edit conflict check fails.     | Force refresh dashboard to merge updates.    |
| **422 Unprocessable**     | `INVARIANT_VIOLATION`   | Business logic rules validation failed.               | Present explicit system violation message.   |
| **429 Too Many Requests** | `RATE_LIMIT_EXCEEDED`   | Rate limit exceeded threshold.                        | Delay request execution (Wait / Retry).      |
| **500 Internal**          | `INTERNAL_SERVER_ERROR` | System crash, database timeout, network outage.       | Inform user: "Under maintenance. Try later". |

---

## 2. Standardized Validation Error Subcodes

These error codes are returned inside the dynamic details list of a `VALIDATION_FAILED` block:

- `VALIDATION_REQUIRED`: Missing a required payload field.
- `VALIDATION_LENGTH`: String value length falls outside allowed constraints.
- `VALIDATION_FORMAT`: Input fails regex validator mapping checks (e.g. phone, email).
- `VALIDATION_RANGE`: Numeric value falls outside acceptable range parameters.
- `VALIDATION_UNIQUE`: Key value duplicates an active database record.
