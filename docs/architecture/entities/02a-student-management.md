# Student Management Domain

## Purpose

The Student Management domain is responsible for managing the complete student lifecycle throughout the coaching institute.

It covers every business entity involved in a student's academic journey, from admission and enrollment to attendance, assessments, academic progress, and course completion.

The primary objective of this domain is to ensure that every student receives a structured, trackable, and personalized learning experience while enabling the institute to efficiently manage student-related operations.

---

# Objectives

- Manage the complete student lifecycle.
- Organize student admissions.
- Maintain student profiles.
- Track academic progress.
- Monitor attendance.
- Manage student status.
- Maintain academic history.
- Support parent communication.
- Ensure accurate student records.

---

# Business Entities

The following business entities belong to the Student Management domain.

---

## Student

### Purpose

Represents an individual enrolled in one or more coaching programs.

The student is the central entity around which academic activities, assessments, attendance, and performance are managed.

### Business Responsibilities

- Participate in learning activities.
- Attend classes.
- Complete assessments.
- Access learning resources.
- Track academic progress.

---

## Student Admission

### Purpose

Represents the admission process through which a student officially joins the coaching institute.

### Business Responsibilities

- Register new students.
- Verify admission details.
- Confirm enrollment.
- Maintain admission records.

---

## Student Profile

### Purpose

Represents the complete academic and personal profile of a student.

### Business Responsibilities

- Maintain personal information.
- Maintain academic information.
- Maintain emergency contacts.
- Maintain communication preferences.

---

## Student Admission

### Purpose

Represents the formal admission entry — the root entity that links a student to a Course + Academic Year.

### Business Responsibilities

- Register students into courses.
- Lock fee structure at admission time.
- Maintain admission academic context (course, year, branch).
- Serve as the scope anchor for attendance, exams, and learning progress.

---

## Student Batch Enrollment

### Purpose

Represents the assignment of an admitted student to a specific batch (child of Student Admission).

### Business Responsibilities

- Allocate students to batches.
- Maintain enrollment history.
- Support multiple batch enrollments per admission (e.g., main batch + crash course).

---

## Student Attendance

### Purpose

Represents attendance records maintained for every scheduled class.

### Business Responsibilities

- Record attendance.
- Monitor attendance percentage.
- Identify irregular attendance.
- Support attendance reporting.

---

## Student Progress

### Purpose

Represents the overall academic progress of a student throughout the course.

### Business Responsibilities

- Track syllabus completion.
- Monitor learning progress.
- Identify weak subjects.
- Measure academic improvement.

---

## Student Performance

### Purpose

Represents the student's academic performance across assessments.

### Business Responsibilities

- Maintain test history.
- Track scores.
- Monitor subject-wise performance.
- Support ranking and analytics.

---

## Student Documents

### Purpose

Represents official documents submitted by students during admission and academic activities.

### Examples

- Passport Size Photo
- Aadhaar Card
- School ID
- Previous Marksheets
- Transfer Certificate

### Business Responsibilities

- Store documents.
- Verify submitted documents.
- Maintain document history.

---

## Student Status

### Purpose

Represents the current academic status of a student within the institute.

### Examples

- Enquiry
- Active
- On Hold
- Completed
- Dropped
- Alumni

### Business Responsibilities

- Monitor lifecycle status.
- Support operational decisions.
- Maintain academic history.

---

# Student Lifecycle

Student Enquiry

↓

Admission (StudentAdmission — locks course + academic year + fee structure)

↓

Profile Creation

↓

Batch Allocation (StudentBatchEnrollment — child of admission)

↓

Learning Activities (scoped to student_admission_id)

↓

Attendance, Exams, Progress (all scoped to student_admission_id)

↓

Course Completion

↓

Alumni

---

# Business Principles

- Every student should have a valid admission record.
- Every student should belong to at least one course.
- Every student should belong to one or more batches.
- Every student should maintain a single academic profile.
- Attendance should be recorded for every scheduled class.
- Performance should be measurable throughout the course.
- Student history should never be lost after course completion.
- Academic records should remain available for reporting and analytics.

---

# Current Scope

## Included

- Student
- Student Admission
- Student Profile
- Student Enrollment
- Student Attendance
- Student Progress
- Student Performance
- Student Documents
- Student Status

---

## Future Enhancements

- Student ID Card Generation
- QR-based Attendance
- Student Portfolio
- AI Learning Insights
- Academic Recommendation Engine
- Digital Certificates
- Student Achievement Timeline
- Student Career Tracking

---

# Discussion Status

## Completed

- Student Lifecycle
- Student Profile
- Admission
- Enrollment
- Attendance
- Progress Tracking
- Performance Tracking
- Student Documents
- Student Status

---

## Pending Discussion

- Student Transfer
- Batch Change Workflow
- Student Suspension
- Student Re-admission
- Student Achievement Management
- Alumni Management
- Student Identity Verification
- Student Activity Timeline