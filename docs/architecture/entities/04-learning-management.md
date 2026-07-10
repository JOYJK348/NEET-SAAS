# Learning Management Domain

## Purpose

The Learning Management domain is responsible for organizing, delivering, and managing all learning resources provided by the coaching institute.

This domain enables tutors to distribute academic content efficiently while allowing students to access learning resources anytime throughout their academic journey.

The primary objective of this domain is to provide a centralized learning ecosystem that supports classroom teaching, self-learning, revision, and continuous academic improvement.

---

# Objectives

- Organize learning resources.
- Deliver study materials.
- Support classroom learning.
- Support self-learning.
- Improve revision experience.
- Manage assignments.
- Maintain learning resource history.
- Improve student learning outcomes.

---

# Business Entities

The following business entities belong to the Learning Management domain.

---

## Study Material

### Purpose

Represents academic learning resources shared with students.

### Business Responsibilities

- Organize learning resources.
- Publish study materials.
- Maintain academic content.
- Support syllabus completion.

---

## Learning Resource

### Purpose

Represents any digital or physical resource that supports learning.

### Examples

- PDF Notes
- Presentations
- Worksheets
- Formula Sheets
- Reference Documents
- Practice Questions

### Business Responsibilities

- Categorize resources.
- Improve accessibility.
- Support multiple learning formats.

---

## Assignment

### Purpose

Represents academic work assigned to students outside regular classroom sessions.

### Business Responsibilities

- Publish assignments.
- Track submissions.
- Evaluate learning progress.
- Encourage self-practice.

---

## Assignment Submission

### Purpose

Represents student responses submitted for assignments.

### Business Responsibilities

- Collect submissions.
- Maintain submission history.
- Support tutor evaluation.
- Track completion status.

---

## Learning Progress

### Purpose

Represents a student's progress while consuming learning resources.

### Business Responsibilities

- Monitor resource completion.
- Track assignment completion.
- Support academic insights.
- Identify inactive learners.

---

## Learning Path

### Purpose

Represents a curated sequence of learning materials (e.g., "NEET Physics Revision Path").

### Business Responsibilities

- Curate ordered material sequences.
- Support structured revision plans.
- Track completion progress.

---

## Learning Path Material

### Purpose

Bridge table linking a learning path to individual materials with display order.

### Business Responsibilities

- Order materials within a path.
- Allow material reuse across paths.

---

## Material Attachment

### Purpose

Represents files attached to learning materials (PDFs, images, videos).

### Business Responsibilities

- Store file metadata.
- Support multiple file types.
- Track file versioning.

---

# Cross-Domain References

The following entities belong to other domains but are referenced by the Learning domain.

## Recorded Class (Academic Domain)

Recorded Class is owned by the Academic Management domain. It is referenced within the Learning domain to support revision workflows, but its entity definition, lifecycle, and primary relationships are managed within Academic Management.

Refer to Academic Management domain for complete Recorded Class details.

---

# Learning Lifecycle

Prepare Learning Content

↓

Organize Resources (tag by subject/chapter)

↓

Assign to Batches (via material_assignments)

↓

Publish Resources

↓

Student Access (scoped to student_admission_id)

↓

Assignment Submission (scoped to student_admission_id)

↓

Tutor Review

↓

Learning Progress Tracking (scoped to student_admission_id)

↓

Continuous Revision

---

# Business Principles

- Every learning resource should belong to an academic structure (Subject → Chapter).
- Students should access only assigned resources.
- Tutors should manage only their assigned learning resources.
- Assignment completion should contribute to academic progress.
- All learning activity (progress, submissions, bookmarks, notes) is scoped to `student_admission_id`.
- Learning history should remain available throughout the course.
- Learning resources should support the institute syllabus.

---

# Current Scope

## Included

- Learning Material
- Material Attachment
- Learning Path
- Learning Path Material
- Assignment (Material with submission config)
- Assignment Submission
- Learning Progress
- Bookmark
- Note
- Discussion

---

## Future Enhancements

- AI Learning Recommendations
- Smart Content Suggestions
- Personalized Learning Paths
- Offline Downloads
- Bookmarking
- Resource Rating
- Learning Streaks
- AI-generated Notes
- Interactive Learning Modules

---

# Discussion Status

## Completed

- Learning Material (08.01)
- Material Attachment (08.02)
- Learning Path (08.03)
- Learning Path Material (08.04)
- Assignment (08.05 — material with submission config)
- Assignment Submission (08.11)
- Learning Progress (08.06 — scoped to student_admission_id)
- Bookmark (08.07)
- Note (08.08)
- Discussion (08.09)
- Material Assignments (08.10)

---

## Pending Discussion

- Version Management
- Content Approval Workflow
- Resource Sharing Permissions
- Assignment Auto Evaluation
- Digital Library
- Video Streaming Optimization
- Learning Analytics
- Content Lifecycle Management