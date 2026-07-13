# Requirements

> **Status:** 🔒 FROZEN — See [V1 Scope Freeze](./v1-scope-freeze.md) for complete details.
> **Date:** July 13, 2026

## Platform Admin
- Login to platform
- Create new tenant (institute)
- Activate / Deactivate tenant
- Assign / Renew / Extend subscription
- View storage usage
- Basic platform dashboard

## Tenant Admin (Full Control — No Code Changes)
- Institute Profile, Branches, Academic Years
- Courses, Subjects, Chapters, Topics
- Students (Admission, Profile, Documents, Medical, Parents, Batch, Status)
- Tutors (Profile, Department, Subjects, Batch Assignment)
- Batches + Timetable
- Attendance (Mark, Reports, Leave)
- Learning Materials (Upload, Organize, R2 Storage)
- Live Classes (Schedule, Jitsi, Recording, Playback)
- Mock Tests (Create, Schedule, Auto-Eval, Publish)
- Manual Evaluation (Tutor → Admin → Publish)
- Previous Year Papers Store (Upload, Price, Sell)
- Fees (Structure, Payments, Receipts, Discounts)
- Notifications (Email, In-App, Auto-Reminders)
- AI (Doubt Solver, MCQ Explanation)
- Feature Flags (Enable/Disable any module)
- All Settings Configurable (No Developer Required)

## Tutor
- Dashboard with assigned batches
- Mark attendance
- Upload materials
- Schedule live classes
- Create mock tests
- Evaluate papers (submit for admin approval)
- View student progress

## Student
- Dashboard
- Learning materials
- Live classes + recordings
- Mock tests + results
- Attendance view
- Fee status
- Previous papers store (browse + purchase)
- AI Doubt Solver
- AI MCQ Explanation

## Parent
- Dashboard
- Child's attendance
- Child's test results
- Fee status
- Notifications
- Upcoming classes

## Common Features
- Google Calendar (one-way sync for live classes + tests)
- Multi-tenant isolation (RLS)
- JWT + Refresh Token Auth
- Cloudflare R2 storage

## Out of Scope (V2+)
- WhatsApp notifications
- OCR Evaluation
- AI Evaluation
- Workflow Engine
- Breakout Rooms / Polls / Whiteboard
- Advanced Analytics / Predictive Reports
- Gamification
- Adaptive Learning