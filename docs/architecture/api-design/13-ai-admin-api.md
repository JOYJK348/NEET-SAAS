# AI Administration API Contract Specification (13-ai-admin-api)

This directory defines administrative routing contracts for managing LLMs configs and prompt versions templates.

---

## 1. LLM Provider configurations

### GET /api/v1/ai-admin/providers
*   **Purpose**: List all configured LLM providers.
*   **Permission**: `ai:providers:read` (Super Admin Only)
*   **Response DTO (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "id": "d0000000-0000-0000-0000-000000000001",
      "code": "DEEPSEEK",
      "name": "DeepSeek LLM Gateway API",
      "isActive": true
    }
  ]
}
```

### GET /api/v1/ai-admin/models
*   **Purpose**: List all model profiles per provider.
*   **Response DTO (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "code": "DEEPSEEK_CHAT",
      "name": "DeepSeek Chat Reasoner V3",
      "contextWindowTokens": 64000,
      "inputTokenPriceUsd": 0.1400,
      "outputTokenPriceUsd": 0.2800,
      "isActive": true
    }
  ]
}
```

---

## 2. Dynamic Prompt Manager

### POST /api/v1/ai-admin/prompts
*   **Purpose**: Create or update system prompts and variables.
*   **Request DTO**:
```json
{
  "code": "EXPLAIN_QUESTION",
  "name": "Explain NEET MCQ Question Prompts Template",
  "systemPrompt": "You are an expert NEET Medical entrance coach. Explain the question step-by-step focusing on core scientific principles.",
  "userTemplate": "Question: {{question_body}}",
  "versionNumber": 2
}
```
*   **Response DTO (201 Created)**:
```json
{
  "success": true,
  "data": {
    "promptId": "prm99a0-bf99-4d6a-8d1a-6b4b5e6f7a3f",
    "code": "EXPLAIN_QUESTION",
    "versionNumber": 2
  }
}
```

---

## 3. Usage & Token audit tracking

### GET /api/v1/ai-admin/usage
*   **Purpose**: Retrieve daily tokens usage logs per tenant.
*   **Response DTO (200 OK)**:
```json
{
  "success": true,
  "data": [
    {
      "userId": "3b000000-0000-0000-0000-000000000100",
      "usageDate": "2026-07-10",
      "tokensConsumed": 14250,
      "requestsCount": 18
    }
  ]
}
```
推广
