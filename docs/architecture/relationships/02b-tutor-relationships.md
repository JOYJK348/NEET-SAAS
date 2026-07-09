Tutor Relationships
Purpose
The Tutor Relationships document defines how the Tutor entity interacts with all other core business entities within the Coaching Management Platform.
While Entity Discovery identifies the Tutor as a faculty member, this document focuses on understanding how that tutor connects with the institute, academic structures, students, learning resources, assessments, and communications throughout their complete teaching journey.
The objective is to establish clear business relationships that support the tutor's academic responsibilities while enabling the institute to manage, monitor, and improve teaching effectiveness.
This document intentionally focuses on business relationships and responsibilities rather than technical implementation.
Objectives
Define all business relationships involving the Tutor entity.
Understand ownership and responsibilities across domains.
Establish the complete faculty journey within the platform.
Support future database relationship design.
Ensure business consistency across all tutor touchpoints.
Create a scalable tutor-centric architecture.
Relationship Principles
The following principles should guide Tutor Relationship Discovery.
Tutor relationships should reflect real coaching institute operations.
Every relationship must have a clear business purpose.
Tutor ownership and access boundaries should be clearly defined.
Relationships should support future scalability.
Avoid implementation-specific decisions.
Focus on business operations rather than database structures.
Tutor Relationship Overview
The Tutor is the primary academic delivery agent of the coaching institute.
Every teaching activity, learning resource creation, assessment evaluation, student mentorship, and classroom session ultimately depends on tutor participation and expertise.
The major tutor relationships include
Tutor → Institute
Tutor → Course
Tutor → Batch
Tutor → Subject
Tutor → Timetable
Tutor → Live Class
Tutor → Recorded Class
Tutor → Study Material
Tutor → Assignment
Tutor → Mock Test
Tutor → Evaluation
Tutor → Student
Tutor → Attendance
Tutor → Notification
Tutor → Leave (Future)
Tutor → Institute
Purpose
Every tutor must belong to a specific coaching institute and operate under its academic policies, schedules, and operational frameworks.
This relationship establishes the tutor's institutional affiliation, defines teaching responsibilities, and ensures that all academic activities remain centralized within the institute's governance.
Business Responsibilities
The Tutor is responsible for
Following institute academic policies.
Maintaining professional teaching standards.
Participating in institute academic planning.
Contributing to student success.
The Institute is responsible for
Managing tutor profiles and records.
Assigning academic responsibilities.
Monitoring teaching performance.
Providing necessary resources and support.
Ensuring fair workload distribution.
Business Rules
Every tutor must belong to one institute.
An institute may manage multiple tutors.
Tutors must access only institute-assigned academic resources.
Tutor performance should be continuously monitored.
Inactive tutors should preserve historical teaching records.
Relationship Nature
One Institute
↓
Multiple Tutors
Example
Apex Coaching Academy
↓
Science Faculty
↓
Math Faculty
↓
English Faculty
↓
Mathematics Faculty
Business Impact
The Tutor → Institute relationship ensures centralized academic governance and faculty accountability.
It enables performance tracking, workload management, and institutional quality control while maintaining clear teaching ownership.
Future Considerations
The platform should support
Multi-branch tutor assignment.
Visiting faculty management.
Guest lecturer tracking.
Tutor certification verification.
Institute-wide faculty analytics.
Tutor → Course
Purpose
Tutors are associated with one or more courses based on their subject expertise and teaching qualifications.
This relationship defines the academic programs in which a tutor is authorized to teach and ensures that faculty allocation aligns with course requirements.
Business Responsibilities
The Tutor is responsible for
Teaching subjects within assigned courses.
Following course syllabus and academic standards.
Contributing to course academic planning.
The Course is responsible for
Defining academic objectives.
Organizing syllabus structure.
Supporting tutor assignment.
Maintaining course academic quality.
Business Rules
Every tutor must be assigned to at least one course.
A tutor may teach across multiple courses when qualified.
Course assignments should reflect tutor expertise.
Course changes should preserve tutor teaching history.
Relationship Nature
One Tutor
↓
One or More Courses
Example
Dr. Ramesh (Science Faculty)
↓
Regular Course
↓
Crash Course
↓
Crash Course
Business Impact
The Tutor → Course relationship ensures that qualified faculty deliver appropriate academic programs.
It supports course quality, enables flexible faculty utilization, and maintains academic standards across programs.
Future Considerations
The platform should support
Course-specific tutor ratings.
Cross-course teaching analytics.
AI-based tutor-course matching.
Course workload balancing.
Tutor → Batch
Purpose
Tutors are assigned to specific batches within their courses to deliver scheduled teaching sessions.
This relationship organizes daily classroom activities, enables batch-specific teaching, and ensures that students receive consistent instruction from assigned faculty.
Business Responsibilities
The Tutor is responsible for
Conducting classes for assigned batches.
Maintaining batch attendance.
Evaluating batch assessments.
Monitoring batch progress.
The Batch is responsible for
Providing scheduled teaching slots.
Organizing student groups.
Supporting tutor-student interaction.
Enabling batch-specific academic tracking.
Business Rules
Every tutor must be assigned to at least one batch.
A tutor may handle multiple batches.
Tutors should access only their assigned batch information.
Batch assignments should consider tutor workload.
Batch changes should preserve teaching history.
Relationship Nature
One Tutor
↓
Multiple Batches
Example
Dr. Ramesh (Science)
↓
Morning Batch – Regular Course
↓
Evening Batch – Regular Course
↓
Weekend Batch – Advanced
Business Impact
The Tutor → Batch relationship organizes daily teaching activities and ensures consistent faculty-student interaction.
It enables batch progress tracking, attendance management, and personalized teaching approaches.
Future Considerations
The platform should support
Batch transfer workflows.
Substitute tutor assignment.
Batch performance comparison.
Tutor-batch analytics.
Tutor → Subject
Purpose
Tutors are assigned to teach specific subjects based on their academic expertise and qualifications.
This relationship defines the academic areas in which a tutor delivers instruction, creates resources, and evaluates student performance.
Business Responsibilities
The Tutor is responsible for
Teaching assigned subjects thoroughly.
Creating subject-specific study materials.
Conducting subject assessments.
Evaluating subject performance.
Clarifying subject doubts.
The Subject is responsible for
Defining academic content.
Organizing chapter structure.
Supporting teaching frameworks.
Enabling assessment planning.
Business Rules
Every tutor must be assigned to at least one subject.
A tutor may teach multiple subjects when qualified.
Subject assignments should align with tutor expertise.
Subject changes should preserve teaching records.
Relationship Nature
One Tutor
↓
One or More Subjects
Example
Dr. Ramesh
↓
Science
↓
Mathematics
Business Impact
The Tutor → Subject relationship ensures that qualified experts deliver subject instruction.
It supports academic quality, enables specialized teaching, and maintains subject consistency across batches.
Future Considerations
The platform should support
Subject proficiency tracking.
Cross-subject teaching analytics.
AI-based subject recommendations.
Subject workload distribution.
Tutor → Timetable
Purpose
Tutors follow institute timetables that define when and where they conduct classes for assigned batches and subjects.
This relationship organizes teaching schedules, prevents conflicts, and ensures consistent academic delivery.
Business Responsibilities
The Tutor is responsible for
Following the assigned timetable.
Conducting classes at scheduled times.
Notifying the institute of scheduling conflicts.
Maintaining punctuality.
The Timetable is responsible for
Scheduling tutor sessions.
Preventing timing conflicts.
Organizing classroom resources.
Supporting academic planning.
Business Rules
Every tutor must have a defined teaching schedule.
Tutors should not have overlapping sessions.
Timetable changes should notify affected tutors.
Tutor schedules should remain historically available.
Relationship Nature
One Tutor
↓
Multiple Timetable Entries
Example
Dr. Ramesh
↓
Monday 9 AM – Science – Morning Batch
↓
Monday 11 AM – Science – Evening Batch
↓
Wednesday 9 AM – Science – Morning Batch
Business Impact
The Tutor → Timetable relationship ensures organized teaching delivery and efficient faculty utilization.
It prevents scheduling conflicts, supports workload balancing, and maintains academic consistency.
Future Considerations
The platform should support
Automatic conflict detection.
Substitute scheduling.
Tutor availability tracking.
AI-based schedule optimization.
Tutor → Live Class
Purpose
Tutors conduct live classes for their assigned batches and subjects according to the institute timetable.
This relationship enables real-time teaching, student interaction, doubt resolution, and attendance recording.
Business Responsibilities
The Tutor is responsible for
Starting live classes on time.
Delivering structured instruction.
Engaging students interactively.
Recording class attendance.
Addressing student doubts.
The Live Class is responsible for
Providing teaching platform.
Recording session details.
Supporting student interaction.
Enabling attendance tracking.
Business Rules
Tutors may conduct only their assigned live classes.
Live classes should follow the approved timetable.
Attendance must be recorded for every live class.
Class cancellations should follow institute policy.
Relationship Nature
One Tutor
↓
Multiple Live Classes
Example
Dr. Ramesh
↓
Science Live Class – Day 1
↓
Science Live Class – Day 2
↓
Science Doubt Clearing Session
Business Impact
The Tutor → Live Class relationship enables structured real-time teaching and student engagement.
It supports attendance tracking, session recording, and interactive learning experiences.
Future Considerations
The platform should support
Online meeting integration.
Automatic recording.
Class analytics.
Student engagement scoring.
AI-generated class summaries.
Tutor → Recorded Class
Purpose
Tutors may create or manage recorded classes derived from live sessions for student revision and self-paced learning.
This relationship extends teaching impact beyond scheduled hours and supports continuous student learning.
Business Responsibilities
The Tutor is responsible for
Initiating session recordings.
Managing recorded content.
Ensuring recording quality.
Organizing recordings by subject and chapter.
The Recorded Class is responsible for
Preserving teaching content.
Supporting student revision.
Enabling flexible learning.
Maintaining content organization.
Business Rules
Recorded classes should originate from tutor-conducted live sessions.
Tutors should manage only their own recorded content.
Recordings should remain available throughout the academic year.
Recording quality should meet institute standards.
Relationship Nature
One Tutor
↓
Multiple Recorded Classes
Example
Dr. Ramesh
↓
Recorded Science Lecture – Chapter 1
↓
Recorded Science Lecture – Chapter 2
↓
Recorded Revision Session
Business Impact
The Tutor → Recorded Class relationship extends teaching reach and supports continuous learning.
It enables revision, reduces learning gaps, and provides a reusable knowledge repository.
Future Considerations
The platform should support
Automatic recording.
AI-generated summaries.
Video editing tools.
Transcript generation.
Content organization.
Tutor → Study Material
Purpose
Tutors create and publish study materials for their assigned subjects to support classroom learning and student self-study.
This relationship ensures that learning resources align with teaching content and syllabus requirements.
Business Responsibilities
The Tutor is responsible for
Creating quality study materials.
Organizing materials by subject and chapter.
Updating materials when required.
Ensuring content accuracy.
The Study Material is responsible for
Supporting classroom learning.
Enabling student self-study.
Maintaining content organization.
Preserving version history.
Business Rules
Tutors may create materials only for assigned subjects.
Materials should align with the approved syllabus.
Content updates should preserve previous versions.
Materials should be accessible only to authorized students.
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
The Tutor → Study Material relationship ensures quality learning resources that align with teaching.
It supports consistent instruction, enables self-paced learning, and maintains academic standards.
Future Considerations
The platform should support
AI-generated content suggestions.
Version control.
Content analytics.
Collaborative material creation.
Smart content recommendations.
Tutor → Assignment
Purpose
Tutors create and publish assignments for their assigned subjects and batches to reinforce classroom learning.
This relationship enables structured practice, measures understanding, and supports continuous evaluation.
Business Responsibilities
The Tutor is responsible for
Creating relevant assignments.
Setting clear deadlines.
Reviewing submissions.
Providing constructive feedback.
The Assignment is responsible for
Reinforcing concepts.
Measuring understanding.
Supporting evaluation.
Encouraging self-practice.
Business Rules
Tutors may create assignments only for assigned subjects and batches.
Assignments should have clear instructions and deadlines.
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
The Tutor → Assignment relationship bridges classroom teaching and self-assessment.
It reinforces learning, measures progress, and provides continuous academic feedback.
Future Considerations
The platform should support
Assignment templates.
Auto-evaluation.
Plagiarism detection.
Submission analytics.
Personalized assignments.
Tutor → Mock Test
Purpose
Tutors prepare and conduct mock tests for their assigned subjects to evaluate student preparation and examination readiness.
This relationship enables periodic assessment, performance measurement, and targeted academic improvement.
Business Responsibilities
The Tutor is responsible for
Preparing quality question papers.
Conducting tests according to schedule.
Ensuring fair examination conditions.
Evaluating student responses.
The Mock Test is responsible for
Measuring academic understanding.
Identifying weak areas.
Supporting rank generation.
Enabling performance comparison.
Business Rules
Tutors may prepare tests only for assigned subjects.
Tests should align with completed syllabus.
Evaluation should follow institute marking schemes.
Results should be published after complete evaluation.
Relationship Nature
One Tutor
↓
Multiple Mock Tests
Example
Dr. Ramesh
↓
Science Weekly Test
↓
Science Monthly Test
↓
Science Grand Test
Business Impact
The Tutor → Mock Test relationship drives continuous academic evaluation and improvement.
It measures preparation levels, identifies learning gaps, and builds examination confidence.
Future Considerations
The platform should support
AI question generation.
Adaptive testing.
Auto-evaluation.
Performance prediction.
Difficulty analysis.
Tutor → Evaluation
Purpose
Tutors evaluate student responses from mock tests, assignments, and other assessments to measure academic performance.
This relationship ensures accurate marking, constructive feedback, and fair result publication.
Business Responsibilities
The Tutor is responsible for
Evaluating responses accurately.
Providing detailed feedback.
Maintaining evaluation consistency.
Completing evaluations within timelines.
The Evaluation is responsible for
Recording marks and remarks.
Supporting result generation.
Maintaining evaluation history.
Enabling performance analytics.
Business Rules
Tutors may evaluate only their assigned assessments.
Evaluations should follow institute marking schemes.
Feedback should be constructive and actionable.
Evaluation records should remain permanently available.
Relationship Nature
One Tutor
↓
Multiple Evaluations
Example
Dr. Ramesh
↓
Weekly Test Evaluation – Morning Batch
↓
Monthly Test Evaluation – Evening Batch
↓
Assignment Evaluation – Weekend Batch
Business Impact
The Tutor → Evaluation relationship ensures accurate academic assessment and meaningful feedback.
It supports result transparency, enables progress tracking, and maintains evaluation standards.
Future Considerations
The platform should support
Rubric-based evaluation.
AI-assisted marking.
Evaluation analytics.
Moderation workflows.
Feedback templates.
Tutor → Student
Purpose
Tutors mentor, guide, and academically support students assigned to their batches and subjects.
This relationship represents the core teaching interaction that drives student learning and academic growth.
Business Responsibilities
The Tutor is responsible for
Delivering quality instruction.
Monitoring student progress.
Providing academic guidance.
Addressing student doubts.
Encouraging student improvement.
The Student is responsible for
Attending classes regularly.
Participating actively.
Completing assignments.
Respecting academic guidance.
Seeking clarification when required.
Business Rules
Tutors may interact only with their assigned students.
Tutor feedback should remain constructive.
Student progress should be monitored continuously.
Tutor-student interactions should respect professional boundaries.
Relationship Nature
One Tutor
↓
Multiple Students
Example
Dr. Ramesh
↓
Student Arun
↓
Student Priya
↓
Student Karthik
↓
Student Nisha
Business Impact
The Tutor → Student relationship is the foundation of academic delivery and mentorship.
It enables personalized teaching, progress monitoring, and continuous academic improvement.
Future Considerations
The platform should support
Student progress dashboards for tutors.
AI-based weak student identification.
Personalized teaching recommendations.
Tutor-student communication channels.
Tutor → Attendance
Purpose
Tutors record and manage student attendance for every class they conduct.
This relationship ensures accurate attendance tracking, identifies irregular students, and supports parent communication.
Business Responsibilities
The Tutor is responsible for
Recording attendance for every class.
Updating attendance when required.
Identifying irregular students.
Reporting attendance concerns.
The Attendance Record is responsible for
Tracking student participation.
Calculating attendance percentages.
Supporting academic reporting.
Triggering parent notifications.
Business Rules
Attendance must be recorded for every conducted class.
Tutors should complete attendance promptly after class.
Attendance corrections should follow institute policy.
Low attendance should be reported to the institute.
Relationship Nature
One Tutor
↓
Multiple Attendance Records
Example
Dr. Ramesh
↓
Morning Batch Attendance – Day 1
↓
Evening Batch Attendance – Day 1
↓
Weekend Batch Attendance – Day 1
Business Impact
The Tutor → Attendance relationship maintains academic discipline and student regularity.
It enables early intervention, supports parent communication, and maintains institutional standards.
Future Considerations
The platform should support
QR-based attendance.
Biometric integration.
Automatic absent notifications.
Attendance analytics.
Substitute tutor attendance.
Tutor → Notification
Purpose
Tutors receive notifications about schedule changes, academic updates, student concerns, and institute announcements.
This relationship ensures that tutors remain informed and can respond to academic requirements promptly.
Business Responsibilities
The Tutor is responsible for
Reviewing notifications regularly.
Responding to schedule changes.
Acting on student concerns.
Maintaining communication preferences.
The Notification is responsible for
Delivering timely updates.
Alerting about schedule changes.
Informing about student issues.
Supporting operational communication.
Business Rules
Tutors should receive notifications relevant to their assignments.
Important notifications should be delivered through multiple channels.
Notification history should remain accessible.
Tutors may configure notification preferences.
Relationship Nature
One Tutor
↓
Multiple Notifications
Example
Dr. Ramesh
↓
Schedule Change – Monday Class Shifted
↓
Student Absence Alert – Low Attendance
↓
New Assignment Submission – Review Required
↓
Institute Announcement – Faculty Meeting
Business Impact
The Tutor → Notification relationship improves tutor responsiveness and operational efficiency.
It ensures timely communication, reduces missed updates, and supports organized academic delivery.
Future Considerations
The platform should support
Push notifications.
Email alerts.
WhatsApp integration.
Priority-based filtering.
Smart notification routing.
Tutor → Leave (Future)
Purpose
Tutors may request leave for personal or professional reasons, and the institute manages substitute arrangements.
This relationship ensures academic continuity while respecting faculty personal needs.
Business Responsibilities
The Tutor is responsible for
Applying for leave in advance when possible.
Providing valid leave reasons.
Handing over academic responsibilities.
Resuming duties after leave.
The Leave Record is responsible for
Tracking leave requests.
Managing approvals.
Arranging substitute tutors.
Maintaining leave history.
Business Rules
Leave requests should follow institute policy.
Approved leave should trigger substitute arrangements.
Leave history should remain available for reporting.
Excessive leave should trigger institute review.
Relationship Nature
One Tutor
↓
Multiple Leave Records
Example
Dr. Ramesh
↓
Casual Leave – 2 Days
↓
Medical Leave – 5 Days
↓
Personal Leave – 1 Day
Business Impact
The Tutor → Leave relationship ensures faculty welfare while maintaining academic continuity.
It supports substitute planning, workload management, and institutional operational stability.
Future Considerations
The platform should support
Online leave application.
Approval workflows.
Substitute tutor assignment.
Leave balance tracking.
Leave analytics.
Tutor Relationship Summary
The Tutor serves as the primary academic delivery agent of the coaching institute.
Every relationship—from institute affiliation and course assignment to student mentorship, resource creation, assessment evaluation, and communication—exists to support effective teaching and student success.
The tutor relationships establish
Institutional affiliation through Institute.
Academic scope through Course and Subject.
Teaching organization through Batch and Timetable.
Real-time delivery through Live Class.
Extended learning through Recorded Class.
Resource creation through Study Material.
Practice reinforcement through Assignment.
Performance measurement through Mock Test.
Academic assessment through Evaluation.
Student mentorship through Student.
Discipline maintenance through Attendance.
Operational communication through Notification.
Personal welfare through Leave.
Overall Tutor Relationship Flow
Tutor
↓
Institute
↓
Course
↓
Batch
↓
Subject
↓
Timetable
↓
Live Class
↓
Recorded Class
↓
Study Material
↓
Assignment
↓
Mock Test
↓
Evaluation
↓
Student
↓
Attendance
↓
Notification
↓
Leave (Future)
Cross-Domain Dependencies
The Tutor domain depends on and supports multiple business domains.
Academic Management
Tutor relationships support
Course Delivery
Batch Organization
Subject Teaching
Timetable Execution
Live Class Conduct
Student Management
Tutor relationships support
Student Mentoring
Attendance Recording
Progress Monitoring
Doubt Resolution
Academic Feedback
Learning Management
Tutor relationships support
Study Material Creation
Assignment Publishing
Resource Organization
Content Updates
Assessment Management
Tutor relationships support
Mock Test Preparation
Student Evaluation
Result Publication
Performance Analytics
Communication Management
Tutor relationships support
Schedule Notifications
Student Alerts
Institute Announcements
Operational Updates
Reporting & Analytics
Tutor relationships support
Teaching Load Reports
Performance Analytics
Attendance Analytics
Evaluation Metrics
Discussion Status
Completed
Tutor → Institute
Tutor → Course
Tutor → Batch
Tutor → Subject
Tutor → Timetable
Tutor → Live Class
Tutor → Recorded Class
Tutor → Study Material
Tutor → Assignment
Tutor → Mock Test
Tutor → Evaluation
Tutor → Student
Tutor → Attendance
Tutor → Notification
Tutor → Leave (Future)
Next Phase
The next relationship discovery document is
Learning Relationships
This document will define how Learning entities interact with
Study Material
Subject
Chapter
Assignment
Live Class
Recorded Class
Student
Tutor
The Learning Relationships document will establish the complete learning resource ecosystem within the platform and connect the Academic domain with Student and Tutor domains.
