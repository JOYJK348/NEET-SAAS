# Institute Relationships

## Purpose

The Institute Relationships document defines how the Institute entity interacts with other core business entities within the Coaching Management Platform.

Unlike Entity Discovery, which identifies business objects individually, this document focuses on understanding how those entities collaborate to support day-to-day institute operations.

The objective of Relationship Discovery is to establish a clear business foundation before moving into database design, API design, and application development.

This document intentionally focuses on business relationships rather than technical implementation.

---

# Objectives

- Understand how the Institute interacts with other business entities.
- Define ownership and responsibilities.
- Establish clear business boundaries.
- Support future database relationship design.
- Ensure business consistency across all modules.
- Reduce ambiguity during implementation.

---

# Relationship Principles

The following principles should be followed while defining business relationships.

- Every relationship should have a business purpose.
- Relationships should reflect real coaching institute operations.
- Avoid database-specific terminology.
- Focus on ownership rather than implementation.
- Keep relationships independent and reusable.
- Support future scalability.

---

# Relationship Overview

The Institute serves as the root business entity of the platform.

Every academic activity, operational process, user, and business resource belongs to a specific institute.

The Institute is responsible for owning, organizing, and governing all business operations performed within the coaching institute.

The major business relationships are

- Institute → Academic Year
- Institute → Course
- Institute → Student
- Institute → Tutor
- Institute → Branch
- Institute → Subscription
- Institute → License
- Institute → Holiday Calendar
- Institute → Announcement
- Institute → Reports

---

# Institute → Academic Year

## Purpose

Every coaching institute operates through one or more Academic Years.

An Academic Year represents the official operational period during which admissions, academic planning, teaching activities, assessments, attendance, reports, and learning activities are managed.

Rather than mixing data across different years, the institute separates operations using Academic Years.

This provides a clean academic timeline and preserves historical records.

---

## Business Responsibilities

The Institute is responsible for

- Creating Academic Years.
- Defining academic start and end dates.
- Activating the current Academic Year.
- Closing completed Academic Years.
- Maintaining historical academic records.
- Preparing future Academic Years.

The Academic Year is responsible for

- Organizing academic operations.
- Acting as the reference period for academic activities.
- Separating historical and active records.
- Supporting yearly reporting.

---

## Business Rules

- Every Academic Year must belong to one Institute.
- Every Institute should have at least one Academic Year.
- Only one Academic Year should remain Active at a time.
- Completed Academic Years should remain available for historical reference.
- Future Academic Years may be created before the current year ends.
- Academic Years should govern Courses, Batches, Students, Timetables, Attendance, Assessments, and Reports.

---

## Relationship Nature

One Institute

↓

Multiple Academic Years

Example

Apex Coaching Academy

↓

2025 – 2026

↓

2026 – 2027

↓

2027 – 2028

---

## Business Impact

Academic Year acts as the operational boundary for every educational activity performed inside the institute.

Without Academic Years, it becomes impossible to distinguish admissions, batches, attendance, examinations, and reports belonging to different sessions.

This relationship ensures historical accuracy and simplifies long-term academic management.

---

## Future Considerations

The platform should support

- Academic Year rollover.
- Academic Year archival.
- Academic Year cloning.
- Cross-year reporting.
- Multi-campus synchronization.
- AI-powered academic trend comparison.

---

# Institute → Course

## Purpose

Every coaching institute offers one or more academic courses.

Courses represent the primary educational programs provided by the institute, such as Regular, Foundation, or Crash Courses.

The Institute owns every course and is responsible for managing its complete lifecycle.

Courses cannot exist independently without belonging to an institute.

---

## Business Responsibilities

The Institute is responsible for

- Creating courses.
- Managing course availability.
- Defining course duration.
- Organizing course structure.
- Activating or retiring courses.
- Monitoring course performance.

The Course is responsible for

- Organizing academic programs.
- Supporting student enrollment.
- Organizing batches.
- Supporting assessments.
- Managing learning resources.

---

## Business Rules

- Every Course must belong to one Institute.
- An Institute may offer multiple Courses.
- Different Institutes may have courses with similar names while remaining completely independent.
- Courses should inherit institute-level academic policies.
- Inactive Courses should preserve historical student records.
- Courses should remain available for reporting even after completion.

---

## Relationship Nature

One Institute

↓

Multiple Courses

Example

Apex Coaching Academy

↓

Foundation Course

↓

Crash Course

↓

Crash Course

↓

Foundation Batch

---

## Business Impact

Courses represent the primary academic offerings of the institute.

Every Batch, Student Enrollment, Tutor Assignment, Mock Test, Study Material, and Timetable ultimately depends on a Course.

Without Courses, academic organization cannot exist.

---

## Future Considerations

The platform should support

- Franchise-specific courses.
- Branch-specific course availability.
- Online-only courses.
- Hybrid learning programs.
- AI-powered course recommendations.
- Cross-institute academic benchmarking.

---

# Discussion Status

## Completed

- Institute ownership.
- Academic Year relationship.
- Course relationship.
# Institute → Student

## Purpose

Students are the primary beneficiaries of the coaching institute's academic services.

Every student admitted into the platform must belong to a specific institute. The institute becomes responsible for managing the student's complete academic lifecycle, including admission, enrollment, batch allocation, attendance, assessments, learning resources, communication, and course completion.

A student cannot exist independently within the platform without being associated with an institute.

---

## Business Responsibilities

The Institute is responsible for

- Managing student admissions.
- Maintaining student records.
- Organizing students into appropriate courses and batches.
- Monitoring attendance and academic performance.
- Providing learning resources.
- Conducting assessments.
- Publishing results.
- Communicating with parents.
- Managing student lifecycle from enquiry to alumni.

The Student is responsible for

- Participating in academic activities.
- Attending scheduled classes.
- Completing assignments.
- Participating in assessments.
- Following institute policies.
- Maintaining academic progress.

---

## Business Rules

- Every Student must belong to one Institute.
- An Institute may manage multiple Students.
- Students cannot access resources belonging to another Institute.
- Student records should remain available even after course completion.
- Student admission should follow the institute admission workflow.
- Student transfers between institutes should be treated as separate admission processes unless future migration support is introduced.
- Every student should be associated with at least one Course and one Batch after admission.
- Every student should have one or more Parents or Guardians associated with the profile.

---

## Relationship Nature

One Institute

↓

Multiple Students

Example

Apex Coaching Academy

↓

Arun

↓

Priya

↓

Karthik

↓

Nisha

---

## Business Impact

Students represent the core operational entity of the coaching institute.

Most academic operations—including attendance, study materials, live classes, mock tests, assignments, evaluations, and reports—are ultimately performed for students.

Maintaining a clear ownership relationship between the institute and students ensures complete tenant isolation and accurate academic management.

---

## Future Considerations

The platform should support

- Student transfers between branches.
- Multi-course enrollment.
- Student archival.
- Alumni management.
- Student re-admission.
- AI-based academic recommendations.
- Cross-year academic history.

---

# Institute → Tutor

## Purpose

Tutors are responsible for delivering academic instruction and supporting student learning within the institute.

Every tutor belongs to a specific institute and performs academic responsibilities such as conducting classes, preparing study materials, creating assessments, evaluating answer sheets, monitoring student progress, and mentoring students.

Tutors cannot operate independently outside the institute that employs or assigns them.

---

## Business Responsibilities

The Institute is responsible for

- Managing tutor profiles.
- Assigning tutors to courses and batches.
- Monitoring teaching performance.
- Scheduling academic responsibilities.
- Managing tutor permissions.
- Evaluating faculty performance.

The Tutor is responsible for

- Conducting live classes.
- Preparing study materials.
- Creating assignments.
- Conducting mock tests.
- Evaluating answer sheets.
- Recording attendance.
- Monitoring student progress.
- Supporting academic mentoring.

---

## Business Rules

- Every Tutor must belong to one Institute.
- An Institute may manage multiple Tutors.
- Tutors should access only the academic resources assigned by the Institute.
- Tutors should conduct classes only for assigned Courses and Batches.
- Tutor performance should remain available for historical reporting.
- Inactive Tutors should preserve historical teaching records.
- Tutors should follow institute academic policies.

---

## Relationship Nature

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

History Faculty

---

## Business Impact

Tutors are responsible for delivering the institute's academic services.

Every learning activity—including teaching, assessments, evaluations, attendance, mentoring, and academic planning—depends on tutor participation.

This relationship ensures that academic ownership remains centralized within the institute while maintaining clear faculty responsibilities.

---

## Future Considerations

The platform should support

- Visiting Faculty.
- Guest Lecturers.
- Multi-branch Tutor Assignment.
- Online-only Tutors.
- Faculty Performance Analytics.
- AI-assisted workload balancing.
- Tutor certification management.

---

# Discussion Status

## Completed

- Institute → Academic Year
- Institute → Course
- Institute → Student
- Institute → Tutor


# Institute → Branch

## Purpose

An Institute may operate from one or more physical branches.

A Branch represents an operational location where academic activities such as admissions, classes, examinations, student support, and administrative operations are conducted.

Although the initial version of the platform may support only a single branch, the business model should remain flexible enough to accommodate future expansion into multiple branches.

---

## Business Responsibilities

The Institute is responsible for

- Creating branches.
- Managing branch information.
- Activating or deactivating branches.
- Monitoring branch operations.
- Maintaining branch-specific records.

The Branch is responsible for

- Conducting day-to-day academic operations.
- Managing local student admissions.
- Supporting classroom activities.
- Coordinating faculty and administrative staff.
- Maintaining branch-level operational records.

---

## Business Rules

- Every Branch must belong to one Institute.
- An Institute may operate multiple Branches.
- Branches should operate independently while following institute-wide policies.
- Historical branch records should remain available after closure.
- Branch-specific reporting should be supported.
- Students and Tutors may be assigned to specific branches.

---

## Relationship Nature

One Institute

↓

Multiple Branches

Example

Apex Coaching Academy

↓

Madurai Branch

↓

Chennai Branch

↓

Coimbatore Branch

---

## Business Impact

Branch management enables the institute to scale operations without changing the platform architecture.

It also enables branch-level reporting, admissions, tutor allocation, and operational monitoring.

---

## Future Considerations

The platform should support

- Multi-branch operations.
- Branch administrators.
- Branch-wise reporting.
- Branch-wise academic planning.
- Branch transfers.
- Centralized institute management.

---

# Institute → Subscription

## Purpose

Every Institute operates under an active business subscription.

The Subscription defines the commercial agreement between the coaching institute and the platform provider.

It determines service availability, billing period, subscription validity, and business plan.

---

## Business Responsibilities

The Institute is responsible for

- Maintaining an active subscription.
- Renewing subscriptions.
- Selecting subscription plans.
- Managing subscription lifecycle.

The Subscription is responsible for

- Defining service duration.
- Managing plan validity.
- Supporting billing operations.
- Controlling commercial access.

---

## Business Rules

- Every Institute must have one active Subscription.
- Subscription expiry may restrict platform access based on business policy.
- Subscription history should remain permanently available.
- Subscription upgrades and renewals should preserve business data.
- Subscription status should be visible to Tenant Administrators.

---

## Relationship Nature

One Institute

↓

One Active Subscription

↓

Subscription History

---

## Business Impact

Subscriptions represent the commercial relationship between the institute and the SaaS platform.

This relationship enables billing, renewals, business continuity, and future subscription upgrades.

---

## Future Considerations

The platform should support

- Monthly Plans.
- Annual Plans.
- Trial Periods.
- Enterprise Plans.
- Subscription Upgrades.
- Automatic Renewals.
- Online Payment Integration.

---

# Institute → License

## Purpose

A License represents the operational rights granted to an Institute for using the platform.

Unlike a Subscription, which represents the commercial agreement, the License controls the business capabilities available to the institute.

It determines which platform features can be accessed based on the subscribed plan.

---

## Business Responsibilities

The Institute is responsible for

- Maintaining a valid license.
- Following licensing terms.
- Monitoring feature availability.

The License is responsible for

- Controlling feature access.
- Enforcing business limits.
- Supporting commercial plans.
- Managing platform entitlements.

---

## Business Rules

- Every Institute should have one active License.
- License availability depends on the active Subscription.
- License changes should not affect historical business records.
- Feature access should follow license restrictions.
- License renewals should occur without data loss.

---

## Relationship Nature

One Institute

↓

One License

---

## Business Impact

Licensing enables the SaaS platform to provide different business plans while maintaining a single product architecture.

It also ensures that institutes receive only the features included in their subscribed plan.

---

## Future Considerations

The platform should support

- Feature-based licensing.
- Module-based licensing.
- User limit licensing.
- Student limit licensing.
- Storage-based licensing.
- Enterprise licensing.
- Custom business plans.

---

# Discussion Status

## Completed

- Institute → Academic Year
- Institute → Course
- Institute → Student
- Institute → Tutor
- Institute → Branch
- Institute → Subscription
- Institute → License

# Institute → Holiday Calendar

## Purpose

Every coaching institute operates according to an official Holiday Calendar.

The Holiday Calendar defines non-working days, public holidays, institute holidays, examination holidays, and other academic breaks throughout the Academic Year.

This relationship ensures that academic planning, class scheduling, attendance, examinations, and communication are aligned with the institute's official working calendar.

---

## Business Responsibilities

The Institute is responsible for

- Creating the Holiday Calendar.
- Declaring institute holidays.
- Managing working and non-working days.
- Publishing holiday notifications.
- Updating the calendar whenever required.

The Holiday Calendar is responsible for

- Maintaining holiday schedules.
- Supporting timetable planning.
- Preventing academic scheduling conflicts.
- Acting as the official academic calendar.

---

## Business Rules

- Every Holiday Calendar must belong to one Institute.
- An Institute may maintain different Holiday Calendars for different Academic Years.
- Holidays should be announced before the effective date whenever possible.
- Holiday changes should notify affected Students, Tutors, and Parents.
- Historical Holiday Calendars should remain available for reporting purposes.

---

## Relationship Nature

One Institute

↓

Multiple Holiday Calendars

↓

One Calendar per Academic Year

---

## Business Impact

The Holiday Calendar serves as the official operational calendar of the institute.

It directly influences academic planning, attendance, timetable generation, examinations, and communication.

Without a centralized Holiday Calendar, scheduling conflicts and operational inconsistencies may occur.

---

## Future Considerations

The platform should support

- Branch-specific holidays.
- Optional working Saturdays.
- Emergency holiday declarations.
- Calendar synchronization.
- Public holiday integration.
- Google Calendar integration.

---

# Institute → Announcement

## Purpose

The Institute communicates important operational and academic information through official announcements.

Announcements ensure that Students, Parents, Tutors, and Staff remain informed about institutional activities and important updates.

---

## Business Responsibilities

The Institute is responsible for

- Publishing announcements.
- Selecting target audiences.
- Scheduling announcements.
- Maintaining communication history.

The Announcement is responsible for

- Delivering official information.
- Supporting institute-wide communication.
- Maintaining announcement history.

---

## Business Rules

- Every Announcement must belong to one Institute.
- Announcements may target all users or selected user groups.
- Announcements should remain available until archived.
- Important announcements should be visible on user dashboards.
- Announcement history should be preserved.

---

## Relationship Nature

One Institute

↓

Multiple Announcements

---

## Business Impact

Announcements improve transparency and ensure that important academic and operational information reaches the appropriate users.

They reduce communication gaps and support smooth institute operations.

---

## Future Considerations

The platform should support

- Scheduled announcements.
- Rich media announcements.
- Read acknowledgements.
- Push notifications.
- WhatsApp integration.
- Email broadcasting.

---

# Institute → Reports

## Purpose

The Institute continuously monitors its academic and operational performance through reports.

Reports provide insights into admissions, attendance, assessments, tutor performance, student performance, finances, and overall institute growth.

---

## Business Responsibilities

The Institute is responsible for

- Generating reports.
- Reviewing institute performance.
- Monitoring KPIs.
- Supporting business decisions.
- Preserving historical reports.

The Reporting module is responsible for

- Collecting operational data.
- Generating business reports.
- Producing analytical insights.
- Supporting management dashboards.

---

## Business Rules

- Every Report belongs to one Institute.
- Reports should be generated using institute-specific data.
- Historical reports should remain accessible.
- Reports should be available only to authorized users.
- Reports should support multiple Academic Years.

---

## Relationship Nature

One Institute

↓

Multiple Reports

---

## Business Impact

Reports enable institute management to make informed academic and business decisions.

Without reporting, it becomes difficult to evaluate institute performance, monitor growth, identify operational issues, and plan future improvements.

---

## Future Considerations

The platform should support

- Executive Dashboards.
- AI-generated business insights.
- Scheduled report generation.
- Custom report builder.
- Branch-wise reporting.
- Comparative Academic Year analysis.

---

# Institute Relationship Summary

The Institute serves as the root business entity of the Coaching Management Platform.

Every major academic, operational, and administrative activity originates from and belongs to an Institute.

The Institute establishes ownership over Academic Years, Courses, Students, Tutors, Branches, Subscriptions, Licenses, Holiday Calendars, Announcements, and Reports.

This centralized ownership ensures business consistency, tenant isolation, operational governance, and future scalability.

---

# Overall Relationship Flow

Institute

↓

Academic Year

↓

Course

↓

Student

↓

Tutor

↓

Branch

↓

Subscription

↓

License

↓

Holiday Calendar

↓

Announcement

↓

Reports

---

# Discussion Status

## Completed

- Institute → Academic Year
- Institute → Course
- Institute → Student
- Institute → Tutor
- Institute → Branch
- Institute → Subscription
- Institute → License
- Institute → Holiday Calendar
- Institute → Announcement
- Institute → Reports

---

## Next Phase

The next relationship discovery document is

**Academic Relationships**

This document will define relationships between

- Course
- Batch
- Subject
- Chapter
- Timetable
- Live Class
- Recorded Class

These relationships establish the academic backbone of the platform before moving into Student and Tutor relationship discovery.