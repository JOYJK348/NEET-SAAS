# ADR-011: Academic vs. LMS Domain Separation

## Context and Problem Statement

Initially, all academic schedules and digital learning contents (timetables, classes, study materials, video recordings, assignments) were designed inside a single unified `03-academic` domain. 

As the platform scales to handle extensive Learning Management System (LMS) capabilities, keeping curriculum resources, student progress tracking, live streams, and recorded videos inside Academic violates the Domain-Driven Design (DDD) Single Responsibility Principle. It risks turning the Academic schema into a "monster domain," degrading table indexing performance and causing merge conflicts across engineering teams.

## Decision Drivers

- **Domain Isolation**: Core scheduling (curriculum outlines, timetables, tutor allocations) belongs to general administration. Digital resource delivery (videos, files, assignment submissions) represents self-paced student consumption.
- **Maintainability**: Modifying LMS resource parameters should not require changes to active classroom timetables.
- **Scalability**: High-frequency writes (watching video progress, assignment submissions, live chat participation logs) must be isolated from critical transactional schedules.

## Considered Options

1. **Keep Unified Domain (03-academic)**: Save all timetables and LMS materials in the Academic schema.
2. **Create Dedicated LMS Domain (12-lms)**: Separate curriculum definitions and class slots in `03-academic` from content hosting, streaming logs, and learning progress tracking in `12-lms`.

## Decision Outcome

Chosen Option: **Option 2 (Create Dedicated LMS Domain - 12-lms.md)**.

### Consequences

- **Domain Boundaries**: `03-academic` owns `courses`, `subjects`, `batches`, and `timetable_slots`. `12-lms` references these boundaries to attach dynamic chapters, topics, study materials, live streams, and assignments.
- **Database Decoupling**: Learning progress and engagement histories are saved in dedicated LMS tables, keeping the core scheduling transactions clean.
- **Clear File Boundaries**: LMS content refers exclusively to `file_version_id` points inside `11-system` storage registries, decoupling the learning engine from direct cloud storage logic.
