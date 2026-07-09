# Assessment Management Domain

## Purpose

The Assessment Management domain is responsible for planning, conducting, evaluating, and analyzing academic assessments within the coaching institute.

Assessments help measure student understanding, monitor academic progress, identify learning gaps, and continuously improve teaching effectiveness.

The primary objective of this domain is to provide a structured, transparent, and scalable assessment system that supports students, tutors, parents, and institute administrators.

---

# Objectives

- Plan academic assessments.
- Organize examinations.
- Conduct online and offline tests.
- Evaluate student responses.
- Publish results.
- Generate rankings.
- Analyze academic performance.
- Support continuous academic improvement.

---

# Business Entities

The following business entities belong to the Assessment Management domain.

---

## Assessment

### Purpose

Represents the root/parent entity for all academic evaluations conducted to measure student learning.

Assessment serves as the base entity. Specific assessment types (Mock Test, Weekly Test, Monthly Test, Grand Test, Unit Test) are derived from Assessment.

### Business Responsibilities

- Organize assessments.
- Define assessment objectives.
- Track assessment lifecycle.
- Support academic planning.
- Support multiple assessment types.

### Assessment Types

- Mock Test
- Weekly Test
- Monthly Test
- Grand Test
- Unit Test

---

## Mock Test

### Purpose

A type of Assessment. Represents scheduled mock examinations conducted for students to simulate competitive exam conditions.

### Business Responsibilities

- Prepare students for competitive exams.
- Measure academic readiness.
- Support periodic evaluations.

---

## Question Paper

### Purpose

Represents the examination paper prepared for an assessment.

### Business Responsibilities

- Maintain assessment standards.
- Organize questions.
- Support multiple assessment formats.

---

## Question Bank

### Purpose

Represents the centralized repository of academic questions used for assessments.

Question Bank is reusable across multiple Assessments. Questions once created can be used in any number of question papers without duplication.

### Business Responsibilities

- Maintain reusable questions.
- Organize questions by subject and chapter.
- Improve assessment quality.
- Support multiple assessment types.

---

## Student Response

### Purpose

Represents answers submitted by students during an assessment.

### Business Responsibilities

- Collect responses.
- Maintain submission history.
- Support evaluation.

---

## OMR Sheet

### Purpose

Represents optical mark recognition answer sheets used for offline examinations.

OMR Sheet is applicable only for Offline Assessments. Online assessments capture responses digitally and do not require OMR processing.

### Business Responsibilities

- Store scanned OMR data.
- Support automated evaluation.
- Maintain examination records.

---

## Evaluation

### Purpose

Represents the academic review of student responses.

### Business Responsibilities

- Evaluate answer sheets.
- Assign marks.
- Provide remarks.
- Verify assessment quality.

---

## Result

### Purpose

Represents the official outcome of an assessment.

### Business Responsibilities

- Publish marks.
- Maintain assessment history.
- Support academic reporting.

---

## Ranking

### Purpose

Represents comparative academic performance among students.

Rankings can be generated at Batch, Course, or Institute level depending on the comparison scope required.

### Business Responsibilities

- Generate rankings.
- Compare student performance.
- Support merit analysis.
- Support multiple ranking scopes (Batch / Course / Institute).

---

## Performance Analysis

### Purpose

Represents analytical insights generated from assessment results.

### Business Responsibilities

- Identify weak areas.
- Identify strong areas.
- Support academic improvements.
- Generate institutional insights.

---

# Assessment Lifecycle

Assessment Planning

↓

Question Preparation

↓

Assessment Scheduling

↓

Assessment Conduct

↓

Response Collection

↓

Evaluation

↓

Result Publication

↓

Ranking Generation

↓

Performance Analysis

↓

Academic Improvement Planning

---

# Business Principles

- Every assessment should belong to an academic structure.
- Every assessment should have a defined schedule.
- Every student response should be evaluated.
- Results should be published only after evaluation.
- Rankings should be generated from published results.
- Assessment history should remain permanently available.
- Performance analysis should support academic decision-making.

---

# Current Scope

## Included

- Assessment
- Mock Test
- Question Paper
- Question Bank
- Student Response
- OMR Sheet
- Evaluation
- Result
- Ranking
- Performance Analysis

---

## Future Enhancements

- AI Question Generation
- Adaptive Assessments
- Online Proctoring
- Auto Evaluation
- Question Difficulty Analysis
- Negative Marking Configuration
- Bloom's Taxonomy Mapping
- AI Performance Prediction
- Smart Revision Recommendations

---

# Discussion Status

## Completed

- Assessment Planning
- Mock Tests
- Question Papers
- Question Bank
- Student Responses
- OMR Evaluation
- Result Management
- Rankings
- Performance Analysis

---

## Pending Discussion

- Online Assessment Workflow
- Assessment Templates
- Question Randomization
- Question Approval Workflow
- Evaluation Moderation
- Result Reprocessing
- Rank Calculation Rules
- Assessment Security