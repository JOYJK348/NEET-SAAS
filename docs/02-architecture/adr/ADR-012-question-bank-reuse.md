# ADR-012: Reusable Question Bank Strategy

## Context and Problem Statement

Initially, questions and their dynamic version revisions were modeled within the `06-assessment` exam schema, tightly coupled with generated papers.

As the platform expands to support self-paced Homework, interactive Quizzes, and personalized AI assessments within the `12-lms` domain, the system needs to reuse the same database of questions. Redefining separate question models for LMS assignments causes database duplication and fragments the AI performance telemetry (which evaluates learning outcomes across both exams and homework).

## Decision Drivers

- **Code Reusability**: Questions, version revisions, options mapping, and solution guides should be created once and shared across exams, assignments, and practice sessions.
- **Unified Analytics**: The AI engine needs to evaluate performance scores (`difficulty_index`, `bloom_taxonomy`, success rates) globally across all evaluation touchpoints.
- **Relational Integrity**: Junction tables mapping questions to papers/assignments must lock historical keys to prevent revisions from breaking completed submissions.

## Considered Options

1. **Decoupled Question Bank**: Keep a unified, normalized questions catalog in the Assessment Domain (`06-assessment.md`) that maps questions to chapter/topic nodes and serves as a provider to both `assessment_paper_questions` and `assignment_questions` junctions.
2. **Duplicated Mappings**: Create separate tables for exam questions and assignment questions.

## Decision Outcome

Chosen Option: **Option 1 (Decoupled Question Bank)**.

### Consequences

- **Normalized Core**: `questions` and `question_versions` function as the global master question catalog.
- **Transactional Snapshots**: Dynamic homework runs in `12-lms` link to `question_versions.id` using the junction `assignment_questions`, matching the snapshot strategy of `assessment_paper_questions`.
- **Integrity**: Deletion of a question version is prohibited if active exam papers or homework instances reference it.
