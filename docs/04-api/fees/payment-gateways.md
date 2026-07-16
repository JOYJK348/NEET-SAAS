# Payment Gateways API Specification (08-fee-api/payment-gateways.md)

This document defines endpoints for integrating online checkout platforms (Razorpay/Stripe).

---

## POST /api/v1/payment-gateways/checkout-session

### Purpose

Generates a secure online gateway checkout session redirect token.

### Permission

`student:exam:attempt`

### Security Notes

- Authentication Required: Yes
- Required RBAC Permission: None (Any active student/parent role context can purchase).
- Tenant Isolation: Enforced
- Branch Isolation: Not Applicable
- RLS Validation: Enforced
- Sensitive Fields Masked: No.

### Request DTO

```json
{
  "invoiceId": "inv092a-bf99-4d6a-8d1a-6b4b5e6f7a3f",
  "installmentId": "inst02a-bf99-4d6a-8d1a-6b4b5e6f7a3f"
}
```

### Business Rules

- Requests checkout token signatures from payment provider (Stripe/Razorpay API).

### Response DTO (201 Created)

```json
{
  "success": true,
  "message": "Checkout session generated.",
  "data": {
    "gatewaySessionId": "cs_stripe_0891d",
    "checkoutUrl": "https://checkout.stripe.com/pay/cs_stripe_0891d"
  },
  "meta": {
    "timestamp": "2026-07-09T03:00:00.000Z",
    "correlationId": "f78a2e1d-c0aa-43d9-a41a-7b3b4b5e6f7a"
  },
  "errors": null
}
```

---

## POST /api/v1/payment-gateways/webhooks

### Purpose

Receives and processes online transaction confirmation payloads from the payment gateway.

### Permission

None (Public gateway access verified via secret signing key signatures).

### Security Notes

- Authentication Required: No
- Required RBAC Permission: None
- Tenant Isolation: Not Applicable (Resolved from payload transaction reference metadata).
- Branch Isolation: Not Applicable
- RLS Validation: Enforced on internal updates.
- Sensitive Fields Masked: No.

### Request Headers

- `X-Razorpay-Signature` / `Stripe-Signature`: String (Required. Hashed signature for validation).

### Request DTO

Raw JSON payload from the payment provider (Stripe/Razorpay).

### Business Rules

1.  **Signature Verification**: The gateway must verify the webhook signature using the configured signing secret. If signature verification fails, return `400 Bad Request`.
2.  **Idempotency (Webhook replay prevention)**: Checks if the transaction reference already exists in the database. If it exists, return `200 OK` (success) immediately to prevent duplicate credit entries.
3.  **Credit recording**: Processes successful transaction events by creating a ledger entry in the `payments` table and updating the balance status of the target invoice.

### Database Tables Affected

- `payments` (Insert)
- `invoices` (Update balances status)
