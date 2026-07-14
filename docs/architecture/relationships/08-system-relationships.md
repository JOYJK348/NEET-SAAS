System Relationships
Purpose
The System Relationships document defines how system entities interact with each other and with institutes, users, and platform operations within the Coaching Management Platform.
While Entity Discovery identifies individual system objects, this document focuses on understanding how system configuration, subscriptions, licenses, audit logs, backups, storage, and feature controls collaborate to ensure platform security, reliability, scalability, and operational governance.
The objective is to establish clear business relationships that support a secure, scalable, and well-governed SaaS platform without direct technical implementation details.
This document intentionally focuses on business relationships and responsibilities rather than technical implementation.
Objectives
Define all business relationships involving system entities.
Understand ownership and governance boundaries for platform operations.
Establish the complete system lifecycle within the platform.
Support future database relationship design.
Ensure business consistency across all system touchpoints.
Create a scalable system governance architecture.
Relationship Principles
The following principles should guide System Relationship Discovery.
System relationships should reflect real SaaS platform governance operations.
Every relationship must have a clear business purpose.
System access should be permission-based and role-appropriate.
Relationships should support future scalability.
Avoid implementation-specific decisions.
Focus on business operations rather than technical infrastructure.
System Relationship Overview
The System domain serves as the governance, security, and operational backbone of the coaching institute platform.
Every subscription, license, audit log, backup, storage quota, feature flag, and system configuration exists to ensure platform reliability, data protection, compliance, and business continuity.
The major system relationships include
System Configuration → Institute
Subscription → Institute
Subscription → License
License → Institute
License → Feature Flag
Permission ← Role
Login Session → User
System Notification → User
Audit Log → Institute
Audit Log → User
Activity Log → User
Activity Log → Institute
Backup → Institute
Storage → Institute
Storage monitors Study Material
Storage monitors Recorded Class
Feature Flag → Institute
System Configuration → Institute
Purpose
Every institute operates under specific system configurations that define operational parameters, security policies, and platform behavior.
This relationship ensures that each institute can customize its environment while remaining within platform governance boundaries.
Business Responsibilities
The System Configuration is responsible for
Defining institute-specific operational settings.
Enforcing platform policies.
Supporting customization within boundaries.
Maintaining configuration history.
The Institute is responsible for
Following system configuration guidelines.
Requesting configuration changes when required.
Maintaining operational compliance.
Respecting platform governance.
Business Rules
Every institute must have a valid system configuration.
Configuration changes should follow approval workflows.
Critical configurations should not be modified without review.
Configuration history should remain accessible for auditing.
Relationship Nature
One Institute
↓
One Active System Configuration
↓
Configuration History
Example
Apex Coaching Academy
↓
Active Configuration – Academic Year 2026-2027
↓
Previous Configuration – Academic Year 2025-2026
Business Impact
The System Configuration → Institute relationship ensures governed, customizable operations.
It supports compliance, enables customization, and maintains platform integrity.
Future Considerations
The platform should support
Configuration templates.
Configuration versioning.
Automated configuration validation.
Cross-institute configuration comparison.
Subscription → Institute
Purpose
Every institute operates under an active commercial subscription that defines service availability, billing period, and platform access.
This relationship establishes the commercial foundation for platform usage and business continuity.
Business Responsibilities
The Subscription is responsible for
Defining service duration and validity.
Controlling feature availability.
Supporting billing operations.
Managing renewal lifecycle.
The Institute is responsible for
Maintaining an active subscription.
Following subscription terms.
Renewing before expiry.
Monitoring subscription status.
Business Rules
Every institute must have one active subscription.
Subscription expiry may restrict platform access based on business policy.
Subscription history should remain permanently available.
Upgrades and renewals should preserve all business data.
Relationship Nature
One Institute
↓
One Active Subscription
↓
Subscription History
Example
Apex Coaching Academy
↓
Annual Plan – Active until December 2026
↓
Monthly Plan – Expired March 2026
Business Impact
The Subscription → Institute relationship ensures commercial governance and business continuity.
It supports billing, enables renewals, and maintains service availability.
Future Considerations
The platform should support
Multiple subscription tiers.
Trial periods.
Enterprise plans.
Automatic renewals.
Online payment integration.
Subscription → License
Purpose
Every subscription is associated with a license that defines the specific features, limits, and entitlements available to the institute.
This relationship separates commercial agreement from operational capabilities.
Business Responsibilities
The Subscription is responsible for
Defining commercial terms.
Managing billing and renewals.
Controlling service duration.
The License is responsible for
Defining feature availability.
Enforcing usage limits.
Supporting plan differentiation.
Maintaining entitlement records.
Business Rules
Every subscription must have one active license.
License changes should not affect historical data.
Feature access should follow license restrictions.
License history should remain accessible.
Relationship Nature
One Subscription
↓
One Active License
Example
Annual Plan Subscription
↓
Professional License
↓
Student Limit: 500
↓
Tutor Limit: 25
↓
Storage Limit: 100 GB
↓
Features: All Modules Enabled
Business Impact
The Subscription → License relationship enables flexible commercial packaging.
It supports tiered offerings, controls feature access, and maintains plan differentiation.
Future Considerations
The platform should support
Feature-based licensing.
Usage-based licensing.
Add-on modules.
Custom enterprise licenses.
License → Institute
Purpose
The license defines what capabilities and features an institute can access on the platform.
This relationship ensures that institutes receive only the services included in their subscribed plan.
Business Responsibilities
The License is responsible for
Controlling feature access.
Enforcing usage limits.
Supporting plan compliance.
Maintaining entitlement records.
The Institute is responsible for
Operating within license boundaries.
Monitoring usage against limits.
Upgrading when required.
Following licensing terms.
Business Rules
Every institute must have one active license.
License limits should be enforced automatically.
Usage approaching limits should trigger alerts.
License violations should follow institute policy.
Relationship Nature
One Institute
↓
One Active License
Example
Apex Coaching Academy
↓
Professional License
↓
Active Features: Academics, Mock Tests, Live Classes, Reports
↓
Inactive Features: AI Assistant, Advanced Analytics (Enterprise Only)
Business Impact
The License → Institute relationship ensures controlled, compliant platform usage.
It supports commercial differentiation, prevents misuse, and maintains fair access.
Future Considerations
The platform should support
License analytics.
Usage dashboards.
Automatic limit enforcement.
Grace period policies.
License → Feature Flag
Purpose
Feature flags control the availability of specific platform features based on license entitlements and operational decisions.
This relationship enables gradual feature rollouts, A/B testing, and plan-based feature control.
Business Responsibilities
The License is responsible for
Defining entitled features.
Supporting plan differentiation.
Enabling feature control.
The Feature Flag is responsible for
Controlling feature visibility.
Supporting gradual rollouts.
Enabling operational decisions.
Maintaining feature state.
Business Rules
Feature flags should align with license entitlements.
Feature flags may be toggled independently for operational reasons.
Feature flag changes should be auditable.
Historical feature flag states should remain accessible.
Relationship Nature
One License
↓
Multiple Feature Flags
Example
Professional License
↓
Live Classes Feature – Enabled
↓
OMR Upload Feature – Enabled
↓
AI Solve Feature – Disabled
↓
Advanced Analytics Feature – Disabled
Business Impact
The License → Feature Flag relationship enables flexible, controlled feature management.
It supports gradual rollouts, plan differentiation, and operational agility.
Future Considerations
The platform should support
A/B testing.
Gradual rollouts.
Feature analytics.
Customer-specific feature toggles.
Audit Log → Institute
Purpose
Audit logs record significant activities and changes within each institute to support compliance, transparency, and governance.
This relationship ensures that institutional operations remain traceable and accountable.
Business Responsibilities
The Audit Log is responsible for
Recording significant institute activities.
Supporting compliance verification.
Enabling operational transparency.
Maintaining immutable records.
The Institute is responsible for
Operating within governance standards.
Respecting audit findings.
Maintaining operational integrity.
Supporting compliance reviews.
Business Rules
Every institute must maintain a complete audit log.
Audit logs should record user, action, time, and context.
Audit logs should be immutable and tamper-proof.
Audit log access should be restricted to authorized administrators.
Relationship Nature
One Institute
↓
Multiple Audit Log Entries
Example
Apex Coaching Academy
↓
Batch Created – Morning Batch – Mr. Sharma – 10:00 AM
↓
Tutor Assigned – Dr. Ramesh – Mr. Sharma – 10:15 AM
↓
Student Admitted – Arun – Mr. Sharma – 11:00 AM
Business Impact
The Audit Log → Institute relationship ensures operational transparency and compliance.
It supports governance, enables investigation, and maintains institutional trust.
Future Considerations
The platform should support
Real-time audit monitoring.
Compliance dashboards.
Automated audit alerts.
Regulatory reporting.
Audit Log → User
Purpose
Audit logs record activities performed by individual users to support accountability, security monitoring, and operational investigation.
This relationship enables user-level activity tracking and responsibility assignment.
Business Responsibilities
The Audit Log is responsible for
Recording user-specific activities.
Supporting accountability.
Enabling security monitoring.
Maintaining activity history.
The User is responsible for
Performing authorized activities only.
Respecting platform policies.
Maintaining account security.
Reporting suspicious activity.
Business Rules
Every significant user action should be recorded in the audit log.
Audit entries should include user, action, time, and context.
Users should not be able to modify or delete audit records.
Audit log access should follow role-based permissions.
Relationship Nature
One User
↓
Multiple Audit Log Entries
Example
Mr. Sharma (Tenant Admin)
↓
Created Course – Regular Course – 9:00 AM
↓
Modified Batch – Morning Batch – 9:30 AM
↓
Published Result – Science Monthly Test – 10:00 AM
Business Impact
The Audit Log → User relationship ensures individual accountability and security.
It supports investigation, maintains trust, and enables responsible platform usage.
Future Considerations
The platform should support
User behavior analytics.
Anomaly detection.
Security alerts.
Activity dashboards.
Permission ← Role
Purpose
Permissions are assigned to Roles to define what actions users in each role can perform within the platform.
This relationship establishes the foundation of role-based access control within the System domain.
Business Responsibilities
The Permission is responsible for
Defining feature access rights.
Supporting role-based security.
Enabling granular access control.
The Role is responsible for
Grouping related permissions.
Defining operational boundaries.
Supporting user classification.
Business Rules
Every role must have at least one permission.
A permission may be assigned to multiple roles.
Permission assignment should follow least-privilege principles.
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
Business Impact
The Permission ← Role relationship enables structured, scalable access control within the platform.
It supports security, simplifies management, and maintains operational boundaries.
Future Considerations
The platform should support
Permission inheritance.
Dynamic permission assignment.
Permission conflict detection.
Role hierarchy.
Login Session → User
Purpose
Users establish authenticated sessions when accessing the platform, enabling secure, traceable interactions.
This relationship supports session management, security monitoring, and user activity tracking.
Business Responsibilities
The Login Session is responsible for
Managing user authentication.
Tracking session duration.
Supporting security monitoring.
Enabling activity logging.
The User is responsible for
Maintaining account security.
Logging out from shared devices.
Reporting suspicious activity.
Business Rules
Every user access must create a login session.
Users may have multiple concurrent sessions.
Sessions should expire after inactivity.
Suspicious sessions should trigger security alerts.
Relationship Nature
One User
↓
Multiple Login Sessions
Example
User Arun (Student)
↓
Session – Chrome Browser – Desktop – Logged in 9:00 AM
↓
Session – Mobile App – Android – Logged in 8:30 AM
Business Impact
The Login Session → User relationship enables secure, traceable platform access.
It supports security, enables monitoring, and maintains accountability.
Future Considerations
The platform should support
Multi-factor authentication.
Session analytics.
Device management.
Remote session termination.
System Notification → User
Purpose
Platform-level system notifications are delivered to Users based on their role and responsibilities.
Exactly like the Communication domain pattern — the recipient's role determines who receives which notifications.
Business Responsibilities
The System Notification is responsible for
Delivering platform operational alerts.
Supporting administrator awareness.
Enabling timely maintenance actions.
The User is responsible for
Reviewing system notifications.
Acting on operational alerts.
Maintaining platform awareness.
Business Rules
System notifications should reach authorized users based on role.
Critical alerts (security, maintenance) should notify all relevant administrators.
Notification history should remain accessible.
Delivery should follow user communication preferences.
Relationship Nature
One User
↓
Multiple System Notifications
Example
Tenant Admin (Mr. Sharma)
↓
Scheduled Maintenance Tonight at 2 AM
↓
Subscription Expiring in 7 Days
↓
Backup Completed Successfully
Business Impact
The System Notification → User relationship ensures timely operational awareness and platform reliability.
It supports proactive management, reduces surprises, and maintains business continuity.
Future Considerations
The platform should support
Multi-channel notifications.
Scheduled maintenance alerts.
Security alert escalation.
Notification preferences.
Activity Log → User
Purpose
Activity logs record routine user interactions with the platform to support usage analytics, troubleshooting, and user experience improvement.
This relationship enables understanding of how users engage with platform features.
Business Responsibilities
The Activity Log is responsible for
Recording user interactions.
Supporting usage analytics.
Enabling troubleshooting.
Improving user experience.
The User is responsible for
Engaging with platform features appropriately.
Reporting issues when encountered.
Maintaining normal usage patterns.
Business Rules
Routine user activities may be recorded for analytics.
Activity logs should respect user privacy boundaries.
Activity data should support platform improvement.
Log retention should follow institute policy.
Relationship Nature
One User
↓
Multiple Activity Log Entries
Example
Student Arun
↓
Accessed Study Material – Science Notes – 8:00 AM
↓
Joined Live Class – Science – 9:00 AM
↓
Submitted Assignment – Science Worksheet – 11:00 AM
Business Impact
The Activity Log → User relationship enables usage understanding and platform improvement.
It supports analytics, troubleshooting, and user experience optimization.
Future Considerations
The platform should support
Usage analytics.
Engagement scoring.
Feature adoption tracking.
Personalized recommendations.
Activity Log → Institute
Purpose
Activity logs aggregate user interactions at institute level to support operational analytics, feature usage understanding, and platform optimization.
This relationship enables institutional-level engagement analysis.
Business Responsibilities
The Activity Log is responsible for
Aggregating institute usage data.
Supporting operational analytics.
Enabling platform optimization.
Maintaining engagement records.
The Institute is responsible for
Encouraging platform adoption.
Monitoring usage patterns.
Supporting user engagement.
Acting on analytics insights.
Business Rules
Institute activity data should aggregate user interactions appropriately.
Analytics should support operational decisions.
Usage patterns should inform platform improvements.
Data privacy should be maintained in analytics.
Relationship Nature
One Institute
↓
Multiple Activity Log Entries
Example
Apex Coaching Academy
↓
Daily Active Users: 450
↓
Study Material Downloads: 1,200
↓
Live Class Sessions: 25
↓
Mock Test Attempts: 180
Business Impact
The Activity Log → Institute relationship enables operational understanding and improvement.
It supports adoption, identifies trends, and maintains engagement.
Future Considerations
The platform should support
Institute engagement dashboards.
Usage benchmarking.
Feature adoption analytics.
Operational insights.
Backup → Institute
Purpose
Backups protect institute data by creating recoverable copies of critical business information.
This relationship ensures business continuity and data protection for every institute.
Business Responsibilities
The Backup is responsible for
Creating recoverable data copies.
Supporting disaster recovery.
Maintaining backup history.
Enabling data restoration.
The Institute is responsible for
Ensuring backup coverage.
Monitoring backup status.
Supporting recovery testing.
Maintaining business continuity.
Business Rules
Every institute must have regular backups configured.
Backup frequency should follow institute policy.
Backup history should remain accessible.
Data restoration should be tested periodically.
Relationship Nature
One Institute
↓
Multiple Backups
Example
Apex Coaching Academy
↓
Daily Backup – July 1, 2026
↓
Daily Backup – July 2, 2026
↓
Weekly Backup – June 28, 2026
Business Impact
The Backup → Institute relationship ensures data protection and business continuity.
It supports recovery, maintains trust, and protects against data loss.
Future Considerations
The platform should support
Automated backups.
Point-in-time recovery.
Cross-region backup.
Backup analytics.
Disaster recovery testing.
Storage → Institute
Purpose
Storage quotas manage the amount of digital content an institute can store on the platform.
This relationship ensures fair resource allocation and cost control.
Business Responsibilities
The Storage is responsible for
Managing resource allocation.
Enforcing quota limits.
Supporting usage monitoring.
Maintaining storage records.
The Institute is responsible for
Monitoring storage usage.
Managing content efficiently.
Upgrading when required.
Following storage policies.
Business Rules
Every institute must have a defined storage quota.
Storage usage should be monitored continuously.
Approaching limits should trigger alerts.
Excess usage should follow institute policy.
Relationship Nature
One Institute
↓
One Storage Quota
↓
Usage History
Example
Apex Coaching Academy
↓
Storage Quota: 100 GB
↓
Used: 67 GB
↓
Available: 33 GB
Business Impact
The Storage → Institute relationship ensures fair resource management.
It supports cost control, enables planning, and maintains platform performance.
Future Considerations
The platform should support
Storage analytics.
Usage forecasting.
Automatic cleanup.
Tiered storage options.
Storage monitors Study Material
Purpose
Storage monitors the storage usage of Study Materials (documents, presentations, videos) — it does not own the content, only tracks consumption against institute quota.
Business Responsibilities
Storage is responsible for
Tracking study material storage usage.
Monitoring quota consumption.
Enabling resource visibility.
Study Material is responsible for
Efficient content creation.
Respecting storage guidelines.
Supporting resource optimization.
Business Rules
Study material uploads should respect storage quotas.
Large files should follow institute guidelines.
Unused materials may be archived to save storage.
Storage usage should be visible to administrators.
Relationship Nature
Storage monitors
↓
Multiple Study Materials
Example
67 GB Used Storage
↓
Science Notes – 150 MB
↓
Math PPTs – 320 MB
↓
English Videos – 2.1 GB
Business Impact
Storage monitoring enables resource-aware content management.
It supports cost control, enables planning, and maintains platform performance.
Future Considerations
The platform should support
Storage analytics per content type.
Automatic compression.
Archive policies.
Content lifecycle management.
Storage monitors Recorded Class
Purpose
Storage monitors the storage usage of Recorded Classes (video content) — it does not own the content, only tracks consumption against institute quota.
Business Responsibilities
Storage is responsible for
Tracking recorded class storage usage.
Monitoring video resource consumption.
Enabling quota visibility.
Recorded Class is responsible for
Efficient recording creation.
Respecting storage guidelines.
Supporting resource optimization.
Business Rules
Recorded classes should respect storage quotas.
Video quality should balance learning needs with storage usage.
Old recordings may be archived based on institute policy.
Storage usage should be visible to administrators.
Relationship Nature
Storage monitors
↓
Multiple Recorded Classes
Example
67 GB Used Storage
↓
Science Recorded Classes – 15 GB
↓
Math Recorded Classes – 12 GB
↓
English Recorded Classes – 18 GB
Business Impact
Storage monitoring enables resource-aware video management.
It supports cost control, enables planning, and maintains platform performance.
Future Considerations
The platform should support
Video compression.
Tiered storage.
Automatic archival.
Streaming optimization.
Feature Flag → Institute
Purpose
Feature flags control which platform features are available to each institute based on license, operational decisions, and rollout status.
This relationship enables controlled feature access and gradual rollouts.
Business Responsibilities
The Feature Flag is responsible for
Controlling feature availability.
Supporting gradual rollouts.
Enabling operational decisions.
Maintaining feature state.
The Institute is responsible for
Using available features appropriately.
Requesting feature access when required.
Following feature usage guidelines.
Business Rules
Feature flags should align with license entitlements.
Feature access may be toggled for operational reasons.
Feature flag changes should be auditable.
Institutes should be notified of feature changes.
Relationship Nature
One Institute
↓
Multiple Feature Flags
Example
Apex Coaching Academy
↓
Live Classes – Enabled
↓
OMR Upload – Enabled
↓
AI Solve – Disabled
↓
Advanced Analytics – Disabled
Business Impact
The Feature Flag → Institute relationship enables controlled, flexible feature management.
It supports rollouts, plan differentiation, and operational agility.
Future Considerations
The platform should support
Institute-specific feature requests.
Beta feature enrollment.
Feature usage analytics.
Automatic feature enablement.

System Relationship Summary
The System domain serves as the governance, security, commercial, and operational backbone of the coaching institute platform.
Every relationship—from institute configuration and subscription licensing to permission control, session management, system notifications, audit transparency, backup protection, storage monitoring, and feature control—exists to ensure platform reliability, data protection, compliance, and business continuity.
The system relationships establish
Operational governance through System Configuration → Institute.
Commercial foundation through Subscription → Institute.
Capability control through License → Institute and License → Feature Flag.
Access control through Permission ← Role.
Session security through Login Session → User.
Operational awareness through System Notification → User.
Compliance transparency through Audit Log → Institute and Audit Log → User.
Usage understanding through Activity Log → User and Activity Log → Institute.
Data protection through Backup → Institute.
Resource monitoring through Storage (monitors Study Material & Recorded Class).
Feature control through Feature Flag → Institute.
Overall System Relationship Flow
Platform
│
├── System Configuration → Institute
├── Subscription
│ ├── License
│ │ └── Feature Flag
│ └── Institute
├── Permission ← Role
├── Login Session → User
├── System Notification → User
├── Audit Log
│ ├── Institute
│ └── User
├── Activity Log
│ ├── User
│ └── Institute
├── Backup → Institute
└── Storage
├── Institute
├── monitors Study Material
└── monitors Recorded Class
Cross-Domain Dependencies
The System domain depends on and supports multiple business domains.
Institute Management
System relationships support
Configuration governance.
Subscription management.
License compliance.
Operational settings.
User Management
System relationships support
Audit accountability.
Activity tracking.
Session management.
Security monitoring.
Academic Management
System relationships support
Feature availability.
Configuration customization.
Operational governance.
Learning Management
System relationships support
Storage management.
Resource allocation.
Content lifecycle.
Assessment Management
System relationships support
Feature control.
Audit trails.
Configuration management.
Communication Management
System relationships support
Feature availability.
Audit logging.
Activity tracking.
Reporting & Analytics
System relationships support
Audit reporting.
Usage analytics.
Compliance dashboards.
Discussion Status
Completed
System Configuration → Institute
Subscription → Institute
Subscription → License
License → Institute
License → Feature Flag
Permission ← Role
Login Session → User
System Notification → User
Audit Log → Institute
Audit Log → User
Activity Log → User
Activity Log → Institute
Backup → Institute
Storage → Institute
Storage monitors Study Material
Storage monitors Recorded Class
Feature Flag → Institute
Next Phase
All Relationship Discovery documents are now complete.
The next phase is
Entity Relationship Design (ERD)
This phase will transform business relationships into visual entity relationship diagrams that serve as the foundation for Database Modeling, API Design, and Application Development.
The completed Relationship Discovery documents provide the business foundation for:
Institute Relationships
Academic Relationships
Student Relationships
Tutor Relationships
Learning Relationships
Assessment Relationships
Parent Relationships
Communication Relationships
Reporting Relationships
User Relationships
System Relationships
Document Completion Status
Completed
System Relationship Overview
Business Principles
Core System Relationships
System Workflow
Cross-Domain Dependencies
Relationship Summary
This completes the System Relationship Discovery phase and concludes the entire Relationship Discovery phase of the Coaching Management Platform architecture.
The business foundation is now ready for Entity Relationship Design (ERD), Database Modeling, API Design, and Application Development.
