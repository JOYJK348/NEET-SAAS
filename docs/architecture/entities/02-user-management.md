# User Management Domain

## Purpose

The User Management domain is responsible for identifying and managing all users who interact with the Coaching Management Platform.

Every user in the platform has a specific business responsibility, access level, and operational scope. This domain establishes the foundation for authentication, authorization, role-based access control, and user lifecycle management across the entire platform.

The primary objective of this domain is to ensure that every user can securely access only the features and information required to perform their responsibilities.

---

# Objectives

- Identify all platform users.
- Define business responsibilities for each user.
- Establish role-based access.
- Support secure authentication.
- Enable permission-based authorization.
- Maintain user lifecycle management.
- Support future scalability for additional user roles.

---

# Business Entities

The following business entities belong to the User Management domain.

---

## Platform Admin

### Purpose

Represents the platform owner responsible for managing the overall SaaS platform.

### Business Responsibilities

- Manage coaching institutes.
- Manage platform subscriptions.
- Monitor platform usage.
- Configure global platform settings.
- Manage platform-wide announcements.
- Monitor platform health.

---

## Tenant Admin

### Purpose

Represents the coaching institute owner or administrator responsible for managing day-to-day institute operations.

### Business Responsibilities

- Manage students.
- Manage parents.
- Manage tutors.
- Manage academic structure.
- Manage assessments.
- Manage learning resources.
- Review reports.
- Configure institute settings.

---

## Tutor

### Purpose

Represents faculty members responsible for delivering academic content and monitoring student learning.

### Business Responsibilities

- Conduct classes.
- Manage attendance.
- Upload study materials.
- Schedule live classes.
- Evaluate assessments.
- Publish results.
- Track student performance.
- Communicate with students.

---

## Student

### Purpose

Represents learners enrolled in coaching programs who participate in academic activities through the platform.

### Business Responsibilities

- Attend classes.
- Join live sessions.
- Access study materials.
- Participate in assessments.
- Track academic progress.
- View announcements.
- Monitor personal performance.

---

## Parent

### Purpose

Represents guardians responsible for monitoring and supporting student academic progress.

### Business Responsibilities

- Monitor attendance.
- Review test performance.
- Track academic progress.
- Receive institute announcements.
- Communicate with the institute when required.

---

## Role

### Purpose

Represents predefined categories of users within the platform.

A role determines the overall business responsibility of a user.

### Examples

- Platform Admin
- Tenant Admin
- Tutor
- Student
- Parent

---

## Permission

### Purpose

Represents the access rights assigned to a role for performing business operations within the platform.

Permissions ensure users can perform only the actions required for their responsibilities.

---

## User

### Purpose

Represents the base identity entity for every individual who interacts with the platform.

Every Platform Admin, Tenant Admin, Tutor, Student, and Parent is a User with a unique identity, authentication credentials, and profile information.

The User entity serves as the common foundation for all role-based access and personalized platform experiences.

### Business Responsibilities

- Maintain unique identity across the platform.
- Authenticate securely before accessing platform features.
- Manage personal profile information.
- Maintain account security.
- Support role-based access control.

---

## Login Session

### Purpose

Represents an active authenticated session established when a User accesses the platform.

Login Sessions enable secure, traceable platform usage and support session management, security monitoring, and user activity tracking.

### Business Responsibilities

- Authenticate user access.
- Track session duration and activity.
- Support security monitoring.
- Enable activity logging.
- Manage session expiration.

---

## Activity Log

### Purpose

Represents a recorded entry of significant actions performed by a User within the platform.

Activity Logs support auditing, accountability, operational transparency, and compliance monitoring.

### Business Responsibilities

- Record significant user actions automatically.
- Capture user, action, timestamp, and context.
- Maintain immutable audit trail.
- Support investigation and compliance reporting.
- Restrict log access to authorized administrators.

---

# User Lifecycle

Every user follows a common lifecycle within the platform.

User Creation

↓

Role Assignment

↓

Permission Assignment

↓

Account Activation

↓

Daily Platform Usage

↓

Profile Updates

↓

Account Deactivation (if required)

---

# Business Principles

- Every user must have a valid role.
- Every role should have predefined permissions.
- Users should access only authorized features.
- Business responsibilities should be clearly separated.
- User accounts should remain secure throughout their lifecycle.
- The platform should support future expansion of user roles without architectural changes.

---

# Current Scope

## Included

- Platform Admin
- Tenant Admin
- Tutor
- Student
- Parent
- Role
- Permission
- User
- Login Session
- Activity Log
- User Lifecycle

---

## Future Enhancements

- Multi-factor Authentication (MFA)
- Social Login
- Single Sign-On (SSO)
- Delegated Administration
- Temporary Role Assignment
- Advanced Permission Groups
- Device Management

---

# Discussion Status

## Completed

- User Identification
- Business Responsibilities
- User Roles
- Permission Concept
- User Lifecycle
- Business Principles

---

## Completed (Updated)

- Authentication Architecture → ✅ See [auth-architecture.md](../auth-architecture.md)
- Session Management → ✅ Defined — Login Session table + RT rotation (see auth-architecture.md)
- Account Security → ✅ Defined — bcrypt 12, 5-attempt lockout, 30 min lock

## Pending Discussion

- Authorization Model (Permission Matrix — granular permissions per role)
- Role Hierarchy (can a Tenant Admin elevate a Tutor temporarily?)
- Audit Logging (which actions get logged, log retention policy)