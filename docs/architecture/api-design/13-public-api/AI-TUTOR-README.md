# AI Tutor & Automation API Contract Specification (13-ai-api)

This directory defines API routing contracts for the AI Tutor conversational engine.

---

## 1. POST /api/v1/ai/conversations

### Purpose

Start a new chat thread session with the AI Tutor.

### Security Notes

- Authentication Required: Yes
- Tenant Isolation: Enforced
- RLS Validation: Enforced (users can only access threads they created).

### Request DTO

```json
{
  "title": "Mitosis Cell division steps questions explanation"
}
```

### Response DTO (201 Created)

```json
{
  "success": true,
  "data": {
    "conversationId": "aconv891-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "title": "Mitosis Cell division steps questions explanation",
    "userId": "usr12345-c0aa-43d9-a41a-7b3b4b5e6f7a"
  }
}
```

---

## 2. POST /api/v1/ai/conversations/:id/messages

### Purpose

Post a new message to the conversation and generate an LLM response.

### Request Headers

- `Idempotency-Key`: UUID (Required. Prevents duplicate prompt generations).

### Request DTO

```json
{
  "prompt": "Explain the stages of Meiosis I"
}
```

### Response DTO (200 OK)

```json
{
  "success": true,
  "data": {
    "messageId": "amsg9901-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "role": "ASSISTANT",
    "content": "Meiosis I consists of Prophase I, Metaphase I, Anaphase I, and Telophase I...",
    "tokensConsumed": 420,
    "responseTimeMs": 1420
  }
}
```

---

## 3. POST /api/v1/ai/messages/:id/feedback

### Purpose

Submit user helpfulness feedback (thumbs rating) on an AI response.

### Request DTO

```json
{
  "ratingScore": 1, // 1 for Thumbs Up, -1 for Thumbs Down
  "comments": "Very detailed step-by-step breakdown!"
}
```

### Response DTO (200 OK)

```json
{
  "success": true,
  "message": "Feedback submitted successfully."
}
```
