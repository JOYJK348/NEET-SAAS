Assessment Relationships
Purpose
The Assessment Relationships document defines how assessment entities interact with each other and with students, tutors, batches, subjects, and the institute within the Coaching Management Platform.
While Entity Discovery identifies individual assessment objects, this document focuses on understanding how those entities collaborate to plan, conduct, evaluate, publish, and analyze academic assessments.
The objective is to establish clear business relationships that support a structured, transparent, and scalable assessment system for measuring student learning and examination readiness.
This document intentionally focuses on business relationships and responsibilities rather than technical implementation.
Objectives
Define all business relationships involving assessment entities.
Understand ownership and responsibilities across the assessment lifecycle.
Establish the complete assessment journey from planning to improvement.
Support future database relationship design.
Ensure business consistency across all assessment touchpoints.
Create a scalable assessment-centric architecture.
Relationship Principles
The following principles should guide Assessment Relationship Discovery.
Assessment relationships should reflect real coaching institute examination operations.
Every relationship must have a clear business purpose.
Assessment ownership and access boundaries should be clearly defined.
Relationships should support future scalability.
Avoid implementation-specific decisions.
Focus on business operations rather than database structures.
Assessment Relationship Overview
The Assessment domain forms the evaluation backbone of the coaching institute.
Every mock test, question paper, student response, evaluation, result, and ranking exists to measure academic understanding, identify learning gaps, and drive continuous improvement.
The major assessment relationships include
Assessment → Question Paper
Assessment → Batch
Assessment → Subject
Assessment → Student
Question Paper → Question Bank
Student → Student Response
Student Response → Evaluation
Evaluation → Result
Result → Ranking
Result → Performance Analysis
Assessment → Performance Analysis
Evaluation → Tutor
Result → Parent
Result → Notification
Assessment → Question Paper
Purpose
Every assessment requires a question paper that defines the assessment content, structure, and academic standards.
This relationship ensures that assessments are properly prepared, syllabus-aligned, and ready for student attempt.
Business Responsibilities
The Assessment is responsible for
Defining assessment schedule and scope.
Organizing examination logistics.
Managing student eligibility.
Controlling test lifecycle.
The Question Paper is responsible for
Defining assessment content.
Maintaining academic standards.
Ensuring syllabus coverage.
Supporting fair evaluation.
Business Rules
Every assessment must have one question paper.
Question papers must align with the assigned subject and syllabus.
Question papers should be prepared before test scheduling.
Question paper history should remain available for future reference.
Relationship Nature
One Assessment
↓
One Question Paper
Example
Regular Course – Science Monthly Test
↓
Science Monthly Test Question Paper
Business Impact
The Assessment → Question Paper relationship ensures structured and syllabus-aligned assessments.
It maintains academic quality, enables fair evaluation, and supports consistent examination standards.
Future Considerations
The platform should support
AI-generated question papers.
Question paper templates.
Difficulty-based paper generation.
Previous year question integration.
Question randomization.
Assessment → Batch
Purpose
Assessments are assigned to specific batches of students who are eligible to attempt the examination.
This relationship ensures that the right students receive the right assessments at the right time.
Business Responsibilities
The Assessment is responsible for
Defining eligible batches.
Managing batch-specific scheduling.
Controlling access permissions.
The Batch is responsible for
Organizing eligible students.
Following test schedules.
Ensuring student participation.
Business Rules
Every assessment must be assigned to at least one batch.
An assessment may be assigned to multiple batches.
Students may attempt only assessments assigned to their batch.
Batch-specific assessment history should remain available.
Relationship Nature
One Assessment
↓
One or More Batches
Example
Science Monthly Test
↓
Morning Batch
↓
Evening Batch
↓
Weekend Batch
Business Impact
The Assessment → Batch relationship ensures targeted assessment delivery and organized examination management.
It enables batch-wise performance comparison and supports flexible assessment scheduling.
Future Considerations
The platform should support
Batch-specific test variations.
Cross-batch performance comparison.
Automatic batch assignment.
Batch-wise analytics.
Assessment → Subject
Purpose
Every assessment belongs to a specific subject to measure student understanding in that academic area.
This relationship ensures subject-wise performance tracking and targeted academic improvement.
Business Responsibilities
The Assessment is responsible for
Defining subject scope.
Measuring subject understanding.
Supporting subject analytics.
The Subject is responsible for
Providing syllabus framework.
Organizing assessment content.
Enabling performance tracking.
Business Rules
Every assessment must belong to one subject.
Subject scope should align with completed syllabus.
Subject-wise assessment history should remain available.
Results should contribute to subject performance analytics.
Relationship Nature
One Assessment
↓
One Subject
Example
Science Monthly Test
↓
Science
Business Impact
The Assessment → Subject relationship enables focused subject evaluation and improvement planning.
It supports subject-wise analytics, tutor accountability, and targeted revision strategies.
Future Considerations
The platform should support
Multi-subject tests.
Subject combination analytics.
Subject mastery tracking.
Cross-subject performance comparison.
Assessment → Student
Purpose
Students attempt assigned assessments to measure their academic preparation and examination readiness.
This relationship represents the core examination interaction between the student and the assessment system.
Business Responsibilities
The Assessment is responsible for
Providing examination interface.
Recording student attempts.
Enforcing time limits.
Maintaining attempt history.
The Student is responsible for
Attempting assigned assessments.
Following examination rules.
Submitting responses on time.
Reviewing results after evaluation.
Business Rules
Students may attempt only assigned assessments.
Assessment attempts should be recorded with timestamps.
Late submissions should follow institute policy.
Attempt history should remain permanently available.
Relationship Nature
One Assessment
↓
Multiple Students
Example
Science Monthly Test
↓
Student Arun
↓
Student Priya
↓
Student Karthik
↓
Student Nisha
Business Impact
The Assessment → Student relationship drives the core assessment experience.
It enables participation tracking, performance measurement, and examination readiness evaluation.
Future Considerations
The platform should support
Online test attempts.
Timer enforcement.
Auto-submission.
Attempt analytics.
Re-attempt policies.
Question Paper → Question Bank
Purpose
Question papers are prepared using questions stored in the institute's question bank.
This relationship ensures reusable, standardized, and quality-controlled assessment content.
Business Responsibilities
The Question Paper is responsible for
Selecting appropriate questions.
Organizing question sequence.
Maintaining paper structure.
Supporting evaluation rubrics.
The Question Bank is responsible for
Storing reusable questions.
Organizing questions by subject and chapter.
Maintaining question quality.
Supporting future paper generation.
Business Rules
Question papers should use questions from the institute question bank.
Questions should align with syllabus and difficulty requirements.
Question bank history should remain available.
Questions may be reused across multiple papers.
Relationship Nature
One Question Paper
↓
Multiple Questions from Question Bank
Example
Science Monthly Test Paper
↓
Question 1 – Laws of Motion
↓
Question 2 – Work Energy Power
↓
Question 3 – Rotational Motion
Business Impact
The Question Paper → Question Bank relationship ensures consistent assessment quality and efficient paper preparation.
It enables question reuse, difficulty control, and standardized evaluation.
Future Considerations
The platform should support
AI question generation.
Difficulty tagging.
Question analytics.
Auto-paper generation.
Bloom's taxonomy mapping.
Student → Student Response
Purpose
Students submit responses for every question during a mock test attempt.
This relationship captures the student's answers, marks the beginning of the evaluation process, and preserves examination records.
Business Responsibilities
The Student is responsible for
Providing accurate responses.
Submitting within time limits.
Reviewing responses before submission.
The Student Response is responsible for
Recording submitted answers.
Preserving examination evidence.
Supporting evaluation.
Maintaining response history.
Business Rules
Every student response must belong to one student and one mock test.
Responses should be recorded at submission time.
Response history should remain permanently available.
Corrections should follow institute approval workflow.
Relationship Nature
One Student
↓
Multiple Student Responses
Example
Student Arun
↓
Response – Science Monthly Test Q1
↓
Response – Science Monthly Test Q2
↓
Response – Science Monthly Test Q3
Business Impact
The Student → Student Response relationship preserves examination evidence and enables accurate evaluation.
It supports result generation, performance analytics, and academic transparency.
Future Considerations
The platform should support
Response analytics.
Attempt comparison.
Response pattern analysis.
AI-based response insights.
Student Response → Evaluation
Purpose
Tutors evaluate student responses to assign marks, provide feedback, and determine academic performance.
This relationship transforms raw responses into meaningful academic assessment.
Business Responsibilities
The Student Response is responsible for
Providing evaluation evidence.
Supporting mark assignment.
Enabling feedback.
The Evaluation is responsible for
Assigning accurate marks.
Providing constructive feedback.
Maintaining evaluation standards.
Supporting result generation.
Business Rules
Every student response must be evaluated.
Evaluations should follow institute marking schemes.
Evaluations should be completed before result publication.
Evaluation records should remain permanently available.
Relationship Nature
One Student Response
↓
One Evaluation
Example
Response – Science Monthly Test Q1
↓
Evaluation – 4/5 Marks with Feedback
Business Impact
The Student Response → Evaluation relationship ensures accurate and fair academic assessment.
It supports result transparency, enables feedback, and maintains evaluation standards.
Future Considerations
The platform should support
Rubric-based evaluation.
AI-assisted marking.
Evaluation analytics.
Moderation workflows.
Feedback templates.
Evaluation → Result
Purpose
Evaluated responses are aggregated to generate official results for every student and mock test.
This relationship produces the final academic outcome that students, parents, and tutors review.
Business Responsibilities
The Evaluation is responsible for
Providing accurate marks.
Supporting score aggregation.
Enabling result calculation.
The Result is responsible for
Publishing official marks.
Providing performance summary.
Supporting rank generation.
Maintaining result history.
Business Rules
Results must be generated only after complete evaluation.
Results should include subject-wise and overall performance.
Results should be published simultaneously for all students.
Result history should remain permanently available.
Relationship Nature
Multiple Evaluations
↓
One Result
Example
Science Monthly Test Evaluations
↓
Student Arun Result – 78/100
Business Impact
The Evaluation → Result relationship produces transparent and official academic outcomes.
It enables performance tracking, parent communication, and continuous improvement.
Future Considerations
The platform should support
Result analytics.
Progress trends.
Parent sharing.
Digital result cards.
Result verification.
Result → Ranking
Purpose
Results are used to generate comparative rankings among students within batches, courses, and the institute.
This relationship enables competitive analysis, merit recognition, and performance benchmarking.
Business Responsibilities
The Result is responsible for
Providing performance data.
Supporting score comparison.
Enabling rank calculation.
The Ranking is responsible for
Generating comparative positions.
Supporting merit analysis.
Enabling performance benchmarking.
Maintaining rank history.
Business Rules
Rankings must be generated from published results only.
Rankings should support multiple comparison scopes.
Rank history should remain available.
Rank corrections should follow institute policy.
Relationship Nature
Multiple Results
↓
Rankings
Example
Science Monthly Test Results
↓
Batch Rank – Arun: 3rd
↓
Course Rank – Arun: 12th
↓
Institute Rank – Arun: 45th
Business Impact
The Result → Ranking relationship enables competitive analysis and motivation.
It supports merit recognition, performance benchmarking, and institutional analytics.
Future Considerations
The platform should support
National rank comparison.
Historical rank trends.
Rank analytics.
Merit dashboards.
AI-based rank prediction.
Result → Performance Analysis
Purpose
Results contribute to the student's overall academic performance record and subject-wise performance analysis.
This relationship transforms individual test outcomes into long-term academic insights.
Business Responsibilities
The Result is responsible for
Providing test-specific performance data.
Contributing to performance aggregates.
Supporting trend analysis.
The Performance Analysis is responsible for
Aggregating results over time.
Calculating subject-wise averages.
Identifying strengths and weaknesses.
Supporting improvement planning.
Business Rules
Performance analysis should be calculated from published results only.
Performance metrics should update automatically.
Performance history should remain available.
Performance should support multiple analysis dimensions.
Relationship Nature
Multiple Results
↓
Performance Analysis Record
Example
Science Monthly Test Result – 78%
↓
Science Overall Performance – 82%
Business Impact
The Result → Performance Analysis relationship enables long-term academic tracking and improvement planning.
It supports data-driven decisions, parent communication, and personalized learning.
Future Considerations
The platform should support
Performance prediction.
Trend analytics.
Weak area identification.
AI-based recommendations.
Personalized improvement plans.
Assessment → Performance Analysis
Purpose
Assessment data is analyzed to generate institutional insights, identify patterns, and support academic decision-making.
This relationship transforms raw assessment data into actionable business intelligence.
Business Responsibilities
The Assessment is responsible for
Providing assessment data.
Supporting analysis.
Enabling insight generation.
The Performance Analysis is responsible for
Identifying performance patterns.
Measuring academic effectiveness.
Supporting improvement planning.
Enabling data-driven decisions.
Business Rules
Performance analysis should be generated from verified results.
Analysis should support multiple dimensions.
Analysis history should remain available.
Analysis should be accessible only to authorized users.
Relationship Nature
Multiple Assessments
↓
Performance Analysis
Example
All Monthly Tests
↓
Batch Performance Trend
↓
Subject-wise Accuracy Analysis
↓
Weak Area Identification
Business Impact
The Assessment → Performance Analysis relationship enables institutional improvement and strategic planning.
It supports academic quality, tutor effectiveness, and competitive positioning.
Future Considerations
The platform should support
AI-generated insights.
Predictive analytics.
Benchmarking.
Custom analytics.
Executive dashboards.
Evaluation → Tutor
Purpose
Tutors are responsible for evaluating student responses for their assigned subjects and assessments.
This relationship ensures that qualified faculty perform evaluation and maintain academic standards.
Business Responsibilities
The Evaluation is responsible for
Requiring tutor expertise.
Supporting mark assignment.
Enabling feedback.
The Tutor is responsible for
Evaluating responses accurately.
Providing constructive feedback.
Completing evaluations on time.
Maintaining evaluation standards.
Business Rules
Tutors may evaluate only their assigned assessments.
Evaluations should be completed within institute timelines.
Tutor evaluation workload should be monitored.
Evaluation quality should be periodically reviewed.
Relationship Nature
One Tutor
↓
Multiple Evaluations
Example
Dr. Ramesh
↓
Science Monthly Test – Morning Batch Evaluations
↓
Science Monthly Test – Evening Batch Evaluations
Business Impact
The Evaluation → Tutor relationship ensures qualified and accountable evaluation.
It supports academic quality, workload management, and tutor performance tracking.
Future Considerations
The platform should support
Evaluation assignment workflows.
Workload balancing.
Evaluation analytics.
Quality monitoring.
AI-assisted evaluation.
Result → Parent
Purpose
Assessment results are shared with parents to improve transparency and support collaborative academic improvement.
This relationship ensures that parents remain informed about student examination performance.
Business Responsibilities
The Result is responsible for
Providing accurate performance data.
Supporting parent communication.
Enabling progress tracking.
The Parent is responsible for
Reviewing student results.
Supporting academic improvement.
Communicating with tutors when required.
Encouraging consistent effort.
Business Rules
Parents should receive results for their associated students only.
Result sharing should follow institute communication policy.
Parents should not access other students' results.
Historical results should remain accessible to parents.
Relationship Nature
One Result
↓
One or More Parents
Example
Arun's Science Monthly Test Result
↓
Father
↓
Mother
Business Impact
The Result → Parent relationship improves transparency and parent engagement.
It supports collaborative improvement, strengthens trust, and encourages student accountability.
Future Considerations
The platform should support
Automatic result notifications.
Parent result dashboards.
Performance comparison.
AI-based parent insights.
Meeting scheduling.
Result → Notification (Cross-Domain Reference)
Purpose
Results trigger automatic notifications to students, parents, and tutors when evaluation is complete and results are published.
This relationship ensures timely communication and reduces manual follow-up.
Note: Notification entity is owned by the Communication Management domain. The Assessment domain only references it for result publication workflows.
Business Responsibilities
The Result is responsible for
Triggering publication notifications.
Supporting communication.
Enabling timely updates.
The Notification (Communication Domain) is responsible for
Delivering result updates.
Informing stakeholders.
Supporting engagement.
Maintaining communication history.
Business Rules
Result notifications should be sent automatically upon publication.
Notifications should reach students, parents, and relevant tutors.
Notification history should remain available.
Preferences should be configurable.
Relationship Nature
One Result
↓
Multiple Notifications
Example
Science Monthly Test Result Published
↓
Notification to Student Arun
↓
Notification to Parent (Father)
↓
Notification to Parent (Mother)
↓
Notification to Tutor Dr. Ramesh
Business Impact
The Result → Notification relationship ensures timely and transparent communication.
It reduces manual effort, improves engagement, and supports academic operations.
Future Considerations
The platform should support
Multi-channel notifications.
Scheduled notifications.
Read receipts.
Smart notification routing.
Notification analytics.
Assessment Relationship Summary
The Assessment domain serves as the evaluation engine of the coaching institute.
Every relationship—from assessment planning and question paper preparation to student attempts, tutor evaluation, result publication, ranking, and performance analysis—exists to measure academic understanding and drive continuous improvement.
The assessment relationships establish
Content preparation through Question Paper and Question Bank.
Targeted delivery through Batch and Subject assignment.
Student participation through Attempts and Responses.
Academic evaluation through Tutor Evaluation.
Official outcomes through Result Publication.
Competitive analysis through Ranking (Batch / Course / Institute level).
Long-term insights through Performance Analysis.
Stakeholder communication through Parent and Notification (Cross-Domain) links.
Overall Assessment Relationship Flow
Assessment
│
├── Question Paper ←── Question Bank
├── Batch
├── Subject
└── Student
    │
    ├── Student Response → Evaluation → Tutor
    ├── Result
    │   ├── Ranking (Batch / Course / Institute)
    │   ├── Performance Analysis
    │   └── Parent
    └── Notification (Cross-Domain → Communication)
Cross-Domain Dependencies
The Assessment domain depends on and supports multiple business domains.
Academic Management
Assessment relationships support
Subject-wise Testing
Batch-wise Assessment
Syllabus Coverage Validation
Academic Calendar Integration
Student Management
Assessment relationships support
Performance Tracking
Progress Measurement
Weak Area Identification
Improvement Planning
Tutor Management
Assessment relationships support
Evaluation Workload
Feedback Delivery
Teaching Effectiveness
Academic Mentoring
Parent Management
Assessment relationships support
Result Transparency
Progress Monitoring
Academic Engagement
Improvement Collaboration
Communication Management
Assessment relationships support
Result Notifications
Schedule Reminders
Evaluation Updates
Publication Alerts
Reporting & Analytics
Assessment relationships support
Performance Reports
Rank Analytics
Trend Analysis
Institutional Insights
Discussion Status
Completed
Assessment → Question Paper
Assessment → Batch
Assessment → Subject
Assessment → Student
Question Paper → Question Bank
Student → Student Response
Student Response → Evaluation
Evaluation → Result
Result → Ranking
Result → Performance Analysis
Assessment → Performance Analysis
Evaluation → Tutor
Result → Parent
Result → Notification (Cross-Domain)
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
Document Completion Status
Completed
Assessment Relationship Overview
Business Principles
Core Assessment Relationships
Assessment Workflow
Cross-Domain Dependencies
Relationship Summary
This completes the Assessment Relationship Discovery phase and provides the business foundation required for Entity Relationship Design (ERD), Database Modeling, API Design, and Application Development.
