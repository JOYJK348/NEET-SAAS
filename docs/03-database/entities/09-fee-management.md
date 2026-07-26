# Fee Management Domain

## Purpose

The Fee Management domain is responsible for defining, collecting, tracking, and reporting all financial transactions between the coaching institute and its students.

This domain manages fee structures, payment plans, student fee records, discounts, actual payments, receipts, and fee reminders. It ensures the institute can run as a financially accountable business while providing students and parents with transparent fee information.

The primary objective of this domain is to provide complete fee lifecycle management — from defining what a student owes, to tracking what has been paid, and following up on what remains outstanding.

---

# Objectives

- Define fee structures for courses.
- Support flexible payment plans (one-time, installment).
- Apply discounts and scholarships.
- Track individual student fee obligations.
- Record all payment transactions.
- Generate official payment receipts.
- Monitor outstanding dues.
- Send automated fee reminders.
- Support fee reporting and analytics.
- Maintain a complete financial audit trail.

---

# Business Entities

The following business entities belong to the Fee Management domain.

---

## Fee Structure

### Purpose

Represents the fee configuration for a course offered by the institute.

A Fee Structure defines the total fee amount, what the fee covers, and the available payment plan options. It is defined at the **Course level** and applies to all students enrolling in that course.

### Examples

- Regular Course Fee — ₹80,000 per year
- Crash Course Course Fee — ₹60,000 per year
- Crash Course Fee — ₹25,000 (one-time)
- Foundation Program Fee — ₹45,000 per year

### Business Responsibilities

- Define total course fee.
- Define fee components (tuition, admission, exam, material).
- Define available payment plan options.
- Apply from a specific effective date.
- Support revision when fees are updated for a new academic year.

### Ownership Rule

> ✅ **Fee Structure belongs to a Course.**
> All students enrolled in that course are billed according to the same Fee Structure,
> unless a specific discount is applied at the student level.

---

## Fee Component

### Purpose

Represents an individual charge that makes up the total fee for a course.

Breaking fees into components gives transparency to students and parents about what exactly they are paying for.

### Examples

- Admission Fee — ₹5,000 (one-time, non-refundable)
- Tuition Fee — ₹60,000 per year
- Examination Fee — ₹5,000 per year
- Study Material Fee — ₹8,000 per year
- Technology Fee — ₹2,000 per year

### Business Responsibilities

- Define the name and purpose of each fee component.
- Define the amount for each component.
- Mark components as refundable or non-refundable.
- Mark components as one-time or recurring.

---

## Installment Plan

### Purpose

Represents a payment schedule option that determines how a student can pay the total fee across time.

An Installment Plan is defined as part of the Fee Structure and gives students the flexibility to pay in a structured manner.

### Examples

- One-Time Payment (full amount upfront, with discount)
- Two Installments (50% at admission, 50% after 6 months)
- Quarterly Installments (4 equal payments every 3 months)
- Monthly Installments (12 equal payments)

### Business Responsibilities

- Define number of installments.
- Define due dates and amounts for each installment.
- Define any early-payment discount.
- Define late-payment penalty rules.

---

## Fee Discount

### Purpose

Represents a reduction applied to a student's total fee obligation based on merit, scholarship, sibling enrollment, or special circumstances.

Discounts are defined at the institute level and applied selectively to individual students.

### Types

- Merit Scholarship (based on entrance exam score/rank or academic performance)
- Sibling Discount (when a sibling is already enrolled)
- Early Admission Discount (for early enrollment)
- Staff Ward Discount (for children of institute staff)
- Scholarship Discount (institute-sponsored full or partial scholarship)
- Special Circumstance Discount (case-by-case approval)

### Business Responsibilities

- Define discount type and name.
- Define discount value (fixed amount or percentage).
- Define eligibility criteria.
- Require Tenant Admin approval before applying.
- Maintain a discount audit trail.

---

## Student Fee Record

### Purpose

Represents the complete fee obligation of a specific student for a specific course enrollment.

A Student Fee Record is automatically created when a student is enrolled in a course. It links the student to a Fee Structure and records all discounts, installments, payments, and outstanding amounts.

This is the **central entity** of the Fee Management domain — it is the single source of truth for what a student owes and what has been paid.

### Business Responsibilities

- Record total fee obligation for the student.
- Apply applicable discounts.
- Calculate net payable amount after discount.
- Track total amount paid.
- Track outstanding balance.
- Link to all installments and payments.
- Reflect current payment status.

### Status Values

- `PENDING` — Fee record created, no payment made yet.
- `PARTIALLY_PAID` — Some payments made, balance outstanding.
- `PAID` — Full amount received.
- `OVERDUE` — One or more installments past due date.
- `WAIVED` — Fee partially or fully waived by institute.
- `REFUNDED` — Fee partially or fully refunded.

---

## Fee Installment

### Purpose

Represents a single due payment within a student's fee repayment schedule.

Based on the chosen Installment Plan, the Student Fee Record is broken into multiple Fee Installments — each with a specific due date and amount.

### Business Responsibilities

- Define due amount for this installment.
- Define due date.
- Track payment against this installment.
- Track outstanding amount for this installment.
- Reflect installment-level payment status.

### Status Values

- `PENDING` — Not yet due.
- `DUE` — Due date reached, payment not yet received.
- `PARTIALLY_PAID` — Partial payment received.
- `PAID` — Full installment amount received.
- `OVERDUE` — Due date passed without full payment.
- `WAIVED` — Installment amount waived by institute.

---

## Payment

### Purpose

Represents an actual monetary transaction made by or on behalf of a student against a Fee Installment.

A Payment records when money was received, how much, through which channel, and who recorded it.

### Payment Modes

- Cash
- Bank Transfer (NEFT/RTGS/IMPS)
- UPI (GPay, PhonePe, Paytm)
- Cheque
- Demand Draft
- Online Payment Gateway (future)

### Business Responsibilities

- Record payment amount received.
- Record payment date and time.
- Record payment mode.
- Record transaction reference number.
- Link to the specific Fee Installment being paid.
- Trigger receipt generation.
- Update Student Fee Record outstanding balance.

---

## Payment Receipt

### Purpose

Represents an official, numbered acknowledgement issued to the student after a payment is recorded.

A Payment Receipt is the legal proof of payment and must be uniquely numbered and tamper-proof once issued.

### Business Responsibilities

- Generate a unique receipt number.
- Record all payment details (amount, date, mode, reference).
- Record fee components being paid.
- Be printable and shareable as PDF.
- Remain immutable once issued.
- Be accessible to the student and parent.

---

## Fee Reminder

### Purpose

Represents a scheduled or triggered notification sent to a student and/or parent about an upcoming or overdue fee installment.

Fee Reminders reduce manual follow-up effort and ensure timely payments.

### Trigger Points

- X days before installment due date (upcoming reminder).
- On the installment due date (due today reminder).
- X days after due date if unpaid (overdue reminder).
- On receiving partial payment (balance outstanding reminder).

### Business Responsibilities

- Record reminder type and trigger date.
- Record recipient (Student / Parent / Both).
- Record communication channel (SMS / Email / WhatsApp).
- Track delivery status.
- Prevent duplicate reminders for the same event.

---

# Fee Lifecycle

```text
Course Created
    │
    ▼
Define Fee Structure
    │
    ▼
Define Fee Components
    │
    ▼
Define Installment Plan
    │
    ▼
Define Fee Discounts (optional)
    │
    ▼
Student Enrolled in Course
    │
    ▼
Student Fee Record Created  ←── (auto-created on enrollment)
    │
    ├── Discount Applied (if applicable)
    │
    ├── Fee Installments Generated
    │
    ▼
Installment Due Date Approaches
    │
    ├── Fee Reminder Sent
    │
    ▼
Payment Recorded
    │
    ├── Payment Receipt Generated
    │
    ├── Installment Status Updated
    │
    ├── Student Fee Record Balance Updated
    │
    ▼
All Installments Paid → Status: PAID
    │
    OR
    │
Overdue → Reminder Escalation
```

---

# Business Principles

- Every Fee Structure belongs to one Course.
- Fee Structures are versioned — a new academic year may have a new structure without affecting existing student records.
- Every student enrolled in a course must have a Student Fee Record.
- A Student Fee Record is immutable once created — changes are recorded as adjustments, not overwrites.
- Every payment must generate a receipt. No payment without a receipt.
- Receipts are sequentially numbered and institute-scoped — each institute has its own receipt numbering series.
- Discounts must be approved by the Tenant Admin before application.
- Partial payments are allowed and must update the installment outstanding balance accurately.
- Fee data must be isolated per institute (multi-tenant).
- Historical fee records must never be deleted — only archived.
- A student's enrollment cannot be cancelled if an outstanding due exists without explicit admin override.
- Late payment penalties are configurable per Installment Plan.

---

# Current Scope

## Included

- Fee Structure
- Fee Component
- Installment Plan
- Fee Discount
- Student Fee Record
- Fee Installment
- Payment
- Payment Receipt
- Fee Reminder

---

## Future Enhancements

- Online Payment Gateway Integration (Razorpay / PayU / Stripe)
- Automated Penalty Calculation
- Demand Letter Generation
- Fee Defaulter Reports
- Scholarship Management Portal
- Parent Self-Service Fee Payment
- Fee Forecast Reports
- GST-compliant Invoice Generation
- Multi-currency Support
- Fee Refund Workflow

---

# Discussion Status

## Completed

- Domain Purpose
- Business Entities
- Fee Structure
- Fee Component
- Installment Plan
- Fee Discount
- Student Fee Record
- Fee Installment
- Payment
- Payment Receipt
- Fee Reminder
- Fee Lifecycle
- Business Principles
- Current Scope

---

## Pending Discussion

- Online Payment Gateway Configuration
- Penalty and Late Fee Calculation Rules
- Scholarship Approval Workflow
- Fee Revision Workflow (mid-year changes)
- Refund Policy and Workflow
- Fee Report Formats
- GST Applicability
- Demand Letter / Notice Templates
- Parent Self-Service Portal for Fee Payments
