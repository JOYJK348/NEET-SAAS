# Entity Discovery

Overview

# Entity Discovery

## Purpose

Entity Discovery is the process of identifying, organizing, and documenting the core business entities required to build the Coaching Management Platform.

An entity represents a real-world business object that the platform manages throughout its lifecycle.

The primary objective of this phase is to understand the business domain before designing the database, APIs, or application architecture.

This phase focuses only on business entities and their responsibilities. Technical implementation details are intentionally excluded.

---

# Objectives

- Understand the complete business domain.
- Identify core business entities.
- Organize entities into logical business domains.
- Define the responsibility of each entity.
- Establish clear ownership for every business object.
- Prepare the foundation for relationship discovery.
- Reduce future architectural changes.
- Support scalable database and API design.

---

# Discovery Principles

The following principles should be followed during Entity Discovery.

- Think from a business perspective, not a database perspective.
- Every entity should represent a meaningful business object.
- Avoid thinking about tables, columns, or foreign keys.
- Focus on business responsibilities instead of implementation.
- Keep entities independent and reusable.
- Group related entities into business domains.
- Ensure every entity has a clear purpose within the platform.

---

# Business Domains

The platform is divided into the following business domains.

| Domain                   | Description                                                                          |
| ------------------------ | ------------------------------------------------------------------------------------ |
| User Management          | Platform users, authentication, and user lifecycle.                                  |
| Institute Management     | Institute information, academic years, branches, and operational configuration.      |
| Academic Management      | Courses, batches, subjects, chapters, timetables, and academic planning.             |
| Student Management       | Student lifecycle, enrollment, attendance, and academic progress.                    |
| Parent Management        | Parent profiles, guardian relationships, and parent engagement.                      |
| Tutor Management         | Faculty management, teaching responsibilities, and tutor operations.                 |
| Learning Management      | Study materials, recorded classes, assignments, and learning resources.              |
| Assessment Management    | Mock tests, evaluations, results, rankings, and performance analysis.                |
| Communication Management | Announcements, notifications, reminders, and communication channels.                 |
| Reporting & Analytics    | Reports, dashboards, analytics, and institutional insights.                          |
| System Management        | Platform configuration, permissions, auditing, subscriptions, and system operations. |

---

# Documentation Structure

The detailed entity documentation is organized by business domain.

```text
architecture/
│
├── entity-discovery.md
│
└── entities/
    ├── user-management.md
    ├── institute-management.md
    ├── academic-management.md
    ├── student-management.md
    ├── parent-management.md
    ├── tutor-management.md
    ├── learning-management.md
    ├── assessment-management.md
    ├── communication-management.md
    ├── reporting-management.md
    └── system-management.md
```

---

# Entity Discovery Workflow

Business Requirements

↓

Business Modules

↓

Business Domains

↓

Business Entities

↓

Entity Responsibilities

↓

Relationship Discovery

↓

Database Design

↓

API Design

↓

Application Development

---

# Current Progress

## Completed

- Business Documentation
- Module Documentation
- Business Workflows
- User Roles
- Business Domains
- Entity Discovery

---

## Next Phase

- Relationship Discovery
- Entity Relationships
- Relationship Cardinality
- ER Diagram
- Database Design
- API Design

---

# Scope

This phase is limited to identifying business entities and documenting their responsibilities.

The following topics are intentionally excluded.

- Database Tables
- Database Columns
- Primary Keys
- Foreign Keys
- Indexes
- API Endpoints
- UI Components
- Technical Architecture
- Application Logic

These topics will be documented separately during the architecture and implementation phases.

---

# Deliverables

At the end of the Entity Discovery phase, the platform will have:

- Clearly defined business domains.
- Well-documented business entities.
- Defined entity responsibilities.
- Logical domain separation.
- A solid foundation for relationship discovery.
- A stable foundation for database and API design.

---

# Discussion Status

## Completed

- Business Domain Identification
- Entity Discovery
- Entity Classification
- Domain Documentation

---

## Pending

- Relationship Discovery
- Relationship Documentation
- ER Diagram
- Database Schema Design
- API Design
- Technical Architecture
