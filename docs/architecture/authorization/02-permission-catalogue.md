# Permission Catalogue

This document defines the naming conventions, standard action rules, and the complete dictionary of permission tokens used to secure API endpoints, controller guards, and page actions.

---

## 1. Naming Conventions & Standard Actions

All system permission keys **MUST** follow a strict, lowercase dot-notation scheme:

$$\text{permission\_key} = \text{domain\_context} \cdot \text{entity} \cdot \text{action}$$

### 1.1 Action Dictionary
To ensure consistency across 100+ permissions, only the following standard action suffixes are allowed:

| Suffix | Business Purpose | REST Mapping |
|:---|:---|:---:|
| `view` | Retrieve a single record or query lists | GET |
| `create` | Create a brand new record | POST |
| `edit` | Update existing properties on a record | PUT, PATCH |
| `delete` | Hard delete or permanently remove a record | DELETE |
| `approve` | Approve a pending workflow step request | POST |
| `reject` | Reject a pending workflow step request | POST |
| `archive` | Soft-delete or archive active records | POST |
| `restore` | Restore an archived record back to active | POST |
| `export` | Bulk file download formats (CSV, PDF, XLSX) | POST |
| `import` | Bulk file uploads / ingestion mapping | POST |
| `assign` | Map relationships between entities (e.g. tutor to batch) | POST |
| `submit` | Submit content for review (Workflow engine input) | POST |
| `publish` | Direct bypass of review to make content visible | POST |
| `manage` | System administration level configuration overrides | ALL |

---

## 2. Master Permission Catalogue

Permissions are derived directly from the [Menu Master Registry](file:///d:/FreeLance/NEET_platform/docs/architecture/authorization/01-menu-master.md) and mapped to corresponding API domains.

### 2.1 Platform Configuration (`platform`)

| Permission Key | Description | Module | Action |
|:---|:---|:---|:---:|
| `platform.tenant.view` | View institute profile configuration settings | Platform | `view` |
| `platform.tenant.edit` | Update tenant details and settings | Platform | `edit` |
| `platform.branch.view` | View branch office profiles | Platform | `view` |
| `platform.branch.create` | Register a new branch configuration | Platform | `create` |
| `platform.branch.edit` | Edit branch properties | Platform | `edit` |
| `platform.branch.archive` | Soft-delete a branch configuration | Platform | `archive` |
| `platform.term.create` | Configure academic calendar years | Platform | `create` |
| `platform.term.edit` | Edit academic year properties | Platform | `edit` |

### 2.2 Admissions (`admissions`)

| Permission Key | Description | Module | Action |
|:---|:---|:---|:---:|
| `admissions.student.view` | View student details and directories | Admissions | `view` |
| `admissions.student.create` | Register student profiles | Admissions | `create` |
| `admissions.student.edit` | Update student profile data | Admissions | `edit` |
| `admissions.student.export` | Export student registrations to excel/pdf | Admissions | `export` |
| `admissions.document.view` | View student files in document vault | Admissions | `view` |
| `admissions.document.create` | Upload student document files | Admissions | `create` |
| `admissions.document.delete` | Delete uploaded student files | Admissions | `delete` |
| `admissions.parent.view` | View parent profiles and linking status | Admissions | `view` |
| `admissions.parent.create` | Create parent profiles | Admissions | `create` |
| `admissions.parent.assign` | Link parents to student profiles | Admissions | `assign` |

### 2.3 Academics (`academics`)

| Permission Key | Description | Module | Action |
|:---|:---|:---|:---:|
| `academics.curriculum.view` | View syllabus, courses, and subjects catalog | Academics | `view` |
| `academics.curriculum.create` | Create new courses or subjects | Academics | `create` |
| `academics.curriculum.edit` | Manage courses, subjects, and chapters configurations | Academics | `edit` |
| `academics.batch.view` | View academic batches and tutor mappings | Academics | `view` |
| `academics.batch.create` | Create new batches | Academics | `create` |
| `academics.batch.edit` | Edit batch properties | Academics | `edit` |
| `academics.batch.assign` | Assign tutors to batches | Academics | `assign` |
| `academics.schedule.view` | View calendar schedules and slot details | Academics | `view` |
| `academics.schedule.create` | Generate weekly timetable slots | Academics | `create` |
| `academics.schedule.edit` | Edit timetable slot timings | Academics | `edit` |
| `academics.schedule.approve` | Approve calendar timetable overrides | Academics | `approve` |

### 2.4 Attendance (`attendance`)

| Permission Key | Description | Module | Action |
|:---|:---|:---|:---:|
| `attendance.record.view` | View student daily/slot attendance records | Attendance | `view` |
| `attendance.record.create` | Mark active check-ins and session attendance | Attendance | `create` |
| `attendance.record.edit` | Manually override marked attendance sheets | Attendance | `edit` |

### 2.5 Learning & Content (`learning`)

| Permission Key | Description | Module | Action |
|:---|:---|:---|:---:|
| `learning.material.view` | View/Download study materials and resources | Learning | `view` |
| `learning.material.create` | Create study materials drafts | Learning | `create` |
| `learning.material.edit` | Update study materials properties | Learning | `edit` |
| `learning.material.submit` | Send study materials to review queue | Learning | `submit` |
| `learning.material.approve` | Approve study materials workflow request | Learning | `approve` |
| `learning.material.reject` | Reject study materials workflow request | Learning | `reject` |
| `learning.material.publish` | Instantly publish study materials without review | Learning | `publish` |
| `learning.material.archive` | Archive study materials | Learning | `archive` |
| `learning.video.view` | Stream lecture videos | Learning | `view` |
| `learning.video.create` | Upload recorded videos | Learning | `create` |
| `learning.video.edit` | Edit video parameters and metadata | Learning | `edit` |
| `learning.video.approve` | Approve uploaded video contents for students | Learning | `approve` |
| `learning.video.reject` | Reject uploaded video workflow request | Learning | `reject` |
| `learning.assignment.view` | View assignment briefs and grades | Learning | `view` |
| `learning.assignment.create` | Create new assignments | Learning | `create` |
| `learning.assignment.edit` | Edit assignment tasks | Learning | `edit` |
| `learning.assignment.submit` | Submit answers to assignments | Learning | `submit` |
| `learning.assignment.grade` | Evaluate and grade student assignments | Learning | `grade` |

### 2.6 Examinations (`exams`)

| Permission Key | Description | Module | Action |
|:---|:---|:---|:---:|
| `exams.question.view` | View items in question bank | Exams | `view` |
| `exams.question.create` | Add question bank items | Exams | `create` |
| `exams.question.edit` | Edit question details | Exams | `edit` |
| `exams.question.approve` | Approve questions for exam templates | Exams | `approve` |
| `exams.question.reject` | Reject draft questions from review | Exams | `reject` |
| `exams.test.view` | View mock test templates and test schedules | Exams | `view` |
| `exams.test.create` | Create test blueprints and configs | Exams | `create` |
| `exams.test.edit` | Edit exam properties | Exams | `edit` |
| `exams.test.submit` | Start a CBT test attempt | Exams | `submit` |
| `exams.test.approve` | Approve mock tests for student access | Exams | `approve` |
| `exams.score.view` | View gradesheets and evaluation reports | Exams | `view` |
| `exams.score.create` | Input manual mock exam scores | Exams | `create` |
| `exams.score.edit` | Edit gradesheets | Exams | `edit` |
| `exams.score.approve` | Finalize and publish results dashboard | Exams | `approve` |

### 2.7 Fees & Billing (`fees`)

| Permission Key | Description | Module | Action |
|:---|:---|:---|:---:|
| `fees.tariff.view` | View fee structures and billing packages | Fees | `view` |
| `fees.tariff.create` | Define course fee tariffs | Fees | `create` |
| `fees.tariff.edit` | Edit fee tariff details | Fees | `edit` |
| `fees.payment.view` | View user payment histories and receipt lists | Fees | `view` |
| `fees.payment.create` | Record manual fees collected | Fees | `create` |
| `fees.payment.edit` | Edit payment entries | Fees | `edit` |
| `fees.payment.waive` | Approve concessions, waivers, or close ledger dues | Fees | `waive` |

### 2.8 Communication (`communication`)

| Permission Key | Description | Module | Action |
|:---|:---|:---|:---:|
| `communication.notice.view` | Read bulletin notice board posts | Communication | `view` |
| `communication.notice.create` | Create and draft notice board items | Communication | `create` |
| `communication.notice.edit` | Edit notice drafts | Communication | `edit` |
| `communication.notice.approve` | Approve notices for broadcasting notifications | Communication | `approve` |

### 2.9 AI Assistant (`ai`)

| Permission Key | Description | Module | Action |
|:---|:---|:---|:---:|
| `ai.coach.chat` | Query the AI chatbot room | AI | `chat` |
| `ai.prompt.view` | View global AI coach configurations | AI | `view` |
| `ai.prompt.create` | Create new prompt configurations | AI | `create` |
| `ai.prompt.edit` | Configure model system prompts and settings | AI | `edit` |
| `ai.prompt.approve` | Approve prompt changes before staging | AI | `approve` |
