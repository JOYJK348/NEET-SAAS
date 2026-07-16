# Role-Based Access Control (RBAC) Matrix

This document defines the default system roles, the mapping of permission scopes to these roles, and the strategy for creating custom tenant roles at runtime.

---

## 1. Default System Roles

The system contains five hardcoded **system roles** that cannot be deleted or renamed:

1.  **`SUPER_ADMIN`**: Global platform owner. Bypasses all permissions, RLS checks, and tenancy bounds. Handles billing defaults and tenant onboarding.
2.  **`TENANT_ADMIN`**: Single-tenant executive owner. Carries all permission permissions inside their specific `tenant_id` context. Can configure workflows and custom roles.
3.  **`FACULTY`**: Lecturers, coordinators, and teachers. Responsible for content drafting, attendance entry, slot scheduling, and marking.
4.  **`STUDENT`**: Enrolled candidates. Read-only learning catalog accesses, mock test attempts, and payments checkout.
5.  **`PARENT`**: Guardians. Read-only tracking of linked student performance, fees dues, and attendance logs.

---

## 2. Default Permission Mapping Matrix

| Permission Key                 | Student  |   Parent   | Faculty | Tenant Admin | Super Admin |
| :----------------------------- | :------: | :--------: | :-----: | :----------: | :---------: |
| `platform.tenant.*`            |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `platform.branch.*`            |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `platform.term.write`          |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `admissions.student.read`      |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `admissions.student.write`     |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `admissions.student.export`    |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `admissions.document.read`     | ✅ (Own) | ✅ (Child) |   ✅    |      ✅      |     ✅      |
| `admissions.document.write`    | ✅ (Own) |     ❌     |   ✅    |      ✅      |     ✅      |
| `admissions.document.delete`   | ✅ (Own) |     ❌     |   ❌    |      ✅      |     ✅      |
| `admissions.parent.*`          |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `academics.curriculum.read`    |    ✅    |     ✅     |   ✅    |      ✅      |     ✅      |
| `academics.curriculum.write`   |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `academics.batch.read`         |    ✅    |     ✅     |   ✅    |      ✅      |     ✅      |
| `academics.batch.write`        |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `academics.schedule.read`      |    ✅    |     ✅     |   ✅    |      ✅      |     ✅      |
| `academics.schedule.write`     |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `academics.schedule.override`  |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `attendance.record.read`       | ✅ (Own) | ✅ (Child) |   ✅    |      ✅      |     ✅      |
| `attendance.record.write`      |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `attendance.record.override`   |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `learning.material.read`       |    ✅    |     ✅     |   ✅    |      ✅      |     ✅      |
| `learning.material.write`      |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `learning.material.submit`     |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `learning.material.approve`    |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `learning.material.bypass`     |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `learning.material.delete`     |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `learning.video.read`          |    ✅    |     ✅     |   ✅    |      ✅      |     ✅      |
| `learning.video.write`         |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `learning.video.approve`       |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `learning.assignment.read`     | ✅ (Own) | ✅ (Child) |   ✅    |      ✅      |     ✅      |
| `learning.assignment.write`    |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `learning.assignment.submit`   | ✅ (Own) |     ❌     |   ❌    |      ✅      |     ✅      |
| `learning.assignment.grade`    |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `exams.question.read`          |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `exams.question.write`         |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `exams.question.approve`       |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `exams.test.read`              |    ✅    |     ❌     |   ✅    |      ✅      |     ✅      |
| `exams.test.write`             |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `exams.test.submit`            | ✅ (Own) |     ❌     |   ❌    |      ✅      |     ✅      |
| `exams.test.approve`           |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `exams.score.read`             | ✅ (Own) | ✅ (Child) |   ✅    |      ✅      |     ✅      |
| `exams.score.write`            |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `exams.score.approve`          |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `fees.tariff.*`                |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `fees.payment.read`            | ✅ (Own) | ✅ (Child) |   ❌    |      ✅      |     ✅      |
| `fees.payment.write`           |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `fees.payment.waive`           |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `communication.notice.read`    |    ✅    |     ✅     |   ✅    |      ✅      |     ✅      |
| `communication.notice.write`   |    ❌    |     ❌     |   ✅    |      ✅      |     ✅      |
| `communication.notice.approve` |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |
| `ai.coach.chat`                |    ✅    |     ❌     |   ✅    |      ✅      |     ✅      |
| `ai.prompt.*`                  |    ❌    |     ❌     |   ❌    |      ✅      |     ✅      |

---

## 3. Menu Visibility Matrix

Menu visibility maps 1-to-1 with the user's evaluated permissions. The sidebar must evaluate the user's active permissions against the [Menu Master Registry](file:///d:/FreeLance/NEET_platform/docs/architecture/authorization/01-menu-master.md):

| Target Menu ID       | Parent Menu ID       | Required Permission Code                   |
| :------------------- | :------------------- | :----------------------------------------- |
| `MENU-PLATFORM`      | `NULL`               | `platform.tenant.read`                     |
| `MENU-PLF-TEN`       | `MENU-PLATFORM`      | `platform.tenant.read`                     |
| `MENU-PLF-BRN`       | `MENU-PLATFORM`      | `platform.branch.read`                     |
| `MENU-PLF-ACY`       | `MENU-PLATFORM`      | `platform.term.write`                      |
| `MENU-ADMISSIONS`    | `NULL`               | `admissions.student.read`                  |
| `MENU-ADM-STU`       | `MENU-ADMISSIONS`    | `admissions.student.read`                  |
| `MENU-ADM-DOC`       | `MENU-ADMISSIONS`    | `admissions.document.read`                 |
| `MENU-ADM-PAR`       | `MENU-ADMISSIONS`    | `admissions.parent.read`                   |
| `MENU-ACADEMICS`     | `NULL`               | `academics.curriculum.read`                |
| `MENU-ACD-CUR`       | `MENU-ACADEMICS`     | `academics.curriculum.read`                |
| `MENU-ACD-BAT`       | `MENU-ACADEMICS`     | `academics.batch.read`                     |
| `MENU-ACD-SCH`       | `MENU-ACADEMICS`     | `academics.schedule.read`                  |
| `MENU-LEARNING`      | `NULL`               | `learning.material.read`                   |
| `MENU-LRN-MAT`       | `MENU-LEARNING`      | `learning.material.read`                   |
| `MENU-LRN-VID`       | `MENU-LEARNING`      | `learning.video.read`                      |
| `MENU-LRN-ASG`       | `MENU-LEARNING`      | `learning.assignment.read`                 |
| `MENU-EXAMS`         | `NULL`               | `exams.test.read` OR `exams.question.read` |
| `MENU-EXM-QB`        | `MENU-EXAMS`         | `exams.question.read`                      |
| `MENU-EXM-CBT`       | `MENU-EXAMS`         | `exams.test.read`                          |
| `MENU-EXM-SCO`       | `MENU-EXAMS`         | `exams.score.read`                         |
| `MENU-FEES`          | `NULL`               | `fees.payment.read` OR `fees.tariff.read`  |
| `MENU-FEE-STR`       | `MENU-FEES`          | `fees.tariff.read`                         |
| `MENU-FEE-PAY`       | `MENU-FEES`          | `fees.payment.read`                        |
| `MENU-COMMUNICATION` | `NULL`               | `communication.notice.read`                |
| `MENU-COM-ANN`       | `MENU-COMMUNICATION` | `communication.notice.read`                |
| `MENU-AI`            | `NULL`               | `ai.coach.chat`                            |
| `MENU-AIS-TUT`       | `MENU-AI`            | `ai.coach.chat`                            |
| `MENU-AIS-PRM`       | `MENU-AI`            | `ai.prompt.read`                           |

---

## 4. Runtime Custom Role Strategy

To allow tenants to configure dynamic structures, the application handles custom roles as purely **runtime data values**:

1.  **Creation**: When a Tenant Admin adds a role called "Physics HOD", a record is inserted into the `roles` table:
    - `id`: UUID
    - `tenant_id`: UUID
    - `name`: `"Physics HOD"`
    - `is_system`: `FALSE`
2.  **Assignment**: The UI checks box entries. This creates records inside the `role_permissions` join table mapping the dynamic role UUID to the static strings in the [Permission Catalogue](file:///d:/FreeLance/NEET_platform/docs/architecture/authorization/02-permission-catalogue.md):
    - `role_id` ➔ `"Physics HOD" UUID`
    - `permission_key` ➔ `"learning.material.approve"`
    - `permission_key` ➔ `"learning.video.write"`
3.  **No Code Modification**: If an API gateway receives a token, it resolves the permissions linked to the user's role keys. It never checks `role == 'Physics HOD'`. It only verifies `user_permissions.includes('learning.material.approve')`.
