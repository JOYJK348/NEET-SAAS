Student Relationships
Purpose
The Student Relationships document defines how the Student entity interacts with all other core business entities within the Coaching Management Platform.
While Entity Discovery identifies the Student as an individual learner, this document focuses on understanding how that learner connects with parents, academic structures, learning resources, assessments, tutors, and communications throughout their complete academic journey.
The objective is to establish clear business relationships that support the student's learning experience while enabling the institute to manage, monitor, and improve academic outcomes.
This document intentionally focuses on business relationships and responsibilities rather than technical implementation.
Objectives
Define all business relationships involving the Student entity.
Understand ownership and responsibilities across domains.
Establish the complete learner journey within the platform.
Support future database relationship design.
Ensure business consistency across all student touchpoints.
Create a scalable student-centric architecture.
Relationship Principles
The following principles should guide Student Relationship Discovery.
Student relationships should reflect real coaching institute operations.
Every relationship must have a clear business purpose.
Student ownership and access boundaries should be clearly defined.
Relationships should support future scalability.
Avoid implementation-specific decisions.
Focus on business operations rather than database structures.
Student Relationship Overview
The Student is the central beneficiary of every academic activity performed within the coaching institute.
Every learning resource, classroom session, assessment, communication, and report ultimately exists to support the student's academic growth and examination preparation.
The major student relationships include
Student → Parent
Student → Course
Student → Batch
Student → Tutor
Student → Attendance
Student → Live Class
Student → Recorded Class
Student → Study Material
Student → Assignment
Student → Assignment Submission
Student → Mock Test
Student → Result
Student → Performance
Student → Progress
Student → Notification
Student → Doubt (Future)
Student → Certificate (Future)
Student → Parent
Purpose
Every student must be associated with one or more parents or guardians who support, monitor, and guide the student's academic journey.
This relationship enables parent portal access, improves institute-parent communication, and ensures accountability throughout the learning process.
Business Responsibilities
The Student is responsible for
Maintaining accurate parent contact information.
Sharing academic progress with parents.
Responding to parent guidance.
The Parent is responsible for
Monitoring student attendance.
Reviewing academic performance.
Supporting home learning.
Communicating with the institute when required.
Encouraging consistent academic effort.
Business Rules
Every student must have at least one parent or guardian associated.
A student may have multiple parents or guardians.
A parent may be associated with multiple students.
One parent should be designated as the primary guardian.
Parents must access only their associated student's information.
Parent contact information must remain updated throughout the academic year.
Relationship Nature
One Student
↓
One or More Parents
Example
Arun
↓
Father (Primary)
↓
Mother
↓
Guardian (Optional)
Business Impact
The Student → Parent relationship ensures that parents remain informed and engaged throughout the student's academic journey.
It improves transparency, strengthens institute-parent trust, and creates a support system that improves student outcomes.
Future Considerations
The platform should support
Multiple guardian types.
Primary and secondary guardian designation.
Emergency contact management.
Parent preference settings.
Parent-teacher meeting scheduling.
Parent feedback collection.
Student → Course
Purpose
Every student must be enrolled in one or more academic courses offered by the coaching institute.
The course defines the student's academic program, learning objectives, syllabus structure, and examination preparation pathway.
This relationship establishes the foundation for batch allocation, subject learning, assessments, and academic tracking.
Business Responsibilities
The Student is responsible for
Enrolling in the appropriate course.
Following the course syllabus.
Participating in course activities.
Preparing for course assessments.
The Course is responsible for
Defining academic objectives.
Organizing syllabus structure.
Supporting batch organization.
Enabling assessment planning.
Maintaining academic standards.
Business Rules
Every student must be enrolled in at least one course.
A student may enroll in multiple courses when required.
Course enrollment must occur before batch allocation.
Course records should remain available after completion.
Students cannot access courses belonging to other institutes.
Relationship Nature
One Student
↓
One or More Courses
Example
Priya
↓
Regular Course (Primary)
↓
Crash Course (Additional)
Business Impact
The Student → Course relationship defines the student's academic identity within the institute.
It enables organized learning pathways, supports multi-course enrollment, and ensures that every student follows a structured preparation plan.
Future Considerations
The platform should support
Multi-course enrollment tracking.
Course transfer workflows.
Course completion certificates.
Cross-course performance comparison.
AI-based course recommendations.
Student → Batch
Purpose
Every student must be allocated to one or more batches within their enrolled course.
The batch determines the student's daily schedule, tutor assignments, classroom activities, attendance tracking, and assessment participation.
This relationship organizes students into manageable learning groups while supporting flexible academic operations.
Business Responsibilities
The Student is responsible for
Attending batch-scheduled classes.
Following the batch timetable.
Participating in batch assessments.
Maintaining batch attendance.
The Batch is responsible for
Organizing daily academic activities.
Assigning tutors and schedules.
Conducting assessments.
Tracking attendance.
Monitoring batch performance.
Business Rules
Every student must belong to at least one primary batch.
A student may be assigned to additional batches when required.
Batch allocation must follow course enrollment.
Students should attend only their assigned batch sessions.
Batch changes should preserve academic history.
Students cannot belong to batches outside their enrolled course.
Relationship Nature
One Student
↓
One or More Batches
Example
Karthik
↓
Morning Batch (Primary)
↓
Weekend Revision Batch (Additional)
Business Impact
The Student → Batch relationship organizes the student's daily academic life.
It enables timetable management, tutor allocation, attendance tracking, and assessment scheduling while supporting flexible learning needs.
Future Considerations
The platform should support
Batch transfer workflows.
Multi-batch attendance tracking.
Batch performance comparison.
Batch-specific reporting.
Automatic batch suggestions.
Student → Tutor
Purpose
Every student learns from one or more tutors assigned to their batches and subjects.
This relationship represents the academic mentorship, instruction, evaluation, and guidance provided by faculty members throughout the student's learning journey.
Business Responsibilities
The Student is responsible for
Attending tutor-conducted classes.
Respecting academic guidance.
Submitting assignments and assessments.
Seeking clarification when required.
The Tutor is responsible for
Delivering subject instruction.
Conducting live classes.
Evaluating student performance.
Providing academic feedback.
Mentoring student improvement.
Recording attendance.
Business Rules
Every student must have tutors assigned for each subject.
Tutors should access only their assigned students.
Tutor feedback should remain available for student review.
Students may request doubt clarification from assigned tutors.
Tutor-student interactions should be logged for academic transparency.
Relationship Nature
One Student
↓
Multiple Tutors
Example
Nisha
↓
Science Tutor
↓
Math Tutor
↓
English Tutor
Business Impact
The Student → Tutor relationship ensures structured academic guidance and mentorship.
It enables personalized teaching, performance evaluation, doubt resolution, and continuous academic improvement.
Future Considerations
The platform should support
Tutor preference tracking.
Tutor performance feedback from students.
Doubt assignment to specific tutors.
Tutor change workflows.
AI-based tutor recommendations.
Student → Attendance
Purpose
The institute continuously tracks student attendance for every scheduled academic session.
This relationship monitors student participation, identifies irregular attendance patterns, and supports parent communication and academic interventions.
Business Responsibilities
The Student is responsible for
Attending scheduled classes regularly.
Marking attendance when required.
Providing valid reasons for absences.
The Attendance Record is responsible for
Tracking daily participation.
Calculating attendance percentage.
Identifying low attendance patterns.
Supporting academic reporting.
Triggering parent notifications.
Business Rules
Attendance must be recorded for every scheduled class.
Students must maintain minimum attendance as per institute policy.
Low attendance should trigger parent notification.
Attendance records should remain permanently available.
Absence reasons may be recorded when required.
Relationship Nature
One Student
↓
Multiple Attendance Records
Example
Arun
↓
Day 1 – Present
↓
Day 2 – Present
↓
Day 3 – Absent
↓
Day 4 – Present
Business Impact
The Student → Attendance relationship ensures academic discipline and regularity.
It enables early identification of at-risk students, supports parent communication, and maintains institutional academic standards.
Future Considerations
The platform should support
QR-based attendance.
Biometric attendance.
Automatic absent notifications.
Attendance trend analytics.
Attendance-based performance correlation.
Student → Live Class
Purpose
Students attend scheduled live classes conducted by tutors for their assigned batches and subjects.
This relationship enables real-time learning, interactive doubt resolution, and structured academic delivery.
Business Responsibilities
The Student is responsible for
Joining live classes on time.
Participating actively during sessions.
Following class discipline.
The Live Class is responsible for
Delivering scheduled instruction.
Recording attendance.
Enabling interactive learning.
Supporting doubt resolution.
Business Rules
Students may join only their assigned live classes.
Attendance should be recorded automatically upon joining.
Missed live classes should be flagged for parent notification.
Live class participation may contribute to attendance records.
Relationship Nature
One Student
↓
Multiple Live Classes
Example
Priya
↓
Science Live Class – Day 1
↓
Math Live Class – Day 1
↓
English Live Class – Day 1
Business Impact
The Student → Live Class relationship enables structured real-time learning.
It supports attendance tracking, academic engagement, and immediate doubt resolution while maintaining organized classroom operations.
Future Considerations
The platform should support
Live class reminders.
Automatic attendance marking.
Class participation scoring.
Live doubt raising.
Poll and quiz integration.
Student → Recorded Class
Purpose
Students access previously conducted live classes that have been recorded for revision and self-paced learning.
This relationship supports continuous learning beyond scheduled classroom hours and helps students revise concepts at their convenience.
Business Responsibilities
The Student is responsible for
Accessing recorded classes for revision.
Completing missed sessions through recordings.
Using recordings for examination preparation.
The Recorded Class is responsible for
Preserving teaching content.
Supporting flexible learning.
Enabling concept revision.
Maintaining learning continuity.
Business Rules
Students may access only recordings from their assigned batches and subjects.
Recorded classes should remain available throughout the academic year.
Viewing history may be tracked for analytics.
Recordings should not be downloadable unless permitted.
Relationship Nature
One Student
↓
Multiple Recorded Classes
Example
Karthik
↓
Science Recorded Class – Day 1
↓
Science Recorded Class – Day 2
↓
Math Recorded Class – Day 1
Business Impact
The Student → Recorded Class relationship improves learning accessibility and flexibility.
It reduces learning gaps caused by absences, supports revision, and provides a reusable knowledge repository.
Future Considerations
The platform should support
Playback speed control.
Video bookmarking.
AI-generated summaries.
Transcript generation.
Doubt timestamping.
Offline download options.
Student → Study Material
Purpose
Students access learning resources published by tutors for their assigned subjects and batches.
This relationship ensures that students receive timely, relevant, and organized academic content throughout their learning journey.
Business Responsibilities
The Student is responsible for
Accessing assigned study materials.
Downloading or viewing resources.
Using materials for self-study and revision.
The Study Material is responsible for
Delivering subject-specific content.
Supporting classroom learning.
Enabling self-paced revision.
Maintaining content organization.
Business Rules
Students may access only study materials assigned to their batch and subject.
New material uploads should trigger student notifications.
Material updates should preserve version history.
Students should not share materials outside the platform.
Relationship Nature
One Student
↓
Multiple Study Materials
Example
Nisha
↓
Science Notes – Chapter 1
↓
Math Formula Sheet
↓
Math PPT – Chapter 2
↓
English Previous Year Questions
Business Impact
The Student → Study Material relationship centralizes learning resources and improves academic accessibility.
It ensures that students always have the right materials at the right time while maintaining controlled content distribution.
Future Considerations
The platform should support
Smart content recommendations.
Bookmarking.
Offline downloads.
Reading progress tracking.
AI-generated summaries.
Content rating and feedback.
Student → Assignment
Purpose
Students receive academic assignments from tutors to reinforce classroom learning and measure understanding.
This relationship enables structured practice, self-evaluation, and tutor feedback outside regular class hours.
Business Responsibilities
The Student is responsible for
Reviewing assigned tasks.
Completing assignments before deadlines.
Submitting responses for tutor evaluation.
The Assignment is responsible for
Reinforcing classroom concepts.
Measuring student understanding.
Supporting tutor evaluation.
Encouraging self-practice.
Business Rules
Students may view only assignments assigned to their batch and subject.
Assignments must have clear deadlines.
Late submissions should be flagged for tutor review.
Assignment completion should contribute to academic progress tracking.
Relationship Nature
One Student
↓
Multiple Assignments
Example
Arun
↓
Science Worksheet – Chapter 1
↓
Math Numerical Practice
↓
English Diagram Assignment
Business Impact
The Student → Assignment relationship strengthens concept retention and provides continuous academic evaluation.
It bridges classroom teaching and formal assessments while encouraging disciplined self-study.
Future Considerations
The platform should support
Online submission.
File upload support.
Auto-evaluation.
Plagiarism detection.
Assignment analytics.
Personalized practice sets.
Student → Assignment Submission
Purpose
Students submit completed assignments for tutor review and feedback.
This relationship tracks submission status, completion history, and evaluation outcomes for every academic task.
Business Responsibilities
The Student is responsible for
Submitting assignments accurately.
Meeting submission deadlines.
Revising based on tutor feedback.
The Assignment Submission is responsible for
Recording submission status.
Storing submitted content.
Supporting tutor evaluation.
Maintaining completion history.
Business Rules
Every assignment submission must belong to one student.
Submissions should record submission time and date.
Late submissions should be marked accordingly.
Tutor feedback should remain accessible to the student.
Resubmissions may be allowed based on institute policy.
Relationship Nature
One Student
↓
Multiple Assignment Submissions
Example
Priya
↓
Science Worksheet – Submitted
↓
Math Practice – Submitted
↓
English Assignment – Pending
Business Impact
The Student → Assignment Submission relationship ensures accountability and tracks academic task completion.
It enables tutor evaluation, progress monitoring, and parent visibility into student discipline.
Future Considerations
The platform should support
Resubmission workflows.
Submission reminders.
Automatic late flagging.
Peer review.
Submission analytics.
Student → Mock Test
Purpose
Students participate in scheduled mock tests to evaluate their academic preparation and examination readiness.
This relationship enables periodic assessment, performance measurement, and competitive examination preparation.
Business Responsibilities
The Student is responsible for
Attempting assigned mock tests.
Following examination rules.
Reviewing test results and mistakes.
The Mock Test is responsible for
Measuring academic understanding.
Identifying weak areas.
Supporting rank generation.
Enabling performance comparison.
Business Rules
Students may attempt only assigned mock tests.
Test attempts should be recorded with timestamps.
Students should receive results only after evaluation completion.
Test history should remain permanently available.
Re-attempts may be allowed based on institute policy.
Relationship Nature
One Student
↓
Multiple Mock Tests
Example
Karthik
↓
Weekly Test – Science
↓
Monthly Test – Full Syllabus
↓
Grand Mock Test
Business Impact
The Student → Mock Test relationship drives continuous academic improvement through regular evaluation.
It measures preparation levels, identifies learning gaps, and builds examination confidence.
Future Considerations
The platform should support
Online test attempts.
Timer-based tests.
Auto-evaluation.
Adaptive difficulty.
Performance prediction.
National rank comparison.
Student → Result
Purpose
Students receive official results for every mock test and assessment they attempt.
This relationship provides transparent academic feedback, enables progress tracking, and supports parent communication.
Business Responsibilities
The Student is responsible for
Reviewing published results.
Understanding performance feedback.
Identifying areas for improvement.
The Result is responsible for
Publishing accurate marks.
Providing subject-wise breakdown.
Supporting rank information.
Maintaining assessment history.
Business Rules
Results must be published only after evaluation completion.
Students should receive result notifications automatically.
Results should include subject-wise and overall performance.
Historical results should remain permanently accessible.
Result corrections should follow institute approval workflow.
Relationship Nature
One Student
↓
Multiple Results
Example
Nisha
↓
Weekly Test Result – 85%
↓
Monthly Test Result – 78%
↓
Grand Test Result – 92%
Business Impact
The Student → Result relationship ensures transparency and motivates continuous improvement.
It enables performance tracking, parent communication, and data-driven academic planning.
Future Considerations
The platform should support
Result analytics.
Progress trends.
Weak area identification.
AI-based improvement suggestions.
Parent result sharing.
Student → Performance
Purpose
Performance represents the analytical evaluation of a student's academic achievements across assessments.
This relationship transforms raw results into meaningful insights that support improvement planning.
Business Responsibilities
The Student is responsible for
Monitoring personal performance.
Working on identified weak areas.
Maintaining consistent academic effort.
The Performance Record is responsible for
Aggregating test scores.
Calculating subject-wise averages.
Identifying strengths and weaknesses.
Supporting rank analysis.
Enabling trend tracking.
Business Rules
Performance should be calculated from published results only.
Performance metrics should update automatically.
Students should view performance at subject and overall levels.
Performance history should remain available for long-term tracking.
Relationship Nature
One Student
↓
Multiple Performance Records
Example
Arun
↓
Overall Performance – 82%
↓
Science Performance – 88%
↓
Math Performance – 79%
↓
English Performance – 85%
Business Impact
The Student → Performance relationship enables data-driven academic improvement.
It helps students, tutors, and parents understand academic standing and plan targeted interventions.
Future Considerations
The platform should support
Performance trend graphs.
Subject comparison.
Peer benchmarking.
AI-generated insights.
Predictive performance modeling.
Student → Progress
Purpose
Progress represents the student's journey through the academic syllabus and learning resources.
This relationship tracks syllabus completion, chapter coverage, and learning milestones independently from test scores.
Business Responsibilities
The Student is responsible for
Completing syllabus topics.
Accessing learning resources.
Tracking personal learning milestones.
The Progress Record is responsible for
Tracking syllabus completion percentage.
Recording chapter coverage.
Monitoring learning resource consumption.
Supporting revision planning.
Business Rules
Progress should be tracked at subject and chapter levels.
Progress updates should reflect actual learning activities.
Students should view progress independently from performance.
Progress history should support long-term academic planning.
Relationship Nature
One Student
↓
Multiple Progress Records
Example
Priya
↓
Science Progress – 65% Complete
↓
Math Progress – 48% Complete
↓
English Progress – 72% Complete
Business Impact
The Student → Progress relationship separates learning completion from test performance.
It enables syllabus tracking, revision planning, and AI-based learning recommendations.
Future Considerations
The platform should support
Chapter-level progress tracking.
Resource completion tracking.
AI-based pace recommendations.
Smart revision planners.
Learning gap identification.
Student → Notification
Purpose
Students receive timely notifications about academic activities, announcements, schedule changes, and important updates.
This relationship ensures that students remain informed and engaged throughout their learning journey.
Business Responsibilities
The Student is responsible for
Reviewing notifications regularly.
Acting on important updates.
Maintaining notification preferences.
The Notification is responsible for
Delivering timely updates.
Informing about schedule changes.
Alerting about new resources.
Reminding about upcoming assessments.
Business Rules
Students should receive notifications relevant to their batch and course.
Important notifications should be delivered through multiple channels.
Notification history should remain accessible.
Students may configure notification preferences.
Relationship Nature
One Student
↓
Multiple Notifications
Example
Karthik
↓
New Study Material Uploaded
↓
Mock Test Scheduled Tomorrow
↓
Live Class Starting in 15 Minutes
↓
Result Published
Business Impact
The Student → Notification relationship improves engagement and reduces missed academic activities.
It ensures timely communication and supports organized learning.
Future Considerations
The platform should support
Push notifications.
Email notifications.
WhatsApp integration.
Scheduled reminders.
Smart notification filtering.
Student → Doubt (Future)
Purpose
Students may raise academic doubts for tutor clarification and resolution.
This relationship enables structured doubt management and ensures that students receive timely academic support.
Business Responsibilities
The Student is responsible for
Raising clear and specific doubts.
Responding to tutor clarifications.
Marking doubts as resolved.
The Doubt is responsible for
Capturing student questions.
Routing to appropriate tutors.
Tracking resolution status.
Maintaining doubt history.
Business Rules
Students may raise doubts only for assigned subjects and tutors.
Doubts should be routed to the appropriate subject tutor.
Resolved doubts should remain accessible for future reference.
Unresolved doubts should trigger escalation if required.
Relationship Nature
One Student
↓
Multiple Doubts
Example
Nisha
↓
Doubt – Science Laws of Motion
↓
Doubt – Math Organic Reactions
↓
Doubt – English Cell Division
Business Impact
The Student → Doubt relationship ensures continuous academic support beyond classroom hours.
It improves concept clarity, reduces learning gaps, and strengthens tutor-student interaction.
Future Considerations
The platform should support
AI-based doubt suggestions.
Doubt assignment to tutors.
Doubt resolution tracking.
Similar doubt grouping.
Doubt analytics.
Student → Certificate (Future)
Purpose
Students receive official certificates upon course completion, achievement recognition, or examination success.
This relationship maintains credential records and supports future academic or professional verification.
Business Responsibilities
The Student is responsible for
Meeting certificate eligibility criteria.
Maintaining certificate records.
The Certificate is responsible for
Recording official achievements.
Supporting verification.
Maintaining credential history.
Business Rules
Certificates should be issued only after verification.
Certificate records should remain permanently accessible.
Certificates should include institute verification details.
Relationship Nature
One Student
↓
Multiple Certificates
Example
Arun
↓
Course Completion Certificate
↓
Mock Test Topper Certificate
↓
Attendance Excellence Certificate
Business Impact
The Student → Certificate relationship recognizes academic achievement and supports future opportunities.
Future Considerations
The platform should support
Digital certificate generation.
QR-based verification.
Certificate templates.
Automated issuance.
Student Relationship Summary
The Student serves as the central entity around which all academic operations revolve.
Every relationship—from parents and tutors to courses, batches, learning resources, assessments, and communications—exists to support the student's academic journey.
The student relationships establish
Family connectivity through Parents.
Academic structure through Courses and Batches.
Learning support through Tutors.
Academic discipline through Attendance.
Real-time learning through Live Classes.
Flexible revision through Recorded Classes.
Resource access through Study Materials.
Practice and evaluation through Assignments.
Performance measurement through Mock Tests and Results.
Insightful tracking through Performance and Progress.
Timely communication through Notifications.
Future support through Doubts and Certificates.
Overall Student Relationship Flow
Student
↓
Parent
↓
Course
↓
Batch
↓
Tutor
↓
Attendance
↓
Live Class
↓
Recorded Class
↓
Study Material
↓
Assignment
↓
Assignment Submission
↓
Mock Test
↓
Result
↓
Performance
↓
Progress
↓
Notification
↓
Doubt (Future)
↓
Certificate (Future)
Cross-Domain Dependencies
The Student domain depends on and supports multiple business domains.
Academic Management
Student relationships support
Course Enrollment
Batch Allocation
Subject Learning
Timetable Following
Tutor Management
Student relationships support
Tutor Assignment
Academic Mentoring
Evaluation
Feedback
Learning Management
Student relationships support
Study Material Access
Assignment Completion
Recorded Class Consumption
Assessment Management
Student relationships support
Mock Test Attempts
Result Publication
Performance Analytics
Communication Management
Student relationships support
Notification Delivery
Announcement Visibility
Reporting & Analytics
Student relationships support
Attendance Reports
Performance Reports
Progress Reports
Institute Analytics
Discussion Status
Completed
Student → Parent
Student → Course
Student → Batch
Student → Tutor
Student → Attendance
Student → Live Class
Student → Recorded Class
Student → Study Material
Student → Assignment
Student → Assignment Submission
Student → Mock Test
Student → Result
Student → Performance
Student → Progress
Student → Notification
Student → Doubt (Future)
Student → Certificate (Future)
Next Phase
The next relationship discovery document is
Tutor Relationships
This document will define how the Tutor entity interacts with
Institute
Course
Batch
Subject
Timetable
Live Class
Recorded Class
Study Material
Assignment
Mock Test
Evaluation
Attendance
Notification
The Tutor Relationships document will establish the complete faculty journey within the platform and connect the Academic domain with Learning, Assessment, and Communication.
Document Completion Status
Completed
Student Relationship Overview
Business Principles
Core Student Relationships
Student Workflow
Cross-Domain Dependencies
Relationship Summary
This completes the Student Relationship Discovery phase and provides the business foundation required for Entity Relationship Design (ERD), Database Modeling, API Design, and Application Development.
