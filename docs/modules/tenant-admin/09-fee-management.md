# Fee Management

## Module Overview

The Fee Management module enables the Tenant Admin to define fee structures, collect student payments, issue receipts, track outstanding dues, and manage the complete financial lifecycle of the coaching institute.

This module is the financial backbone of the institute operations. Every student's fee obligation — from what they owe to what they have paid — is tracked here with full transparency and a complete audit trail.

The objective of this module is to replace manual fee tracking (spreadsheets, receipt books, phone registers) with a structured, automated, and accountable fee management system.

---

# Objectives

- Define course fee structures.
- Configure payment plans.
- Manage fee discounts and scholarships.
- Create and track student fee records.
- Record student payments.
- Generate official payment receipts.
- Monitor outstanding dues.
- Send automated fee reminders.
- Generate fee collection reports.
- Maintain complete financial audit trail.

---

# Responsibilities

The Tenant Admin is responsible for the complete fee management lifecycle.

Responsibilities include:

- Define and update Fee Structures per course.
- Define Fee Components for each structure.
- Create and manage Installment Plans.
- Define and approve Fee Discounts.
- Review and manage Student Fee Records.
- Record incoming payments.
- Issue and resend payment receipts.
- Monitor outstanding dues and overdue accounts.
- Configure fee reminder schedules.
- Review fee collection reports.

---

# Dashboard Widgets

The Fee Management dashboard provides the Tenant Admin with an instant financial snapshot.

## Summary Cards

- Total Fee Expected (current academic year)
- Total Fee Collected (current academic year)
- Total Outstanding Dues
- Total Overdue Amount
- Collections This Month
- Receipts Issued This Month

## Quick Actions

- Record Payment
- View Outstanding Dues
- View Overdue Students
- Generate Fee Report
- Issue Reminder

---

# Main Navigation

- Dashboard (Fee Summary)
- Fee Structures
- Fee Discounts
- Student Fee Records
- Payments
- Receipts
- Reminders
- Reports

---

# Fee Structure Management

The Tenant Admin defines the fee model for each course.

## Actions

- Create Fee Structure
- View Fee Structure
- Edit Fee Structure
- Deactivate Fee Structure (cannot delete if students enrolled)

## Fee Structure Details

- Course (which course this structure applies to)
- Academic Year
- Effective From Date
- Fee Components:
  - Component Name
  - Amount
  - Type (one-time / recurring)
  - Refundable (yes / no)
- Total Fee Amount (auto-calculated from components)
- Available Installment Plans

## Installment Plan Configuration

- Plan Name (e.g., "Quarterly", "One-Time")
- Number of Installments
- Installment Amounts and Due Dates
- Early Payment Discount (optional)
- Late Payment Penalty (optional)

## Business Rules

- A course must have a Fee Structure before students can be enrolled.
- A Fee Structure cannot be deleted once students are enrolled under it.
- Editing a Fee Structure does not affect existing Student Fee Records.
- A new Fee Structure must be created for each academic year if the fee changes.

---

# Fee Discount Management

The Tenant Admin defines available discounts and applies them to eligible students.

## Discount Types

- Merit Scholarship
- Sibling Discount
- Early Admission Discount
- Staff Ward Discount
- Special Circumstance Discount

## Actions

- Create Discount Definition
- Edit Discount Definition
- Deactivate Discount
- Apply Discount to Student Fee Record (requires admin approval)
- View All Applied Discounts

## Discount Configuration

- Discount Name
- Discount Type
- Discount Value (fixed amount or percentage)
- Maximum Applicable Amount
- Eligibility Description
- Requires Approval (yes/no)
- Approval Authority

## Business Rules

- Discounts must be approved by the Tenant Admin before application.
- Only one primary discount per Student Fee Record.
- Discount amount cannot exceed the total fee amount.
- Once applied and locked, discount changes do not affect existing records.

---

# Student Fee Records

The Tenant Admin monitors and manages individual student fee accounts.

## Student Fee Record is automatically created when a student is enrolled in a course.

## Actions

- View Student Fee Record
- Apply Discount
- Change Installment Plan (admin override with reason)
- Record Payment
- View Payment History
- Download Fee Summary

## Student Fee Record Details

- Student Name and ID
- Course Name
- Fee Structure Applied
- Discount Applied (if any)
- Total Fee Payable
- Net Payable After Discount
- Total Paid
- Outstanding Balance
- Payment Status
- Installment Schedule
- Payment History

## Filtering Options

- By Course
- By Batch
- By Status (Pending / Partially Paid / Paid / Overdue)
- By Academic Year

---

# Payment Recording

The Tenant Admin records all incoming fee payments.

## Payment Entry

- Select Student
- Select Fee Installment (which installment this payment is for)
- Payment Amount
- Payment Date
- Payment Mode (Cash / Bank Transfer / UPI / Cheque / DD)
- Transaction Reference Number
- Remarks (optional)

## After Recording

- Installment status is updated.
- Student Fee Record outstanding balance is updated.
- Payment Receipt is generated automatically.
- Receipt is available for print and digital share.

## Business Rules

- Partial payments are allowed — each partial payment is a separate entry.
- Cash payments must record the staff member who received it.
- Payment date cannot be a future date.
- A payment cannot be edited after recording — only reversed via a separate adjustment.

---

# Payment Receipts

Every recorded payment automatically generates an official Payment Receipt.

## Receipt Details

- Receipt Number (unique, sequential, institute-scoped)
- Student Name
- Course Name
- Payment Amount
- Fee Component Breakdown
- Payment Date
- Payment Mode
- Transaction Reference
- Received By (staff name)
- Institute Name and Logo
- Digital Signature / Stamp

## Actions

- View Receipt
- Download Receipt as PDF
- Email Receipt to Student/Parent
- Resend Receipt
- Print Receipt

## Business Rules

- Receipts are generated automatically on payment recording.
- Receipt numbers are never reused.
- Receipts are immutable — cannot be edited after generation.
- Errors require a reversal entry and a new receipt.

---

# Fee Reminders

The Tenant Admin configures automated reminders to be sent to students and parents.

## Reminder Configuration

- Days before due date (e.g., 7 days, 3 days, 1 day)
- Overdue reminders (e.g., 3 days after, 7 days after)
- Channels (SMS / Email / WhatsApp)
- Recipients (Student / Parent / Both)
- Reminder Message Template

## Reminder Lifecycle

```text
Installment Due: 01-Dec-2027

    ├──► 7 days before: "Dear Arun, your Regular Course fee installment
    │                   of ₹36,000 is due on 01-Dec-2027."
    │
    ├──► 1 day before:  "Reminder: Fee installment due tomorrow."
    │
    ├──► On due date:   "Today is the due date for your installment."
    │
    └──► 3 days after:  "OVERDUE: Your fee installment of ₹36,000
                        was due on 01-Dec-2027. Please pay immediately."
```

## Actions

- Configure Reminder Schedule
- View Sent Reminders
- View Delivery Status
- Send Manual Reminder

## Business Rules

- Reminders must stop once an installment is fully paid.
- Duplicate reminders for the same event are prevented.
- Reminder delivery status (sent / delivered / failed) is tracked.
- Manual reminders can be sent at any time by the Tenant Admin.

---

# Fee Reports

The Tenant Admin can generate comprehensive fee collection reports.

## Report Types

- Fee Collection Summary (by course / batch / date range)
- Outstanding Dues Report
- Overdue Student Report
- Discount Report (total discounts given)
- Payment Mode Summary (cash vs. UPI vs. bank transfer)
- Receipt Register
- Student-wise Fee Statement

## Filters

- By Course
- By Batch
- By Academic Year
- By Date Range
- By Payment Status
- By Payment Mode

## Export Options

- Download as PDF
- Download as Excel

---

# Fee Management Workflow

```text
Course Created
    │
    ▼
Define Fee Structure
    │
    ▼
Add Fee Components
    │
    ▼
Create Installment Plans
    │
    ▼
Define Discounts (optional)
    │
    ▼
Student Enrolled  ──► Student Fee Record Auto-Created
    │
    ├──► Apply Discount (if eligible)
    │
    ├──► Fee Installments Generated
    │
    ▼
Automated Reminders Scheduled
    │
    ▼
Tenant Admin Records Payment
    │
    ▼
Payment Receipt Auto-Generated
    │
    ▼
Installment + Record Status Updated
    │
    ▼
Fee Reports Available
```

---

# Business Rules

- A Fee Structure must exist before student enrollment for a course.
- Every student enrollment auto-creates a Student Fee Record.
- Every payment auto-generates a Payment Receipt.
- Receipts are numbered sequentially within the institute.
- No payment without a receipt — no exceptions.
- Fee records are immutable — reversals create new records, not edits.
- Discounts require Tenant Admin approval before application.
- Outstanding dues must be visible in real-time on the dashboard.
- Overdue students must be flagged prominently for follow-up.
- Fee data is isolated per institute — strict multi-tenant boundary.

---

# Permissions

The Tenant Admin can:

- Create and manage Fee Structures.
- Create and approve Fee Discounts.
- Record payments.
- View all Student Fee Records.
- Generate and download receipts.
- Configure reminder schedules.
- Generate all fee reports.

The Tenant Admin cannot:

- Edit or delete payment records (only reverse via adjustment).
- Edit issued receipts.
- Apply discounts beyond the defined maximum.
- Waive installments without documented reason.

---

# Discussion Status

## Completed

- Module Overview
- Objectives
- Responsibilities
- Dashboard
- Fee Structure Management
- Fee Discount Management
- Student Fee Records
- Payment Recording
- Payment Receipts
- Fee Reminders
- Fee Reports
- Fee Workflow
- Business Rules
- Permissions

---

## Pending Discussion

- Online Payment Gateway Integration
- Automatic Late Fee Penalty Calculation
- Scholarship Approval Workflow
- Fee Revision Workflow (mid-year changes)
- Parent Self-Service Fee Payment Portal
- GST / Tax Invoice Support
- Demand Letter / Legal Notice Templates
- Fee Defaulter Escalation Workflow
- Refund Processing Workflow

---

# Future Enhancements

- Online Payment Gateway (Razorpay / PayU / Stripe)
- Automated Penalty Calculation
- Scholarship Portal for Students
- Parent Self-Service Fee Payment
- GST-Compliant Invoice Generation
- AI-based Fee Default Prediction
- Fee Analytics Dashboard
- Multi-Year Fee Planning
- Fee Benchmarking across Courses
