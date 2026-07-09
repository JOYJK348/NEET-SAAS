# Fee Management Relationships

## Purpose

The Fee Management Relationships document defines how fee entities interact with each other and with other business domains within the Coaching Management Platform.

While the Entity Discovery document identifies individual fee entities, this document focuses on the business relationships between those entities — how they collaborate to deliver a complete, end-to-end fee collection and tracking system.

This document intentionally focuses on business relationships and responsibilities rather than technical implementation.

---

# Objectives

- Define all relationships between fee management entities.
- Establish clear ownership of fee data.
- Define the complete fee lifecycle through relationships.
- Support future database schema design.
- Ensure financial data integrity across the platform.
- Maintain a complete audit trail for all financial transactions.

---

# Relationship Principles

- Every financial relationship must have a clear business justification.
- Fee data must be traceable from structure definition to payment receipt.
- No money movement should occur without a corresponding record.
- Every payment must produce a receipt — no exceptions.
- Discounts must be approved before application.
- Fee records must be immutable — history cannot be altered.
- Multi-tenant isolation applies to all fee data.

---

# Fee Relationship Overview

The major fee management relationships include:

- Course → Fee Structure
- Fee Structure → Fee Component
- Fee Structure → Installment Plan
- Student + Fee Structure → Student Fee Record
- Fee Discount → Student Fee Record
- Student Fee Record → Fee Installment
- Fee Installment → Payment
- Payment → Payment Receipt
- Student Fee Record → Fee Reminder
- Fee Installment → Fee Reminder

---

# Course → Fee Structure

## Purpose

A Fee Structure defines how much students are charged for a specific Course.

When the institute creates a new course (e.g., Regular Course), the Tenant Admin must define a Fee Structure for it before admitting students. Without a Fee Structure, the institute cannot bill students for the course.

---

## Business Responsibilities

### The Course is responsible for

- Providing academic context for the fee.
- Defining the target students for the fee.

### The Fee Structure is responsible for

- Defining the total fee amount.
- Listing the fee components.
- Providing available payment plan options.
- Having an effective-from date.
- Supporting revision for new academic years.

---

## Business Rules

- Every Course may have one active Fee Structure per academic year.
- A new Fee Structure can be created for a new academic year without affecting existing Student Fee Records.
- A Fee Structure cannot be deleted if students are already enrolled under it.
- Only the Tenant Admin can create or modify a Fee Structure.

---

## Relationship Nature

```text
One Course
    │
    ▼
One Active Fee Structure (per academic year)
```

### Example

```text
Regular Course
    │
    ▼
Fee Structure: ₹80,000/year
    ├── Admission Fee: ₹5,000
    ├── Tuition Fee: ₹65,000
    ├── Examination Fee: ₹5,000
    └── Material Fee: ₹5,000
```

---

## Business Impact

This relationship ensures that every course has a clearly defined pricing model before student admission begins. It separates the academic program (Course) from the financial model (Fee Structure), keeping both clean and independently manageable.

---

## Future Considerations

- Batch-specific fee overrides (e.g., weekend batch costs more).
- Sibling-enrollment fee adjustments at the course level.
- Multi-year fee planning.
- Fee revision notifications to enrolled students.

---

# Fee Structure → Fee Component

## Purpose

A Fee Structure is composed of multiple Fee Components — individual charges that together make up the total course fee.

Breaking the fee into components gives full transparency to students and parents about what they are paying for, and allows the institute to waive or modify individual components independently.

---

## Business Responsibilities

### The Fee Structure is responsible for

- Grouping all fee components under one course fee.
- Calculating the total fee from components.
- Maintaining component consistency.

### The Fee Component is responsible for

- Defining its name, purpose, and amount.
- Indicating if it is one-time or recurring.
- Indicating if it is refundable or non-refundable.

---

## Business Rules

- A Fee Structure must have at least one Fee Component.
- The sum of all Fee Components equals the total Fee Structure amount.
- Individual components can be waived at the Student Fee Record level.
- One-time components (e.g., Admission Fee) are not included in recurring installments.

---

## Relationship Nature

```text
One Fee Structure
    │
    ├──► Fee Component: Admission Fee (one-time, non-refundable)
    ├──► Fee Component: Tuition Fee (recurring)
    ├──► Fee Component: Examination Fee (recurring)
    └──► Fee Component: Material Fee (one-time)
```

---

## Business Impact

Component-level fee transparency builds trust with parents and simplifies partial waiver workflows. It also enables detailed financial reports (e.g., "Total Examination Fee collected this year").

---

# Fee Structure → Installment Plan

## Purpose

An Installment Plan defines the available payment schedules for a Fee Structure. When a student enrolls, the Tenant Admin (or student, in future self-service) selects one Installment Plan, which determines how the total fee is split across time.

---

## Business Responsibilities

### The Fee Structure is responsible for

- Offering one or more Installment Plans.
- Defining the default plan.

### The Installment Plan is responsible for

- Defining number of installments.
- Defining each installment's amount and due date.
- Defining any early-payment discounts.
- Defining any late-payment penalty rules.

---

## Business Rules

- A Fee Structure must have at least one Installment Plan.
- An Installment Plan, once selected for a student, should not change without explicit admin override.
- One-time payment plans may offer a discount vs. installment plans.
- Installment due dates must not fall on public holidays.

---

## Relationship Nature

```text
One Fee Structure
    │
    ├──► Plan A: One-Time Payment (full amount, 5% discount)
    ├──► Plan B: Two Installments (50% + 50%)
    └──► Plan C: Quarterly Installments (4 × 25%)
```

---

## Business Impact

Offering flexible payment plans improves student admission rates by accommodating different family financial situations — a key competitive advantage for coaching institutes.

---

# Student + Fee Structure → Student Fee Record

## Purpose

When a student is enrolled in a course, a Student Fee Record is automatically created. This record is the **financial identity of the student for that enrollment** — it captures the fee structure, applied discount, chosen installment plan, and all payment history.

---

## Business Responsibilities

### The Student is responsible for

- Providing their identity.
- Selecting (or accepting) an installment plan.
- Making payments on time.

### The Fee Structure is responsible for

- Providing the fee amount and components.
- Providing the available installment plans.

### The Student Fee Record is responsible for

- Recording net payable after discount.
- Tracking total paid amount.
- Tracking outstanding balance.
- Reflecting current payment status.
- Maintaining payment history.

---

## Business Rules

- One Student Fee Record is created per course enrollment.
- If a student is enrolled in multiple courses, they have one Student Fee Record per course.
- The Student Fee Record is created automatically upon enrollment.
- A Student Fee Record cannot be deleted — it can only be archived.
- Changes in Fee Structure after a Student Fee Record is created do not affect existing records.

---

## Relationship Nature

```text
Student (Arun) + Regular Course
    │
    ▼
Student Fee Record
    ├── Fee Structure: Regular Course (₹80,000)
    ├── Discount Applied: Merit Scholarship (-₹10,000)
    ├── Net Payable: ₹70,000
    ├── Total Paid: ₹35,000
    ├── Outstanding: ₹35,000
    └── Status: PARTIALLY_PAID
```

---

## Business Impact

The Student Fee Record is the central financial record for every student. Without it, there is no financial accountability, no receipt trail, and no way to know who owes what.

---

# Fee Discount → Student Fee Record

## Purpose

A Fee Discount reduces the net payable amount in a Student Fee Record. Discounts are defined at the institute level and applied selectively during or after enrollment.

---

## Business Responsibilities

### The Fee Discount is responsible for

- Defining discount type and value.
- Defining eligibility rules.
- Being approved before application.

### The Student Fee Record is responsible for

- Recording which discount was applied.
- Recalculating net payable after discount.
- Maintaining the discount audit trail.

---

## Business Rules

- Only one primary discount may be applied per Student Fee Record.
- A discount must be approved by the Tenant Admin before application.
- Once applied, the discount amount is locked — subsequent changes to the discount definition do not retroactively affect existing Student Fee Records.
- Discounts can only reduce the fee — they cannot result in a negative payable amount.

---

## Relationship Nature

```text
Fee Discount (Merit Scholarship: 10% off)
    │
    ▼
Applied to Student Fee Record (Arun - Regular Course)
    │
    ▼
Net Payable reduces from ₹80,000 → ₹72,000
```

---

## Business Impact

Discounts drive admissions for high-performing students (merit scholarship) and build loyalty with existing families (sibling discount). Tracking discounts separately from the Fee Structure keeps the financial model clean and auditable.

---

# Student Fee Record → Fee Installment

## Purpose

Based on the chosen Installment Plan, the Student Fee Record generates individual Fee Installments — each with a specific due date and amount.

Fee Installments are the operational unit of fee collection — every reminder, every payment, every overdue calculation is tied to a specific Fee Installment.

---

## Business Responsibilities

### The Student Fee Record is responsible for

- Generating the correct number of installments.
- Distributing the net payable correctly across installments.

### The Fee Installment is responsible for

- Maintaining its due date.
- Tracking amount paid vs. outstanding.
- Reflecting its current status.

---

## Business Rules

- The sum of all Fee Installment amounts must equal the Student Fee Record net payable.
- A Fee Installment status must be updated immediately after every payment.
- Overdue status is triggered automatically when due date passes without full payment.
- A Fee Installment cannot be deleted — only waived by admin override.

---

## Relationship Nature

```text
Student Fee Record (Arun - ₹72,000)
    │
    ├──► Installment 1: ₹36,000 — Due: 01-Jun-2027 — Status: PAID
    └──► Installment 2: ₹36,000 — Due: 01-Dec-2027 — Status: DUE
```

---

## Business Impact

Installment-level tracking enables the institute to know exactly which students have paid which installments, enabling targeted reminders and accurate outstanding reports.

---

# Fee Installment → Payment

## Purpose

A Payment records the actual receipt of money against a Fee Installment. A single installment may be paid in full or in partial payments.

---

## Business Responsibilities

### The Fee Installment is responsible for

- Tracking total amount paid.
- Tracking outstanding amount.
- Updating status after each payment.

### The Payment is responsible for

- Recording the exact amount received.
- Recording the payment mode and reference.
- Recording the date and who recorded the payment.
- Triggering receipt generation.

---

## Business Rules

- Every Payment must be linked to exactly one Fee Installment.
- Partial payments are allowed — each partial payment is a separate Payment record.
- A Payment cannot be deleted — only reversed via a Refund/Adjustment record.
- Payment must be recorded by an authorized user (Tenant Admin or designated staff).
- Cash payments must record the name of the staff who received them.

---

## Relationship Nature

```text
Fee Installment 1 (₹36,000 due)
    │
    ├──► Payment 1: ₹20,000 — Cash — 05-Jun-2027
    └──► Payment 2: ₹16,000 — UPI  — 10-Jun-2027
         → Installment Status: PAID ✅
```

---

## Business Impact

Supporting partial payments at the installment level is critical for coaching institutes that deal with families with variable cash flows. It eliminates the binary "paid / not paid" model and provides a granular financial view.

---

# Payment → Payment Receipt

## Purpose

Every Payment immediately generates an official Payment Receipt. The receipt is the legal acknowledgement that money was received.

---

## Business Responsibilities

### The Payment is responsible for

- Triggering receipt creation.
- Providing all payment details to the receipt.

### The Payment Receipt is responsible for

- Generating a unique, sequential receipt number.
- Recording all payment details immutably.
- Being available for print or digital sharing.
- Remaining permanently in the system.

---

## Business Rules

- Every Payment must produce exactly one Payment Receipt.
- Receipt numbers are unique within an institute and never reused.
- A Receipt cannot be edited after generation — errors require a reversal and a new receipt.
- Receipts must be accessible to the student, the parent, and the Tenant Admin.

---

## Relationship Nature

```text
Payment (₹20,000 — Cash — 05-Jun-2027)
    │
    ▼
Payment Receipt #INS-001-2027-00142
    ├── Student: Arun Kumar
    ├── Course: Regular Course
    ├── Amount: ₹20,000
    ├── Mode: Cash
    ├── Date: 05-Jun-2027
    └── Received by: Mr. Sharma (Tenant Admin)
```

---

## Business Impact

Providing digital receipts eliminates manual receipt books, reduces disputes, and builds parent trust. It also creates a complete, searchable financial audit trail.

---

# Fee Reminder Relationships

## Purpose

Fee Reminders are automated notifications sent to students and parents based on installment due dates and payment status. They reduce manual follow-up effort and improve on-time payment rates.

---

## Trigger Relationships

### Student Fee Record → Fee Reminder

Triggered when the overall fee status becomes `OVERDUE` or when the fee record has been `PENDING` for too long without any payment.

### Fee Installment → Fee Reminder

Triggered when:
- An installment due date is approaching (configurable: 7 days, 3 days, 1 day before).
- An installment becomes `OVERDUE`.
- A partial payment is received but balance remains.

---

## Business Rules

- Reminders must be sent to both the student and the linked parent(s).
- Duplicate reminders for the same event must be prevented.
- Reminder delivery status (sent / delivered / failed) must be tracked.
- Reminders cannot be sent after an installment is fully paid.
- The Tenant Admin can configure reminder timing (e.g., 7 days / 3 days / 1 day before due).
- Reminder channels: SMS, Email, WhatsApp (configurable per institute).

---

## Relationship Nature

```text
Fee Installment 2 (₹36,000 — Due: 01-Dec-2027)
    │
    ├──► Reminder 1: 7 days before due — "Installment due on 01-Dec"
    ├──► Reminder 2: 1 day before due — "Reminder: Pay tomorrow"
    └──► Reminder 3: 3 days after due — "OVERDUE: ₹36,000 pending"
```

---

## Business Impact

Automated reminders eliminate the need for manual phone calls, reduce awkward fee-follow-up conversations, and give the institute a professional, systematic approach to fee collection.

---

# Overall Fee Relationship Flow

```text
Course
    │
    ▼
Fee Structure ──────────► Fee Component (tuition, exam, material)
    │
    └──────────────────► Installment Plan (one-time / quarterly / monthly)

Fee Discount (merit / sibling / staff)

Student Enrolled
    │
    ▼
Student Fee Record ◄──── (Fee Structure + Student + optional Discount)
    │
    ▼
Fee Installments (1 per installment in chosen plan)
    │
    ├── Fee Reminder (upcoming / overdue)
    │
    ▼
Payment (partial or full, per installment)
    │
    ▼
Payment Receipt (unique numbered, immutable)
```

---

# Business Impact Summary

The Fee Management domain transforms the institute's financial operations from ad-hoc manual tracking (spreadsheets, receipt books, phone calls) into a structured, auditable, and scalable financial management system.

Key business impacts:
- **Revenue Visibility** — institute knows total expected revenue, collected revenue, and outstanding at any point in time.
- **Student Transparency** — students and parents always know what they owe and what they have paid.
- **Audit Trail** — every rupee received is traceable from structure → record → installment → payment → receipt.
- **Reduced Defaults** — automated reminders reduce late payments without manual effort.
- **Compliance** — immutable receipts and records support financial compliance and dispute resolution.

---

# Cross-Domain Dependencies

## Academic Domain

- Fee Structure is linked to Course.
- When a Course is created, a Fee Structure must be defined before student enrollment begins.

## Student Management Domain

- Student enrollment triggers Student Fee Record creation.
- Student fee status (OVERDUE, PAID) can affect enrollment status.

## Communication Domain

- Fee Reminders are delivered through the Communication domain's notification channels.
- Fee Receipt sharing uses communication channels (email, WhatsApp).

## Reporting & Analytics Domain

- Fee Collection Reports use Student Fee Record, Payment, and Receipt data.
- Outstanding Due Reports use Fee Installment status.
- Discount Analysis Reports use Fee Discount data.

---

# Discussion Status

## Completed

- Fee Relationship Overview
- Course → Fee Structure
- Fee Structure → Fee Component
- Fee Structure → Installment Plan
- Student + Fee Structure → Student Fee Record
- Fee Discount → Student Fee Record
- Student Fee Record → Fee Installment
- Fee Installment → Payment
- Payment → Payment Receipt
- Fee Reminder Relationships
- Overall Fee Relationship Flow
- Business Impact Summary
- Cross-Domain Dependencies

---

## Pending Discussion

- Online Payment Gateway Integration Relationships
- Penalty Calculation Relationship (Late Fee Installment → Penalty Record)
- Refund Workflow Relationships
- Scholarship Approval Workflow
- Fee Revision Mid-Year Relationships
- GST/Tax Component Relationships

---

This completes the Fee Management Relationship Discovery phase and provides the business foundation required for ERD Design, Database Modeling, API Design, and Application Development.
