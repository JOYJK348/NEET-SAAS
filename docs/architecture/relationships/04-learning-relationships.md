Learning Relationships
Purpose
The Learning Relationships document defines how learning entities interact with each other and with students, tutors, subjects, chapters, and the institute within the Coaching Management Platform.
While Entity Discovery identifies individual learning resources, this document focuses on understanding how those resources collaborate to support structured learning, self-study, revision, and continuous academic improvement.
The objective is to establish clear business relationships that support a centralized, organized, and accessible learning ecosystem for every student throughout their academic journey.
This document intentionally focuses on business relationships and responsibilities rather than technical implementation.
Objectives
Define all business relationships involving learning entities.
Understand ownership and responsibilities across the learning lifecycle.
Establish the complete learning resource journey from creation to consumption.
Support future database relationship design.
Ensure business consistency across all learning touchpoints.
Create a scalable learning-centric architecture.
Relationship Principles
The following principles should guide Learning Relationship Discovery.
Learning relationships should reflect real coaching institute study operations.
Every relationship must have a clear business purpose.
Learning resource ownership and access boundaries should be clearly defined.
Relationships should support future scalability.
Avoid implementation-specific decisions.
Focus on business operations rather than database structures.
Learning Relationship Overview
The Learning domain serves as the knowledge delivery backbone of the coaching institute.
Every study material, assignment, recorded class, and learning resource exists to support student understanding, reinforce classroom teaching, enable self-paced learning, and improve examination preparation.
The major learning relationships include
Study Material → Subject
Study Material → Chapter
Study Material → Batch
Study Material → Student
Study Material → Tutor
Assignment → Subject
Assignment → Chapter
Assignment → Batch
Assignment → Student
Assignment → Tutor
Assignment → Assignment Submission
Recorded Class → Live Class
Resource Category → Study Material
Study Material → Subject
Purpose
Every study material belongs to a specific subject to ensure that learning resources align with the academic curriculum.
This relationship organizes educational content under the correct academic area and enables students to locate resources efficiently.
Business Responsibilities
The Study Material is responsible for
Delivering subject-specific content.
Supporting syllabus alignment.
Enabling concept clarity.
Maintaining academic quality.
The Subject is responsible for
Defining curriculum scope.
Organizing learning topics.
Supporting resource categorization.
Enabling academic tracking.
Business Rules
Every study material must belong to one subject.
A subject may contain multiple study materials.
Study materials should align with the approved syllabus.
Students may access only materials from their assigned subjects.
Relationship Nature
One Subject
↓
Multiple Study Materials
Example
Science
↓
Science Notes – Chapter 1
↓
Math Formula Sheet
↓
Science Practice Questions
↓
Science Previous Year Questions
Business Impact
The Study Material → Subject relationship ensures curriculum-aligned resource organization.
It enables efficient content discovery, supports syllabus completion, and maintains academic consistency.
Future Considerations
The platform should support
Subject-wise resource analytics.
Smart content recommendations.
AI-generated subject summaries.
Cross-subject resource linking.
Study Material → Chapter
Purpose
Study materials are further organized by chapter to provide structured, sequential learning within each subject.
This relationship enables topic-specific resource grouping and supports chapter-wise syllabus completion tracking.
Business Responsibilities
The Study Material is responsible for
Addressing specific chapter concepts.
Supporting sequential learning.
Enabling topic revision.
The Chapter is responsible for
Defining topic scope.
Organizing learning sequence.
Supporting progress tracking.
Enabling assessment alignment.
Business Rules
Every study material should belong to one chapter when applicable.
A chapter may contain multiple study materials.
Materials should follow the approved chapter sequence.
Chapter-wise organization should support progress tracking.
Relationship Nature
One Chapter
↓
Multiple Study Materials
Example
Laws of Motion
↓
Laws of Motion Notes
↓
Laws of Motion Numerical Practice
↓
Laws of Motion Formula Sheet
Business Impact
The Study Material → Chapter relationship enables granular, topic-specific learning.
It supports syllabus completion tracking, targeted revision, and organized content navigation.
Future Considerations
The platform should support
Chapter completion tracking.
Prerequisite chapter linking.
Chapter-wise analytics.
AI-based chapter recommendations.
Study Material → Batch
Purpose
Study materials are assigned to specific batches to ensure that the right students receive the right resources at the right time.
This relationship controls resource distribution and maintains academic schedule alignment.
Business Responsibilities
The Study Material is responsible for
Being available to assigned batches.
Supporting batch-specific learning.
Aligning with batch progress.
The Batch is responsible for
Ensuring student access to materials.
Following material distribution schedules.
Supporting batch-wise academic tracking.
Business Rules
Every study material must be assigned to at least one batch.
A study material may be assigned to multiple batches.
Students may access only materials assigned to their batch.
Material updates should notify affected batches.
Relationship Nature
One Study Material
↓
One or More Batches
Example
Science Notes – Chapter 1
↓
Morning Batch
↓
Evening Batch
Business Impact
The Study Material → Batch relationship ensures controlled and targeted resource distribution.
It prevents content overload, maintains academic pacing, and supports batch-specific learning needs.
Future Considerations
The platform should support
Batch-specific material variations.
Automatic batch assignment.
Batch-wise material analytics.
Cross-batch resource sharing.
Study Material → Student
Purpose
Students access assigned study materials to support classroom learning, self-study, and examination preparation.
This relationship represents the core consumption interaction that drives student learning outcomes.
Business Responsibilities
The Study Material is responsible for
Delivering educational content.
Supporting concept understanding.
Enabling self-paced learning.
Maintaining content accessibility.
The Student is responsible for
Accessing assigned materials regularly.
Using materials for study and revision.
Completing associated assignments.
Providing feedback when required.
Business Rules
Students may access only study materials assigned to their batch and subject.
Access history may be tracked for analytics.
Materials should remain available throughout the academic year.
Students should not share materials outside the platform.
Relationship Nature
One Student
↓
Multiple Study Materials
Example
Student Arun
↓
Science Notes – Chapter 1
↓
Math PPT – Chapter 2
↓
English Previous Year Questions
Business Impact
The Study Material → Student relationship enables personalized, self-paced learning.
It supports concept reinforcement, examination preparation, and continuous academic improvement.
Future Considerations
The platform should support
Reading progress tracking.
Bookmarking.
Offline downloads.
Smart recommendations.
AI-generated summaries.
Study Material → Tutor
Purpose
Tutors create, upload, and manage study materials for their assigned subjects and batches.
This relationship ensures that qualified faculty produce and maintain quality learning resources.
Business Responsibilities
The Study Material is responsible for
Requiring tutor expertise for creation.
Supporting tutor academic goals.
Enabling content quality control.
The Tutor is responsible for
Creating accurate and relevant materials.
Organizing materials by subject and chapter.
Updating materials when required.
Ensuring content quality.
Business Rules
Tutors may create materials only for assigned subjects.
Materials should align with the approved syllabus.
Content updates should preserve version history.
Tutor materials should be reviewed when required.
Relationship Nature
One Tutor
↓
Multiple Study Materials
Example
Dr. Ramesh
↓
Science Notes – Chapter 1
↓
Math Formula Sheet
↓
Science Practice Questions
Business Impact
The Study Material → Tutor relationship ensures quality-controlled, faculty-driven content creation.
It supports academic standards, enables content accountability, and maintains resource quality.
Future Considerations
The platform should support
Collaborative material creation.
Content approval workflows.
Tutor content analytics.
AI-assisted material generation.
Assignment → Subject
Purpose
Every assignment belongs to a specific subject to ensure that practice tasks align with the academic curriculum.
This relationship organizes assignments under the correct academic area and enables subject-wise practice tracking.
Business Responsibilities
The Assignment is responsible for
Reinforcing subject concepts.
Supporting syllabus alignment.
Measuring subject understanding.
Enabling practice and revision.
The Subject is responsible for
Defining assignment scope.
Organizing practice topics.
Supporting assessment alignment.
Enabling progress tracking.
Business Rules
Every assignment must belong to one subject.
A subject may contain multiple assignments.
Assignments should align with completed syllabus topics.
Students may attempt only assignments from their assigned subjects.
Relationship Nature
One Subject
↓
Multiple Assignments
Example
Math
↓
Math Worksheet – Chapter 1
↓
Math Numerical Practice
↓
Math Revision Assignment
Business Impact
The Assignment → Subject relationship ensures curriculum-aligned practice and evaluation.
It supports concept reinforcement, measures understanding, and maintains academic consistency.
Future Considerations
The platform should support
Subject-wise assignment analytics.
Difficulty-based assignment generation.
AI-powered practice recommendations.
Cross-subject assignment linking.
Assignment → Chapter
Purpose
Assignments are organized by chapter to provide topic-specific practice and reinforce recently completed concepts.
This relationship enables granular, sequential practice that aligns with classroom teaching progression.
Business Responsibilities
The Assignment is responsible for
Addressing specific chapter concepts.
Supporting sequential practice.
Measuring topic understanding.
Enabling targeted revision.
The Chapter is responsible for
Defining assignment scope.
Organizing practice sequence.
Supporting progress tracking.
Enabling assessment alignment.
Business Rules
Every assignment should belong to one chapter when applicable.
A chapter may contain multiple assignments.
Assignments should follow classroom teaching sequence.
Chapter-wise assignments should support progress tracking.
Relationship Nature
One Chapter
↓
Multiple Assignments
Example
Organic Math
↓
Organic Math Worksheet 1
↓
Organic Math Practice Problems
↓
Organic Math Reaction Mechanisms
Business Impact
The Assignment → Chapter relationship enables targeted, sequential practice.
It reinforces classroom learning, measures topic mastery, and supports structured revision.
Future Considerations
The platform should support
Chapter completion tracking.
Prerequisite practice linking.
Chapter-wise assignment analytics.
AI-based practice recommendations.
Assignment → Batch
Purpose
Assignments are assigned to specific batches to ensure that the right students receive practice tasks at the appropriate academic stage.
This relationship controls task distribution and maintains academic pacing.
Business Responsibilities
The Assignment is responsible for
Being available to assigned batches.
Supporting batch-specific practice.
Aligning with batch progress.
The Batch is responsible for
Ensuring student access to assignments.
Following assignment distribution schedules.
Supporting batch-wise academic tracking.
Business Rules
Every assignment must be assigned to at least one batch.
An assignment may be assigned to multiple batches.
Students may access only assignments assigned to their batch.
Assignment deadlines should consider batch schedules.
Relationship Nature
One Assignment
↓
One or More Batches
Example
Science Worksheet – Chapter 1
↓
Morning Batch
↓
Evening Batch
Business Impact
The Assignment → Batch relationship ensures controlled and targeted practice distribution.
It prevents task overload, maintains academic pacing, and supports batch-specific learning needs.
Future Considerations
The platform should support
Batch-specific assignment variations.
Automatic batch assignment.
Batch-wise submission analytics.
Cross-batch assignment sharing.
Assignment → Student
Purpose
Students receive and complete assignments to reinforce classroom learning and measure understanding.
This relationship represents the core practice interaction that drives concept mastery and academic improvement.
Business Responsibilities
The Assignment is responsible for
Providing practice tasks.
Measuring understanding.
Supporting self-evaluation.
Enabling feedback.
The Student is responsible for
Reviewing assigned tasks.
Completing assignments before deadlines.
Submitting responses for evaluation.
Revising based on feedback.
Business Rules
Students may access only assignments assigned to their batch and subject.
Assignments must have clear deadlines.
Late submissions should be flagged for tutor review.
Assignment completion should contribute to academic progress tracking.
Relationship Nature
One Student
↓
Multiple Assignments
Example
Student Priya
↓
Science Worksheet – Chapter 1
↓
Math Numerical Practice
↓
English Diagram Assignment
Business Impact
The Assignment → Student relationship enables structured practice and continuous evaluation.
It reinforces learning, measures progress, and provides feedback for improvement.
Future Considerations
The platform should support
Submission tracking.
Deadline reminders.
Auto-evaluation.
Plagiarism detection.
Personalized practice sets.
Assignment → Tutor
Purpose
Tutors create, publish, and evaluate assignments for their assigned subjects and batches.
This relationship ensures that qualified faculty design practice tasks and provide constructive feedback.
Business Responsibilities
The Assignment is responsible for
Requiring tutor expertise for creation.
Supporting tutor academic goals.
Enabling evaluation and feedback.
The Tutor is responsible for
Creating relevant and accurate assignments.
Setting clear deadlines and instructions.
Reviewing submissions promptly.
Providing constructive feedback.
Business Rules
Tutors may create assignments only for assigned subjects and batches.
Assignments should align with completed syllabus topics.
Tutors should review submissions within institute timelines.
Feedback should remain accessible to students.
Relationship Nature
One Tutor
↓
Multiple Assignments
Example
Dr. Ramesh
↓
Science Worksheet – Chapter 1
↓
Science Numerical Practice
↓
Science Revision Assignment
Business Impact
The Assignment → Tutor relationship ensures quality-controlled, faculty-driven practice creation.
It supports academic standards, enables feedback accountability, and maintains task quality.
Future Considerations
The platform should support
Collaborative assignment creation.
Assignment templates.
Tutor workload analytics.
AI-assisted assignment generation.
Assignment → Assignment Submission
Purpose
Students submit completed assignments for tutor review and feedback.
This relationship tracks submission status, completion history, and evaluation outcomes for every academic task.
Business Responsibilities
The Assignment is responsible for
Requiring student submission.
Defining submission requirements.
Supporting evaluation.
The Assignment Submission is responsible for
Recording submission status.
Storing submitted content.
Supporting tutor evaluation.
Maintaining completion history.
Business Rules
Every assignment submission must belong to one student and one assignment.
Submissions should record submission time and date.
Late submissions should be marked accordingly.
Tutor feedback should remain accessible to the student.
Resubmissions may be allowed based on institute policy.
Relationship Nature
One Assignment
↓
Multiple Assignment Submissions
Example
Science Worksheet – Chapter 1
↓
Submission by Student Arun
↓
Submission by Student Priya
↓
Submission by Student Karthik
Business Impact
The Assignment → Assignment Submission relationship ensures accountability and tracks task completion.
It enables tutor evaluation, progress monitoring, and parent visibility into student discipline.
Future Considerations
The platform should support
Resubmission workflows.
Submission reminders.
Automatic late flagging.
Peer review.
Submission analytics.
Recorded Class → Live Class
Purpose
Every recorded class originates from a previously conducted live class session.
This relationship preserves teaching content, enables revision, and extends the value of classroom instruction beyond scheduled hours.
Business Responsibilities
The Recorded Class is responsible for
Preserving live class content.
Supporting student revision.
Enabling flexible learning.
Maintaining teaching history.
The Live Class is responsible for
Providing original teaching content.
Enabling recording capture.
Supporting session documentation.
Maintaining class history.
Business Rules
A recorded class should originate from one live class.
A live class may or may not have a recording.
Recordings should inherit subject and chapter information.
Students should access only recordings from their assigned batches.
Relationship Nature
One Live Class
↓
Zero or One Recorded Class
Example
Science Live Class – Day 1
↓
Recorded Science Lecture – Day 1
Business Impact
The Recorded Class → Live Class relationship extends teaching reach and supports continuous learning.
It enables revision, reduces learning gaps, and provides a reusable knowledge repository.
Future Considerations
The platform should support
Automatic recording.
AI-generated summaries.
Video editing tools.
Transcript generation.
Content organization.

Resource Category → Study Material
Purpose
Study materials are organized into logical categories to simplify navigation, improve discoverability, and support structured learning.
This relationship enables students and tutors to locate resources efficiently based on content type.
Business Responsibilities
The Resource Category is responsible for
Organizing learning resources.
Simplifying content navigation.
Improving resource discoverability.
Supporting structured learning.
The Study Material is responsible for
Belonging to appropriate categories.
Supporting content organization.
Enabling efficient access.
Business Rules
Every study material should belong to at least one resource category.
A resource category may contain multiple study materials.
Categories should remain consistent across the institute.
Students should browse materials by category when required.
Relationship Nature
One Resource Category
↓
Multiple Study Materials
Example
Notes
↓
Science Notes – Chapter 1
↓
Math Notes – Chapter 2
↓
English Notes – Chapter 3
Business Impact
The Resource Category → Study Material relationship improves content organization and accessibility.
It simplifies navigation, supports browsing, and enhances the learning experience.
Future Considerations
The platform should support
Custom category creation.
Multi-category tagging.
Category-wise analytics.
Smart category recommendations.
Learning Relationship Summary
The Learning domain serves as the knowledge delivery and revision engine of the coaching institute.
Every relationship—from study material creation and assignment publishing to recorded class preservation and student consumption—exists to support structured learning, self-paced revision, and continuous academic improvement.
The learning relationships establish
Curriculum alignment through Subject and Chapter organization.
Controlled distribution through Batch assignment.
Faculty-driven content through Tutor creation.
Student consumption through Material and Assignment access.
Practice reinforcement through Assignment and Submission tracking.
Flexible revision through Recorded Class preservation.
Content organization through Resource Category grouping.
Overall Learning Relationship Flow
Subject
↓
Chapter
│
├── Study Material ←── Resource Category
│ ├── Batch → Student
│ └── Tutor
│
├── Assignment
│ ├── Batch → Student → Assignment Submission
│ └── Tutor
│
└── Live Class → Recorded Class
Cross-Domain Dependencies
The Learning domain depends on and supports multiple business domains.
Academic Management
Learning relationships support
Syllabus-aligned content creation.
Chapter-wise resource organization.
Batch-specific material distribution.
Academic progress tracking.
Student Management
Learning relationships support
Self-paced learning.
Revision and practice.
Progress measurement.
Assignment completion.
Tutor Management
Learning relationships support
Content creation workload.
Assignment evaluation.
Teaching resource management.
Feedback delivery.
Assessment Management
Learning relationships support
Practice assignment creation.
Submission evaluation.
Concept reinforcement.
Performance improvement.
Communication Management
Learning relationships support
Material upload notifications.
Assignment deadline reminders.
New resource alerts.
Submission feedback.
Reporting & Analytics
Learning relationships support
Material access analytics.
Assignment completion reports.
Student engagement metrics.
Resource utilization insights.
Discussion Status
Completed
Study Material → Subject
Study Material → Chapter
Study Material → Batch
Study Material → Student
Study Material → Tutor
Assignment → Subject
Assignment → Chapter
Assignment → Batch
Assignment → Student
Assignment → Tutor
Assignment → Assignment Submission
Recorded Class → Live Class
Resource Category → Study Material
Next Phase
The next relationship discovery document is
Parent Relationships
This document will define how the Parent entity interacts with
Student
Attendance
Performance
Result
Notification
Meeting
The Parent Relationships document will establish the complete parent monitoring and engagement ecosystem within the platform.
Document Completion Status
Completed
Learning Relationship Overview
Business Principles
Core Learning Relationships
Learning Workflow
Cross-Domain Dependencies
Relationship Summary
This completes the Learning Relationship Discovery phase and provides the business foundation required for Entity Relationship Design (ERD), Database Modeling, API Design, and Application Development.
