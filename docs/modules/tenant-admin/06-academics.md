# Academics

## Module Overview

The Academics module is responsible for planning, organizing, and managing the complete academic structure of the coaching institute.

This module serves as the foundation of the institute's academic operations by organizing courses, batches, subjects, faculty allocation, timetables, live classes, and academic planning.

The objective of this module is to ensure that academic activities are well-structured, consistently delivered, and effectively monitored throughout the academic year.

---

# Objectives

- Plan the institute's academic structure.
- Create and manage academic courses.
- Organize students into batches.
- Manage academic subjects.
- Assign tutors to academic responsibilities.
- Plan and manage live academic sessions.
- Schedule academic activities.
- Monitor academic progress.
- Ensure smooth academic operations.

---

# Academic Structure

The academic hierarchy of the coaching institute follows the structure below.

```text
Institute
    │
    ▼
  Course
  ├──────────────────────► Subject  ←── defined at Course level
  │                            │
  │                            ▼
  │                         Chapter
  │
  └──────────► Batch
                  │
                  ▼
            Timetable
                  │
                  ▼
            Live Class  ←── references Subject + Chapter

Tutor Assignment ──► (Course + Batch + Subject + Tutor)
Students ──► enrolled into Batch
```

> **Design Rule:** Subject is defined once at the Course level and shared
> across all Batches. A Tutor Assignment connects a Tutor to a Subject
> for a specific Batch — this is how subjects are delivered per batch.

Academic Monitoring

---

# Academic Planning

Academic planning defines how the institute organizes and delivers education.

Planning includes

- Course Planning
- Batch Planning
- Subject Planning
- Faculty Allocation
- Timetable Planning
- Live Class Planning
- Academic Calendar Planning
- Academic Monitoring

---

# Course Management

Courses represent the highest level of academic organization within an institute.

Examples

- Regular Course
- Crash Course
- Crash Course
- Foundation Program

Purpose

- Organize academic programs.
- Group related batches.
- Define course duration.
- Manage academic timelines.

Business Rules

- Courses are created by the Tenant Admin.
- Every course belongs to a single institute.
- A course can contain multiple batches.
- Courses can be Active, Completed or Archived.

---

# Batch Management

Each course consists of one or more batches.

Examples

- Morning Batch
- Evening Batch
- Weekend Batch

Purpose

- Organize students.
- Allocate tutors.
- Schedule classes.
- Manage academic activities.

Business Rules

- Every batch belongs to one course.
- A batch can contain multiple students.
- A batch can have multiple tutors assigned via Tutor Assignment.
- Subjects are not owned by a Batch — they are inherited from the Course.
- A batch operates on all Subjects defined by its parent Course.

---

# Subject Management

Subjects define the academic curriculum for a Course. A Subject is created once at the Course level and is shared across all Batches of that Course.

Examples

- Science
- Math
- History
- Geography

Purpose

- Define the academic disciplines within a Course.
- Organize Chapters under each Subject.
- Anchor Study Materials and Assessments to the correct Subject.
- Support subject-wise performance tracking across all Batches.

Business Rules

- Subjects belong to a Course (NOT a Batch).
- One Course contains multiple Subjects (e.g., Science, Math, History, Geography).
- All Batches of the same Course share the same Subjects.
- How a Subject is taught per Batch is managed through Tutor Assignment.
- Every Subject should have at least one Tutor assigned per Batch via Tutor Assignment.
- Multiple tutors may teach different subjects across different batches.

---

# Faculty Allocation

Tutors are assigned to academic responsibilities.

Purpose

- Assign tutors to subjects.
- Assign tutors to batches.
- Balance teaching workload.
- Define academic ownership.

Business Rules

- Every subject should have at least one tutor.
- A tutor may handle multiple batches.
- A tutor may teach multiple subjects.

---

# Timetable Management

Timetables organize daily academic activities.

Purpose

- Schedule classes.
- Prevent timetable conflicts.
- Ensure organized academic delivery.
- Manage daily teaching schedules.

Business Rules

- Timetables belong to batches.
- Timetables should avoid scheduling conflicts.
- Tutors and students should follow the assigned timetable.

---

# Live Class Management

Live Classes enable tutors to conduct online academic sessions for their assigned batches.

Purpose

- Conduct scheduled online classes.
- Deliver real-time teaching sessions.
- Support hybrid learning.
- Continue academic activities without interruption.

Activities

- Schedule Live Classes
- Start Live Class Sessions
- Join Scheduled Sessions
- Share Meeting Information
- Monitor Class Status

Business Rules

- Every live class belongs to a batch.
- Every live class should have an assigned tutor.
- Live classes should follow the academic timetable.
- Students should access only the live classes assigned to their batch.

---

# Academic Calendar

The academic calendar defines the important milestones throughout the academic year.

Examples

- Admission Start
- Orientation
- Course Start
- Regular Classes
- Revision Sessions
- Mock Test Schedule
- Final Revision
- Course Completion

Purpose

- Maintain academic consistency.
- Plan institute activities.
- Help tutors and students stay organized.

---

# Academic Monitoring

The institute continuously monitors academic progress.

Examples

- Syllabus Completion
- Batch Progress
- Pending Classes
- Tutor Activity
- Subject Completion
- Academic Performance

Purpose

- Ensure timely syllabus completion.
- Identify academic delays.
- Improve overall learning quality.
- Monitor institute academic performance.

---

# Business Rules

- Every course belongs to a single institute.
- Every batch belongs to a course.
- Every student belongs to a batch.
- Every subject belongs to a course (NOT a batch).
- All batches of a course share the same subjects defined at the course level.
- Every subject must have at least one tutor assigned per batch via Tutor Assignment.
- Timetables are created per batch and reference subjects and chapters per session.
- Live classes follow the timetable and reference the subject and chapter being taught.
- Academic progress should be monitored throughout the course duration.

---

# Academic Workflow

Academic Planning

↓

Create Course

↓

Add Subjects to Course  ← (Subjects are Course-level, created first)

↓

Add Chapters to each Subject

↓

Create Batches under Course

↓

Create Tutor Assignments  ← (Assign Tutor + Subject + Batch)

↓

Enroll Students into Batches

↓

Prepare Timetable per Batch  ← (each session references Subject + Chapter)

↓

Schedule Live Classes

↓

Deliver Academic Sessions

↓

Monitor Academic Progress

↓

Course Completion

---

# Discussion Status

## Completed

- Module Overview
- Objectives
- Academic Structure
- Academic Planning
- Course Management
- Batch Management
- Subject Management
- Faculty Allocation
- Timetable Management
- Live Class Management
- Academic Calendar
- Academic Monitoring
- Business Rules
- Academic Workflow

---

## Pending Discussion

- Course Configuration
- Batch Configuration
- Timetable Builder
- Live Class Dashboard
- Attendance Integration
- Academic Reports
- Academic Analytics
- Future Scope