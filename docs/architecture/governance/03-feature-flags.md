# Feature Management Engine

This document defines the architecture, rules, and configuration schemas for tenant-based feature toggles, licensing tiers, and beta rollouts.

---

## 1. Core Purpose

The **Feature Management Engine** allows the platform to enable, disable, restrict, or gradually rollout functional segments of the application dynamically:

- **Module Licensing**: Restricting access to modules (like _Fees_ or _AI_) based on the tenant's paid subscription tier.
- **Beta Rollouts**: Restricting experimental elements (e.g., a new AI exam checker) to specific pilot branches or tenants.
- **Gradual Rollouts**: Enabling features to a percentage of users (e.g. 10% of students) to monitor system performance under load.

---

## 2. Feature Configurations Schema

Features are registered globally and overridden per tenant:

### 2.1 Global Features Registry

- `feature_key` (String): Unique identifier (e.g., `feat_ai_coach`).
- `description` (String): Business description.
- `state` (Enum): Lifecycle stage of the flag:
  - `ENABLED`: Globally active.
  - `DISABLED`: Globally turned off (bypasses overrides).
  - `BETA`: Restrictive testing phase.
  - `INTERNAL`: Only visible to super-admin development tenants.
  - `DEPRECATED`: Scheduled for removal, throws warnings.

### 2.2 Tenant Feature Overrides

Defines licensing allocations and overrides:

| Field                |  Type   | Description                                      |
| :------------------- | :-----: | :----------------------------------------------- |
| `override_id`        |  UUID   | Primary Key                                      |
| `tenant_id`          |  UUID   | FK references `institutes`                       |
| `feature_key`        | String  | Key code                                         |
| `is_enabled`         | Boolean | True/False override                              |
| `rollout_percentage` | Integer | Nullable value from 0 to 100 for gradual release |
| `tier_level`         |  Enum   | `'BASIC'`, `'ENTERPRISE'` plans                  |

---

## 3. Core Feature Flags

The system launches with these pre-defined flags:

| Feature Key            | Description                                                      | Module Mapped  |   State   |
| :--------------------- | :--------------------------------------------------------------- | :------------- | :-------: |
| `feat_ai_coach`        | Enables student AI Coach Chat interface                          | AI Assistant   |  `BETA`   |
| `feat_recorded_videos` | Enables upload & playback of video lecture records               | Learning       | `ENABLED` |
| `feat_billing`         | Enables payment gateways, receipt generators, fee configurations | Fees & Billing | `ENABLED` |
| `feat_whatsapp_alerts` | Enables dispatch of alerts via WhatsApp gateway                  | Communication  | `ENABLED` |
| `feat_online_class`    | Enables live online timetable scheduling                         | Academics      | `ENABLED` |

---

## 4. Evaluation Flow

Feature verification is integrated directly into the gateway routers, page rendering contexts, and API filters:

```text
Incoming API Call (e.g. GET /api/v1/ai/coach)
        │
        ▼
Resolve Tenant Override ('feat_ai_coach', tenant_id)
        │
  ┌─────┴──────────┐
  │ is_enabled =   │
  │     true?      ├────── NO ──────► Return 403 Forbidden (Feature Disabled)
  └──┬─────────────┘
     │ YES (Check State)
     ▼
  ┌──────────────────────────────────────────────┐
  │ State is DISABLED or DEPRECATED?             ├─ YES ─► Block or Throw Warning
  └──┬───────────────────────────────────────────┘
     │ NO (State is ENABLED or BETA)
     ▼
  ┌────────────────┐
  │ Check Rollout  │
  │  percentage?   ├────── FAIL ────► Return 403 Forbidden (Not in rollout tier)
  └──┬─────────────┘
     │ PASS (e.g., User ID falls in targeted percent range)
     ▼
Execute Service Logic
```

- **Frontend Cache**: Feature flags are loaded during the initial user session fetch and cached globally in the UI state (e.g. Redux / Zustand) to instantly hide/show menu items in the dynamic sidebar matching [Menu Master Configuration](file:///d:/FreeLance/NEET_platform/docs/architecture/authorization/01-menu-master.md).
