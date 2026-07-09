# Academic Management Domain

## Purpose

The Academic Management domain is responsible for defining, organizing, and managing the complete academic structure of the coaching institute.

It provides the foundation for courses, batches, subjects, class schedules, tutors, learning resources, and academic planning.

The primary objective of this domain is to ensure that every student follows a well-structured academic journey while enabling the institute to efficiently manage teaching activities.

---

# Objectives

- Define academic programs.
- Organize courses and batches.
- Manage subjects.
- Plan academic schedules.
- Assign tutors.
- Organize live and recorded classes.
- Support syllabus completion.
- Maintain academic consistency across the institute.

---

# Business Entities

The following business entities belong to the Academic Management domain.

---

## Course

### Purpose

Represents an academic program offered by the coaching institute.

A course acts as the highest level of the academic hierarchy.

### Examples

- Regular Course
- Crash Course
- Crash Course
- Foundation Program

### Business Responsibilities

- Organize academic programs.
- Define learning objectives.
- Group related batches.
- Manage syllabus planning.

---

## Batch

### Purpose

Represents a group of students learning together within a course.

Batches simplify class scheduling, tutor allocation, attendance, and assessments.

### Business Responsibilities

- Organize students.
- Assign tutors.
- Schedule classes.
- Conduct assessments.

---

## Subject

### Purpose

Represents an academic subject taught within a course.

A Subject is defined at the **Course level**, not the Batch level. Science, Math, History, and Geography are subjects that belong to the "Regular Course" course. All batches of that course (Morning Batch, Evening Batch, Weekend Batch) share the same subjects.

How a Subject is *taught per Batch* is managed through **Tutor Assignment** — which connects a specific Tutor to a Subject for a specific Batch. This keeps subject definitions clean and reusable across all batches of a course.

### Examples

- Science
- Math
- History
- Geography

### Ownership Rule

> ✅ **Subject belongs to Course.**  
> ✅ **Tutor Assignment connects Subject + Batch + Tutor** for delivery.  
> ❌ Subject does NOT belong to a Batch.

### Business Responsibilities

- Represent a distinct academic discipline within a Course.
- Define the syllabus scope for the subject.
- Organize Chapters under the subject.
- Serve as the academic anchor for Study Materials and Assessments.
- Be taught across multiple Batches through Tutor Assignments.

---

## Chapter

### Purpose

Represents individual learning units within a subject.

Chapters provide structured syllabus planning and progress tracking.

### Business Responsibilities

- Organize syllabus.
- Plan teaching sequence.
- Track chapter completion.

---

## Timetable

### Purpose

Represents the academic schedule followed by students and tutors.

### Business Responsibilities

- Schedule classes.
- Avoid timetable conflicts.
- Allocate classrooms.
- Organize daily academic activities.

---

## Live Class

### Purpose

Represents scheduled online or hybrid teaching sessions.

### Business Responsibilities

- Deliver live teaching.
- Share learning resources.
- Conduct interactive sessions.
- Record attendance.

---

## Recorded Class

### Purpose

Represents previously conducted classes that students can access later for revision.

### Business Responsibilities

- Support self-learning.
- Improve revision.
- Provide flexible learning.
- Maintain academic continuity.

---

## Tutor Assignment

### Purpose

Represents the allocation of tutors to courses, batches, and subjects.

### Business Responsibilities

- Allocate faculty.
- Balance workload.
- Maintain teaching responsibility.

---

# Academic Hierarchy

```text
Academic Year
      │
      ▼
    Course
    ├────────────────────────────────────► Subject
    │                                          │
    │                                          ▼
    │                                        Chapter
    │
    └────────► Batch
                   │
                   ▼
             Timetable
                   │
                   ▼
             Live Class  ◄──── (references Subject + Chapter)
                   │
                   ▼
           Recorded Class

Tutor Assignment ──► (Course + Batch + Subject + Tutor)
```

> **Key Design Rule:** Subject and Batch are **parallel children** of Course.
> A Subject is never under a Batch. A Tutor Assignment is the bridge
> that connects a Tutor to a Subject for a specific Batch.

---

# Business Principles

- Every course belongs to an academic year.
- Every batch belongs to a course.
- Every student joins one or more batches.
- Every subject belongs to a course (NOT a batch).
- Every chapter belongs to a subject.
- Every timetable belongs to a batch.
- Every live class belongs to a batch and references a subject and chapter.
- Recorded classes should be accessible for future revision.
- Tutors should only manage their assigned academic responsibilities.
- A Tutor Assignment links a Tutor to a Subject for a specific Batch — this is how subject delivery per batch is managed.

---

# Academic Workflow

Create Academic Year

↓

Create Course

↓

Create Subjects under Course  ← (Subjects are course-level, created before Batch)

↓

Create Chapters under each Subject

↓

Create Batches under Course

↓

Create Tutor Assignments  ← (Assign Tutor + Subject + Batch)

↓

Enroll Students into Batches

↓

Prepare Timetable per Batch  ← (references Subject + Chapter per session)

↓

Conduct Live Classes

↓

Publish Recorded Classes

↓

Track Academic Progress

---

# Current Scope

## Included

- Course
- Batch
- Subject
- Chapter
- Timetable
- Live Class
- Recorded Class
- Tutor Assignment

---

## Future Enhancements

- Semester Support
- Curriculum Versioning
- Smart Timetable Generation
- AI-based Schedule Optimization
- Chapter Dependency Management
- Automatic Tutor Allocation
- Classroom Management
- Academic Calendar Integration

---

# Discussion Status

## Completed

- Academic Structure
- Course Management
- Batch Management
- Subject Management
- Chapter Management
- Timetable Planning
- Live Classes
- Recorded Classes
- Tutor Assignment
- Academic Workflow

---

## Pending Discussion

- Classroom Management
- Academic Calendar
- Syllabus Progress Tracking
- Curriculum Versioning
- Multi-Course Enrollment
- Smart Scheduling
- Chapter Prerequisites
- Academic Performance Integration