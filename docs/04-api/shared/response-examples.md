# Standard Response Wrappers (shared/response-examples.md)

This document maps out standard response templates to ensure consistent JSON formats across all domains.

---

## 1. Success Response Envelope (200 OK / 201 Created)

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {},
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## 2. Error Response Envelope (4xx / 5xx)

```json
{
  "success": false,
  "message": "An error occurred during execution.",
  "data": null,
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": [
    {
      "field": "targetFieldName",
      "code": "ERROR_SUB_CODE",
      "message": "Description of why the request failed."
    }
  ]
}
```
