User Relationships
Purpose
The User Relationships document defines how user entities interact with each other and with roles, permissions, institutes, and the platform within the Coaching Management Platform.
While Entity Discovery identifies individual user types, this document focuses on understanding how users collaborate, delegate, authenticate, and authorize operations across the platform.
The objective is to establish clear business relationships that support secure, scalable, and role-appropriate user management without direct technical implementation details.
This document intentionally focuses on business relationships and responsibilities rather than technical implementation.
Objectives
Define all business relationships involving user entities.
Understand ownership and access boundaries for user management.
Establish the complete user lifecycle within the platform.
Support future database relationship design.
Ensure business consistency across all user touchpoints.
Create a scalable user management architecture.
Relationship Principles
The following principles should guide User Relationship Discovery.
User relationships should reflect real coaching institute staffing and access operations.
Every relationship must have a clear business purpose.
User access should be role-based and permission-controlled.
Relationships should support future scalability.
Avoid implementation-specific decisions.
Focus on business operations rather than database structures.
User Relationship Overview
The User domain serves as the access and identity backbone of the coaching institute platform.
Every platform admin, tenant admin, tutor, student, and parent exists as a user with specific responsibilities, access levels, and operational boundaries defined by their role and permissions.
The major user relationships include
Platform Admin → Tenant Admin
Platform Admin → Institute
Tenant Admin → Institute
Tenant Admin → Tutor
Tenant Admin → Student
Tenant Admin → Parent
Parent → Student
Tenant Admin → Role
Tenant Admin → Permission
Role → Permission
Role → User
User → Institute
User → Login Session
User → Activity Log
Platform Admin → Tenant Admin
Purpose
The Platform Admin manages Tenant Admins who operate individual coaching institutes on the SaaS platform.
This relationship establishes the hierarchy between platform ownership and institute-level administration.
Business Responsibilities
The Platform Admin is responsible for
Creating and managing tenant admin accounts.
Monitoring institute onboarding and operations.
Enforcing platform-wide policies.
Supporting tenant admin inquiries.
The Tenant Admin is responsible for
Managing institute day-to-day operations.
Following platform policies and guidelines.
Maintaining institute subscription and licensing.
Reporting platform issues when required.
Business Rules
Every Tenant Admin must be created by a Platform Admin.
A Platform Admin may manage multiple Tenant Admins.
Tenant Admins cannot access other institutes' data.
Platform Admins should not interfere with institute internal operations unless required.
Relationship Nature
One Platform Admin
↓
Multiple Tenant Admins
Example
Platform Admin (SaaS Provider)
↓
Tenant Admin – Apex Coaching Academy
↓
Tenant Admin – XYZ Technical Exam Institute
↓
Tenant Admin – PQR Foundation
Business Impact
The Platform Admin → Tenant Admin relationship ensures centralized platform governance with decentralized institute operations.
It supports multi-tenancy, maintains data isolation, and enables scalable SaaS management.
Future Considerations
The platform should support
Delegated platform administration.
Tenant admin self-service onboarding.
Platform health monitoring.
Automated tenant provisioning.
Platform Admin → Institute
Purpose
The Platform Admin oversees all coaching institutes operating on the SaaS platform.
This relationship establishes platform-level visibility and governance over institutional operations.
Business Responsibilities
The Platform Admin is responsible for
Monitoring institute health and compliance.
Managing platform-wide configurations.
Supporting institute onboarding and offboarding.
Ensuring platform security and stability.
The Institute is responsible for
Operating within platform policies.
Maintaining subscription and licensing.
Reporting operational issues.
Following platform guidelines.
Business Rules
Every institute must be registered and approved by the Platform Admin.
Platform Admins may access institute-level data for support and governance.
Institutes cannot access other institutes' data.
Platform Admins should respect institute data privacy.
Relationship Nature
One Platform Admin
↓
Multiple Institutes
Example
Platform Admin
↓
Apex Coaching Academy
↓
XYZ Technical Exam Institute
↓
PQR Foundation
Business Impact
The Platform Admin → Institute relationship ensures centralized platform governance.
It supports multi-tenant operations, maintains security, and enables scalable SaaS growth.
Future Considerations
The platform should support
Automated institute provisioning.
Platform-wide analytics.
Cross-institute benchmarking (anonymized).
Franchise management.
Tenant Admin → Institute
Purpose
The Tenant Admin manages a specific coaching institute and owns all academic, operational, and administrative data within that institute.
This relationship establishes institute-level ownership and accountability.
Business Responsibilities
The Tenant Admin is responsible for
Managing institute operations.
Configuring institute settings.
Overseeing academic activities.
Monitoring staff and student performance.
Ensuring data integrity and security.
The Institute is responsible for
Providing operational context.
Maintaining academic standards.
Supporting user activities.
Preserving historical records.
Business Rules
Every institute must have at least one Tenant Admin.
A Tenant Admin may manage only one institute in the initial phase.
Tenant Admin actions should be auditable.
Institute data should remain isolated from other institutes.
Relationship Nature
One Institute
↓
One or More Tenant Admins
Example
Apex Coaching Academy
↓
Tenant Admin – Mr. Sharma (Primary)
↓
Tenant Admin – Mrs. Gupta (Secondary)
Business Impact
The Tenant Admin → Institute relationship ensures clear ownership and accountability.
It supports operational governance, enables audit trails, and maintains institutional integrity.
Future Considerations
The platform should support
Multiple tenant admins per institute.
Tenant admin role delegation.
Institute transfer workflows.
Admin activity auditing.
Tenant Admin → Tutor
Purpose
The Tenant Admin manages tutors who deliver academic instruction within the institute.
This relationship establishes faculty oversight and enables academic workforce management.
Business Responsibilities
The Tenant Admin is responsible for
Creating and managing tutor profiles.
Assigning tutors to courses, batches, and subjects.
Monitoring tutor performance.
Managing tutor workload and schedules.
The Tutor is responsible for
Delivering quality instruction.
Following institute policies.
Maintaining professional standards.
Reporting academic progress.
Business Rules
Every tutor must be created and managed by a Tenant Admin.
Tutors cannot access institute management functions.
Tutor assignments should be reviewed periodically.
Inactive tutors should be managed according to institute policy.
Relationship Nature
One Tenant Admin
↓
Multiple Tutors
Example
Mr. Sharma (Tenant Admin)
↓
Dr. Ramesh – Science
↓
Dr. Priya – Math
↓
Dr. Karthik – English
Business Impact
The Tenant Admin → Tutor relationship ensures organized faculty management.
It supports workload distribution, enables performance tracking, and maintains teaching quality.
Future Considerations
The platform should support
Tutor self-onboarding workflows.
Automated tutor assignment.
Performance-based tutor recommendations.
Substitute tutor management.
Tenant Admin → Student
Purpose
The Tenant Admin manages students who enroll in the institute's academic programs.
This relationship establishes student oversight and enables admission and academic lifecycle management.
Business Responsibilities
The Tenant Admin is responsible for
Managing student admissions and enrollments.
Organizing students into courses and batches.
Monitoring student performance and attendance.
Maintaining student records and documents.
The Student is responsible for
Following institute policies.
Participating in academic activities.
Maintaining regular attendance.
Respecting academic integrity.
Business Rules
Every student must be admitted and managed by a Tenant Admin.
Students cannot access institute management functions.
Student records should remain confidential.
Student transfers should follow institute policy.
Relationship Nature
One Tenant Admin
↓
Multiple Students
Example
Mr. Sharma (Tenant Admin)
↓
Student Arun
↓
Student Priya
↓
Student Karthik
Business Impact
The Tenant Admin → Student relationship ensures organized student lifecycle management.
It supports admissions, enables tracking, and maintains academic records.
Future Considerations
The platform should support
Bulk student import.
Automated admission workflows.
Student self-service portals.
Alumni management.
Tenant Admin → Parent
Purpose
The Tenant Admin manages parent associations and ensures effective communication between the institute and families.
This relationship establishes parent oversight and enables family engagement management.
Business Responsibilities
The Tenant Admin is responsible for
Creating and managing parent profiles.
Linking parents to students.
Monitoring parent portal usage.
Managing parent communication preferences.
The Parent is responsible for
Maintaining updated contact information.
Monitoring student progress.
Supporting institute communication.
Participating in meetings when invited.
Business Rules
Every parent must be associated with at least one student managed by the Tenant Admin.
Parents cannot access institute management functions.
Parent data should remain confidential.
Parent-student linking should be verified.
Relationship Nature
One Tenant Admin
↓
Multiple Parents
Example
Mr. Sharma (Tenant Admin)
↓
Father (Rajesh) – Linked to Arun
↓
Mother (Lakshmi) – Linked to Priya
↓
Guardian (Suresh) – Linked to Karthik
Business Impact
The Tenant Admin → Parent relationship ensures organized family engagement.
It supports communication, enables transparency, and maintains family records.
Future Considerations
The platform should support
Bulk parent import.
Automated parent linking.
Parent satisfaction tracking.
Multi-language communication.
Parent → Student
Purpose
Parents are linked to their children (Students) to monitor academic progress, attendance, and institute communications.
This relationship establishes family engagement and enables parental oversight within the platform.
Business Responsibilities
The Parent is responsible for
Monitoring student attendance and performance.
Reviewing test results and academic progress.
Receiving institute announcements.
Communicating with tutors and administration when required.
The Student is responsible for
Participating in academic activities.
Maintaining academic integrity.
Keeping parents informed about institute activities.
Business Rules
Every parent must be linked to at least one student.
A parent may be linked to multiple students.
A student may have multiple parents or guardians linked.
Parent-student linking should be verified by the institute.
Parents should only access their linked students' data.
Relationship Nature
One Parent
↓
One or More Students
Example
Father (Rajesh)
↓
Student Arun
↓
Student Priya
Business Impact
The Parent → Student relationship enables family engagement and academic transparency.
It supports parental involvement, enables progress monitoring, and strengthens institute-family communication.
Future Considerations
The platform should support
Automated parent linking during admission.
Parent-student unlink workflows.
Multi-parent support.
Parent communication preferences.
Tenant Admin → Role
Purpose
The Tenant Admin defines and manages roles within the institute to organize user responsibilities and access levels.
This relationship establishes role governance and enables structured permission management.
Business Responsibilities
The Tenant Admin is responsible for
Defining institute-specific roles.
Assigning roles to users.
Reviewing role effectiveness.
Maintaining role descriptions.
The Role is responsible for
Defining user responsibilities.
Supporting access organization.
Enabling permission grouping.
Maintaining operational clarity.
Business Rules
Every role must be defined or approved by a Tenant Admin.
Roles should reflect real institute responsibilities.
Default roles should not be modified without review.
Custom roles may be created based on institute needs.
Relationship Nature
One Tenant Admin
↓
Multiple Roles
Example
Mr. Sharma (Tenant Admin)
↓
Tenant Admin Role
↓
Tutor Role
↓
Student Role
↓
Parent Role
↓
Accountant Role (Custom)
Business Impact
The Tenant Admin → Role relationship ensures organized responsibility management.
It supports access control, enables scalability, and maintains operational clarity.
Future Considerations
The platform should support
Role templates.
Role cloning.
Role analytics.
Temporary role assignment.
Tenant Admin → Permission
Purpose
The Tenant Admin manages permissions that control access to institute features and data.
This relationship establishes fine-grained access governance and enables secure operations.
Business Responsibilities
The Tenant Admin is responsible for
Reviewing available permissions.
Assigning permissions to roles.
Monitoring permission usage.
Ensuring security compliance.
The Permission is responsible for
Controlling feature access.
Protecting sensitive data.
Supporting role-based security.
Enabling operational boundaries.
Business Rules
Every permission must be assignable only by authorized administrators.
Permissions should follow least-privilege principles.
Permission changes should be auditable.
Default permissions should not be weakened without review.
Relationship Nature
One Tenant Admin
↓
Multiple Permissions
Example
Mr. Sharma (Tenant Admin)
↓
Student Admission Permission
↓
Batch Creation Permission
↓
Result Publication Permission
↓
Report Generation Permission
Business Impact
The Tenant Admin → Permission relationship ensures secure, controlled access to institute operations.
It supports compliance, enables audit trails, and maintains data protection.
Future Considerations
The platform should support
Permission templates.
Permission analytics.
Dynamic permission assignment.
Time-bound permissions.
Role → Permission
Purpose
Roles are assigned one or more permissions that define what actions users can perform within the platform.
This relationship establishes the foundation of role-based access control.
Business Responsibilities
The Role is responsible for
Grouping related permissions.
Defining operational boundaries.
Supporting user classification.
The Permission is responsible for
Controlling specific feature access.
Protecting sensitive operations.
Enabling granular security.
Business Rules
Every role must have at least one permission.
A permission may be assigned to multiple roles.
Permission assignment should follow operational needs.
Changes to role permissions should be auditable.
Relationship Nature
One Role
↓
Multiple Permissions
Example
Tutor Role
↓
Conduct Live Class Permission
↓
Upload Study Material Permission
↓
Evaluate Papers Permission
↓
Mark Attendance Permission
Business Impact
The Role → Permission relationship enables structured, scalable access control.
It supports security, simplifies management, and maintains operational boundaries.
Future Considerations
The platform should support
Permission inheritance.
Dynamic permission assignment.
Permission conflict detection.
Role hierarchy.
Role → User
Purpose
Users are assigned roles that determine their responsibilities, access levels, and operational scope within the platform.
This relationship connects identity to function and enables personalized platform experiences.
Business Responsibilities
The Role is responsible for
Defining user capabilities.
Controlling access scope.
Supporting operational classification.
The User is responsible for
Performing actions within role boundaries.
Respecting access limitations.
Maintaining account security.
Business Rules
Every user must have at least one role.
A user may have multiple roles when required.
Role assignment should be reviewed periodically.
Users should not perform actions outside their assigned roles.
Relationship Nature
One User
↓
One or More Roles
Example
Dr. Ramesh
↓
Tutor Role
↓
Subject Coordinator Role (Custom)
Business Impact
The Role → User relationship enables personalized, secure platform access.
It supports accountability, simplifies management, and maintains operational clarity.
Future Considerations
The platform should support
Role assignment workflows.
Temporary role elevation.
Role-based dashboards.
Role analytics.
User → Institute
Purpose
Every user belongs to a specific institute and operates within that institute's context, data boundaries, and operational policies.
This relationship establishes tenant isolation and institutional ownership of all user activities.
Business Responsibilities
The User is responsible for
Following institute policies.
Respecting data boundaries.
Maintaining professional conduct.
Reporting issues appropriately.
The Institute is responsible for
Providing operational context.
Enforcing data isolation.
Supporting user activities.
Maintaining governance standards.
Business Rules
Every user must belong to exactly one institute.
Users cannot access data from other institutes.
Institute-specific settings should govern user experience.
User activities should be auditable within institute context.
Relationship Nature
One Institute
↓
Multiple Users
Example
Apex Coaching Academy
↓
Tenant Admin – Mr. Sharma
↓
Tutor – Dr. Ramesh
↓
Student – Arun
↓
Parent – Father Rajesh
Business Impact
The User → Institute relationship ensures tenant isolation and data privacy.
It supports multi-tenancy, enables governance, and maintains platform security.
Future Considerations
The platform should support
Multi-institute user association (future).
Institute transfer workflows.
Cross-institute collaboration (controlled).
User activity analytics.
User → Login Session
Purpose
Users maintain active login sessions when accessing the platform, enabling secure and traceable platform usage.
This relationship supports session management, security monitoring, and user activity tracking.
Business Responsibilities
The User is responsible for
Maintaining account security.
Logging out from shared devices.
Reporting suspicious activity.
The Login Session is responsible for
Authenticating user access.
Tracking session duration.
Supporting security monitoring.
Enabling activity logging.
Business Rules
Every active platform access must create a login session.
Sessions should expire after inactivity.
Multiple concurrent sessions may be allowed based on policy.
Suspicious sessions should trigger security alerts.
Relationship Nature
One User
↓
Multiple Login Sessions
Example
Dr. Ramesh
↓
Session 1 – Chrome Browser – Desktop
↓
Session 2 – Mobile App – Android
Business Impact
The User → Login Session relationship enables secure, traceable platform access.
It supports security, enables monitoring, and maintains accountability.
Future Considerations
The platform should support
Multi-factor authentication.
Session analytics.
Device management.
Remote session termination.
User → Activity Log
Purpose
User activities are recorded in activity logs to support auditing, accountability, and operational transparency.
This relationship ensures that significant actions remain traceable and reviewable.
Business Responsibilities
The User is responsible for
Performing authorized actions only.
Respecting platform policies.
Maintaining professional conduct.
The Activity Log is responsible for
Recording significant user actions.
Supporting audit and investigation.
Maintaining operational transparency.
Enabling accountability.
Business Rules
Significant user actions should be recorded automatically.
Activity logs should include user, action, time, and context.
Logs should remain immutable and tamper-proof.
Log access should be restricted to authorized administrators.
Relationship Nature
One User
↓
Multiple Activity Log Entries
Example
Mr. Sharma (Tenant Admin)
↓
Created New Batch – Morning Batch – 10:00 AM
↓
Assigned Tutor – Dr. Ramesh – 10:15 AM
↓
Published Announcement – Holiday Notice – 11:00 AM
Business Impact
The User → Activity Log relationship enables operational transparency and accountability.
It supports investigation, maintains trust, and ensures governance.
Future Considerations
The platform should support
Real-time activity monitoring.
Activity analytics.
Anomaly detection.
Compliance reporting.
User Relationship Summary
The User domain serves as the identity, access, and accountability backbone of the coaching institute platform.
Every relationship—from platform governance and institute ownership to role-based access, permission control, session management, and activity tracking—exists to ensure secure, scalable, and accountable platform operations.
The user relationships establish
Platform governance through Platform Admin → Tenant Admin.
Institute ownership through Tenant Admin → Institute.
Faculty management through Tenant Admin → Tutor.
Student lifecycle through Tenant Admin → Student.
Family engagement through Tenant Admin → Parent.
Parent oversight through Parent → Student.
Access organization through Tenant Admin → Role.
Security control through Tenant Admin → Permission.
Role capabilities through Role → Permission.
Identity function through Role → User.
Tenant isolation through User → Institute.
Session security through User → Login Session.
Operational transparency through User → Activity Log.
Overall User Relationship Flow
Platform Admin
↓
Tenant Admin
↓
Institute
│
├── Tutor
├── Student ←── Parent
│
└── User (Base Identity)
├── Role → Permission
├── Login Session
└── Activity Log
Cross-Domain Dependencies
The User domain depends on and supports multiple business domains.
Institute Management
User relationships support
Institute ownership.
Administrative governance.
Operational accountability.
Academic Management
User relationships support
Tutor assignment.
Student enrollment.
Faculty management.
Student Management
User relationships support
Student identity.
Parent linking.
Admission workflows.
Tutor Management
User relationships support
Faculty identity.
Role assignment.
Performance tracking.
Communication Management
User relationships support
User-specific notifications.
Role-based announcements.
Communication preferences.
Reporting & Analytics
User relationships support
User activity reports.
Session analytics.
Access audits.
System Management
User relationships support
Security policies.
Session management.
Activity logging.
Compliance monitoring.
Discussion Status
Completed
Platform Admin → Tenant Admin
Platform Admin → Institute
Tenant Admin → Institute
Tenant Admin → Tutor
Tenant Admin → Student
Tenant Admin → Parent
Parent → Student
Tenant Admin → Role
Tenant Admin → Permission
Role → Permission
Role → User
User → Institute
User → Login Session
User → Activity Log
Next Phase
The next relationship discovery document is
System Relationships
This document will define how System entities interact with
Institute
Subscription
License
Audit Log
System Configuration
Backup
Storage
Feature Flags
The System Relationships document will establish the complete platform infrastructure and operational governance ecosystem.
Document Completion Status
Completed
User Relationship Overview
Business Principles
Core User Relationships
User Workflow
Cross-Domain Dependencies
Relationship Summary
This completes the User Relationship Discovery phase and provides the business foundation required for Entity Relationship Design (ERD), Database Modeling, API Design, and Application Development.
