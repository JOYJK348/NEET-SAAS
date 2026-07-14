# Academic Relationships

## Purpose

The Academic Relationships document defines how academic entities interact with each other within the Coaching Management Platform.

While Entity Discovery identifies individual academic entities, this document focuses on understanding how those entities collaborate to deliver structured learning experiences.

The objective is to establish clear business relationships before designing the database schema, APIs, and application workflows.

This document intentionally focuses on business relationships and responsibilities rather than technical implementation.

---

# Objectives

- Define relationships between academic entities.
- Understand ownership and responsibilities.
- Establish academic workflow boundaries.
- Support future database design.
- Ensure consistency across academic operations.
- Create a scalable academic architecture.

---

# Relationship Principles

The following principles should guide Academic Relationship Discovery.

- Academic relationships should reflect real coaching institute operations.
- Every relationship should have a clear business purpose.
- Academic ownership should be clearly defined.
- Relationships should support future scalability.
- Avoid implementation-specific decisions.
- Focus on business operations rather than database structures.

---

# Academic Relationship Overview

The Academic domain forms the backbone of the coaching institute.

Every learning activity performed by Students and Tutors is organized through the academic structure defined by the Institute.

The major academic relationships include

- Course → Batch
- Course → Subject
- Subject → Chapter
- Subject → Study Material
- Subject → Live Class
- Subject → Mock Test
- Chapter → Assignment
- Chapter → Mock Test
- Timetable → Batch
- Timetable → Tutor
- Timetable → Live Class
- Live Class → Recorded Class
- Tutor Assignment → (Course + Batch + Subject + Tutor)

---

# Course → Batch

## Purpose

A Course represents an academic program offered by the coaching institute, while a Batch represents a group of students learning that program together.

Since multiple groups of students may enroll in the same course during different timings or academic sessions, the institute organizes students into separate batches.

This relationship enables the institute to conduct multiple learning groups under a single academic program while maintaining independent schedules, tutors, attendance, and assessments.

---

## Business Responsibilities

### The Course is responsible for

- Defining the academic program.
- Providing the syllabus framework.
- Establishing course duration.
- Defining academic objectives.
- Serving as the parent structure for batches.

### The Batch is responsible for

- Organizing students into learning groups.
- Managing daily academic activities.
- Supporting class scheduling.
- Coordinating tutor assignments.
- Conducting attendance and assessments.

---

## Business Rules

- Every Batch must belong to one Course.
- One Course may contain multiple Batches.
- Batches should inherit the academic structure defined by the Course.
- Different Batches may follow different schedules while sharing the same Course.
- Historical Batch information should remain available even after course completion.
- Batch creation should occur only after the Course has been established.

---

## Relationship Nature

One Course

↓

Multiple Batches

### Example

Regular Course

↓

Morning Batch

↓

Evening Batch

↓

Weekend Batch

↓

Advanced Batch

---

## Business Impact

The Course → Batch relationship enables the institute to scale academic delivery without duplicating course definitions.

Instead of creating multiple copies of the same course, the institute creates multiple batches that share the same academic objective while operating independently.

This relationship forms the foundation for timetable planning, tutor allocation, attendance tracking, learning management, and assessments.

---

## Future Considerations

The platform should support

- Online Batches.
- Offline Batches.
- Hybrid Batches.
- Branch-specific Batches.
- Fast Track Batches.
- Crash Course Batches.
- Batch cloning.
- Batch archival.

---

# Discussion Status

## Completed

- Academic Relationship Overview.
- Course → Batch.
- Course → Subject.

# Subject → Chapter

## Purpose

A Subject is divided into multiple Chapters to provide a structured and progressive learning experience.

Each Chapter represents a specific topic within the Subject and serves as the smallest academic unit for teaching, learning, assessments, assignments, and progress tracking.

This relationship enables the institute to organize the syllabus into manageable sections and monitor academic completion at a granular level.

---

## Business Responsibilities

### The Subject is responsible for

- Defining the complete syllabus.
- Organizing academic content.
- Maintaining chapter sequence.
- Supporting structured teaching.
- Monitoring overall subject completion.

### The Chapter is responsible for

- Representing individual learning topics.
- Supporting class planning.
- Enabling topic-wise assessments.
- Organizing study materials.
- Measuring chapter completion.

---

## Business Rules

- Every Chapter must belong to one Subject.
- One Subject may contain multiple Chapters.
- Chapters should follow the approved syllabus sequence.
- Chapter completion should be tracked independently for each Batch.
- Tutors should conduct classes chapter by chapter.
- Assessments may be created for individual Chapters.

---

## Relationship Nature

One Subject

↓

Multiple Chapters

### Example

Science

↓

Units & Dimensions

↓

Motion in One Dimension

↓

Laws of Motion

↓

Work, Energy & Power

↓

Rotational Motion

---

## Business Impact

The Subject → Chapter relationship enables structured syllabus delivery.

Without Chapters, it becomes difficult to track syllabus completion, schedule classes, prepare assessments, and measure student progress accurately.

---

## Future Considerations

The platform should support

- Chapter prerequisites.
- Chapter difficulty levels.
- Chapter completion analytics.
- AI-based chapter recommendations.
- Chapter-wise revision planning.

---

# Subject → Study Material

## Purpose

Every Subject requires learning resources that help students understand concepts and prepare for examinations.

Study Materials include notes, presentations, recorded videos, assignments, formula sheets, previous year questions, and reference documents.

Associating Study Materials with Subjects ensures that students always receive relevant learning resources.

---

## Business Responsibilities

### The Subject is responsible for

- Organizing learning resources.
- Maintaining subject-specific content.
- Supporting academic preparation.

### Study Material is responsible for

- Delivering educational resources.
- Supporting classroom learning.
- Enabling self-study.
- Maintaining content versions.

---

## Business Rules

- Every Study Material must belong to one Subject.
- One Subject may contain multiple Study Materials.
- Study Materials should be available only to authorized students.
- Updated materials should replace outdated versions while preserving history.
- Materials should support the approved syllabus.

---

## Relationship Nature

One Subject

↓

Multiple Study Materials

### Example

Science

↓

Chapter Notes

↓

Formula Sheet

↓

Practice Questions

↓

Previous Year Questions

↓

Recorded Lectures

---

## Business Impact

This relationship centralizes all educational resources under their respective Subjects.

Students can easily locate learning materials, while Tutors can efficiently organize and maintain academic content.

---

## Future Considerations

The platform should support

- Version-controlled notes.
- Video libraries.
- AI-generated notes.
- Smart search.
- Bookmarking.
- Offline downloads.

---

# Subject → Live Class

## Purpose

Tutors conduct Live Classes for specific Subjects according to the academic timetable.

Each Live Class focuses on delivering lessons, solving doubts, discussing concepts, and engaging students in real-time learning.

Associating Live Classes with Subjects ensures organized teaching and accurate academic tracking.

---

## Business Responsibilities

### The Subject is responsible for

- Defining teaching objectives.
- Organizing chapter progression.
- Supporting classroom delivery.

### Live Class is responsible for

- Delivering academic instruction.
- Conducting interactive sessions.
- Recording attendance.
- Supporting student engagement.

---

## Business Rules

- Every Live Class must belong to one Subject.
- One Subject may have multiple Live Classes.
- Live Classes should follow the approved timetable.
- Tutors should conduct only assigned Subject classes.
- Students should attend only authorized Live Classes.

---

## Relationship Nature

One Subject

↓

Multiple Live Classes

### Example

Science

↓

Science Class – Day 1

↓

Science Class – Day 2

↓

Science Revision Session

↓

Science Doubt Clearing Session

---

## Business Impact

This relationship organizes teaching activities under their respective Subjects.

It enables attendance tracking, recording management, timetable planning, and subject progress monitoring.

---

## Future Considerations

The platform should support

- Online Live Classes.
- Offline Classes.
- Hybrid Classes.
- Guest Faculty Sessions.
- AI-generated class summaries.
- Automatic attendance integration.

---

# Subject → Mock Test

## Purpose

Regular assessments are conducted to evaluate student understanding of each Subject.

Mock Tests help measure conceptual clarity, identify weak areas, and monitor academic progress.

Associating Mock Tests with Subjects enables subject-wise performance analysis and targeted academic improvement.

---

## Business Responsibilities

### The Subject is responsible for

- Defining assessment scope.
- Supporting syllabus-based evaluations.
- Measuring learning outcomes.

### Mock Test is responsible for

- Evaluating student performance.
- Measuring academic understanding.
- Supporting result generation.
- Providing analytical insights.

---

## Business Rules

- Every Mock Test must belong to one Subject.
- One Subject may have multiple Mock Tests.
- Mock Tests should align with the completed syllabus.
- Results should contribute to subject performance analytics.
- Tutors should evaluate tests according to institute policies.

---

## Relationship Nature

One Subject

↓

Multiple Mock Tests

### Example

Science

↓

Chapter Test

↓

Weekly Test

↓

Monthly Test

↓

Grand Test

↓

Revision Test

---

## Business Impact

Subject-wise assessments provide meaningful academic insights and help tutors focus on weak learning areas.

This relationship strengthens performance tracking and supports continuous academic improvement.

---

## Future Considerations

The platform should support

- Adaptive assessments.
- AI-generated question papers.
- Difficulty-based testing.
- Personalized revision tests.
- Subject mastery analytics.

---

# Discussion Status

## Completed

- Course → Batch.
- Course → Subject.
- Subject → Chapter.
- Subject → Study Material.
- Subject → Live Class.
- Subject → Mock Test.

# Chapter → Assignment

## Purpose

Assignments help students reinforce concepts learned during classroom sessions.

Each Assignment is associated with a specific Chapter to ensure students practice recently completed topics before moving to the next stage of learning.

This relationship promotes continuous learning, self-evaluation, and academic discipline.

---

## Business Responsibilities

### The Chapter is responsible for

- Defining the assignment scope.
- Identifying learning objectives.
- Supporting practical understanding.
- Preparing students for assessments.

### The Assignment is responsible for

- Reinforcing classroom learning.
- Measuring student understanding.
- Supporting tutor evaluation.
- Encouraging self-practice.

---

## Business Rules

- Every Assignment must belong to one Chapter.
- One Chapter may contain multiple Assignments.
- Assignments should align with completed classroom teaching.
- Students should submit Assignments before the specified deadline.
- Tutors should review submitted Assignments.
- Assignment history should remain available for future reference.

---

## Relationship Nature

One Chapter

↓

Multiple Assignments

### Example

Motion in One Dimension

↓

Worksheet 1

↓

Numerical Practice

↓

Homework Assignment

↓

Revision Assignment

---

## Business Impact

Chapter-based Assignments improve concept retention and provide continuous academic evaluation between classroom teaching and formal assessments.

---

## Future Considerations

The platform should support

- Online Assignment Submission.
- Auto Evaluation.
- AI Feedback.
- Plagiarism Detection.
- Assignment Analytics.
- Personalized Practice Sets.

---

# Chapter → Mock Test

## Purpose

Mock Tests may be conducted after completing one or more Chapters to evaluate conceptual understanding before progressing further.

This relationship supports incremental learning rather than waiting until full syllabus completion.

---

## Business Responsibilities

### The Chapter is responsible for

- Defining assessment coverage.
- Supporting topic-wise evaluations.

### Mock Test is responsible for

- Measuring chapter understanding.
- Identifying weak concepts.
- Supporting academic improvement.

---

## Business Rules

- Mock Tests should cover completed Chapters.
- Multiple Chapters may be included in one Mock Test.
- Students should attempt only assigned Tests.
- Results should contribute to Chapter-level performance tracking.

---

## Relationship Nature

One Chapter

↓

Multiple Mock Tests

### Example

Motion in One Dimension

↓

Chapter Test

↓

Revision Test

↓

Practice Assessment

---

## Business Impact

Chapter-level assessments enable early identification of learning gaps before students proceed to advanced topics.

---

## Future Considerations

The platform should support

- AI-generated Chapter Tests.
- Adaptive Difficulty.
- Weak Chapter Detection.
- Personalized Revision Tests.

---

# Timetable → Batch

## Purpose

The Timetable defines when academic activities occur for a Batch.

Every Batch follows its own academic schedule based on institute planning, tutor availability, and classroom resources.

---

## Business Responsibilities

### The Timetable is responsible for

- Organizing daily schedules.
- Managing class timings.
- Supporting academic planning.
- Preventing scheduling conflicts.

### The Batch is responsible for

- Following the assigned schedule.
- Participating in planned sessions.

---

## Business Rules

- Every Timetable belongs to one Batch.
- One Batch has one active Timetable.
- Timetable revisions should preserve historical schedules.
- Students should follow only their assigned Batch Timetable.

---

## Relationship Nature

One Batch

↓

One Active Timetable

↓

Multiple Scheduled Sessions

---

## Business Impact

Timetable management ensures structured academic delivery and minimizes scheduling conflicts.

---

## Future Considerations

The platform should support

- Dynamic Timetable Changes.
- Holiday Adjustments.
- Substitute Scheduling.
- Calendar Synchronization.

---

# Timetable → Tutor

## Purpose

Tutors are scheduled through the Timetable to conduct classes according to the institute's academic plan.

This relationship ensures efficient faculty utilization while preventing scheduling conflicts.

---

## Business Responsibilities

### The Timetable is responsible for

- Scheduling Tutors.
- Allocating teaching sessions.
- Managing teaching workload.

### The Tutor is responsible for

- Conducting scheduled classes.
- Following assigned timings.
- Updating class status.

---

## Business Rules

- Every Timetable should assign Tutors.
- Tutors should not have overlapping sessions.
- Timetable updates should notify affected Tutors.
- Tutor schedules should remain historically available.

---

## Relationship Nature

One Timetable

↓

Multiple Tutor Sessions

---

## Business Impact

Proper Tutor scheduling improves teaching efficiency and ensures uninterrupted academic operations.

---

## Future Considerations

The platform should support

- Substitute Tutors.
- Automatic Conflict Detection.
- Faculty Workload Analytics.
- AI-assisted Scheduling.

---

# Timetable → Live Class

## Purpose

Each scheduled academic session becomes a Live Class at the scheduled date and time.

The Timetable acts as the planning layer, while the Live Class represents the actual execution of teaching.

---

## Business Responsibilities

### The Timetable is responsible for

- Scheduling Live Classes.
- Defining session timing.
- Organizing classroom activities.

### The Live Class is responsible for

- Delivering academic instruction.
- Recording attendance.
- Supporting classroom interaction.
- Tracking completion.

---

## Business Rules

- Every Live Class must originate from the Timetable.
- Timetable modifications should update future Live Classes.
- Completed Live Classes should remain unchanged.
- Cancelled classes should preserve scheduling history.

---

## Relationship Nature

One Timetable

↓

Multiple Live Classes

---

## Business Impact

Separating planning (Timetable) from execution (Live Class) improves operational flexibility while preserving historical teaching records.

---

## Future Considerations

The platform should support

- Class Rescheduling.
- Automatic Notifications.
- Attendance Integration.
- Online Meeting Integration.
- AI-generated Class Summaries.

---

# Discussion Status

## Completed

- Course → Batch.
- Course → Subject.
- Subject → Chapter.
- Subject → Study Material.
- Subject → Live Class.
- Subject → Mock Test.
- Chapter → Assignment.
- Chapter → Mock Test.
- Timetable → Batch.
- Timetable → Tutor.
- Timetable → Live Class.

# Live Class → Recorded Class

## Purpose

Every Live Class may be recorded and made available as a Recorded Class for future learning.

Recorded Classes ensure that students who miss a session or wish to revise previously taught concepts can access the same academic content at any time.

This relationship supports continuous learning beyond the classroom and improves academic accessibility.

---

## Business Responsibilities

### The Live Class is responsible for

- Delivering academic instruction.
- Recording classroom activities.
- Capturing teaching sessions.
- Maintaining teaching history.

### The Recorded Class is responsible for

- Preserving learning content.
- Supporting student revision.
- Providing anytime learning access.
- Maintaining historical teaching resources.

---

## Business Rules

- A Recorded Class should originate from one Live Class.
- A Live Class may or may not have a recording.
- Recorded Classes should inherit the associated Subject and Chapter.
- Students should access only authorized recordings.
- Deleted Live Classes should not remove historical recordings unless explicitly approved.
- Recording availability may depend on institute policies.

---

## Relationship Nature

One Live Class

↓

Zero or One Recorded Class

### Example

Science Live Class

↓

Recorded Science Lecture

---

## Business Impact

Recorded Classes extend the value of classroom teaching by enabling flexible learning and revision.

They improve academic continuity, reduce learning gaps caused by absences, and provide a reusable knowledge repository for the institute.

---

## Future Considerations

The platform should support

- Automatic recording.
- AI-generated lecture summaries.
- AI-generated chapter notes.
- Video bookmarking.
- Playback speed control.
- Topic-based video navigation.
- Video transcripts.
- Doubt timestamps.
- Learning analytics.

---

# Academic Relationship Summary

The Academic domain forms the operational backbone of the coaching institute.

Every teaching activity, learning resource, classroom session, assessment, and academic schedule is organized through the relationships defined within this domain.

The academic structure ensures that learning progresses in a logical sequence—from Course creation to Batch organization, Subject delivery, Chapter completion, classroom execution, assessments, and recorded learning.

This structured approach provides consistency across academic operations while supporting scalability for future institute growth.

---

# Overall Academic Relationship Flow

```text
Institute
    │
    ▼
  Course
  ├─────────────────────────────────► Subject  (Course-level, shared by all batches)
  │                                         │
  │                                         ▼
  │                                       Chapter
  │                                         ├───► Assignment
  │                                         └───► Mock Test
  │                                         └───► Study Material
  │
  └────────► Batch  (Course-level, parallel to Subject)
                 │
                 ▼
           Timetable
                 │
                 ▼
           Live Class  ◄── (references Subject + Chapter)
                 │
                 ▼
         Recorded Class

Tutor Assignment ──► (Course + Batch + Subject + Tutor) ←─ bridge entity
```

> **Note:** Subject and Batch are both direct children of Course.
> A Subject is never under a Batch. The Tutor Assignment entity is the
> bridge that connects them during academic delivery.

# Business Impact

The Academic Relationships establish a structured educational framework that enables the institute to

- Deliver standardized academic programs.
- Organize students into manageable learning groups.
- Maintain structured subject progression.
- Plan and execute classroom teaching.
- Conduct continuous assessments.
- Provide learning resources.
- Preserve recorded learning content.
- Monitor academic completion.
- Support future academic analytics.

These relationships ensure that every academic activity is traceable, organized, and aligned with the institute's educational objectives.

---

# Cross-Domain Dependencies

The Academic domain provides the foundation for multiple business domains.

## Student Management

Academic entities support

- Course Enrollment
- Batch Allocation
- Learning Progress
- Attendance
- Performance Tracking

---

## Tutor Management

Academic entities support

- Tutor Assignment
- Teaching Schedule
- Subject Allocation
- Classroom Management
- Assessment Evaluation

---

## Learning Management

Academic entities support

- Study Materials
- Assignments
- Live Classes
- Recorded Classes

---

## Assessment Management

Academic entities support

- Mock Tests
- Chapter Tests
- Grand Tests
- Performance Evaluation

---

## Reporting & Analytics

Academic entities support

- Subject Performance
- Batch Performance
- Tutor Performance
- Student Progress
- Academic Completion Reports

---

# Discussion Status

## Completed

- Course → Batch
- Course → Subject
- Subject → Chapter
- Subject → Study Material
- Subject → Live Class
- Subject → Mock Test
- Chapter → Assignment
- Chapter → Mock Test
- Timetable → Batch
- Timetable → Tutor
- Timetable → Live Class
- Live Class → Recorded Class

---

# Next Phase

The next relationship discovery document is

**Student Relationships**

This document defines how the Student entity interacts with

- Parent
- Course
- Batch
- Attendance
- Live Classes
- Recorded Classes
- Study Materials
- Assignments
- Mock Tests
- Performance Reports
- Notifications

The Student Relationships document will establish the complete learner journey within the platform and connect the Academic domain with Learning, Assessment, Communication, and Reporting.

---

# Document Completion Status

## Completed

- Academic Relationship Overview
- Business Principles
- Core Academic Relationships
- Academic Workflow
- Cross-Domain Dependencies
- Relationship Summary

This completes the Academic Relationship Discovery phase and provides the business foundation required for Entity Relationship Design (ERD), Database Modeling, API Design, and Application Development.
