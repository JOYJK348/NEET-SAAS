# Platform Admin

## Overview

The Platform Admin is the system owner responsible for managing the overall platform.

The Platform Admin does not manage day-to-day institute operations. Instead, this role is responsible for onboarding institutes, managing subscriptions, monitoring platform usage, configuring platform-wide settings, and maintaining overall system health.

## Objectives

- Manage coaching institutes (Tenants)
- Create and manage Tenant Admin accounts
- Manage subscriptions
- Configure platform settings
- Monitor platform health
- Manage platform security

## Responsibilities

- Create Institute
- Update Institute
- View Institute
- Activate Institute
- Suspend Institute
- Create Tenant Admin
- Reset Tenant Admin Password
- Enable / Disable Tenant Admin
- Assign Subscription
- Renew Subscription
- Upgrade Subscription
- Configure Platform Settings
- View Platform Statistics

## Permissions

Platform Admin can:
- Manage Institutes
- Manage Tenant Admins
- Manage Subscriptions
- Configure Platform
- View Platform Statistics
- View Activity Timeline

Platform Admin cannot:
- Conduct Live Classes
- Upload Study Materials
- Create Mock Tests
- Evaluate Student Papers
- Access Student Learning Progress

## Business Rules

- Institute Code must be unique.
- Institute cannot be permanently deleted.
- Soft delete only using Status.
- One institute must have at least one Tenant Admin.
- Subscription is mandatory before activation.
- Temporary password must be generated automatically.
- Tenant Admin must change password during first login.
- Welcome email is automatically sent after successful account creation.
- If email delivery fails, institute creation must not fail.
- Platform Admin can resend the welcome email at any time.

## Phase 1 Scope

**Included:**
- Manual Institute Creation
- Automatic Tenant Account Creation
- Automatic Welcome Email
- Institute Management
- Subscription Management
- Dashboard
- Platform Settings

**Not Included:**
- Self Registration
- Trial Management
- Custom Domains
- Multi-language
- Login as Tenant

## Future Enhancements

- Self Institute Registration
- Multiple Tenant Admins
- Audit Logs
- White Label Branding
- Custom Domains
- Advanced Analytics
- Login as Tenant
- Multi-language Support

## Documents

- [Navigation](01-navigation.md)
- [Dashboard](02-dashboard.md)
- [Institutes](03-institutes.md)
- [Subscriptions](04-subscriptions.md)
- [Settings](05-settings.md)
- [Workflow](06-workflow.md)
