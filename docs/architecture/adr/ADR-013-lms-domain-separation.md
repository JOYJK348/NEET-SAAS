# ADR-013: LMS Domain Separation and Content Publishing Workflow

## Context and Problem Statement

Initially, all educational resources and live stream setups were mapped directly inside the `03-academic` scheduling domain. As the platform transitions to support rich LMS configurations (study sheets, self-paced assignment submissions, videos progress tracking, and interactive video playback), maintaining these operations in Academic creates a high risk of query latency and schema bloat.

Additionally, standard CRUD models that allow tutors to edit live learning contents immediately without administrative checks cause operational confusion when students are actively taking tests or assignments.

## Decision Drivers

- **DDD Isolation**: Core schedules (class slots, batches boundaries, room reservations) must exist independently of self-paced curriculum delivery assets.
- **Publishing Control**: Tutors require draft workspaces to author materials, check attachments, and submit questions for coordinator approval before showing them to students.
- **Performance**: High-frequency telemetry (watching video seconds, slide page checks) must not block student records tables.

## Decision Outcome

Chosen Option: **Create Dedicated LMS Domain (12-lms.md) and implement Draft-to-Publish Workflow States**.

### Consequences

- **Domain Decoupling**: Academic (`03-academic.md`) owns core course metadata and timetables. LMS (`12-lms.md`) attaches chapters, topics, study materials, and assignments to these subjects.
- **Workflow Protection**: `study_materials` and `assignments` carry `publish_status` enums (`DRAFT`, `REVIEW`, `APPROVED`, `PUBLISHED`, `ARCHIVED`). Items are invisible to students until status is explicitly set to `PUBLISHED`.
- **Relational Integrity**: Deletion of a chapter or topic blocks if active assignment submissions or progress records reference it.
