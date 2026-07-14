# 08 — System Management ERD

## Purpose

The Entity Relationship Diagram (ERD) for the **System Management** domain defines the logical relationships between system administration entities within the Coaching Management Platform.

This ERD converts the completed business relationship discovery into a structured data model that will serve as the foundation for database schema design, API development, and application implementation.

The System Management domain provides the governance, security, licensing, monitoring, and operational backbone of the platform.

---

# ERD Scope

This ERD includes the following entities:

- Institute
- User
- Role
- System Configuration
- Permission
- Subscription
- License
- Feature Flag
- Login Session
- System Notification
- Audit Log
- Activity Log
- Backup
- Storage
- Study Material
- Recorded Class

---

# Entity Relationships

## Institute

- Has one active Subscription
- Has one active License
- Has one active System Configuration
- Has many Audit Logs
- Has many Activity Logs
- Has many Backups
- Has one Storage allocation
- Receives System Notifications (through Users)

---

## User

- Belongs to one Institute
- Assigned one Role
- Has many Login Sessions
- Has many Audit Logs
- Has many Activity Logs
- Receives many System Notifications

---

## Role

- Has many Users
- Has many Permissions

---

## Permission

- Belongs to one Role

---

## System Configuration

- Belongs to one Institute

---

## Subscription

- Belongs to one Institute
- Has one License

---

## License

- Belongs to one Subscription
- Assigned to one Institute
- Has many Feature Flags

---

## Feature Flag

- Belongs to one License

---

## Login Session

- Belongs to one User

---

## System Notification

- Belongs to one User

---

## Audit Log

- Belongs to one Institute
- Belongs to one User

---

## Activity Log

- Belongs to one Institute
- Belongs to one User

---

## Backup

- Belongs to one Institute

---

## Storage

- Belongs to one Institute
- Monitors Study Material storage usage
- Monitors Recorded Class storage usage

---

## Study Material

- Storage usage monitored by Storage

---

## Recorded Class

- Storage usage monitored by Storage

---

# ERD Diagram

```text
Platform
│
├─────────────────────────────────────────────┐
│                                             │
▼                                             ▼
Institute ---------------------------- User
│   │   │   │   │   │                │
│   │   │   │   │   │                ├────────────── Login Session
│   │   │   │   │   │                │
│   │   │   │   │   │                ├────────────── Audit Log
│   │   │   │   │   │                │
│   │   │   │   │   │                ├────────────── Activity Log
│   │   │   │   │   │                │
│   │   │   │   │   │                └────────────── System Notification
│   │   │   │   │   │
│   │   │   │   │   └────────────────────────────── Audit Log
│   │   │   │   │
│   │   │   │   └────────────────────────────────── Activity Log
│   │   │   │
│   │   │   └────────────────────────────────────── Backup
│   │   │
│   │   └────────────────────────────────────────── Storage
│   │                                              ├──────── Study Material
│   │                                              └──────── Recorded Class
│   │
│   ├────────────────────────────────────────────── Subscription
│   │                                               │
│   │                                               ▼
│   │                                            License
│   │                                               │
│   │                                               ▼
│   │                                        Feature Flag
│   │
│   └────────────────────────────────────────────── System Configuration
│
└────────────────────────────────────────────────── Role
                                                    │
                                                    ▼
                                              Permission
```

---

# Cardinality Summary

| Parent Entity | Relationship | Child Entity         |
| ------------- | ------------ | -------------------- |
| Institute     | 1 → 1        | Subscription         |
| Institute     | 1 → 1        | License              |
| Institute     | 1 → 1        | System Configuration |
| Institute     | 1 → N        | Audit Log            |
| Institute     | 1 → N        | Activity Log         |
| Institute     | 1 → N        | Backup               |
| Institute     | 1 → 1        | Storage              |
| User          | 1 → N        | Login Session        |
| User          | 1 → N        | Audit Log            |
| User          | 1 → N        | Activity Log         |
| User          | 1 → N        | System Notification  |
| Role          | 1 → N        | User                 |
| Role          | 1 → N        | Permission           |
| Subscription  | 1 → 1        | License              |
| License       | 1 → N        | Feature Flag         |
| Storage       | Monitors     | Study Material       |
| Storage       | Monitors     | Recorded Class       |

---

# Design Notes

- System Configuration centralizes institute-level operational settings.
- Subscription controls commercial access for an institute.
- License defines available platform capabilities.
- Feature Flags enable or disable licensed functionality.
- Permissions are assigned through Roles to support RBAC.
- Login Sessions track authenticated user access.
- Audit Logs maintain immutable security and compliance records.
- Activity Logs capture user interaction history for analytics.
- Storage monitors digital content usage without owning learning resources.
- Backup ensures business continuity and disaster recovery.
- System Notifications communicate platform-level operational events to users.
- **Jitsi Video Recording Lifecycle Policy (Non-Negotiable):**
  1. **Local SSD Buffer only:** Jitsi recording droplet SSD is a _temporary buffer_, not storage.
  2. **Auto-Transcode Trigger:** Jitsi's recording engine (jibri) script must immediately trigger FFmpeg compression (1080p -> 720p) upon class termination.
  3. **Auto-Upload to Cloudflare R2:** Transcoded files must be streamed to Cloudflare R2 immediately using the AWS S3 Node SDK.
  4. **Strict Local Deletion:** Upon receiving a successful upload response from R2 (e.g. valid ETag), the script must execute `rm -f` on both the raw local recording and the compressed file _immediately_.
  5. **Watchdog Cron:** A lightweight shell daemon script must run every 30 minutes. If droplet disk space exceeds 80%, it must force-terminate stale conversion tasks, wipe orphaned `.tmp` video buffers, and trigger a priority email notification to the Platform Admin.

---

# Status

✅ Relationship Discovery Completed

✅ System ERD Completed

➡️ Next Phase: Database Schema Design
