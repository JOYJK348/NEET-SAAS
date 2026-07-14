# Profile System — Education Core Platform

> **Status:** 🔒 FROZEN  
> **Date:** July 13, 2026  
> **Purpose:** Define the configuration layer that makes the same core platform work for any educational vertical without schema changes.  
> **Golden Rule:** Business-specific behavior belongs in configuration, not in the database schema.

---

## 1. Architecture Overview

```
Education Core Platform (Generic)
│
├── Auth
├── People (Person → User → Role)
├── Master (Institutes, Learning Groups, Curriculum)
├── Attendance
├── Learning Content
├── Assessments
├── Billing
├── Communication
├── AI Service
├── Platform (Settings, Feature Flags)
├── Calendar
├── Digital Resources
│
└── Profile System (Configuration Layer)
      │
      ├── NEET Coaching  ← V1
      ├── JEE Coaching
      ├── UPSC / TNPSC
      ├── School (K12)
      ├── College / University
      ├── Tuition Center
      ├── Language Institute
      ├── Music / Dance Academy
      ├── Corporate Training
      └── Competitive Exams (Banking, SSC, etc.)
```

**Key insight:** The platform has ONE codebase, ONE database schema, ONE backend. Everything that changes between verticals lives in the **Profile System** — a configuration layer with zero code changes.

---

## 2. Core Generic Naming Map

### 2.1 Module Naming (Database → Generic)

| Current (NEET-specific) | Generic (DB/API)       | Reason                                                               |
| ----------------------- | ---------------------- | -------------------------------------------------------------------- |
| Mock Test               | **Assessment**         | Covers MCQ, Subjective, Quiz, Assignment, Practice Test, Coding Test |
| Learning Materials      | **Learning Content**   | Covers PDF, Video, Audio, SCORM, Interactive, URL, AR/VR             |
| Batch                   | **Learning Group**     | Covers Batch, Class, Section, Cohort, Group                          |
| Tutor                   | **Instructor**         | Covers Tutor, Teacher, Faculty, Trainer, Coach, Mentor, Professor    |
| Student                 | **Learner**            | Covers Student, Employee, Resident, Trainee, Participant             |
| Parent                  | **Associated Contact** | Covers Parent, Guardian, Sponsor, Manager, Emergency Contact         |
| Subject                 | **Learning Unit**      | Covers Subject, Skill, Module, Rotation, Domain                      |
| Chapter                 | **Curriculum Node**    | Covers Chapter, Unit, Lesson, Module, Topic (configurable depth)     |
| Fee                     | **Billing**            | Covers Fee, Subscription, Membership, Tuition, Transport, Hostel     |
| Previous Papers         | **Digital Resource**   | Covers Paper, Notes, PDF, Video Course, Test Series, Bundle          |
| Attendance              | **Attendance**         | Status values configurable per profile                               |

### 2.2 Database Tables Stay Generic

```sql
-- ✅ CORRECT — generic table naming
assessments         → NOT mock_tests
learning_content    → NOT study_materials
learning_groups     → NOT batches
instructors         → NOT tutors
learners            → NOT students
associated_contacts → NOT parents
learning_units      → NOT subjects
curriculum_nodes    → NOT chapters
billing             → NOT fees
digital_resources   → NOT previous_papers
```

---

## 3. Profile Engine

### 3.1 Profile Registry

| Profile ID          | Name                   | V1 Status    |
| ------------------- | ---------------------- | ------------ |
| `neet-coaching`     | NEET Coaching Center   | ✅ V1 Target |
| `jee-coaching`      | JEE Coaching Center    | 🔜 Future    |
| `upsc-coaching`     | UPSC / TNPSC Academy   | 🔜 Future    |
| `school-k12`        | School (K-12)          | 🔜 Future    |
| `college`           | College / University   | 🔜 Future    |
| `tuition`           | Tuition Center         | 🔜 Future    |
| `language`          | Language Institute     | 🔜 Future    |
| `corporate`         | Corporate Training     | 🔜 Future    |
| `competitive-exams` | Banking / SSC / Others | 🔜 Future    |

### 3.2 Profile Configuration Schema

```json
{
  "profile_id": "neet-coaching",
  "display_name": "NEET Coaching",
  "ui_labels": {
    "learning_group": "Batch",
    "instructor": "Tutor",
    "learner": "Student",
    "associated_contact": "Parent",
    "learning_unit": "Subject",
    "curriculum_levels": ["Course", "Subject", "Chapter", "Topic"],
    "assessment": "Mock Test",
    "learning_content": "Study Material",
    "billing": "Fee",
    "digital_resource": "Previous Paper",
    "attendance_status": ["PRESENT", "ABSENT", "LATE", "EXCUSED"]
  },
  "enabled_modules": {
    "attendance": true,
    "learning_content": true,
    "live_classes": true,
    "assessments": true,
    "billing": true,
    "digital_resources": true,
    "ai_service": true,
    "parent_portal": true,
    "calendar": true,
    "communication": true,
    "analytics": true
  },
  "business_rules": {
    "assessment": {
      "default_correct_marks": 4,
      "default_negative_marks": 1,
      "default_unattempted_marks": 0,
      "allow_negative_scoring": false,
      "default_total_marks": 720,
      "default_duration_minutes": 180,
      "auto_evaluate_mcq": true,
      "leaderboard_enabled": true
    },
    "attendance": {
      "policy": "PER_SESSION",
      "allow_bulk_marking": true,
      "late_minutes_threshold": 15
    },
    "billing": {
      "allow_partial_payment": true,
      "auto_generate_receipt": true,
      "receipt_prefix": "RCP-",
      "default_late_fee_amount": 0,
      "late_fee_grace_days": 3
    }
  },
  "curriculum_hierarchy": [
    { "level": 1, "name": "Course", "mandatory": true },
    { "level": 2, "name": "Subject", "mandatory": true },
    { "level": 3, "name": "Chapter", "mandatory": true },
    { "level": 4, "name": "Topic", "mandatory": false }
  ]
}
```

---

## 4. UI Labels Configuration

### 4.1 How It Works

A `ui_labels` table or JSONB config maps generic DB names → profile-specific display names.

**No frontend code changes needed.** The frontend reads labels from the profile config and renders them dynamically.

### 4.2 Label Map Per Profile

| Generic (DB/API)   | NEET           | School    | Corporate       | UPSC        |
| ------------------ | -------------- | --------- | --------------- | ----------- |
| Learning Group     | Batch          | Class     | Cohort          | Batch       |
| Instructor         | Tutor          | Teacher   | Trainer         | Faculty     |
| Learner            | Student        | Student   | Employee        | Candidate   |
| Associated Contact | Parent         | Guardian  | Manager         | —           |
| Learning Unit      | Subject        | Subject   | Skill           | Subject     |
| Assessment         | Mock Test      | Exam      | Assessment      | Test Series |
| Learning Content   | Study Material | Textbook  | Course Material | Notes       |
| Billing            | Fees           | Fees      | Training Cost   | Fees        |
| Digital Resource   | Previous Paper | Worksheet | Resource        | PYQ         |
| Curriculum Node 1  | Course         | Class     | Program         | Course      |
| Curriculum Node 2  | Subject        | Subject   | Module          | Subject     |
| Curriculum Node 3  | Chapter        | Unit      | Session         | Chapter     |
| Curriculum Node 4  | Topic          | Lesson    | Topic           | Topic       |

### 4.3 Implementation

```sql
CREATE TABLE profile_ui_labels (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(50) NOT NULL,
    generic_key VARCHAR(100) NOT NULL,   -- e.g. "learning_group"
    display_label VARCHAR(100) NOT NULL, -- e.g. "Batch"
    language VARCHAR(10) DEFAULT 'en',
    UNIQUE(profile_id, generic_key, language)
);
```

---

## 5. Feature Packs (Enabled Modules Per Profile)

### 5.1 Module Availability Matrix

| Module               | NEET | School | Corporate | UPSC | College | Language |
| -------------------- | ---- | ------ | --------- | ---- | ------- | -------- |
| Attendance           | ✅   | ✅     | ✅        | ✅   | ✅      | ✅       |
| Learning Content     | ✅   | ✅     | ✅        | ✅   | ✅      | ✅       |
| Live Classes         | ✅   | ✅     | ✅        | ✅   | ✅      | ✅       |
| Assessments          | ✅   | ✅     | ✅        | ✅   | ✅      | ✅       |
| Billing              | ✅   | ✅     | ✅        | ✅   | ✅      | ✅       |
| Digital Resources    | ✅   | ✅     | ❌        | ✅   | ✅      | ✅       |
| AI Service           | ✅   | ⚠️     | ✅        | ✅   | ✅      | ✅       |
| Parent Portal        | ✅   | ✅     | ❌        | ❌   | ❌      | ❌       |
| Calendar             | ✅   | ✅     | ✅        | ✅   | ✅      | ✅       |
| Communication        | ✅   | ✅     | ✅        | ✅   | ✅      | ✅       |
| Analytics            | ✅   | ✅     | ✅        | ✅   | ✅      | ✅       |
| Certification        | ❌   | ✅     | ✅        | ❌   | ✅      | ❌       |
| Placement            | ❌   | ❌     | ❌        | ❌   | ✅      | ❌       |
| Hostel Management    | ❌   | ⚠️     | ❌        | ❌   | ✅      | ❌       |
| Transport Management | ❌   | ✅     | ❌        | ❌   | ❌      | ❌       |

### 5.2 Implementation

```sql
CREATE TABLE profile_feature_packs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(50) NOT NULL,
    module_key VARCHAR(100) NOT NULL,  -- e.g. "live_classes"
    is_enabled BOOLEAN NOT NULL DEFAULT false,
    UNIQUE(profile_id, module_key)
);
```

---

## 6. Curriculum Hierarchy Configuration

### 6.1 The Problem

Different verticals have different curriculum depths:

| Vertical           | Level 1       | Level 2  | Level 3 | Level 4  | Level 5 |
| ------------------ | ------------- | -------- | ------- | -------- | ------- |
| NEET Coaching      | Course        | Subject  | Chapter | Topic    | —       |
| School (K12)       | Grade/Class   | Subject  | Unit    | Lesson   | Topic   |
| Corporate          | Program       | Module   | Session | Topic    | —       |
| College            | Degree/Course | Semester | Subject | Unit     | Topic   |
| Language Institute | Level         | Module   | Unit    | Lesson   | —       |
| UPSC               | Course        | Subject  | Topic   | Subtopic | —       |

### 6.2 Solution: Configurable Curriculum Tree

Single table `curriculum_nodes` with configurable depth:

```sql
CREATE TABLE curriculum_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES institutes(id),
    profile_id VARCHAR(50) NOT NULL,
    parent_id UUID REFERENCES curriculum_nodes(id),  -- self-referencing tree
    level INTEGER NOT NULL,                           -- 1, 2, 3, 4, 5
    name VARCHAR(200) NOT NULL,
    code VARCHAR(50),
    sort_order INTEGER NOT NULL DEFAULT 0,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for tree traversal
CREATE INDEX idx_curriculum_nodes_tenant_parent
    ON curriculum_nodes(tenant_id, parent_id);
```

**How it works:**

- Profile defines how many levels and what each level is called
- The same table handles Course→Subject→Chapter→Topic for NEET
- AND handles Program→Module→Session→Topic for Corporate
- AND handles Grade→Subject→Unit→Lesson→Topic for School
- No schema changes. Only configuration changes.

### 6.3 Example Data

```sql
-- NEET profile
INSERT INTO curriculum_nodes VALUES
    (gen_random_uuid(), 'tenant-1', 'neet-coaching', NULL, 1, 'NEET 2026', 'NEET-26', 1),
    (gen_random_uuid(), 'tenant-1', 'neet-coaching', <course-id>, 2, 'Physics', 'PHY', 1),
    (gen_random_uuid(), 'tenant-1', 'neet-coaching', <physics-id>, 3, 'Mechanics', 'MECH', 1);

-- School profile (same table, different profile)
INSERT INTO curriculum_nodes VALUES
    (gen_random_uuid(), 'tenant-2', 'school-k12', NULL, 1, 'Class 10', 'C10', 1),
    (gen_random_uuid(), 'tenant-2', 'school-k12', <class10-id>, 2, 'Mathematics', 'MATH', 1),
    (gen_random_uuid(), 'tenant-2', 'school-k12', <math-id>, 3, 'Algebra', 'ALG', 1),
    (gen_random_uuid(), 'tenant-2', 'school-k12', <algebra-id>, 4, 'Linear Equations', 'LE', 1);
```

---

## 7. Attendance Status Configuration

### 7.1 Configurable Status per Profile

```sql
CREATE TABLE profile_attendance_statuses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(50) NOT NULL,
    status_code VARCHAR(50) NOT NULL,   -- e.g. "PRESENT", "ABSENT", "LATE"
    display_label VARCHAR(100) NOT NULL,
    is_present BOOLEAN NOT NULL,         -- counts as attended?
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(profile_id, status_code)
);
```

### 7.2 Examples

| Profile   | Statuses                                                                |
| --------- | ----------------------------------------------------------------------- |
| NEET      | PRESENT, ABSENT, LATE, EXCUSED                                          |
| School    | PRESENT, ABSENT, LATE, EXCUSED, HALF_DAY, HOLIDAY, MEDICAL, PERMISSION  |
| Corporate | PRESENT, ABSENT, LATE, WFH, HALF_DAY, ON_LEAVE, TRAINING, BUSINESS_TRIP |

---

## 8. Assessment Type Configuration

### 8.1 Configurable Assessment Types per Profile

```sql
CREATE TABLE profile_assessment_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(50) NOT NULL,
    type_code VARCHAR(50) NOT NULL,     -- e.g. "MCQ", "SUBJECTIVE", "QUIZ"
    display_label VARCHAR(100) NOT NULL,
    evaluation_method VARCHAR(50) NOT NULL, -- AUTO, MANUAL, HYBRID
    allow_negative_marking BOOLEAN DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(profile_id, type_code)
);
```

### 8.2 Examples

| Profile   | Assessment Types                                                              |
| --------- | ----------------------------------------------------------------------------- |
| NEET      | MCQ (auto), Subjective (manual), Assignment (manual), Practice Test (auto)    |
| School    | MCQ (auto), Subjective (manual), Quiz (auto), Project (manual), Oral (manual) |
| Corporate | Quiz (auto), Assessment (auto), Certification (auto), Project (manual)        |
| Language  | MCQ (auto), Speaking (manual), Listening (auto), Writing (manual)             |

---

## 9. Financial Engine Configuration

### 9.1 Configurable Billing Types per Profile

```sql
CREATE TABLE profile_billing_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(50) NOT NULL,
    type_code VARCHAR(50) NOT NULL,      -- e.g. "TUITION", "HOSTEL", "TRANSPORT"
    display_label VARCHAR(100) NOT NULL,
    is_recurring BOOLEAN DEFAULT false,
    is_refundable BOOLEAN DEFAULT false,
    is_mandatory BOOLEAN DEFAULT true,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(profile_id, type_code)
);
```

### 9.2 Examples

| Profile   | Billing Types                                                   |
| --------- | --------------------------------------------------------------- |
| NEET      | Tuition Fee, Library Fee, Lab Fee, Exam Fee, Miscellaneous      |
| School    | Tuition, Transport, Hostel, Library, Sports, Lab, Exam, Uniform |
| College   | Tuition, Hostel, Mess, Library, Lab, Sports, Exam, Placement    |
| Corporate | Training Cost, Certification Fee, Material Fee                  |

---

## 10. Digital Resource Type Configuration

### 10.1 Configurable Product Types per Profile

```sql
CREATE TABLE profile_digital_resource_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    profile_id VARCHAR(50) NOT NULL,
    type_code VARCHAR(50) NOT NULL,       -- e.g. "PREVIOUS_PAPER", "NOTES"
    display_label VARCHAR(100) NOT NULL,
    is_sellable BOOLEAN DEFAULT true,
    supports_preview BOOLEAN DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE(profile_id, type_code)
);
```

### 10.2 Examples

| Profile            | Resource Types                                                  |
| ------------------ | --------------------------------------------------------------- |
| NEET               | Previous Year Paper, Notes, Premium PDF, Workbook, Test Series  |
| School             | Worksheet, Practice Paper, Notes, Reference Book, Video Lesson  |
| Corporate          | Training Manual, Assessment Guide, Template, Reference Document |
| Language Institute | Workbook, Audio Lesson, Practice Test, Phrasebook               |

---

## 11. Profile Selection Flow

### 11.1 Platform Admin Onboards Tenant

```
Platform Admin
    ↓
Create Institute
    ├── Select Profile: [NEET Coaching | School | Corporate | ...]
    ├── Profile loads:
    │   ├── UI Labels (Batch/Tutor/Student)
    │   ├── Enabled Modules (attendance, exams, fees)
    │   ├── Business Rules (marking scheme, fee policies)
    │   ├── Curriculum Levels (Course→Subject→Chapter→Topic)
    │   └── Status Options (PRESENT/ABSENT/LATE)
    └── Tenant Created with Profile Configuration
        ↓
Tenant Admin Login
    └── Sees NEET-specific terminology everywhere
        (Batch, Tutor, Student, Mock Test, etc.)
```

### 11.2 Migration Path

```text
Day 1: NEET profile only. Hardcoded labels in UI.
Week 8: Profile system implemented. Labels read from config.
Month 6: Second profile (School or JEE) activated.
Month 12: Profile marketplace — tenants choose their vertical.
```

---

## 12. Profile System — Database Tables

| Table                            | Purpose                                                 |
| -------------------------------- | ------------------------------------------------------- |
| `profiles`                       | Profile registry (neet-coaching, school-k12, corporate) |
| `profile_ui_labels`              | Generic → display label mapping per profile             |
| `profile_feature_packs`          | Enabled modules per profile                             |
| `profile_business_rules`         | Business rules (JSONB) per profile                      |
| `profile_curriculum_levels`      | Curriculum hierarchy definition per profile             |
| `profile_attendance_statuses`    | Available attendance statuses per profile               |
| `profile_assessment_types`       | Assessment type definitions per profile                 |
| `profile_billing_types`          | Billing type definitions per profile                    |
| `profile_digital_resource_types` | Digital resource type definitions per profile           |
| `tenant_profile_config`          | Tenant-specific profile overrides                       |

---

## 13. Implementation Priority (V1)

| Item                                                    | V1      | V1.1 | V2  |
| ------------------------------------------------------- | ------- | ---- | --- |
| Generic DB naming (assessments, learning_content, etc.) | ✅ ASAP | —    | —   |
| UI Labels config                                        | —       | ✅   | —   |
| Profile registry                                        | —       | ✅   | —   |
| Feature packs                                           | —       | ✅   | —   |
| Curriculum tree (configurable levels)                   | —       | —    | ✅  |
| Business rules config                                   | —       | —    | ✅  |
| Multi-profile activation                                | —       | —    | ✅  |
| Profile marketplace                                     | —       | —    | ✅  |

**V1 Recommendation:** Use generic naming in DB and APIs from day 1. Hardcode NEET labels in frontend initially. Add the profile config engine in V1.1.

---

## 14. Summary: Generic vs NEET-Specific

| Concept                  | Generic (DB/API)    | NEET (Profile Config)              |
| ------------------------ | ------------------- | ---------------------------------- |
| Table: Learning Groups   | `learning_groups`   | Display as "Batch"                 |
| Table: Instructors       | `instructors`       | Display as "Tutor"                 |
| Table: Learners          | `learners`          | Display as "Student"               |
| Table: Assessments       | `assessments`       | Display as "Mock Test"             |
| Table: Learning Content  | `learning_content`  | Display as "Study Material"        |
| Table: Digital Resources | `digital_resources` | Display as "Previous Papers"       |
| Table: Billing           | `billing`           | Display as "Fees"                  |
| Curriculum               | Curriculum Tree     | Course → Subject → Chapter → Topic |
| Attendance Status        | Configurable        | PRESENT, ABSENT, LATE, EXCUSED     |
| Assessment Types         | Configurable        | MCQ (auto), Subjective (manual)    |
| Exam Rules               | Profile Config      | +4/-1 marking, 720 marks           |
| Enabled Modules          | Feature Packs       | Attendance, Exams, Fees, AI...     |

---

> **This document freezes the Profile System architecture.**  
> The platform is an **Education Core Platform** with NEET Coaching as its first profile.  
> All future verticals are configuration changes, not code changes.
